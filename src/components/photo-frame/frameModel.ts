export type TemplateCategory = 'frame' | 'element';

export type AspectRatioMode = 'auto' | 'photo' | '1:1' | '4:5' | '3:4' | '16:9' | '9:16';

export type ExportFormat = 'png' | 'jpeg';

export type OverlaySnapPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'full';

export interface FrameTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  imageUrl: string;
  defaultAspect?: AspectRatioMode;
  defaultScale?: number;
  defaultX?: number;
  defaultY?: number;
  createdById?: string;
  createdByName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface PhotoTransform {
  x: number; // Normalized offset relative to canvas width (0 = centered)
  y: number; // Normalized offset relative to canvas height (0 = centered)
  scale: number; // Multiplier on base fit scale (1 = 100%)
  rotation: number; // Degrees (-180..180)
  fitMode: 'cover' | 'contain';
}

export interface PhotoAdjustments {
  presetId: string;
  brightness: number; // -50..50 (0 = neutral)
  contrast: number;   // -50..50 (0 = neutral)
  saturation: number; // -100..100 (0 = neutral, -100 = B&W)
  warmth: number;     // -50..50 (negative = cool, positive = warm)
  skinGlow: number;   // 0..50 (subtle portrait glow/softness)
  fade: number;       // 0..50 (matte shadow lift)
  vignette: number;   // 0..80 (radial edge vignette)
}

export interface RetouchPreset {
  id: string;
  name: string;
  swatch: string;
  values: Omit<PhotoAdjustments, 'presetId'>;
}

export interface OverlayLayer {
  id: string;
  name: string;
  category: TemplateCategory;
  imageUrl: string;
  proxySrc: string;
  x: number; // Normalized offset from canvas center (-0.5..0.5)
  y: number; // Normalized offset from canvas center (-0.5..0.5)
  scale: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  templateId?: string;
  isLocal?: boolean;
}

export interface BatchPhotoItem {
  id: string;
  fileName: string;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  photoTransform: PhotoTransform;
  photoAdjustments: PhotoAdjustments;
  overlays: OverlayLayer[];
  approved: boolean;
}

export const QUALITY_MULTIPLIERS = [1, 2, 3, 4, 5, 6] as const;

export const ASPECT_RATIO_OPTIONS: { value: AspectRatioMode; label: string; shortLabel: string }[] = [
  { value: 'auto', label: 'តាមស៊ុម (Auto Frame)', shortLabel: 'តាមស៊ុម' },
  { value: 'photo', label: 'តាមរូបដើម (Original Photo)', shortLabel: 'តាមរូបដើម' },
  { value: '1:1', label: 'ការ៉េ 1:1 (Square)', shortLabel: '1:1' },
  { value: '4:5', label: 'បញ្ឈរ 4:5 (FB / IG)', shortLabel: '4:5' },
  { value: '3:4', label: 'បញ្ឈរ 3:4 (Portrait)', shortLabel: '3:4' },
  { value: '16:9', label: 'ផ្តេក 16:9 (Landscape)', shortLabel: '16:9' },
  { value: '9:16', label: 'Story 9:16 (Vertical)', shortLabel: '9:16' },
];

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  fitMode: 'cover',
};

export const DEFAULT_PHOTO_ADJUSTMENTS: PhotoAdjustments = {
  presetId: 'original',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  skinGlow: 0,
  fade: 0,
  vignette: 0,
};

