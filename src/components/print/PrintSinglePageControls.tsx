"use client";

import React from 'react';
import { AppIcon } from '@/components/AppIcons';

export interface PrintSinglePageToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  title?: string;
}

export function PrintSinglePageToggle({
  checked,
  onChange,
  label = 'មើលម្ដង ១ ទំព័រ',
  title = 'ធីកដើម្បីមើលម្ដងមួយទំព័រ (ពេល Print ឬទាញយកនៅតែយកគ្រប់ទំព័រដែលបានជ្រើស)',
}: PrintSinglePageToggleProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.36rem',
        padding: '0.35rem 0.62rem',
        borderRadius: '8px',
        background: checked ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
        border: `1px solid ${checked ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}`,
        color: checked ? '#e0f2fe' : '#e2e8f0',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
      />
      <span>{label}</span>
    </label>
  );
}

export interface PrintSinglePageOption {
  key: string;
  label: string;
}

export interface PrintSinglePageNavBarProps {
  activeIdx: number;
  pages: PrintSinglePageOption[];
  onChangeIdx: (idx: number) => void;
  unitLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
}

export function PrintSinglePageNavBar({
  activeIdx,
  pages,
  onChangeIdx,
  unitLabel = 'ទំព័រ',
  prevLabel = 'ទំព័រមុន',
  nextLabel = 'ទំព័របន្ទាប់',
}: PrintSinglePageNavBarProps) {
  if (pages.length === 0) return null;
  const safeIdx = Math.max(0, Math.min(activeIdx, pages.length - 1));

  return (
    <div
      className="no-print"
      style={{
        position: 'sticky',
        top: '0.5rem',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.55rem',
        padding: '0.52rem 0.85rem',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.42)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        type="button"
        disabled={safeIdx <= 0}
        onClick={() => onChangeIdx(Math.max(0, safeIdx - 1))}
        style={{
          padding: '0.35rem 0.7rem',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: safeIdx <= 0 ? 'not-allowed' : 'pointer',
          opacity: safeIdx <= 0 ? 0.4 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <AppIcon name="chevron-left" size={14} />
        <span>{prevLabel}</span>
      </button>

      <select
        value={safeIdx}
        onChange={(e) => onChangeIdx(Number(e.target.value))}
        style={{
          padding: '0.34rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          background: '#0f172a',
          color: '#e0f2fe',
          fontSize: '0.78rem',
          fontWeight: 700,
          outline: 'none',
          maxWidth: '360px',
        }}
      >
        {pages.map((p, idx) => (
          <option key={p.key} value={idx}>
            {unitLabel}ទី {idx + 1} / {pages.length} — {p.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={safeIdx >= pages.length - 1}
        onClick={() => onChangeIdx(Math.min(pages.length - 1, safeIdx + 1))}
        style={{
          padding: '0.35rem 0.7rem',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: safeIdx >= pages.length - 1 ? 'not-allowed' : 'pointer',
          opacity: safeIdx >= pages.length - 1 ? 0.4 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span>{nextLabel}</span>
        <AppIcon name="chevron-right" size={14} />
      </button>
    </div>
  );
}
