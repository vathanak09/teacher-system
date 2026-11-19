"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { photoFrameTemplateService } from '@/services/db';
import { AppIcon } from '@/components/AppIcons';
import {
  ASPECT_RATIO_OPTIONS,
  AspectRatioMode,
  FrameTemplate,
  TemplateCategory,
  buildProxyImageUrl,
  evictCachedImage,
  normalizeTemplateRecord,
} from './frameModel';

interface TemplateFormModalProps {
  isOpen: boolean;
  editingTemplate: FrameTemplate | null;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onSaved?: (template: FrameTemplate) => void;
}

const ELEMENT_POS_PRESETS = [
  { id: 'tl', label: 'លើឆ្វេង', x: -0.34, y: -0.34 },
  { id: 'tr', label: 'លើស្តាំ', x: 0.34, y: -0.34 },
  { id: 'cc', label: 'កណ្តាល', x: 0, y: 0 },
  { id: 'bl', label: 'ក្រោមឆ្វេង', x: -0.34, y: 0.34 },
  { id: 'br', label: 'ក្រោមស្តាំ', x: 0.34, y: 0.34 },
];

export default function TemplateFormModal({
  isOpen,
  editingTemplate,
  currentUserId,
  currentUserName,
  onClose,
  onSaved,
}: TemplateFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('frame');
  const [imageUrl, setImageUrl] = useState('');
  const [defaultAspect, setDefaultAspect] = useState<AspectRatioMode>('auto');
  const [defaultScale, setDefaultScale] = useState<number>(1);
  const [defaultX, setDefaultX] = useState<number>(0);
  const [defaultY, setDefaultY] = useState<number>(0);

  // Live preview verification state
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewDims, setPreviewDims] = useState<{ w: number; h: number } | null>(null);
  const [previewError, setPreviewError] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTemplate) {
      setName(editingTemplate.name || '');
      setDescription(editingTemplate.description || '');
      setCategory(editingTemplate.category || 'frame');
      setImageUrl(editingTemplate.imageUrl || '');
      setDefaultAspect(editingTemplate.defaultAspect || (editingTemplate.category === 'element' ? 'photo' : 'auto'));
      setDefaultScale(
        typeof editingTemplate.defaultScale === 'number'
          ? editingTemplate.defaultScale
          : editingTemplate.category === 'element'
            ? 0.28
            : 1
      );
      setDefaultX(typeof editingTemplate.defaultX === 'number' ? editingTemplate.defaultX : 0);
      setDefaultY(typeof editingTemplate.defaultY === 'number' ? editingTemplate.defaultY : 0);
    } else {
      setName('');
      setDescription('');
      setCategory('frame');
      setImageUrl('');
      setDefaultAspect('auto');
      setDefaultScale(1);
      setDefaultX(0);
      setDefaultY(0);
    }
    setFormError('');
    setPreviewError('');
  }, [isOpen, editingTemplate]);

  // Debounced live verification via /api/proxy-image
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      setPreviewSrc('');
      setPreviewState('idle');
      setPreviewDims(null);
      setPreviewError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const proxied = buildProxyImageUrl(trimmed);
      setPreviewState('loading');
      setPreviewError('');
      setPreviewDims(null);

      try {
        const res = await fetch(proxied);
        if (cancelled) return;
        if (!res.ok) {
          let errMsg = 'មិនអាចទាញយករូប PNG ពី Link នេះបានទេ';
          try {
            const data = await res.json();
            if (data?.error) errMsg = data.error;
          } catch {
            // ignore non-json error body
          }
          setPreviewState('error');
          setPreviewError(errMsg);
          setPreviewSrc('');
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;
        const objUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          if (cancelled) return;
          setPreviewDims({ w: img.naturalWidth, h: img.naturalHeight });
          setPreviewSrc(proxied);
          setPreviewState('ready');
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          if (cancelled) return;
          setPreviewState('error');
          setPreviewError('ឯកសារនេះមិនមែនជារូបភាព PNG/Image ត្រឹមត្រូវទេ។');
          setPreviewSrc('');
        };
        img.src = objUrl;
      } catch {
        if (cancelled) return;
        setPreviewState('error');
        setPreviewError('ការតភ្ជាប់ទៅ Link មានបញ្ហា សូមពិនិត្យ Link Google Drive ម្តងទៀត។');
        setPreviewSrc('');
      }
    }, 550);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageUrl, isOpen]);

  const handleCategoryChange = (next: TemplateCategory) => {
    setCategory(next);
    if (!editingTemplate) {
      if (next === 'element') {
        setDefaultAspect('photo');
        setDefaultScale(0.28);
        setDefaultX(0.34);
        setDefaultY(-0.34);
      } else {
        setDefaultAspect('auto');
        setDefaultScale(1);
        setDefaultX(0);
        setDefaultY(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    const cleanUrl = imageUrl.trim();
    if (!cleanName) {
      setFormError('សូមបញ្ចូលឈ្មោះ Template!');
      return;
    }
    if (!cleanUrl) {
      setFormError('សូមបញ្ចូល Link រូបភាព PNG ពី Google Drive!');
      return;
    }
    if (previewState === 'error') {
      setFormError(previewError || 'Link រូបភាពមិនត្រឹមត្រូវ! សូមពិនិត្យសិទ្ធិចែករំលែក Google Drive។');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const payload = {
        name: cleanName,
        description: description.trim(),
        category,
        imageUrl: cleanUrl,
        defaultAspect,
        defaultScale: Number(defaultScale) || (category === 'element' ? 0.28 : 1),
        defaultX: Number(defaultX) || 0,
        defaultY: Number(defaultY) || 0,
        updatedAt: now,
      };

      let saved: FrameTemplate;
      if (editingTemplate?.id) {
        await photoFrameTemplateService.update(editingTemplate.id, payload);
        evictCachedImage(buildProxyImageUrl(cleanUrl));
        saved = normalizeTemplateRecord({ ...editingTemplate, ...payload, id: editingTemplate.id });
      } else {
        const createdId = await photoFrameTemplateService.add({
          ...payload,
          createdById: currentUserId,
          createdByName: currentUserName,
          createdAt: now,
        });
        saved = normalizeTemplateRecord({
          ...payload,
          id: createdId,
          createdById: currentUserId,
          createdByName: currentUserName,
          createdAt: now,
        });
      }

      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'មិនអាចរក្សាទុក Template បានទេ។');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10060,
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          padding: '1.35rem 1.45rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingBottom: '0.9rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="layers" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingTemplate ? 'កែប្រែ Template ស៊ុម / Element' : 'បង្កើត Template ថ្មី (Google Drive PNG)'}
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Template ដែលបង្កើតនឹងចែករំលែកឱ្យគ្រូទាំងអស់ក្នុងសាលាប្រើប្រាស់បាន
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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
            aria-label="បិទ"
          >
            <AppIcon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          {/* Category Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              ប្រភេទ Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {[
                {
                  val: 'frame' as TemplateCategory,
                  title: 'ស៊ុមរូបថតពេញ (Frame)',
                  desc: 'ស៊ុម PNG ថ្លាកណ្តាល គ្របលើរូបថតទាំងមូល',
                  icon: 'maximize' as const,
                },
                {
                  val: 'element' as TemplateCategory,
                  title: 'ធាតុបន្ថែម (Element / Logo)',
                  desc: 'Logo សាលា, Sticker ឬ ផ្លាកដាក់តាមជ្រុង',
                  icon: 'sparkles' as const,
                },
              ].map((opt) => {
                const active = category === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleCategoryChange(opt.val)}
                    style={{
                      textAlign: 'left',
                      padding: '0.7rem 0.8rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active
                        ? 'color-mix(in srgb, var(--accent-primary) 10%, var(--main-bg))'
                        : 'var(--main-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem',
                    }}
                  >
                    <span
                      style={{
                        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        marginTop: '2px',
                      }}
                    >
                      <AppIcon name={opt.icon} size={18} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                      <strong style={{ fontSize: '0.84rem' }}>{opt.title}</strong>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              ឈ្មោះ Template <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={category === 'frame' ? 'ឧ. ស៊ុមរូបសកម្មភាពសាលា 2026' : 'ឧ. Logo សាលា PNG (ជ្រុងលើស្តាំ)'}
              required
              style={{ width: '100%' }}
            />
          </div>

          {/* Google Drive Link Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              តំណភ្ជាប់រូប PNG ពី Google Drive <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="url"
              className="input-field"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/xxxxxxxxxxxx/view?usp=sharing"
              required
              style={{ width: '100%' }}
            />
            <div
              style={{
                marginTop: '0.45rem',
                padding: '0.55rem 0.7rem',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--accent-primary) 7%, var(--main-bg))',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 18%, transparent)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>របៀបយក Link គុណភាពខ្ពស់ពី Google Drive៖</strong>{' '}
              Upload ឯកសារ <code>.PNG</code> ថ្លា (Transparent) ចូល Google Drive រួចចុច <strong>Share → General access → Anyone with the link (Viewer)</strong> បន្ទាប់មកចុច <strong>Copy link</strong> មក Paste ទីនេះ។ ប្រព័ន្ធនឹងទាញយក PNG គុណភាពដើម 100% ដោយមិនបាត់ភាពថ្លា។
            </div>
          </div>

          {/* Live PNG Transparency Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                ពិនិត្យរូបភាព PNG ជាក់ស្តែង (Live Preview)
              </span>
              {previewState === 'ready' && previewDims && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '0.18rem 0.55rem',
                    borderRadius: '999px',
                  }}
                >
                  <AppIcon name="check-circle" size={13} />
                  {previewDims.w} × {previewDims.h} px
                </span>
              )}
            </div>

            <div
              className="photo-frame-checkerboard"
              style={{
                minHeight: '168px',
                maxHeight: '230px',
                borderRadius: '14px',
                border: `1.5px dashed ${
                  previewState === 'error'
                    ? '#ef4444'
                    : previewState === 'ready'
                      ? '#10b981'
                      : 'var(--border-color)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {previewState === 'idle' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  <AppIcon name="image" size={28} style={{ opacity: 0.45, marginBottom: '0.35rem' }} />
                  <div>Paste តំណភ្ជាប់ Google Drive PNG ខាងលើ ដើម្បីមើលគំរូ</div>
                </div>
              )}

              {previewState === 'loading' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.84rem', fontWeight: 600 }}>
                  <AppIcon name="refresh-cw" size={18} />
                  កំពុងទាញយក និងផ្ទៀងផ្ទាត់ PNG គុណភាពដើម...
                </div>
              )}

              {previewState === 'error' && (
                <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.81rem', maxWidth: '460px', lineHeight: 1.45 }}>
                  <AppIcon name="alert-triangle" size={24} style={{ marginBottom: '0.3rem' }} />
                  <div>{previewError}</div>
                </div>
              )}

              {previewState === 'ready' && previewSrc && (
                <img
                  src={previewSrc}
                  alt={name || 'Template Preview'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>

          {/* Aspect Ratio & Element Defaults */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                សមាមាត្ររូបណែនាំ (Default Ratio)
              </label>
              <select
                className="input-field"
                value={defaultAspect}
                onChange={(e) => setDefaultAspect(e.target.value as AspectRatioMode)}
                style={{ width: '100%' }}
              >
                {ASPECT_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {category === 'element' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  ទំហំ Element លំនាំដើម ({Math.round(defaultScale * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.08}
                  max={1}
                  step={0.02}
                  value={defaultScale}
                  onChange={(e) => setDefaultScale(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', marginTop: '0.45rem' }}
                />
              </div>
            )}
          </div>

          {category === 'element' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                ទីតាំង Element លំនាំដើម
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ELEMENT_POS_PRESETS.map((p) => {
                  const selected = Math.abs(defaultX - p.x) < 0.05 && Math.abs(defaultY - p.y) < 0.05;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setDefaultX(p.x);
                        setDefaultY(p.y);
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        background: selected
                          ? 'color-mix(in srgb, var(--accent-primary) 14%, var(--main-bg))'
                          : 'var(--main-bg)',
                        color: selected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              កំណត់សម្គាល់ (ស្រេចចិត្ត)
            </label>
            <input
              type="text"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ឧ. សម្រាប់រូបថតសិស្សឆ្នើមប្រចាំខែ..."
              style={{ width: '100%' }}
            />
          </div>

          {formError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AppIcon name="alert-triangle" size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.4rem' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || previewState === 'loading'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name={saving ? 'refresh-cw' : 'check'} size={16} />
              {saving ? 'កំពុងរក្សាទុក...' : editingTemplate ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុក Template'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
