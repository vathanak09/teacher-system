const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/scoreService\.updateScore/g, 'scoreService.update');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed update method name!');
