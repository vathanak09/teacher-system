import { NextRequest, NextResponse } from 'next/server';

const MAX_FRAME_PNG_BYTES = 15 * 1024 * 1024; // 15 MB max per transparent PNG frame

function isAllowedAppsScriptUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'script.google.com') {
      return parsed.pathname.startsWith('/macros/s/');
    }
    if (host === 'script.googleusercontent.com') {
      return parsed.pathname.startsWith('/macros/');
    }
    return false;
  } catch {
    return false;
  }
}

async function callAppsScript(scriptUrl: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(scriptUrl.trim(), {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json,text/plain,*/*',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const lower = text.toLowerCase();
      if (lower.includes('<html') || lower.includes('accounts.google.com') || lower.includes('sign in')) {
        throw new Error(
          'Google Apps Script តម្រូវឱ្យ Login! សូមពិនិត្យពេល Deploy ថាបានជ្រើស "Execute as: Me" និង "Who has access: Anyone"។'
        );
      }
      throw new Error('Google Apps Script មិនបានបញ្ជូនទិន្នន័យ JSON ត្រឹមត្រូវត្រឡប់មកវិញទេ។ សូមពិនិត្យកូដ Script និង URL ម្តងទៀត។');
    }

    if (!res.ok || !parsed?.ok) {
      throw new Error(parsed?.error || `Apps Script error (${res.status})`);
    }

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  return NextResponse.json({
    hasEnvConfig: Boolean(process.env.GOOGLE_DRIVE_FRAME_SCRIPT_URL),
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    // 1. Ping / Test Connection Mode (JSON)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const scriptUrl = (body?.scriptUrl || process.env.GOOGLE_DRIVE_FRAME_SCRIPT_URL || '').trim();
      const secretToken = (body?.secretToken || process.env.GOOGLE_DRIVE_FRAME_SECRET || '').trim();
      const folderId = (body?.folderId || process.env.GOOGLE_DRIVE_FRAME_FOLDER_ID || '').trim();

      if (!scriptUrl) {
        return NextResponse.json({ error: 'មិនទាន់បានកំណត់ Google Apps Script URL នៅឡើយទេ!' }, { status: 400 });
      }
      if (!isAllowedAppsScriptUrl(scriptUrl)) {
        return NextResponse.json(
          { error: 'URL ត្រូវតែជា Google Apps Script Web App (https://script.google.com/macros/s/.../exec) ប៉ុណ្ណោះ!' },
          { status: 400 }
        );
      }

      const result = await callAppsScript(scriptUrl, {
        action: 'ping',
        token: secretToken,
        folderId,
      });

      return NextResponse.json({
        ok: true,
        folderName: result.folderName || 'BSIS_Photo_Frames',
        folderId: result.folderId || folderId || '',
      });
    }

    // 2. Transparent PNG Frame Upload Mode (multipart/form-data)
    const formData = await req.formData();
    const file = formData.get('file');
    const rawFileName = String(formData.get('fileName') || `frame_${Date.now()}.png`).trim();
    const scriptUrl = String(
      formData.get('scriptUrl') || process.env.GOOGLE_DRIVE_FRAME_SCRIPT_URL || ''
    ).trim();
    const secretToken = String(
      formData.get('secretToken') || process.env.GOOGLE_DRIVE_FRAME_SECRET || ''
    ).trim();
    const folderId = String(
      formData.get('folderId') || process.env.GOOGLE_DRIVE_FRAME_FOLDER_ID || ''
    ).trim();

    if (!scriptUrl) {
      return NextResponse.json(
        { error: 'មិនទាន់បានភ្ជាប់ Google Drive Apps Script URL ទេ! សូម Admin ចូលកំណត់នៅប៊ូតុង "កំណត់ Google Drive"។' },
        { status: 400 }
      );
    }

    if (!isAllowedAppsScriptUrl(scriptUrl)) {
      return NextResponse.json(
        { error: 'URL មិនត្រឹមត្រូវ! អនុញ្ញាតតែ Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec) ប៉ុណ្ណោះ។' },
        { status: 400 }
      );
    }

    if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'មិនមានឯកសារ PNG Frame សម្រាប់ Upload ទេ!' }, { status: 400 });
    }

    const buffer = await (file as Blob).arrayBuffer();
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'ឯកសារ PNG ទទេ!' }, { status: 400 });
    }
    if (buffer.byteLength > MAX_FRAME_PNG_BYTES) {
      return NextResponse.json(
        { error: 'ទំហំស៊ុម PNG ធំជាង 15MB! សូមសាកល្បងជ្រើសកម្រិតគុណភាព x2 ឬ x3។' },
        { status: 413 }
      );
    }

    // Validate genuine PNG magic bytes (89 50 4E 47) so only PNG frames can be uploaded
    const head = new Uint8Array(buffer.slice(0, 8));
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    if (!isPng) {
      return NextResponse.json({ error: 'អនុញ្ញាត Upload តែឯកសារ PNG ថ្លាប៉ុណ្ណោះ!' }, { status: 400 });
    }

    const safeName = rawFileName.replace(/[\\/:*?"<>|]/g, '_');
    const finalName = safeName.toLowerCase().endsWith('.png') ? safeName : `${safeName}.png`;
    const base64 = Buffer.from(buffer).toString('base64');

    const result = await callAppsScript(scriptUrl, {
      action: 'upload',
      token: secretToken,
      folderId,
      fileName: finalName,
      mimeType: 'image/png',
      base64,
    });

    if (!result?.fileId || !result?.viewUrl) {
      return NextResponse.json(
        { error: 'Apps Script មិនបានបញ្ជូន Google Drive Link ត្រឡប់មកវិញទេ!' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      fileId: result.fileId,
      fileName: result.fileName || finalName,
      viewUrl: result.viewUrl,
    });
  } catch (error: any) {
    console.error('Upload Drive Frame Error:', error);
    const msg =
      error?.name === 'AbortError'
        ? 'ការ Upload ទៅ Google Drive អស់ពេលកំណត់ (Timeout)។ សូមសាកល្បងម្តងទៀត!'
        : error?.message || 'មិនអាច Upload ទៅ Google Drive បានទេ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