export const RETOUCH_PRESETS: RetouchPreset[] = [
  {
    id: 'original',
    name: 'ដើម (Original)',
    swatch: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
    values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, skinGlow: 0, fade: 0, vignette: 0 },
  },
  {
    id: 'portrait_glow',
    name: 'មុខភ្លឺរលោង',
    swatch: 'linear-gradient(135deg, #fde68a, #f9a8d4)',
    values: { brightness: 8, contrast: 6, saturation: 6, warmth: 10, skinGlow: 26, fade: 6, vignette: 12 },
  },
  {
    id: 'bright_clean',
    name: 'ភ្លឺថ្លាស្អាត',
    swatch: 'linear-gradient(135deg, #f8fafc, #93c5fd)',
    values: { brightness: 16, contrast: 8, saturation: 8, warmth: 4, skinGlow: 12, fade: 4, vignette: 0 },
  },
  {
    id: 'vivid_school',
    name: 'ពណ៌ស្រស់ច្បាស់',
    swatch: 'linear-gradient(135deg, #34d399, #3b82f6)',
    values: { brightness: 6, contrast: 18, saturation: 28, warmth: 6, skinGlow: 0, fade: 0, vignette: 10 },
  },
  {
    id: 'warm_sunlight',
    name: 'ពន្លឺកក់ក្តៅ',
    swatch: 'linear-gradient(135deg, #fbbf24, #f97316)',
    values: { brightness: 10, contrast: 10, saturation: 14, warmth: 28, skinGlow: 14, fade: 6, vignette: 16 },
  },
  {
    id: 'soft_pastel',
    name: 'ទន់ភ្លន់',
    swatch: 'linear-gradient(135deg, #fbcfe8, #c4b5fd)',
    values: { brightness: 14, contrast: -8, saturation: -8, warmth: 8, skinGlow: 20, fade: 22, vignette: 8 },
  },
  {
    id: 'cool_crisp',
    name: 'ត្រជាក់ច្បាស់',
    swatch: 'linear-gradient(135deg, #67e8f9, #38bdf8)',
    values: { brightness: 6, contrast: 14, saturation: 4, warmth: -22, skinGlow: 6, fade: 0, vignette: 12 },
  },
  {
    id: 'studio_pro',
    name: 'Studio Pro',
    swatch: 'linear-gradient(135deg, #6366f1, #1e293b)',
    values: { brightness: 5, contrast: 16, saturation: 10, warmth: 6, skinGlow: 16, fade: 4, vignette: 26 },
  },
  {
    id: 'vintage_film',
    name: 'ហ្វីលបុរាណ',
    swatch: 'linear-gradient(135deg, #d97706, #78716c)',
    values: { brightness: 4, contrast: 8, saturation: -18, warmth: 22, skinGlow: 8, fade: 24, vignette: 30 },
  },
  {
    id: 'bw_classic',
    name: 'ស-ខ្មៅ (B&W)',
    swatch: 'linear-gradient(135deg, #f8fafc, #0f172a)',
    values: { brightness: 4, contrast: 22, saturation: -100, warmth: 0, skinGlow: 6, fade: 6, vignette: 24 },
  },
];

export function hasActiveAdjustments(adj?: PhotoAdjustments | null): boolean {
  if (!adj) return false;
  return (
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.warmth !== 0 ||
    adj.skinGlow !== 0 ||
    adj.fade !== 0 ||
    adj.vignette !== 0
  );
}

const BASE_REFERENCE_PX = 1080;
const MAX_CANVAS_EDGE_PX = 8192;
const MAX_CANVAS_AREA_PX = 64_000_000; // ~8000x8000 safe ceiling for browser canvas toBlob

export function createUid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildProxyImageUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('/api/proxy-image')) {
    return trimmed;
  }
  return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
}

