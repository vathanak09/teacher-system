"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { settingsService } from '@/services/db';

export type PrintDocCategory =
  | 'attendance'
  | 'monthly_result'
  | 'receipt'
  | 'due_notice'
  | 'honor_roll';

export type TableSelectionMode = 'cell' | 'row' | 'col';
export type TableSectionName = 'thead' | 'tbody' | 'tfoot';

export interface TableCellCoord {
  pageIdx: number;
  tableIdx: number;
  section: TableSectionName;
  rowIdx: number;
  colIdx: number;
  textPreview?: string;
}

export interface TableCellStyleOverride {
  fontFamily?: string;
  fontSizePt?: number | null;
  fontWeight?: 'default' | '400' | '500' | '600' | '700' | '800';
  fontStyle?: 'default' | 'normal' | 'italic';
  textDecoration?: 'default' | 'none' | 'underline';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'default' | 'left' | 'center' | 'right';
  letterSpacingPx?: number | null;
  wordSpacingPx?: number | null;
  lineHeight?: number | null;
  paddingYPx?: number | null;
  paddingXPx?: number | null;
}

export interface PrintDocumentStyleConfig {
  /** Body / general font family CSS value (empty = keep template default) */
  fontFamily: string;
  /** Title / heading font family CSS value (empty = keep template default) */
  headingFontFamily: string;
  /** General body text size in pt (null = keep template default) */
  bodyFontSizePt: number | null;
  /** Heading / title text size in pt (null = keep template default) */
  titleFontSizePt: number | null;
  /** Global font weight override */
  fontWeight: 'default' | '400' | '500' | '600' | '700';
  /** Line height multiplier (null = default, e.g. 1.0 - 2.2) */
  lineHeight: number | null;
  /** Letter spacing in px (null = default, e.g. -0.5 to 4) */
  letterSpacingPx: number | null;
  /** Space / word spacing in px (null = default, e.g. -2 to 16) */
  wordSpacingPx: number | null;
  /** General text color override (empty = keep template default) */
  textColor: string;
  /** Page outer padding override in mm (null = keep template default) */
  pagePaddingMm: number | null;
  /** Monochrome / Black & White print mode for laser printers */
  grayscalePrint: boolean;

  // Global Table-specific settings (Attendance, Monthly Result, Receipt/Due tables)
  /** Table body text size in pt (null = default) */
  tableFontSizePt: number | null;
  /** Table header text size in pt (null = default) */
  tableHeaderFontSizePt: number | null;
  /** Table cell vertical padding in px (null = default) */
  tableCellPadYPx: number | null;
  /** Table cell horizontal padding in px (null = default) */
  tableCellPadXPx: number | null;
  /** Table body row min height in mm (null = default) */
  tableRowHeightMm: number | null;
  /** Table border width in px (null = default) */
  tableBorderWidthPx: number | null;
  /** Table border color hex (empty = default) */
  tableBorderColor: string;
  /** Table header background color hex (empty = default) */
  tableHeaderBg: string;
  /** Table header text color hex (empty = default) */
  tableHeaderColor: string;
  /** Even row zebra stripe background hex (empty = default) */
  tableStripeBg: string;
  /** Table body cell text alignment override */
  tableCellAlign: 'default' | 'left' | 'center' | 'right';

  /** Per-cell, per-row, and per-column style overrides on printable tables */
  cellOverrides: Record<string, TableCellStyleOverride>;
}

export interface SavedPrintDocumentPreset {
  id: string;
  name: string;
  docCategory: PrintDocCategory;
  styleConfig: PrintDocumentStyleConfig;
  docOptions?: Record<string, any>;
  updatedAt: string;
}

export const DEFAULT_PRINT_STYLE_CONFIG: PrintDocumentStyleConfig = {
  fontFamily: '',
  headingFontFamily: '',
  bodyFontSizePt: null,
  titleFontSizePt: null,
  fontWeight: 'default',
  lineHeight: null,
  letterSpacingPx: null,
  wordSpacingPx: null,
  textColor: '',
  pagePaddingMm: null,
  grayscalePrint: false,

  tableFontSizePt: null,
  tableHeaderFontSizePt: null,
  tableCellPadYPx: null,
  tableCellPadXPx: null,
  tableRowHeightMm: null,
  tableBorderWidthPx: null,
  tableBorderColor: '',
  tableHeaderBg: '',
  tableHeaderColor: '',
  tableStripeBg: '',
  tableCellAlign: 'default',
  cellOverrides: {},
};

function clampOptNum(
  val: unknown,
  min: number,
  max: number
): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function sanitizeCssVal(raw: string): string {
  return String(raw || '').replace(/[{};<>]/g, '').trim();
}

