import { domToCanvas } from 'modern-screenshot';

export type ExportQualityScale = 2 | 3 | 4 | 5;

export const EXPORT_QUALITY_OPTIONS: ExportQualityScale[] = [2, 3, 4, 5];

export const PRINT_EXPORT_QUALITY_STORAGE_KEY = 'bsis_print_export_quality';

const PROXY_ALLOWED_HOSTS = new Set([
  'drive.google.com',
  'drive.usercontent.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'res.cloudinary.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

const nextFrame = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image blob'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

async function waitForImagesInElement(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img'));
  if (imgs.length === 0) return;

  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            const done = () => {
              img.removeEventListener('load', done);
              img.removeEventListener('error', done);
              resolve();
            };
            img.addEventListener('load', done);
            img.addEventListener('error', done);
          })
      )
    ),
    sleep(3500),
  ]);
}

function resolveSheetBackground(el: HTMLElement): string {
  if (typeof window === 'undefined') return '#ffffff';
  const bg = window.getComputedStyle(el).backgroundColor;
  if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
    return '#ffffff';
  }
  return bg;
}

function createProxiedImageFetchFn(cache: Map<string, string>) {
  return async (url: string): Promise<string | false> => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      return false;
    }
    const hit = cache.get(url);
    if (hit) return hit;

    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin === window.location.origin) {
        return false;
      }
      if (PROXY_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
        const res = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(parsed.href)}`
        );
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await blobToDataUrl(blob);
          cache.set(url, dataUrl);
          return dataUrl;
        }
      }
    } catch {
      // Fallback to default browser fetch inside modern-screenshot
    }
    return false;
  };
}

/**
 * Temporarily reveals any `.report-card-hidden-screen` ancestor off-screen
 * (when single-page preview is active) and clears preview zoom transform
 * before capturing an unscaled 1:1 DOM sheet at the requested pixel scale.
 */
async function captureSingleSheetCanvas(
  el: HTMLElement,
  scale: ExportQualityScale,
  fetchFn: (url: string) => Promise<string | false>
): Promise<{ canvas: HTMLCanvasElement; widthPx: number; heightPx: number }> {
  const restoredAncestors: Array<{
    node: HTMLElement;
    prevCssText: string;
    hadHiddenClass: boolean;
  }> = [];

  let cursor: HTMLElement | null = el;
  while (cursor) {
    if (cursor.classList.contains('report-card-hidden-screen')) {
      restoredAncestors.push({
        node: cursor,
        prevCssText: cursor.style.cssText,
        hadHiddenClass: true,
      });
      cursor.classList.remove('report-card-hidden-screen');
      cursor.style.position = 'fixed';
      cursor.style.left = '-25000px';
      cursor.style.top = '0';
      cursor.style.display = 'flex';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '-1';
    }
    cursor = cursor.parentElement;
  }

  // Wait for layout & images if element was previously display:none
  if (restoredAncestors.length > 0) {
    await nextFrame();
    await waitForImagesInElement(el);
  }

  try {
    const widthPx = Math.max(1, el.offsetWidth || Math.round(el.getBoundingClientRect().width));
    const heightPx = Math.max(1, el.offsetHeight || Math.round(el.getBoundingClientRect().height));
    const bgColor = resolveSheetBackground(el);

    const canvas = await domToCanvas(el, {
      scale,
      width: widthPx,
      height: heightPx,
      backgroundColor: bgColor,
      maximumCanvasSize: 16384,
      timeout: 25000,
      style: {
        transform: 'none',
        margin: '0',
      },
      filter: (node: Node) => {
        if (node instanceof Element && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
      fetchFn,
    });

    return { canvas, widthPx, heightPx };
  } finally {
    for (let i = restoredAncestors.length - 1; i >= 0; i--) {
      const item = restoredAncestors[i];
      item.node.style.cssText = item.prevCssText;
      if (item.hadHiddenClass) {
        item.node.classList.add('report-card-hidden-screen');
      }
    }
  }
}

function sanitizeFileNameBase(raw: string): string {
  const cleaned = String(raw || 'print-document')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');
  return cleaned || 'print-document';
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Collect printable sheet elements inside a modal/section container.
 */
export function collectPrintSheetElements(
  rootOrSelector: ParentNode | string | null | undefined,
  sheetSelector: string
): HTMLElement[] {
  if (typeof document === 'undefined' || !rootOrSelector) return [];
  const root =
    typeof rootOrSelector === 'string'
      ? document.querySelector(rootOrSelector)
      : rootOrSelector;
  if (!root) return [];
  return Array.from(root.querySelectorAll(sheetSelector)).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
}

export interface PrintExportParams {
  elements: HTMLElement[];
  fileNameBase: string;
  scale: ExportQualityScale;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Exports all selected/rendered print sheets as high-DPI PNG image(s).
 */
export async function exportPrintSheetsAsPng({
  elements,
  fileNameBase,
  scale,
  onProgress,
}: PrintExportParams): Promise<void> {
  if (elements.length === 0 || typeof document === 'undefined') return;
  const safeBase = sanitizeFileNameBase(fileNameBase);
  const fetchFn = createProxiedImageFetchFn(new Map<string, string>());

  document.body.classList.add('exporting-print-sheets');
  try {
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, sleep(1500)]);
    }

    for (let i = 0; i < elements.length; i++) {
      onProgress?.(i + 1, elements.length);
      const { canvas } = await captureSingleSheetCanvas(elements[i], scale, fetchFn);
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        );
        if (!blob) {
          throw new Error('Failed to encode PNG image');
        }
        const suffix = elements.length > 1 ? `-page-${i + 1}` : '';
        triggerBlobDownload(blob, `${safeBase}-${scale}x${suffix}.png`);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
      if (i < elements.length - 1) {
        await sleep(220);
      }
    }
  } finally {
    document.body.classList.remove('exporting-print-sheets');
  }
}

/**
 * Exports all selected/rendered print sheets into a single multi-page PDF
 * preserving each sheet's exact orientation and physical dimensions.
 */
export async function exportPrintSheetsAsPdf({
  elements,
  fileNameBase,
  scale,
  onProgress,
}: PrintExportParams): Promise<void> {
  if (elements.length === 0 || typeof document === 'undefined') return;
  const safeBase = sanitizeFileNameBase(fileNameBase);
  const fetchFn = createProxiedImageFetchFn(new Map<string, string>());
  const pxToMm = 25.4 / 96;

  document.body.classList.add('exporting-print-sheets');
  try {
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, sleep(1500)]);
    }
    const { jsPDF } = await import('jspdf');
    let pdf: InstanceType<typeof jsPDF> | null = null;

    for (let i = 0; i < elements.length; i++) {
      onProgress?.(i + 1, elements.length);
      const { canvas, widthPx, heightPx } = await captureSingleSheetCanvas(
        elements[i],
        scale,
        fetchFn
      );
      try {
        const wMm = Number((widthPx * pxToMm).toFixed(2));
        const hMm = Number((heightPx * pxToMm).toFixed(2));
        const orientation: 'portrait' | 'landscape' =
          wMm > hMm ? 'landscape' : 'portrait';

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: [wMm, hMm],
            compress: true,
          });
        } else {
          pdf.addPage([wMm, hMm], orientation);
        }

        const dataUrl = canvas.toDataURL('image/png');
        pdf.addImage(dataUrl, 'PNG', 0, 0, wMm, hMm, undefined, 'FAST');
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    if (pdf) {
      pdf.save(`${safeBase}-${scale}x.pdf`);
    }
  } finally {
    document.body.classList.remove('exporting-print-sheets');
  }
}
