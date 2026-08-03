const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Coefficient modal state
if (!content.includes('const [isCoeffModalOpen')) {
  content = content.replace(
    /const \[isClearDropdownOpen, setIsClearDropdownOpen\] = useState\(false\);/,
    `const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);
  const [isCoeffModalOpen, setIsCoeffModalOpen] = useState(false);`
  );
}

// 2. Modify settings default to include coefficient logic if not present
if (!content.includes('coefficientType')) {
  content = content.replace(
    /gradeE: 50\s*\}\);/,
    `gradeE: 50,
    coefficientType: 'auto',
    customMaxScore: 250
  });`
  );
}

// 3. Update the average calculation in handleScoreChange
const newAvgCalc = `let divisor = 1;
        if (settings.coefficientType === 'custom') {
          divisor = (Number(settings.customMaxScore) || 250) / 50;
        } else {
          divisor = Number(settings.maxSubjects) || 1;
        }
        if (divisor <= 0) divisor = 1;
        const avgNum = total / divisor;`;
content = content.replace(/const avgNum = total \/ \(Number\(settings\.maxSubjects\) \|\| 1\);/g, newAvgCalc);

// 4. Inject Coefficient Button in the Toolbar
const coeffBtn = `<button 
            onClick={() => setIsCoeffModalOpen(true)}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
            title="កំណត់មេគុណសម្រាប់មធ្យមភាគ"
          >
            🔢 មេគុណ
          </button>`;

content = content.replace(
  /<SortDropdown/,
  `${coeffBtn}
          <SortDropdown`
);

// 5. Inject Coefficient Modal
const coeffModal = `{isCoeffModalOpen && (
          <div onClick={() => setIsCoeffModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '2rem', background: 'var(--modal-bg)', width: '90%', maxWidth: '400px', borderRadius: '16px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>កំណត់មេគុណ (Coefficient)</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                មេគុណនឹងត្រូវបានប្រើប្រាស់សម្រាប់ចែកពិន្ទុសរុប ដើម្បីស្វែងរកមធ្យមភាគ។
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={settings.coefficientType !== 'custom'}
                    onChange={() => {
                      const newSettings = {...settings, coefficientType: 'auto'};
                      setSettings(newSettings);
                      settingsService.update('scoreSettings', newSettings);
                    }} 
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1. ផ្អែកតាមចំនួនមុខវិជ្ជា</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មេគុណ = ចំនួនមុខវិជ្ជាសរុប (ចែកនឹង ៥០)</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={settings.coefficientType === 'custom'}
                    style={{ marginTop: '0.25rem' }}
                    onChange={() => {
                      const newSettings = {...settings, coefficientType: 'custom'};
                      setSettings(newSettings);
                      settingsService.update('scoreSettings', newSettings);
                    }} 
                  />
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>2. កំណត់ពិន្ទុអតិបរមាខ្លួនឯង</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>មេគុណ = ពិន្ទុអតិបរមា ចែកនឹង ៥០</div>
                    {settings.coefficientType === 'custom' && (
                      <input 
                        type="number" 
                        value={settings.customMaxScore || 250} 
                        onChange={e => {
                          const newSettings = {...settings, customMaxScore: parseFloat(e.target.value)};
                          setSettings(newSettings);
                          settingsService.update('scoreSettings', newSettings);
                        }}
                        placeholder="ឧ. 250"
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    )}
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsCoeffModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>បិទ / រក្សាទុក</button>
                </div>
              </div>
            </div>
          </div>
        )}`;

// Insert the modal before the end of the return
content = content.replace(/<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/m, `  ${coeffModal}
    </div>
  );
}
`);

// 6. Freeze Columns
content = content.replace(
  /<th style={{ padding: '0\.5rem', textAlign: 'left', color: 'var\(--text-secondary\)', border: '1px solid var\(--border-color\)' }}>ឈ្មោះសិស្ស<\/th>/g,
  `<th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-secondary)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>ឈ្មោះសិស្ស</th>`
);
content = content.replace(
  /<td style={{ padding: '0\.5rem', fontWeight: 600, color: 'var\(--text-primary\)', whiteSpace: 'nowrap', border: '1px solid var\(--border-color\)' }}>\{displayFullName\}<\/td>/g,
  `<td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 9, background: 'var(--main-bg)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>{displayFullName}</td>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 5 successfully applied!');