export function normalizeCellOverride(
  raw?: Partial<TableCellStyleOverride> | null
): TableCellStyleOverride {
  const src = raw || {};
  const out: TableCellStyleOverride = {};

  if (typeof src.fontFamily === 'string' && src.fontFamily.trim()) {
    out.fontFamily = sanitizeCssVal(src.fontFamily);
  }
  const fSize = clampOptNum(src.fontSizePt, 4.5, 32);
  if (fSize !== null) out.fontSizePt = fSize;

  if (
    src.fontWeight === '400' ||
    src.fontWeight === '500' ||
    src.fontWeight === '600' ||
    src.fontWeight === '700' ||
    src.fontWeight === '800'
  ) {
    out.fontWeight = src.fontWeight;
  }
  if (src.fontStyle === 'normal' || src.fontStyle === 'italic') {
    out.fontStyle = src.fontStyle;
  }
  if (src.textDecoration === 'none' || src.textDecoration === 'underline') {
    out.textDecoration = src.textDecoration;
  }
  if (typeof src.color === 'string' && src.color.trim()) {
    out.color = sanitizeCssVal(src.color);
  }
  if (typeof src.backgroundColor === 'string' && src.backgroundColor.trim()) {
    out.backgroundColor = sanitizeCssVal(src.backgroundColor);
  }
  if (
    src.textAlign === 'left' ||
    src.textAlign === 'center' ||
    src.textAlign === 'right'
  ) {
    out.textAlign = src.textAlign;
  }
  const ls = clampOptNum(src.letterSpacingPx, -1.5, 8);
  if (ls !== null) out.letterSpacingPx = ls;

  const ws = clampOptNum(src.wordSpacingPx, -4, 24);
  if (ws !== null) out.wordSpacingPx = ws;

  const lh = clampOptNum(src.lineHeight, 0.8, 2.6);
  if (lh !== null) out.lineHeight = lh;

  const py = clampOptNum(src.paddingYPx, 0, 24);
  if (py !== null) out.paddingYPx = py;

  const px = clampOptNum(src.paddingXPx, 0, 28);
  if (px !== null) out.paddingXPx = px;

  return out;
}

export function isCellOverrideEmpty(ov?: TableCellStyleOverride | null): boolean {
  if (!ov) return true;
  return Object.keys(normalizeCellOverride(ov)).length === 0;
}

export function normalizePrintStyleConfig(
  raw?: Partial<PrintDocumentStyleConfig> | null
): PrintDocumentStyleConfig {
  const src = raw || {};
  const fw =
    src.fontWeight === '400' ||
    src.fontWeight === '500' ||
    src.fontWeight === '600' ||
    src.fontWeight === '700'
      ? src.fontWeight
      : 'default';
  const align =
    src.tableCellAlign === 'left' ||
    src.tableCellAlign === 'center' ||
    src.tableCellAlign === 'right'
      ? src.tableCellAlign
      : 'default';

  const cleanOverrides: Record<string, TableCellStyleOverride> = {};
  if (src.cellOverrides && typeof src.cellOverrides === 'object') {
    for (const [k, v] of Object.entries(src.cellOverrides)) {
      if (!k || typeof v !== 'object' || !v) continue;
      const norm = normalizeCellOverride(v);
      if (Object.keys(norm).length > 0) {
        cleanOverrides[k] = norm;
      }
    }
  }

  return {
    fontFamily: typeof src.fontFamily === 'string' ? src.fontFamily.trim() : '',
    headingFontFamily:
      typeof src.headingFontFamily === 'string' ? src.headingFontFamily.trim() : '',
    bodyFontSizePt: clampOptNum(src.bodyFontSizePt, 5.5, 22),
    titleFontSizePt: clampOptNum(src.titleFontSizePt, 8, 28),
    fontWeight: fw,
    lineHeight: clampOptNum(src.lineHeight, 0.85, 2.4),
    letterSpacingPx: clampOptNum(src.letterSpacingPx, -1, 6),
    wordSpacingPx: clampOptNum(src.wordSpacingPx, -3, 18),
    textColor: typeof src.textColor === 'string' ? src.textColor.trim() : '',
    pagePaddingMm: clampOptNum(src.pagePaddingMm, 0, 25),
    grayscalePrint: Boolean(src.grayscalePrint),

    tableFontSizePt: clampOptNum(src.tableFontSizePt, 5, 16),
    tableHeaderFontSizePt: clampOptNum(src.tableHeaderFontSizePt, 5, 16),
    tableCellPadYPx: clampOptNum(src.tableCellPadYPx, 0, 16),
    tableCellPadXPx: clampOptNum(src.tableCellPadXPx, 0, 18),
    tableRowHeightMm: clampOptNum(src.tableRowHeightMm, 3, 16),
    tableBorderWidthPx: clampOptNum(src.tableBorderWidthPx, 0.5, 3),
    tableBorderColor:
      typeof src.tableBorderColor === 'string' ? src.tableBorderColor.trim() : '',
    tableHeaderBg:
      typeof src.tableHeaderBg === 'string' ? src.tableHeaderBg.trim() : '',
    tableHeaderColor:
      typeof src.tableHeaderColor === 'string' ? src.tableHeaderColor.trim() : '',
    tableStripeBg:
      typeof src.tableStripeBg === 'string' ? src.tableStripeBg.trim() : '',
    tableCellAlign: align,
    cellOverrides: cleanOverrides,
  };
}

