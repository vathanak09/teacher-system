const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove SortDropdown Import
content = content.replace(/import SortDropdown from '@\/components\/SortDropdown';\n/, '');

// 2. Remove sortConfig state
content = content.replace(/const \[sortConfig, setSortConfig\] = useState\(\{ key: 'fullName', direction: 'asc' \}\);\n/, '');

// 3. Remove SortDropdown UI
const sortDropdownUI = /<SortDropdown\s+options=\{[\s\S]*?onSortChange=\{\(key, dir\) => setSortConfig\(\{ key, direction: dir \}\)\}\s*\/>/;
content = content.replace(sortDropdownUI, '');

// 4. Update the sorting logic to just hardcode alphabetical by name
const sortLogic = /classStudents = \[\.\.\.classStudents\]\.sort\(\(a, b\) => \{[\s\S]*?return 0;\n\s*\}\);/;
const newSortLogic = `classStudents = [...classStudents].sort((a, b) => {
      let aVal = a.fullName || a.name || '';
      let bVal = b.fullName || b.name || '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });`;
content = content.replace(sortLogic, newSortLogic);

// 5. Add 'no-spinner' class to the number input
const inputHTML = /<input\s+type="number"\s+value=\{unlockedDay\}/;
const newInputHTML = `<input \n                  type="number" \n                  className="no-spinner"\n                  value={unlockedDay}`;
content = content.replace(inputHTML, newInputHTML);

fs.writeFileSync(filePath, content, 'utf8');

const cssPath = path.join(__dirname, 'src', 'app', 'globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

if (!cssContent.includes('.no-spinner')) {
  cssContent += `\n/* Hide number input spinners */\n.no-spinner::-webkit-outer-spin-button,\n.no-spinner::-webkit-inner-spin-button {\n  -webkit-appearance: none;\n  margin: 0;\n}\n.no-spinner {\n  -moz-appearance: textfield;\n}\n`;
  fs.writeFileSync(cssPath, cssContent, 'utf8');
}

console.log('Patch 32 applied!');
