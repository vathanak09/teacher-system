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

  // 2. Base Photo Layer
  const { photoImg, photoTransform } = options;
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

    ctx.save();
    ctx.translate(cx, cy);
    if (photoTransform.rotation) {
      ctx.rotate((photoTransform.rotation * Math.PI) / 180);
    }
    ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
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