export function hasCustomPrintStyle(cfg: PrintDocumentStyleConfig): boolean {
  return (
    Boolean(cfg.fontFamily) ||
    Boolean(cfg.headingFontFamily) ||
    cfg.bodyFontSizePt !== null ||
    cfg.titleFontSizePt !== null ||
    cfg.fontWeight !== 'default' ||
    cfg.lineHeight !== null ||
    cfg.letterSpacingPx !== null ||
    cfg.wordSpacingPx !== null ||
    Boolean(cfg.textColor) ||
    cfg.pagePaddingMm !== null ||
    cfg.grayscalePrint ||
    cfg.tableFontSizePt !== null ||
    cfg.tableHeaderFontSizePt !== null ||
    cfg.tableCellPadYPx !== null ||
    cfg.tableCellPadXPx !== null ||
    cfg.tableRowHeightMm !== null ||
    cfg.tableBorderWidthPx !== null ||
    Boolean(cfg.tableBorderColor) ||
    Boolean(cfg.tableHeaderBg) ||
    Boolean(cfg.tableHeaderColor) ||
    Boolean(cfg.tableStripeBg) ||
    cfg.tableCellAlign !== 'default' ||
    Object.keys(cfg.cellOverrides || {}).length > 0
  );
}

/**
 * Deterministic key builder for per-cell / per-row / per-column table overrides.
 * Format:
 *  - cell:p{page|*}:t{t}:{sec}:r{r}:c{c}
 *  - row:p{page|*}:t{t}:{sec}:r{r}
 *  - col:p{page|*}:t{t}:{sec}:c{c}
 */
export function makeTableOverrideKey(
  mode: TableSelectionMode,
  coord: TableCellCoord,
  applyAllPages: boolean
): string {
  const pPart = applyAllPages ? 'p*' : `p${coord.pageIdx}`;
  if (mode === 'row') {
    return `row:${pPart}:t${coord.tableIdx}:${coord.section}:r${coord.rowIdx}`;
  }
  if (mode === 'col') {
    return `col:${pPart}:t${coord.tableIdx}:${coord.section}:c${coord.colIdx}`;
  }
  return `cell:${pPart}:t${coord.tableIdx}:${coord.section}:r${coord.rowIdx}:c${coord.colIdx}`;
}

interface ParsedOverrideKey {
  kind: TableSelectionMode;
  pageSpec: string; // '*' or number string
  tableIdx: number;
  section: TableSectionName;
  rowIdx?: number;
  colIdx?: number;
}

function parseTableOverrideKey(key: string): ParsedOverrideKey | null {
  const mCell = /^cell:p(\*|\d+):t(\d+):(thead|tbody|tfoot):r(\d+):c(\d+)$/.exec(key);
  if (mCell) {
    return {
      kind: 'cell',
      pageSpec: mCell[1],
      tableIdx: Number(mCell[2]),
      section: mCell[3] as TableSectionName,
      rowIdx: Number(mCell[4]),
      colIdx: Number(mCell[5]),
    };
  }
  const mRow = /^row:p(\*|\d+):t(\d+):(thead|tbody|tfoot):r(\d+)$/.exec(key);
  if (mRow) {
    return {
      kind: 'row',
      pageSpec: mRow[1],
      tableIdx: Number(mRow[2]),
      section: mRow[3] as TableSectionName,
      rowIdx: Number(mRow[4]),
    };
  }
  const mCol = /^col:p(\*|\d+):t(\d+):(thead|tbody|tfoot):c(\d+)$/.exec(key);
  if (mCol) {
    return {
      kind: 'col',
      pageSpec: mCol[1],
      tableIdx: Number(mCol[2]),
      section: mCol[3] as TableSectionName,
      colIdx: Number(mCol[4]),
    };
  }
  return null;
}

function overridePriority(parsed: ParsedOverrideKey): number {
  const kindWeight = parsed.kind === 'col' ? 0 : parsed.kind === 'row' ? 10 : 20;
  const pageWeight = parsed.pageSpec === '*' ? 0 : 1;
  return kindWeight + pageWeight;
}

