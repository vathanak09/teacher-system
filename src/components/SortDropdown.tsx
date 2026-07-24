import React, { useState, useRef, useEffect } from 'react';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export default function SortDropdown({ options, sortBy, sortOrder, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(o => o.value === sortBy);
  const label = currentOption ? currentOption.label : 'តម្រៀប';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn" 
        style={{ 
          padding: '0.45rem 0.75rem', 
          background: 'var(--main-bg)', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          borderRadius: '8px'
        }} 
        title="តម្រៀប"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 9 17 9 17 21 13 21 13 9 9 9 15 3"></polyline><polyline points="9 21 3 15 7 15 7 3 11 3 11 15 15 15 9 21"></polyline></svg>
        តម្រៀប: {label}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--main-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '220px',
          zIndex: 50,
          padding: '0.5rem 0',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ជ្រើសរើសជួរឈរ (Column)</div>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => {
                onSortChange(opt.value, sortOrder);
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: sortBy === opt.value ? 'var(--bg-secondary)' : 'transparent',
                color: sortBy === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = sortBy === opt.value ? 'var(--bg-secondary)' : 'transparent')}
            >
              <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
                {sortBy === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              {opt.label}
            </div>
          ))}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
          
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>លំដាប់ (Order)</div>
          
          <div 
            onClick={() => {
              if (sortOrder !== 'asc') {
                 onSortChange(sortBy, 'asc');
              }
              setIsOpen(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: sortOrder === 'asc' ? 'var(--bg-secondary)' : 'transparent',
              color: sortOrder === 'asc' ? 'var(--accent-primary)' : 'var(--text-primary)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = sortOrder === 'asc' ? 'var(--bg-secondary)' : 'transparent')}
          >
            <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
              {sortOrder === 'asc' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            តូចទៅធំ (a-Z, 0-9)
          </div>
          
          <div 
            onClick={() => {
              if (sortOrder !== 'desc') {
                 onSortChange(sortBy, 'desc');
              }
              setIsOpen(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: sortOrder === 'desc' ? 'var(--bg-secondary)' : 'transparent',
              color: sortOrder === 'desc' ? 'var(--accent-primary)' : 'var(--text-primary)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = sortOrder === 'desc' ? 'var(--bg-secondary)' : 'transparent')}
          >
            <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
              {sortOrder === 'desc' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            ធំទៅតូច (z-a, 9-0)
          </div>

        </div>
      )}
    </div>
  );
}
