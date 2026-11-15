"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';

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
  columns?: number;
  fixedTriggerLabel?: string;
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
  columns = 1,
  fixedTriggerLabel,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedOptions: MultiSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { containerRef, triggerRef, menuRef, menuStyle, maxListHeight } = usePortalMenuPosition({
    isOpen,
    onClose: handleClose,
    minWidth: columns > 1 ? 280 : 240,
    maxPreferredHeight: 340,
  });

  useEffect(() => {
    if (!isOpen) {
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
    if (fixedTriggerLabel) return fixedTriggerLabel;
    if (selectedValues.length === 0) return allLabel;
    if (selectedValues.length === 1) {
      const found = normalizedOptions.find((o) => o.value === selectedValues[0]);
      return found ? found.label : selectedValues[0];
    }
    return multiLabel || allLabel;
  };

  const isFiltered = selectedValues.length > 0;

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
          display: columns > 1 ? 'grid' : 'flex',
          ...(columns > 1
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '0.35rem' }
            : { flexDirection: 'column', gap: '0.2rem' }),
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
                  alignItems: 'flex-start',
                  gap: '0.5rem',
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
                    marginTop: '2px',
                    accentColor: 'var(--primary-color)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: isChecked ? 600 : 400,
                    flex: 1,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.35,
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
  );

  return (
    <div style={{ position: 'relative', maxWidth: '100%' }} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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
          maxWidth: '100%',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        {icon}
        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getButtonText()}
        </span>
        {selectedValues.length > 1 && !fixedTriggerLabel && (
          <span
            style={{
              background: 'var(--primary-color)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.05rem 0.45rem',
              borderRadius: '999px',
              lineHeight: 1.3,
              flexShrink: 0,
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

      {typeof document !== 'undefined' && menuNode ? createPortal(menuNode, document.body) : null}
    </div>
  );
}
