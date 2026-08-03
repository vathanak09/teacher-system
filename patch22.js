const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', cursor: 'pointer' }}>
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
                  {ICONS.find(i => i.id === c.icon)?.icon || '📚'}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.className}</h3>`;

const replacementStr = `            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ 
                  background: \`\${COLORS.find(col => col.id === c.color)?.value || '#3b82f6'}15\`, 
                  color: COLORS.find(col => col.id === c.color)?.value || '#3b82f6', 
                  padding: '1rem', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '64px', 
                  height: '64px' 
                }}>
                  {ICONS.find(i => i.id === c.icon)?.icon || '📚'}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{c.className}</h3>`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 22 applied!');
