"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DueNoticeCard, {
  DEFAULT_NOTICE_CASHIER,
  DEFAULT_PENALTY_PERCENT_PER_DAY,
  DueNoticeItem,
  calculateNoticePenalty,
  getEffectiveNoticePrintCount,
} from './receipts/DueNoticeCard';
import { AppIcon } from './AppIcons';
import PrintExportControls from '@/components/print/PrintExportControls';
import {
  PrintSinglePageNavBar,
  PrintSinglePageToggle,
} from '@/components/print/PrintSinglePageControls';
import { collectPrintSheetElements } from '@/utils/printExport';
import PrintStyleSidebar, { usePrintSidebarFocus } from '@/components/print/PrintStyleSidebar';
import PrintInteractiveSheet, {
  PrintSelectedArea,
  PrintTableOverrideStyles,
} from '@/components/print/PrintInteractiveSheet';
import {
  usePrintDocumentStyle,
  useTableSelection,
} from '@/components/print/printStylePresets';

const A4_PORTRAIT_W_PX = 793.7;
const A4_PORTRAIT_H_PX = 1122.52;
const NOTICES_PER_PAGE = 6;

export interface DueNoticeSettingsPatch {
  noticeCashierName?: string;
  noticeSignatureUrl?: string;
  noticePenaltyPercent?: number;
}

export interface DueNoticePrintModalProps {
  isOpen: boolean;
  items: DueNoticeItem[];
  title?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  headerLogoUrl?: string;
  noticeCashierName?: string;
  noticeSignatureUrl?: string;
  initialPenaltyPercent?: number;
  onSaveNoticeSettings?: (patch: DueNoticeSettingsPatch) => Promise<void> | void;
  onRecordNoticesPrinted?: (printedItems: DueNoticeItem[]) => Promise<void> | void;
  onClose: () => void;
}

