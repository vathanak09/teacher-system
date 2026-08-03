const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the settings button
const btnRegex = /<button className="btn" onClick=\{\(\) => setIsSettingsModalOpen\(true\)\} style=\{\{ background: 'var\(--bg-secondary\)', border: '1px solid var\(--border-color\)', color: 'var\(--text-primary\)' \}\}>\s*⚙️ កំណត់ការគណនា\s*<\/button>/;
content = content.replace(btnRegex, '');

// 2. Change the coefficient button text to include the coefficient
content = content.replace(
  /🔢 មេគុណ\s*<\/button>/,
  '🔢 មេគុណ: {currentCoeff}\n          </button>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 10 applied!');
