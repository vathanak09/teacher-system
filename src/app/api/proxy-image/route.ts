import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
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

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB safety limit

function extractDriveFileId(rawUrl: string): string | null {
  const m1 = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  const m3 = rawUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];
  return null;
}

function isAllowedHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function fetchImageBytes(targetUrl: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BSISPhotoFrameProxy/1.0)',
        Accept: 'image/png,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) return null;

    // Guard redirected final URL host to prevent redirect SSRF
    if (res.url && !isAllowedHost(res.url)) {
      return null;
    }

    const rawType = (res.headers.get('content-type') || '').toLowerCase();
    // Reject HTML pages (e.g., Google Drive login or virus-scan warning HTML)
    if (rawType.includes('text/html') || rawType.includes('application/json')) {
      return null;
    }

    const contentLength = Number(res.headers.get('content-length') || '0');
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error('រូបភាពមានទំហំធំពេក (លើស 25MB)!');
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return null;
    }

    // Verify magic bytes (PNG, JPEG, WebP, GIF) so non-image octet-streams are rejected cleanly
    const head = new Uint8Array(buffer.slice(0, 12));
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isGif = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
    const isWebp =
      head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;

    if (!isPng && !isJpeg && !isGif && !isWebp) {
      return null;
    }

    const resolvedMime = isPng
      ? 'image/png'
      : isWebp
        ? 'image/webp'
        : isGif
          ? 'image/gif'
          : 'image/jpeg';

    return { buffer, contentType: resolvedMime };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get('url')?.trim() || '';
    if (!rawUrl) {
      return NextResponse.json({ error: 'សូមផ្តល់តំណភ្ជាប់រូបភាព!' }, { status: 400 });
    }

    if (!isAllowedHost(rawUrl)) {
      return NextResponse.json(
        { error: 'អនុញ្ញាតតែតំណភ្ជាប់ពី Google Drive, Cloudinary ឬ Firebase Storage ប៉ុណ្ណោះ!' },
        { status: 400 }
      );
    }

    const driveId = extractDriveFileId(rawUrl);
    const candidateUrls = driveId
      ? [
          // 1. Original lossless file download (preserves full 4K PNG alpha transparency!)
          `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`,
          // 2. Classic Google Drive direct export
          `https://drive.google.com/uc?export=download&id=${driveId}`,
          // 3. Googleusercontent original size (=s0)
          `https://lh3.googleusercontent.com/d/${driveId}=s0`,
          // 4. High-res thumbnail fallback
          `https://drive.google.com/thumbnail?id=${driveId}&sz=w4000`,
        ]
      : [rawUrl];

    for (const candidate of candidateUrls) {
      try {
        const result = await fetchImageBytes(candidate);
        if (result) {
          return new NextResponse(result.buffer, {
            status: 200,
            headers: {
              'Content-Type': result.contentType,
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          });
        }
      } catch (innerErr: any) {
        if (innerErr?.message?.includes('25MB')) {
          return NextResponse.json({ error: innerErr.message }, { status: 413 });
        }
      }
    }

    return NextResponse.json(
      {
        error: driveId
          ? 'មិនអាចទាញរូបភាព PNG ពី Google Drive បានទេ! សូមប្រាកដថា Link ត្រូវបានបើកសិទ្ធិ "Anyone with the link" (អ្នកណាក៏អាចមើលបាន)។'
          : 'មិនអាចទាញរូបភាពពី Link នេះបានទេ។ សូមពិនិត្យ Link ម្តងទៀត។',
      },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('Image Proxy Error:', error);
    return NextResponse.json({ error: error?.message || 'Proxy error' }, { status: 500 });
  }
}
