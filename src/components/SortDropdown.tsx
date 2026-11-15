"use client";

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';

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

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { containerRef, triggerRef, menuRef, menuStyle, maxListHeight } = usePortalMenuPosition({
    isOpen,
    onClose: handleClose,
    minWidth: 220,
    maxPreferredHeight: 360,
    preferAlignRight: true,
  });

  const currentOption = options.find(o => o.value === sortBy);
  const label = currentOption ? currentOption.label : 'តម្រៀប';

  const menuNode = isOpen && (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        ...menuStyle,
        background: 'var(--modal-bg, var(--main-bg))',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
        maxHeight: `${maxListHeight}px`,
        overflowY: 'auto',
        padding: '0.5rem 0',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
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
          <div style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {sortBy === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
          <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{opt.label}</span>
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
        <div style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
        <div style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {sortOrder === 'desc' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </div>
        ធំទៅតូច (z-a, 9-0)
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button 
        ref={triggerRef}
        type="button"
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
          maxWidth: '100%',
          borderRadius: '8px'
        }} 
        title="តម្រៀប"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="15 3 21 9 17 9 17 21 13 21 13 9 9 9 15 3"></polyline><polyline points="9 21 3 15 7 15 7 3 11 3 11 15 15 15 9 21"></polyline></svg>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>តម្រៀប: {label}</span>
      </button>

      {typeof document !== 'undefined' && menuNode ? createPortal(menuNode, document.body) : null}
    </div>
  );
}
