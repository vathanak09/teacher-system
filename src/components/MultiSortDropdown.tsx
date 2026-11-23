"use client";

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';
import { AppIcon } from './AppIcons';

export interface MultiSortOption {
  value: string;
  label: string;
}

export interface SortRule {
  field: string;
  order: 'asc' | 'desc';
}

export interface MultiSortDropdownProps {
  options: MultiSortOption[];
  rules: SortRule[];
  onChange: (nextRules: SortRule[]) => void;
  defaultRules?: SortRule[];
  title?: string;
}

export default function MultiSortDropdown({
  options,
  rules,
  onChange,
  defaultRules = [],
  title = 'តម្រៀបបញ្ជី (អាច Tick ច្រើនតាមលំដាប់)',
}: MultiSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { containerRef, triggerRef, menuRef, menuStyle, maxListHeight } = usePortalMenuPosition({
    isOpen,
    onClose: handleClose,
    minWidth: 280,
    maxPreferredHeight: 420,
    preferAlignRight: true,
  });

  const toggleField = (field: string) => {
    const exists = rules.some((r) => r.field === field);
    if (exists) {
      onChange(rules.filter((r) => r.field !== field));
    } else {
      onChange([...rules, { field, order: 'asc' }]);
    }
  };

  const toggleOrder = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(
      rules.map((r) =>
        r.field === field ? { ...r, order: r.order === 'asc' ? 'desc' : 'asc' } : r
      )
    );
  };

  const moveRule = (field: string, dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = rules.findIndex((r) => r.field === field);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= rules.length) return;
    const copy = [...rules];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    onChange(copy);
  };

  const getOptionLabel = (field: string) =>
    options.find((o) => o.value === field)?.label || field;

  const buttonSummary = (() => {
    if (rules.length === 0) return 'តម្រៀប៖ លំនាំដើម';
    if (rules.length === 1) {
      return `តម្រៀប៖ ${getOptionLabel(rules[0].field)} (${rules[0].order === 'asc' ? 'A-Z' : 'Z-A'})`;
    }
    const first = getOptionLabel(rules[0].field);
    return `តម្រៀប៖ ${first} +${rules.length - 1}`;
  })();

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
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
        maxHeight: `${maxListHeight}px`,
        padding: '0.7rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          paddingBottom: '0.45rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
          {title}
        </span>
        <button
          type="button"
          onClick={() => onChange(defaultRules)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            whiteSpace: 'nowrap',
          }}
        >
          សម្អាត
        </button>
      </div>

      {/* Active Priority Chips */}
      {rules.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.3rem',
            paddingBottom: '0.35rem',
            borderBottom: '1px dashed var(--border-color)',
          }}
        >
          {rules.map((r, idx) => (
            <span
              key={r.field}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.16rem 0.45rem',
                borderRadius: '999px',
                background: 'rgba(79, 70, 229, 0.12)',
                color: '#4f46e5',
                fontSize: '0.73rem',
                fontWeight: 700,
              }}
            >
              <span>{idx + 1}.</span>
              <span>{getOptionLabel(r.field)}</span>
              <span>{r.order === 'asc' ? '↑' : '↓'}</span>
            </span>
          ))}
        </div>
      )}

      {/* Multi-Checkbox Options List */}
      <div
        style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          flex: 1,
        }}
      >
        {options.map((opt) => {
          const ruleIndex = rules.findIndex((r) => r.field === opt.value);
          const isChecked = ruleIndex >= 0;
          const rule = isChecked ? rules[ruleIndex] : null;

          return (
            <div
              key={opt.value}
              onClick={() => toggleField(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.42rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isChecked ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: isChecked ? '1px solid #4f46e5' : '1.5px solid var(--border-color)',
                    background: isChecked ? '#4f46e5' : 'transparent',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {isChecked ? ruleIndex + 1 : ''}
                </span>
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: isChecked ? 700 : 500,
                    color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {opt.label}
                </span>
              </div>

              {isChecked && rule && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  {rules.length > 1 && (
                    <>
                      <button
                        type="button"
                        disabled={ruleIndex === 0}
                        onClick={(e) => moveRule(opt.value, -1, e)}
                        title="ឡើងលំដាប់"
                        style={{
                          padding: '0.18rem',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: ruleIndex === 0 ? 'default' : 'pointer',
                          opacity: ruleIndex === 0 ? 0.35 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <AppIcon name="arrow-up" size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={ruleIndex === rules.length - 1}
                        onClick={(e) => moveRule(opt.value, 1, e)}
                        title="ចុះលំដាប់"
                        style={{
                          padding: '0.18rem',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: ruleIndex === rules.length - 1 ? 'default' : 'pointer',
                          opacity: ruleIndex === rules.length - 1 ? 0.35 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <AppIcon name="arrow-down" size={12} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => toggleOrder(opt.value, e)}
                    title={rule.order === 'asc' ? 'តូចទៅធំ (ចុចដើម្បីប្តូរ)' : 'ធំទៅតូច (ចុចដើម្បីប្តូរ)'}
                    style={{
                      padding: '0.16rem 0.42rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(79, 70, 229, 0.35)',
                      background: 'rgba(79, 70, 229, 0.12)',
                      color: '#4f46e5',
                      fontSize: '0.73rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rule.order === 'asc' ? 'A→Z ↑' : 'Z→A ↓'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="btn"
        style={{
          padding: '0.48rem 0.8rem',
          background: rules.length > 0 ? 'rgba(79, 70, 229, 0.09)' : 'var(--bg-secondary)',
          border:
            rules.length > 0
              ? '1px solid rgba(79, 70, 229, 0.45)'
              : '1px solid var(--border-color)',
          color: rules.length > 0 ? '#4f46e5' : 'var(--text-primary)',
          borderRadius: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontWeight: 700,
          fontSize: '0.86rem',
          whiteSpace: 'nowrap',
          maxWidth: '260px',
          cursor: 'pointer',
        }}
        title="តម្រៀបបញ្ជីឈ្មោះសិស្ស (អាច Tick ច្រើន)"
      >
        <AppIcon name="sliders" size={15} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{buttonSummary}</span>
        {rules.length > 0 && (
          <span
            style={{
              padding: '0.05rem 0.4rem',
              borderRadius: '999px',
              background: '#4f46e5',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            {rules.length}
          </span>
        )}
        <AppIcon name="chevron-down" size={14} />
      </button>

      {typeof document !== 'undefined' && menuNode ? createPortal(menuNode, document.body) : null}
    </div>
  );
}
