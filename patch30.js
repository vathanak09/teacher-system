const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Revert incorrect cursor/opacity on Class card (renderClassList)
content = content.replace(
  /cursor: day === unlockedDay \? 'pointer' : 'not-allowed',\n\s*opacity: day === unlockedDay \? 1 : 0.6,( display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid \$\{c.color \|\| 'var\(--primary-color\)'\}` \}\})/g,
  `cursor: 'pointer',$1`
);

// Revert incorrect cursor/opacity on unlockedDay +/- buttons
content = content.replace(
  /cursor: day === unlockedDay \? 'pointer' : 'not-allowed',\n\s*opacity: day === unlockedDay \? 1 : 0.6,( fontSize: '1.2rem', color: 'var\(--text-secondary\)' \}\})/g,
  `cursor: 'pointer',$1`
);

// Revert double insertion in <th>
// The <th> currently looks like: style={{ padding: '0.5rem 0.25rem', textAlign: 'center', minWidth: '38px', fontSize: '0.85rem', cursor: day === unlockedDay ? 'pointer' : 'not-allowed', opacity: day === unlockedDay ? 1 : 0.6, borderLeft: '1px solid rgba(0,0,0,0.05)', borderRight: '1px solid rgba(0,0,0,0.05)', background: 'var(--bg-secondary)', cursor: day === unlockedDay ? 'pointer' : 'not-allowed', opacity: day === unlockedDay ? 1 : 0.6 }}
content = content.replace(
  /cursor: day === unlockedDay \? 'pointer' : 'not-allowed',\n\s*opacity: day === unlockedDay \? 1 : 0.6, (borderLeft: '1px solid rgba\(0,0,0,0.05\)', borderRight: '1px solid rgba\(0,0,0,0.05\)', background: 'var\(--bg-secondary\)'), cursor: day === unlockedDay \? 'pointer' : 'not-allowed', opacity: day === unlockedDay \? 1 : 0.6/g,
  `$1, cursor: day === unlockedDay ? 'pointer' : 'not-allowed', opacity: day === unlockedDay ? 1 : 0.6`
);

// Revert incorrect cursor on Back button at the bottom
content = content.replace(
  /cursor: day === unlockedDay \? 'pointer' : 'not-allowed',\n\s*opacity: day === unlockedDay \? 1 : 0.6, (color: 'var\(--text-primary\)' \}\})/g,
  `cursor: 'pointer',$1`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 30 applied!');
