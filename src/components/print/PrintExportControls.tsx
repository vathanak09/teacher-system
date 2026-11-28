"use client";

import React, { useEffect, useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import {
  EXPORT_QUALITY_OPTIONS,
  ExportQualityScale,
  PRINT_EXPORT_QUALITY_STORAGE_KEY,
  exportPrintSheetsAsPdf,
  exportPrintSheetsAsPng,
} from '@/utils/printExport';

export interface PrintExportControlsProps {
  /** Returns the currently selected/rendered printable DOM sheet elements */
  getExportElements: () => HTMLElement[];
  /** Base file name without extension */
  fileNameBase: string;
  /** Disabled when no pages are selected/rendered */
  disabled?: boolean;
  /** Optional title tooltip override when disabled */
  disabledTitle?: string;
  /** Toolbar visual theme: 'dark' for print modals, 'light' for in-page cards */
  variant?: 'dark' | 'light';
}

function readStoredQuality(): ExportQualityScale {
  if (typeof window === 'undefined') return 3;
  try {
    const raw = Number(localStorage.getItem(PRINT_EXPORT_QUALITY_STORAGE_KEY));
    if (raw === 2 || raw === 3 || raw === 4 || raw === 5) return raw;
  } catch {
    // ignore storage read errors
  }
  return 3;
}

export default function PrintExportControls({
  getExportElements,
  fileNameBase,
  disabled = false,
  disabledTitle,
  variant = 'dark',
}: PrintExportControlsProps) {
  const [quality, setQuality] = useState<ExportQualityScale>(3);
  const [exportState, setExportState] = useState<{
    kind: 'pdf' | 'png';
    current: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    setQuality(readStoredQuality());
  }, []);

  const handleChangeQuality = (next: ExportQualityScale) => {
    setQuality(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRINT_EXPORT_QUALITY_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
    }
  };

  const handleExport = async (kind: 'pdf' | 'png') => {
    if (disabled || exportState) return;
    const elements = getExportElements();
    if (elements.length === 0) return;

    setExportState({ kind, current: 1, total: elements.length });
    try {
      const fn = kind === 'pdf' ? exportPrintSheetsAsPdf : exportPrintSheetsAsPng;
      await fn({
        elements,
        fileNameBase,
        scale: quality,
        onProgress: (current, total) => setExportState({ kind, current, total }),
      });
    } catch (err) {
      console.error(`Failed to export ${kind}:`, err);
    } finally {
      setExportState(null);
    }
  };

  const isBusy = exportState !== null;
  const isDisabled = disabled || isBusy;
  const isLight = variant === 'light';

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.28rem',
    padding: '0.18rem 0.24rem',
    borderRadius: '9px',
    background: isLight ? 'var(--bg-secondary)' : 'rgba(15, 23, 42, 0.72)',
    border: isLight ? '1px solid var(--border-color)' : '1px solid rgba(148, 163, 184, 0.3)',
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.28rem 0.42rem',
    borderRadius: '6px',
    border: isLight ? '1px solid var(--border-color)' : '1px solid rgba(148, 163, 184, 0.32)',
    background: isLight ? 'var(--card-bg)' : '#1e293b',
    color: isLight ? 'var(--text-primary)' : '#e2e8f0',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: isBusy ? 'wait' : 'pointer',
    outline: 'none',
  };

  const pdfLabel =
    exportState?.kind === 'pdf'
      ? `PDF (${exportState.current}/${exportState.total})`
      : 'PDF';

  const pngLabel =
    exportState?.kind === 'png'
      ? `រូបភាព (${exportState.current}/${exportState.total})`
      : 'រូបភាព';

  return (
    <div
      className="no-print"
      style={wrapperStyle}
      title={disabled && disabledTitle ? disabledTitle : 'ទាញយកអ្វីដែលបានជ្រើសរើសជា PDF ឬរូបភាព'}
    >
      <select
        aria-label="កម្រិតគុណភាព Export"
        value={quality}
        disabled={isBusy}
        onChange={(e) => handleChangeQuality(Number(e.target.value) as ExportQualityScale)}
        style={selectStyle}
        title="ជ្រើសរើសគុណភាព Export (2x - 5x)"
      >
        {EXPORT_QUALITY_OPTIONS.map((q) => (
          <option key={q} value={q}>
            {q}x
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => handleExport('pdf')}
        title={
          disabled && disabledTitle
            ? disabledTitle
            : `ទាញយកជា PDF គុណភាព ${quality}x`
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.34rem 0.6rem',
          borderRadius: '6px',
          border: 'none',
          background: isDisabled
            ? isLight
              ? 'rgba(148, 163, 184, 0.25)'
              : '#334155'
            : 'linear-gradient(135deg, #e11d48, #be123c)',
          color: isDisabled ? (isLight ? 'var(--text-secondary)' : '#94a3b8') : '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: isDisabled ? (isBusy ? 'wait' : 'not-allowed') : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <AppIcon name="file-text" size={13} />
        <span>{pdfLabel}</span>
      </button>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => handleExport('png')}
        title={
          disabled && disabledTitle
            ? disabledTitle
            : `ទាញយកជារូបភាព PNG គុណភាព ${quality}x`
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.34rem 0.6rem',
          borderRadius: '6px',
          border: 'none',
          background: isDisabled
            ? isLight
              ? 'rgba(148, 163, 184, 0.25)'
              : '#334155'
            : 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: isDisabled ? (isLight ? 'var(--text-secondary)' : '#94a3b8') : '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: isDisabled ? (isBusy ? 'wait' : 'not-allowed') : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <AppIcon name="image" size={13} />
        <span>{pngLabel}</span>
      </button>
    </div>
  );
}