function buildCellSelectorForKey(scopeId: string, parsed: ParsedOverrideKey): string {
  const scopePrefix =
    parsed.pageSpec === '*'
      ? `[data-print-scope="${scopeId}"]`
      : `[data-print-scope="${scopeId}"][data-pt-p="${parsed.pageSpec}"]`;

  if (parsed.kind === 'col') {
    return `${scopePrefix} [data-pt-cell="1"][data-pt-t="${parsed.tableIdx}"][data-pt-sec="${parsed.section}"][data-pt-c="${parsed.colIdx}"]`;
  }
  if (parsed.kind === 'row') {
    return `${scopePrefix} [data-pt-cell="1"][data-pt-t="${parsed.tableIdx}"][data-pt-sec="${parsed.section}"][data-pt-r="${parsed.rowIdx}"]`;
  }
  return `${scopePrefix} [data-pt-cell="1"][data-pt-t="${parsed.tableIdx}"][data-pt-sec="${parsed.section}"][data-pt-r="${parsed.rowIdx}"][data-pt-c="${parsed.colIdx}"]`;
}

/**
 * Compiles all per-column, per-row, and per-cell table overrides into deterministic CSS
 * that works identically in live preview AND @media print.
 */
export function buildTableCellOverridesCss(
  scopeId: string,
  overrides: Record<string, TableCellStyleOverride>
): string {
  const entries = Object.entries(overrides || {})
    .map(([key, ov]) => ({ key, parsed: parseTableOverrideKey(key), ov: normalizeCellOverride(ov) }))
    .filter((item): item is { key: string; parsed: ParsedOverrideKey; ov: TableCellStyleOverride } =>
      Boolean(item.parsed && Object.keys(item.ov).length > 0)
    )
    .sort((a, b) => overridePriority(a.parsed) - overridePriority(b.parsed));

  if (entries.length === 0) return '';

  const chunks: string[] = [];
  for (const { parsed, ov } of entries) {
    const cellSel = buildCellSelectorForKey(scopeId, parsed);
    const cellRules: string[] = [];
    const textRules: string[] = [];

    if (ov.fontFamily) {
      const f = sanitizeCssVal(ov.fontFamily);
      cellRules.push(`font-family: ${f} !important;`);
      textRules.push(`font-family: ${f} !important;`);
    }
    if (ov.fontSizePt !== undefined && ov.fontSizePt !== null) {
      cellRules.push(`font-size: ${ov.fontSizePt}pt !important;`);
      textRules.push(`font-size: ${ov.fontSizePt}pt !important;`);
    }
    if (ov.fontWeight && ov.fontWeight !== 'default') {
      cellRules.push(`font-weight: ${ov.fontWeight} !important;`);
      textRules.push(`font-weight: ${ov.fontWeight} !important;`);
    }
    if (ov.fontStyle && ov.fontStyle !== 'default') {
      cellRules.push(`font-style: ${ov.fontStyle} !important;`);
      textRules.push(`font-style: ${ov.fontStyle} !important;`);
    }
    if (ov.textDecoration && ov.textDecoration !== 'default') {
      cellRules.push(`text-decoration: ${ov.textDecoration} !important;`);
      textRules.push(`text-decoration: ${ov.textDecoration} !important;`);
    }
    if (ov.color) {
      const c = sanitizeCssVal(ov.color);
      cellRules.push(`color: ${c} !important;`);
      textRules.push(`color: ${c} !important;`);
    }
    if (ov.backgroundColor) {
      const bg = sanitizeCssVal(ov.backgroundColor);
      cellRules.push(`background: ${bg} !important; background-color: ${bg} !important;`);
    }
    if (ov.textAlign && ov.textAlign !== 'default') {
      cellRules.push(`text-align: ${ov.textAlign} !important;`);
    }
    if (ov.letterSpacingPx !== undefined && ov.letterSpacingPx !== null) {
      cellRules.push(`letter-spacing: ${ov.letterSpacingPx}px !important;`);
      textRules.push(`letter-spacing: ${ov.letterSpacingPx}px !important;`);
    }
    if (ov.wordSpacingPx !== undefined && ov.wordSpacingPx !== null) {
      cellRules.push(`word-spacing: ${ov.wordSpacingPx}px !important;`);
      textRules.push(`word-spacing: ${ov.wordSpacingPx}px !important;`);
    }
    if (ov.lineHeight !== undefined && ov.lineHeight !== null) {
      cellRules.push(`line-height: ${ov.lineHeight} !important;`);
      textRules.push(`line-height: ${ov.lineHeight} !important;`);
    }
    if (ov.paddingYPx !== undefined && ov.paddingYPx !== null) {
      cellRules.push(`padding-top: ${ov.paddingYPx}px !important; padding-bottom: ${ov.paddingYPx}px !important;`);
    }
    if (ov.paddingXPx !== undefined && ov.paddingXPx !== null) {
      cellRules.push(`padding-left: ${ov.paddingXPx}px !important; padding-right: ${ov.paddingXPx}px !important;`);
    }

    if (cellRules.length > 0) {
      chunks.push(`${cellSel} { ${cellRules.join(' ')} }`);
    }
    if (textRules.length > 0) {
      chunks.push(`${cellSel} *:not(svg):not(path):not(circle):not(rect):not(line) { ${textRules.join(' ')} }`);
    }
  }

  return chunks.join('\n');
}

