export function convertDriveImageLink(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  // Try to match standard file ID: /file/d/ID/...
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) {
    return `https://drive.google.com/uc?export=view&id=${match1[1]}`;
  }
  
  // Try to match open?id=ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) {
    return `https://drive.google.com/uc?export=view&id=${match2[1]}`;
  }
  
  return url;
}
