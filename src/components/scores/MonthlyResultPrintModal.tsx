"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { settingsService } from '@/services/db';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import MonthlyResultSheet, {
  A4_PORTRAIT_SPEC,
  DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT,
  MONTHLY_RESULT_FOOTER_LABELS,
  MonthlyResultClassPacket,
  MonthlyResultElementTransform,
  MonthlyResultFooterKey,
  MonthlyResultFooterLayout,
  MonthlyResultStudentRow,
  RESULT_COLOR_THEMES,
  ResultColorTheme,
  ResultPageLayoutMode,
  ResultSortMode,
  computeMonthlyResultPacketsForClass,
  formatDefaultKhmerDate,
  normalizeMonthlyResultFooterLayout,
  paginateMonthlyResultRows,
} from './MonthlyResultSheet';
import { AppIcon } from '../AppIcons';
import PrintStyleSidebar, { usePrintSidebarFocus } from '@/components/print/PrintStyleSidebar';
import PrintInteractiveSheet, {
  PrintSelectedArea,
  PrintTableOverrideStyles,
} from '@/components/print/PrintInteractiveSheet';
import { BUILTIN_RICH_FONT_CHOICES } from './certificateRichText';
import {
  usePrintDocumentStyle,
  useTableSelection,
} from '@/components/print/printStylePresets';

export interface MonthlyResultBrandingConfig {
  verticalLogoUrl?: string;
  resultStampUrl?: string;
  resultSignatureUrl?: string;
  resultSignatoryName?: string;
  resultThemeId?: string;
}

export interface MonthlyResultPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  allStudents: any[];
  allTeachers: any[];
  allScores: any[];
  monthCoeffMap: Record<string, any>;
  scoreSettings: any;
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
  monthExtraData?: {
    monthKhmer?: string;
    issueDateKhmer?: string;
  };
  initialClassId?: string | null;
  onSaveBrandingSettings?: (patch: MonthlyResultBrandingConfig) => Promise<void>;
}