/**
 * Generates @media screen-only highlight CSS for currently selected table cells/rows/columns.
 * Guaranteed invisible during actual printing.
 */
export function buildActiveSelectionCss(
  scopeId: string,
  mode: TableSelectionMode,
  selectedCoords: TableCellCoord[],
  applyAllPages: boolean
): string {
  if (!selectedCoords || selectedCoords.length === 0) return '';
  const selectorSet = new Set<string>();
  for (const coord of selectedCoords) {
    const key = makeTableOverrideKey(mode, coord, applyAllPages);
    const parsed = parseTableOverrideKey(key);
    if (parsed) {
      selectorSet.add(buildCellSelectorForKey(scopeId, parsed));
    }
  }
  const selectors = Array.from(selectorSet);
  if (selectors.length === 0) return '';

  return `@media screen {
${selectors.join(',\n')} {
  box-shadow: inset 0 0 0 2px #0284c7 !important;
  outline: 1.5px solid #38bdf8 !important;
  outline-offset: -1px !important;
  background-image: linear-gradient(rgba(56, 189, 248, 0.22), rgba(56, 189, 248, 0.22)) !important;
}
}`;
}

export interface TableSelectionController {
  selectionMode: TableSelectionMode;
  setSelectionMode: (mode: TableSelectionMode) => void;
  applyAllPages: boolean;
  setApplyAllPages: (val: boolean) => void;
  selectedCoords: TableCellCoord[];
  anchorCoord: TableCellCoord | null;
  setSelection: (coords: TableCellCoord[], anchor?: TableCellCoord | null) => void;
  clearSelection: () => void;
  activeKeys: string[];
  getSelectedMergedOverride: (
    overrides: Record<string, TableCellStyleOverride>
  ) => TableCellStyleOverride;
  patchSelectedStyle: (
    patch: Partial<TableCellStyleOverride>,
    setStyleConfig: (
      updater:
        | PrintDocumentStyleConfig
        | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
    ) => void
  ) => void;
  clearSelectedStyle: (
    setStyleConfig: (
      updater:
        | PrintDocumentStyleConfig
        | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
    ) => void
  ) => void;
  clearAllCellOverrides: (
    setStyleConfig: (
      updater:
        | PrintDocumentStyleConfig
        | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
    ) => void
  ) => void;
}

