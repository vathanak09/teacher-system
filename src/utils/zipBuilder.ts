/**
 * Lightweight zero-dependency client-side ZIP archive builder (STORE / method 0).
 * Ideal for already-compressed image formats (PNG / JPEG) with full UTF-8 filename support.
 */

export interface ZipInputFile {
  name: string;
  data: Uint8Array;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, Math.min(2107, date.getFullYear()));
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

export function createZipBlob(files: ZipInputFile[]): Blob {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = getDosDateTime(new Date());

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  // Deduplicate filenames safely inside the archive
  const usedNames = new Map<string, number>();

  for (const file of files) {
    let safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
    const seenCount = usedNames.get(safeName.toLowerCase()) || 0;
    usedNames.set(safeName.toLowerCase(), seenCount + 1);
    if (seenCount > 0) {
      const dotIdx = safeName.lastIndexOf('.');
      safeName =
        dotIdx > 0
          ? `${safeName.slice(0, dotIdx)}_${seenCount + 1}${safeName.slice(dotIdx)}`
          : `${safeName}_${seenCount + 1}`;
    }

    const nameBytes = encoder.encode(safeName);
    const data = file.data;
    const checksum = crc32(data);
    const size = data.byteLength;

    // Local File Header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);         // Version needed (2.0)
    lv.setUint16(6, 0x0800, true);     // UTF-8 filename flag
    lv.setUint16(8, 0, true);          // Compression method: 0 (STORE)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    // Central Directory File Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed
    cv.setUint16(8, 0x0800, true);     // UTF-8 flag
    cv.setUint16(10, 0, true);         // STORE
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);         // Extra length
    cv.setUint16(32, 0, true);         // File comment length
    cv.setUint16(34, 0, true);         // Disk number start
    cv.setUint16(36, 0, true);         // Internal attrs
    cv.setUint32(38, 0, true);         // External attrs
    cv.setUint32(42, offset, true);    // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.byteLength + data.byteLength;
  }

  let centralSize = 0;
  for (const part of centralParts) {
    centralSize += part.byteLength;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(eocd),
  ];

  return new Blob(blobParts, { type: 'application/zip' });
}
