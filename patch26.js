const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /currentSort=\{sortConfig\}\s*onSortChange=\{setSortConfig\}/;
const replacement = `currentSort={{ sortBy: sortConfig.key, sortOrder: sortConfig.direction as "asc" | "desc" }}\n              onSortChange={(key, dir) => setSortConfig({ key, direction: dir })}`;

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 26 applied!');