export function useTableSelection(isOpen: boolean): TableSelectionController {
  const [selectionMode, setSelectionModeState] = useState<TableSelectionMode>('cell');
  const [applyAllPages, setApplyAllPages] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<TableCellCoord[]>([]);
  const [anchorCoord, setAnchorCoord] = useState<TableCellCoord | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCoords([]);
      setAnchorCoord(null);
    }
  }, [isOpen]);

  const setSelectionMode = useCallback((nextMode: TableSelectionMode) => {
    setSelectionModeState(nextMode);
    if (nextMode === 'col') {
      setApplyAllPages(true);
    } else if (nextMode === 'cell') {
      setApplyAllPages(false);
    }
  }, []);

  const setSelection = useCallback(
    (coords: TableCellCoord[], anchor?: TableCellCoord | null) => {
      setSelectedCoords(coords);
      if (anchor !== undefined) {
        setAnchorCoord(anchor);
      } else if (coords.length > 0) {
        setAnchorCoord(coords[0]);
      } else {
        setAnchorCoord(null);
      }
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedCoords([]);
    setAnchorCoord(null);
  }, []);

  const activeKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of selectedCoords) {
      set.add(makeTableOverrideKey(selectionMode, c, applyAllPages));
    }
    return Array.from(set);
  }, [selectedCoords, selectionMode, applyAllPages]);

  const getSelectedMergedOverride = useCallback(
    (overrides: Record<string, TableCellStyleOverride>): TableCellStyleOverride => {
      if (activeKeys.length === 0) return {};
      const first = overrides[activeKeys[0]];
      if (first) return normalizeCellOverride(first);
      // Fallback: if viewing a cell, show row/col override if present so UI feels helpful
      if (selectionMode === 'cell' && selectedCoords.length > 0) {
        const c = selectedCoords[0];
        const rowKey = makeTableOverrideKey('row', c, applyAllPages);
        if (overrides[rowKey]) return normalizeCellOverride(overrides[rowKey]);
        const colKey = makeTableOverrideKey('col', c, true);
        if (overrides[colKey]) return normalizeCellOverride(overrides[colKey]);
      }
      return {};
    },
    [activeKeys, selectionMode, selectedCoords, applyAllPages]
  );

  const patchSelectedStyle = useCallback(
    (
      patch: Partial<TableCellStyleOverride>,
      setStyleConfig: (
        updater:
          | PrintDocumentStyleConfig
          | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
      ) => void
    ) => {
      if (activeKeys.length === 0) return;
      setStyleConfig((prev) => {
        const nextMap = { ...(prev.cellOverrides || {}) };
        for (const key of activeKeys) {
          const merged: TableCellStyleOverride = {
            ...(nextMap[key] || {}),
            ...patch,
          };
          const clean = normalizeCellOverride(merged);
          if (Object.keys(clean).length === 0) {
            delete nextMap[key];
          } else {
            nextMap[key] = clean;
          }
        }
        return { ...prev, cellOverrides: nextMap };
      });
    },
    [activeKeys]
  );

  const clearSelectedStyle = useCallback(
    (
      setStyleConfig: (
        updater:
          | PrintDocumentStyleConfig
          | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
      ) => void
    ) => {
      if (activeKeys.length === 0) return;
      setStyleConfig((prev) => {
        const nextMap = { ...(prev.cellOverrides || {}) };
        for (const key of activeKeys) {
          delete nextMap[key];
        }
        return { ...prev, cellOverrides: nextMap };
      });
    },
    [activeKeys]
  );

  const clearAllCellOverrides = useCallback(
    (
      setStyleConfig: (
        updater:
          | PrintDocumentStyleConfig
          | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
      ) => void
    ) => {
      setStyleConfig((prev) => ({ ...prev, cellOverrides: {} }));
    },
    []
  );

  return {
    selectionMode,
    setSelectionMode,
    applyAllPages,
    setApplyAllPages,
    selectedCoords,
    anchorCoord,
    setSelection,
    clearSelection,
    activeKeys,
    getSelectedMergedOverride,
    patchSelectedStyle,
    clearSelectedStyle,
    clearAllCellOverrides,
  };
}

/**
 * Generates scoped CSS classes + CSS variables for `.print-custom-scope`.
 * Untouched fields never emit override classes, preserving 100% original sheet fidelity.
 */
export function buildPrintScopeProps(cfg: PrintDocumentStyleConfig): {
  className: string;
  style: React.CSSProperties;
} {
  const classes: string[] = ['print-custom-scope'];
  const vars: Record<string, string> = {};

  if (cfg.fontFamily) {
    classes.push('print-ov-font');
    vars['--pr-font'] = cfg.fontFamily;
  }
  if (cfg.headingFontFamily) {
    classes.push('print-ov-heading-font');
    vars['--pr-heading-font'] = cfg.headingFontFamily;
  }
  if (cfg.bodyFontSizePt !== null) {
    classes.push('print-ov-body-size');
    vars['--pr-body-size'] = `${cfg.bodyFontSizePt}pt`;
  }
  if (cfg.titleFontSizePt !== null) {
    classes.push('print-ov-title-size');
    vars['--pr-title-size'] = `${cfg.titleFontSizePt}pt`;
  }
  if (cfg.fontWeight !== 'default') {
    classes.push('print-ov-font-weight');
    vars['--pr-font-weight'] = cfg.fontWeight;
  }
  if (cfg.lineHeight !== null) {
    classes.push('print-ov-line-height');
    vars['--pr-line-height'] = String(cfg.lineHeight);
  }
  if (cfg.letterSpacingPx !== null) {
    classes.push('print-ov-letter-spacing');
    vars['--pr-letter-spacing'] = `${cfg.letterSpacingPx}px`;
  }
  if (cfg.wordSpacingPx !== null) {
    classes.push('print-ov-word-spacing');
    vars['--pr-word-spacing'] = `${cfg.wordSpacingPx}px`;
  }
  if (cfg.textColor) {
    classes.push('print-ov-text-color');
    vars['--pr-text-color'] = cfg.textColor;
  }
  if (cfg.pagePaddingMm !== null) {
    classes.push('print-ov-page-pad');
    vars['--pr-page-pad'] = `${cfg.pagePaddingMm}mm`;
  }
  if (cfg.grayscalePrint) {
    classes.push('print-ov-grayscale');
  }

  // Table Overrides
  if (cfg.tableFontSizePt !== null) {
    classes.push('print-ov-tbl-font');
    vars['--pr-tbl-font-size'] = `${cfg.tableFontSizePt}pt`;
  }
  if (cfg.tableHeaderFontSizePt !== null) {
    classes.push('print-ov-tbl-header-font');
    vars['--pr-tbl-header-font-size'] = `${cfg.tableHeaderFontSizePt}pt`;
  }
  if (cfg.tableCellPadYPx !== null || cfg.tableCellPadXPx !== null) {
    classes.push('print-ov-tbl-pad');
    vars['--pr-tbl-pad-y'] = `${cfg.tableCellPadYPx ?? 2}px`;
    vars['--pr-tbl-pad-x'] = `${cfg.tableCellPadXPx ?? 4}px`;
  }
  if (cfg.tableRowHeightMm !== null) {
    classes.push('print-ov-tbl-row-h');
    vars['--pr-tbl-row-h'] = `${cfg.tableRowHeightMm}mm`;
  }
  if (cfg.tableBorderWidthPx !== null || cfg.tableBorderColor) {
    classes.push('print-ov-tbl-border');
    if (cfg.tableBorderWidthPx !== null) {
      classes.push('print-ov-tbl-border-w');
      vars['--pr-tbl-border-w'] = `${cfg.tableBorderWidthPx}px`;
    }
    if (cfg.tableBorderColor) {
      classes.push('print-ov-tbl-border-c');
      vars['--pr-tbl-border-color'] = cfg.tableBorderColor;
    }
  }
  if (cfg.tableHeaderBg) {
    classes.push('print-ov-tbl-header-bg');
    vars['--pr-tbl-header-bg'] = cfg.tableHeaderBg;
  }
  if (cfg.tableHeaderColor) {
    classes.push('print-ov-tbl-header-color');
    vars['--pr-tbl-header-color'] = cfg.tableHeaderColor;
  }
  if (cfg.tableStripeBg) {
    classes.push('print-ov-tbl-stripe');
    vars['--pr-tbl-stripe-bg'] = cfg.tableStripeBg;
  }
  if (cfg.tableCellAlign !== 'default') {
    classes.push('print-ov-tbl-align');
    vars['--pr-tbl-align'] = cfg.tableCellAlign;
  }

  return {
    className: classes.join(' '),
    style: vars as React.CSSProperties,
  };
}

