"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '@/components/AppIcons';
import PrintStyleSidebar from '@/components/print/PrintStyleSidebar';
import {
  buildPrintScopeProps,
  usePrintDocumentStyle,
} from '@/components/print/printStylePresets';
import {
  MonthlyResultClassPacket,
  computeMonthlyResultPacketsForClass,
} from './MonthlyResultSheet';
import HonorRollSheet, {
  HONOR_ROLL_A4_SPEC,
  HonorRollStudentSlot,
  formatHonorEnglishDate,
  formatHonorKhmerDate,
  getMonthLabelsFromYM,
} from './HonorRollSheet';

export interface HonorRollPrintModalProps {
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
  initialClassId?: string | null;
}

type HonorGroupingMode = 'per_class' | 'combined_all';

interface ManualSlotOverride {
  studentUid?: string;
  customName?: string;
  customPhotoUrl?: string;
}

function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HonorRollPrintModal({
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
  initialClassId,
}: HonorRollPrintModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [groupingMode, setGroupingMode] = useState<HonorGroupingMode>('per_class');
  const [splitBehavior, setSplitBehavior] = useState<'auto' | 'always' | 'never'>('auto');
  const [topCount, setTopCount] = useState<3 | 5>(5);

  // Editable Official Titles matching E:\តារាងកិត្តិយស BSIS copy.ai
  const defaultMonthLabels = useMemo(
    () => getMonthLabelsFromYM(selectedMonth),
    [selectedMonth]
  );
  const [titleKhmer, setTitleKhmer] = useState<string>(
    `តារាងកិត្តិយស ប្រចាំខែ ${defaultMonthLabels.khmerMonth}`
  );
  const [titleEnglish, setTitleEnglish] = useState<string>(
    `Honor Roll Chart of ${defaultMonthLabels.englishMonth}`
  );
  const [congratsKhmer, setCongratsKhmer] = useState<string>(
    'អបអរសាទរសិស្សជ័យលាភី ថ្នាក់ភាសាអង់គ្លេស'
  );
  const [congratsEnglish, setCongratsEnglish] = useState<string>(
    'Congratulations to Outstanding students for English class'
  );

  // Footer Dates & Principal
  const [issueDateIso, setIssueDateIso] = useState<string>(() => getTodayIso());
  const [footerDateKhmer, setFooterDateKhmer] = useState<string>(() =>
    formatHonorKhmerDate(new Date())
  );
  const [footerDateEnglish, setFooterDateEnglish] = useState<string>(() =>
    formatHonorEnglishDate(new Date())
  );
  const [principalTitleKh, setPrincipalTitleKh] = useState<string>('នាយក');
  const [signatoryName, setSignatoryName] = useState<string>(
    scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ'
  );

  // Visual Options
  const [bannerLogoUrl, setBannerLogoUrl] = useState<string>('');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string>('');
  const [showWatermarkPattern, setShowWatermarkPattern] = useState<boolean>(true);
  const [showCenterWatermarkLogo, setShowCenterWatermarkLogo] = useState<boolean>(true);
  const [showStampAndSignature, setShowStampAndSignature] = useState<boolean>(false);
  const [showScoreUnderName, setShowScoreUnderName] = useState<boolean>(false);
  const [showEnglishName, setShowEnglishName] = useState<boolean>(false);
  const [showClassTag, setShowClassTag] = useState<boolean>(false);
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain'>('cover');
  const [photoBorderColor, setPhotoBorderColor] = useState<string>('#111827');

  // Optional Manual Slot Overrides for Page 1 / Active Page (Rank 1..5)
  const [slotOverrides, setSlotOverrides] = useState<Record<number, ManualSlotOverride>>({});
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState<boolean>(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [previewScale, setPreviewScale] = useState<number>(1);

  const printStyle = usePrintDocumentStyle('honor_roll', isOpen);
  const printScopeProps = useMemo(
    () => buildPrintScopeProps(printStyle.styleConfig),
    [printStyle.styleConfig]
  );

  // Keep month titles auto-synced when selectedMonth changes
  useEffect(() => {
    const labels = getMonthLabelsFromYM(selectedMonth);
    setTitleKhmer(`តារាងកិត្តិយស ប្រចាំខែ ${labels.khmerMonth}`);
    setTitleEnglish(`Honor Roll Chart of ${labels.englishMonth}`);
  }, [selectedMonth]);

  useEffect(() => {
    if (!isOpen) return;
    setSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');
    setSlotOverrides({});
  }, [isOpen, scoreSettings?.resultSignatoryName]);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) =>
      String(a?.classCode || a?.className || '').localeCompare(
        String(b?.classCode || b?.className || ''),
        'en',
        { numeric: true }
      )
    );
  }, [classes]);

  const scoreCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    allScores.forEach((s: any) => {
      if (s?.month !== selectedMonth) return;
      const cid = String(s?.classId || '').trim();
      if (!cid) return;
      const hasVal =
        s?.totalScore !== '' &&
        s?.totalScore !== undefined &&
        s?.totalScore !== null &&
        !Number.isNaN(Number(s?.totalScore));
      if (hasVal) map.set(cid, (map.get(cid) || 0) + 1);
    });
    return map;
  }, [allScores, selectedMonth]);

  // Default class selection when opening modal
  useEffect(() => {
    if (!isOpen) return;
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassIds([initialClassId]);
      return;
    }
    const withScores = sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0);
    if (withScores.length > 0) {
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

  // Responsive preview zoom accounting for Left Sidebar
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const sideOffset = isSidebarOpen && window.innerWidth >= 960 ? 396 : 48;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      setPreviewScale(Math.min(1, availW / HONOR_ROLL_A4_SPEC.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, isSidebarOpen]);

  // Inject @page A4 Portrait rule while open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = HONOR_ROLL_A4_SPEC.pageCss;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen]);

  // Compute ranked score packets for selected classes
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
            sortMode: 'rank_asc',
            includeUnscored: false,
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
    splitBehavior,
  ]);

  // Candidate pool for manual slot override dropdowns
  const candidatePool = useMemo(() => {
    const list: {
      uid: string;
      fullName: string;
      englishName?: string;
      photo?: string;
      average: number;
      averageDisplay: string;
      grade: string;
      classCode: string;
      level: string;
      rank: number | null;
    }[] = [];

    classPackets.forEach((pkt) => {
      pkt.rows.forEach((r) => {
        if (r.average === null) return;
        list.push({
          uid: `${pkt.packetKey}__${r.rowKey}`,
          fullName: r.fullName,
          englishName: r.englishName,
          photo: r.photo,
          average: r.average,
          averageDisplay: r.averageDisplay,
          grade: r.grade,
          classCode: pkt.classCode || pkt.className,
          level: r.level || pkt.splitLevelLabel || '',
          rank: r.rank,
        });
      });
    });

    return list.sort((a, b) => b.average - a.average);
  }, [classPackets]);

  // Build printable Honor Roll pages (1 A4 page per class/level OR 1 combined Top 5 page)
  const renderedPages = useMemo(() => {
    const applyManualSlotOverrides = (
      baseSlots: (HonorRollStudentSlot | null)[],
      isFirstPage: boolean
    ): (HonorRollStudentSlot | null)[] => {
      if (!isFirstPage || Object.keys(slotOverrides).length === 0) return baseSlots;
      return ([1, 2, 3, 4, 5] as const).map((rankNum, i) => {
        const ov = slotOverrides[rankNum];
        let base = baseSlots[i] || null;
        if (ov?.studentUid) {
          if (ov.studentUid === '__empty__') {
            base = null;
          } else {
            const found = candidatePool.find((c) => c.uid === ov.studentUid);
            if (found) {
              base = {
                rank: rankNum,
                studentId: found.uid,
                fullName: found.fullName,
                englishName: found.englishName,
                photo: found.photo,
                averageDisplay: found.averageDisplay,
                grade: found.grade,
                classCode: found.classCode,
                level: found.level,
              };
            }
          }
        }
        if (ov?.customName !== undefined && ov.customName.trim()) {
          base = {
            ...(base || { rank: rankNum, fullName: '' }),
            rank: rankNum,
            fullName: ov.customName.trim(),
          };
        }
        if (ov?.customPhotoUrl !== undefined && ov.customPhotoUrl.trim()) {
          base = {
            ...(base || { rank: rankNum, fullName: '' }),
            rank: rankNum,
            photo: ov.customPhotoUrl.trim(),
          };
        }
        return base;
      });
    };

    if (groupingMode === 'combined_all') {
      const topList = candidatePool.slice(0, 5);
      const baseSlots: (HonorRollStudentSlot | null)[] = ([1, 2, 3, 4, 5] as const).map(
        (rankNum, i) => {
          const item = topList[i];
          if (!item) return null;
          return {
            rank: rankNum,
            studentId: item.uid,
            fullName: item.fullName,
            englishName: item.englishName,
            photo: item.photo,
            averageDisplay: item.averageDisplay,
            grade: item.grade,
            classCode: item.classCode,
            level: item.level,
          };
        }
      );
      return [
        {
          key: 'honor-combined',
          label: `តារាងកិត្តិយសរួម (${selectedClassIds.length} ថ្នាក់ • Top ${topCount})`,
          slots: applyManualSlotOverrides(baseSlots, true),
          classMetaLabel:
            selectedClassIds.length === 1 && classPackets[0]
              ? classPackets[0].courseLabel || classPackets[0].classCode
              : `${selectedClassIds.length} ថ្នាក់រួម`,
          teacherMetaLabel:
            selectedClassIds.length === 1 && classPackets[0]
              ? classPackets[0].teacherName
              : '',
        },
      ];
    }

    if (classPackets.length === 0) {
      // Allow previewing blank Illustrator template even if no scores exist yet
      const blankSlots: (HonorRollStudentSlot | null)[] = applyManualSlotOverrides(
        [null, null, null, null, null],
        true
      );
      return [
        {
          key: 'honor-blank',
          label: 'គំរូតារាងកិត្តិយស (ទទេ)',
          slots: blankSlots,
          classMetaLabel: '',
          teacherMetaLabel: '',
        },
      ];
    }

    return classPackets.map((pkt, pktIdx) => {
      const rankedRows = pkt.rows.filter((r) => r.rank !== null).slice(0, 5);
      const baseSlots: (HonorRollStudentSlot | null)[] = ([1, 2, 3, 4, 5] as const).map(
        (rankNum, i) => {
          const r = rankedRows[i];
          if (!r) return null;
          return {
            rank: rankNum,
            studentId: r.studentId,
            fullName: r.fullName,
            englishName: r.englishName,
            photo: r.photo,
            averageDisplay: r.averageDisplay,
            grade: r.grade,
            classCode: pkt.classCode || pkt.className,
            level: r.level || pkt.splitLevelLabel || '',
          };
        }
      );

      const levelSuffix = pkt.splitLevelLabel ? ` • វគ្គ ${pkt.splitLevelLabel}` : '';
      return {
        key: `honor-${pkt.packetKey}`,
        label: `ថ្នាក់ ${pkt.classCode || pkt.className}${levelSuffix} (Top ${topCount})`,
        slots: applyManualSlotOverrides(baseSlots, pktIdx === 0),
        classMetaLabel: pkt.courseLabel || pkt.classCode || pkt.className,
        teacherMetaLabel: pkt.teacherName || '',
      };
    });
  }, [
    groupingMode,
    candidatePool,
    classPackets,
    selectedClassIds.length,
    topCount,
    slotOverrides,
  ]);

  const handlePrint = () => {
    if (typeof window === 'undefined' || renderedPages.length === 0) return;

    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = HONOR_ROLL_A4_SPEC.pageCss;

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
    }, 90);
  };

  const handleIssueDatePick = (iso: string) => {
    setIssueDateIso(iso);
    if (iso) {
      setFooterDateKhmer(formatHonorKhmerDate(iso));
      setFooterDateEnglish(formatHonorEnglishDate(iso));
    }
  };

  const handleUploadSlotPhoto = (rankNum: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        setSlotOverrides((prev) => ({
          ...prev,
          [rankNum]: { ...(prev[rankNum] || {}), customPhotoUrl: dataUrl },
        }));
      }
    };
    reader.readAsDataURL(file);
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

  const getDocOptions = () => ({
    groupingMode,
    splitBehavior,
    topCount,
    congratsKhmer,
    congratsEnglish,
    principalTitleKh,
    signatoryName,
    bannerLogoUrl,
    watermarkLogoUrl,
    showWatermarkPattern,
    showCenterWatermarkLogo,
    showStampAndSignature,
    showScoreUnderName,
    showEnglishName,
    showClassTag,
    photoFitMode,
    photoBorderColor,
  });

  const applyDocOptions = (opts: Record<string, any>) => {
    if (opts.groupingMode === 'per_class' || opts.groupingMode === 'combined_all') {
      setGroupingMode(opts.groupingMode);
    }
    if (opts.splitBehavior) setSplitBehavior(opts.splitBehavior);
    if (opts.topCount === 3 || opts.topCount === 5) setTopCount(opts.topCount);
    if (typeof opts.congratsKhmer === 'string') setCongratsKhmer(opts.congratsKhmer);
    if (typeof opts.congratsEnglish === 'string') setCongratsEnglish(opts.congratsEnglish);
    if (typeof opts.principalTitleKh === 'string') setPrincipalTitleKh(opts.principalTitleKh);
    if (typeof opts.signatoryName === 'string') setSignatoryName(opts.signatoryName);
    if (typeof opts.bannerLogoUrl === 'string') setBannerLogoUrl(opts.bannerLogoUrl);
    if (typeof opts.watermarkLogoUrl === 'string') setWatermarkLogoUrl(opts.watermarkLogoUrl);
    if (typeof opts.showWatermarkPattern === 'boolean') setShowWatermarkPattern(opts.showWatermarkPattern);
    if (typeof opts.showCenterWatermarkLogo === 'boolean') setShowCenterWatermarkLogo(opts.showCenterWatermarkLogo);
    if (typeof opts.showStampAndSignature === 'boolean') setShowStampAndSignature(opts.showStampAndSignature);
    if (typeof opts.showScoreUnderName === 'boolean') setShowScoreUnderName(opts.showScoreUnderName);
    if (typeof opts.showEnglishName === 'boolean') setShowEnglishName(opts.showEnglishName);
    if (typeof opts.showClassTag === 'boolean') setShowClassTag(opts.showClassTag);
    if (opts.photoFitMode === 'cover' || opts.photoFitMode === 'contain') {
      setPhotoFitMode(opts.photoFitMode);
    }
    if (typeof opts.photoBorderColor === 'string') setPhotoBorderColor(opts.photoBorderColor);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const classButtonLabel =
    selectedClassIds.length === 0
      ? 'ជ្រើសរើសថ្នាក់រៀន...'
      : selectedClassIds.length === sortedClasses.length && sortedClasses.length > 0
        ? `គ្រប់ថ្នាក់ទាំងអស់ (${sortedClasses.length})`
        : selectedClassIds.length === 1
          ? (() => {
              const found = sortedClasses.find((c) => c.id === selectedClassIds[0]);
              return found ? `ថ្នាក់ ${found.classCode || found.className}` : '1 ថ្នាក់';
            })()
          : `បានជ្រើស ${selectedClassIds.length} ថ្នាក់`;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    padding: '0.62rem 0.7rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.48rem',
  };

  const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.32rem 0.48rem',
    borderRadius: '6px',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: '0.75rem',
    outline: 'none',
  };

  return createPortal(
    <div
      id="payment-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Slim Top Toolbar (Hidden on Print) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#0f172a',
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
          padding: '0.62rem 1rem',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.55rem',
          }}
        >
          {/* Left: Title + Class Picker + Month Picker + Top 5/3 */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f8fafc', fontWeight: 800, fontSize: '0.94rem' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="award" size={16} strokeWidth={2.2} />
              </span>
              <span>តារាងកិត្តិយស (Honor Roll A4)</span>
            </div>

            {/* Multi-class Dropdown */}
            <div ref={classMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((v) => !v)}
                style={{
                  padding: '0.38rem 0.65rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: `1px solid ${isClassMenuOpen ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}`,
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minWidth: '160px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                  {classButtonLabel}
                </span>
                <AppIcon name="chevron-down" size={14} />
              </button>

              {isClassMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '310px',
                    maxHeight: '360px',
                    background: '#1e293b',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    borderRadius: '10px',
                    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
                    padding: '0.55rem',
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
                    style={fieldInputStyle}
                  />
                  <div style={{ display: 'flex', gap: '0.32rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds(sortedClasses.map((c) => c.id))}
                      style={{
                        flex: 1,
                        padding: '0.26rem 0.4rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                        fontSize: '0.73rem',
                        fontWeight: 700,
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
                        padding: '0.26rem 0.4rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.12)',
                        color: '#6ee7b7',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      មានពិន្ទុ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds([])}
                      style={{
                        padding: '0.26rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#fca5a5',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      លុប
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.22rem', maxHeight: '220px' }}>
                    {filteredClassOptions.map((c) => {
                      const checked = selectedClassIds.includes(c.id);
                      const cnt = scoreCountByClass.get(c.id) || 0;
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.32rem 0.48rem',
                            borderRadius: '6px',
                            background: checked ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
                            color: '#f1f5f9',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            gap: '0.4rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleClassId(c.id)}
                            />
                            <span style={{ fontWeight: 700 }}>{c.classCode || c.className}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.teacherName || ''}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.08rem 0.36rem',
                              borderRadius: '999px',
                              background: cnt > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.16)',
                              color: cnt > 0 ? '#6ee7b7' : '#94a3b8',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cnt} ពិន្ទុ
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
              value={selectedMonth.startsWith('FINAL_') ? '' : selectedMonth}
              onChange={(e) => {
                if (e.target.value) onMonthChange(e.target.value);
              }}
              style={{
                padding: '0.36rem 0.55rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />

            {/* Top 5 vs Top 3 Quick Pill */}
            <div
              style={{
                display: 'inline-flex',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '0.14rem',
                gap: '0.14rem',
              }}
            >
              {([5, 3] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setTopCount(cnt)}
                  style={{
                    padding: '0.26rem 0.56rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: topCount === cnt ? '#d97706' : 'transparent',
                    color: topCount === cnt ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  លេខ ១-{cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Right Actions: Sidebar Toggle, Print A4, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              style={{
                padding: '0.42rem 0.72rem',
                borderRadius: '8px',
                background: isSidebarOpen ? 'rgba(99, 102, 241, 0.25)' : '#1e293b',
                border: isSidebarOpen ? '1px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.35)',
                color: '#e0e7ff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
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
                padding: '0.44rem 0.92rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.38rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              }}
            >
              <AppIcon name="printer" size={15} />
              <span>ព្រីន A4 ({renderedPages.length})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.42rem 0.72rem',
                borderRadius: '8px',
                background: '#334155',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <AppIcon name="x" size={14} />
              <span>បិទ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Workspace: Left Settings Sidebar + Right Live A4 Preview */}
      <div className="print-workspace-body">
        {isSidebarOpen && (
          <PrintStyleSidebar
            title="ការកំណត់តារាងកិត្តិយស"
            styleConfig={printStyle.styleConfig}
            onChangeStyle={printStyle.setStyleConfig}
            onResetStyle={printStyle.resetStyleConfig}
            showTableSettings={false}
            presets={printStyle.presets}
            activePresetId={printStyle.activePresetId}
            isSavingPreset={printStyle.isSavingPreset}
            presetFeedback={printStyle.presetFeedback}
            onSaveNewPreset={(name) => printStyle.saveNewPreset(name, getDocOptions())}
            onUpdateActivePreset={() => printStyle.updateActivePreset(getDocOptions())}
            onDeletePreset={printStyle.deletePreset}
            onApplyPreset={(preset) => printStyle.applyPreset(preset, applyDocOptions)}
          >
            {/* Grouping & Ranking Scope */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>
                របៀបជ្រើសសិស្សពូកែ
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.18rem' }}>
                  ទម្រង់ទំព័រតាមថ្នាក់
                </label>
                <select
                  value={groupingMode}
                  onChange={(e) => setGroupingMode(e.target.value as HonorGroupingMode)}
                  style={fieldInputStyle}
                >
                  <option value="per_class">តាមថ្នាក់នីមួយៗ (១ ថ្នាក់ = ១ ទំព័រ A4)</option>
                  <option value="combined_all">ប្រកួតរួមគ្រប់ថ្នាក់ដែលជ្រើស (Top 5 រួម)</option>
                </select>
              </div>

              {groupingMode === 'per_class' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.18rem' }}>
                    ការបំបែកតាមវគ្គ (Level)
                  </label>
                  <select
                    value={splitBehavior}
                    onChange={(e) => setSplitBehavior(e.target.value as 'auto' | 'always' | 'never')}
                    style={fieldInputStyle}
                  >
                    <option value="auto">តាមការកំណត់ថ្នាក់</option>
                    <option value="always">បំបែកតាមវគ្គនីមួយៗ</option>
                    <option value="never">រួមទាំងថ្នាក់</option>
                  </select>
                </div>
              )}

              {/* Toggle Manual Student/Photo Customizer for Top 1-5 */}
              <button
                type="button"
                onClick={() => setIsSlotEditorOpen((v) => !v)}
                style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: '7px',
                  border: `1px solid ${isSlotEditorOpen ? '#38bdf8' : 'rgba(148,163,184,0.35)'}`,
                  background: isSlotEditorOpen ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
                  color: isSlotEditorOpen ? '#bae6fd' : '#e2e8f0',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>ប្ដូរសិស្ស / Upload រូបថតផ្ទាល់ (#1 - #{topCount})</span>
                <AppIcon name="chevron-down" size={13} />
              </button>

              {isSlotEditorOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem', paddingTop: '0.2rem' }}>
                  {([1, 2, 3, 4, 5] as const).slice(0, topCount).map((rankNum) => {
                    const ov = slotOverrides[rankNum] || {};
                    return (
                      <div
                        key={rankNum}
                        style={{
                          background: '#0f172a',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '7px',
                          padding: '0.42rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.28rem',
                        }}
                      >
                        <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#fbbf24' }}>
                          ចំណាត់ថ្នាក់លេខ {rankNum} ({rankNum === 1 ? '1st' : rankNum === 2 ? '2nd' : rankNum === 3 ? '3rd' : `${rankNum}th`})
                        </div>
                        <select
                          value={ov.studentUid || ''}
                          onChange={(e) =>
                            setSlotOverrides((prev) => ({
                              ...prev,
                              [rankNum]: { ...(prev[rankNum] || {}), studentUid: e.target.value || undefined },
                            }))
                          }
                          style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                        >
                          <option value="">ស្វ័យប្រវត្តិ (តាមលំដាប់ពិន្ទុ)</option>
                          <option value="__empty__">ទុកប្រអប់ទទេ</option>
                          {candidatePool.map((c) => (
                            <option key={c.uid} value={c.uid}>
                              {c.fullName} ({c.classCode} • {c.averageDisplay})
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <input
                            type="text"
                            value={ov.customName || ''}
                            onChange={(e) =>
                              setSlotOverrides((prev) => ({
                                ...prev,
                                [rankNum]: { ...(prev[rankNum] || {}), customName: e.target.value },
                              }))
                            }
                            placeholder="កែឈ្មោះបង្ហាញ..."
                            style={{ ...fieldInputStyle, flex: 1, fontSize: '0.71rem' }}
                          />
                          <label
                            style={{
                              padding: '0.25rem 0.48rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(56, 189, 248, 0.45)',
                              background: 'rgba(56, 189, 248, 0.14)',
                              color: '#bae6fd',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            រូបថត
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleUploadSlotPhoto(rankNum, e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(slotOverrides).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSlotOverrides({})}
                      style={{
                        padding: '0.26rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#fca5a5',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      សម្អាតការកែសិស្សដោយដៃ
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Editable Titles & Congratulations Lines */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                ខ្លឹមសារចំណងជើង
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  ចំណងជើងខ្មែរ
                </label>
                <input
                  type="text"
                  value={titleKhmer}
                  onChange={(e) => setTitleKhmer(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  English Title
                </label>
                <input
                  type="text"
                  value={titleEnglish}
                  onChange={(e) => setTitleEnglish(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  បន្ទាត់អបអរសាទរ (ខ្មែរ)
                </label>
                <input
                  type="text"
                  value={congratsKhmer}
                  onChange={(e) => setCongratsKhmer(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  Congratulations Line (English)
                </label>
                <input
                  type="text"
                  value={congratsEnglish}
                  onChange={(e) => setCongratsEnglish(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
            </div>

            {/* Footer Dates & Principal */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7b7' }}>
                កាលបរិច្ឆេទ &amp; ជើងទំព័រ
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  ជ្រើសថ្ងៃចេញតារាង (បំពេញខ្មែរ+អង់គ្លេសស្វ័យប្រវត្តិ)
                </label>
                <input
                  type="date"
                  value={issueDateIso}
                  onChange={(e) => handleIssueDatePick(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  កាលបរិច្ឆេទ (ខ្មែរ)
                </label>
                <input
                  type="text"
                  value={footerDateKhmer}
                  onChange={(e) => setFooterDateKhmer(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  Date (English)
                </label>
                <input
                  type="text"
                  value={footerDateEnglish}
                  onChange={(e) => setFooterDateEnglish(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    តួនាទីជើងទំព័រ
                  </label>
                  <input
                    type="text"
                    value={principalTitleKh}
                    onChange={(e) => setPrincipalTitleKh(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    ឈ្មោះចុះហត្ថលេខា
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Display Toggles & Branding Links */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c4b5fd' }}>
                ជម្រើសបង្ហាញ &amp; រូបភាព
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showWatermarkPattern}
                  onChange={(e) => setShowWatermarkPattern(e.target.checked)}
                />
                <span>ផ្ទៃ Watermark អក្សរ BSIS</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showCenterWatermarkLogo}
                  onChange={(e) => setShowCenterWatermarkLogo(e.target.checked)}
                />
                <span>ឡូហ្គោ BSIS កណ្ដាល (Watermark)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showStampAndSignature}
                  onChange={(e) => setShowStampAndSignature(e.target.checked)}
                />
                <span>បង្ហាញត្រា ហត្ថលេខា &amp; ឈ្មោះនាយក</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showScoreUnderName}
                  onChange={(e) => setShowScoreUnderName(e.target.checked)}
                />
                <span>បង្ហាញមធ្យមភាគ &amp; និទ្ទេសក្រោមឈ្មោះ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showEnglishName}
                  onChange={(e) => setShowEnglishName(e.target.checked)}
                />
                <span>បង្ហាញឈ្មោះអង់គ្លេសក្រោមឈ្មោះខ្មែរ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showClassTag}
                  onChange={(e) => setShowClassTag(e.target.checked)}
                />
                <span>បង្ហាញឈ្មោះថ្នាក់ &amp; គ្រូបន្ទុកថ្នាក់</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', alignItems: 'end', paddingTop: '0.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    ទំហំរូបថតក្នុងស៊ុម
                  </label>
                  <select
                    value={photoFitMode}
                    onChange={(e) => setPhotoFitMode(e.target.value as 'cover' | 'contain')}
                    style={fieldInputStyle}
                  >
                    <option value="cover">ពេញប្រអប់ (Cover)</option>
                    <option value="contain">បង្ហាញរូបទាំងមូល (Contain)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    ពណ៌ស៊ុម
                  </label>
                  <input
                    type="color"
                    value={photoBorderColor}
                    onChange={(e) => setPhotoBorderColor(e.target.value)}
                    style={{
                      width: '36px',
                      height: '28px',
                      padding: 0,
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#93c5fd', marginBottom: '0.16rem' }}>
                  Link Banner ឡូហ្គោខាងលើ (ស្រេចចិត្ត)
                </label>
                <input
                  type="text"
                  value={bannerLogoUrl}
                  onChange={(e) => setBannerLogoUrl(e.target.value)}
                  placeholder="ទុកទំនេរ = ឡូហ្គោ BSIS ដើម..."
                  style={fieldInputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#93c5fd', marginBottom: '0.16rem' }}>
                  Link ឡូហ្គោ Watermark កណ្ដាល (ស្រេចចិត្ត)
                </label>
                <input
                  type="text"
                  value={watermarkLogoUrl}
                  onChange={(e) => setWatermarkLogoUrl(e.target.value)}
                  placeholder="ទុកទំនេរ = ឡូហ្គោ BSIS មូល..."
                  style={fieldInputStyle}
                />
              </div>
            </div>
          </PrintStyleSidebar>
        )}

        {/* Right Live A4 Preview Pane */}
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
            {renderedPages.map((pg, idx) => (
              <div
                key={pg.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
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
                    width: `${HONOR_ROLL_A4_SPEC.sheetWPx * previewScale}px`,
                    height: `${HONOR_ROLL_A4_SPEC.sheetHPx * previewScale}px`,
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
                      width: HONOR_ROLL_A4_SPEC.sheetW,
                      height: HONOR_ROLL_A4_SPEC.sheetH,
                    }}
                  >
                    <div
                      className={printScopeProps.className}
                      style={{ ...printScopeProps.style, width: '100%', height: '100%' }}
                    >
                      <HonorRollSheet
                        slots={pg.slots}
                        topCount={topCount}
                        titleKhmer={titleKhmer}
                        titleEnglish={titleEnglish}
                        congratsKhmer={congratsKhmer}
                        congratsEnglish={congratsEnglish}
                        footerDateKhmer={footerDateKhmer}
                        footerDateEnglish={footerDateEnglish}
                        principalTitleKh={principalTitleKh}
                        signatoryName={signatoryName}
                        bannerLogoUrl={bannerLogoUrl}
                        watermarkLogoUrl={watermarkLogoUrl}
                        stampUrl={scoreSettings?.resultStampUrl || ''}
                        signatureUrl={scoreSettings?.resultSignatureUrl || ''}
                        showWatermarkPattern={showWatermarkPattern}
                        showCenterWatermarkLogo={showCenterWatermarkLogo}
                        showStampAndSignature={showStampAndSignature}
                        showScoreUnderName={showScoreUnderName}
                        showEnglishName={showEnglishName}
                        showClassTag={showClassTag}
                        classMetaLabel={pg.classMetaLabel}
                        teacherMetaLabel={pg.teacherMetaLabel}
                        photoBorderColor={photoBorderColor}
                        photoFitMode={photoFitMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
