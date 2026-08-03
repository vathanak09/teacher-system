const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /currentSort=\{\{\s*sortBy:\s*sortConfig\.key,\s*sortOrder:\s*sortConfig\.direction\s*as\s*"asc"\s*\|\s*"desc"\s*\}\}/;
const replacement = `sortBy={sortConfig.key}\n              sortOrder={sortConfig.direction as "asc" | "desc"}`;

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 27 applied!');
