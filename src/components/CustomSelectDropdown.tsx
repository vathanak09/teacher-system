"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectDropdownProps {
  options: (string | CustomSelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  menuMinWidth?: number;
  resetOnSelect?: boolean;
  autoOpen?: boolean;
  onMenuClose?: () => void;
}

export default function CustomSelectDropdown({
  options,
  value,
  onChange,
  placeholder = '-- ជ្រើសរើស --',
  emptyOptionLabel,
  searchable,
  searchPlaceholder = 'ស្វែងរក...',
  disabled = false,
  style,
  menuMinWidth = 220,
  resetOnSelect = false,
  autoOpen = false,
  onMenuClose,
}: CustomSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedOptions: CustomSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const showSearch = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onMenuClose?.();
  }, [onMenuClose]);

  const { containerRef, triggerRef, menuRef, menuStyle, maxListHeight } = usePortalMenuPosition({
    isOpen,
    onClose: handleClose,
    minWidth: menuMinWidth,
    maxPreferredHeight: 280,
  });

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const filteredOptions = showSearch && searchQuery.trim()
    ? normalizedOptions.filter((opt) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
      })
    : normalizedOptions;

  const displayLabel = selectedOption
    ? `${selectedOption.label}${selectedOption.sublabel ? ` (${selectedOption.sublabel})` : ''}`
    : (emptyOptionLabel && value === '' ? emptyOptionLabel : placeholder);

  const menuNode = isOpen && (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        ...menuStyle,
        background: 'var(--modal-bg, var(--main-bg))',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
        maxHeight: `${maxListHeight}px`,
        padding: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {showSearch && normalizedOptions.length > 0 && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.45rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
      )}

      <div
        style={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
        }}
      >
        {emptyOptionLabel && (
          <div
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = value === '' ? 'var(--bg-secondary)' : 'transparent')}
            style={{
              padding: '0.5rem 0.6rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.88rem',
              color: value === '' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: value === '' ? 'var(--bg-secondary)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ width: '16px', paddingTop: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {value === '' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{emptyOptionLabel}</span>
          </div>
        )}

        {filteredOptions.length === 0 ? (
          <div
            style={{
              padding: '0.75rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}
          >
            មិនមានទិន្នន័យត្រូវនឹងការស្វែងរក
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = !resetOnSelect && value === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? 'var(--bg-secondary)' : 'transparent')}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: '16px', paddingTop: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.9rem',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: 1.35,
                    }}
                  >
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        lineHeight: 1.3,
                        marginTop: '0.1rem',
                      }}
                    >
                      {opt.sublabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', maxWidth: '100%' }} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={displayLabel}
        onClick={() => {
          if (!disabled) {
            if (isOpen) handleClose();
            else setIsOpen(true);
          }
        }}
        className="input-field"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '100%',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          ...style,
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {typeof document !== 'undefined' && menuNode ? createPortal(menuNode, document.body) : null}
    </div>
  );
}
