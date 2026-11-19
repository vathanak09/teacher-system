"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { photoFrameTemplateService } from '@/services/db';
import { AppIcon } from '@/components/AppIcons';
import { useConfirm } from '@/components/ConfirmDialog';
import TemplateFormModal from '@/components/photo-frame/TemplateFormModal';
import { createZipBlob, ZipInputFile } from '@/utils/zipBuilder';
import {
  ASPECT_RATIO_OPTIONS,
  AspectRatioMode,
  BatchPhotoItem,
  DEFAULT_PHOTO_TRANSFORM,
  ExportFormat,
  FrameTemplate,
  OverlayLayer,
  OverlaySnapPreset,
  PhotoTransform,
  QUALITY_MULTIPLIERS,
  buildExportFileName,
  buildProxyImageUrl,
  canvasToBlob,
  cloneOverlays,
  computeSnappedOverlayPosition,
  createOverlayFromTemplate,
  createUid,
  evictCachedImage,
  loadImageCached,
  normalizeTemplateRecord,
  renderCompositionToCanvas,
  resolveCanvasDimensions,
} from '@/components/photo-frame/frameModel';

type EditTargetMode = 'photo' | 'overlay';

interface PointerSample {
  x: number;
  y: number;
}

export default function PhotoFrameStudioPage() {
  const confirmDialog = useConfirm();

  // User identity (for shared template create/edit/delete permissions)
  const [userRole, setUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Shared templates from RTDB
  const [templates, setTemplates] = useState<FrameTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'frame' | 'element'>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FrameTemplate | null>(null);

  // Default overlay blueprint applied automatically to newly added photos
  const [blueprintOverlays, setBlueprintOverlays] = useState<OverlayLayer[]>([]);

  // Local batch photos (NEVER saved to DB)
  const [photos, setPhotos] = useState<BatchPhotoItem[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Studio interactive editor settings
  const [editMode, setEditMode] = useState<EditTargetMode>('photo');
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [showGridGuides, setShowGridGuides] = useState(false);
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('auto');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [qualityMultiplier, setQualityMultiplier] = useState<number>(2);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportApprovedOnly, setExportApprovedOnly] = useState(false);

  // Loaded HTMLImageElement map (keyed by src)
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loadingImageCount, setLoadingImageCount] = useState(0);
  const [imageErrorMsg, setImageErrorMsg] = useState<string>('');

  // Export & feedback status
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Mobile floating live preview state (floats automatically when scrolling down into tools on mobile)
  const [mounted, setMounted] = useState(false);
  const [showMobileFloating, setShowMobileFloating] = useState(false);
  const [floatingExpanded, setFloatingExpanded] = useState(false);
  const [floatingCollapsed, setFloatingCollapsed] = useState(false);

  // Refs
  const mainPreviewCardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floatingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const localOverlayInputRef = useRef<HTMLInputElement | null>(null);
  const localOverlayCategoryRef = useRef<'frame' | 'element'>('frame');
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());
  const exportCancelRef = useRef<boolean>(false);

  // Multi-touch / mouse gesture tracking refs
  const activePointersRef = useRef<Map<number, PointerSample>>(new Map());
  const pinchStartRef = useRef<{
    distance: number;
    midX: number;
    midY: number;
    initialScale: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToastMsg({ type, text });
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Read logged-in identity & mark client mounted for portal
  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || '';
    const uid = localStorage.getItem('teacherProfileId') || localStorage.getItem('userId') || '';
    const uname = localStorage.getItem('userName') || (role === 'admin' ? 'Admin' : 'គ្រូបង្រៀន');
    setUserRole(role);
    setCurrentUserId(uid);
    setCurrentUserName(uname);
  }, []);

  // Show floating live preview on mobile/tablet when scrolling past main preview down to controls
  useEffect(() => {
    let rafId = 0;

    const evaluateFloating = () => {
      rafId = 0;
      const isNarrow = window.innerWidth <= 980;
      const cardEl = mainPreviewCardRef.current;
      if (!isNarrow || !cardEl) {
        setShowMobileFloating(false);
        return;
      }
      const rect = cardEl.getBoundingClientRect();
      // Only float once main preview card has scrolled above top so browsing templates above stays clean
      const scrolledPast = rect.bottom < 84;
      setShowMobileFloating(scrolledPast);
    };

    const scheduleCheck = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(evaluateFloating);
    };

    evaluateFloating();
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    };
  }, []);

  // Subscribe to shared templates
  useEffect(() => {
    const unsub = photoFrameTemplateService.subscribeAll((data) => {
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeTemplateRecord)
        .filter((t) => Boolean(t.id && t.imageUrl))
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      setTemplates(normalized);
      setTemplatesLoaded(true);
    });
    return () => unsub();
  }, []);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
          evictCachedImage(url);
        } catch {
          // ignore
        }
      });
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  const isAdmin = userRole === 'admin';
  const canCreateTemplate = userRole === 'admin' || userRole === 'teacher';

  const activePhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || photos[0] || null,
    [photos, selectedPhotoId]
  );

  const activePhotoIndex = useMemo(
    () => (activePhoto ? photos.findIndex((p) => p.id === activePhoto.id) : -1),
    [photos, activePhoto]
  );

  const currentOverlays = useMemo(
    () => (activePhoto ? activePhoto.overlays : blueprintOverlays),
    [activePhoto, blueprintOverlays]
  );

  const activeOverlay = useMemo(
    () => currentOverlays.find((o) => o.id === activeOverlayId) || currentOverlays[currentOverlays.length - 1] || null,
    [currentOverlays, activeOverlayId]
  );

  // Keep activeOverlayId synced when switching photos or adding/removing overlays
  useEffect(() => {
    if (currentOverlays.length === 0) {
      setActiveOverlayId(null);
      if (editMode === 'overlay') setEditMode('photo');
      return;
    }
    if (!activeOverlayId || !currentOverlays.some((o) => o.id === activeOverlayId)) {
      setActiveOverlayId(currentOverlays[currentOverlays.length - 1].id);
    }
  }, [currentOverlays, activeOverlayId, editMode]);

  // Preload active photo + all current overlay images into loadedImages state
  useEffect(() => {
    const neededSrcs = new Set<string>();
    if (activePhoto?.previewUrl) neededSrcs.add(activePhoto.previewUrl);
    for (const ov of currentOverlays) {
      if (ov.proxySrc) neededSrcs.add(ov.proxySrc);
    }

    const toFetch = Array.from(neededSrcs).filter((src) => !loadedImages[src]);
    if (toFetch.length === 0) return;

    let cancelled = false;
    setLoadingImageCount((c) => c + toFetch.length);
    setImageErrorMsg('');

    toFetch.forEach((src) => {
      loadImageCached(src)
        .then((img) => {
          if (cancelled) return;
          setLoadedImages((prev) => (prev[src] ? prev : { ...prev, [src]: img }));
        })
        .catch(() => {
          if (cancelled) return;
          setImageErrorMsg('មិនអាចផ្ទុករូប PNG មួយចំនួនបានទេ — សូមពិនិត្យសិទ្ធិ Link Google Drive (Anyone with the link)។');
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingImageCount((c) => Math.max(0, c - 1));
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [activePhoto?.previewUrl, currentOverlays, loadedImages]);

  // Primary frame image (used for 'auto' aspect ratio detection)
  const primaryFrameImg = useMemo(() => {
    const frameLayer = currentOverlays.find((o) => o.visible && o.category === 'frame') || currentOverlays.find((o) => o.visible);
    return frameLayer ? loadedImages[frameLayer.proxySrc] || null : null;
  }, [currentOverlays, loadedImages]);

  const activePhotoImg = useMemo(
    () => (activePhoto ? loadedImages[activePhoto.previewUrl] || null : null),
    [activePhoto, loadedImages]
  );

  // Live output resolution based on selected quality multiplier (x1..x6)
  const exportDims = useMemo(
    () =>
      resolveCanvasDimensions({
        aspectMode,
        primaryFrameImg,
        photoImg: activePhotoImg,
        qualityMultiplier,
      }),
    [aspectMode, primaryFrameImg, activePhotoImg, qualityMultiplier]
  );

  // Preview canvas logical aspect ratio
  const previewDims = useMemo(() => {
    const ratio = exportDims.width / Math.max(1, exportDims.height);
    const maxStage = 620;
    if (ratio >= 1) {
      return { width: maxStage, height: Math.round(maxStage / ratio) };
    }
    return { width: Math.round(maxStage * ratio), height: maxStage };
  }, [exportDims.width, exportDims.height]);

  // Update helpers for active photo transform & overlays
  const updateActivePhotoTransform = useCallback(
    (updater: (prev: PhotoTransform) => PhotoTransform) => {
      if (!activePhoto) return;
      const targetId = activePhoto.id;
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? { ...item, photoTransform: updater(item.photoTransform) }
            : item
        )
      );
    },
    [activePhoto]
  );

  const updateCurrentOverlays = useCallback(
    (updater: (prev: OverlayLayer[]) => OverlayLayer[]) => {
      if (activePhoto) {
        const targetId = activePhoto.id;
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? { ...item, overlays: updater(item.overlays) }
              : item
          )
        );
      } else {
        setBlueprintOverlays((prev) => updater(prev));
      }
    },
    [activePhoto]
  );

  const updateActiveOverlay = useCallback(
    (updater: (prev: OverlayLayer) => OverlayLayer) => {
      if (!activeOverlay) return;
      const targetOvId = activeOverlay.id;
      updateCurrentOverlays((list) =>
        list.map((ov) => (ov.id === targetOvId ? updater(ov) : ov))
      );
    },
    [activeOverlay, updateCurrentOverlays]
  );

  // Compute compact/expanded dimensions for mobile floating preview canvas
  const floatingCanvasDims = useMemo(() => {
    const ratio = exportDims.width / Math.max(1, exportDims.height);
    const maxW = floatingExpanded ? 290 : 146;
    const maxH = floatingExpanded ? 230 : 132;
    let w = maxW;
    let h = Math.round(w / ratio);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
    return { width: Math.max(52, w), height: Math.max(52, h) };
  }, [exportDims.width, exportDims.height, floatingExpanded]);

  // Draw live preview canvas (both main preview and mobile floating live preview card)
  useEffect(() => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const renderOptions = {
      photoImg: activePhotoImg,
      photoTransform: activePhoto?.photoTransform || DEFAULT_PHOTO_TRANSFORM,
      overlays: currentOverlays,
      overlayImages: loadedImages,
      backgroundColor,
      activeOverlayIdForGuide: editMode === 'overlay' ? activeOverlay?.id || null : null,
      showGridGuides,
    };

    const paintCanvas = (canvas: HTMLCanvasElement | null, logicalW: number, logicalH: number) => {
      if (!canvas) return;
      const drawW = Math.round(logicalW * dpr);
      const drawH = Math.round(logicalH * dpr);
      if (canvas.width !== drawW || canvas.height !== drawH) {
        canvas.width = drawW;
        canvas.height = drawH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderCompositionToCanvas(ctx, drawW, drawH, renderOptions);
    };

    paintCanvas(canvasRef.current, previewDims.width, previewDims.height);

    if (showMobileFloating && !floatingCollapsed && !isTemplateModalOpen) {
      paintCanvas(floatingCanvasRef.current, floatingCanvasDims.width, floatingCanvasDims.height);
    }
  }, [
    previewDims.width,
    previewDims.height,
    floatingCanvasDims.width,
    floatingCanvasDims.height,
    showMobileFloating,
    floatingCollapsed,
    isTemplateModalOpen,
    activePhoto,
    activePhotoImg,
    currentOverlays,
    loadedImages,
    backgroundColor,
    editMode,
    activeOverlay?.id,
    showGridGuides,
  ]);

  // Non-passive mouse wheel zoom on canvas so zooming never scrolls the page
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;

      if (editMode === 'overlay' && activeOverlay) {
        updateActiveOverlay((ov) => ({
          ...ov,
          scale: Math.max(0.05, Math.min(3.5, Number((ov.scale * factor).toFixed(3)))),
        }));
      } else if (activePhoto) {
        updateActivePhotoTransform((pt) => ({
          ...pt,
          scale: Math.max(0.2, Math.min(4, Number((pt.scale * factor).toFixed(3)))),
        }));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [editMode, activeOverlay, activePhoto, updateActiveOverlay, updateActivePhotoTransform]);

  // Pointer & 2-finger pinch gestures on canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      if (editMode === 'overlay' && activeOverlay) {
        pinchStartRef.current = {
          distance: dist,
          midX,
          midY,
          initialScale: activeOverlay.scale,
          initialX: activeOverlay.x,
          initialY: activeOverlay.y,
        };
      } else if (activePhoto) {
        pinchStartRef.current = {
          distance: dist,
          midX,
          midY,
          initialScale: activePhoto.photoTransform.scale,
          initialX: activePhoto.photoTransform.x,
          initialY: activePhoto.photoTransform.y,
        };
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    const prevPt = activePointersRef.current.get(e.pointerId)!;
    const nextPt = { x: e.clientX, y: e.clientY };
    activePointersRef.current.set(e.pointerId, nextPt);

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // 2-finger pinch zoom + pan
    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const ratio = dist / Math.max(1, pinchStartRef.current.distance);
      const dxNorm = (midX - pinchStartRef.current.midX) / rect.width;
      const dyNorm = (midY - pinchStartRef.current.midY) / rect.height;

      if (editMode === 'overlay' && activeOverlay) {
        const nextScale = Math.max(0.05, Math.min(3.5, pinchStartRef.current.initialScale * ratio));
        const nextX = pinchStartRef.current.initialX + dxNorm;
        const nextY = pinchStartRef.current.initialY + dyNorm;
        updateActiveOverlay((ov) => ({ ...ov, scale: nextScale, x: nextX, y: nextY }));
      } else if (activePhoto) {
        const nextScale = Math.max(0.2, Math.min(4, pinchStartRef.current.initialScale * ratio));
        const nextX = pinchStartRef.current.initialX + dxNorm;
        const nextY = pinchStartRef.current.initialY + dyNorm;
        updateActivePhotoTransform((pt) => ({ ...pt, scale: nextScale, x: nextX, y: nextY }));
      }
      return;
    }

    // 1-finger / mouse drag pan
    if (activePointersRef.current.size === 1) {
      const dxNorm = (nextPt.x - prevPt.x) / rect.width;
      const dyNorm = (nextPt.y - prevPt.y) / rect.height;
      if (dxNorm === 0 && dyNorm === 0) return;

      if (editMode === 'overlay' && activeOverlay) {
        updateActiveOverlay((ov) => ({
          ...ov,
          x: Math.max(-1.2, Math.min(1.2, ov.x + dxNorm)),
          y: Math.max(-1.2, Math.min(1.2, ov.y + dyNorm)),
        }));
      } else if (activePhoto) {
        updateActivePhotoTransform((pt) => ({
          ...pt,
          x: Math.max(-1.5, Math.min(1.5, pt.x + dxNorm)),
          y: Math.max(-1.5, Math.min(1.5, pt.y + dyNorm)),
        }));
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
  };

  // Add multiple local user photos (in-memory only, zero DB writes)
  const addPhotoFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) {
        showToast('error', 'សូមជ្រើសរើសឯកសាររូបភាព (JPG, PNG, WebP...)');
        return;
      }

      const templateBase = activePhoto ? activePhoto.overlays : blueprintOverlays;
      const createdItems: BatchPhotoItem[] = [];

      for (const file of files) {
        const objUrl = URL.createObjectURL(file);
        createdBlobUrlsRef.current.add(objUrl);

        let naturalWidth = 1080;
        let naturalHeight = 1080;
        try {
          const img = await loadImageCached(objUrl);
          naturalWidth = img.naturalWidth;
          naturalHeight = img.naturalHeight;
          setLoadedImages((prev) => ({ ...prev, [objUrl]: img }));
        } catch {
          // keep fallback dimensions
        }

        createdItems.push({
          id: createUid('photo'),
          fileName: file.name || `photo_${Date.now()}.png`,
          previewUrl: objUrl,
          naturalWidth,
          naturalHeight,
          photoTransform: { ...DEFAULT_PHOTO_TRANSFORM },
          overlays: cloneOverlays(templateBase),
          approved: false,
        });
      }

      setPhotos((prev) => [...prev, ...createdItems]);
      if (!selectedPhotoId && createdItems[0]) {
        setSelectedPhotoId(createdItems[0].id);
      }
      showToast('success', `បានបន្ថែមរូបថតចំនួន ${createdItems.length} រូប (រក្សាទុកតែលើឧបករណ៍អ្នក)`);
    },
    [activePhoto, blueprintOverlays, selectedPhotoId, showToast]
  );

  // Add local transparent PNG as one-off frame/element without saving to DB
  const handleLocalOverlayPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const category = localOverlayCategoryRef.current;
    const objUrl = URL.createObjectURL(file);
    createdBlobUrlsRef.current.add(objUrl);

    const newLayer: OverlayLayer = {
      id: createUid('ovl'),
      name: file.name.replace(/\.[^/.]+$/, '') || (category === 'frame' ? 'ស៊ុមពីម៉ាស៊ីន' : 'Element ពីម៉ាស៊ីន'),
      category,
      imageUrl: 'local',
      proxySrc: objUrl,
      x: category === 'element' ? 0.34 : 0,
      y: category === 'element' ? -0.34 : 0,
      scale: category === 'element' ? 0.28 : 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      isLocal: true,
    };

    const activeId = activePhoto?.id || null;
    const activeLayerId = createUid('ovl');

    const buildMerged = (list: OverlayLayer[], layerId: string) => {
      const layerCopy = { ...newLayer, id: layerId };
      if (category === 'frame') {
        const nonFrames = list.filter((l) => l.category !== 'frame');
        return [layerCopy, ...nonFrames];
      }
      return [...list, layerCopy];
    };

    setBlueprintOverlays((prev) => buildMerged(prev, activeId ? createUid('ovl') : activeLayerId));
    if (photos.length > 0) {
      setPhotos((prev) =>
        prev.map((item) => ({
          ...item,
          overlays: buildMerged(item.overlays, item.id === activeId ? activeLayerId : createUid('ovl')),
        }))
      );
    }
    setActiveOverlayId(activeLayerId);
    setEditMode('overlay');
    showToast('success', `បានបន្ថែម PNG ពីម៉ាស៊ីន (${category === 'frame' ? 'ស៊ុម' : 'Element'})`);
  };

  // Apply a shared template (mode: 'apply' replaces main frame / adds element; 'stack' always appends a layer)
  const applyTemplateToStudio = useCallback(
    (template: FrameTemplate, mode: 'apply' | 'stack' = 'apply') => {
      const layer = createOverlayFromTemplate(template);
      const activeId = activePhoto?.id || null;
      const activeLayerId = createUid('ovl');

      const mergeFn = (existing: OverlayLayer[], layerId: string): OverlayLayer[] => {
        const layerCopy = { ...layer, id: layerId };
        if (mode === 'stack') {
          return [...existing, layerCopy];
        }
        if (template.category === 'frame') {
          const otherElements = existing.filter((o) => o.category !== 'frame');
          return [layerCopy, ...otherElements];
        }
        // For element: replace same templateId if present, else append
        const withoutSame = existing.filter((o) => o.templateId !== template.id);
        return [...withoutSame, layerCopy];
      };

      setBlueprintOverlays((prev) => mergeFn(prev, activeId ? createUid('ovl') : activeLayerId));

      if (photos.length > 0) {
        setPhotos((prev) =>
          prev.map((item) => ({
            ...item,
            overlays: mergeFn(item.overlays, item.id === activeId ? activeLayerId : createUid('ovl')),
          }))
        );
      }

      setActiveOverlayId(activeLayerId);

      if (mode === 'apply' && template.defaultAspect && template.category === 'frame') {
        setAspectMode(template.defaultAspect);
      }

      if (template.category === 'element' || mode === 'stack') {
        setEditMode('overlay');
      }

      showToast(
        'info',
        mode === 'stack'
          ? `បានបន្ថែម Layer "${template.name}"`
          : `បានប្រើ Template "${template.name}" លើរូបថតទាំងអស់`
      );
    },
    [activePhoto?.id, photos.length, showToast]
  );

  // Copy active photo's exact overlays (sizes, positions, opacity, visibility) to all photos
  const handleApplyOverlaysToAllPhotos = () => {
    if (!activePhoto || photos.length <= 1) return;
    const sourceOverlays = activePhoto.overlays;
    setBlueprintOverlays(cloneOverlays(sourceOverlays));
    setPhotos((prev) =>
      prev.map((item) =>
        item.id === activePhoto.id
          ? item
          : { ...item, overlays: cloneOverlays(sourceOverlays) }
      )
    );
    showToast('success', `បានអនុវត្តទីតាំង និងទំហំ Frame/Element ទៅគ្រប់ ${photos.length} រូបរួចរាល់!`);
  };

  // Delete single photo
  const handleRemovePhoto = (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (target?.previewUrl && createdBlobUrlsRef.current.has(target.previewUrl)) {
      URL.revokeObjectURL(target.previewUrl);
      evictCachedImage(target.previewUrl);
      createdBlobUrlsRef.current.delete(target.previewUrl);
    }
    setPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== photoId);
      if (selectedPhotoId === photoId) {
        setSelectedPhotoId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  const handleClearAllPhotos = async () => {
    if (photos.length === 0) return;
    const ok = await confirmDialog({
      title: 'សម្អាតរូបថតទាំងអស់?',
      message: `តើអ្នកពិតជាចង់ដករូបថតទាំង ${photos.length} ចេញពីផ្ទាំងការងារមែនទេ?`,
      confirmText: 'សម្អាតទាំងអស់',
      cancelText: 'បោះបង់',
      variant: 'danger',
    });
    if (!ok) return;

    photos.forEach((p) => {
      if (createdBlobUrlsRef.current.has(p.previewUrl)) {
        URL.revokeObjectURL(p.previewUrl);
        evictCachedImage(p.previewUrl);
        createdBlobUrlsRef.current.delete(p.previewUrl);
      }
    });
    setPhotos([]);
    setSelectedPhotoId(null);
  };

  // Delete shared template from DB
  const handleDeleteTemplate = async (template: FrameTemplate) => {
    const ok = await confirmDialog({
      title: 'លុប Template?',
      message: `តើអ្នកពិតជាចង់លុប Template "${template.name}" ចេញពីបណ្ណាល័យរួមមែនទេ?`,
      confirmText: 'លុប Template',
      cancelText: 'បោះបង់',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await photoFrameTemplateService.delete(template.id);
      showToast('success', `បានលុប Template "${template.name}"`);
    } catch {
      showToast('error', 'មិនអាចលុប Template បានទេ');
    }
  };

  // Toggle approval for active photo & auto-advance to next unapproved
  const handleApproveCurrentPhoto = () => {
    if (!activePhoto) return;
    const nextApproved = !activePhoto.approved;
    setPhotos((prev) =>
      prev.map((item) =>
        item.id === activePhoto.id ? { ...item, approved: nextApproved } : item
      )
    );

    if (nextApproved) {
      const nextUnapproved =
        photos.slice(activePhotoIndex + 1).find((p) => !p.approved) ||
        photos.slice(0, activePhotoIndex).find((p) => !p.approved);
      if (nextUnapproved) {
        setSelectedPhotoId(nextUnapproved.id);
      }
      showToast('success', `បានយល់ព្រមរូប "${activePhoto.fileName}"`);
    }
  };

  const handleApproveAllPhotos = () => {
    if (photos.length === 0) return;
    setPhotos((prev) => prev.map((p) => ({ ...p, approved: true })));
    showToast('success', `បានយល់ព្រមរូបថតទាំង ${photos.length} រួចរាល់!`);
  };

  // Snap active overlay layer
  const handleSnapOverlay = (preset: OverlaySnapPreset) => {
    if (!activeOverlay) return;
    const img = loadedImages[activeOverlay.proxySrc];
    const snapped = computeSnappedOverlayPosition(
      activeOverlay,
      img,
      exportDims.baseWidth,
      exportDims.baseHeight,
      preset
    );
    updateActiveOverlay((ov) => ({
      ...ov,
      x: snapped.x,
      y: snapped.y,
      scale: snapped.scale ?? ov.scale,
      rotation: snapped.rotation ?? ov.rotation,
    }));
  };

  // Reorder / remove overlay layers
  const handleMoveOverlayOrder = (layerId: string, dir: -1 | 1) => {
    updateCurrentOverlays((list) => {
      const idx = list.findIndex((l) => l.id === layerId);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= list.length) return list;
      const copy = [...list];
      const [moved] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, moved);
      return copy;
    });
  };

  const handleRemoveOverlayLayer = (layerId: string) => {
    updateCurrentOverlays((list) => list.filter((l) => l.id !== layerId));
  };

  // High-resolution offscreen render helper for 1 photo
  const renderItemToBlob = useCallback(
    async (item: BatchPhotoItem): Promise<{ blob: Blob; fileName: string }> => {
      const photoImg = await loadImageCached(item.previewUrl);

      const overlayImgMap: Record<string, HTMLImageElement | undefined> = {};
      for (const layer of item.overlays) {
        if (!layer.visible || !layer.proxySrc) continue;
        try {
          overlayImgMap[layer.proxySrc] = await loadImageCached(layer.proxySrc);
        } catch {
          // skip failed overlay cleanly rather than crashing whole batch
        }
      }

      const frameLayer =
        item.overlays.find((o) => o.visible && o.category === 'frame') ||
        item.overlays.find((o) => o.visible);
      const frameImg = frameLayer ? overlayImgMap[frameLayer.proxySrc] || null : null;

      const dims = resolveCanvasDimensions({
        aspectMode,
        primaryFrameImg: frameImg,
        photoImg,
        qualityMultiplier,
      });

      const offscreen = document.createElement('canvas');
      offscreen.width = dims.width;
      offscreen.height = dims.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Browser មិនគាំទ្រ Canvas 2D');

      // JPEG does not support alpha transparency; fall back to white if background is transparent
      const effectiveBg =
        exportFormat === 'jpeg' && backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;

      renderCompositionToCanvas(ctx, dims.width, dims.height, {
        photoImg,
        photoTransform: item.photoTransform,
        overlays: item.overlays,
        overlayImages: overlayImgMap,
        backgroundColor: effectiveBg,
        activeOverlayIdForGuide: null,
        showGridGuides: false,
      });

      const blob = await canvasToBlob(offscreen, exportFormat, 0.94);
      // Help GC release large high-res canvases immediately
      offscreen.width = 0;
      offscreen.height = 0;

      return {
        blob,
        fileName: buildExportFileName(item.fileName, exportFormat, qualityMultiplier),
      };
    },
    [aspectMode, qualityMultiplier, exportFormat, backgroundColor]
  );

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Download active single photo
  const handleDownloadSingle = async () => {
    if (!activePhoto || isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 1, total: 1, label: `កំពុងបង្កើតរូបគុណភាព x${qualityMultiplier}...` });
    try {
      const { blob, fileName } = await renderItemToBlob(activePhoto);
      triggerBlobDownload(blob, fileName);
      showToast('success', `បានទាញយក "${fileName}" (${exportDims.width}×${exportDims.height}px)`);
    } catch (err: any) {
      showToast('error', err?.message || 'មិនអាចទាញយករូបបានទេ');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Batch download all (or approved) photos as ZIP or sequential individual files
  const handleBatchDownload = async (mode: 'zip' | 'individual') => {
    if (isExporting) return;
    const targets = exportApprovedOnly ? photos.filter((p) => p.approved) : photos;
    if (targets.length === 0) {
      showToast(
        'error',
        exportApprovedOnly
          ? 'មិនទាន់មានរូបថតណាដែលបានចុច "យល់ព្រម" នៅឡើយទេ!'
          : 'សូមបញ្ចូលរូបថតយ៉ាងតិច ១ រូបជាមុនសិន!'
      );
      return;
    }

    if (targets.length === 1 && mode === 'individual') {
      setSelectedPhotoId(targets[0].id);
      setIsExporting(true);
      setExportProgress({ current: 1, total: 1, label: 'កំពុងបង្កើតរូប...' });
      try {
        const { blob, fileName } = await renderItemToBlob(targets[0]);
        triggerBlobDownload(blob, fileName);
        showToast('success', `បានទាញយក "${fileName}"`);
      } catch (err: any) {
        showToast('error', err?.message || 'មានបញ្ហាក្នុងការទាញយក');
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
      return;
    }

    exportCancelRef.current = false;
    setIsExporting(true);
    const zipEntries: ZipInputFile[] = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        if (exportCancelRef.current) {
          showToast('info', 'បានបោះបង់ការទាញយក');
          return;
        }
        const item = targets[i];
        setExportProgress({
          current: i + 1,
          total: targets.length,
          label: `កំពុងបង្កើតរូបទី ${i + 1} / ${targets.length} (x${qualityMultiplier})...`,
        });

        // Yield briefly to UI thread so progress bar updates smoothly
        await new Promise((r) => setTimeout(r, 20));
        const { blob, fileName } = await renderItemToBlob(item);

        if (mode === 'zip') {
          const ab = await blob.arrayBuffer();
          zipEntries.push({ name: fileName, data: new Uint8Array(ab) });
        } else {
          triggerBlobDownload(blob, fileName);
          if (i < targets.length - 1) {
            await new Promise((r) => setTimeout(r, 320));
          }
        }
      }

      if (mode === 'zip' && zipEntries.length > 0) {
        setExportProgress({
          current: targets.length,
          total: targets.length,
          label: 'កំពុងបង្កើតឯកសារ ZIP...',
        });
        const zipBlob = createZipBlob(zipEntries);
        const stamp = new Date().toISOString().slice(0, 10);
        triggerBlobDownload(zipBlob, `framed_photos_x${qualityMultiplier}_${stamp}.zip`);
        showToast('success', `បានទាញយក ZIP ចំនួន ${zipEntries.length} រូប (x${qualityMultiplier}) រួចរាល់!`);
      } else if (mode === 'individual') {
        showToast('success', `បានទាញយករូបចំនួន ${targets.length} រូបរួចរាល់!`);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'មានបញ្ហាក្នុងការបង្កើតរូបថត');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Filtered templates list
  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    return templates.filter((t) => {
      if (templateFilter !== 'all' && t.category !== templateFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.createdByName || '').toLowerCase().includes(q)
      );
    });
  }, [templates, templateFilter, templateSearch]);

  const approvedCount = useMemo(() => photos.filter((p) => p.approved).length, [photos]);
  const exportTargetCount = exportApprovedOnly ? approvedCount : photos.length;

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) addPhotoFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={localOverlayInputRef}
        type="file"
        accept="image/png,image/webp,image/*"
        style={{ display: 'none' }}
        onChange={handleLocalOverlayPicked}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 9990,
            maxWidth: '380px',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            background:
              toastMsg.type === 'error'
                ? '#dc2626'
                : toastMsg.type === 'success'
                  ? '#059669'
                  : 'var(--accent-primary)',
            color: '#ffffff',
            boxShadow: '0 14px 32px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontSize: '0.84rem',
            fontWeight: 600,
          }}
        >
          <AppIcon
            name={toastMsg.type === 'error' ? 'alert-triangle' : toastMsg.type === 'success' ? 'check-circle' : 'sparkles'}
            size={18}
          />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.15rem 1.3rem',
          borderRadius: '18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <Link
            href="/dashboard/tools"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            <AppIcon name="chevron-left" size={15} />
            ត្រឡប់ទៅទំព័រឧបករណ៍
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(236, 72, 153, 0.28)',
              }}
            >
              <AppIcon name="image" size={21} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ដាក់ស៊ុម & Element រូបថត (Photo Frame Studio)
              </h1>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                ដាក់ស៊ុម ឬ Logo ច្រើនរូបក្នុងពេលតែមួយ • មិន Save រូបថតចូល Database • ទាញយកគុណភាពខ្ពស់ x1–x6
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {canCreateTemplate && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditingTemplate(null);
                setIsTemplateModalOpen(true);
              }}
              style={{
                background: 'color-mix(in srgb, var(--accent-primary) 12%, var(--main-bg))',
                color: 'var(--accent-primary)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.42rem',
                fontWeight: 700,
              }}
            >
              <AppIcon name="plus" size={16} />
              បង្កើត Template (Google Drive PNG)
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => photoInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
            }}
          >
            <AppIcon name="upload" size={16} />
            បន្ថែមរូបថតច្រើន
          </button>
        </div>
      </div>

      {/* SECTION 1: Shared Template Library */}
      <div className="glass-panel" style={{ padding: '1rem 1.15rem', borderRadius: '18px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AppIcon name="layers" size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              បណ្ណាល័យ Template ស៊ុម & Element រួម ({templates.length})
            </h2>
            <div style={{ display: 'inline-flex', gap: '0.3rem', marginLeft: '0.25rem' }}>
              {[
                { key: 'all' as const, label: 'ទាំងអស់' },
                { key: 'frame' as const, label: 'ស៊ុមពេញ (Frame)' },
                { key: 'element' as const, label: 'ធាតុបន្ថែម (Element)' },
              ].map((tab) => {
                const active = templateFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTemplateFilter(tab.key)}
                    style={{
                      padding: '0.28rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active
                        ? 'var(--accent-primary)'
                        : 'var(--main-bg)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <AppIcon
                name="search"
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="input-field"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="ស្វែងរក Template..."
                style={{ paddingLeft: '2rem', paddingTop: '0.36rem', paddingBottom: '0.36rem', fontSize: '0.8rem', width: '100%' }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                localOverlayCategoryRef.current = 'frame';
                localOverlayInputRef.current?.click();
              }}
              style={{
                padding: '0.38rem 0.7rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.77rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="ប្រើ PNG ពីម៉ាស៊ីនភ្លាមៗ ដោយមិនបាច់ Save ជា Template"
            >
              <AppIcon name="upload" size={14} />
              PNG ស៊ុមពីម៉ាស៊ីន
            </button>
            <button
              type="button"
              onClick={() => {
                localOverlayCategoryRef.current = 'element';
                localOverlayInputRef.current?.click();
              }}
              style={{
                padding: '0.38rem 0.7rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.77rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="បន្ថែម Logo / Sticker PNG ពីម៉ាស៊ីន"
            >
              <AppIcon name="sparkles" size={14} />
              PNG Element ពីម៉ាស៊ីន
            </button>
          </div>
        </div>

        {!templatesLoaded ? (
          <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            កំពុងផ្ទុក Template សាលា...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div
            style={{
              padding: '1.35rem 1rem',
              borderRadius: '14px',
              border: '1.5px dashed var(--border-color)',
              background: 'var(--main-bg)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.55rem',
            }}
          >
            <AppIcon name="layers" size={28} style={{ opacity: 0.45 }} />
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {templates.length === 0
                ? 'មិនទាន់មាន Template ស៊ុមរូបថតនៅឡើយទេ'
                : 'រកមិនឃើញ Template ដែលត្រូវនឹងការស្វែងរក'}
            </div>
            <div style={{ fontSize: '0.78rem', maxWidth: '480px' }}>
              អ្នកអាចបង្កើត Template ដោយភ្ជាប់ Link PNG ថ្លាពី Google Drive ដើម្បីឱ្យគ្រូទាំងអស់ប្រើរួមគ្នា ឬជ្រើស PNG ពីម៉ាស៊ីនផ្ទាល់។
            </div>
            {canCreateTemplate && templates.length === 0 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditingTemplate(null);
                  setIsTemplateModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}
              >
                <AppIcon name="plus" size={16} />
                បង្កើត Template ដំបូង (Google Drive PNG)
              </button>
            )}
          </div>
        ) : (
          <div className="photo-frame-template-strip">
            {filteredTemplates.map((tpl) => {
              const isApplied = currentOverlays.some((ov) => ov.templateId === tpl.id);
              const canModify = isAdmin || (Boolean(currentUserId) && tpl.createdById === currentUserId);
              const proxiedThumb = buildProxyImageUrl(tpl.imageUrl);

              return (
                <div
                  key={tpl.id}
                  style={{
                    minWidth: '176px',
                    maxWidth: '196px',
                    flex: '0 0 auto',
                    borderRadius: '14px',
                    border: `1.5px solid ${isApplied ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: isApplied
                      ? 'color-mix(in srgb, var(--accent-primary) 7%, var(--card-bg))'
                      : 'var(--main-bg)',
                    padding: '0.55rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                >
                  {/* Thumbnail Preview */}
                  <div
                    onClick={() => applyTemplateToStudio(tpl, 'apply')}
                    className="photo-frame-checkerboard"
                    style={{
                      height: '104px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      padding: '4px',
                    }}
                    title="ចុចដើម្បីប្រើ Template នេះ"
                  >
                    <img
                      src={proxiedThumb}
                      alt={tpl.name}
                      loading="lazy"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.42rem',
                        borderRadius: '999px',
                        background: tpl.category === 'frame' ? 'rgba(59, 130, 246, 0.92)' : 'rgba(139, 92, 246, 0.92)',
                        color: '#ffffff',
                      }}
                    >
                      {tpl.category === 'frame' ? 'Frame' : 'Element'}
                    </span>
                    {isApplied && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name="check" size={12} />
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={tpl.name}
                    >
                      {tpl.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.69rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      ដោយ {tpl.createdByName || 'សាលា'}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => applyTemplateToStudio(tpl, 'apply')}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0.45rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ប្រើ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplateToStudio(tpl, 'stack')}
                      style={{
                        padding: '0.3rem 0.45rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.18rem',
                      }}
                      title="ដាក់បន្ថែមជា Layer ថ្មីពីលើ"
                    >
                      <AppIcon name="plus" size={12} />
                      Layer
                    </button>
                    {canModify && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setIsTemplateModalOpen(true);
                          }}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="កែប្រែ Template"
                        >
                          <AppIcon name="edit" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '7px',
                            border: '1px solid rgba(239, 68, 68, 0.28)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="លុប Template"
                        >
                          <AppIcon name="trash" size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Interactive Twibbonize Studio (2-column Desktop, Stacked Mobile) */}
      <div className="photo-frame-studio-grid">
        {/* LEFT COLUMN: Canvas Preview & Batch Photo Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', minWidth: 0 }}>
          {/* Interactive Canvas Panel */}
          <div
            ref={mainPreviewCardRef}
            className="glass-panel"
            style={{
              padding: '1rem',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              scrollMarginTop: '14px',
            }}
          >
            {/* Top Mode Switcher Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setEditMode('photo')}
                  style={{
                    padding: '0.44rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${editMode === 'photo' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background:
                      editMode === 'photo'
                        ? 'var(--accent-primary)'
                        : 'var(--main-bg)',
                    color: editMode === 'photo' ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <AppIcon name="image" size={15} />
                  សារ៉េរូបថត (Photo)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentOverlays.length > 0) setEditMode('overlay');
                  }}
                  disabled={currentOverlays.length === 0}
                  style={{
                    padding: '0.44rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${editMode === 'overlay' ? '#8b5cf6' : 'var(--border-color)'}`,
                    background:
                      editMode === 'overlay'
                        ? '#8b5cf6'
                        : 'var(--main-bg)',
                    color: editMode === 'overlay' ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: currentOverlays.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentOverlays.length === 0 ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <AppIcon name="move" size={15} />
                  សារ៉េ Frame / Element
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGridGuides((g) => !g)}
                  style={{
                    padding: '0.38rem 0.65rem',
                    borderRadius: '9px',
                    border: `1px solid ${showGridGuides ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: showGridGuides
                      ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--main-bg))'
                      : 'var(--main-bg)',
                    color: showGridGuides ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <AppIcon name="maximize" size={13} />
                  បន្ទាត់កណ្តាល
                </button>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    padding: '0.32rem 0.6rem',
                    borderRadius: '9px',
                  }}
                >
                  {exportDims.width} × {exportDims.height} px
                </span>
              </div>
            </div>

            {imageErrorMsg && (
              <div
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AppIcon name="alert-triangle" size={15} />
                <span>{imageErrorMsg}</span>
              </div>
            )}

            {/* Live Interactive Canvas Viewport */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFiles(false);
                if (e.dataTransfer.files?.length) addPhotoFiles(e.dataTransfer.files);
              }}
              style={{
                borderRadius: '16px',
                background: 'var(--main-bg)',
                border: `2px ${isDraggingFiles ? 'dashed var(--accent-primary)' : 'solid var(--border-color)'}`,
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '340px',
                position: 'relative',
              }}
            >
              <div
                className="photo-frame-checkerboard"
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: `${previewDims.width}px`,
                  aspectRatio: `${previewDims.width} / ${previewDims.height}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.16)',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                }}
              >
                <canvas
                  ref={canvasRef}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    touchAction: 'none',
                    cursor: activePhoto || currentOverlays.length > 0 ? 'grab' : 'default',
                  }}
                />

                {/* Empty photo prompt overlay when no photo uploaded yet */}
                {!activePhoto && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.25rem',
                      textAlign: 'center',
                      background: currentOverlays.length > 0 ? 'rgba(15, 23, 42, 0.28)' : 'transparent',
                      pointerEvents: 'none',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{
                        pointerEvents: 'auto',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'var(--accent-gradient)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 10px 24px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      <AppIcon name="upload" size={18} />
                      ជ្រើស ឬអូសរូបថតចូលទីនេះ (បានច្រើនរូប)
                    </button>
                    <span
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color: currentOverlays.length > 0 ? '#ffffff' : 'var(--text-secondary)',
                        textShadow: currentOverlays.length > 0 ? '0 1px 4px rgba(0,0,0,0.65)' : 'none',
                      }}
                    >
                      ដំណើរការលើ Browser ផ្ទាល់ • មិន Save រូបចូល Database ឡើយ
                    </span>
                  </div>
                )}

                {loadingImageCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.78)',
                      color: '#ffffff',
                      padding: '0.32rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <AppIcon name="refresh-cw" size={13} />
                    កំពុងផ្ទុក PNG...
                  </div>
                )}
              </div>

              {/* Gesture Hint */}
              <div
                style={{
                  marginTop: '0.65rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <AppIcon name="move" size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>
                  អូសលើរូបដើម្បីរំកិល • បង្វិល Mouse ឬប្រើម្រាមដៃ ២ ដើម្បីពង្រីក/ពង្រួម — កំពុងសារ៉េ៖{' '}
                  <strong style={{ color: editMode === 'overlay' ? '#8b5cf6' : 'var(--accent-primary)' }}>
                    {editMode === 'overlay' ? activeOverlay?.name || 'Frame/Element' : 'រូបថត'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Bottom Navigation & Approval Bar */}
            {activePhoto && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  paddingTop: '0.2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    disabled={activePhotoIndex <= 0}
                    onClick={() => {
                      if (activePhotoIndex > 0) setSelectedPhotoId(photos[activePhotoIndex - 1].id);
                    }}
                    style={{
                      padding: '0.42rem 0.65rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--main-bg)',
                      color: 'var(--text-primary)',
                      cursor: activePhotoIndex <= 0 ? 'not-allowed' : 'pointer',
                      opacity: activePhotoIndex <= 0 ? 0.45 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <AppIcon name="chevron-left" size={15} />
                    មុន
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.25rem' }}>
                    រូបទី {activePhotoIndex + 1} / {photos.length}
                  </span>
                  <button
                    type="button"
                    disabled={activePhotoIndex >= photos.length - 1}
                    onClick={() => {
                      if (activePhotoIndex < photos.length - 1) setSelectedPhotoId(photos[activePhotoIndex + 1].id);
                    }}
                    style={{
                      padding: '0.42rem 0.65rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--main-bg)',
                      color: 'var(--text-primary)',
                      cursor: activePhotoIndex >= photos.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: activePhotoIndex >= photos.length - 1 ? 0.45 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    បន្ទាប់
                    <AppIcon name="chevron-right" size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleApproveCurrentPhoto}
                    style={{
                      padding: '0.48rem 0.95rem',
                      borderRadius: '10px',
                      border: activePhoto.approved ? '1.5px solid #10b981' : 'none',
                      background: activePhoto.approved ? 'rgba(16, 185, 129, 0.14)' : '#10b981',
                      color: activePhoto.approved ? '#059669' : '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <AppIcon name="check-circle" size={16} />
                    {activePhoto.approved ? 'បានយល់ព្រមរួច (ចុចដកវិញ)' : 'យល់ព្រមរូបនេះ'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSingle}
                    disabled={isExporting}
                    style={{
                      padding: '0.48rem 0.9rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: isExporting ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <AppIcon name="download" size={15} />
                    ទាញយករូបនេះ (x{qualityMultiplier})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batch Photo Queue Strip */}
          <div className="glass-panel" style={{ padding: '0.95rem 1.05rem', borderRadius: '18px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.55rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <AppIcon name="camera" size={17} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  បញ្ជីរូបថត ({photos.length})
                </h3>
                {photos.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.16rem 0.55rem',
                      borderRadius: '999px',
                      background: approvedCount === photos.length ? 'rgba(16, 185, 129, 0.14)' : 'rgba(59, 130, 246, 0.12)',
                      color: approvedCount === photos.length ? '#059669' : 'var(--accent-primary)',
                    }}
                  >
                    យល់ព្រម {approvedCount}/{photos.length}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    padding: '0.35rem 0.68rem',
                    borderRadius: '9px',
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)',
                    background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--main-bg))',
                    color: 'var(--accent-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <AppIcon name="plus" size={14} />
                  បន្ថែមរូប
                </button>
                {photos.length > 0 && approvedCount < photos.length && (
                  <button
                    type="button"
                    onClick={handleApproveAllPhotos}
                    style={{
                      padding: '0.35rem 0.68rem',
                      borderRadius: '9px',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <AppIcon name="check-circle" size={14} />
                    យល់ព្រមទាំងអស់
                  </button>
                )}
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPhotos}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '9px',
                      border: '1px solid rgba(239, 68, 68, 0.28)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.28rem',
                    }}
                  >
                    <AppIcon name="trash" size={13} />
                    សម្អាត
                  </button>
                )}
              </div>
            </div>

            {photos.length === 0 ? (
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1.5px dashed var(--border-color)',
                  background: 'var(--main-bg)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ចុចទីនេះ ឬអូសរូបថតច្រើនចូល ដើម្បីចាប់ផ្តើមដាក់ស៊ុមព្រមគ្នា
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.55rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                {photos.map((item, idx) => {
                  const selected = activePhoto?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPhotoId(item.id)}
                      style={{
                        width: '92px',
                        flex: '0 0 auto',
                        borderRadius: '11px',
                        border: `2px solid ${
                          selected ? 'var(--accent-primary)' : item.approved ? '#10b981' : 'var(--border-color)'
                        }`,
                        background: 'var(--main-bg)',
                        padding: '4px',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '68px', borderRadius: '7px', overflow: 'hidden' }}>
                        <img
                          src={item.previewUrl}
                          alt={item.fileName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            left: '3px',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '5px',
                            background: 'rgba(15, 23, 42, 0.72)',
                            color: '#ffffff',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        {item.approved && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: '3px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#10b981',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <AppIcon name="check" size={11} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(item.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            width: '19px',
                            height: '19px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(15, 23, 42, 0.72)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="ដករូបនេះចេញ"
                        >
                          <AppIcon name="x" size={11} />
                        </button>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'center',
                        }}
                        title={item.fileName}
                      >
                        {item.fileName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Transform Controls & High-Res Batch Export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', minWidth: 0 }}>
          {/* PANEL A: Precision Transform Controls */}
          <div className="glass-panel" style={{ padding: '1rem 1.05rem', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AppIcon
                  name="sliders"
                  size={17}
                  style={{ color: editMode === 'overlay' ? '#8b5cf6' : 'var(--accent-primary)' }}
                />
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editMode === 'overlay' ? 'សារ៉េទំហំ & ទីតាំង Frame / Element' : 'សារ៉េទំហំ & ទីតាំងរូបថត'}
                </h3>
              </div>
            </div>

            {editMode === 'photo' ? (
              activePhoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.78rem' }}>
                  {/* Fit Mode */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                    {[
                      { val: 'cover' as const, label: 'ពេញស៊ុម (Cover)' },
                      { val: 'contain' as const, label: 'បង្ហាញទាំងមូល (Contain)' },
                    ].map((opt) => {
                      const active = activePhoto.photoTransform.fitMode === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => updateActivePhotoTransform((pt) => ({ ...pt, fitMode: opt.val, scale: 1, x: 0, y: 0 }))}
                          style={{
                            padding: '0.42rem 0.55rem',
                            borderRadius: '9px',
                            fontSize: '0.77rem',
                            fontWeight: 700,
                            border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            background: active
                              ? 'color-mix(in srgb, var(--accent-primary) 13%, var(--main-bg))'
                              : 'var(--main-bg)',
                            color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Photo Zoom */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ពង្រីក / ពង្រួមរូបថត
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {Math.round(activePhoto.photoTransform.scale * 100)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() =>
                          updateActivePhotoTransform((pt) => ({
                            ...pt,
                            scale: Math.max(0.2, Number((pt.scale - 0.1).toFixed(2))),
                          }))
                        }
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--main-bg)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <AppIcon name="zoom-out" size={14} />
                      </button>
                      <input
                        type="range"
                        min={0.2}
                        max={4}
                        step={0.02}
                        value={activePhoto.photoTransform.scale}
                        onChange={(e) =>
                          updateActivePhotoTransform((pt) => ({ ...pt, scale: Number(e.target.value) }))
                        }
                        style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateActivePhotoTransform((pt) => ({
                            ...pt,
                            scale: Math.min(4, Number((pt.scale + 0.1).toFixed(2))),
                          }))
                        }
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--main-bg)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <AppIcon name="zoom-in" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Photo Rotation */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        បង្វិលរូបថត
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {Math.round(activePhoto.photoTransform.rotation)}°
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateActivePhotoTransform((pt) => {
                              let next = pt.rotation + 90;
                              if (next > 180) next -= 360;
                              return { ...pt, rotation: next };
                            })
                          }
                          style={{
                            padding: '0.18rem 0.48rem',
                            borderRadius: '7px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--main-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <AppIcon name="rotate-cw" size={12} />
                          +90°
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={activePhoto.photoTransform.rotation}
                      onChange={(e) =>
                        updateActivePhotoTransform((pt) => ({ ...pt, rotation: Number(e.target.value) }))
                      }
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => updateActivePhotoTransform(() => ({ ...DEFAULT_PHOTO_TRANSFORM }))}
                    style={{
                      padding: '0.42rem 0.7rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--main-bg)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.77rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <AppIcon name="refresh-cw" size={14} />
                    កំណត់រូបថតទៅកណ្តាលដើមវិញ
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.4rem 0' }}>
                  សូមបញ្ចូលរូបថតយ៉ាងតិច ១ រូប ដើម្បីចាប់ផ្តើមសារ៉េទំហំ និងទីតាំងរូបថត។
                </div>
              )
            ) : (
              /* OVERLAY (FRAME / ELEMENT) CONTROLS */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.78rem' }}>
                {/* Layer Stack List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ជ្រើស Layer ដែលត្រូវសារ៉េ ({currentOverlays.length})
                  </div>
                  {currentOverlays.map((ov, i) => {
                    const isSelected = activeOverlay?.id === ov.id;
                    return (
                      <div
                        key={ov.id}
                        onClick={() => setActiveOverlayId(ov.id)}
                        style={{
                          padding: '0.42rem 0.55rem',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected ? '#8b5cf6' : 'var(--border-color)'}`,
                          background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--main-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.4rem',
                              borderRadius: '6px',
                              background: ov.category === 'frame' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                              color: ov.category === 'frame' ? '#2563eb' : '#7c3aed',
                              flexShrink: 0,
                            }}
                          >
                            {ov.category === 'frame' ? 'Frame' : 'Element'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.79rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              opacity: ov.visible ? 1 : 0.45,
                            }}
                          >
                            {ov.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCurrentOverlays((list) =>
                                list.map((l) => (l.id === ov.id ? { ...l, visible: !l.visible } : l))
                              );
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: ov.visible ? 'var(--text-primary)' : 'var(--text-secondary)',
                              opacity: ov.visible ? 1 : 0.4,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={ov.visible ? 'លាក់ Layer' : 'បង្ហាញ Layer'}
                          >
                            <AppIcon name="eye" size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={i === currentOverlays.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveOverlayOrder(ov.id, 1);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              opacity: i === currentOverlays.length - 1 ? 0.3 : 1,
                              cursor: i === currentOverlays.length - 1 ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="រំកិលឡើងលើ"
                          >
                            <AppIcon name="arrow-up" size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveOverlayOrder(ov.id, -1);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              opacity: i === 0 ? 0.3 : 1,
                              cursor: i === 0 ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="រំកិលចុះក្រោម"
                          >
                            <AppIcon name="arrow-down" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOverlayLayer(ov.id);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="ដក Layer ចេញ"
                          >
                            <AppIcon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeOverlay && (
                  <>
                    {/* Overlay Scale */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.28rem' }}>
                        <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ទំហំ {activeOverlay.category === 'frame' ? 'ស៊ុម' : 'Element'}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b5cf6' }}>
                          {Math.round(activeOverlay.scale * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveOverlay((ov) => ({
                              ...ov,
                              scale: Math.max(0.05, Number((ov.scale - 0.05).toFixed(2))),
                            }))
                          }
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--main-bg)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <AppIcon name="zoom-out" size={14} />
                        </button>
                        <input
                          type="range"
                          min={0.05}
                          max={3}
                          step={0.01}
                          value={activeOverlay.scale}
                          onChange={(e) => updateActiveOverlay((ov) => ({ ...ov, scale: Number(e.target.value) }))}
                          style={{ flex: 1, accentColor: '#8b5cf6' }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveOverlay((ov) => ({
                              ...ov,
                              scale: Math.min(3, Number((ov.scale + 0.05).toFixed(2))),
                            }))
                          }
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--main-bg)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <AppIcon name="zoom-in" size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Overlay Rotation */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.28rem' }}>
                        <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          បង្វិល Layer
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {Math.round(activeOverlay.rotation)}°
                          </span>
                          <button
                            type="button"
                            onClick={() => updateActiveOverlay((ov) => ({ ...ov, rotation: 0 }))}
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--main-bg)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                            }}
                          >
                            0°
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={activeOverlay.rotation}
                        onChange={(e) => updateActiveOverlay((ov) => ({ ...ov, rotation: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                      />
                    </div>

                    {/* Overlay Opacity */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ភាពច្បាស់ (Opacity)
                        </span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {Math.round(activeOverlay.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.02}
                        value={activeOverlay.opacity}
                        onChange={(e) => updateActiveOverlay((ov) => ({ ...ov, opacity: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                      />
                    </div>

                    {/* Quick Position Snap Grid */}
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        ដាក់ទីតាំងរហ័ស (Quick Snap)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.32rem' }}>
                        {[
                          { id: 'top-left' as OverlaySnapPreset, label: 'លើឆ្វេង' },
                          { id: 'top-center' as OverlaySnapPreset, label: 'លើកណ្តាល' },
                          { id: 'top-right' as OverlaySnapPreset, label: 'លើស្តាំ' },
                          { id: 'center' as OverlaySnapPreset, label: 'កណ្តាល' },
                          { id: 'bottom-left' as OverlaySnapPreset, label: 'ក្រោមឆ្វេង' },
                          { id: 'bottom-center' as OverlaySnapPreset, label: 'ក្រោម' },
                          { id: 'bottom-right' as OverlaySnapPreset, label: 'ក្រោមស្តាំ' },
                          { id: 'full' as OverlaySnapPreset, label: 'ពេញ 100%' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleSnapOverlay(btn.id)}
                            style={{
                              padding: '0.32rem 0.25rem',
                              borderRadius: '7px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--main-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {photos.length > 1 && (
                      <button
                        type="button"
                        onClick={handleApplyOverlaysToAllPhotos}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#7c3aed',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <AppIcon name="copy" size={14} />
                        អនុវត្តទំហំ & ទីតាំងនេះទៅគ្រប់ {photos.length} រូប
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* PANEL B: Quality (x1 - x6), Size & Batch Export */}
          <div className="glass-panel" style={{ padding: '1rem 1.05rem', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AppIcon name="download" size={17} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                គុណភាពរូប (Quality) & ទាញយក
              </h3>
            </div>

            {/* Quality Multiplier Pills x1..x6 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  កម្រិតគុណភាព (Quality)
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    background: 'color-mix(in srgb, var(--accent-primary) 11%, var(--main-bg))',
                    padding: '0.15rem 0.52rem',
                    borderRadius: '999px',
                  }}
                >
                  {exportDims.width} × {exportDims.height} px
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0.35rem' }}>
                {QUALITY_MULTIPLIERS.map((mult) => {
                  const active = qualityMultiplier === mult;
                  return (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setQualityMultiplier(mult)}
                      style={{
                        padding: '0.45rem 0.25rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        background: active ? 'var(--accent-primary)' : 'var(--main-bg)',
                        color: active ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      x{mult}
                    </button>
                  );
                })}
              </div>
              {exportDims.wasCapped && (
                <div style={{ marginTop: '0.3rem', fontSize: '0.71rem', color: 'var(--warning)' }}>
                  ទំហំត្រូវបានកំណត់ត្រឹមអតិបរមាដែល Browser គាំទ្រ ({exportDims.width}×{exportDims.height}px) ដើម្បីកុំឱ្យគាំង។
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.32rem' }}>
                សមាមាត្ររូបភាព (Aspect Ratio)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
                {ASPECT_RATIO_OPTIONS.map((opt) => {
                  const active = aspectMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAspectMode(opt.value)}
                      style={{
                        padding: '0.32rem 0.56rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        background: active
                          ? 'color-mix(in srgb, var(--accent-primary) 14%, var(--main-bg))'
                          : 'var(--main-bg)',
                        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format & Background Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  ទម្រង់ឯកសារ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  {[
                    { val: 'png' as ExportFormat, label: 'PNG' },
                    { val: 'jpeg' as ExportFormat, label: 'JPG' },
                  ].map((f) => {
                    const active = exportFormat === f.val;
                    return (
                      <button
                        key={f.val}
                        type="button"
                        onClick={() => setExportFormat(f.val)}
                        style={{
                          padding: '0.36rem 0.4rem',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          background: active
                            ? 'color-mix(in srgb, var(--accent-primary) 13%, var(--main-bg))'
                            : 'var(--main-bg)',
                          color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  ផ្ទៃខាងក្រោយ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('transparent')}
                    className="photo-frame-checkerboard"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      border: `2px solid ${backgroundColor === 'transparent' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                    }}
                    title="ថ្លា (Transparent)"
                  />
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#ffffff')}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: '#ffffff',
                      border: `2px solid ${backgroundColor === '#ffffff' ? 'var(--accent-primary)' : '#cbd5e1'}`,
                      cursor: 'pointer',
                    }}
                    title="ពណ៌ស"
                  />
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#0f172a')}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: '#0f172a',
                      border: `2px solid ${backgroundColor === '#0f172a' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                    }}
                    title="ពណ៌ខ្មៅ"
                  />
                  <input
                    type="color"
                    value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{
                      width: '28px',
                      height: '28px',
                      padding: 0,
                      border: '1px solid var(--border-color)',
                      borderRadius: '7px',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                    title="ជ្រើសពណ៌ផ្ទៃខាងក្រោយ"
                  />
                </div>
              </div>
            </div>

            {/* Approved-only toggle when multiple photos exist */}
            {photos.length > 1 && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={exportApprovedOnly}
                  onChange={(e) => setExportApprovedOnly(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                />
                <span>
                  ទាញយកតែរូបដែលបានយល់ព្រម ({approvedCount}/{photos.length} រូប)
                </span>
              </label>
            )}

            {/* Progress Bar during Export */}
            {exportProgress && (
              <div
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '11px',
                  background: 'color-mix(in srgb, var(--accent-primary) 10%, var(--main-bg))',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 26%, transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  <span>{exportProgress.label}</span>
                  {exportProgress.total > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        exportCancelRef.current = true;
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      បញ្ឈប់
                    </button>
                  )}
                </div>
                <div style={{ height: '7px', borderRadius: '999px', background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round((exportProgress.current / Math.max(1, exportProgress.total)) * 100)}%`,
                      height: '100%',
                      background: 'var(--accent-gradient)',
                      transition: 'width 0.18s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Export Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isExporting || exportTargetCount === 0}
                onClick={() => handleBatchDownload('zip')}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.72rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  opacity: exportTargetCount === 0 ? 0.55 : 1,
                }}
              >
                <AppIcon name="package" size={18} />
                ទាញយកទាំងអស់ជា ZIP ({exportTargetCount} រូប • x{qualityMultiplier})
              </button>

              <button
                type="button"
                disabled={isExporting || exportTargetCount === 0}
                onClick={() => handleBatchDownload('individual')}
                style={{
                  width: '100%',
                  padding: '0.62rem 0.9rem',
                  borderRadius: '11px',
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--main-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isExporting || exportTargetCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: exportTargetCount === 0 ? 0.55 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                }}
              >
                <AppIcon name="download" size={16} />
                ទាញយកម្តងមួយៗ ({exportTargetCount} រូប — ងាយស្រួលលើទូរស័ព្ទ)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Live Preview Card (appears automatically when scrolling down to tools on mobile) */}
      {mounted && showMobileFloating && !isTemplateModalOpen &&
        createPortal(
          <div className="mobile-floating-preview-shell">
            {floatingCollapsed ? (
              <button
                type="button"
                onClick={() => setFloatingCollapsed(false)}
                className="mobile-floating-preview-pill"
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.28)',
                  }}
                />
                <AppIcon name="eye" size={15} />
                <span>បង្ហាញ Live Preview</span>
              </button>
            ) : (
              <div className="mobile-floating-preview-card">
                {/* Compact Header Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      មើលលទ្ធផលផ្ទាល់
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        background: 'color-mix(in srgb, var(--accent-primary) 12%, var(--main-bg))',
                        padding: '0.1rem 0.42rem',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {exportDims.width}×{exportDims.height}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setFloatingExpanded((v) => !v)}
                      style={{
                        padding: '0.22rem 0.45rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--main-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.69rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                      }}
                      title={floatingExpanded ? 'បង្រួមរូប Preview' : 'ពង្រីករូប Preview'}
                    >
                      <AppIcon name={floatingExpanded ? 'zoom-out' : 'maximize'} size={12} />
                      {floatingExpanded ? 'តូច' : 'ធំ'}
                    </button>

                    <button
                      type="button"
                      onClick={() => mainPreviewCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--main-bg)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="ត្រឡប់ឡើងលើទៅផ្ទាំង Preview ធំ"
                    >
                      <AppIcon name="arrow-up" size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFloatingCollapsed(true)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--main-bg)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="លាក់ Live Preview បណ្តោះអាសន្ន"
                    >
                      <AppIcon name="x" size={13} />
                    </button>
                  </div>
                </div>

                {/* Live Interactive Preview Body */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: floatingExpanded ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  {/* Synced Interactive Canvas */}
                  <div
                    className="photo-frame-checkerboard"
                    style={{
                      width: `${floatingCanvasDims.width}px`,
                      height: `${floatingCanvasDims.height}px`,
                      maxWidth: '100%',
                      borderRadius: '11px',
                      overflow: 'hidden',
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      boxShadow: '0 6px 18px rgba(15, 23, 42, 0.16)',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                  >
                    <canvas
                      ref={floatingCanvasRef}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      onPointerCancel={handleCanvasPointerUp}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        touchAction: 'none',
                      }}
                    />
                    {!activePhoto && currentOverlays.length === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.4rem',
                          textAlign: 'center',
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        មិនទាន់មានរូប
                      </div>
                    )}
                  </div>

                  {/* Quick Floating Controls beside / below canvas */}
                  <div
                    style={{
                      flex: 1,
                      width: floatingExpanded ? '100%' : 'auto',
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.42rem',
                    }}
                  >
                    {/* Quick Layer Mode Switcher */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.32rem' }}>
                      <button
                        type="button"
                        onClick={() => setEditMode('photo')}
                        style={{
                          padding: '0.32rem 0.4rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${editMode === 'photo' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          background: editMode === 'photo' ? 'var(--accent-primary)' : 'var(--main-bg)',
                          color: editMode === 'photo' ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <AppIcon name="image" size={12} />
                        រូបថត
                      </button>
                      <button
                        type="button"
                        disabled={currentOverlays.length === 0}
                        onClick={() => {
                          if (currentOverlays.length > 0) setEditMode('overlay');
                        }}
                        style={{
                          padding: '0.32rem 0.4rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${editMode === 'overlay' ? '#8b5cf6' : 'var(--border-color)'}`,
                          background: editMode === 'overlay' ? '#8b5cf6' : 'var(--main-bg)',
                          color: editMode === 'overlay' ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: currentOverlays.length === 0 ? 'not-allowed' : 'pointer',
                          opacity: currentOverlays.length === 0 ? 0.45 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <AppIcon name="move" size={12} />
                        Element
                      </button>
                    </div>

                    {/* Photo Switcher & Quick Approve */}
                    {activePhoto ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={activePhotoIndex <= 0}
                              onClick={() => {
                                if (activePhotoIndex > 0) setSelectedPhotoId(photos[activePhotoIndex - 1].id);
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--main-bg)',
                                color: 'var(--text-primary)',
                                opacity: activePhotoIndex <= 0 ? 0.4 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: activePhotoIndex <= 0 ? 'default' : 'pointer',
                              }}
                            >
                              <AppIcon name="chevron-left" size={14} />
                            </button>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {activePhotoIndex + 1}/{photos.length}
                            </span>
                            <button
                              type="button"
                              disabled={activePhotoIndex >= photos.length - 1}
                              onClick={() => {
                                if (activePhotoIndex < photos.length - 1) setSelectedPhotoId(photos[activePhotoIndex + 1].id);
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--main-bg)',
                                color: 'var(--text-primary)',
                                opacity: activePhotoIndex >= photos.length - 1 ? 0.4 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: activePhotoIndex >= photos.length - 1 ? 'default' : 'pointer',
                              }}
                            >
                              <AppIcon name="chevron-right" size={14} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={handleApproveCurrentPhoto}
                          style={{
                            flex: 1,
                            height: '28px',
                            padding: '0 0.5rem',
                            borderRadius: '8px',
                            border: activePhoto.approved ? '1px solid #10b981' : 'none',
                            background: activePhoto.approved ? 'rgba(16, 185, 129, 0.14)' : '#10b981',
                            color: activePhoto.approved ? '#059669' : '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <AppIcon name="check-circle" size={13} />
                          {activePhoto.approved ? 'យល់ព្រមរួច' : 'យល់ព្រម'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        style={{
                          padding: '0.38rem 0.55rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--accent-primary)',
                          color: '#ffffff',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <AppIcon name="upload" size={13} />
                        បន្ថែមរូបថត
                      </button>
                    )}

                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.3,
                      }}
                    >
                      អូស ឬពង្រីកលើរូបនេះផ្ទាល់បាន ខណៈសារ៉េ Tool ខាងក្រោម
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Create / Edit Shared Template Modal */}
      <TemplateFormModal
        isOpen={isTemplateModalOpen}
        editingTemplate={editingTemplate}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSaved={(saved) => {
          applyTemplateToStudio(saved, 'apply');
          showToast('success', `បានរក្សាទុក Template "${saved.name}" ជោគជ័យ!`);
        }}
      />
    </div>
  );
}
