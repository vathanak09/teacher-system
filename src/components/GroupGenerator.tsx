"use client";
import React, { useState } from 'react';

interface GroupGeneratorProps {
  items: string[];
}

const GroupGenerator: React.FC<GroupGeneratorProps> = ({ items }) => {
  const [numGroups, setNumGroups] = useState<number>(2);
  const [groups, setGroups] = useState<string[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateGroups = () => {
    if (items.length === 0) return;
    
    setIsGenerating(true);
    
    // Simulate thinking/shuffling time for fun
    setTimeout(() => {
      // Shuffle array using Fisher-Yates
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Distribute into groups
      const actualGroupsCount = Math.max(1, Math.min(numGroups, items.length));
      const newGroups: string[][] = Array.from({ length: actualGroupsCount }, () => []);
      
      shuffled.forEach((item, index) => {
        newGroups[index % actualGroupsCount].push(item);
      });

      setGroups(newGroups);
      setIsGenerating(false);
    }, 800); // 800ms "calculating" delay
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: show a small toast or visual feedback
      const el = document.getElementById('copy-feedback');
      if (el) {
        el.style.opacity = '1';
        setTimeout(() => el.style.opacity = '0', 2000);
      }
    });
  };

  const copyGroup = (groupIndex: number) => {
    const groupName = `ក្រុម ${groupIndex + 1}`;
    const members = groups[groupIndex].join('\n');
    copyToClipboard(`${groupName}:\n${members}`);
  };

  const copyAllGroups = () => {
    const text = groups.map((g, i) => `ក្រុម ${i + 1}:\n${g.join('\n')}`).join('\n\n');
    copyToClipboard(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Configuration Area */}
      <div style={{ background: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            ចំនួនក្រុម (Number of Groups)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => setNumGroups(Math.max(1, numGroups - 1))}
              className="btn"
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)' }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={items.length || 1}
              value={numGroups}
              onChange={(e) => setNumGroups(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              style={{ width: '80px', textAlign: 'center', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
            />
            <button 
              onClick={() => setNumGroups(Math.min(items.length || 1, numGroups + 1))}
              className="btn"
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)' }}
            >
              +
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateGroups}
          disabled={isGenerating || items.length === 0}
          style={{ padding: '0.75rem 2rem', height: '52px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          {isGenerating ? (
            <span className="spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              បង្កើតក្រុម
            </>
          )}
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          សូមជ្រើសរើសបញ្ជីរង់ចាំ ដើម្បីបែងចែកក្រុម
        </div>
      )}

      {/* Results Area */}
      {groups.length > 0 && !isGenerating && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>លទ្ធផលនៃការបែងចែក៖ {groups.length} ក្រុម</h3>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span id="copy-feedback" style={{ opacity: 0, transition: 'opacity 0.2s', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
                បានចម្លង ✓
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  onChange={(e) => {
                    if (e.target.value === 'all') copyAllGroups();
                    else if (e.target.value !== '') copyGroup(Number(e.target.value));
                    e.target.value = ''; // Reset select
                  }}
                  className="input-field"
                  style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 1rem', background: 'var(--card-bg)' }}
                >
                  <option value="">ចម្លងអត្ថបទ...</option>
                  <option value="all">ចម្លងទាំងអស់ (Copy All)</option>
                  {groups.map((_, idx) => (
                    <option key={`opt-${idx}`} value={idx}>ចម្លង ក្រុម {idx + 1}</option>
                  ))}
                </select>
                <button onClick={copyAllGroups} className="btn btn-primary" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy All
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1.5rem',
            alignItems: 'start'
          }}>
            {groups.map((group, index) => (
              <div 
                key={index} 
                className="glass-panel"
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '16px',
                  background: 'var(--main-bg)',
                  borderTop: `4px solid ${colors[index % colors.length]}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: colors[index % colors.length],
                    fontSize: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <span style={{ 
                      background: `${colors[index % colors.length]}20`, 
                      width: '32px', height: '32px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px'
                    }}>
                      {index + 1}
                    </span>
                    ក្រុមទី {index + 1}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {group.length} នាក់
                  </span>
                </div>
                
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.map((member, mIdx) => (
                    <li 
                      key={mIdx}
                      style={{ 
                        padding: '0.5rem 0.75rem',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[index % colors.length] }} />
                      {member}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GroupGenerator;
