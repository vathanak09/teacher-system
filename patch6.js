const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const coeffModal = `
      {isCoeffModalOpen && (
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
        )}
    </div>
  );
}
`;

content = content.replace(/<\/p>\s*<\/div>\s*\)\;\s*\}\s*$/m, `</p>${coeffModal}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed modal injection!');
