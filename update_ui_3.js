const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

// 1. Fix photo interaction (Remove onMouseEnter/onMouseLeave, add onClick)
content = content.replace(
  /<td style={{ padding: '0.5rem', position: 'relative' }}[^>]*>\s*<div[^>]*cursor: 'help'[^>]*>/,
  "<td style={{ padding: '0.5rem', position: 'relative' }}>\n                                      <div onClick={(e) => { e.stopPropagation(); setHoveredStudent(hoveredStudent === s.id ? null : s.id); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>"
);

// 2. Fix popup interaction (Add onClick outside to close, and close button)
content = content.replace(
  /{hoveredStudent === s\.id && typeof window !== 'undefined' && createPortal\(\s*<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>\s*<div style={{ background: 'var\(--main-bg\)', border: '1px solid var\(--border-color\)', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.5\)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1\.5rem', backdropFilter: 'blur\(10px\)' }} onMouseEnter={\(\) => setHoveredStudent\(s\.id\)} onMouseLeave={\(\) => setHoveredStudent\(null\)} onClick={e => e\.stopPropagation\(\)}>/,
  `{hoveredStudent === s.id && typeof window !== 'undefined' && createPortal(
                                          <div onClick={() => setHoveredStudent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                                            <div style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem', backdropFilter: 'blur(10px)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                              <button onClick={() => setHoveredStudent(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                              </button>`
);

// 3. Fix Details grid to flex in the Hover Popup
content = content.replace(
  /<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1\.5rem' }}>\s*<div style={{ background: 'rgba\(139, 92, 246, 0\.04\)', borderRadius: '16px', padding: '1\.25rem', border: '1px solid rgba\(139, 92, 246, 0\.1\)' }}>/,
  `<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                                <div style={{ flex: '1 1 200px', background: 'rgba(139, 92, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>`
);
content = content.replace(
  /<\/div>\s*<div style={{ background: 'rgba\(16, 185, 129, 0\.04\)', borderRadius: '16px', padding: '1\.25rem', border: '1px solid rgba\(16, 185, 129, 0\.1\)' }}>/,
  `</div>
                                                
                                                <div style={{ flex: '1 1 200px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>`
);

fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed ALL ui issues safely.');
