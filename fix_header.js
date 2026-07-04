const fs = require('fs');
const files = [
  './src/app/dashboard/students/page.tsx',
  './src/app/dashboard/classes/page.tsx',
  './src/app/dashboard/teachers/page.tsx',
  './src/app/dashboard/layout.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let match = content.match(/[\"']use client[\"'];\r?\n?/);
  if (match && match.index > 0) {
    content = content.replace(match[0], '');
    content = match[0].trim() + '\n' + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
