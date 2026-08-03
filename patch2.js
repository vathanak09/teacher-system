const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert handleClearAll
content = content.replace(
  /const handleClearColumn = async \(columnKey: string, columnName: string\) => \{[\s\S]*?await Promise\.all\(updatedScores\.map\(s => scoreService\.updateScore\(s\.id, s\)\)\);\s*\};/,
  `const handleClearColumn = async (columnKey: string, columnName: string) => {
    if (!window.confirm(\`តើអ្នកពិតជាចង់លុបពិន្ទុ \${columnName} ទាំងអស់មែនទេ?\`)) return;
    setIsClearDropdownOpen(false);
    const updatedScores = scores.map(s => ({ ...s, [columnKey]: '' }));
    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.updateScore(s.id, s)));
  };

  const handleClearAll = async () => {
    if (!window.confirm(\`តើអ្នកពិតជាចង់លុបទិន្នន័យបញ្ជីឈ្មោះទាំងអស់ក្នុងខែនេះមែនទេ?\`)) return;
    setIsClearDropdownOpen(false);
    await Promise.all(scores.map(s => scoreService.delete(s.id)));
    setScores([]);
  };`
);

// 2. Insert Clear All button in dropdown
content = content.replace(
  /លុប \{col\.label\}\s*<\/div>\s*\)\)\}\s*<\/div>/,
  `លុប {col.label}
                  </div>
                ))}

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <div 
                  onClick={handleClearAll}
                  style={{
                    padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--danger)', transition: 'background 0.2s', fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  លុបទាំងអស់ (Clear All)
                </div>
              </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 2 applied successfully!');
