const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const colorsArray = `
const COLORS = [
    { id: 'blue', value: '#3b82f6', label: 'ខៀវ' },
    { id: 'indigo', value: '#6366f1', label: 'ខៀវចាស់' },
    { id: 'purple', value: '#8b5cf6', label: 'ស្វាយ' },
    { id: 'pink', value: '#ec4899', label: 'ផ្កាឈូក' },
    { id: 'red', value: '#ef4444', label: 'ក្រហម' },
    { id: 'orange', value: '#f97316', label: 'ទឹកក្រូច' },
    { id: 'yellow', value: '#eab308', label: 'លឿង' },
    { id: 'green', value: '#22c55e', label: 'បៃតង' },
    { id: 'teal', value: '#14b8a6', label: 'ខៀវបៃតង' },
    { id: 'slate', value: '#64748b', label: 'ប្រផេះ' }
];
`;

content = content.replace(
  `const ICONS = [`,
  `${colorsArray}\nconst ICONS = [`
);

// We need to change:
// <div style={{ background: c.color || 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-md)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
// to use the parsed hex color and opacity
const oldDivRegex = /<div style={{ background: c\.color[^>]+>/;

const newDiv = `
                <div style={{ 
                  background: \`\${COLORS.find(col => col.id === c.color)?.value || '#3b82f6'}15\`, 
                  color: COLORS.find(col => col.id === c.color)?.value || '#3b82f6', 
                  padding: '1.25rem', 
                  borderRadius: '20px', 
                  fontSize: '2.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '80px', 
                  height: '80px' 
                }}>
`.trim();

content = content.replace(oldDivRegex, newDiv);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 21 applied!');
