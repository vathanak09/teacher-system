import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folderParam = formData.get('folder')?.toString() || 'misc_photos';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary config missing' }, { status: 500 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const fileNameParam = formData.get('fileName')?.toString();
    
    // Use provided fileName or generate a random one
    // Remove spaces from fileName to make it URL safe
    const safeFileName = fileNameParam ? fileNameParam.replace(/\s+/g, '_') : `photo_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
    const public_id = safeFileName;
    
    // Create signature
    const paramsToSign: Record<string, string> = {
      timestamp,
      folder: folderParam,
      public_id
    };
    
    const sortedKeys = Object.keys(paramsToSign).sort();
    const strToSign = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    // Create a new FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('folder', folderParam);
    cloudinaryFormData.append('public_id', public_id);
    cloudinaryFormData.append('signature', signature);

    const uploadRes = await fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      console.error('Cloudinary error:', data);
      return NextResponse.json({ error: data.error?.message || 'Upload failed' }, { status: uploadRes.status });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
