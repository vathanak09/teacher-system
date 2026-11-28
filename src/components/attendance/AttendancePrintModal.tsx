"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ENGLISH_MONTH_NAMES,
  KHMER_MONTH_NAMES,
} from '@/utils/cambodiaHolidays';
import PrintableAttendanceSheet, {
  AUTO_COMBINED_MAX_STUDENTS,
  AttendancePrintLayoutMode,
  PrintableClassPacket,
  getAttendanceSheetSpec,
} from './PrintableAttendanceSheet';
import { AppIcon } from '../AppIcons';
import PrintStyleSidebar, { usePrintSidebarFocus } from '@/components/print/PrintStyleSidebar';
import PrintInteractiveSheet, {
  PrintSelectedArea,
  PrintTableOverrideStyles,
} from '@/components/print/PrintInteractiveSheet';
import {
  usePrintDocumentStyle,
  useTableSelection,
} from '@/components/print/printStylePresets';

export interface AttendancePrintModalProps {
  isOpen: boolean;
  classes: any[];
  students: any[];
  initialClassId?: string | null;
  initialMonth: number; // 1..12
  initialYear: number;
  onClose: () => void;
}

type StudentSortMode = 'level_name' | 'name_asc' | 'female_first' | 'student_id';

function getClassMemberIds(cls: any): string[] {
  if (!cls) return [];
  if (Array.isArray(cls.studentIds)) return cls.studentIds;
  if (Array.isArray(cls.studentsData)) return cls.studentsData.map((s: any) => s.id);
  return [];
}

function resolveActiveClassStudents(cls: any, allStudents: any[]): any[] {
  if (!cls) return [];
  const memberIds = new Set(getClassMemberIds(cls));
  const clsName = String(cls.className || '').trim();
  const clsCode = String(cls.classCode || '').trim();
  return allStudents.filter((s) => {
    if (!s || s.status === 'ឈប់រៀន') return false;
    if (memberIds.has(s.id)) return true;
    const sCls = String(s.className || '').trim();
    return Boolean(sCls && (sCls === clsName || (clsCode && sCls === clsCode)));
  });
}

function sortStudentsForSheet(list: any[], mode: StudentSortMode): any[] {
  return [...list].sort((a, b) => {
    if (mode === 'student_id') {
      return String(a.studentId || '').localeCompare(String(b.studentId || ''), 'en', {
        numeric: true,
      });
    }
    if (mode === 'name_asc') {
      return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'km');
    }
    if (mode === 'female_first') {
      if (a.gender === 'ស្រី' && b.gender !== 'ស្រី') return -1;
      if (a.gender !== 'ស្រី' && b.gender === 'ស្រី') return 1;
      return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'km');
    }
    // Default: level_name (matches reference sheet: K0 grouped first, then K1, alphabetical within level)
    const lvlCmp = String(a.level || 'ZZZ').localeCompare(String(b.level || 'ZZZ'), 'en', {
      numeric: true,
    });
    if (lvlCmp !== 0) return lvlCmp;
    return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'km');
  });
}

function parseExtraDaysInput(raw: string): number[] {
  if (!raw.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31)
    )
  ).sort((a, b) => a - b);
}