const FIRESTORE_DOC_ID = 'printDocumentPresets';

function getLocalPresetsKey(category: PrintDocCategory): string {
  return `bsis_print_presets_v1_${category}`;
}

function getLocalActiveStyleKey(category: PrintDocCategory): string {
  return `bsis_print_active_style_v1_${category}`;
}

function readLocalPresets(category: PrintDocCategory): SavedPrintDocumentPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalPresetsKey(category));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
      .map((p) => ({
        id: p.id,
        name: p.name,
        docCategory: category,
        styleConfig: normalizePrintStyleConfig(p.styleConfig),
        docOptions: p.docOptions && typeof p.docOptions === 'object' ? p.docOptions : undefined,
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function writeLocalPresets(
  category: PrintDocCategory,
  presets: SavedPrintDocumentPreset[]
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getLocalPresetsKey(category), JSON.stringify(presets));
  } catch {
    // ignore storage quota errors
  }
}

function readLocalActiveStyle(category: PrintDocCategory): PrintDocumentStyleConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_PRINT_STYLE_CONFIG };
  try {
    const raw = localStorage.getItem(getLocalActiveStyleKey(category));
    if (!raw) return { ...DEFAULT_PRINT_STYLE_CONFIG };
    return normalizePrintStyleConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PRINT_STYLE_CONFIG };
  }
}

