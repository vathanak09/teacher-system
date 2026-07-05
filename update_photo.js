const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

const oldStr = `<td style={{ padding: '0.5rem', position: 'relative' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>`;

const newStr = `<td style={{ padding: '0.5rem', position: 'relative' }}>
                                      <div onClick={(e) => { e.stopPropagation(); setHoveredStudent(hoveredStudent === s.id ? null : s.id); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed photo hover click via literal replacement');
