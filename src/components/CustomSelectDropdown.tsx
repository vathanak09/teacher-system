"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectDropdownProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function CustomSelectDropdown({
  options,
  value,
  onChange,
  placeholder = '-- ជ្រើសរើស --',
  emptyOptionLabel,
  searchable = true,
  searchPlaceholder = 'ស្វែងរក...',
}: CustomSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computeMenuStyle = useCallback((): React.CSSProperties => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = Math.min(Math.max(rect.width, 250), window.innerWidth - 16);
    const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
    const left = Math.min(rect.left, maxLeft);

    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 280;
    const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

    return {
      position: 'fixed',
      left: `${left}px`,
      width: `${menuWidth}px`,
      ...(openUpward
        ? { bottom: `${window.innerHeight - rect.top + 6}px`, top: 'auto' }
        : { top: `${rect.bottom + 6}px`, bottom: 'auto' }),
      zIndex: 20000,
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setMenuStyle(computeMenuStyle());
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMenuStyle(computeMenuStyle());
      const handleScrollOrResize = (e: Event) => {
        if (menuRef.current && menuRef.current.contains(e.target as Node)) {
          return;
        }
        setMenuStyle(computeMenuStyle());
      };
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    } else {
      setSearchQuery('');
    }
  }, [isOpen, computeMenuStyle]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
      })
    : options;

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
        maxHeight: '280px',
        padding: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {searchable && options.length > 0 && (
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
              padding: '0.48rem 0.6rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              color: value === '' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: value === '' ? 'var(--bg-secondary)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {value === '' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span>{emptyOptionLabel}</span>
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
            const isSelected = value === opt.value;
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
                  padding: '0.48rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
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
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="input-field"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedOption
            ? `${selectedOption.label}${selectedOption.sublabel ? ` (${selectedOption.sublabel})` : ''}`
            : placeholder}
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
