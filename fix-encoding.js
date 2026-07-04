
const fs = require('fs');

const cp1252ToByte = new Map();
// 0x00 to 0xFF
for (let i = 0; i <= 0xFF; i++) {
    let char;
    if (i >= 0x80 && i <= 0x9F) {
        // Handle windows-1252 specifics
        const special = [
            0x20AC, 0xFFFD, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021,
            0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0xFFFD, 0x017D, 0xFFFD,
            0xFFFD, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
            0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0xFFFD, 0x017E, 0x0178
        ];
        char = special[i - 0x80];
    } else {
        char = i;
    }
    cp1252ToByte.set(char, i);
}

function restoreFile(path) {
    const str = fs.readFileSync(path, 'utf8');
    // First, let's remove the BOM if it exists
    let content = str;
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    let bytes = [];
    let ok = true;
    for (let i = 0; i < content.length; i++) {
        let code = content.charCodeAt(i);
        if (cp1252ToByte.has(code)) {
            bytes.push(cp1252ToByte.get(code));
        } else {
            // It might be a regular ascii character not corrupted
            if (code <= 0x7F) bytes.push(code);
            else {
                bytes.push(code & 0xFF); // fallback
            }
        }
    }
    const buffer = Buffer.from(bytes);
    const restored = buffer.toString('utf8');
    fs.writeFileSync(path, restored, 'utf8');
    console.log('Restored: ' + path);
}

restoreFile('src/app/dashboard/favorites/page.tsx');

