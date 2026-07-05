const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

// Normalize line endings to \n for matching
content = content.replace(/\r\n/g, '\n');

const labelOld = `                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
                  <input 
                    type="checkbox" 
                    checked={autoImportStudents} 
                    onChange={(e) => setAutoImportStudents(e.target.checked)} 
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.95rem' }}>ទាញយកសិស្សចូលថ្នាក់ដោយស្វ័យប្រវត្តិ (Import Students)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ទាញយកសិស្សទាំងអស់ដែលត្រូវនឹងគោលដៅខាងលើ ចូលក្នុងថ្នាក់នេះពេលរក្សាទុក។</div>
                  </div>
                </label>
              </div>`;

const labelNew = `                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
                  <input 
                    type="checkbox" 
                    checked={autoImportStudents} 
                    onChange={(e) => setAutoImportStudents(e.target.checked)} 
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.95rem' }}>ទាញយកសិស្សចូលថ្នាក់ដោយស្វ័យប្រវត្តិ (Import Students)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ទាញយកសិស្សទាំងអស់ដែលត្រូវនឹងគោលដៅខាងលើ ចូលក្នុងថ្នាក់នេះពេលរក្សាទុក។</div>
                  </div>
                </label>

                {role === 'admin' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={allowTeacherEdit} 
                      onChange={(e) => setAllowTeacherEdit(e.target.checked)} 
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: '#d97706' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#d97706', fontSize: '0.95rem' }}>អនុញ្ញាតឱ្យគ្រូកែប្រែព័ត៌មានសិស្ស (Allow Edit)</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>បើកសិទ្ធិឱ្យគ្រូអាចកែប្រែព័ត៌មានសិស្សនៅក្នុងថ្នាក់នេះដោយផ្ទាល់ដោយមិនបាច់ស្នើសុំ។</div>
                    </div>
                  </label>
                )}
              </div>`;

content = content.replace(labelOld, labelNew);

content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Added checkbox to class edit modal.');
