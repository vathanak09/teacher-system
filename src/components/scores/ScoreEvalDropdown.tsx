"use client";

import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';
import { AppIcon } from '@/components/AppIcons';
import {
  EVALUATION_GRADE_OPTIONS,
  getEvaluationVisualStyle,
  normalizeEvaluationValue,
} from './scoreColumns';

export interface ScoreEvalDropdownProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  disabled?: boolean;
}

export default function ScoreEvalDropdown({
  value,
  onChange,
  title,
  disabled = false,
}: ScoreEvalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedVal = normalizeEvaluationValue(value);
  const visual = getEvaluationVisualStyle(normalizedVal);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { containerRef, triggerRef, menuRef, menuStyle, maxListHeight } =
    usePortalMenuPosition({
      isOpen,
      onClose: handleClose,
      minWidth: 158,
      maxPreferredHeight: 240,
    });

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
        padding: '0.45rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {EVALUATION_GRADE_OPTIONS.map((opt) => {
        const isSelected = normalizedVal === opt;
        const optStyle = getEvaluationVisualStyle(opt);
        return (
          <div
            key={opt}
            onClick={() => {
              onChange(opt);
              setIsOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isSelected
                ? 'var(--bg-secondary)'
                : 'transparent';
            }}
            style={{
              padding: '0.42rem 0.55rem',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: isSelected ? 'var(--bg-secondary)' : 'transparent',
              color: optStyle.color,
              fontWeight: isSelected ? 700 : 600,
              fontSize: '0.84rem',
              transition: 'background 0.14s ease',
            }}
          >
            <div
              style={{
                width: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isSelected ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: optStyle.color,
                    opacity: 0.72,
                  }}
                />
              )}
            </div>
            <span style={{ whiteSpace: 'nowrap' }}>{opt}</span>
          </div>
        );
      })}

      {normalizedVal && (
        <>
          <div
            style={{
              height: '1px',
              background: 'var(--border-color)',
              margin: '0.15rem 0',
            }}
          />
          <div
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            style={{
              padding: '0.38rem 0.55rem',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 500,
              transition: 'background 0.14s ease',
            }}
          >
            <AppIcon name="x" size={12} />
            <span>សម្អាត</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={title || (normalizedVal ? normalizedVal : 'ជ្រើសរើសការវាយតម្លៃ')}
        className={`score-eval-trigger${normalizedVal ? ' has-value' : ''}${isOpen ? ' is-open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        style={{
          color: visual.color,
          background: normalizedVal ? visual.background : 'var(--main-bg)',
          borderColor: isOpen
            ? 'var(--accent-primary)'
            : normalizedVal
              ? visual.borderColor
              : 'transparent',
        }}
      >
        {normalizedVal ? (
          <span className="score-eval-trigger-text">{normalizedVal}</span>
        ) : (
          <AppIcon
            name="chevron-down"
            size={13}
            style={{
              opacity: 0.72,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        )}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(menuNode, document.body)}
    </div>
  );
}
