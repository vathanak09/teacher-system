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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            ចំនួនក្រុម (Number of Groups)
          </label>
          <input
            type="number"
            min="1"
            max={items.length || 1}
            value={numGroups}
            onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)}
            className="input-field"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={generateGroups}
          disabled={isGenerating || items.length === 0}
          style={{ padding: '0.75rem 2rem', height: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          {isGenerating ? (
            <span className="spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>
          )}
          បែងចែកក្រុម
        </button>
      </div>

      {/* Results */}
      {groups.length > 0 && !isGenerating && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} style={{
              background: 'var(--panel-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid var(--primary-color)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem' }}>ក្រុមទី {groupIdx + 1}</h3>
                <span style={{ background: 'var(--main-bg)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {group.length} នាក់
                </span>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {group.map((member, memberIdx) => (
                  <li key={memberIdx} style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--main-bg)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem', width: '20px' }}>{memberIdx + 1}.</span>
                    <span style={{ fontWeight: 500 }}>{member}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
