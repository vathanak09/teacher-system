const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const calculateRemarks = \(grade: string\) => \{/g,
  'function calculateRemarks(grade: string) {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 18 applied!');