export default function AttendancePrintModal({
  isOpen,
  classes,
  students,
  initialClassId,
  initialMonth,
  initialYear,
  onClose,
}: AttendancePrintModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState<number>(initialMonth);
  const [year, setYear] = useState<number>(initialYear);
  const [layoutMode, setLayoutMode] = useState<AttendancePrintLayoutMode>('auto_a4_portrait');
  const [sortMode, setSortMode] = useState<StudentSortMode>('level_name');
  const [showPart1, setShowPart1] = useState<boolean>(true);
  const [showPart2, setShowPart2] = useState<boolean>(true);
  const [highlightWeekends, setHighlightWeekends] = useState<boolean>(true);
  const [highlightHolidays, setHighlightHolidays] = useState<boolean>(true);
  const [zebraRows, setZebraRows] = useState<boolean>(true);
  const [fillPageWithBlankRows, setFillPageWithBlankRows] = useState<boolean>(true);
  const [extraHolidayInput, setExtraHolidayInput] = useState<string>('');
  const [extraBlankRows, setExtraBlankRows] = useState<number>(2);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const printStyle = usePrintDocumentStyle('attendance', isOpen);
  const tableSelection = useTableSelection(isOpen);
  const { focusRequest, requestFocus } = usePrintSidebarFocus();

  const handleAreaSelected = useCallback(
    (area: PrintSelectedArea) => {
      setIsSidebarOpen(true);
      if (area.kind === 'table') {
        requestFocus('table', 'table-cell');
      } else if (area.kind === 'section') {
        requestFocus('doc', area.sectionId || 'layout');
      } else if (area.kind === 'heading') {
        requestFocus('typography', 'font-size');
      } else {
        requestFocus('typography', 'font-family');
      }
    },
    [requestFocus]
  );

  const getDocOptions = () => ({
    layoutMode,
    sortMode,
    showPart1,
    showPart2,
    highlightWeekends,
    highlightHolidays,
    zebraRows,
    fillPageWithBlankRows,
    extraHolidayInput,
    extraBlankRows,
  });

  const applyDocOptions = (opts: Record<string, any>) => {
    if (opts.layoutMode) setLayoutMode(opts.layoutMode as AttendancePrintLayoutMode);
    if (opts.sortMode) setSortMode(opts.sortMode as StudentSortMode);
    if (typeof opts.showPart1 === 'boolean') setShowPart1(opts.showPart1);
    if (typeof opts.showPart2 === 'boolean') setShowPart2(opts.showPart2);
    if (typeof opts.highlightWeekends === 'boolean') setHighlightWeekends(opts.highlightWeekends);
    if (typeof opts.highlightHolidays === 'boolean') setHighlightHolidays(opts.highlightHolidays);
    if (typeof opts.zebraRows === 'boolean') setZebraRows(opts.zebraRows);
    if (typeof opts.fillPageWithBlankRows === 'boolean') setFillPageWithBlankRows(opts.fillPageWithBlankRows);
    if (typeof opts.extraHolidayInput === 'string') setExtraHolidayInput(opts.extraHolidayInput);
    if (typeof opts.extraBlankRows === 'number') setExtraBlankRows(opts.extraBlankRows);
  };

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) =>
      String(a.classCode || a.className || '').localeCompare(
        String(b.classCode || b.className || ''),
        'en',
        { numeric: true }
      )
    );
  }, [classes]);

  // Initialize selections whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setMonth(initialMonth);
    setYear(initialYear);
    setIsClassMenuOpen(false);
    setClassSearch('');
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassIds([initialClassId]);
    } else if (sortedClasses.length > 0) {
      setSelectedClassIds([sortedClasses[0].id]);
    } else {
      setSelectedClassIds([]);
    }
  }, [isOpen, initialClassId, initialMonth, initialYear, classes, sortedClasses]);

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

  const sheetSpec = useMemo(() => getAttendanceSheetSpec(layoutMode), [layoutMode]);

  // Responsive preview scaling (accounts for Left Sidebar width on desktop)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const sideOffset = isSidebarOpen && window.innerWidth >= 960 ? 396 : 56;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      setPreviewScale(Math.min(1, availW / sheetSpec.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, sheetSpec.sheetWPx, isSidebarOpen]);

  // Inject dynamic @page orientation rule while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = sheetSpec.pageCss;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen, sheetSpec.pageCss]);

  const extraHolidayDays = useMemo(
    () => parseExtraDaysInput(extraHolidayInput),
    [extraHolidayInput]
  );

  // Build selected class packets
  const classPackets: PrintableClassPacket[] = useMemo(() => {
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses
      .filter((c) => selectedSet.has(c.id))
      .map((cls, idx) => ({
        classObj: cls,
        students: sortStudentsForSheet(resolveActiveClassStudents(cls, students), sortMode),
        classIndex: idx,
      }));
  }, [sortedClasses, selectedClassIds, students, sortMode]);

  // Flatten into individual A4 pages so every page has exact scaling & clean Chrome page breaks
  const renderedPages = useMemo(() => {
    const list: {
      key: string;
      label: string;
      packet: PrintableClassPacket;
      renderPart: 'combined' | 'part1_only' | 'part2_only';
    }[] = [];

    classPackets.forEach((packet) => {
      const roomCode = String(
        packet.classObj?.classCode || packet.classObj?.className || 'Class'
      ).trim();

      const shouldCombine =
        showPart1 &&
        showPart2 &&
        (layoutMode === 'combined_a4_portrait' ||
          (layoutMode === 'auto_a4_portrait' &&
            packet.students.length <= AUTO_COMBINED_MAX_STUDENTS));

      if (shouldCombine) {
        list.push({
          key: `${packet.classObj.id}-combined`,
          label: `ថ្នាក់ ${roomCode} (${packet.students.length} នាក់ • រួមគ្នា ១ ទំព័រ៖ វត្តមាន + ពិន្ទុ)`,
          packet,
          renderPart: 'combined',
        });
      } else {
        if (showPart1) {
          list.push({
            key: `${packet.classObj.id}-p1`,
            label: `ថ្នាក់ ${roomCode} (${packet.students.length} នាក់ • ទំព័រទី១៖ បញ្ជីវត្តមាន)`,
            packet,
            renderPart: 'part1_only',
          });
        }
        if (showPart2) {
          list.push({
            key: `${packet.classObj.id}-p2`,
            label: `ថ្នាក់ ${roomCode} (${packet.students.length} នាក់ • ទំព័រទី២៖ បញ្ជីពិន្ទុ)`,
            packet,
            renderPart: 'part2_only',
          });
        }
      }
    });

    return list;
  }, [classPackets, layoutMode, showPart1, showPart2]);

  const handlePrint = () => {
    if (typeof window === 'undefined' || renderedPages.length === 0) return;

    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = sheetSpec.pageCss;

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

  const yearOptions = [2025, 2026, 2027, 2028, 2029];
  const classButtonLabel =
    selectedClassIds.length === 0
      ? 'ជ្រើសរើសថ្នាក់រៀន...'
      : selectedClassIds.length === sortedClasses.length
        ? `គ្រប់ថ្នាក់ទាំងអស់ (${sortedClasses.length} ថ្នាក់)`
        : selectedClassIds.length === 1
          ? (() => {
              const found = sortedClasses.find((c) => c.id === selectedClassIds[0]);
              return found
                ? `ថ្នាក់ ${found.classCode || found.className}`
                : '1 ថ្នាក់';
            })()
          : `បានជ្រើស ${selectedClassIds.length} ថ្នាក់`;

  return createPortal(
    <div
      id="payment-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.92)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Toolbar (Hidden when printing) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #16a34a, #2563eb)',
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
                Print បញ្ជីវត្តមាន &amp; បញ្ជីពិន្ទុតាមថ្នាក់រៀន (A4)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                បានជ្រើស <strong style={{ color: '#f8fafc' }}>{classPackets.length}</strong> ថ្នាក់ •{' '}
                <strong style={{ color: '#fbbf24' }}>{renderedPages.length}</strong> ទំព័រ A4 (
                {sheetSpec.isLandscape ? 'ផ្ដេក Landscape' : 'បញ្ឈរ Portrait'}) • ខែ{' '}
                <strong style={{ color: '#86efac' }}>
                  {KHMER_MONTH_NAMES[month - 1]} ({ENGLISH_MONTH_NAMES[month - 1]}) {year}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {/* Multi-Class Selector Popover */}
            <div ref={classMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.38rem 0.68rem',
                  borderRadius: '8px',
                  border: `1px solid ${isClassMenuOpen ? '#38bdf8' : '#475569'}`,
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '0.79rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="layers" size={14} style={{ color: '#38bdf8' }} />
                <span>{classButtonLabel}</span>
                <AppIcon name="chevron-down" size={14} style={{ color: '#94a3b8' }} />
              </button>

              {isClassMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '360px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.55)',
                    zIndex: 100005,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem',
                      borderBottom: '1px solid #1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <input
                      type="text"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      placeholder="ស្វែងរកលេខបន្ទប់ ឈ្មោះថ្នាក់ ឬគ្រូ..."
                      style={{
                        width: '100%',
                        padding: '0.32rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.78rem',
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds(sortedClasses.map((c) => c.id))}
                        style={{
                          flex: 1,
                          padding: '0.24rem 0.45rem',
                          borderRadius: '5px',
                          border: '1px solid #2563eb',
                          background: 'rgba(37, 99, 235, 0.2)',
                          color: '#93c5fd',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ជ្រើសទាំងអស់ ({sortedClasses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds([])}
                        style={{
                          flex: 1,
                          padding: '0.24rem 0.45rem',
                          borderRadius: '5px',
                          border: '1px solid #475569',
                          background: '#1e293b',
                          color: '#cbd5e1',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ដកការជ្រើស
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowY: 'auto', padding: '0.35rem' }}>
                    {filteredClassOptions.map((cls) => {
                      const checked = selectedClassIds.includes(cls.id);
                      const count = resolveActiveClassStudents(cls, students).length;
                      const code = cls.classCode || cls.className || 'គ្មានកូដ';
                      return (
                        <label
                          key={cls.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            padding: '0.38rem 0.5rem',
                            borderRadius: '6px',
                            background: checked ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleClassId(cls.id)}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {code}
                                {cls.className && cls.className !== code ? ` — ${cls.className}` : ''}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {cls.teacherName || 'គ្មានគ្រូ'} • {cls.shift || '-'}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#86efac',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {count} នាក់
                          </span>
                        </label>
                      );
                    })}
                    {filteredClassOptions.length === 0 && (
                      <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8' }}>
                        រកមិនឃើញថ្នាក់រៀនទេ
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Month & Year quick pickers */}
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{
                padding: '0.38rem 0.52rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {KHMER_MONTH_NAMES.map((kh, idx) => (
                <option key={kh} value={idx + 1}>
                  ខែ{kh} ({ENGLISH_MONTH_NAMES[idx]})
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{
                padding: '0.38rem 0.52rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  ឆ្នាំ {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.42rem 0.72rem',
                borderRadius: '8px',
                border: `1px solid ${isSidebarOpen ? '#38bdf8' : '#475569'}`,
                background: isSidebarOpen ? 'rgba(56, 189, 248, 0.16)' : '#1e293b',
                color: isSidebarOpen ? '#7dd3fc' : '#e2e8f0',
                fontWeight: 700,
                fontSize: '0.79rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="sliders" size={14} />
              <span>{isSidebarOpen ? 'លាក់ការកំណត់' : 'ការកំណត់ & Font'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={renderedPages.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background:
                  renderedPages.length === 0
                    ? '#475569'
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: renderedPages.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow:
                  renderedPages.length === 0 ? 'none' : '0 2px 10px rgba(37,99,235,0.4)',
              }}
            >
              <AppIcon name="printer" size={15} style={{ color: '#ffffff' }} />
              <span>Print A4 ({renderedPages.length} ទំព័រ)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#e2e8f0',
                fontWeight: 700,
                fontSize: '0.81rem',
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
        scopeId="attendance-print"
        styleConfig={printStyle.styleConfig}
        tableSelection={tableSelection}
      />
      <div className="print-workspace-body">
        {isSidebarOpen && (
          <PrintStyleSidebar
            title="ការកំណត់បញ្ជីវត្តមាន"
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
            {/* Layout & Sorting Card */}
            <div
              data-sidebar-section="layout"
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
                ទម្រង់ក្រដាស A4 &amp; ការតម្រៀបសិស្ស
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem', fontWeight: 600 }}>
                  របៀបដាក់ទំព័រ A4
                </label>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as AttendancePrintLayoutMode)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '7px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fbbf24',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="auto_a4_portrait">
                    A4 បញ្ឈរ (ស្វ័យប្រវត្តិ ≤{AUTO_COMBINED_MAX_STUDENTS} នាក់ រួម ១ ទំព័រ)
                  </option>
                  <option value="combined_a4_portrait">A4 បញ្ឈរ (រួម Part 1 + Part 2 ក្នុង ១ ទំព័រ)</option>
                  <option value="split_a4_portrait">A4 បញ្ឈរ (ញែក ២ ទំព័រ៖ វត្តមាន / ពិន្ទុ)</option>
                  <option value="split_a4_landscape">A4 ផ្ដេក (ធំទូលាយ៖ វត្តមាន / ពិន្ទុ)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem', fontWeight: 600 }}>
                  ការតម្រៀបសិស្ស
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as StudentSortMode)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '7px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="level_name">វគ្គ (Level) + ឈ្មោះ</option>
                  <option value="name_asc">ឈ្មោះ (ក - អ)</option>
                  <option value="female_first">ស្រីមុន + ឈ្មោះ</option>
                  <option value="student_id">អត្តលេខ (ID)</option>
                </select>
              </div>
            </div>

            {/* Sections & Highlights Card */}
            <div
              data-sidebar-section="sections"
              style={{
                background: 'rgba(30, 41, 59, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '0.62rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                fontSize: '0.76rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                ផ្នែកបង្ហាញ &amp; ពណ៌ថ្ងៃឈប់សម្រាក
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPart1} onChange={(e) => setShowPart1(e.target.checked)} />
                <span>ផ្នែកទី១ (បញ្ជីវត្តមាន)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPart2} onChange={(e) => setShowPart2(e.target.checked)} />
                <span>ផ្នែកទី២ (បញ្ជីពិន្ទុ)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#86efac', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={highlightWeekends}
                  onChange={(e) => setHighlightWeekends(e.target.checked)}
                  style={{ accentColor: '#22c55e' }}
                />
                <span>Highlight សៅរ៍-អាទិត្យ</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={highlightHolidays}
                  onChange={(e) => setHighlightHolidays(e.target.checked)}
                  style={{ accentColor: '#ef4444' }}
                />
                <span>Highlight បុណ្យជាតិកម្ពុជា</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input type="checkbox" checked={zebraRows} onChange={(e) => setZebraRows(e.target.checked)} />
                <span>ឆ្នូតជួរដេកឆ្លាស់ពណ៌</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fillPageWithBlankRows}
                  onChange={(e) => setFillPageWithBlankRows(e.target.checked)}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span>បំពេញជួរទទេពេញទំព័រ</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', paddingTop: '0.3rem', borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#94a3b8', marginBottom: '0.18rem' }}>
                    ជួរទទេអប្បបរមា
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={extraBlankRows}
                    onChange={(e) =>
                      setExtraBlankRows(Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)))
                    }
                    style={{
                      width: '100%',
                      padding: '0.28rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#f8fafc',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#94a3b8', marginBottom: '0.18rem' }}>
                    បន្ថែមថ្ងៃឈប់ (ថ្ងៃទី)
                  </label>
                  <input
                    type="text"
                    value={extraHolidayInput}
                    onChange={(e) => setExtraHolidayInput(e.target.value)}
                    placeholder="ឧ. 10, 15"
                    style={{
                      width: '100%',
                      padding: '0.28rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                    }}
                  />
                </div>
              </div>
            </div>
          </PrintStyleSidebar>
        )}

      {/* Live Preview & Print Sheets */}
      <div className="print-preview-stage">
      <div
        className="receipt-a4-sheets-container"
        style={{
          padding: '1.25rem 0 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          width: '100%',
        }}
      >
        {renderedPages.length === 0 ? (
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
              សូមជ្រើសរើសថ្នាក់រៀន និងផ្នែកដែលចង់ Print
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              ចុចប៊ូតុងជ្រើសថ្នាក់រៀនខាងលើ ដើម្បីបង្ហាញបញ្ជីវត្តមាន និងបញ្ជីពិន្ទុសម្រាប់ Print លើក្រដាស A4។
            </div>
          </div>
        ) : (
          renderedPages.map((pg, pageIdx) => (
            <div
              key={pg.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Screen-only page label */}
              <div
                className="no-print"
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: '0.35rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                ទំព័រទី {pageIdx + 1} / {renderedPages.length} — {pg.label}
              </div>

              <div
                className="receipt-a4-page-wrapper"
                style={{
                  width: `${sheetSpec.sheetWPx * previewScale}px`,
                  height: `${sheetSpec.sheetHPx * previewScale}px`,
                  position: 'relative',
                }}
              >
                <div
                  className="receipt-a4-preview-scale"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: sheetSpec.sheetW,
                    height: sheetSpec.sheetH,
                  }}
                >
                  <PrintInteractiveSheet
                    scopeId="attendance-print"
                    pageIdx={pageIdx}
                    styleConfig={printStyle.styleConfig}
                    tableSelection={tableSelection}
                    onCellSelected={() => setIsSidebarOpen(true)}
                    onAreaSelected={handleAreaSelected}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <PrintableAttendanceSheet
                      packet={pg.packet}
                      month={month}
                      year={year}
                      layoutMode={layoutMode}
                      renderPart={pg.renderPart}
                      showPart1={showPart1}
                      showPart2={showPart2}
                      highlightWeekends={highlightWeekends}
                      highlightHolidays={highlightHolidays}
                      zebraRows={zebraRows}
                      fillPageWithBlankRows={fillPageWithBlankRows}
                      extraHolidayDays={extraHolidayDays}
                      extraBlankRows={extraBlankRows}
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
