"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { settingsService } from '@/services/db';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import MonthlyResultSheet, {
  A4_PORTRAIT_SPEC,
  MAX_SINGLE_PAGE_RESULT_ROWS,
  MULTI_PAGE_CHUNK_ROWS,
  MonthlyResultClassPacket,
  MonthlyResultStudentRow,
  RESULT_COLOR_THEMES,
  ResultColorTheme,
  ResultSortMode,
  computeMonthlyResultPacket,
  formatDefaultKhmerDate,
} from './MonthlyResultSheet';
import { AppIcon } from '../AppIcons';

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
  const [includeUnscored, setIncludeUnscored] = useState<boolean>(true);
  const [showStampAndSignature, setShowStampAndSignature] = useState<boolean>(true);

  const [themeId, setThemeId] = useState<string>(scoreSettings?.resultThemeId || RESULT_COLOR_THEMES[0].id);
  const [verticalLogoUrl, setVerticalLogoUrl] = useState<string>(scoreSettings?.verticalLogoUrl || '');
  const [stampUrl, setStampUrl] = useState<string>(scoreSettings?.resultStampUrl || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(scoreSettings?.resultSignatureUrl || '');
  const [signatoryName, setSignatoryName] = useState<string>(
    scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ'
  );
  const [customMonthTitle, setCustomMonthTitle] = useState<string>('');
  const [khmerIssueDate, setKhmerIssueDate] = useState<string>(
    monthExtraData?.issueDateKhmer || formatDefaultKhmerDate()
  );

  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState<boolean>(true);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileInfo>(DEFAULT_SCHOOL_PROFILE);

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

  // Responsive preview zoom for A4 Portrait
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const availW = Math.max(320, window.innerWidth - 48);
      setPreviewScale(Math.min(1, availW / A4_PORTRAIT_SPEC.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen]);

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

  // Build packets for every selected class
  const classPackets: MonthlyResultClassPacket[] = useMemo(() => {
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses
      .filter((c) => selectedSet.has(c.id))
      .map((classObj) => {
        const classScoreRows = allScores.filter(
          (s: any) => s?.classId === classObj.id && s?.month === selectedMonth
        );
        return computeMonthlyResultPacket({
          classObj,
          allStudents,
          allTeachers,
          allClasses: classes,
          classScoreRows,
          monthCoeffMap,
          scoreSettings,
          sortMode,
          includeUnscored,
        });
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
  ]);

  // Slice packets into exact A4 Portrait pages (1 sheet per class for <= 36 students, clean split above)
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
      const rows = packet.rows;
      if (rows.length <= MAX_SINGLE_PAGE_RESULT_ROWS) {
        pages.push({
          key: `${packet.classId}-p0`,
          label: `ថ្នាក់ ${packet.classCode || packet.className} (${rows.length} សិស្ស)`,
          packet,
          rowsSlice: rows,
          startIndex: 0,
          pageIndex: 0,
          totalPagesForClass: 1,
          isLastPageForClass: true,
        });
      } else {
        const totalChunks = Math.ceil(rows.length / MULTI_PAGE_CHUNK_ROWS);
        for (let i = 0; i < totalChunks; i++) {
          const start = i * MULTI_PAGE_CHUNK_ROWS;
          const slice = rows.slice(start, start + MULTI_PAGE_CHUNK_ROWS);
          pages.push({
            key: `${packet.classId}-p${i}`,
            label: `ថ្នាក់ ${packet.classCode || packet.className} (${rows.length} សិស្ស • ទំព័រ ${i + 1}/${totalChunks})`,
            packet,
            rowsSlice: slice,
            startIndex: start,
            pageIndex: i,
            totalPagesForClass: totalChunks,
            isLastPageForClass: i === totalChunks - 1,
          });
        }
      }
    });

    return pages;
  }, [classPackets]);

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

            {/* Student Sort Selector */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as ResultSortMode)}
              style={{
                padding: '0.41rem 0.6rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
              title="តម្រៀបជួរសិស្ស"
            >
              <option value="rank_asc">តម្រៀប៖ ចំណាត់ថ្នាក់ (១→N)</option>
              <option value="level_name">តម្រៀប៖ កម្រិត &amp; ឈ្មោះ</option>
              <option value="name_asc">តម្រៀប៖ ឈ្មោះ (ក→អ)</option>
              <option value="student_id">តម្រៀប៖ អត្តលេខ (ID)</option>
            </select>

            {/* 5 Beautiful Table Color Themes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                borderRadius: '8px',
                padding: '0.28rem 0.5rem',
              }}
            >
              <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600, marginRight: '0.15rem' }}>
                ពណ៌តារាង៖
              </span>
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
                      padding: '0.2rem 0.45rem',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.55)',
                      color: '#f8fafc',
                      fontSize: '0.73rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 55%)`,
                        border: '1px solid rgba(255,255,255,0.45)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>{t.nameKh.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Buttons: Link Box toggle, Print, Close */}
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
              <AppIcon name="image" size={15} strokeWidth={2} />
              <span>ភ្ជាប់ Link ត្រា &amp; ឡូហ្គោ</span>
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

        {/* Row 2: Link Inputs Box for Vertical Logo, Stamp, Signature, Title/Date & Options */}
        {isLinkPanelOpen && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.65rem',
              }}
            >
              {/* Vertical Logo Link Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.25rem' }}>
                  Link ឡូហ្គោបញ្ឈរ (Google Drive / URL)
                </label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={verticalLogoUrl}
                    onChange={(e) => setVerticalLogoUrl(e.target.value)}
                    placeholder="ទុកទំនេរដើម្បីប្រើឡូហ្គោបញ្ឈរស្តង់ដារ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.38rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                  {verticalLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setVerticalLogoUrl('')}
                      title="សម្អាត Link"
                      style={{
                        padding: '0 0.45rem',
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

              {/* Official Stamp Link Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#fda4af', marginBottom: '0.25rem' }}>
                  Link ត្រា (Stamp Google Drive / URL)
                </label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={stampUrl}
                    onChange={(e) => setStampUrl(e.target.value)}
                    placeholder="ទុកទំនេរដើម្បីប្រើត្រា BSIS ក្រហមស្វ័យប្រវត្តិ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.38rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                  {stampUrl && (
                    <button
                      type="button"
                      onClick={() => setStampUrl('')}
                      title="សម្អាត Link"
                      style={{
                        padding: '0 0.45rem',
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

              {/* Optional Signature Link Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.25rem' }}>
                  Link ហត្ថលេខា (ស្រេចចិត្ត)
                </label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={signatureUrl}
                    onChange={(e) => setSignatureUrl(e.target.value)}
                    placeholder="ទុកទំនេរដើម្បីប្រើហត្ថលេខាប៊ិកខៀវ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.38rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                  {signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setSignatureUrl('')}
                      title="សម្អាត Link"
                      style={{
                        padding: '0 0.45rem',
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

              {/* Signatory Name + Date + Month Title Override */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                    ឈ្មោះចុះហត្ថលេខា
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="សំរិត វឌ្ឍនៈ"
                    style={{
                      width: '100%',
                      padding: '0.38rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                    កាលបរិច្ឆេទ (ខ្មែរ)
                  </label>
                  <input
                    type="text"
                    value={khmerIssueDate}
                    onChange={(e) => setKhmerIssueDate(e.target.value)}
                    placeholder="ថ្ងៃទី២៤ ខែវិច្ឆិកា ឆ្នាំ២០២៦"
                    style={{
                      width: '100%',
                      padding: '0.38rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Controls inside Link Panel: Custom Month Override, Toggles & Persistent Save Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                paddingTop: '0.2rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.14)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>ឈ្មោះខែបន្ថែម៖</span>
                  <input
                    type="text"
                    value={customMonthTitle}
                    onChange={(e) => setCustomMonthTitle(e.target.value)}
                    placeholder="ស្វ័យប្រវត្តិ (ឧ. កក្កដា)"
                    style={{
                      width: '145px',
                      padding: '0.28rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.76rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeUnscored}
                    onChange={(e) => setIncludeUnscored(e.target.checked)}
                  />
                  <span>រាប់បញ្ចូលសិស្សទាំងអស់ក្នុងថ្នាក់</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showStampAndSignature}
                    onChange={(e) => setShowStampAndSignature(e.target.checked)}
                  />
                  <span>បង្ហាញត្រា &amp; ហត្ថលេខា</span>
                </label>
              </div>

              {onSaveBrandingSettings && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {saveFeedback && (
                    <span style={{ fontSize: '0.76rem', color: '#6ee7b7', fontWeight: 600 }}>
                      {saveFeedback}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    style={{
                      padding: '0.34rem 0.78rem',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSavingBranding ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <AppIcon name="check" size={14} strokeWidth={2.5} />
                    <span>{isSavingBranding ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក Link & ពណ៌ទុកប្រើប្រាស់'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* A4 Portrait Preview Canvas */}
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
                    showStampAndSignature={showStampAndSignature}
                    schoolProfile={schoolProfile}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