export default function MonthlyResultPrintModal({
  isOpen,
  onClose,
  classes,
  allStudents,
  allTeachers,
  allScores,
  monthCoeffMap,
  scoreSettings,
  selectedMonth,
  onMonthChange,
  monthExtraData,
  initialClassId,
  onSaveBrandingSettings,
}: MonthlyResultPrintModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [sortMode, setSortMode] = useState<ResultSortMode>('rank_asc');
  const [splitBehavior, setSplitBehavior] = useState<'auto' | 'always' | 'never'>('auto');
  const [pageLayoutMode, setPageLayoutMode] = useState<ResultPageLayoutMode>('fit_one_page');
  const [includeUnscored, setIncludeUnscored] = useState<boolean>(true);
  const [showStampAndSignature, setShowStampAndSignature] = useState<boolean>(true);

  const [themeId, setThemeId] = useState<string>(scoreSettings?.resultThemeId || RESULT_COLOR_THEMES[0].id);
  const [verticalLogoUrl, setVerticalLogoUrl] = useState<string>(scoreSettings?.verticalLogoUrl || '');
  const [stampUrl, setStampUrl] = useState<string>(scoreSettings?.resultStampUrl || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(scoreSettings?.resultSignatureUrl || '');
  const [signatoryName, setSignatoryName] = useState<string>(
    scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ'
  );
  const [approvalLabel, setApprovalLabel] = useState<string>('បានឃើញ និងឯកភាព');
  const [teacherTitleLabel, setTeacherTitleLabel] = useState<string>('គ្រូបន្ទុកថ្នាក់');
  const [customMonthTitle, setCustomMonthTitle] = useState<string>('');
  const [khmerIssueDate, setKhmerIssueDate] = useState<string>(
    monthExtraData?.issueDateKhmer || formatDefaultKhmerDate()
  );

  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState<boolean>(true);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileInfo>(DEFAULT_SCHOOL_PROFILE);
  const [footerLayout, setFooterLayout] = useState<MonthlyResultFooterLayout>(
    DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT
  );
  const [isDragFooterMode, setIsDragFooterMode] = useState<boolean>(true);
  const [selectedFooterElement, setSelectedFooterElement] =
    useState<MonthlyResultFooterKey | null>(null);

  const printStyle = usePrintDocumentStyle('monthly_result', isOpen);
  const tableSelection = useTableSelection(isOpen);
  const { focusRequest, requestFocus } = usePrintSidebarFocus();

  const handleSelectFooterElement = useCallback(
    (k: MonthlyResultFooterKey | null) => {
      setSelectedFooterElement(k);
      if (k) {
        setIsLinkPanelOpen(true);
        tableSelection.clearSelection();
        requestFocus('doc', 'footer-inspector');
      }
    },
    [tableSelection, requestFocus]
  );

  const handleAreaSelected = useCallback(
    (area: PrintSelectedArea) => {
      setIsLinkPanelOpen(true);
      setSelectedFooterElement(null);
      if (area.kind === 'table') {
        requestFocus('table', 'table-cell');
      } else if (area.kind === 'section') {
        requestFocus('doc', area.sectionId || 'branding');
      } else if (area.kind === 'heading') {
        requestFocus('typography', 'font-size');
      } else {
        requestFocus('typography', 'font-family');
      }
    },
    [requestFocus]
  );

  const updateFooterElementTransform = useCallback(
    (key: MonthlyResultFooterKey, next: MonthlyResultElementTransform) => {
      setFooterLayout((prev) => ({
        ...prev,
        elements: {
          ...(prev.elements || {}),
          [key]: next,
        },
      }));
    },
    []
  );

  // Keyboard arrow-key nudging for the currently selected footer block
  useEffect(() => {
    if (!isOpen || !isDragFooterMode || !selectedFooterElement) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 2 : 0.5;
      setFooterLayout((prev) => {
        const cur = prev.elements?.[selectedFooterElement] || { dxMm: 0, dyMm: 0, scale: 1 };
        const dxMm = Number(
          (
            cur.dxMm +
            (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0)
          ).toFixed(1)
        );
        const dyMm = Number(
          (
            cur.dyMm +
            (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0)
          ).toFixed(1)
        );
        return {
          ...prev,
          elements: {
            ...(prev.elements || {}),
            [selectedFooterElement]: {
              ...cur,
              dxMm: Math.max(-180, Math.min(180, dxMm)),
              dyMm: Math.max(-180, Math.min(180, dyMm)),
            },
          },
        };
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isDragFooterMode, selectedFooterElement]);

  const activeFooterTransform: MonthlyResultElementTransform = selectedFooterElement
    ? footerLayout.elements?.[selectedFooterElement] || { dxMm: 0, dyMm: 0, scale: 1 }
    : { dxMm: 0, dyMm: 0, scale: 1 };

  const movedFooterElementsCount = Object.keys(footerLayout.elements || {}).length;

  const getDocOptions = () => ({
    themeId,
    sortMode,
    splitBehavior,
    pageLayoutMode,
    includeUnscored,
    showStampAndSignature,
    customMonthTitle,
    approvalLabel,
    teacherTitleLabel,
    footerLayout,
  });

  const applyDocOptions = (opts: Record<string, any>) => {
    if (typeof opts.themeId === 'string') setThemeId(opts.themeId);
    if (opts.sortMode) setSortMode(opts.sortMode as ResultSortMode);
    if (opts.splitBehavior) setSplitBehavior(opts.splitBehavior);
    if (opts.pageLayoutMode) setPageLayoutMode(opts.pageLayoutMode as ResultPageLayoutMode);
    if (typeof opts.includeUnscored === 'boolean') setIncludeUnscored(opts.includeUnscored);
    if (typeof opts.showStampAndSignature === 'boolean') setShowStampAndSignature(opts.showStampAndSignature);
    if (typeof opts.customMonthTitle === 'string') setCustomMonthTitle(opts.customMonthTitle);
    if (typeof opts.approvalLabel === 'string') setApprovalLabel(opts.approvalLabel);
    if (typeof opts.teacherTitleLabel === 'string') setTeacherTitleLabel(opts.teacherTitleLabel);
    if (opts.footerLayout && typeof opts.footerLayout === 'object') {
      setFooterLayout(normalizeMonthlyResultFooterLayout(opts.footerLayout));
    }
  };

  // Sync persisted branding & date when modal opens or scoreSettings updates
  useEffect(() => {
    if (!isOpen) return;
    setThemeId(scoreSettings?.resultThemeId || RESULT_COLOR_THEMES[0].id);
    setVerticalLogoUrl(scoreSettings?.verticalLogoUrl || '');
    setStampUrl(scoreSettings?.resultStampUrl || '');
    setSignatureUrl(scoreSettings?.resultSignatureUrl || '');
    setSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');
    setKhmerIssueDate(
      String(monthExtraData?.issueDateKhmer || '').trim() || formatDefaultKhmerDate()
    );
    setSaveFeedback('');
  }, [
    isOpen,
    scoreSettings?.resultThemeId,
    scoreSettings?.verticalLogoUrl,
    scoreSettings?.resultStampUrl,
    scoreSettings?.resultSignatureUrl,
    scoreSettings?.resultSignatoryName,
    monthExtraData?.issueDateKhmer,
  ]);

  // Subscribe to schoolInfo for fallback logo & bilingual school name
  useEffect(() => {
    if (!isOpen) return;
    const unsub = settingsService.subscribeOne('schoolInfo', (data: any) => {
      if (data) {
        setSchoolProfile({ ...DEFAULT_SCHOOL_PROFILE, ...data });
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Pre-compute score counts per class for quick picker badges
  const scoreCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    allScores.forEach((s: any) => {
      if (s?.month !== selectedMonth) return;
      const cid = String(s?.classId || '').trim();
      if (!cid) return;
      const hasVal = s?.totalScore !== '' && s?.totalScore !== undefined && s?.totalScore !== null && !isNaN(Number(s?.totalScore));
      if (hasVal) {
        map.set(cid, (map.get(cid) || 0) + 1);
      }
    });
    return map;
  }, [allScores, selectedMonth]);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) =>
      String(a?.classCode || a?.className || '').localeCompare(
        String(b?.classCode || b?.className || ''),
        'en',
        { numeric: true }
      )
    );
  }, [classes]);

  // Default class selection when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassIds([initialClassId]);
      return;
    }
    const withScores = sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0);
    if (withScores.length > 0 && withScores.length <= 3) {
      setSelectedClassIds(withScores.map((c) => c.id));
    } else if (withScores.length > 0) {
      setSelectedClassIds([withScores[0].id]);
    } else if (sortedClasses.length > 0) {
      setSelectedClassIds([sortedClasses[0].id]);
    } else {
      setSelectedClassIds([]);
    }
  }, [isOpen, initialClassId, classes, sortedClasses]);

  // Close class dropdown when clicking outside
  useEffect(() => {
    if (!isClassMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (classMenuRef.current && !classMenuRef.current.contains(e.target as Node)) {
        setIsClassMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isClassMenuOpen]);

  // Responsive preview zoom for A4 Portrait (accounts for open Left Sidebar)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const sideOffset = isLinkPanelOpen && window.innerWidth >= 960 ? 396 : 48;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      setPreviewScale(Math.min(1, availW / A4_PORTRAIT_SPEC.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, isLinkPanelOpen]);

  // Dynamic @page A4 Portrait rule while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = A4_PORTRAIT_SPEC.pageCss;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen]);

  const activeTheme: ResultColorTheme = useMemo(
    () => RESULT_COLOR_THEMES.find((t) => t.id === themeId) || RESULT_COLOR_THEMES[0],
    [themeId]
  );

  // Build packets for every selected class (splitting into separate per-level sheets when enabled)
  const classPackets: MonthlyResultClassPacket[] = useMemo(() => {
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses
      .filter((c) => selectedSet.has(c.id))
      .flatMap((classObj) => {
        const classScoreRows = allScores.filter(
          (s: any) => s?.classId === classObj.id && s?.month === selectedMonth
        );
        return computeMonthlyResultPacketsForClass(
          {
            classObj,
            allStudents,
            allTeachers,
            allClasses: classes,
            classScoreRows,
            monthCoeffMap,
            scoreSettings,
            sortMode,
            includeUnscored,
          },
          splitBehavior
        );
      });
  }, [
    sortedClasses,
    selectedClassIds,
    allScores,
    selectedMonth,
    allStudents,
    allTeachers,
    classes,
    monthCoeffMap,
    scoreSettings,
    sortMode,
    includeUnscored,
    splitBehavior,
  ]);

  // Slice packets into exact A4 Portrait pages
  const renderedPages = useMemo(() => {
    const pages: {
      key: string;
      label: string;
      packet: MonthlyResultClassPacket;
      rowsSlice: MonthlyResultStudentRow[];
      startIndex: number;
      pageIndex: number;
      totalPagesForClass: number;
      isLastPageForClass: boolean;
    }[] = [];

    classPackets.forEach((packet) => {
      const slices = paginateMonthlyResultRows(packet.rows, pageLayoutMode);
      const levelSuffix = packet.splitLevelLabel ? ` • វគ្គ ${packet.splitLevelLabel}` : '';
      slices.forEach((sl) => {
        pages.push({
          key: `${packet.packetKey}-p${sl.pageIndex}`,
          label:
            sl.totalPagesForClass > 1
              ? `ថ្នាក់ ${packet.classCode || packet.className}${levelSuffix} (${packet.rows.length} សិស្ស • ទំព័រ ${sl.pageIndex + 1}/${sl.totalPagesForClass})`
              : `ថ្នាក់ ${packet.classCode || packet.className}${levelSuffix} (${packet.rows.length} សិស្ស)`,
          packet,
          rowsSlice: sl.rowsSlice,
          startIndex: sl.startIndex,
          pageIndex: sl.pageIndex,
          totalPagesForClass: sl.totalPagesForClass,
          isLastPageForClass: sl.isLastPageForClass,
        });
      });
    });

    return pages;
  }, [classPackets, pageLayoutMode]);

  const handlePrint = () => {
    if (typeof window === 'undefined' || renderedPages.length === 0) return;

    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = A4_PORTRAIT_SPEC.pageCss;

    document.body.classList.add('printing-receipt-a4');

    const cleanup = () => {
      document.body.classList.remove('printing-receipt-a4');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt-a4');
      }, 1200);
    }, 80);
  };

  const handleSaveBranding = async () => {
    if (!onSaveBrandingSettings) return;
    setIsSavingBranding(true);
    setSaveFeedback('');
    try {
      await onSaveBrandingSettings({
        verticalLogoUrl: verticalLogoUrl.trim(),
        resultStampUrl: stampUrl.trim(),
        resultSignatureUrl: signatureUrl.trim(),
        resultSignatoryName: signatoryName.trim() || 'សំរិត វឌ្ឍនៈ',
        resultThemeId: themeId,
      });
      setSaveFeedback('បានរក្សាទុក!');
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch (err) {
      console.error('Failed saving result branding links:', err);
      setSaveFeedback('បរាជ័យ!');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const toggleClassId = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredClassOptions = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return sortedClasses;
    return sortedClasses.filter(
      (c) =>
        String(c.classCode || '').toLowerCase().includes(q) ||
        String(c.className || '').toLowerCase().includes(q) ||
        String(c.teacherName || '').toLowerCase().includes(q)
    );
  }, [sortedClasses, classSearch]);

  if (!isOpen || typeof document === 'undefined') return null;

  const classButtonLabel =
    selectedClassIds.length === 0
      ? 'ជ្រើសរើសថ្នាក់រៀន...'
      : selectedClassIds.length === sortedClasses.length && sortedClasses.length > 0
        ? `គ្រប់ថ្នាក់ទាំងអស់ (${sortedClasses.length} ថ្នាក់)`
        : selectedClassIds.length === 1
          ? (() => {
              const found = sortedClasses.find((c) => c.id === selectedClassIds[0]);
              return found ? `ថ្នាក់ ${found.classCode || found.className}` : '1 ថ្នាក់';
            })()
          : `បានជ្រើស ${selectedClassIds.length} ថ្នាក់`;

  return createPortal(
    <div
      id="payment-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.93)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Top Action & Filter Toolbar (Hidden in print) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#0f172a',
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
          padding: '0.65rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Row 1: Class, Month, Sort, Color Themes, Link Toggle, Print, Close */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.55rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem' }}>
            {/* Title Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem', marginRight: '0.2rem' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="award" size={16} strokeWidth={2.2} />
              </span>
              <span>លទ្ធផលប្រចាំខែ (A4)</span>
            </div>

            {/* Multi-class Dropdown Selector */}
            <div ref={classMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((v) => !v)}
                style={{
                  padding: '0.42rem 0.7rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  minWidth: '175px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '165px' }}>
                  {classButtonLabel}
                </span>
                <AppIcon name="chevron-down" size={14} strokeWidth={2.2} />
              </button>

              {isClassMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '320px',
                    maxHeight: '360px',
                    background: '#1e293b',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    borderRadius: '10px',
                    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
                    padding: '0.6rem',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <input
                    type="text"
                    placeholder="ស្វែងរកថ្នាក់ ឬគ្រូ..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds(sortedClasses.map((c) => c.id))}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ទាំងអស់ ({sortedClasses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClassIds(
                          sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0).map((c) => c.id)
                        )
                      }
                      style={{
                        flex: 1,
                        padding: '0.3rem 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.12)',
                        color: '#6ee7b7',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ថ្នាក់មានពិន្ទុ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds([])}
                      style={{
                        padding: '0.3rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#fca5a5',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      លុប
                    </button>
                  </div>

                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '220px' }}>
                    {filteredClassOptions.map((c) => {
                      const checked = selectedClassIds.includes(c.id);
                      const scoredCnt = scoreCountByClass.get(c.id) || 0;
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: checked ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
                            color: '#f1f5f9',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            gap: '0.45rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleClassId(c.id)}
                            />
                            <span style={{ fontWeight: 700 }}>{c.classCode || c.className}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.74rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.teacherName || ''}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.08rem 0.4rem',
                              borderRadius: '999px',
                              background: scoredCnt > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.16)',
                              color: scoredCnt > 0 ? '#6ee7b7' : '#94a3b8',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {scoredCnt} ពិន្ទុ
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Month Picker */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              style={{
                padding: '0.38rem 0.6rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.83rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          {/* Right Buttons: Sidebar toggle, Print, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsLinkPanelOpen((v) => !v)}
              style={{
                padding: '0.45rem 0.78rem',
                borderRadius: '8px',
                background: isLinkPanelOpen ? 'rgba(99, 102, 241, 0.25)' : '#1e293b',
                border: isLinkPanelOpen ? '1px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.35)',
                color: '#e0e7ff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AppIcon name="sliders" size={15} strokeWidth={2} />
              <span>{isLinkPanelOpen ? 'លាក់ការកំណត់' : 'ការកំណត់ ពណ៌ & Font'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={renderedPages.length === 0}
              style={{
                padding: '0.46rem 0.95rem',
                borderRadius: '8px',
                background: renderedPages.length === 0 ? '#475569' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: renderedPages.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              }}
            >
              <AppIcon name="printer" size={15} strokeWidth={2.2} />
              <span>ព្រីន A4 ({renderedPages.length})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.45rem 0.78rem',
                borderRadius: '8px',
                background: '#334155',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#f8fafc',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AppIcon name="x" size={15} strokeWidth={2.2} />
              <span>បិទ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Workspace: Left Settings Sidebar + Right Live A4 Preview */}
      <PrintTableOverrideStyles
        scopeId="monthly-result-print"
        styleConfig={printStyle.styleConfig}
        tableSelection={tableSelection}
      />
      <div className="print-workspace-body">
        {isLinkPanelOpen && (
          <PrintStyleSidebar
            title="ការកំណត់លទ្ធផលប្រឡង"
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
            {/* Layout, Sort & Color Themes */}
            <div
              data-sidebar-section="doc-options"
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>
                ទម្រង់ទំព័រ &amp; ពណ៌តារាង
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem', fontWeight: 600 }}>
                  របៀបបង្ហាញទំព័រ A4
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '7px',
                    padding: '0.16rem',
                    gap: '0.16rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPageLayoutMode('fit_one_page')}
                    style={{
                      padding: '0.3rem 0.45rem',
                      borderRadius: '5px',
                      border: 'none',
                      background: pageLayoutMode === 'fit_one_page' ? '#2563eb' : 'transparent',
                      color: pageLayoutMode === 'fit_one_page' ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ១ ទំព័រ (Fit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageLayoutMode('multi_page')}
                    style={{
                      padding: '0.3rem 0.45rem',
                      borderRadius: '5px',
                      border: 'none',
                      background: pageLayoutMode === 'multi_page' ? '#4f46e5' : 'transparent',
                      color: pageLayoutMode === 'multi_page' ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    បំបែក ២ ទំព័រ
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem', fontWeight: 600 }}>
                  តម្រៀបជួរសិស្ស
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as ResultSortMode)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '7px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#f8fafc',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="rank_asc">ចំណាត់ថ្នាក់ (១→N)</option>
                  <option value="level_name">កម្រិត &amp; ឈ្មោះ</option>
                  <option value="name_asc">ឈ្មោះ (ក→អ)</option>
                  <option value="student_id">អត្តលេខ (ID)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem', fontWeight: 600 }}>
                  ការបំបែកតាមវគ្គ (Level)
                </label>
                <select
                  value={splitBehavior}
                  onChange={(e) => setSplitBehavior(e.target.value as 'auto' | 'always' | 'never')}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '7px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#f8fafc',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="auto">តាមការកំណត់ថ្នាក់</option>
                  <option value="always">បំបែកគ្រប់វគ្គដាច់ដោយឡែក</option>
                  <option value="never">រួមជាតារាងថ្នាក់តែមួយ</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.24rem', fontWeight: 600 }}>
                  ពណ៌តារាង (Themes)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {RESULT_COLOR_THEMES.map((t) => {
                    const isSelected = t.id === activeTheme.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeId(t.id)}
                        title={`${t.nameKh} — ${t.descriptionKh}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.28rem',
                          padding: '0.22rem 0.48rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.16)' : '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '3px',
                            background: `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 55%)`,
                            border: '1px solid rgba(255,255,255,0.45)',
                            flexShrink: 0,
                          }}
                        />
                        <span>{t.nameKh.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label
                title="បន្ថែមសិស្សដែលកំពុងសិក្សាក្នុងថ្នាក់នេះដែលមិនទាន់មានពិន្ទុ (មិនរាប់បញ្ចូលសិស្សឈប់រៀន/ព្យួរ ឬថ្នាក់ផ្សេង)"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={includeUnscored}
                  onChange={(e) => setIncludeUnscored(e.target.checked)}
                />
                <span>រាប់បញ្ចូលសិស្សទាំងអស់ក្នុងថ្នាក់</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showStampAndSignature}
                  onChange={(e) => setShowStampAndSignature(e.target.checked)}
                />
                <span>បង្ហាញត្រា &amp; ហត្ថលេខា</span>
              </label>
            </div>

            {/* Links, Signatory, Date & Month Title Override */}
            <div
              data-sidebar-section="branding"
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
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                ឡូហ្គោ ត្រា ហត្ថលេខា &amp; កាលបរិច្ឆេទ
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.18rem' }}>
                  Link ឡូហ្គោបញ្ឈរ (Google Drive / URL)
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={verticalLogoUrl}
                    onChange={(e) => setVerticalLogoUrl(e.target.value)}
                    placeholder="ទុកទំនេរ = ឡូហ្គោស្តង់ដារ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.32rem 0.48rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                  {verticalLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setVerticalLogoUrl('')}
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.12)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="x" size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#fda4af', marginBottom: '0.18rem' }}>
                  Link ត្រា (Stamp URL)
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={stampUrl}
                    onChange={(e) => setStampUrl(e.target.value)}
                    placeholder="ទុកទំនេរ = ត្រា BSIS ក្រហម..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.32rem 0.48rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                  {stampUrl && (
                    <button
                      type="button"
                      onClick={() => setStampUrl('')}
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.12)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="x" size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.18rem' }}>
                  Link ហត្ថលេខា (ស្រេចចិត្ត)
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={signatureUrl}
                    onChange={(e) => setSignatureUrl(e.target.value)}
                    placeholder="ទុកទំនេរ = ហត្ថលេខាប៊ិកខៀវ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.32rem 0.48rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                  {signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setSignatureUrl('')}
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.12)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="x" size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.18rem' }}>
                    ឈ្មោះចុះហត្ថលេខា
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="សំរិត វឌ្ឍនៈ"
                    style={{
                      width: '100%',
                      padding: '0.32rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.18rem' }}>
                    ឈ្មោះខែបន្ថែម
                  </label>
                  <input
                    type="text"
                    value={customMonthTitle}
                    onChange={(e) => setCustomMonthTitle(e.target.value)}
                    placeholder="ស្វ័យប្រវត្តិ"
                    style={{
                      width: '100%',
                      padding: '0.32rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.18rem' }}>
                  កាលបរិច្ឆេទ (ខ្មែរ)
                </label>
                <input
                  type="text"
                  value={khmerIssueDate}
                  onChange={(e) => setKhmerIssueDate(e.target.value)}
                  placeholder="ថ្ងៃទី២៤ ខែវិច្ឆិកា ឆ្នាំ២០២៦"
                  style={{
                    width: '100%',
                    padding: '0.32rem 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                />
              </div>

              {onSaveBrandingSettings && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', paddingTop: '0.2rem' }}>
                  {saveFeedback ? (
                    <span style={{ fontSize: '0.73rem', color: '#6ee7b7', fontWeight: 700 }}>
                      {saveFeedback}
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    style={{
                      padding: '0.34rem 0.72rem',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: isSavingBranding ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                    }}
                  >
                    <AppIcon name="check" size={13} strokeWidth={2.5} />
                    <span>{isSavingBranding ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក Link & ពណ៌'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Movable Footer Blocks Inspector (Date, Teacher Role, Approval, Stamp 3.5cm, Signature, Signatory Name) */}
            <div
              data-sidebar-section="footer-inspector"
              style={{
                background: selectedFooterElement
                  ? 'rgba(14, 116, 144, 0.2)'
                  : 'rgba(30, 41, 59, 0.72)',
                border: selectedFooterElement
                  ? '1.5px solid rgba(56, 189, 248, 0.65)'
                  : '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                  ផ្លាស់ទីកាលបរិច្ឆេទ ត្រា &amp; ហត្ថលេខា
                </span>
                {movedFooterElementsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFooterLayout((prev) => ({ ...prev, elements: {} }));
                      setSelectedFooterElement(null);
                    }}
                    style={{
                      padding: '0.12rem 0.4rem',
                      borderRadius: '5px',
                      border: '1px solid rgba(248, 113, 113, 0.45)',
                      background: 'rgba(239, 68, 68, 0.14)',
                      color: '#fca5a5',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    កំណត់ទីតាំងដើម
                  </button>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDragFooterMode}
                  onChange={(e) => {
                    setIsDragFooterMode(e.target.checked);
                    if (!e.target.checked) setSelectedFooterElement(null);
                  }}
                />
                <span>អនុញ្ញាតអូសរំកិលប្រអប់ដោយ Mouse (Drag)</span>
              </label>

              {/* Quick-select buttons for each separated footer text/asset block */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.26rem' }}>
                {(Object.keys(MONTHLY_RESULT_FOOTER_LABELS) as MonthlyResultFooterKey[]).map((key) => {
                  const active = selectedFooterElement === key;
                  const hidden = footerLayout.elements?.[key]?.visible === false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setIsDragFooterMode(true);
                        setSelectedFooterElement(active ? null : key);
                      }}
                      style={{
                        padding: '0.16rem 0.42rem',
                        borderRadius: '6px',
                        border: active
                          ? '1.5px solid #38bdf8'
                          : '1px solid rgba(148, 163, 184, 0.28)',
                        background: active ? 'rgba(56, 189, 248, 0.26)' : '#0f172a',
                        color: hidden ? '#64748b' : active ? '#ffffff' : '#cbd5e1',
                        fontSize: '0.68rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        textDecoration: hidden ? 'line-through' : 'none',
                      }}
                    >
                      {MONTHLY_RESULT_FOOTER_LABELS[key]}
                    </button>
                  );
                })}
              </div>

              {/* Stamp Size (default 35mm / 3.5cm) & Signature Height */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#cbd5e1', marginBottom: '0.12rem' }}>
                    <span>ទំហំត្រា</span>
                    <span style={{ color: '#fda4af', fontWeight: 700 }}>
                      {footerLayout.stampSizeMm} mm ({(footerLayout.stampSizeMm / 10).toFixed(1)} cm)
                    </span>
                  </label>
                  <input
                    type="range"
                    min={16}
                    max={64}
                    step={0.5}
                    value={footerLayout.stampSizeMm}
                    onChange={(e) =>
                      setFooterLayout((prev) => ({ ...prev, stampSizeMm: Number(e.target.value) }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#cbd5e1', marginBottom: '0.12rem' }}>
                    <span>កម្ពស់ហត្ថលេខា</span>
                    <span style={{ color: '#93c5fd', fontWeight: 700 }}>
                      {footerLayout.signatureHeightMm} mm
                    </span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={28}
                    step={0.5}
                    value={footerLayout.signatureHeightMm}
                    onChange={(e) =>
                      setFooterLayout((prev) => ({
                        ...prev,
                        signatureHeightMm: Number(e.target.value),
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Contextual Element Settings + X / Y / Scale Controls */}
              {selectedFooterElement ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.28rem', borderTop: '1px solid rgba(56, 189, 248, 0.35)' }}>
                  {/* Active element header + Show/Hide toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#bae6fd' }}>
                      កំពុងកែ៖ {MONTHLY_RESULT_FOOTER_LABELS[selectedFooterElement]}
                    </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.69rem', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeFooterTransform.visible !== false}
                        onChange={(e) =>
                          updateFooterElementTransform(selectedFooterElement, {
                            ...activeFooterTransform,
                            visible: e.target.checked,
                          })
                        }
                      />
                      <span>បង្ហាញ</span>
                    </label>
                  </div>

                  {/* Contextual Controls for STAMP */}
                  {selectedFooterElement === 'stamp' && (
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(251, 113, 133, 0.32)',
                        borderRadius: '8px',
                        padding: '0.42rem 0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.34rem',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                        <div>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1' }}>
                            <span>បង្វិលត្រា</span>
                            <span style={{ color: '#fda4af', fontWeight: 700 }}>{footerLayout.stampRotationDeg ?? 0}°</span>
                          </label>
                          <input
                            type="range"
                            min={-45}
                            max={45}
                            step={1}
                            value={footerLayout.stampRotationDeg ?? 0}
                            onChange={(e) =>
                              setFooterLayout((prev) => ({
                                ...prev,
                                stampRotationDeg: Number(e.target.value),
                              }))
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1' }}>
                            <span>ភាពច្បាស់ត្រា</span>
                            <span style={{ color: '#fda4af', fontWeight: 700 }}>
                              {Math.round((footerLayout.stampOpacity ?? 0.92) * 100)}%
                            </span>
                          </label>
                          <input
                            type="range"
                            min={0.15}
                            max={1}
                            step={0.05}
                            value={footerLayout.stampOpacity ?? 0.92}
                            onChange={(e) =>
                              setFooterLayout((prev) => ({
                                ...prev,
                                stampOpacity: Number(e.target.value),
                              }))
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={stampUrl}
                        onChange={(e) => setStampUrl(e.target.value)}
                        placeholder="Link រូបត្រា (ទុកទំនេរ = ត្រាស្តង់ដារ BSIS)..."
                        style={{
                          width: '100%',
                          padding: '0.26rem 0.42rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.71rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {/* Contextual Controls for SIGNATURE */}
                  {selectedFooterElement === 'signature' && (
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(96, 165, 250, 0.35)',
                        borderRadius: '8px',
                        padding: '0.42rem 0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.34rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 600 }}>ពណ៌ប៊ិកហត្ថលេខា</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem' }}>
                          {['#1d4ed8', '#0f172a', '#dc2626', '#047857', '#6d28d9'].map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => setFooterLayout((prev) => ({ ...prev, signatureColor: hex }))}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                border: (footerLayout.signatureColor || '#1d4ed8') === hex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                                background: hex,
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            />
                          ))}
                          <input
                            type="color"
                            value={footerLayout.signatureColor || '#1d4ed8'}
                            onChange={(e) => setFooterLayout((prev) => ({ ...prev, signatureColor: e.target.value }))}
                            style={{ width: '20px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={signatureUrl}
                        onChange={(e) => setSignatureUrl(e.target.value)}
                        placeholder="Link រូបហត្ថលេខា (ទុកទំនេរ = ប៊ិកខៀវ)..."
                        style={{
                          width: '100%',
                          padding: '0.26rem 0.42rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.71rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {/* Contextual Controls for TEXT BLOCKS (issueDate, teacherTitle, approvalLabel, signatoryName) */}
                  {(selectedFooterElement === 'issueDate' ||
                    selectedFooterElement === 'teacherTitle' ||
                    selectedFooterElement === 'approvalLabel' ||
                    selectedFooterElement === 'signatoryName') && (
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(56, 189, 248, 0.32)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      {/* Direct Text Edit */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.67rem', color: '#94a3b8', marginBottom: '0.12rem' }}>
                          កែអក្សរផ្ទាល់
                        </label>
                        <input
                          type="text"
                          value={
                            selectedFooterElement === 'issueDate'
                              ? khmerIssueDate
                              : selectedFooterElement === 'teacherTitle'
                                ? teacherTitleLabel
                                : selectedFooterElement === 'approvalLabel'
                                  ? approvalLabel
                                  : signatoryName
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (selectedFooterElement === 'issueDate') setKhmerIssueDate(val);
                            else if (selectedFooterElement === 'teacherTitle') setTeacherTitleLabel(val);
                            else if (selectedFooterElement === 'approvalLabel') setApprovalLabel(val);
                            else setSignatoryName(val);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.28rem 0.44rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.32)',
                            background: '#0f172a',
                            color: '#f8fafc',
                            fontSize: '0.74rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Font Family */}
                      <select
                        value={activeFooterTransform.fontFamily || ''}
                        onChange={(e) =>
                          updateFooterElementTransform(selectedFooterElement, {
                            ...activeFooterTransform,
                            fontFamily: e.target.value || undefined,
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '0.25rem 0.4rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.71rem',
                        }}
                      >
                        <option value="">ពុម្ពអក្សរ៖ លំនាំដើម (Default)</option>
                        {BUILTIN_RICH_FONT_CHOICES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      {/* Font Size + Color + Bold/Italic */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#cbd5e1' }}>
                            <span>ទំហំអក្សរ</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                              {activeFooterTransform.fontSizePt ? `${activeFooterTransform.fontSizePt} pt` : 'ដើម'}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={6}
                            max={20}
                            step={0.5}
                            value={activeFooterTransform.fontSizePt ?? 9.5}
                            onChange={(e) =>
                              updateFooterElementTransform(selectedFooterElement, {
                                ...activeFooterTransform,
                                fontSizePt: Number(e.target.value),
                              })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                        <input
                          type="color"
                          title="ពណ៌អក្សរ"
                          value={activeFooterTransform.color || '#0f172a'}
                          onChange={(e) =>
                            updateFooterElementTransform(selectedFooterElement, {
                              ...activeFooterTransform,
                              color: e.target.value,
                            })
                          }
                          style={{ width: '24px', height: '24px', border: '1px solid #475569', borderRadius: '5px', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        />
                        <button
                          type="button"
                          title="អក្សរដិត (Bold)"
                          onClick={() =>
                            updateFooterElementTransform(selectedFooterElement, {
                              ...activeFooterTransform,
                              bold: activeFooterTransform.bold === undefined ? true : !activeFooterTransform.bold,
                            })
                          }
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '5px',
                            border: activeFooterTransform.bold ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.35)',
                            background: activeFooterTransform.bold ? 'rgba(56,189,248,0.25)' : '#1e293b',
                            color: '#f8fafc',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          title="អក្សរទ្រេត (Italic)"
                          onClick={() =>
                            updateFooterElementTransform(selectedFooterElement, {
                              ...activeFooterTransform,
                              italic: !activeFooterTransform.italic,
                            })
                          }
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '5px',
                            border: activeFooterTransform.italic ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.35)',
                            background: activeFooterTransform.italic ? 'rgba(56,189,248,0.25)' : '#1e293b',
                            color: '#f8fafc',
                            fontSize: '0.72rem',
                            fontStyle: 'italic',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          I
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#cbd5e1' }}>
                        <span>ឆ្វេង-ស្ដាំ (X)</span>
                        <span style={{ color: '#7dd3fc' }}>{activeFooterTransform.dxMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-140}
                        max={140}
                        step={0.5}
                        value={activeFooterTransform.dxMm}
                        onChange={(e) =>
                          updateFooterElementTransform(selectedFooterElement, {
                            ...activeFooterTransform,
                            dxMm: Number(e.target.value),
                          })
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#cbd5e1' }}>
                        <span>លើ-ក្រោម (Y)</span>
                        <span style={{ color: '#7dd3fc' }}>{activeFooterTransform.dyMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-120}
                        max={120}
                        step={0.5}
                        value={activeFooterTransform.dyMm}
                        onChange={(e) =>
                          updateFooterElementTransform(selectedFooterElement, {
                            ...activeFooterTransform,
                            dyMm: Number(e.target.value),
                          })
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#cbd5e1' }}>
                      <span>ពង្រីក / បង្រួម (Scale)</span>
                      <span style={{ color: '#fbbf24' }}>{Math.round(activeFooterTransform.scale * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.02}
                      value={activeFooterTransform.scale}
                      onChange={(e) =>
                        updateFooterElementTransform(selectedFooterElement, {
                          ...activeFooterTransform,
                          scale: Number(e.target.value),
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                      អូសផ្ទាល់ ឬប្រើព្រួញ ↑↓←→ លើ Keyboard
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFooterLayout((prev) => {
                          const nextEl = { ...(prev.elements || {}) };
                          delete nextEl[selectedFooterElement];
                          return { ...prev, elements: nextEl };
                        });
                      }}
                      style={{
                        padding: '0.14rem 0.45rem',
                        borderRadius: '5px',
                        border: '1px solid rgba(251, 191, 36, 0.45)',
                        background: 'rgba(251, 191, 36, 0.14)',
                        color: '#fde68a',
                        fontSize: '0.67rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reset ធាតុនេះ
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  ចុចលើតារាង ចំណងជើង ឡូហ្គោ កាលបរិច្ឆេទ ត្រា ឬហត្ថលេខា លើទំព័រ A4 ដើម្បីបើកការកំណត់ដោយស្វ័យប្រវត្តិ។
                </div>
              )}
            </div>
          </PrintStyleSidebar>
        )}

      {/* A4 Portrait Preview Canvas */}
      <div className="print-preview-stage">
      <div
        className="receipt-a4-sheets-container"
        style={{
          flex: 1,
          padding: '1.25rem 1rem 2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {renderedPages.length === 0 ? (
          <div
            className="no-print"
            style={{
              marginTop: '3rem',
              padding: '2rem',
              borderRadius: '14px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#cbd5e1',
              textAlign: 'center',
              maxWidth: '420px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
              មិនទាន់បានជ្រើសរើសថ្នាក់រៀន
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              សូមចុចជ្រើសរើសថ្នាក់រៀននៅប្រអប់ខាងលើ ដើម្បីមើលគំរូ និងព្រីនលទ្ធផលប្រចាំខែ A4។
            </div>
          </div>
        ) : (
          renderedPages.map((pg, idx) => (
            <div
              key={pg.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Screen-only label above page */}
              <div
                className="no-print"
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                ទំព័រទី {idx + 1} / {renderedPages.length} — {pg.label}
              </div>

              <div
                className="receipt-a4-page-wrapper"
                style={{
                  width: `${A4_PORTRAIT_SPEC.sheetWPx * previewScale}px`,
                  height: `${A4_PORTRAIT_SPEC.sheetHPx * previewScale}px`,
                  position: 'relative',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="receipt-a4-preview-scale"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: A4_PORTRAIT_SPEC.sheetW,
                    height: A4_PORTRAIT_SPEC.sheetH,
                  }}
                >
                  <PrintInteractiveSheet
                    scopeId="monthly-result-print"
                    pageIdx={idx}
                    styleConfig={printStyle.styleConfig}
                    tableSelection={tableSelection}
                    onCellSelected={() => {
                      setIsLinkPanelOpen(true);
                      setSelectedFooterElement(null);
                    }}
                    onAreaSelected={handleAreaSelected}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <MonthlyResultSheet
                      packet={pg.packet}
                      rowsSlice={pg.rowsSlice}
                      startIndex={pg.startIndex}
                      pageIndex={pg.pageIndex}
                      totalPagesForClass={pg.totalPagesForClass}
                      isLastPageForClass={pg.isLastPageForClass}
                      monthStr={selectedMonth}
                      customMonthName={customMonthTitle}
                      khmerIssueDate={khmerIssueDate}
                      theme={activeTheme}
                      verticalLogoUrl={verticalLogoUrl}
                      stampUrl={stampUrl}
                      signatureUrl={signatureUrl}
                      signatoryName={signatoryName}
                      approvalLabel={approvalLabel}
                      teacherTitleLabel={teacherTitleLabel}
                      showStampAndSignature={showStampAndSignature}
                      schoolProfile={schoolProfile}
                      layoutMode={pageLayoutMode}
                      footerLayout={footerLayout}
                      interactive={isDragFooterMode}
                      previewScale={previewScale}
                      selectedFooterElement={selectedFooterElement}
                      onSelectFooterElement={handleSelectFooterElement}
                      onUpdateFooterElementTransform={updateFooterElementTransform}
                    />
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
