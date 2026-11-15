"use client";

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectDropdownProps {
  options: (string | MultiSelectOption)[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
  title?: string;
  multiLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  allLabel,
  title,
  multiLabel,
  searchable,
  searchPlaceholder = 'ស្វែងរក...',
  icon,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: MultiSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.left + 260 > window.innerWidth) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const showSearch = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  const filteredOptions = showSearch && searchQuery.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : normalizedOptions;

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const getButtonText = () => {
    if (selectedValues.length === 0) return allLabel;
    if (selectedValues.length === 1) {
      const found = normalizedOptions.find((o) => o.value === selectedValues[0]);
      return found ? found.label : selectedValues[0];
    }
    return multiLabel || allLabel;
  };

  const isFiltered = selectedValues.length > 0;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn"
        style={{
          padding: '0.45rem 0.75rem',
          background: 'var(--main-bg)',
          border: isFiltered ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        {icon}
        <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getButtonText()}
        </span>
        {selectedValues.length > 1 && (
          <span
            style={{
              background: 'var(--primary-color)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.05rem 0.45rem',
              borderRadius: '999px',
              lineHeight: 1.3,
            }}
          >
            {selectedValues.length}
          </span>
        )}
        <svg
          width="14"
          height="14"
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

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            ...(alignRight ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }),
            marginTop: '0.5rem',
            background: 'var(--modal-bg, var(--main-bg))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            width: '250px',
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: '340px',
            zIndex: 100,
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              {title || allLabel}
            </span>
            <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.78rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onChange(normalizedOptions.map((o) => o.value))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                រើសទាំងអស់
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>|</span>
              <button
                type="button"
                onClick={() => onChange([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger, #ef4444)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                សម្អាត
              </button>
            </div>
          </div>

          {showSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
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
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                មិនមានទិន្នន័យ
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.42rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                      background: isChecked ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleValue(opt.value)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--primary-color)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: isChecked ? 600 : 400,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
