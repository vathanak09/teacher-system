"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { photoFrameTemplateService } from '@/services/db';
import { AppIcon } from '@/components/AppIcons';
import {
  AspectRatioMode,
  DriveUploadConfig,
  FrameTemplate,
  OverlayLayer,
  canvasToBlob,
  loadImageCached,
  normalizeTemplateRecord,
  renderOverlaysOnlyToCanvas,
  resolveCanvasDimensions,
} from './frameModel';

interface SaveDesignAsFrameModalProps {
  isOpen: boolean;
  overlays: OverlayLayer[];
  overlayImages: Record<string, HTMLImageElement | undefined>;
  aspectMode: AspectRatioMode;
  primaryFrameImg: HTMLImageElement | null;
  activePhotoImg: HTMLImageElement | null;
  driveConfig: DriveUploadConfig | null;
  hasEnvDriveConfig: boolean;
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onOpenDriveSetup: () => void;
  onTemplateCreated?: (template: FrameTemplate) => void;
}

const FRAME_QUALITY_OPTIONS = [1, 2, 3, 4] as const;

export default function SaveDesignAsFrameModal({
  isOpen,
  overlays,
  overlayImages,
  aspectMode,
  primaryFrameImg,
  activePhotoImg,
  driveConfig,
  hasEnvDriveConfig,
  isAdmin,
  currentUserId,
  currentUserName,
  onClose,
  onOpenDriveSetup,
  onTemplateCreated,
}: SaveDesignAsFrameModalProps) {
  const [mounted, setMounted] = useState(false);
  const [frameName, setFrameName] = useState('');
  const [description, setDescription] = useState('');
  const [qualityMult, setQualityMult] = useState<number>(2);
  const [workingState, setWorkingState] = useState<'idle' | 'downloading' | 'uploading'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFrameName('');
    setDescription('');
    setQualityMult(2);
    setWorkingState('idle');
    setStatusMsg('');
    setErrorMsg('');
  }, [isOpen]);

  const visibleOverlays = useMemo(() => overlays.filter((o) => o.visible), [overlays]);

  const outputDims = useMemo(
    () =>
      resolveCanvasDimensions({
        aspectMode,
        primaryFrameImg,
        photoImg: activePhotoImg,
        qualityMultiplier: qualityMult,
      }),
    [aspectMode, primaryFrameImg, activePhotoImg, qualityMult]
  );

  const previewDims = useMemo(() => {
    const ratio = outputDims.width / Math.max(1, outputDims.height);
    const maxW = 320;
    const maxH = 220;
    let w = maxW;
    let h = Math.round(w / ratio);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
    return { width: Math.max(80, w), height: Math.max(80, h) };
  }, [outputDims.width, outputDims.height]);

  // Paint live transparent-only preview
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const drawW = Math.round(previewDims.width * dpr);
    const drawH = Math.round(previewDims.height * dpr);
    if (canvas.width !== drawW || canvas.height !== drawH) {
      canvas.width = drawW;
      canvas.height = drawH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderOverlaysOnlyToCanvas(ctx, drawW, drawH, visibleOverlays, overlayImages);
  }, [isOpen, mounted, previewDims.width, previewDims.height, visibleOverlays, overlayImages]);

  const isDriveConfigured = Boolean(driveConfig?.scriptUrl?.trim() || hasEnvDriveConfig);
  const canUploadToDrive = isAdmin || Boolean(driveConfig?.allowTeachersUpload);

  const renderTransparentFramePngBlob = async (): Promise<Blob> => {
    const imgMap: Record<string, HTMLImageElement | undefined> = { ...overlayImages };
    for (const layer of visibleOverlays) {
      if (!imgMap[layer.proxySrc] && layer.proxySrc) {
        imgMap[layer.proxySrc] = await loadImageCached(layer.proxySrc);
      }
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = outputDims.width;
    offscreen.height = outputDims.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) throw new Error('Browser មិនគាំទ្រ Canvas 2D');

    renderOverlaysOnlyToCanvas(ctx, outputDims.width, outputDims.height, visibleOverlays, imgMap);
    const blob = await canvasToBlob(offscreen, 'png');
    offscreen.width = 0;
    offscreen.height = 0;
    return blob;
  };

  const handleDownloadTransparentFrame = async () => {
    if (workingState !== 'idle' || visibleOverlays.length === 0) return;
    setErrorMsg('');
    setWorkingState('downloading');
    setStatusMsg('កំពុងបង្កើតស៊ុម PNG ថ្លា...');
    try {
      const blob = await renderTransparentFramePngBlob();
      const safeName = (frameName.trim() || `custom_frame_x${qualityMult}`).replace(/[\\/:*?"<>|]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatusMsg(`បានទាញយកស៊ុម PNG ថ្លា (${outputDims.width}×${outputDims.height}px) រួចរាល់!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'មិនអាចបង្កើតឯកសារ PNG ថ្លាបានទេ');
    } finally {
      setWorkingState('idle');
    }
  };

  const handleUploadToDriveAndSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workingState !== 'idle') return;
    setErrorMsg('');
    setStatusMsg('');

    const cleanName = frameName.trim();
    if (!cleanName) {
      setErrorMsg('សូមបញ្ចូលឈ្មោះ Frame Template ជាមុនសិន!');
      return;
    }
    if (visibleOverlays.length === 0) {
      setErrorMsg('មិនមាន Layer Frame ឬ Element ដែលកំពុងបង្ហាញទេ!');
      return;
    }
    if (!canUploadToDrive) {
      setErrorMsg('មានតែ Admin ប៉ុណ្ណោះដែលអាច Upload ផ្ទាល់ចូល Google Drive បាន (ឬ Admin អាចបើកសិទ្ធិនៅកំណត់ Google Drive)។');
      return;
    }
    if (!isDriveConfigured) {
      setErrorMsg('មិនទាន់បានកំណត់ Google Drive Apps Script URL ទេ!');
      return;
    }

    setWorkingState('uploading');
    try {
      setStatusMsg(`កំពុងបង្កើតស៊ុម PNG ថ្លា (${outputDims.width}×${outputDims.height}px)...`);
      const pngBlob = await renderTransparentFramePngBlob();

      const sizeMb = (pngBlob.size / (1024 * 1024)).toFixed(2);
      setStatusMsg(`កំពុង Upload ទៅ Google Drive (${sizeMb} MB)...`);

      const formData = new FormData();
      const safeFileName = `${cleanName.replace(/[\\/:*?"<>|]/g, '_')}_x${qualityMult}.png`;
      formData.append('file', pngBlob, safeFileName);
      formData.append('fileName', safeFileName);
      if (driveConfig?.scriptUrl) formData.append('scriptUrl', driveConfig.scriptUrl);
      if (driveConfig?.secretToken) formData.append('secretToken', driveConfig.secretToken);
      if (driveConfig?.folderId) formData.append('folderId', driveConfig.folderId);

      const res = await fetch('/api/upload-drive-frame', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.viewUrl) {
        throw new Error(data?.error || 'Upload ទៅ Google Drive មិនបានសម្រេច!');
      }

      setStatusMsg('កំពុងរក្សាទុកជា Template រួមក្នុងបណ្ណាល័យ...');
      const now = Date.now();
      const payload = {
        name: cleanName,
        description: description.trim(),
        category: 'frame' as const,
        imageUrl: data.viewUrl,
        defaultAspect: aspectMode === 'photo' ? ('auto' as const) : aspectMode,
        defaultScale: 1,
        defaultX: 0,
        defaultY: 0,
        createdById: currentUserId,
        createdByName: currentUserName,
        createdAt: now,
        updatedAt: now,
      };

      const createdId = await photoFrameTemplateService.add(payload);
      const saved = normalizeTemplateRecord({ ...payload, id: createdId });

      onTemplateCreated?.(saved);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'មានបញ្ហាក្នុងការ Upload ទៅ Google Drive');
    } finally {
      setWorkingState('idle');
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10060,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && workingState === 'idle') onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          padding: '1.3rem 1.4rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingBottom: '0.85rem',
            marginBottom: '0.95rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.14)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="layers" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                រក្សាទុក Design នេះជា Frame PNG ថ្លា
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                បញ្ចូល Layer ទាំង {visibleOverlays.length} ទៅជាស៊ុម PNG ថ្លាតែមួយ (មិនបញ្ចូលរូបថតគំរូឡើយ)
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={workingState !== 'idle'}
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleUploadToDriveAndSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Transparent-Only Preview */}
          <div
            className="photo-frame-checkerboard"
            style={{
              borderRadius: '14px',
              border: '1.5px dashed var(--border-color)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            <canvas
              ref={previewCanvasRef}
              style={{
                width: `${previewDims.width}px`,
                height: `${previewDims.height}px`,
                maxWidth: '100%',
                display: 'block',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ផ្ទៃថ្លា 100% (PNG Transparent) • ទំហំចេញ៖ {outputDims.width} × {outputDims.height} px
            </span>
          </div>

          {/* Frame Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.32rem', color: 'var(--text-primary)' }}>
              ឈ្មោះ Frame Template ថ្មី <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              placeholder="ឧ. ស៊ុមរូបថតសិស្សឆ្នើម ខែវិច្ឆិកា 2026"
              style={{ width: '100%' }}
            />
          </div>

          {/* Quality Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                គុណភាពស៊ុម PNG
              </span>
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {outputDims.width} × {outputDims.height} px
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.35rem' }}>
              {FRAME_QUALITY_OPTIONS.map((m) => {
                const active = qualityMult === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setQualityMult(m)}
                    style={{
                      padding: '0.42rem 0.25rem',
                      borderRadius: '9px',
                      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active ? 'var(--accent-primary)' : 'var(--main-bg)',
                      color: active ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    x{m} {m === 2 ? '(ណែនាំ)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
              កំណត់សម្គាល់ (ស្រេចចិត្ត)
            </label>
            <input
              type="text"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ឧ. ប្រើសម្រាប់រូបសកម្មភាពថ្នាក់រៀន..."
              style={{ width: '100%' }}
            />
          </div>

          {/* Drive Status Info Box */}
          {canUploadToDrive ? (
            !isDriveConfigured && (
              <div
                style={{
                  padding: '0.7rem 0.85rem',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#b45309',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>មិនទាន់បានភ្ជាប់ Google Drive Apps Script នៅឡើយទេ។</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDriveSetup();
                    }}
                    style={{
                      padding: '0.35rem 0.7rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#d97706',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    កំណត់ Google Drive ឥឡូវនេះ
                  </button>
                )}
              </div>
            )
          ) : (
            <div
              style={{
                padding: '0.68rem 0.82rem',
                borderRadius: '11px',
                background: 'var(--main-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.77rem',
                lineHeight: 1.45,
              }}
            >
              បច្ចុប្បន្ន Admin បានកំណត់ឱ្យមានតែ Admin ប៉ុណ្ណោះដែល Upload ផ្ទាល់ចូល Google Drive របស់សាលា។ អ្នកអាចចុច <strong>ទាញយកតែស៊ុម PNG ថ្លា</strong> ខាងក្រោម រួច Upload ចូល Drive ផ្ទាល់ខ្លួនរបស់អ្នកបាន!
            </div>
          )}

          {statusMsg && !errorMsg && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--main-bg))',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 26%, transparent)',
                color: 'var(--accent-primary)',
                fontSize: '0.79rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AppIcon name={workingState !== 'idle' ? 'refresh-cw' : 'check-circle'} size={15} />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.79rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AppIcon name="alert-triangle" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.2rem' }}>
            {canUploadToDrive && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={workingState !== 'idle' || !isDriveConfigured || visibleOverlays.length === 0}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.48rem',
                  padding: '0.7rem 1rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  opacity: !isDriveConfigured || visibleOverlays.length === 0 ? 0.55 : 1,
                }}
              >
                <AppIcon name={workingState === 'uploading' ? 'refresh-cw' : 'upload'} size={16} />
                {workingState === 'uploading'
                  ? 'កំពុង Upload ទៅ Google Drive...'
                  : 'Upload ទៅ Google Drive & បង្កើតជា Template'}
              </button>
            )}

            <button
              type="button"
              disabled={workingState !== 'idle' || visibleOverlays.length === 0}
              onClick={handleDownloadTransparentFrame}
              style={{
                width: '100%',
                padding: '0.62rem 0.9rem',
                borderRadius: '11px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: workingState !== 'idle' ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.42rem',
              }}
            >
              <AppIcon name="download" size={15} />
              ទាញយកតែស៊ុម PNG ថ្លា (Download Frame PNG)
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
