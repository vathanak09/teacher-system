const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/const toUpdate = \{\};/g, 'const toUpdate: any = {};');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed typescript error 3!');
