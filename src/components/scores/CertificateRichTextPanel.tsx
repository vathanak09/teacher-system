"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  BUILTIN_RICH_FONT_CHOICES,
  CERTIFICATE_DATA_FIELDS,
  CERTIFICATE_DATA_FIELD_GROUPS,
  CertTextBoxStyleConfig,
  CertificateDataFieldDef,
  formatLocalFontFamilyCss,
  sanitizeCertRichHtml,
} from './certificateRichText';

export interface CertificateRichTextPanelProps {
  boxId: string;
  boxTitle: string;
  isCustomTextBox?: boolean;
  hasRichOverride: boolean;
  initialRichHtml: string;
  lineHeight: number;
  paragraphGapMm: number;
  letterSpacingPx: number;
  wordSpacingPx?: number;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  widthMm?: number;
  localFonts: string[];
  isLoadingLocalFonts: boolean;
  localFontsStatus: string;
  onLoadLocalFonts: () => Promise<void>;
  onChangeStyle: (patch: Partial<CertTextBoxStyleConfig>) => void;
  onResetContent?: () => void;
  onRenameCustomBox?: (label: string) => void;
  onDeleteCustomBox?: () => void;
}

const FONT_SIZE_PRESETS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36];

const QUICK_TEXT_COLORS = [
  { label: 'ខ្មៅ', hex: '#111827' },
  { label: 'ខៀវរាជ', hex: '#1d4ed8' },
  { label: 'ខៀវបាវចនា', hex: '#0b3be0' },
  { label: 'ក្រហម', hex: '#dc2626' },
  { label: 'មាសត្នោត', hex: '#92400e' },
  { label: 'បៃតងចាស់', hex: '#065f46' },
  { label: 'ស្វាយ', hex: '#6d28d9' },
];

const LINE_HEIGHT_PRESETS = [1.0, 1.2, 1.35, 1.5, 1.8, 2.2];

type UnderlineBorderStyle = 'dotted' | 'dashed' | 'solid';