export function normalizeTemplateRecord(raw: any): FrameTemplate {
  const category: TemplateCategory = raw?.category === 'element' ? 'element' : 'frame';
  const validAspects: AspectRatioMode[] = ['auto', 'photo', '1:1', '4:5', '3:4', '16:9', '9:16'];
  const defaultAspect: AspectRatioMode = validAspects.includes(raw?.defaultAspect)
    ? raw.defaultAspect
    : category === 'element'
      ? 'photo'
      : 'auto';

  return {
    id: String(raw?.id || ''),
    name: String(raw?.name || 'Template ថ្មី'),
    description: typeof raw?.description === 'string' ? raw.description : '',
    category,
    imageUrl: String(raw?.imageUrl || ''),
    defaultAspect,
    defaultScale: typeof raw?.defaultScale === 'number' && Number.isFinite(raw.defaultScale)
      ? raw.defaultScale
      : category === 'element'
        ? 0.28
        : 1,
    defaultX: typeof raw?.defaultX === 'number' && Number.isFinite(raw.defaultX) ? raw.defaultX : 0,
    defaultY: typeof raw?.defaultY === 'number' && Number.isFinite(raw.defaultY) ? raw.defaultY : 0,
    createdById: typeof raw?.createdById === 'string' ? raw.createdById : '',
    createdByName: typeof raw?.createdByName === 'string' ? raw.createdByName : '',
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : 0,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}

export function createOverlayFromTemplate(template: FrameTemplate): OverlayLayer {
  const isElement = template.category === 'element';
  return {
    id: createUid('ovl'),
    name: template.name,
    category: template.category,
    imageUrl: template.imageUrl,
    proxySrc: buildProxyImageUrl(template.imageUrl),
    x: typeof template.defaultX === 'number' ? template.defaultX : isElement ? 0.32 : 0,
    y: typeof template.defaultY === 'number' ? template.defaultY : isElement ? -0.32 : 0,
    scale: typeof template.defaultScale === 'number' ? template.defaultScale : isElement ? 0.28 : 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    templateId: template.id,
    isLocal: false,
  };
}

export function cloneOverlays(overlays: OverlayLayer[]): OverlayLayer[] {
  return overlays.map((ov) => ({ ...ov, id: createUid('ovl') }));
}

// In-memory HTMLImageElement cache to keep canvas drawing instant across photo switches & batch export
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImageCached(src: string): Promise<HTMLImageElement> {
  if (!src) {
    return Promise.reject(new Error('មិនមាន URL រូបភាព'));
  }
  const existing = imageCache.get(src);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => {
      imageCache.delete(src);
      reject(new Error('មិនអាចផ្ទុករូបភាពបានទេ'));
    };
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

export function evictCachedImage(src: string) {
  if (src) imageCache.delete(src);
}

function parseAspectRatio(
  aspectMode: AspectRatioMode,
  primaryFrameImg?: { naturalWidth: number; naturalHeight: number } | null,
  photoImg?: { naturalWidth: number; naturalHeight: number } | null
): number {
  if (aspectMode === '1:1') return 1;
  if (aspectMode === '4:5') return 4 / 5;
  if (aspectMode === '3:4') return 3 / 4;
  if (aspectMode === '16:9') return 16 / 9;
  if (aspectMode === '9:16') return 9 / 16;

  if (aspectMode === 'photo') {
    if (photoImg && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
      return photoImg.naturalWidth / photoImg.naturalHeight;
    }
    if (primaryFrameImg && primaryFrameImg.naturalWidth > 0 && primaryFrameImg.naturalHeight > 0) {
      return primaryFrameImg.naturalWidth / primaryFrameImg.naturalHeight;
    }
    return 1;
  }

  // 'auto': match primary frame aspect ratio first, fallback to photo, then 1:1
  if (primaryFrameImg && primaryFrameImg.naturalWidth > 0 && primaryFrameImg.naturalHeight > 0) {
    return primaryFrameImg.naturalWidth / primaryFrameImg.naturalHeight;
  }
  if (photoImg && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
    return photoImg.naturalWidth / photoImg.naturalHeight;
  }
  return 1;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
  wasCapped: boolean;
}

export function resolveCanvasDimensions(params: {
  aspectMode: AspectRatioMode;
  primaryFrameImg?: { naturalWidth: number; naturalHeight: number } | null;
  photoImg?: { naturalWidth: number; naturalHeight: number } | null;
  qualityMultiplier: number;
}): CanvasDimensions {
  const ratio = Math.max(0.25, Math.min(4, parseAspectRatio(params.aspectMode, params.primaryFrameImg, params.photoImg)));
  const multiplier = Math.max(1, Math.min(8, Math.round(params.qualityMultiplier || 1)));

  // Standard base: shorter side = 1080px so 1:1 -> 1080x1080, 4:5 -> 1080x1350, 16:9 -> 1920x1080
  let baseWidth: number;
  let baseHeight: number;
  if (ratio >= 1) {
    baseHeight = BASE_REFERENCE_PX;
    baseWidth = Math.round(BASE_REFERENCE_PX * ratio);
  } else {
    baseWidth = BASE_REFERENCE_PX;
    baseHeight = Math.round(BASE_REFERENCE_PX / ratio);
  }

  let width = Math.round(baseWidth * multiplier);
  let height = Math.round(baseHeight * multiplier);
  let wasCapped = false;

  // Enforce browser-safe max edge & total pixel area while keeping exact aspect ratio
  if (width > MAX_CANVAS_EDGE_PX || height > MAX_CANVAS_EDGE_PX) {
    const edgeScale = MAX_CANVAS_EDGE_PX / Math.max(width, height);
    width = Math.max(1, Math.round(width * edgeScale));
    height = Math.max(1, Math.round(height * edgeScale));
    wasCapped = true;
  }

  if (width * height > MAX_CANVAS_AREA_PX) {
    const areaScale = Math.sqrt(MAX_CANVAS_AREA_PX / (width * height));
    width = Math.max(1, Math.round(width * areaScale));
    height = Math.max(1, Math.round(height * areaScale));
    wasCapped = true;
  }

  return { width, height, baseWidth, baseHeight, wasCapped };
}

export function computeOverlayDrawSize(
  layer: OverlayLayer,
  img: { naturalWidth: number; naturalHeight: number },
  canvasW: number,
  canvasH: number
): { drawW: number; drawH: number } {
  const nw = Math.max(1, img.naturalWidth);
  const nh = Math.max(1, img.naturalHeight);
  if (layer.category === 'frame') {
    const baseFit = Math.min(canvasW / nw, canvasH / nh);
    return {
      drawW: nw * baseFit * layer.scale,
      drawH: nh * baseFit * layer.scale,
    };
  }
  // Element (logo / sticker): normalized against canvas shorter side so scale=0.28 looks consistent on all ratios
  const refSide = Math.min(canvasW, canvasH);
  const maxDim = Math.max(nw, nh);
  const baseUnit = refSide / maxDim;
  return {
    drawW: nw * baseUnit * layer.scale,
    drawH: nh * baseUnit * layer.scale,
  };
}

export function computeSnappedOverlayPosition(
  layer: OverlayLayer,
  img: { naturalWidth: number; naturalHeight: number } | null | undefined,
  canvasW: number,
  canvasH: number,
  preset: OverlaySnapPreset
): { x: number; y: number; scale?: number; rotation?: number } {
  if (preset === 'full') {
    return { x: 0, y: 0, scale: 1, rotation: 0 };
  }
  if (preset === 'center' || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    return { x: 0, y: 0 };
  }

  const { drawW, drawH } = computeOverlayDrawSize(layer, img, canvasW, canvasH);
  const pad = Math.min(canvasW, canvasH) * 0.04;
  const maxX = Math.max(0, (canvasW - drawW) / 2 - pad) / canvasW;
  const maxY = Math.max(0, (canvasH - drawH) / 2 - pad) / canvasH;

  switch (preset) {
    case 'top-left':
      return { x: -maxX, y: -maxY };
    case 'top-center':
      return { x: 0, y: -maxY };
    case 'top-right':
      return { x: maxX, y: -maxY };
    case 'bottom-left':
      return { x: -maxX, y: maxY };
    case 'bottom-center':
      return { x: 0, y: maxY };
    case 'bottom-right':
      return { x: maxX, y: maxY };
    default:
      return { x: 0, y: 0 };
  }
}

export interface RenderCompositionOptions {
  photoImg?: HTMLImageElement | null;
  photoTransform: PhotoTransform;
  photoAdjustments?: PhotoAdjustments;
  overlays: OverlayLayer[];
  overlayImages: Record<string, HTMLImageElement | undefined>;
  backgroundColor: string; // 'transparent' or hex color
  activeOverlayIdForGuide?: string | null;
  showGridGuides?: boolean;
}

export function renderCompositionToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: RenderCompositionOptions
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background
  if (options.backgroundColor && options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Base Photo Layer (with Lighting & Retouch Adjustments isolated to the photo only)
  const { photoImg, photoTransform } = options;
  const adj = options.photoAdjustments || DEFAULT_PHOTO_ADJUSTMENTS;
  if (photoImg && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
    const nw = photoImg.naturalWidth;
    const nh = photoImg.naturalHeight;
    const baseScale =
      photoTransform.fitMode === 'contain'
        ? Math.min(width / nw, height / nh)
        : Math.max(width / nw, height / nh);

    const drawW = nw * baseScale * photoTransform.scale;
    const drawH = nh * baseScale * photoTransform.scale;
    const cx = width / 2 + photoTransform.x * width;
    const cy = height / 2 + photoTransform.y * height;

    const supportsFilter = typeof ctx.filter === 'string';
    const bPct = Math.max(30, Math.min(200, Math.round(100 + adj.brightness * 1.1)));
    const cPct = Math.max(30, Math.min(200, Math.round(100 + adj.contrast * 1.1)));
    const sPct = Math.max(0, Math.min(220, Math.round(100 + adj.saturation)));
    const sepiaPct = adj.warmth > 0 ? Math.min(24, Math.round(adj.warmth * 0.34)) : 0;

    const filterParts: string[] = [];
    if (bPct !== 100) filterParts.push(`brightness(${bPct}%)`);
    if (cPct !== 100) filterParts.push(`contrast(${cPct}%)`);
    if (sPct !== 100) filterParts.push(`saturate(${sPct}%)`);
    if (sepiaPct > 0) filterParts.push(`sepia(${sepiaPct}%)`);

    ctx.save();
    ctx.translate(cx, cy);
    if (photoTransform.rotation) {
      ctx.rotate((photoTransform.rotation * Math.PI) / 180);
    }

    // Clip all lighting/retouch passes strictly to the photo bounds
    ctx.beginPath();
    ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
    ctx.clip();

    // Base photo pass with GPU filter
    if (supportsFilter && filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }
    ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
    if (supportsFilter) {
      ctx.filter = 'none';
    } else if (adj.brightness !== 0) {
      // Graceful fallback for older browsers without CanvasRenderingContext2D.filter
      ctx.save();
      ctx.globalCompositeOperation = adj.brightness > 0 ? 'screen' : 'multiply';
      const fallbackAlpha = Math.min(0.55, Math.abs(adj.brightness) / 100);
      ctx.fillStyle = adj.brightness > 0 ? `rgba(255,255,255,${fallbackAlpha})` : `rgba(0,0,0,${fallbackAlpha})`;
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Subtle Portrait Soft Glow pass (proportional blur so preview & x6 export match identically)
    if (adj.skinGlow > 0) {
      ctx.save();
      const glowRatio = Math.max(0, Math.min(1, adj.skinGlow / 50));
      const blurPx = Math.max(2, Math.min(width, height) * 0.012 * glowRatio);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = glowRatio * 0.24;
      if (supportsFilter) {
        ctx.filter = `blur(${blurPx.toFixed(1)}px) brightness(108%) saturate(106%)`;
      }
      ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
      if (supportsFilter) ctx.filter = 'none';
      ctx.restore();
    }

    // Color Temperature / Warmth tint pass
    if (adj.warmth !== 0) {
      ctx.save();
      const tRatio = Math.min(1, Math.abs(adj.warmth) / 50);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle =
        adj.warmth > 0
          ? `rgba(255, 168, 76, ${(tRatio * 0.28).toFixed(3)})`
          : `rgba(74, 168, 255, ${(tRatio * 0.3).toFixed(3)})`;
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Matte / Film Fade lift (lifts deep blacks smoothly)
    if (adj.fade > 0) {
      ctx.save();
      const fadeRatio = Math.max(0, Math.min(1, adj.fade / 50));
      ctx.globalCompositeOperation = 'lighten';
      ctx.fillStyle = `rgba(42, 46, 58, ${(fadeRatio * 0.72).toFixed(3)})`;
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Vignette radial edge darkening (kept inside photo bounds so Frame/Logo overlays stay crisp)
    if (adj.vignette > 0) {
      ctx.save();
      // Undo photo transform to center vignette on visible frame while still clipped to photo bounds
      if (photoTransform.rotation) {
        ctx.rotate((-photoTransform.rotation * Math.PI) / 180);
      }
      ctx.translate(-cx, -cy);
      const vigRatio = Math.max(0, Math.min(1, adj.vignette / 80));
      const innerR = Math.min(width, height) * 0.34;
      const outerR = Math.hypot(width, height) * 0.56;
      const grad = ctx.createRadialGradient(width / 2, height / 2, innerR, width / 2, height / 2, outerR);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.62, `rgba(10, 14, 24, ${(vigRatio * 0.18).toFixed(3)})`);
      grad.addColorStop(1, `rgba(10, 14, 24, ${(vigRatio * 0.72).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore();
  }

  // 3. Overlay Layers (Frames & Elements in stack order)
  for (const layer of options.overlays) {
    if (!layer.visible) continue;
    const ovImg = options.overlayImages[layer.proxySrc];
    if (!ovImg || ovImg.naturalWidth <= 0 || ovImg.naturalHeight <= 0) continue;

    const { drawW, drawH } = computeOverlayDrawSize(layer, ovImg, width, height);
    const cx = width / 2 + layer.x * width;
    const cy = height / 2 + layer.y * height;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    ctx.translate(cx, cy);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.drawImage(ovImg, -drawW / 2, -drawH / 2, drawW, drawH);

    // Optional live preview selection guide (never drawn during export)
    if (options.activeOverlayIdForGuide && options.activeOverlayIdForGuide === layer.id) {
      ctx.globalAlpha = 1;
      const lineW = Math.max(1.5, Math.min(width, height) * 0.0035);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = lineW;
      ctx.setLineDash([lineW * 4, lineW * 2.5]);
      ctx.strokeRect(-drawW / 2, -drawH / 2, drawW, drawH);
      ctx.setLineDash([]);

      // Corner handle accents
      const handleSize = Math.max(7, Math.min(width, height) * 0.018);
      const corners = [
        [-drawW / 2, -drawH / 2],
        [drawW / 2, -drawH / 2],
        [-drawW / 2, drawH / 2],
        [drawW / 2, drawH / 2],
      ];
      for (const [hx, hy] of corners) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(1.5, lineW * 0.9);
        ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      }
    }
    ctx.restore();
  }

  // Optional subtle center crosshair when aligning in preview
  if (options.showGridGuides) {
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.38)';
    ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.002);
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  jpegQuality = 0.94
): Promise<Blob> {
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('មិនអាចបង្កើតឯកសាររូបភាពបានទេ (សូមសាកល្បងបន្ថយកម្រិត Quality)'));
          return;
        }
        resolve(blob);
      },
      mime,
      format === 'jpeg' ? jpegQuality : undefined
    );
  });
}

export function buildExportFileName(originalName: string, format: ExportFormat, qualityMultiplier: number): string {
  const stripped = (originalName || 'photo').replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]/g, '_');
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  return `${stripped}_framed_x${qualityMultiplier}.${ext}`;
}

export interface DriveUploadConfig {
  id?: string;
  scriptUrl: string;
  secretToken: string;
  folderId: string;
  allowTeachersUpload: boolean;
  updatedAt?: number;
  updatedByName?: string;
}

export function extractDriveFolderId(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const m1 = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Renders ONLY visible overlay layers (Frames & Elements) onto a 100% transparent canvas.
 * Excludes any sample photo, solid background, and selection guides so the output is a reusable Frame PNG.
 */
export function renderOverlaysOnlyToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlays: OverlayLayer[],
  overlayImages: Record<string, HTMLImageElement | undefined>
) {
  renderCompositionToCanvas(ctx, width, height, {
    photoImg: null,
    photoTransform: DEFAULT_PHOTO_TRANSFORM,
    photoAdjustments: DEFAULT_PHOTO_ADJUSTMENTS,
    overlays,
    overlayImages,
    backgroundColor: 'transparent',
    activeOverlayIdForGuide: null,
    showGridGuides: false,
  });
}
