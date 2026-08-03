const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/const ranks = \{\};/g, 'const ranks: Record<string, number> = {};');
content = content.replace(/ranks\[s\.id\] = currentRank;/g, 'ranks[s.id as string] = currentRank;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed typescript error!');