function writeLocalActiveStyle(
  category: PrintDocCategory,
  cfg: PrintDocumentStyleConfig
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getLocalActiveStyleKey(category), JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export function usePrintDocumentStyle(docCategory: PrintDocCategory, isOpen: boolean) {
  const [styleConfig, setStyleConfigState] = useState<PrintDocumentStyleConfig>(() => ({
    ...DEFAULT_PRINT_STYLE_CONFIG,
  }));
  const [presets, setPresets] = useState<SavedPrintDocumentPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetFeedback, setPresetFeedback] = useState('');

  // Load persisted local active style & local presets immediately
  useEffect(() => {
    if (!isOpen) return;
    setStyleConfigState(readLocalActiveStyle(docCategory));
    setPresets(readLocalPresets(docCategory));
  }, [docCategory, isOpen]);

  // Subscribe to Firestore shared presets document so all devices/admins stay synced
  useEffect(() => {
    if (!isOpen) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = settingsService.subscribeOne(FIRESTORE_DOC_ID, (docData: any) => {
        if (!docData) return;
        const fieldKey = `presets_${docCategory}`;
        const remoteList = Array.isArray(docData[fieldKey]) ? docData[fieldKey] : null;
        if (remoteList) {
          const normalized: SavedPrintDocumentPreset[] = remoteList
            .filter((p: any) => p && typeof p.id === 'string' && typeof p.name === 'string')
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              docCategory,
              styleConfig: normalizePrintStyleConfig(p.styleConfig),
              docOptions:
                p.docOptions && typeof p.docOptions === 'object' ? p.docOptions : undefined,
              updatedAt:
                typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
            }));
          setPresets(normalized);
          writeLocalPresets(docCategory, normalized);
        }
      });
    } catch {
      // Fallback gracefully to local presets
    }
    return () => {
      if (unsub) unsub();
    };
  }, [docCategory, isOpen]);

  const setStyleConfig = useCallback(
    (
      updater:
        | PrintDocumentStyleConfig
        | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
    ) => {
      setStyleConfigState((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : updater;
        const normalized = normalizePrintStyleConfig(next);
        writeLocalActiveStyle(docCategory, normalized);
        return normalized;
      });
    },
    [docCategory]
  );

  const resetStyleConfig = useCallback(() => {
    const clean = { ...DEFAULT_PRINT_STYLE_CONFIG, cellOverrides: {} };
    setStyleConfigState(clean);
    setActivePresetId('');
    writeLocalActiveStyle(docCategory, clean);
  }, [docCategory]);

  const persistPresetsList = useCallback(
    async (nextList: SavedPrintDocumentPreset[], okMsg: string) => {
      setPresets(nextList);
      writeLocalPresets(docCategory, nextList);
      setIsSavingPreset(true);
      setPresetFeedback('');
      try {
        await settingsService.add(
          { [`presets_${docCategory}`]: nextList },
          FIRESTORE_DOC_ID
        );
        setPresetFeedback(okMsg);
      } catch (err) {
        console.warn('Firestore print presets save fallback to localStorage:', err);
        setPresetFeedback(`${okMsg} (ក្នុងម៉ាស៊ីន)`);
      } finally {
        setIsSavingPreset(false);
        setTimeout(() => setPresetFeedback(''), 3200);
      }
    },
    [docCategory]
  );

  const saveNewPreset = useCallback(
    async (
      name: string,
      docOptions?: Record<string, any>
    ): Promise<SavedPrintDocumentPreset | null> => {
      const cleanName = name.trim();
      if (!cleanName) return null;
      const newPreset: SavedPrintDocumentPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName.slice(0, 48),
        docCategory,
        styleConfig: normalizePrintStyleConfig(styleConfig),
        docOptions: docOptions ? { ...docOptions } : undefined,
        updatedAt: new Date().toISOString(),
      };
      const nextList = [newPreset, ...presets];
      setActivePresetId(newPreset.id);
      await persistPresetsList(nextList, `បានរក្សាទុក Preset "${newPreset.name}"`);
      return newPreset;
    },
    [docCategory, styleConfig, presets, persistPresetsList]
  );

  const updateActivePreset = useCallback(
    async (docOptions?: Record<string, any>) => {
      if (!activePresetId) return;
      const target = presets.find((p) => p.id === activePresetId);
      if (!target) return;
      const updated: SavedPrintDocumentPreset = {
        ...target,
        styleConfig: normalizePrintStyleConfig(styleConfig),
        docOptions: docOptions ? { ...docOptions } : target.docOptions,
        updatedAt: new Date().toISOString(),
      };
      const nextList = presets.map((p) => (p.id === activePresetId ? updated : p));
      await persistPresetsList(nextList, `បានធ្វើបច្ចុប្បន្នភាព "${updated.name}"`);
    },
    [activePresetId, presets, styleConfig, persistPresetsList]
  );

  const deletePreset = useCallback(
    async (id: string) => {
      const nextList = presets.filter((p) => p.id !== id);
      if (activePresetId === id) setActivePresetId('');
      await persistPresetsList(nextList, 'បានលុប Preset');
    },
    [presets, activePresetId, persistPresetsList]
  );

  const applyPreset = useCallback(
    (
      preset: SavedPrintDocumentPreset,
      onApplyDocOptions?: (opts: Record<string, any>) => void
    ) => {
      const nextStyle = normalizePrintStyleConfig(preset.styleConfig);
      setStyleConfigState(nextStyle);
      writeLocalActiveStyle(docCategory, nextStyle);
      setActivePresetId(preset.id);
      if (preset.docOptions && onApplyDocOptions) {
        onApplyDocOptions(preset.docOptions);
      }
      setPresetFeedback(`បានប្រើ Preset "${preset.name}"`);
      setTimeout(() => setPresetFeedback(''), 2400);
    },
    [docCategory]
  );

  return {
    styleConfig,
    setStyleConfig,
    resetStyleConfig,
    presets,
    activePresetId,
    setActivePresetId,
    isSavingPreset,
    presetFeedback,
    saveNewPreset,
    updateActivePreset,
    deletePreset,
    applyPreset,
  };
}