export default function CertificateRichTextPanel({
  boxId,
  boxTitle,
  isCustomTextBox = false,
  hasRichOverride,
  initialRichHtml,
  lineHeight,
  paragraphGapMm,
  letterSpacingPx,
  wordSpacingPx = 0,
  fontFamily,
  fontSizePt,
  color,
  textAlign,
  widthMm,
  localFonts,
  isLoadingLocalFonts,
  localFontsStatus,
  onLoadLocalFonts,
  onChangeStyle,
  onResetContent,
  onRenameCustomBox,
  onDeleteCustomBox,
}: CertificateRichTextPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastLoadedBoxRef = useRef<string>('');
  const [customFontDraft, setCustomFontDraft] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(color || '#111827');
  const [highlightColor, setHighlightColor] = useState<string>('#fef08a');
  const [activeFontSizeDraft, setActiveFontSizeDraft] = useState<number>(fontSizePt || 10);
  const [activeFontFamilyDraft, setActiveFontFamilyDraft] = useState<string>(fontFamily);
  const [resetSyncTick, setResetSyncTick] = useState<number>(0);
  const [hasSelectionActive, setHasSelectionActive] = useState<boolean>(false);

  // Dotted / custom underline customization state
  const [showDottedSettings, setShowDottedSettings] = useState<boolean>(false);
  const [dottedStyle, setDottedStyle] = useState<UnderlineBorderStyle>('dotted');
  const [dottedWidthPx, setDottedWidthPx] = useState<number>(1);
  const [dottedColor, setDottedColor] = useState<string>('#1f2937');
  const [dottedMinWidthMm, setDottedMinWidthMm] = useState<number>(22);
  const [dottedPaddingMm, setDottedPaddingMm] = useState<number>(2.5);
  const [selectionHasDotted, setSelectionHasDotted] = useState<boolean>(false);

  // Sync editor DOM ONLY when switching selected box or explicitly resetting content
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const loadKey = `${boxId}::${resetSyncTick}`;
    if (lastLoadedBoxRef.current === loadKey) return;
    lastLoadedBoxRef.current = loadKey;
    el.innerHTML = sanitizeCertRichHtml(initialRichHtml);
    savedRangeRef.current = null;
    setHasSelectionActive(false);
    setSelectionHasDotted(false);
  }, [boxId, initialRichHtml, resetSyncTick]);

  useEffect(() => {
    setSelectedColor(color || '#111827');
  }, [color, boxId]);

  useEffect(() => {
    setActiveFontSizeDraft(Number((fontSizePt || 10).toFixed(1)));
  }, [fontSizePt, boxId]);

  useEffect(() => {
    setActiveFontFamilyDraft(fontFamily);
  }, [fontFamily, boxId]);

  // Helper: locate nearest ancestor span inside editor that carries a border-bottom underline
  const findUnderlineSpanAncestor = (node: Node | null): HTMLElement | null => {
    const root = editorRef.current;
    if (!root || !node) return null;
    let cur: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    while (cur && cur !== root) {
      if (cur instanceof HTMLElement && cur.style.borderBottom) {
        return cur;
      }
      cur = cur.parentNode;
    }
    return null;
  };

  const rangeContainsDottedUnderline = (range: Range | null): boolean => {
    if (!range) return false;
    if (findUnderlineSpanAncestor(range.commonAncestorContainer)) return true;
    if (findUnderlineSpanAncestor(range.startContainer)) return true;
    if (!range.collapsed) {
      const cloned = range.cloneContents();
      const els = cloned.querySelectorAll('*');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el instanceof HTMLElement && el.style.borderBottom) return true;
      }
    }
    return false;
  };

  // Track live selection ONLY while the Word editor actually has focus (never wipe on blur to toolbar!)
  useEffect(() => {
    const handleSelectionChange = () => {
      const el = editorRef.current;
      if (!el || typeof window === 'undefined') return;
      if (document.activeElement !== el) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        setHasSelectionActive(!range.collapsed);
        setSelectionHasDotted(rangeContainsDottedUnderline(range));
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const captureSelection = () => {
    const el = editorRef.current;
    if (!el || typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
      setHasSelectionActive(!range.collapsed);
      setSelectionHasDotted(rangeContainsDottedUnderline(range));
    }
  };

  const getActiveRange = (): Range | null => {
    const el = editorRef.current;
    if (!el || typeof window === 'undefined') return null;
    if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
      return savedRangeRef.current;
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (el.contains(r.commonAncestorContainer)) {
        savedRangeRef.current = r.cloneRange();
        return savedRangeRef.current;
      }
    }
    return null;
  };

  const restoreSelectionRange = (range: Range | null): Range | null => {
    const el = editorRef.current;
    if (!el || !range || typeof window === 'undefined') return null;
    if (!el.contains(range.commonAncestorContainer)) return null;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRangeRef.current = range.cloneRange();
    setHasSelectionActive(!range.collapsed);
    setSelectionHasDotted(rangeContainsDottedUnderline(range));
    return savedRangeRef.current;
  };

  const commitEditorHtml = () => {
    const el = editorRef.current;
    if (!el) return;
    const clean = sanitizeCertRichHtml(el.innerHTML);
    onChangeStyle({ richHtml: clean });
  };

  /**
   * Applies inline CSS properties cleanly to the currently highlighted text:
   * - Strips conflicting properties from nested child elements so inner spans NEVER block color/font/size updates!
   * - If the selection covers an entire single parent <span>, updates that span in-place to keep HTML flat & clean.
   * - Keeps the newly styled text selected so users can chain Font -> Size -> Color -> Bold seamlessly.
   */
  const applyInlineStyleToSelection = (
    cssPatch: Record<string, string>,
    fallbackBoxPatch?: Partial<CertTextBoxStyleConfig>,
    options?: { keepEditorFocus?: boolean }
  ) => {
    const el = editorRef.current;
    const range = getActiveRange();
    if (!el || !range || range.collapsed) {
      if (fallbackBoxPatch) onChangeStyle(fallbackBoxPatch);
      return;
    }

    const propNames = Object.keys(cssPatch);

    // Case 1: Selection exactly matches a single existing inline <span> inside the editor
    const commonEl =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;

    if (
      commonEl &&
      commonEl !== el &&
      commonEl.tagName === 'SPAN' &&
      el.contains(commonEl) &&
      range.toString().trim() === (commonEl.textContent || '').trim() &&
      range.toString().length > 0
    ) {
      Object.entries(cssPatch).forEach(([prop, val]) => {
        if (val) commonEl.style.setProperty(prop, val);
        else commonEl.style.removeProperty(prop);
      });
      commonEl.querySelectorAll('*').forEach((child) => {
        if (child instanceof HTMLElement) {
          propNames.forEach((p) => child.style.removeProperty(p));
        }
      });
      const nextRange = document.createRange();
      nextRange.selectNodeContents(commonEl);
      savedRangeRef.current = nextRange.cloneRange();
      if (options?.keepEditorFocus !== false) {
        el.focus();
        restoreSelectionRange(nextRange);
      } else {
        setHasSelectionActive(true);
        setSelectionHasDotted(rangeContainsDottedUnderline(nextRange));
      }
      commitEditorHtml();
      return;
    }

    // Case 2: Partial or multi-node selection -> extract, clear conflicting inner styles, wrap in clean <span>
    try {
      const workingRange = range.cloneRange();
      const frag = workingRange.extractContents();
      frag.querySelectorAll('*').forEach((child) => {
        if (child instanceof HTMLElement) {
          propNames.forEach((p) => child.style.removeProperty(p));
        }
      });

      const span = document.createElement('span');
      Object.entries(cssPatch).forEach(([prop, val]) => {
        if (val) span.style.setProperty(prop, val);
      });
      span.appendChild(frag);
      workingRange.insertNode(span);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      savedRangeRef.current = nextRange.cloneRange();
      if (options?.keepEditorFocus !== false) {
        el.focus();
        restoreSelectionRange(nextRange);
      } else {
        setHasSelectionActive(true);
        setSelectionHasDotted(rangeContainsDottedUnderline(nextRange));
      }
      commitEditorHtml();
    } catch {
      if (fallbackBoxPatch) onChangeStyle(fallbackBoxPatch);
    }
  };

  /**
   * Clears specified CSS properties from both matching ancestor span(s) and nested descendants
   * within the current selection or cursor position (used to remove dotted underline or clear formatting).
   */
  const clearCssPropsFromSelection = (propNames: string[]) => {
    const el = editorRef.current;
    const range = getActiveRange();
    if (!el || !range) return;

    const stripFromEl = (target: HTMLElement) => {
      propNames.forEach((p) => target.style.removeProperty(p));
    };

    if (range.collapsed) {
      const anc = findUnderlineSpanAncestor(range.startContainer);
      if (anc) {
        stripFromEl(anc);
        commitEditorHtml();
        setSelectionHasDotted(false);
      }
      return;
    }

    const anc = findUnderlineSpanAncestor(range.commonAncestorContainer);
    if (anc && anc !== el && range.toString().trim() === (anc.textContent || '').trim()) {
      stripFromEl(anc);
      anc.querySelectorAll('*').forEach((child) => {
        if (child instanceof HTMLElement) stripFromEl(child);
      });
      const nextRange = document.createRange();
      nextRange.selectNodeContents(anc);
      el.focus();
      restoreSelectionRange(nextRange);
      commitEditorHtml();
      return;
    }

    // Partial selection inside an underlined span OR spanning multiple underlined spans
    try {
      const workingRange = range.cloneRange();
      const frag = workingRange.extractContents();
      frag.querySelectorAll('*').forEach((child) => {
        if (child instanceof HTMLElement) stripFromEl(child);
      });
      if (anc && anc !== el) {
        stripFromEl(anc);
      }
      const span = document.createElement('span');
      span.appendChild(frag);
      workingRange.insertNode(span);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      el.focus();
      restoreSelectionRange(nextRange);
      commitEditorHtml();
    } catch {
      if (anc && anc !== el) {
        stripFromEl(anc);
        commitEditorHtml();
      }
    }
  };

  const runExecCommand = (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'removeFormat') => {
    const el = editorRef.current;
    if (!el) return;
    const range = getActiveRange();
    el.focus();
    if (range && !range.collapsed) {
      restoreSelectionRange(range);
    } else {
      const selectAll = document.createRange();
      selectAll.selectNodeContents(el);
      restoreSelectionRange(selectAll);
    }

    if (cmd === 'removeFormat') {
      document.execCommand('removeFormat', false);
      clearCssPropsFromSelection([
        'border-bottom',
        'padding',
        'padding-left',
        'padding-right',
        'min-width',
        'display',
        'background-color',
        'color',
        'font-family',
        'font-size',
        'font-weight',
        'font-style',
        'text-decoration',
      ]);
      return;
    }

    document.execCommand(cmd, false);
    captureSelection();
    commitEditorHtml();
  };

  const buildDottedCssPatch = (
    bStyle = dottedStyle,
    bWidth = dottedWidthPx,
    bColor = dottedColor,
    minW = dottedMinWidthMm,
    padMm = dottedPaddingMm
  ): Record<string, string> => {
    const patch: Record<string, string> = {
      'border-bottom': `${bWidth}px ${bStyle} ${bColor}`,
      padding: `0 ${padMm}mm`,
      display: 'inline-block',
      'text-align': 'center',
    };
    if (minW > 0) {
      patch['min-width'] = `${minW}mm`;
    } else {
      patch['min-width'] = '';
    }
    return patch;
  };

  const handleApplyOrUpdateDottedUnderline = (
    overrideOpts?: {
      style?: UnderlineBorderStyle;
      widthPx?: number;
      color?: string;
      minWidthMm?: number;
      paddingMm?: number;
    },
    keepEditorFocus = true
  ) => {
    const bStyle = overrideOpts?.style ?? dottedStyle;
    const bWidth = overrideOpts?.widthPx ?? dottedWidthPx;
    const bColor = overrideOpts?.color ?? dottedColor;
    const minW = overrideOpts?.minWidthMm ?? dottedMinWidthMm;
    const padMm = overrideOpts?.paddingMm ?? dottedPaddingMm;
    const patch = buildDottedCssPatch(bStyle, bWidth, bColor, minW, padMm);

    const range = getActiveRange();
    if (range && range.collapsed) {
      const anc = findUnderlineSpanAncestor(range.startContainer);
      if (anc) {
        Object.entries(patch).forEach(([prop, val]) => {
          if (val) anc.style.setProperty(prop, val);
          else anc.style.removeProperty(prop);
        });
        commitEditorHtml();
        setSelectionHasDotted(true);
        return;
      }
    }

    applyInlineStyleToSelection(patch, undefined, { keepEditorFocus });
  };

  const handleRemoveDottedUnderline = () => {
    clearCssPropsFromSelection([
      'border-bottom',
      'padding',
      'padding-left',
      'padding-right',
      'min-width',
      'display',
      'text-align',
    ]);
    setSelectionHasDotted(false);
  };

  const handleToggleDottedUnderline = () => {
    const range = getActiveRange();
    if (rangeContainsDottedUnderline(range)) {
      handleRemoveDottedUnderline();
    } else {
      handleApplyOrUpdateDottedUnderline();
    }
  };

  const handleApplyFontFamily = (nextFontCss: string) => {
    if (!nextFontCss) return;
    setActiveFontFamilyDraft(nextFontCss);
    const range = getActiveRange();
    if (range && !range.collapsed) {
      applyInlineStyleToSelection({ 'font-family': nextFontCss });
    } else {
      onChangeStyle({ fontFamily: nextFontCss });
    }
  };

  const handleApplyFontSize = (ptVal: number) => {
    const clamped = Math.max(5, Math.min(48, Number(ptVal.toFixed(1))));
    setActiveFontSizeDraft(clamped);
    const range = getActiveRange();
    if (range && !range.collapsed) {
      applyInlineStyleToSelection({ 'font-size': `${clamped}pt` });
    } else {
      onChangeStyle({ fontSizePt: clamped });
    }
  };

  const handleApplyTextColor = (hex: string, keepEditorFocus = true) => {
    setSelectedColor(hex);
    const range = getActiveRange();
    if (range && !range.collapsed) {
      applyInlineStyleToSelection({ color: hex }, undefined, { keepEditorFocus });
    } else {
      onChangeStyle({ color: hex });
    }
  };

  const handleApplyHighlight = (hex: string, keepEditorFocus = false) => {
    setHighlightColor(hex);
    applyInlineStyleToSelection(
      {
        'background-color': hex,
        padding: '0 1mm',
      },
      undefined,
      { keepEditorFocus }
    );
  };

  const handleClearHighlight = () => {
    clearCssPropsFromSelection(['background-color']);
  };

  const insertExactSpacesAtCursor = (count: number) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    let range = getActiveRange();
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }
    const workingRange = range.cloneRange();
    workingRange.deleteContents();
    const spaceNode = document.createTextNode('\u00A0'.repeat(Math.max(1, count)));
    workingRange.insertNode(spaceNode);
    const afterRange = document.createRange();
    afterRange.setStartAfter(spaceNode);
    afterRange.collapse(true);
    restoreSelectionRange(afterRange);
    commitEditorHtml();
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertExactSpacesAtCursor(4);
    }
  };

  const handleInsertDataField = (fieldKey: string) => {
    if (!fieldKey) return;
    const field = CERTIFICATE_DATA_FIELDS.find((f) => f.key === fieldKey);
    if (!field) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    let range = getActiveRange();
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }

    const workingRange = range.cloneRange();
    workingRange.deleteContents();
    const tokenSpan = document.createElement('span');
    tokenSpan.setAttribute('data-token', field.key);
    tokenSpan.style.color = '#1d4ed8';
    tokenSpan.style.fontWeight = '700';
    tokenSpan.textContent = field.token;

    const trailingSpace = document.createTextNode('\u00A0');
    const frag = document.createDocumentFragment();
    frag.appendChild(tokenSpan);
    frag.appendChild(trailingSpace);

    workingRange.insertNode(frag);

    const afterRange = document.createRange();
    afterRange.setStartAfter(trailingSpace);
    afterRange.collapse(true);
    restoreSelectionRange(afterRange);
    commitEditorHtml();
  };

  const handleApplyCustomLocalFont = () => {
    const clean = customFontDraft.trim();
    if (!clean) return;
    const cssFont = formatLocalFontFamilyCss(clean);
    handleApplyFontFamily(cssFont);
    setCustomFontDraft('');
  };

  const fieldGroups = Object.keys(CERTIFICATE_DATA_FIELD_GROUPS) as CertificateDataFieldDef['group'][];

  const toolBtnStyle: React.CSSProperties = {
    padding: '0.22rem 0.44rem',
    borderRadius: '5px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '26px',
    lineHeight: 1.2,
  };

  return (
    <div
      style={{
        padding: '0.6rem',
        borderRadius: '10px',
        background: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.52rem',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>
            កែសម្រួលប្រអប់អក្សរ (Word Mode)
          </span>
          {hasSelectionActive && (
            <span
              style={{
                fontSize: '0.64rem',
                padding: '0.06rem 0.34rem',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.22)',
                color: '#7dd3fc',
                fontWeight: 700,
              }}
            >
              កំពុង Select អក្សរ
            </span>
          )}
          {hasRichOverride && !isCustomTextBox && !hasSelectionActive && (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.06rem 0.34rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#6ee7b7',
                fontWeight: 700,
              }}
            >
              បានកែផ្ទាល់
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
          {!isCustomTextBox && onResetContent && (
            <button
              type="button"
              onClick={() => {
                onResetContent();
                setResetSyncTick((t) => t + 1);
              }}
              style={{
                padding: '0.16rem 0.42rem',
                borderRadius: '5px',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                background: 'rgba(251, 191, 36, 0.12)',
                color: '#fde68a',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="ត្រឡប់ខ្លឹមសារ និងគម្លាតជួរដើមនៃប្រអប់នេះ"
            >
              ត្រឡប់ខ្លឹមសារដើម
            </button>
          )}
          {isCustomTextBox && onDeleteCustomBox && (
            <button
              type="button"
              onClick={onDeleteCustomBox}
              style={{
                padding: '0.16rem 0.45rem',
                borderRadius: '5px',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                background: 'rgba(248, 113, 113, 0.14)',
                color: '#fca5a5',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              លុបប្រអប់នេះ
            </button>
          )}
        </div>
      </div>

      {/* Optional Rename for Custom TextBox */}
      {isCustomTextBox && onRenameCustomBox && (
        <input
          type="text"
          value={boxTitle}
          onChange={(e) => onRenameCustomBox(e.target.value)}
          placeholder="ឈ្មោះប្រអប់អក្សរ..."
          style={{
            width: '100%',
            padding: '0.26rem 0.45rem',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '0.73rem',
            outline: 'none',
          }}
        />
      )}

      {/* 1. Per-TextBox Line Height, Row Gap, Letter Spacing & Width (Loads immediately on select!) */}
      <div
        style={{
          padding: '0.45rem 0.5rem',
          borderRadius: '7px',
          background: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
            <span>គម្លាតជួរអក្សរ (Line Spacing)</span>
            <strong style={{ color: '#7dd3fc' }}>{Number(lineHeight.toFixed(2))}x</strong>
          </div>
          <input
            type="range"
            min="0.85"
            max="2.8"
            step="0.05"
            value={lineHeight}
            onChange={(e) => onChangeStyle({ lineHeight: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '0.22rem', flexWrap: 'wrap', marginTop: '0.16rem' }}>
            {LINE_HEIGHT_PRESETS.map((lh) => (
              <button
                key={lh}
                type="button"
                onClick={() => onChangeStyle({ lineHeight: lh })}
                style={{
                  padding: '0.1rem 0.34rem',
                  borderRadius: '4px',
                  border: Math.abs(lineHeight - lh) < 0.03 ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                  background: Math.abs(lineHeight - lh) < 0.03 ? 'rgba(56, 189, 248, 0.22)' : '#0f172a',
                  color: Math.abs(lineHeight - lh) < 0.03 ? '#bae6fd' : '#94a3b8',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {lh}x
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
              <span>គម្លាតកថាខណ្ឌ</span>
              <strong style={{ color: '#93c5fd' }}>{Number(paragraphGapMm.toFixed(1))} mm</strong>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.2"
              value={paragraphGapMm}
              onChange={(e) => onChangeStyle({ paragraphGapMm: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
              <span>គម្លាតតួអក្សរ</span>
              <strong style={{ color: '#93c5fd' }}>{Number(letterSpacingPx.toFixed(1))} px</strong>
            </label>
            <input
              type="range"
              min="-1"
              max="5"
              step="0.1"
              value={letterSpacingPx}
              onChange={(e) => onChangeStyle({ letterSpacingPx: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
            <span>ទំហំការដកឃ្លា (Space Width)</span>
            <strong style={{ color: '#7dd3fc' }}>{Number(wordSpacingPx.toFixed(1))} px</strong>
          </label>
          <input
            type="range"
            min="-2"
            max="24"
            step="0.5"
            value={wordSpacingPx}
            onChange={(e) => onChangeStyle({ wordSpacingPx: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#cbd5e1' }}>
            <span>ទទឹងប្រអប់អក្សរ (Box Width)</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <strong style={{ color: '#93c5fd' }}>{widthMm ? `${widthMm} mm` : 'Auto'}</strong>
              {!isCustomTextBox && widthMm && (
                <button
                  type="button"
                  onClick={() => onChangeStyle({ widthMm: undefined })}
                  style={{
                    padding: '0.04rem 0.28rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: '#0f172a',
                    color: '#94a3b8',
                    fontSize: '0.64rem',
                    cursor: 'pointer',
                  }}
                >
                  Auto
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min="25"
            max="205"
            step="1"
            value={widthMm || 95}
            onChange={(e) => onChangeStyle({ widthMm: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* 2. Word-Style Font Family (Web + Khmer OS + PC Local Fonts) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.32rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700 }}>
            ពុម្ពអក្សរ (Web &amp; Font កុំព្យូទ័រ)
          </span>
          <button
            type="button"
            disabled={isLoadingLocalFonts}
            onClick={onLoadLocalFonts}
            style={{
              padding: '0.16rem 0.46rem',
              borderRadius: '5px',
              border: '1px solid rgba(129, 140, 248, 0.5)',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#c7d2fe',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: isLoadingLocalFonts ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="ទាញបញ្ជី Font ទាំងអស់ដែលបានដំឡើងក្នុង Windows / កុំព្យូទ័ររបស់អ្នក"
          >
            {isLoadingLocalFonts
              ? 'កំពុងទាញ Font...'
              : localFonts.length > 0
                ? `PC Fonts (${localFonts.length})`
                : 'ទាញ Font ពីកុំព្យូទ័រ'}
          </button>
        </div>

        {localFontsStatus && (
          <div style={{ fontSize: '0.67rem', color: '#93c5fd', lineHeight: 1.25 }}>
            {localFontsStatus}
          </div>
        )}

        <select
          value={activeFontFamilyDraft}
          onChange={(e) => handleApplyFontFamily(e.target.value)}
          style={{
            width: '100%',
            padding: '0.3rem 0.42rem',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.32)',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '0.74rem',
            fontFamily: activeFontFamilyDraft,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {localFonts.length > 0 && (
            <optgroup label={`Font ក្នុងកុំព្យូទ័រ (${localFonts.length})`} style={{ background: '#0f172a', color: '#7dd3fc' }}>
              {localFonts.map((fam) => {
                const cssVal = formatLocalFontFamilyCss(fam);
                return (
                  <option
                    key={`pc-${fam}`}
                    value={cssVal}
                    style={{ fontFamily: cssVal, background: '#1e293b', color: '#f8fafc' }}
                  >
                    {fam}
                  </option>
                );
              })}
            </optgroup>
          )}
          <optgroup label="ពុម្ពអក្សរខ្មែរ (Khmer OS - កុំព្យូទ័រ)" style={{ background: '#0f172a', color: '#fde68a' }}>
            {BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'khmer_pc').map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value, background: '#1e293b', color: '#f8fafc' }}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="ពុម្ពអក្សរខ្មែរ (Web Fonts)" style={{ background: '#0f172a', color: '#93c5fd' }}>
            {BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'khmer_web').map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value, background: '#1e293b', color: '#f8fafc' }}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="English PC / Office Fonts" style={{ background: '#0f172a', color: '#a7f3d0' }}>
            {BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'english_pc').map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value, background: '#1e293b', color: '#f8fafc' }}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="English Web Fonts" style={{ background: '#0f172a', color: '#cbd5e1' }}>
            {BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'english_web').map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value, background: '#1e293b', color: '#f8fafc' }}>
                {f.label}
              </option>
            ))}
          </optgroup>
          {!BUILTIN_RICH_FONT_CHOICES.some((f) => f.value === activeFontFamilyDraft) &&
            !localFonts.some((fam) => formatLocalFontFamilyCss(fam) === activeFontFamilyDraft) && (
              <option value={activeFontFamilyDraft} style={{ fontFamily: activeFontFamilyDraft, background: '#1e293b', color: '#f8fafc' }}>
                {activeFontFamilyDraft.replace(/['"]/g, '').split(',')[0]} (Custom)
              </option>
            )}
        </select>

        {/* Direct Custom Local Font Input */}
        <div style={{ display: 'flex', gap: '0.28rem' }}>
          <input
            type="text"
            value={customFontDraft}
            onChange={(e) => setCustomFontDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCustomLocalFont();
              }
            }}
            placeholder="ឬវាយឈ្មោះ Font កុំព្យូទ័រ (ឧ. AKbalthom, Limon S1)..."
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.24rem 0.42rem',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '0.7rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={!customFontDraft.trim()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleApplyCustomLocalFont}
            style={{
              padding: '0.22rem 0.5rem',
              borderRadius: '6px',
              border: 'none',
              background: customFontDraft.trim() ? '#2563eb' : '#334155',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: customFontDraft.trim() ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            ប្រើ Font
          </button>
        </div>
      </div>

      {/* 3. Word Formatting Controls: Size (pt), B/I/U/S/Dotted Toggle + Settings, Align, Colors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.24rem' }}>
          <select
            value={FONT_SIZE_PRESETS.includes(activeFontSizeDraft) ? activeFontSizeDraft : ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) handleApplyFontSize(v);
            }}
            title="ទំហំអក្សរ (pt)"
            style={{
              width: '62px',
              padding: '0.22rem 0.25rem',
              borderRadius: '5px',
              border: '1px solid rgba(148, 163, 184, 0.32)',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '0.72rem',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            {!FONT_SIZE_PRESETS.includes(activeFontSizeDraft) && (
              <option value="">{activeFontSizeDraft}pt</option>
            )}
            {FONT_SIZE_PRESETS.map((sz) => (
              <option key={sz} value={sz} style={{ background: '#1e293b' }}>
                {sz} pt
              </option>
            ))}
          </select>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleApplyFontSize(activeFontSizeDraft - 0.5)}
            style={toolBtnStyle}
            title="បន្ថយទំហំអក្សរ (-0.5pt)"
          >
            A-
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleApplyFontSize(activeFontSizeDraft + 0.5)}
            style={toolBtnStyle}
            title="បង្កើនទំហំអក្សរ (+0.5pt)"
          >
            A+
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runExecCommand('bold')}
            style={toolBtnStyle}
            title="អក្សរដិត (Bold)"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runExecCommand('italic')}
            style={{ ...toolBtnStyle, fontStyle: 'italic' }}
            title="អក្សរទ្រេត (Italic)"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runExecCommand('underline')}
            style={{ ...toolBtnStyle, textDecoration: 'underline' }}
            title="គូសបន្ទាត់ពីក្រោម (Underline)"
          >
            U
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runExecCommand('strikeThrough')}
            style={{ ...toolBtnStyle, textDecoration: 'line-through' }}
            title="គូសបន្ទាត់ឆូត (Strikethrough)"
          >
            S
          </button>

          {/* Toggle Dotted Underline ON / OFF + Customize Dropdown */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleDottedUnderline}
            style={{
              ...toolBtnStyle,
              background: selectionHasDotted ? 'rgba(56, 189, 248, 0.25)' : '#1e293b',
              borderColor: selectionHasDotted ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
              color: selectionHasDotted ? '#bae6fd' : '#93c5fd',
            }}
            title={selectionHasDotted ? 'ដកបន្ទាត់ចុចៗ (....) ចេញ' : 'ដាក់បន្ទាត់ចុចៗ (....) ក្រោមអក្សរ'}
          >
            ....
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowDottedSettings((v) => !v)}
            style={{
              ...toolBtnStyle,
              background: showDottedSettings ? 'rgba(99, 102, 241, 0.28)' : '#1e293b',
              borderColor: showDottedSettings ? '#818cf8' : 'rgba(148, 163, 184, 0.3)',
              color: '#c7d2fe',
              fontSize: '0.67rem',
            }}
            title="កំណត់ប្រភេទ ប្រវែង ពណ៌ និងដកបន្ទាត់ចុចៗ (....)"
          >
            កំណត់ ....
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertExactSpacesAtCursor(4)}
            style={{ ...toolBtnStyle, color: '#6ee7b7', fontSize: '0.67rem' }}
            title="បន្ថែមចន្លោះដកឃ្លា (Tab = 4 ចន្លោះ) ត្រង់ទីតាំង Cursor"
          >
            + ដកឃ្លា (Tab)
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runExecCommand('removeFormat')}
            style={{ ...toolBtnStyle, color: '#fca5a5' }}
            title="សម្អាតទម្រង់ទាំងអស់ (Clear Format)"
          >
            Tx
          </button>
        </div>

        {/* Dedicated Dotted / Custom Underline Settings Panel (Toggle, Customize Style/Width/Color/Padding & Remove!) */}
        {showDottedSettings && (
          <div
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: '7px',
              background: '#1e293b',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.38rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c7d2fe' }}>
                កំណត់បន្ទាត់ចុចៗ (Underline ....)
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleApplyOrUpdateDottedUnderline()}
                  style={{
                    padding: '0.14rem 0.44rem',
                    borderRadius: '5px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ដាក់ / កែ ....
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleRemoveDottedUnderline}
                  style={{
                    padding: '0.14rem 0.44rem',
                    borderRadius: '5px',
                    border: '1px solid rgba(248, 113, 113, 0.45)',
                    background: 'rgba(248, 113, 113, 0.16)',
                    color: '#fca5a5',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ដក .... ចេញ
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
              <div style={{ display: 'inline-flex', gap: '0.16rem', background: '#0f172a', padding: '0.12rem', borderRadius: '5px' }}>
                {(
                  [
                    { id: 'dotted', label: 'ចុចៗ (....)' },
                    { id: 'dashed', label: 'ដាច់ៗ (----)' },
                    { id: 'solid', label: 'ត្រង់ (____)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setDottedStyle(opt.id);
                      if (hasSelectionActive || selectionHasDotted) {
                        handleApplyOrUpdateDottedUnderline({ style: opt.id });
                      }
                    }}
                    style={{
                      padding: '0.12rem 0.34rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: dottedStyle === opt.id ? '#4f46e5' : 'transparent',
                      color: dottedStyle === opt.id ? '#ffffff' : '#94a3b8',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                <select
                  value={dottedWidthPx}
                  onChange={(e) => {
                    const nextW = parseFloat(e.target.value);
                    setDottedWidthPx(nextW);
                    if (hasSelectionActive || selectionHasDotted) {
                      handleApplyOrUpdateDottedUnderline({ widthPx: nextW });
                    }
                  }}
                  title="កម្រាស់បន្ទាត់"
                  style={{
                    padding: '0.14rem 0.24rem',
                    borderRadius: '5px',
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.67rem',
                  }}
                >
                  {[0.8, 1, 1.5, 2, 2.5].map((px) => (
                    <option key={px} value={px}>
                      {px}px
                    </option>
                  ))}
                </select>

                <label title="ពណ៌បន្ទាត់ចុចៗ" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.66rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <span>ពណ៌</span>
                  <input
                    type="color"
                    value={dottedColor}
                    onChange={(e) => {
                      const nextC = e.target.value;
                      setDottedColor(nextC);
                      if (hasSelectionActive || selectionHasDotted) {
                        handleApplyOrUpdateDottedUnderline({ color: nextC }, false);
                      }
                    }}
                    style={{ width: '22px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#cbd5e1' }}>
                  <span>ប្រវែងបន្ទាត់ (Min Width)</span>
                  <strong style={{ color: '#93c5fd' }}>{dottedMinWidthMm === 0 ? 'Auto' : `${dottedMinWidthMm}mm`}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={dottedMinWidthMm}
                  onChange={(e) => {
                    const nextMin = parseFloat(e.target.value);
                    setDottedMinWidthMm(nextMin);
                    if (hasSelectionActive || selectionHasDotted) {
                      handleApplyOrUpdateDottedUnderline({ minWidthMm: nextMin }, false);
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#cbd5e1' }}>
                  <span>គម្លាតសងខាង (Padding)</span>
                  <strong style={{ color: '#93c5fd' }}>{dottedPaddingMm}mm</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={dottedPaddingMm}
                  onChange={(e) => {
                    const nextPad = parseFloat(e.target.value);
                    setDottedPaddingMm(nextPad);
                    if (hasSelectionActive || selectionHasDotted) {
                      handleApplyOrUpdateDottedUnderline({ paddingMm: nextPad }, false);
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Alignment + Text Color + Highlight */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.16rem', background: '#1e293b', padding: '0.12rem', borderRadius: '6px' }}>
            {[
              { id: 'left' as const, label: 'ឆ្វេង' },
              { id: 'center' as const, label: 'កណ្តាល' },
              { id: 'right' as const, label: 'ស្តាំ' },
              { id: 'justify' as const, label: 'ស្មើ' },
            ].map((al) => (
              <button
                key={al.id}
                type="button"
                onClick={() => onChangeStyle({ textAlign: al.id })}
                style={{
                  padding: '0.16rem 0.36rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: textAlign === al.id ? '#2563eb' : 'transparent',
                  color: textAlign === al.id ? '#ffffff' : '#94a3b8',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {al.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.24rem' }}>
            <label title="ពណ៌អក្សរ" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.16rem', fontSize: '0.67rem', color: '#cbd5e1', cursor: 'pointer' }}>
              <span>ពណ៌</span>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleApplyTextColor(e.target.value, false)}
                style={{ width: '22px', height: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
            </label>
            <label title="ពណ៌ផ្ទៃក្រោយអក្សរ (Highlight)" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.16rem', fontSize: '0.67rem', color: '#fde68a', cursor: 'pointer' }}>
              <span>Highlight</span>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => handleApplyHighlight(e.target.value, false)}
                style={{ width: '22px', height: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
            </label>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearHighlight}
              title="ដកពណ៌ផ្ទៃក្រោយអក្សរចេញ"
              style={{
                padding: '0.08rem 0.28rem',
                borderRadius: '4px',
                border: '1px solid rgba(148,163,184,0.28)',
                background: '#1e293b',
                color: '#94a3b8',
                fontSize: '0.64rem',
                cursor: 'pointer',
              }}
            >
              គ្មានផ្ទៃ
            </button>
          </div>
        </div>

        {/* Quick Color Swatches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>ពណ៌រហ័ស៖</span>
          {QUICK_TEXT_COLORS.map((sw) => (
            <button
              key={sw.hex}
              type="button"
              title={sw.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleApplyTextColor(sw.hex, true)}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: sw.hex,
                border: selectedColor.toLowerCase() === sw.hex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      {/* 4. Insert Dynamic Data Field Dropdown (Auto-updates per student / exam!) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <label style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>
          បញ្ចូលទិន្នន័យស្វ័យប្រវត្តិ (Data Field Dropdown)
        </label>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleInsertDataField(e.target.value);
            }
          }}
          style={{
            width: '100%',
            padding: '0.32rem 0.45rem',
            borderRadius: '6px',
            border: '1px solid rgba(52, 211, 153, 0.45)',
            background: 'rgba(16, 185, 129, 0.14)',
            color: '#d1fae5',
            fontSize: '0.73rem',
            fontWeight: 700,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="" style={{ background: '#0f172a', color: '#cbd5e1' }}>
            + ជ្រើសទិន្នន័យដើម្បី Insert ចូលអក្សរ (ឈ្មោះ, ភេទ, ថ្ងៃកំណើត, និទ្ទេស...)
          </option>
          {fieldGroups.map((grp) => (
            <optgroup
              key={grp}
              label={CERTIFICATE_DATA_FIELD_GROUPS[grp]}
              style={{ background: '#0f172a', color: '#fde68a' }}
            >
              {CERTIFICATE_DATA_FIELDS.filter((f) => f.group === grp).map((field) => (
                <option
                  key={field.key}
                  value={field.key}
                  style={{ background: '#1e293b', color: '#f8fafc' }}
                >
                  {field.labelKh} — {field.token}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 5. Live Word-Like WYSIWYG Editable Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.67rem', color: '#94a3b8' }}>
          ចុច Spacebar ឬ Tab ដើម្បីដកឃ្លាជាក់ស្តែង • Highlight អក្សរដើម្បីប្តូរ Font / ពណ៌ / .... ខាងលើ៖
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={commitEditorHtml}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={captureSelection}
          onMouseUp={captureSelection}
          onFocus={captureSelection}
          className="cert-word-editor"
          style={
            {
              minHeight: '115px',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '0.5rem 0.6rem',
              borderRadius: '7px',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              background: '#ffffff',
              color: color || '#111827',
              fontFamily,
              fontSize: `${Math.max(9.5, Math.min(15, fontSizePt || 10.5))}pt`,
              lineHeight,
              letterSpacing: `${letterSpacingPx}px`,
              wordSpacing: wordSpacingPx ? `${wordSpacingPx}px` : undefined,
              textAlign,
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              '--cert-p-gap': `${Math.max(0, paragraphGapMm)}mm`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