function getTodayYMD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DueNoticePrintModal({
  isOpen,
  items,
  title,
  schoolPhone,
  schoolAddress,
  headerLogoUrl,
  noticeCashierName,
  noticeSignatureUrl,
  initialPenaltyPercent = DEFAULT_PENALTY_PERCENT_PER_DAY,
  onSaveNoticeSettings,
  onRecordNoticesPrinted,
  onClose,
}: DueNoticePrintModalProps) {
  const [penaltyPercent, setPenaltyPercent] = useState<number>(initialPenaltyPercent);
  const [penaltyInputStr, setPenaltyInputStr] = useState<string>(String(initialPenaltyPercent));
  const [hidePenalty, setHidePenalty] = useState<boolean>(false);
  const [hideAmount, setHideAmount] = useState<boolean>(false);
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [hideFooter, setHideFooter] = useState<boolean>(false);
  const [hidePrintCount, setHidePrintCount] = useState<boolean>(false);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [autoCountPrint, setAutoCountPrint] = useState<boolean>(true);
  const [recordedBatchCount, setRecordedBatchCount] = useState<number>(0);
  const [isRecordingPrint, setIsRecordingPrint] = useState<boolean>(false);
  const [sessionPrintNumMap, setSessionPrintNumMap] = useState<Record<string, number>>({});
  const [issueDateStr, setIssueDateStr] = useState<string>(() => getTodayYMD());
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Filters & Grouping (Default false = strictly preserve student table sort order in Z-pattern: 1→2, 3→4, 5→6)
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterPrintCount, setFilterPrintCount] = useState<'all' | 'unprinted' | 'printed'>('all');
  const [sortByClass, setSortByClass] = useState<boolean>(false);

  // Left Sidebar & Cashier/Signature Editor
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [singlePageView, setSinglePageView] = useState<boolean>(false);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const portalRootRef = useRef<HTMLDivElement>(null);
  const [draftCashierName, setDraftCashierName] = useState<string>(
    noticeCashierName || DEFAULT_NOTICE_CASHIER
  );
  const [draftSignatureUrl, setDraftSignatureUrl] = useState<string>(noticeSignatureUrl || '');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const printStyle = usePrintDocumentStyle('due_notice', isOpen);
  const tableSelection = useTableSelection(isOpen);
  const { focusRequest, requestFocus } = usePrintSidebarFocus();

  const handleAreaSelected = useCallback(
    (area: PrintSelectedArea) => {
      setIsSidebarOpen(true);
      if (area.kind === 'table') {
        requestFocus('table', 'table-cell');
      } else if (area.kind === 'section') {
        requestFocus('doc', area.sectionId || 'display-toggles');
      } else if (area.kind === 'heading') {
        requestFocus('typography', 'font-size');
      } else {
        requestFocus('typography', 'font-family');
      }
    },
    [requestFocus]
  );

  // Restore saved preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPct = localStorage.getItem('bsis_due_penalty_pct');
      if (savedPct !== null && !Number.isNaN(Number(savedPct))) {
        const parsed = Math.max(0, Number(savedPct));
        setPenaltyPercent(parsed);
        setPenaltyInputStr(String(parsed));
      }
      if (localStorage.getItem('bsis_due_hide_penalty') === '1') setHidePenalty(true);
      if (localStorage.getItem('bsis_due_hide_amount') === '1') setHideAmount(true);
      if (localStorage.getItem('bsis_due_hide_header') === '1') setHideHeader(true);
      if (localStorage.getItem('bsis_due_hide_footer') === '1') setHideFooter(true);
      if (localStorage.getItem('bsis_due_hide_print_count') === '1') setHidePrintCount(true);
      if (localStorage.getItem('bsis_due_show_cut_lines') === '0') setShowCutLines(false);
      if (localStorage.getItem('bsis_due_show_signature') === '0') setShowSignature(false);
    } catch {
      // ignore storage errors
    }
  }, []);

  // Sync incoming settings props
  useEffect(() => {
    setDraftCashierName(noticeCashierName || DEFAULT_NOTICE_CASHIER);
  }, [noticeCashierName]);

  useEffect(() => {
    setDraftSignatureUrl(noticeSignatureUrl || '');
  }, [noticeSignatureUrl]);

  useEffect(() => {
    if (typeof initialPenaltyPercent === 'number' && !Number.isNaN(initialPenaltyPercent)) {
      setPenaltyPercent(initialPenaltyPercent);
      setPenaltyInputStr(String(initialPenaltyPercent));
    }
  }, [initialPenaltyPercent]);

  // Reset modal-local filters whenever opened with new items
  useEffect(() => {
    if (isOpen) {
      setFilterClass('all');
      setFilterStatus('all');
      setFilterShift('all');
      setFilterPrintCount('all');
      setRecordedBatchCount(0);
      setSessionPrintNumMap({});
      setIssueDateStr(getTodayYMD());
    }
  }, [isOpen, items]);

  // Responsive preview scaling for A4 Portrait sheet (accounts for Left Sidebar)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const sideOffset = isSidebarOpen && window.innerWidth >= 960 ? 396 : 56;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      const scale = Math.min(1, availW / A4_PORTRAIT_W_PX);
      setPreviewScale(scale);
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, isSidebarOpen]);

  // Inject @page A4 portrait rule while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = '@page { size: A4 portrait; margin: 0; }';
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen]);

  const persistFlag = (key: string, val: boolean) => {
    try {
      localStorage.setItem(key, val ? '1' : '0');
    } catch {
      // ignore
    }
  };

  const handlePenaltyInputChange = (raw: string) => {
    setPenaltyInputStr(raw);
    const parsed = Number(raw);
    if (raw.trim() === '') {
      setPenaltyPercent(0);
      return;
    }
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setPenaltyPercent(parsed);
      try {
        localStorage.setItem('bsis_due_penalty_pct', String(parsed));
      } catch {
        // ignore
      }
    }
  };

  const handleToggleHidePenalty = (checked: boolean) => {
    setHidePenalty(checked);
    persistFlag('bsis_due_hide_penalty', checked);
  };

  const handleToggleHideAmount = (checked: boolean) => {
    setHideAmount(checked);
    persistFlag('bsis_due_hide_amount', checked);
  };

  const handleToggleHideHeader = (checked: boolean) => {
    setHideHeader(checked);
    persistFlag('bsis_due_hide_header', checked);
  };

  const handleToggleHideFooter = (checked: boolean) => {
    setHideFooter(checked);
    persistFlag('bsis_due_hide_footer', checked);
  };

  const handleToggleHidePrintCount = (checked: boolean) => {
    setHidePrintCount(checked);
    persistFlag('bsis_due_hide_print_count', checked);
  };

  const handleToggleCutLines = (checked: boolean) => {
    setShowCutLines(checked);
    persistFlag('bsis_due_show_cut_lines', checked);
  };

  const handleToggleSignature = (checked: boolean) => {
    setShowSignature(checked);
    persistFlag('bsis_due_show_signature', checked);
  };

  const isPrePrintedMode = hideHeader && hideFooter;
  const handleTogglePrePrintedPreset = () => {
    const next = !isPrePrintedMode;
    handleToggleHideHeader(next);
    handleToggleHideFooter(next);
  };

  // Available filter options derived from items
  const filterOptions = useMemo(() => {
    const classCounts = new Map<string, number>();
    const shiftCounts = new Map<string, number>();
    let overdueCount = 0;
    let dueCount = 0;
    let upcomingCount = 0;
    let unprintedCount = 0;
    let printedBeforeCount = 0;

    items.forEach((it) => {
      const cls = String(it.classCode || it.student?.classCode || '').trim();
      if (cls) classCounts.set(cls, (classCounts.get(cls) || 0) + 1);

      const shift = String(it.student?.shift || '').trim();
      if (shift) shiftCounts.set(shift, (shiftCounts.get(shift) || 0) + 1);

      if (it.overdueDays > 0 || it.statusKey === 'overdue') overdueCount += 1;
      else if (it.statusKey === 'due') dueCount += 1;
      else upcomingCount += 1;

      const pCount =
        typeof it.noticePrintCount === 'number'
          ? it.noticePrintCount
          : getEffectiveNoticePrintCount(it.student, it.dueDateStr);
      if (pCount > 0) printedBeforeCount += 1;
      else unprintedCount += 1;
    });

    const classes = Array.from(classCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], 'en', { numeric: true })
    );
    const shifts = Array.from(shiftCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      classes,
      shifts,
      overdueCount,
      dueCount,
      upcomingCount,
      unprintedCount,
      printedBeforeCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const list = items.filter((it) => {
      if (filterClass !== 'all') {
        const cls = String(it.classCode || it.student?.classCode || '').trim();
        if (cls !== filterClass) return false;
      }
      if (filterShift !== 'all') {
        const shift = String(it.student?.shift || '').trim();
        if (shift !== filterShift) return false;
      }
      if (filterStatus === 'overdue') {
        if (!(it.overdueDays > 0 || it.statusKey === 'overdue')) return false;
      } else if (filterStatus === 'due') {
        if (it.statusKey !== 'due' || it.overdueDays > 0) return false;
      } else if (filterStatus === 'upcoming') {
        if (it.overdueDays > 0 || it.statusKey === 'overdue' || it.statusKey === 'due') return false;
      }
      if (filterPrintCount !== 'all') {
        const pCount =
          typeof it.noticePrintCount === 'number'
            ? it.noticePrintCount
            : getEffectiveNoticePrintCount(it.student, it.dueDateStr);
        if (filterPrintCount === 'unprinted' && pCount > 0) return false;
        if (filterPrintCount === 'printed' && pCount <= 0) return false;
      }
      return true;
    });

    if (!sortByClass) return list;
    return [...list].sort((a, b) => {
      const clsA = String(a.classCode || a.student?.classCode || 'ZZZ');
      const clsB = String(b.classCode || b.student?.classCode || 'ZZZ');
      const clsCmp = clsA.localeCompare(clsB, 'en', { numeric: true });
      if (clsCmp !== 0) return clsCmp;
      if ((b.overdueDays || 0) !== (a.overdueDays || 0)) {
        return (b.overdueDays || 0) - (a.overdueDays || 0);
      }
      return String(a.student?.fullName || '').localeCompare(
        String(b.student?.fullName || ''),
        'km'
      );
    });
  }, [items, filterClass, filterShift, filterStatus, filterPrintCount, sortByClass]);

  const hasActiveModalFilter =
    filterClass !== 'all' ||
    filterStatus !== 'all' ||
    filterShift !== 'all' ||
    filterPrintCount !== 'all';

  // Summary totals for toolbar preview
  const summaryStats = useMemo(() => {
    let totalBase = 0;
    let totalPenalty = 0;
    filteredItems.forEach((it) => {
      const base = Math.max(Number(it.amountDue || 0), Number(it.monthlyFee || 0));
      const pen = !hidePenalty
        ? calculateNoticePenalty(base, it.overdueDays, penaltyPercent)
        : 0;
      totalBase += base;
      totalPenalty += pen;
    });
    return {
      totalBase,
      totalPenalty,
      grandTotal: totalBase + totalPenalty,
    };
  }, [filteredItems, hidePenalty, penaltyPercent]);

  // Chunk into 6-per-page A4 Portrait sheets
  const pages = useMemo(() => {
    const chunks: DueNoticeItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += NOTICES_PER_PAGE) {
      chunks.push(filteredItems.slice(i, i + NOTICES_PER_PAGE));
    }
    return chunks;
  }, [filteredItems]);

  useEffect(() => {
    setActivePageIdx((prev) =>
      filteredItems.length === 0 ? 0 : Math.min(prev, filteredItems.length - 1)
    );
  }, [filteredItems.length]);

  const recordCurrentBatchPrint = async (targets: DueNoticeItem[]) => {
    if (!onRecordNoticesPrinted || targets.length === 0) return;
    setIsRecordingPrint(true);
    try {
      await onRecordNoticesPrinted(targets);
      setRecordedBatchCount(targets.length);
    } finally {
      setIsRecordingPrint(false);
    }
  };

  const handlePrint = () => {
    if (typeof window === 'undefined' || filteredItems.length === 0) return;

    const batchTargets = [...filteredItems];
    // Freeze the displayed "លើកទី X" numbers for this print session so Firestore updates don't jump mid-print
    const nextSnapshot: Record<string, number> = { ...sessionPrintNumMap };
    batchTargets.forEach((it) => {
      const sid = String(it.student?.id || '');
      if (sid && !nextSnapshot[sid]) {
        const baseCount =
          typeof it.noticePrintCount === 'number'
            ? it.noticePrintCount
            : getEffectiveNoticePrintCount(it.student, it.dueDateStr);
        nextSnapshot[sid] = baseCount + 1;
      }
    });
    setSessionPrintNumMap(nextSnapshot);

    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = '@page { size: A4 portrait; margin: 0; }';

    document.body.classList.add('printing-receipt-a4');

    let handledAfter = false;
    const cleanup = () => {
      if (handledAfter) return;
      handledAfter = true;
      document.body.classList.remove('printing-receipt-a4');
      window.removeEventListener('afterprint', cleanup);
      if (autoCountPrint && onRecordNoticesPrinted && recordedBatchCount === 0) {
        void recordCurrentBatchPrint(batchTargets);
      }
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        cleanup();
      }, 1000);
    }, 80);
  };

  const handleSaveSettingsClick = async () => {
    if (!onSaveNoticeSettings) return;
    setIsSavingSettings(true);
    try {
      await onSaveNoticeSettings({
        noticeCashierName: draftCashierName.trim() || DEFAULT_NOTICE_CASHIER,
        noticeSignatureUrl: draftSignatureUrl.trim(),
        noticePenaltyPercent: penaltyPercent,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getDocOptions = () => ({
    penaltyPercent,
    hidePenalty,
    hideAmount,
    hideHeader,
    hideFooter,
    hidePrintCount,
    showCutLines,
    showSignature,
    sortByClass,
  });

  const applyDocOptions = (opts: Record<string, any>) => {
    if (typeof opts.penaltyPercent === 'number' && !Number.isNaN(opts.penaltyPercent)) {
      handlePenaltyInputChange(String(opts.penaltyPercent));
    }
    if (typeof opts.hidePenalty === 'boolean') handleToggleHidePenalty(opts.hidePenalty);
    if (typeof opts.hideAmount === 'boolean') handleToggleHideAmount(opts.hideAmount);
    if (typeof opts.hideHeader === 'boolean') handleToggleHideHeader(opts.hideHeader);
    if (typeof opts.hideFooter === 'boolean') handleToggleHideFooter(opts.hideFooter);
    if (typeof opts.hidePrintCount === 'boolean') handleToggleHidePrintCount(opts.hidePrintCount);
    if (typeof opts.showCutLines === 'boolean') handleToggleCutLines(opts.showCutLines);
    if (typeof opts.showSignature === 'boolean') handleToggleSignature(opts.showSignature);
    if (typeof opts.sortByClass === 'boolean') setSortByClass(opts.sortByClass);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const activeCashierName = draftCashierName.trim() || noticeCashierName || DEFAULT_NOTICE_CASHIER;
  const activeSignatureUrl = draftSignatureUrl.trim() || noticeSignatureUrl || '';

  return createPortal(
    <div
      ref={portalRootRef}
      id="payment-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.90)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Action Toolbar (Hidden during actual printing) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '0.65rem 1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          borderBottom: '1px solid #334155',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        {/* Row 1: Title + Primary Print & Close Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #dc2626, #f59e0b)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="printer" size={17} style={{ color: '#ffffff' }} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', lineHeight: 1.25 }}>
                {title || 'Print លិខិតជូនដំណឹងបង់ថ្លៃសិក្សា (6 លិខិត / ទំព័រ A4 បញ្ឈរ)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                បង្ហាញ <strong style={{ color: '#f8fafc' }}>{filteredItems.length}</strong> /{' '}
                {items.length} នាក់ •{' '}
                <strong style={{ color: '#fbbf24' }}>{pages.length}</strong> ទំព័រ A4 បញ្ឈរ
                (10.5cm × 9.9cm • 2×3)
                {!hideAmount && filteredItems.length > 0 && (
                  <>
                    {' '}
                    • សរុប{' '}
                    <strong style={{ color: '#38bdf8' }}>
                      {summaryStats.grandTotal.toLocaleString('en-US')} ៛
                    </strong>
                    {!hidePenalty && summaryStats.totalPenalty > 0 && (
                      <span style={{ color: '#fca5a5' }}>
                        {' '}
                        (ផាកពិន័យ {summaryStats.totalPenalty.toLocaleString('en-US')} ៛)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {onRecordNoticesPrinted && (
              <label
                title="រាប់ +1 ទៅចំនួនព្រីនរបស់សិស្សនីមួយៗដោយស្វ័យប្រវត្តិពេលចុច Print (នឹងសម្អាតចេញពេលសិស្សបង់ប្រាក់រួច)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.36rem 0.65rem',
                  borderRadius: '8px',
                  background: recordedBatchCount > 0
                    ? 'rgba(22, 163, 74, 0.2)'
                    : 'rgba(56, 189, 248, 0.14)',
                  border: `1px solid ${recordedBatchCount > 0 ? '#22c55e' : '#0284c7'}`,
                  color: recordedBatchCount > 0 ? '#86efac' : '#bae6fd',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={autoCountPrint}
                  onChange={(e) => setAutoCountPrint(e.target.checked)}
                  style={{ accentColor: '#22c55e' }}
                />
                <span>
                  {isRecordingPrint
                    ? 'កំពុងកត់ត្រាចំនួនព្រីន...'
                    : recordedBatchCount > 0
                      ? `បានរាប់ចំនួនព្រីន +1 (${recordedBatchCount} នាក់)`
                      : 'រាប់ចំនួនព្រីន (+1)'}
                </span>
              </label>
            )}

            <PrintSinglePageToggle
              checked={singlePageView}
              onChange={setSinglePageView}
              label="មើលម្ដង ១ ឈ្មោះ"
              title="ធីកដើម្បីបង្ហាញលិខិតជូនដំណឹងជាឈ្មោះម្ដងមួយៗ (មិនដាក់ក្នុងក្រដាស A4) • ពេល Print នៅតែព្រីន A4 គ្រប់ទំព័រ"
            />

            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.44rem 0.72rem',
                borderRadius: '8px',
                border: `1px solid ${isSidebarOpen ? '#38bdf8' : '#475569'}`,
                background: isSidebarOpen ? 'rgba(56, 189, 248, 0.16)' : '#1e293b',
                color: isSidebarOpen ? '#7dd3fc' : '#e2e8f0',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="sliders" size={14} />
              <span>{isSidebarOpen ? 'លាក់ការកំណត់' : 'ការកំណត់ & Font'}</span>
            </button>

            <PrintExportControls
              getExportElements={() =>
                collectPrintSheetElements(
                  portalRootRef.current,
                  singlePageView
                    ? '#single-item-export-card'
                    : '.receipt-a4-sheets-container .receipt-a4-sheet'
                )
              }
              fileNameBase={
                singlePageView
                  ? `bsis-due-notice-${
                      filteredItems[
                        Math.min(activePageIdx, Math.max(0, filteredItems.length - 1))
                      ]?.student?.fullName || 'single'
                    }`
                  : `bsis-due-notices-${issueDateStr || 'export'}`
              }
              disabled={filteredItems.length === 0}
            />

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredItems.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background:
                  filteredItems.length === 0
                    ? '#475569'
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: filteredItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow:
                  filteredItems.length === 0 ? 'none' : '0 2px 10px rgba(37,99,235,0.4)',
              }}
            >
              <AppIcon name="printer" size={16} style={{ color: '#ffffff' }} />
              <span>Print A4 បញ្ឈរ ({filteredItems.length})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.48rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#e2e8f0',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              បិទ
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Workspace: Left Settings Sidebar + Right Live A4 Preview */}
      <PrintTableOverrideStyles
        scopeId="due-notice-print"
        styleConfig={printStyle.styleConfig}
        tableSelection={tableSelection}
      />
      <div className="print-workspace-body">
        {isSidebarOpen && (
          <PrintStyleSidebar
            title="ការកំណត់លិខិតបង់ប្រាក់"
            styleConfig={printStyle.styleConfig}
            onChangeStyle={printStyle.setStyleConfig}
            onResetStyle={printStyle.resetStyleConfig}
            tableSelection={tableSelection}
            showTableSettings={true}
            focusRequest={focusRequest}
            presets={printStyle.presets}
            activePresetId={printStyle.activePresetId}
            isSavingPreset={printStyle.isSavingPreset}
            presetFeedback={printStyle.presetFeedback}
            onSaveNewPreset={(name) => printStyle.saveNewPreset(name, getDocOptions())}
            onUpdateActivePreset={() => printStyle.updateActivePreset(getDocOptions())}
            onDeletePreset={printStyle.deletePreset}
            onApplyPreset={(preset) => printStyle.applyPreset(preset, applyDocOptions)}
          >
            {/* Penalty & Date Card */}
            <div
              data-sidebar-section="penalty-date"
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.48rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5' }}>
                ផាកពិន័យ &amp; ថ្ងៃចេញលិខិត
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#fca5a5', fontWeight: 700, marginBottom: '0.18rem' }}>
                    ផាកពិន័យ (%/ថ្ងៃ)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    disabled={hidePenalty}
                    value={penaltyInputStr}
                    onChange={(e) => handlePenaltyInputChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.3rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      opacity: hidePenalty ? 0.5 : 1,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.18rem' }}>
                    ថ្ងៃចេញលិខិត
                  </label>
                  <input
                    type="date"
                    value={issueDateStr}
                    onChange={(e) => setIssueDateStr(e.target.value || getTodayYMD())}
                    style={{
                      width: '100%',
                      padding: '0.28rem 0.35rem',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.74rem',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePrePrintedPreset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.38rem 0.65rem',
                  borderRadius: '7px',
                  border: `1px solid ${isPrePrintedMode ? '#22c55e' : '#475569'}`,
                  background: isPrePrintedMode ? 'rgba(34, 197, 94, 0.2)' : '#0f172a',
                  color: isPrePrintedMode ? '#86efac' : '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="file-text" size={14} style={{ color: isPrePrintedMode ? '#86efac' : '#94a3b8' }} />
                <span>{isPrePrintedMode ? 'កំពុងលាក់ Header+Footer' : 'ព្រីនលើក្រដាសគំរូស្រាប់'}</span>
              </button>
            </div>

            {/* Show/Hide Toggles Card */}
            <div
              data-sidebar-section="display-toggles"
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.42rem',
                fontSize: '0.76rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                បង្ហាញ / លាក់ផ្នែកលើលិខិត
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hidePenalty ? '#fca5a5' : '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hidePenalty} onChange={(e) => handleToggleHidePenalty(e.target.checked)} style={{ accentColor: '#ef4444' }} />
                  <span>លាក់ផាកពិន័យ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hideAmount ? '#fcd34d' : '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hideAmount} onChange={(e) => handleToggleHideAmount(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
                  <span>លាក់ទឹកប្រាក់</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hideHeader ? '#93c5fd' : '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hideHeader} onChange={(e) => handleToggleHideHeader(e.target.checked)} style={{ accentColor: '#3b82f6' }} />
                  <span>លាក់ Header</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hideFooter ? '#93c5fd' : '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hideFooter} onChange={(e) => handleToggleHideFooter(e.target.checked)} style={{ accentColor: '#3b82f6' }} />
                  <span>លាក់ Footer</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hidePrintCount} onChange={(e) => handleToggleHidePrintCount(e.target.checked)} />
                  <span>លាក់លើកទីព្រីន</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showCutLines} onChange={(e) => handleToggleCutLines(e.target.checked)} />
                  <span>បន្ទាត់កាត់</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', cursor: 'pointer', opacity: hideFooter ? 0.5 : 1 }}>
                  <input type="checkbox" checked={showSignature} disabled={hideFooter} onChange={(e) => handleToggleSignature(e.target.checked)} />
                  <span>ហត្ថលេខា</span>
                </label>
              </div>
            </div>

            {/* Filters Card */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7b7' }}>
                  ច្រោះទិន្នន័យសិស្ស
                </span>
                {hasActiveModalFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterClass('all');
                      setFilterStatus('all');
                      setFilterShift('all');
                      setFilterPrintCount('all');
                    }}
                    style={{
                      padding: '0.16rem 0.45rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: 'transparent',
                      color: '#fbbf24',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    សម្អាតតម្រង
                  </button>
                )}
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.32rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">គ្រប់ថ្នាក់ ({items.length})</option>
                {filterOptions.classes.map(([cls, count]) => (
                  <option key={cls} value={cls}>
                    ថ្នាក់ {cls} ({count})
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.32rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">គ្រប់ស្ថានភាព ({items.length})</option>
                <option value="overdue">លើសថ្ងៃ ({filterOptions.overdueCount})</option>
                <option value="due">ដល់ថ្ងៃ ({filterOptions.dueCount})</option>
                {filterOptions.upcomingCount > 0 && (
                  <option value="upcoming">ជិតដល់ថ្ងៃ ({filterOptions.upcomingCount})</option>
                )}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.32rem 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">គ្រប់វេន</option>
                  {filterOptions.shifts.map(([shift, count]) => (
                    <option key={shift} value={shift}>
                      វេន {shift} ({count})
                    </option>
                  ))}
                </select>

                <select
                  value={filterPrintCount}
                  onChange={(e) => setFilterPrintCount(e.target.value as 'all' | 'unprinted' | 'printed')}
                  style={{
                    width: '100%',
                    padding: '0.32rem 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">គ្រប់ចំនួនព្រីន</option>
                  <option value="unprinted">មិនទាន់ព្រីន ({filterOptions.unprintedCount})</option>
                  <option value="printed">ធ្លាប់ព្រីន ({filterOptions.printedBeforeCount})</option>
                </select>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={sortByClass}
                  onChange={(e) => setSortByClass(e.target.checked)}
                />
                <span>តម្រៀបជាក្រុមតាមថ្នាក់ (លំនាំ Z)</span>
              </label>
            </div>

            {/* Cashier Name & Signature Link Card */}
            <div
              data-sidebar-section="cashier-signature"
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7dd3fc' }}>
                បេឡា &amp; ហត្ថលេខា
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.18rem' }}>
                  ឈ្មោះបេឡា
                </label>
                <input
                  type="text"
                  value={draftCashierName}
                  onChange={(e) => setDraftCashierName(e.target.value)}
                  placeholder={DEFAULT_NOTICE_CASHIER}
                  style={{
                    width: '100%',
                    padding: '0.32rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.76rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.18rem' }}>
                  Link ហត្ថលេខា Google Drive
                </label>
                <input
                  type="text"
                  value={draftSignatureUrl}
                  onChange={(e) => setDraftSignatureUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  style={{
                    width: '100%',
                    padding: '0.32rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                  }}
                />
              </div>
              {onSaveNoticeSettings && (
                <button
                  type="button"
                  disabled={isSavingSettings}
                  onClick={handleSaveSettingsClick}
                  style={{
                    padding: '0.36rem 0.75rem',
                    borderRadius: '7px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: isSavingSettings ? 'wait' : 'pointer',
                  }}
                >
                  {isSavingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកបេឡា & ហត្ថលេខាក្នុងប្រព័ន្ធ'}
                </button>
              )}
            </div>
          </PrintStyleSidebar>
        )}

      {/* Preview / Print Sheets Container */}
      <div className="print-preview-stage">
      {singlePageView && filteredItems.length > 0 && (() => {
        const singleIdx = Math.min(activePageIdx, filteredItems.length - 1);
        const singleItem = filteredItems[singleIdx];
        const slotStudentId = String(singleItem?.student?.id || '');
        const basePrintCount =
          typeof singleItem?.noticePrintCount === 'number'
            ? singleItem.noticePrintCount
            : getEffectiveNoticePrintCount(singleItem?.student, singleItem?.dueDateStr);
        const displayPrintNum =
          (slotStudentId && sessionPrintNumMap[slotStudentId]) ||
          basePrintCount + 1;
        const singleCardScale = Math.min(1.45, Math.max(0.75, previewScale * 1.45));
        const cardWPx = 396.85;
        const cardHPx = 373.61;

        return (
          <div
            className="no-print"
            style={{
              padding: '1.25rem 1rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.9rem',
              width: '100%',
            }}
          >
            <PrintSinglePageNavBar
              unitLabel="ឈ្មោះ"
              prevLabel="មុន"
              nextLabel="បន្ទាប់"
              activeIdx={singleIdx}
              pages={filteredItems.map((it, idx) => {
                const name = it.student?.fullName || `សិស្ស ${idx + 1}`;
                const cls = String(it.classCode || it.student?.classCode || '').trim();
                const amt = !hideAmount ? `${Number(it.amountDue || 0).toLocaleString('en-US')} ៛` : '';
                return {
                  key: `${it.student?.id || 'due'}-${idx}`,
                  label: [name, cls, amt].filter(Boolean).join(' • '),
                };
              })}
              onChangeIdx={setActivePageIdx}
            />

            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700 }}>
              ឈ្មោះទី {singleIdx + 1} / {filteredItems.length} —{' '}
              <span style={{ color: '#f8fafc' }}>{singleItem.student?.fullName || 'សិស្ស'}</span>
            </div>

            <div
              style={{
                width: `${cardWPx * singleCardScale}px`,
                height: `${cardHPx * singleCardScale}px`,
                position: 'relative',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '10.5cm',
                  height: '98.85mm',
                  transform: `scale(${singleCardScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <PrintInteractiveSheet
                  id="single-item-export-card"
                  scopeId="due-notice-print"
                  pageIdx={0}
                  styleConfig={printStyle.styleConfig}
                  tableSelection={tableSelection}
                  onCellSelected={() => setIsSidebarOpen(true)}
                  onAreaSelected={handleAreaSelected}
                  style={{
                    width: '10.5cm',
                    height: '98.85mm',
                    background: '#ffffff',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <DueNoticeCard
                    item={singleItem}
                    penaltyPercentPerDay={penaltyPercent}
                    showPenalty={!hidePenalty}
                    showAmount={!hideAmount}
                    hideHeader={hideHeader}
                    hideFooter={hideFooter}
                    showSignature={showSignature}
                    showPrintCount={!hidePrintCount}
                    displayPrintNumber={displayPrintNum}
                    issueDate={issueDateStr}
                    schoolPhone={schoolPhone}
                    schoolAddress={schoolAddress}
                    headerLogoUrl={headerLogoUrl}
                    noticeCashierName={activeCashierName}
                    noticeSignatureUrl={activeSignatureUrl}
                    showCutRight={false}
                    showCutBottom={false}
                  />
                </PrintInteractiveSheet>
              </div>
            </div>
          </div>
        );
      })()}

      <div
        className={`receipt-a4-sheets-container${singlePageView && filteredItems.length > 0 ? ' report-card-hidden-screen' : ''}`}
        style={{
          padding: '1.25rem 0 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          width: '100%',
        }}
      >
        {pages.length === 0 ? (
          <div
            className="no-print"
            style={{
              marginTop: '3rem',
              padding: '2rem 2.5rem',
              borderRadius: '14px',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              textAlign: 'center',
              maxWidth: '460px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.35rem', color: '#f8fafc' }}>
              គ្មានទិន្នន័យសិស្សត្រូវនឹងតម្រងនេះទេ
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              សូមប្តូរ ឬសម្អាតតម្រងខាងឆ្វេង ដើម្បីបង្ហាញលិខិតជូនដំណឹងសម្រាប់ Print។
            </div>
          </div>
        ) : (
          pages.map((pageItems, pageIdx) => (
            <div
              key={pageIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Page Label (Screen only) */}
              <div
                className="no-print"
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                ទំព័រទី {pageIdx + 1} / {pages.length} ({pageItems.length} លិខិត • A4 បញ្ឈរ 21cm × 29.7cm)
              </div>

              {/* Scaled Wrapper (Screen scales smoothly; Print removes transform via globals.css) */}
              <div
                className="receipt-a4-page-wrapper"
                style={{
                  width: `${A4_PORTRAIT_W_PX * previewScale}px`,
                  height: `${A4_PORTRAIT_H_PX * previewScale}px`,
                  position: 'relative',
                }}
              >
                <div
                  className="receipt-a4-preview-scale"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: '21cm',
                    height: '296.6mm',
                  }}
                >
                  <PrintInteractiveSheet
                    scopeId="due-notice-print"
                    pageIdx={pageIdx}
                    styleConfig={printStyle.styleConfig}
                    tableSelection={tableSelection}
                    onCellSelected={() => setIsSidebarOpen(true)}
                    onAreaSelected={handleAreaSelected}
                    className="receipt-a4-sheet"
                    data-print-grid="true"
                    style={{
                      width: '21cm',
                      height: '296.6mm',
                      background: '#ffffff',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
                      display: 'grid',
                      gridTemplateColumns: '10.5cm 10.5cm',
                      gridTemplateRows: '98.85mm 98.85mm 98.85mm',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                      const slotItem = pageItems[slotIdx];
                      const isLeftCol = slotIdx % 2 === 0;
                      const isNotBottomRow = slotIdx < 4;

                      if (!slotItem) {
                        return (
                          <div
                            key={`empty-${pageIdx}-${slotIdx}`}
                            style={{
                              width: '10.5cm',
                              height: '98.85mm',
                              boxSizing: 'border-box',
                              background: '#ffffff',
                              borderRight: showCutLines && isLeftCol ? '0.5pt dashed #cbd5e1' : 'none',
                              borderBottom: showCutLines && isNotBottomRow ? '0.5pt dashed #cbd5e1' : 'none',
                            }}
                          />
                        );
                      }

                      const slotStudentId = String(slotItem.student?.id || '');
                      const basePrintCount =
                        typeof slotItem.noticePrintCount === 'number'
                          ? slotItem.noticePrintCount
                          : getEffectiveNoticePrintCount(slotItem.student, slotItem.dueDateStr);
                      const displayPrintNum =
                        (slotStudentId && sessionPrintNumMap[slotStudentId]) ||
                        basePrintCount + 1;

                      return (
                        <DueNoticeCard
                          key={`${slotItem.student?.id || slotIdx}-${pageIdx}-${slotIdx}`}
                          item={slotItem}
                          penaltyPercentPerDay={penaltyPercent}
                          showPenalty={!hidePenalty}
                          showAmount={!hideAmount}
                          hideHeader={hideHeader}
                          hideFooter={hideFooter}
                          showSignature={showSignature}
                          showPrintCount={!hidePrintCount}
                          displayPrintNumber={displayPrintNum}
                          issueDate={issueDateStr}
                          schoolPhone={schoolPhone}
                          schoolAddress={schoolAddress}
                          headerLogoUrl={headerLogoUrl}
                          noticeCashierName={activeCashierName}
                          noticeSignatureUrl={activeSignatureUrl}
                          showCutRight={showCutLines && isLeftCol}
                          showCutBottom={showCutLines && isNotBottomRow}
                        />
                      );
                    })}
                  </PrintInteractiveSheet>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
