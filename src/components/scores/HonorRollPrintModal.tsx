"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '@/components/AppIcons';
import PrintExportControls from '@/components/print/PrintExportControls';
import { collectPrintSheetElements } from '@/utils/printExport';
import PrintStyleSidebar, { usePrintSidebarFocus } from '@/components/print/PrintStyleSidebar';
import { BUILTIN_RICH_FONT_CHOICES } from './certificateRichText';
import {
  buildPrintScopeProps,
  usePrintDocumentStyle,
} from '@/components/print/printStylePresets';
import {
  MonthlyResultClassPacket,
  computeMonthlyResultPacketsForClass,
} from './MonthlyResultSheet';
import HonorRollSheet, {
  DEFAULT_HONOR_LAYOUT_CONFIG,
  HONOR_ELEMENT_LABELS,
  HONOR_ROLL_A4_SPEC,
  HonorElementTransform,
  HonorRollElementKey,
  HonorRollLayoutConfig,
  HonorRollStudentSlot,
  formatHonorEnglishDate,
  formatHonorKhmerDate,
  getMonthLabelsFromYM,
  normalizeHonorLayoutConfig,
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

const LOCAL_LAYOUT_STORAGE_KEY = 'bsis_honor_roll_layout_v1';

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

  // Visual, Stamp & Signature Options (Official Red Stamp ON by default!)
  const [bannerLogoUrl, setBannerLogoUrl] = useState<string>('');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string>('');
  const [customStampUrl, setCustomStampUrl] = useState<string>(
    scoreSettings?.resultStampUrl || ''
  );
  const [customSignatureUrl, setCustomSignatureUrl] = useState<string>(
    scoreSettings?.resultSignatureUrl || ''
  );
  const [showWatermarkPattern, setShowWatermarkPattern] = useState<boolean>(true);
  const [showCenterWatermarkLogo, setShowCenterWatermarkLogo] = useState<boolean>(true);
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showScoreUnderName, setShowScoreUnderName] = useState<boolean>(false);
  const [showEnglishName, setShowEnglishName] = useState<boolean>(false);
  const [showClassTag, setShowClassTag] = useState<boolean>(false);
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain'>('cover');
  const [photoBorderColor, setPhotoBorderColor] = useState<string>('#111827');

  // Interactive Drag, Resize & Spacing Configuration
  const [layoutConfig, setLayoutConfigState] = useState<HonorRollLayoutConfig>(() => ({
    ...DEFAULT_HONOR_LAYOUT_CONFIG,
    elements: {},
  }));
  const [isDragMode, setIsDragMode] = useState<boolean>(true);
  const [selectedElement, setSelectedElement] = useState<HonorRollElementKey | null>(null);
  const [isSpacingOpen, setIsSpacingOpen] = useState<boolean>(true);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState<boolean>(false);
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState<boolean>(false);

  // Optional Manual Slot Overrides for Page 1 / Active Page (Rank 1..5)
  const [slotOverrides, setSlotOverrides] = useState<Record<number, ManualSlotOverride>>({});

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [previewScale, setPreviewScale] = useState<number>(1);

  const printStyle = usePrintDocumentStyle('honor_roll', isOpen);
  const { focusRequest, requestFocus } = usePrintSidebarFocus();
  const portalRootRef = useRef<HTMLDivElement>(null);
  const printScopeProps = useMemo(
    () => buildPrintScopeProps(printStyle.styleConfig),
    [printStyle.styleConfig]
  );

  const handleSelectHonorElement = useCallback(
    (key: HonorRollElementKey | null) => {
      setSelectedElement(key);
      if (key) {
        setIsSidebarOpen(true);
        requestFocus('doc', 'element-inspector');
      }
    },
    [requestFocus]
  );

  // Restore saved layout tweaks from localStorage when modal opens
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_LAYOUT_STORAGE_KEY);
      if (raw) {
        setLayoutConfigState(normalizeHonorLayoutConfig(JSON.parse(raw)));
      }
    } catch {
      // ignore storage errors
    }
  }, [isOpen]);

  const setLayoutConfig = useCallback(
    (
      updater:
        | HonorRollLayoutConfig
        | ((prev: HonorRollLayoutConfig) => HonorRollLayoutConfig)
    ) => {
      setLayoutConfigState((prev) => {
        const next = normalizeHonorLayoutConfig(
          typeof updater === 'function' ? updater(prev) : updater
        );
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_LAYOUT_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    []
  );

  const patchLayout = useCallback(
    (partial: Partial<HonorRollLayoutConfig>) => {
      setLayoutConfig((prev) => ({ ...prev, ...partial }));
    },
    [setLayoutConfig]
  );

  const updateElementTransform = useCallback(
    (key: HonorRollElementKey, next: HonorElementTransform) => {
      setLayoutConfig((prev) => ({
        ...prev,
        elements: {
          ...(prev.elements || {}),
          [key]: next,
        },
      }));
    },
    [setLayoutConfig]
  );

  // Keyboard arrow key precision nudging for selected element
  useEffect(() => {
    if (!isOpen || !isDragMode || !selectedElement) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setSelectedElement(null);
        return;
      }
      const step = e.shiftKey ? 2 : 0.5;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      setLayoutConfig((prev) => {
        const cur = prev.elements?.[selectedElement] || { dxMm: 0, dyMm: 0, scale: 1 };
        return {
          ...prev,
          elements: {
            ...(prev.elements || {}),
            [selectedElement]: {
              ...cur,
              dxMm: Number((cur.dxMm + dx).toFixed(1)),
              dyMm: Number((cur.dyMm + dy).toFixed(1)),
            },
          },
        };
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isDragMode, selectedElement, setLayoutConfig]);

  // Keep month titles auto-synced when selectedMonth changes
  useEffect(() => {
    const labels = getMonthLabelsFromYM(selectedMonth);
    setTitleKhmer(`តារាងកិត្តិយស ប្រចាំខែ ${labels.khmerMonth}`);
    setTitleEnglish(`Honor Roll Chart of ${labels.englishMonth}`);
  }, [selectedMonth]);

  useEffect(() => {
    if (!isOpen) return;
    setSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');
    setCustomStampUrl(scoreSettings?.resultStampUrl || '');
    setCustomSignatureUrl(scoreSettings?.resultSignatureUrl || '');
    setSlotOverrides({});
    setSelectedElement(null);
  }, [
    isOpen,
    scoreSettings?.resultSignatoryName,
    scoreSettings?.resultStampUrl,
    scoreSettings?.resultSignatureUrl,
  ]);

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
      const sideOffset = isSidebarOpen && window.innerWidth >= 960 ? 410 : 48;
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
    setSelectedElement(null);

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

  const handleUploadImageDataUrl = (file: File | null, onDone: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) onDone(dataUrl);
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
    customStampUrl,
    customSignatureUrl,
    showWatermarkPattern,
    showCenterWatermarkLogo,
    showStamp,
    showSignature,
    showScoreUnderName,
    showEnglishName,
    showClassTag,
    photoFitMode,
    photoBorderColor,
    layoutConfig,
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
    if (typeof opts.customStampUrl === 'string') setCustomStampUrl(opts.customStampUrl);
    if (typeof opts.customSignatureUrl === 'string') setCustomSignatureUrl(opts.customSignatureUrl);
    if (typeof opts.showWatermarkPattern === 'boolean') setShowWatermarkPattern(opts.showWatermarkPattern);
    if (typeof opts.showCenterWatermarkLogo === 'boolean') setShowCenterWatermarkLogo(opts.showCenterWatermarkLogo);
    if (typeof opts.showStamp === 'boolean') setShowStamp(opts.showStamp);
    if (typeof opts.showSignature === 'boolean') setShowSignature(opts.showSignature);
    if (typeof opts.showScoreUnderName === 'boolean') setShowScoreUnderName(opts.showScoreUnderName);
    if (typeof opts.showEnglishName === 'boolean') setShowEnglishName(opts.showEnglishName);
    if (typeof opts.showClassTag === 'boolean') setShowClassTag(opts.showClassTag);
    if (opts.photoFitMode === 'cover' || opts.photoFitMode === 'contain') {
      setPhotoFitMode(opts.photoFitMode);
    }
    if (typeof opts.photoBorderColor === 'string') setPhotoBorderColor(opts.photoBorderColor);
    if (opts.layoutConfig && typeof opts.layoutConfig === 'object') {
      setLayoutConfig(normalizeHonorLayoutConfig(opts.layoutConfig));
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const activeElemTransform: HonorElementTransform = selectedElement
    ? layoutConfig.elements?.[selectedElement] || { dxMm: 0, dyMm: 0, scale: 1 }
    : { dxMm: 0, dyMm: 0, scale: 1 };

  const movedElementsCount = Object.keys(layoutConfig.elements || {}).length;

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
    gap: '0.46rem',
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

  const sliderRowLabel: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.71rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.14rem',
  };

  return createPortal(
    <div
      ref={portalRootRef}
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
          padding: '0.6rem 1rem',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {/* Left: Title + Class Picker + Month Picker + Top 5/3 */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.48rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', color: '#f8fafc', fontWeight: 800, fontSize: '0.92rem' }}>
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
                <AppIcon name="award" size={15} strokeWidth={2.2} />
              </span>
              <span>តារាងកិត្តិយស (A4)</span>
            </div>

            {/* Multi-class Dropdown */}
            <div ref={classMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((v) => !v)}
                style={{
                  padding: '0.36rem 0.62rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: `1px solid ${isClassMenuOpen ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}`,
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  minWidth: '150px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
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
                padding: '0.35rem 0.52rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.79rem',
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
                    padding: '0.24rem 0.52rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: topCount === cnt ? '#d97706' : 'transparent',
                    color: topCount === cnt ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  លេខ ១-{cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Right Actions: Drag Mode Toggle, Stamp Toggle, Sidebar Toggle, Print A4, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setIsDragMode((v) => {
                  if (v) setSelectedElement(null);
                  return !v;
                });
              }}
              title="បើកដើម្បីចុចអូសផ្លាស់ទី និងពង្រីកបង្រួមធាតុនីមួយៗផ្ទាល់លើទំព័រ A4"
              style={{
                padding: '0.4rem 0.66rem',
                borderRadius: '8px',
                background: isDragMode ? 'rgba(14, 165, 233, 0.24)' : '#1e293b',
                border: isDragMode ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.35)',
                color: isDragMode ? '#bae6fd' : '#cbd5e1',
                fontSize: '0.77rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name="layers" size={14} />
              <span>{isDragMode ? 'អូស & រំកិល៖ បើក' : 'អូស & រំកិល៖ បិទ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              style={{
                padding: '0.4rem 0.68rem',
                borderRadius: '8px',
                background: isSidebarOpen ? 'rgba(99, 102, 241, 0.25)' : '#1e293b',
                border: isSidebarOpen ? '1px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.35)',
                color: '#e0e7ff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name="sliders" size={14} />
              <span>{isSidebarOpen ? 'លាក់ការកំណត់' : 'ការកំណត់ & Font'}</span>
            </button>

            <PrintExportControls
              getExportElements={() =>
                collectPrintSheetElements(
                  portalRootRef.current,
                  '.receipt-a4-sheets-container .receipt-a4-preview-scale > *'
                )
              }
              fileNameBase={`bsis-honor-roll-${selectedMonth || 'export'}`}
              disabled={renderedPages.length === 0}
            />

            <button
              type="button"
              onClick={handlePrint}
              disabled={renderedPages.length === 0}
              style={{
                padding: '0.42rem 0.88rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.36rem',
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
                padding: '0.4rem 0.68rem',
                borderRadius: '8px',
                background: '#334155',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.28rem',
              }}
            >
              <AppIcon name="x" size={14} />
              <span>បិទ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Split Workspace: Left Settings Sidebar + Right Live Interactive A4 Preview */}
      <div className="print-workspace-body">
        {isSidebarOpen && (
          <PrintStyleSidebar
            title="ការកំណត់តារាងកិត្តិយស"
            wide={true}
            styleConfig={printStyle.styleConfig}
            onChangeStyle={printStyle.setStyleConfig}
            onResetStyle={() => {
              printStyle.resetStyleConfig();
              setLayoutConfig({ ...DEFAULT_HONOR_LAYOUT_CONFIG, elements: {} });
              setSelectedElement(null);
            }}
            showTableSettings={false}
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
            {/* 1. Interactive Element Position, Scale & Contextual Settings Inspector */}
            <div
              data-sidebar-section="element-inspector"
              style={{
                ...cardStyle,
                border: selectedElement
                  ? '1.5px solid rgba(56, 189, 248, 0.7)'
                  : '1px solid rgba(56, 189, 248, 0.28)',
                background: selectedElement
                  ? 'rgba(14, 116, 144, 0.22)'
                  : 'rgba(30, 41, 59, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                  ផ្លាស់ទី &amp; កែធាតុដែលបានជ្រើស (Inspector)
                </span>
                {movedElementsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLayoutConfig((prev) => ({ ...prev, elements: {} }));
                      setSelectedElement(null);
                    }}
                    style={{
                      padding: '0.14rem 0.42rem',
                      borderRadius: '5px',
                      border: '1px solid rgba(248, 113, 113, 0.45)',
                      background: 'rgba(239, 68, 68, 0.14)',
                      color: '#fca5a5',
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    កំណត់ទីតាំងដើម
                  </button>
                )}
              </div>

              <select
                value={selectedElement || ''}
                onChange={(e) => {
                  const val = e.target.value as HonorRollElementKey | '';
                  handleSelectHonorElement(val || null);
                  if (val) setIsDragMode(true);
                }}
                style={fieldInputStyle}
              >
                <option value="">-- ចុចលើធាតុក្នុងទំព័រ A4 ឬជ្រើសនៅទីនេះ --</option>
                {(Object.keys(HONOR_ELEMENT_LABELS) as HonorRollElementKey[]).map((k) => (
                  <option key={k} value={k}>
                    {HONOR_ELEMENT_LABELS[k]}
                  </option>
                ))}
              </select>

              {selectedElement ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem' }}>
                  {/* Contextual Quick Controls Tailored to Selected Element */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.68)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '8px',
                      padding: '0.46rem 0.52rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.36rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#bae6fd' }}>
                        ការកំណត់៖ {HONOR_ELEMENT_LABELS[selectedElement]}
                      </span>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.68rem', color: '#e2e8f0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={
                            selectedElement === 'stamp'
                              ? showStamp
                              : selectedElement === 'signature'
                                ? showSignature
                                : selectedElement === 'watermarkLogo'
                                  ? showCenterWatermarkLogo
                                  : activeElemTransform.visible !== false
                          }
                          onChange={(e) => {
                            if (selectedElement === 'stamp') setShowStamp(e.target.checked);
                            else if (selectedElement === 'signature') setShowSignature(e.target.checked);
                            else if (selectedElement === 'watermarkLogo') setShowCenterWatermarkLogo(e.target.checked);
                            else {
                              updateElementTransform(selectedElement, {
                                ...activeElemTransform,
                                visible: e.target.checked,
                              });
                            }
                          }}
                        />
                        <span>បង្ហាញ</span>
                      </label>
                    </div>

                    {/* STAMP contextual controls */}
                    {selectedElement === 'stamp' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                          <div>
                            <label style={sliderRowLabel}>
                              <span>ទំហំត្រា</span>
                              <span style={{ color: '#fda4af' }}>
                                {layoutConfig.stampSizeMm}mm ({(layoutConfig.stampSizeMm / 10).toFixed(1)}cm)
                              </span>
                            </label>
                            <input
                              type="range"
                              min={16}
                              max={64}
                              step={0.5}
                              value={layoutConfig.stampSizeMm}
                              onChange={(e) => patchLayout({ stampSizeMm: Number(e.target.value) })}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={sliderRowLabel}>
                              <span>បង្វិល</span>
                              <span style={{ color: '#fda4af' }}>{layoutConfig.stampRotationDeg}°</span>
                            </label>
                            <input
                              type="range"
                              min={-45}
                              max={45}
                              step={1}
                              value={layoutConfig.stampRotationDeg}
                              onChange={(e) => patchLayout({ stampRotationDeg: Number(e.target.value) })}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={sliderRowLabel}>
                            <span>ភាពច្បាស់ត្រា</span>
                            <span style={{ color: '#fda4af' }}>{Math.round(layoutConfig.stampOpacity * 100)}%</span>
                          </label>
                          <input
                            type="range"
                            min={0.2}
                            max={1}
                            step={0.05}
                            value={layoutConfig.stampOpacity}
                            onChange={(e) => patchLayout({ stampOpacity: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={customStampUrl}
                          onChange={(e) => setCustomStampUrl(e.target.value)}
                          placeholder="Link ត្រា (ទុកទំនេរ = ត្រា BSIS)..."
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        />
                      </>
                    )}

                    {/* SIGNATURE contextual controls */}
                    {selectedElement === 'signature' && (
                      <>
                        <div>
                          <label style={sliderRowLabel}>
                            <span>កម្ពស់ហត្ថលេខា</span>
                            <span style={{ color: '#93c5fd' }}>{layoutConfig.signatureHeightMm} mm</span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={28}
                            step={0.5}
                            value={layoutConfig.signatureHeightMm}
                            onChange={(e) => patchLayout({ signatureHeightMm: Number(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 600 }}>ពណ៌ប៊ិកហត្ថលេខា</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem' }}>
                            {['#1d4ed8', '#0f172a', '#dc2626', '#047857', '#6d28d9'].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => patchLayout({ signatureColor: hex })}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '4px',
                                  border: layoutConfig.signatureColor === hex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                                  background: hex,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              />
                            ))}
                            <input
                              type="color"
                              value={layoutConfig.signatureColor || '#1d4ed8'}
                              onChange={(e) => patchLayout({ signatureColor: e.target.value })}
                              style={{ width: '20px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={customSignatureUrl}
                          onChange={(e) => setCustomSignatureUrl(e.target.value)}
                          placeholder="Link ហត្ថលេខា (ទុកទំនេរ = ប៊ិកខៀវ)..."
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        />
                      </>
                    )}

                    {/* FOOTER DATE / PRINCIPAL TITLE / SIGNATORY NAME / CLASS META */}
                    {(selectedElement === 'footerDate' ||
                      selectedElement === 'principalTitle' ||
                      selectedElement === 'signatoryName' ||
                      selectedElement === 'classMeta') && (
                      <>
                        {selectedElement === 'footerDate' && (
                          <>
                            <input
                              type="date"
                              value={issueDateIso}
                              onChange={(e) => handleIssueDatePick(e.target.value)}
                              style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                            />
                            <input
                              type="text"
                              value={footerDateKhmer}
                              onChange={(e) => setFooterDateKhmer(e.target.value)}
                              placeholder="កាលបរិច្ឆេទខ្មែរ"
                              style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                            />
                            <input
                              type="text"
                              value={footerDateEnglish}
                              onChange={(e) => setFooterDateEnglish(e.target.value)}
                              placeholder="English Date"
                              style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                            />
                          </>
                        )}
                        {selectedElement === 'principalTitle' && (
                          <input
                            type="text"
                            value={principalTitleKh}
                            onChange={(e) => setPrincipalTitleKh(e.target.value)}
                            placeholder="តួនាទី (ឧ. នាយក)"
                            style={{ ...fieldInputStyle, fontSize: '0.73rem' }}
                          />
                        )}
                        {selectedElement === 'signatoryName' && (
                          <input
                            type="text"
                            value={signatoryName}
                            onChange={(e) => setSignatoryName(e.target.value)}
                            placeholder="ឈ្មោះអ្នកចុះហត្ថលេខា"
                            style={{ ...fieldInputStyle, fontSize: '0.73rem' }}
                          />
                        )}

                        <select
                          value={activeElemTransform.fontFamily || ''}
                          onChange={(e) =>
                            updateElementTransform(selectedElement, {
                              ...activeElemTransform,
                              fontFamily: e.target.value || undefined,
                            })
                          }
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        >
                          <option value="">ពុម្ពអក្សរ៖ លំនាំដើម (Default)</option>
                          {BUILTIN_RICH_FONT_CHOICES.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={sliderRowLabel}>
                              <span>ទំហំអក្សរ</span>
                              <span style={{ color: '#fbbf24' }}>
                                {activeElemTransform.fontSizePt ? `${activeElemTransform.fontSizePt} pt` : `${layoutConfig.footerFontPt} pt`}
                              </span>
                            </label>
                            <input
                              type="range"
                              min={6.5}
                              max={20}
                              step={0.5}
                              value={activeElemTransform.fontSizePt ?? layoutConfig.footerFontPt}
                              onChange={(e) =>
                                updateElementTransform(selectedElement, {
                                  ...activeElemTransform,
                                  fontSizePt: Number(e.target.value),
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                          <input
                            type="color"
                            title="ពណ៌អក្សរ"
                            value={activeElemTransform.color || '#111827'}
                            onChange={(e) =>
                              updateElementTransform(selectedElement, {
                                ...activeElemTransform,
                                color: e.target.value,
                              })
                            }
                            style={{ width: '24px', height: '24px', border: '1px solid #475569', borderRadius: '5px', background: 'transparent', cursor: 'pointer', padding: 0 }}
                          />
                          <button
                            type="button"
                            title="Bold"
                            onClick={() =>
                              updateElementTransform(selectedElement, {
                                ...activeElemTransform,
                                bold: activeElemTransform.bold === undefined ? true : !activeElemTransform.bold,
                              })
                            }
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '5px',
                              border: activeElemTransform.bold ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.35)',
                              background: activeElemTransform.bold ? 'rgba(56,189,248,0.25)' : '#1e293b',
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
                            title="Italic"
                            onClick={() =>
                              updateElementTransform(selectedElement, {
                                ...activeElemTransform,
                                italic: !activeElemTransform.italic,
                              })
                            }
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '5px',
                              border: activeElemTransform.italic ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.35)',
                              background: activeElemTransform.italic ? 'rgba(56,189,248,0.25)' : '#1e293b',
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
                      </>
                    )}

                    {/* TITLE BLOCK contextual controls */}
                    {selectedElement === 'titleBlock' && (
                      <>
                        <input type="text" value={titleKhmer} onChange={(e) => setTitleKhmer(e.target.value)} placeholder="ចំណងជើងខ្មែរ" style={{ ...fieldInputStyle, fontSize: '0.72rem' }} />
                        <input type="text" value={titleEnglish} onChange={(e) => setTitleEnglish(e.target.value)} placeholder="English Title" style={{ ...fieldInputStyle, fontSize: '0.72rem' }} />
                        <input type="text" value={congratsKhmer} onChange={(e) => setCongratsKhmer(e.target.value)} placeholder="អបអរសាទរខ្មែរ" style={{ ...fieldInputStyle, fontSize: '0.72rem' }} />
                        <input type="text" value={congratsEnglish} onChange={(e) => setCongratsEnglish(e.target.value)} placeholder="English Congratulation" style={{ ...fieldInputStyle, fontSize: '0.72rem' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                          <div>
                            <label style={sliderRowLabel}>
                              <span>ចំណងជើងខ្មែរ</span>
                              <span style={{ color: '#c4b5fd' }}>{layoutConfig.titleKhPt}pt</span>
                            </label>
                            <input
                              type="range"
                              min={12}
                              max={26}
                              step={0.5}
                              value={layoutConfig.titleKhPt}
                              onChange={(e) => patchLayout({ titleKhPt: Number(e.target.value) })}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={sliderRowLabel}>
                              <span>ចំណងជើង Eng</span>
                              <span style={{ color: '#c4b5fd' }}>{layoutConfig.titleEnPt}pt</span>
                            </label>
                            <input
                              type="range"
                              min={9}
                              max={22}
                              step={0.5}
                              value={layoutConfig.titleEnPt}
                              onChange={(e) => patchLayout({ titleEnPt: Number(e.target.value) })}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* STUDENT PHOTO SLOTS (#1 - #5) contextual controls */}
                    {/^slot[1-5]$/.test(selectedElement) && (() => {
                      const rankNum = Number(selectedElement.replace('slot', ''));
                      const ov = slotOverrides[rankNum] || {};
                      return (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                            <div>
                              <label style={sliderRowLabel}>
                                <span>ទទឹងស៊ុម</span>
                                <span style={{ color: '#fbbf24' }}>{layoutConfig.frameWidthMm}mm</span>
                              </label>
                              <input type="range" min={30} max={56} step={0.5} value={layoutConfig.frameWidthMm} onChange={(e) => patchLayout({ frameWidthMm: Number(e.target.value) })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={sliderRowLabel}>
                                <span>កម្ពស់ស៊ុម</span>
                                <span style={{ color: '#fbbf24' }}>{layoutConfig.frameHeightMm}mm</span>
                              </label>
                              <input type="range" min={36} max={64} step={0.5} value={layoutConfig.frameHeightMm} onChange={(e) => patchLayout({ frameHeightMm: Number(e.target.value) })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={sliderRowLabel}>
                                <span>ទំហំមេដាយ</span>
                                <span style={{ color: '#fbbf24' }}>{Math.round(layoutConfig.medalScale * 100)}%</span>
                              </label>
                              <input type="range" min={0.5} max={1.3} step={0.05} value={layoutConfig.medalScale} onChange={(e) => patchLayout({ medalScale: Number(e.target.value) })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={sliderRowLabel}>
                                <span>ទំហំឈ្មោះសិស្ស</span>
                                <span style={{ color: '#c4b5fd' }}>{layoutConfig.studentNamePt}pt</span>
                              </label>
                              <input type="range" min={8.5} max={18} step={0.25} value={layoutConfig.studentNamePt} onChange={(e) => patchLayout({ studentNamePt: Number(e.target.value) })} style={{ width: '100%' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.26rem' }}>
                            <input
                              type="text"
                              value={ov.customName || ''}
                              onChange={(e) =>
                                setSlotOverrides((prev) => ({
                                  ...prev,
                                  [rankNum]: { ...(prev[rankNum] || {}), customName: e.target.value },
                                }))
                              }
                              placeholder={`កែឈ្មោះសិស្សលេខ ${rankNum}...`}
                              style={{ ...fieldInputStyle, flex: 1, fontSize: '0.71rem' }}
                            />
                            <label
                              style={{
                                padding: '0.24rem 0.45rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(56, 189, 248, 0.45)',
                                background: 'rgba(56, 189, 248, 0.14)',
                                color: '#bae6fd',
                                fontSize: '0.69rem',
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
                                  handleUploadImageDataUrl(e.target.files?.[0] || null, (url) =>
                                    setSlotOverrides((prev) => ({
                                      ...prev,
                                      [rankNum]: { ...(prev[rankNum] || {}), customPhotoUrl: url },
                                    }))
                                  )
                                }
                              />
                            </label>
                          </div>
                        </>
                      );
                    })()}

                    {/* HEADER BANNER contextual controls */}
                    {selectedElement === 'headerBanner' && (
                      <>
                        <div>
                          <label style={sliderRowLabel}>
                            <span>ទំហំ Logo ខាងលើ</span>
                            <span style={{ color: '#c4b5fd' }}>{layoutConfig.bannerHeightMm} mm</span>
                          </label>
                          <input type="range" min={13} max={34} step={0.5} value={layoutConfig.bannerHeightMm} onChange={(e) => patchLayout({ bannerHeightMm: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <input
                          type="text"
                          value={bannerLogoUrl}
                          onChange={(e) => setBannerLogoUrl(e.target.value)}
                          placeholder="Link ឡូហ្គោខាងលើ (ស្រេចចិត្ត)"
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        />
                      </>
                    )}

                    {/* WATERMARK LOGO contextual controls */}
                    {selectedElement === 'watermarkLogo' && (
                      <>
                        <div>
                          <label style={sliderRowLabel}>
                            <span>ទំហំ Watermark កណ្ដាល</span>
                            <span style={{ color: '#c4b5fd' }}>{layoutConfig.watermarkSizeMm} mm</span>
                          </label>
                          <input type="range" min={70} max={170} step={2} value={layoutConfig.watermarkSizeMm} onChange={(e) => patchLayout({ watermarkSizeMm: Number(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <input
                          type="text"
                          value={watermarkLogoUrl}
                          onChange={(e) => setWatermarkLogoUrl(e.target.value)}
                          placeholder="Link ឡូហ្គោ Watermark (ស្រេចចិត្ត)"
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        />
                      </>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ឆ្វេង-ស្ដាំ (X)</span>
                        <span style={{ color: '#7dd3fc' }}>{activeElemTransform.dxMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-120}
                        max={120}
                        step={0.5}
                        value={activeElemTransform.dxMm}
                        onChange={(e) =>
                          updateElementTransform(selectedElement, {
                            ...activeElemTransform,
                            dxMm: Number(e.target.value),
                          })
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>លើ-ក្រោម (Y)</span>
                        <span style={{ color: '#7dd3fc' }}>{activeElemTransform.dyMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-160}
                        max={160}
                        step={0.5}
                        value={activeElemTransform.dyMm}
                        onChange={(e) =>
                          updateElementTransform(selectedElement, {
                            ...activeElemTransform,
                            dyMm: Number(e.target.value),
                          })
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={sliderRowLabel}>
                      <span>ទំហំធាតុនេះ (Scale)</span>
                      <span style={{ color: '#fbbf24' }}>
                        {Math.round(activeElemTransform.scale * 100)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={1.9}
                      step={0.02}
                      value={activeElemTransform.scale}
                      onChange={(e) =>
                        updateElementTransform(selectedElement, {
                          ...activeElemTransform,
                          scale: Number(e.target.value),
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.67rem', color: '#94a3b8' }}>
                      អាចអូសផ្ទាល់ ឬប្រើព្រួញ ↑↓←→ លើ Keyboard
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLayoutConfig((prev) => {
                          const nextEl = { ...(prev.elements || {}) };
                          delete nextEl[selectedElement];
                          return { ...prev, elements: nextEl };
                        });
                      }}
                      style={{
                        padding: '0.16rem 0.48rem',
                        borderRadius: '5px',
                        border: '1px solid rgba(251, 191, 36, 0.45)',
                        background: 'rgba(251, 191, 36, 0.14)',
                        color: '#fde68a',
                        fontSize: '0.68rem',
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
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  ចុចលើធាតុណាមួយលើទំព័រ A4 (រូបថត ចំណងជើង កាលបរិច្ឆេទ ត្រា ឬហត្ថលេខា) ដើម្បីបើកការកំណត់ដោយស្វ័យប្រវត្តិ។
                </div>
              )}
            </div>

            {/* 2. Official Red Stamp & Signature Card */}
            <div data-sidebar-section="stamp-signature" style={{ ...cardStyle, border: '1px solid rgba(248, 113, 113, 0.32)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.28rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fda4af' }}>
                  ត្រាផ្លូវការ &amp; ហត្ថលេខា
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.22rem' }}>
                  {(
                    [
                      { key: 'footerDate', label: 'កាលបរិច្ឆេទ' },
                      { key: 'principalTitle', label: 'តួនាទី' },
                      { key: 'stamp', label: 'ត្រា' },
                      { key: 'signature', label: 'ហត្ថលេខា' },
                      { key: 'signatoryName', label: 'ឈ្មោះ' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (item.key === 'stamp') setShowStamp(true);
                        if (item.key === 'signature' || item.key === 'signatoryName') setShowSignature(true);
                        setIsDragMode(true);
                        handleSelectHonorElement(item.key);
                      }}
                      style={{
                        padding: '0.12rem 0.36rem',
                        borderRadius: '5px',
                        border:
                          selectedElement === item.key
                            ? '1.5px solid #38bdf8'
                            : '1px solid rgba(56, 189, 248, 0.4)',
                        background:
                          selectedElement === item.key
                            ? 'rgba(56, 189, 248, 0.28)'
                            : 'rgba(56, 189, 248, 0.12)',
                        color: selectedElement === item.key ? '#ffffff' : '#bae6fd',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', fontSize: '0.74rem', color: '#fecdd3', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showStamp}
                    onChange={(e) => setShowStamp(e.target.checked)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>បង្ហាញត្រាក្រហម</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', fontSize: '0.74rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showSignature}
                    onChange={(e) => setShowSignature(e.target.checked)}
                  />
                  <span>ហត្ថលេខា &amp; ឈ្មោះ</span>
                </label>
              </div>

              {showStamp && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំត្រា</span>
                        <span style={{ color: '#fda4af' }}>
                          {layoutConfig.stampSizeMm} mm ({(layoutConfig.stampSizeMm / 10).toFixed(1)} cm)
                        </span>
                      </label>
                      <input
                        type="range"
                        min={16}
                        max={64}
                        step={0.5}
                        value={layoutConfig.stampSizeMm}
                        onChange={(e) => patchLayout({ stampSizeMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>បង្វិលត្រា</span>
                        <span style={{ color: '#fda4af' }}>{layoutConfig.stampRotationDeg}°</span>
                      </label>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        step={1}
                        value={layoutConfig.stampRotationDeg}
                        onChange={(e) => patchLayout({ stampRotationDeg: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={sliderRowLabel}>
                      <span>ភាពច្បាស់ត្រា (Opacity)</span>
                      <span style={{ color: '#fda4af' }}>{Math.round(layoutConfig.stampOpacity * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.05}
                      value={layoutConfig.stampOpacity}
                      onChange={(e) => patchLayout({ stampOpacity: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.28rem' }}>
                    <input
                      type="text"
                      value={customStampUrl}
                      onChange={(e) => setCustomStampUrl(e.target.value)}
                      placeholder="Link ត្រា (ទុកទំនេរ = ត្រា BSIS ក្រហម)..."
                      style={{ ...fieldInputStyle, flex: 1, fontSize: '0.72rem' }}
                    />
                    <label
                      style={{
                        padding: '0.28rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(251, 113, 133, 0.45)',
                        background: 'rgba(244, 63, 94, 0.16)',
                        color: '#fecdd3',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      Upload ត្រា
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleUploadImageDataUrl(e.target.files?.[0] || null, setCustomStampUrl)
                        }
                      />
                    </label>
                  </div>
                </>
              )}

              {showSignature && (
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={customSignatureUrl}
                    onChange={(e) => setCustomSignatureUrl(e.target.value)}
                    placeholder="Link ហត្ថលេខា (ទុកទំនេរ = ប៊ិកខៀវ)..."
                    style={{ ...fieldInputStyle, flex: 1, fontSize: '0.72rem' }}
                  />
                  <label
                    style={{
                      padding: '0.28rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(96, 165, 250, 0.45)',
                      background: 'rgba(59, 130, 246, 0.16)',
                      color: '#bfdbfe',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) =>
                        handleUploadImageDataUrl(e.target.files?.[0] || null, setCustomSignatureUrl)
                      }
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 3. Spacing & Sizes Controls (Anti-Overlap Panel) */}
            <div style={cardStyle}>
              <button
                type="button"
                onClick={() => setIsSpacingOpen((v) => !v)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#fbbf24',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span>គម្លាត &amp; ទំហំស៊ុម / មេដាយ / អក្សរ (ការពារកុំឱ្យបាំងគ្នា)</span>
                <AppIcon name="chevron-down" size={14} />
              </button>

              {isSpacingOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem', paddingTop: '0.15rem' }}>
                  {/* Photo Frame Width & Height */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទទឹងស៊ុមរូបថត</span>
                        <span style={{ color: '#fbbf24' }}>{layoutConfig.frameWidthMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={56}
                        step={0.5}
                        value={layoutConfig.frameWidthMm}
                        onChange={(e) => patchLayout({ frameWidthMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>កម្ពស់ស៊ុមរូបថត</span>
                        <span style={{ color: '#fbbf24' }}>{layoutConfig.frameHeightMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={36}
                        max={64}
                        step={0.5}
                        value={layoutConfig.frameHeightMm}
                        onChange={(e) => patchLayout({ frameHeightMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Medal Scale & Corner Offset */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំមេដាយ (1st-5th)</span>
                        <span style={{ color: '#fbbf24' }}>{Math.round(layoutConfig.medalScale * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min={0.5}
                        max={1.3}
                        step={0.05}
                        value={layoutConfig.medalScale}
                        onChange={(e) => patchLayout({ medalScale: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>គម្លាតឈ្មោះពីរូបថត</span>
                        <span style={{ color: '#6ee7b7' }}>{layoutConfig.nameGapMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={16}
                        step={0.5}
                        value={layoutConfig.nameGapMm}
                        onChange={(e) => patchLayout({ nameGapMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Name X shift + Medal Y offset */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>រំកិលឈ្មោះឆ្វេង-ស្ដាំ</span>
                        <span style={{ color: '#6ee7b7' }}>{layoutConfig.nameShiftXMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={layoutConfig.nameShiftXMm}
                        onChange={(e) => patchLayout({ nameShiftXMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>រំកិលមេដាយលើ-ក្រោម</span>
                        <span style={{ color: '#fbbf24' }}>{layoutConfig.medalOffsetYMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={-14}
                        max={8}
                        step={0.5}
                        value={layoutConfig.medalOffsetYMm}
                        onChange={(e) => patchLayout({ medalOffsetYMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Vertical Row Spacing (Row 1, Row 2, Footer, Side Margin) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទីតាំងជួរលើ (#2, #3)</span>
                        <span style={{ color: '#93c5fd' }}>{layoutConfig.row1TopMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={74}
                        max={120}
                        step={1}
                        value={layoutConfig.row1TopMm}
                        onChange={(e) => patchLayout({ row1TopMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទីតាំងជួរក្រោម (#4, #5)</span>
                        <span style={{ color: '#93c5fd' }}>{layoutConfig.row2TopMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={145}
                        max={200}
                        step={1}
                        value={layoutConfig.row2TopMm}
                        onChange={(e) => patchLayout({ row2TopMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទីតាំងលេខ ១ (#1)</span>
                        <span style={{ color: '#93c5fd' }}>{layoutConfig.rank1TopMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={66}
                        max={110}
                        step={1}
                        value={layoutConfig.rank1TopMm}
                        onChange={(e) => patchLayout({ rank1TopMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទីតាំងកាលបរិច្ឆេទជើង</span>
                        <span style={{ color: '#93c5fd' }}>{layoutConfig.footerTopMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={218}
                        max={266}
                        step={1}
                        value={layoutConfig.footerTopMm}
                        onChange={(e) => patchLayout({ footerTopMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Font Sizes & Branding Sizes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំឈ្មោះសិស្ស</span>
                        <span style={{ color: '#c4b5fd' }}>{layoutConfig.studentNamePt} pt</span>
                      </label>
                      <input
                        type="range"
                        min={8.5}
                        max={18}
                        step={0.25}
                        value={layoutConfig.studentNamePt}
                        onChange={(e) => patchLayout({ studentNamePt: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំពិន្ទុ/អង់គ្លេស</span>
                        <span style={{ color: '#c4b5fd' }}>{layoutConfig.studentSubPt} pt</span>
                      </label>
                      <input
                        type="range"
                        min={5.5}
                        max={12}
                        step={0.25}
                        value={layoutConfig.studentSubPt}
                        onChange={(e) => patchLayout({ studentSubPt: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំចំណងជើងខ្មែរ</span>
                        <span style={{ color: '#c4b5fd' }}>{layoutConfig.titleKhPt} pt</span>
                      </label>
                      <input
                        type="range"
                        min={13}
                        max={26}
                        step={0.5}
                        value={layoutConfig.titleKhPt}
                        onChange={(e) => patchLayout({ titleKhPt: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំ Logo ខាងលើ</span>
                        <span style={{ color: '#c4b5fd' }}>{layoutConfig.bannerHeightMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={13}
                        max={34}
                        step={0.5}
                        value={layoutConfig.bannerHeightMm}
                        onChange={(e) => patchLayout({ bannerHeightMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>គម្លាតរឹមសងខាង</span>
                        <span style={{ color: '#93c5fd' }}>{layoutConfig.sideMarginMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={8}
                        max={28}
                        step={0.5}
                        value={layoutConfig.sideMarginMm}
                        onChange={(e) => patchLayout({ sideMarginMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={sliderRowLabel}>
                        <span>ទំហំ Watermark កណ្ដាល</span>
                        <span style={{ color: '#c4b5fd' }}>{layoutConfig.watermarkSizeMm} mm</span>
                      </label>
                      <input
                        type="range"
                        min={70}
                        max={170}
                        step={2}
                        value={layoutConfig.watermarkSizeMm}
                        onChange={(e) => patchLayout({ watermarkSizeMm: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Ranking Mode & Manual Student/Photo Customizer */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                សិស្សពូកែ &amp; ជម្រើសបង្ហាញ
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <select
                  value={groupingMode}
                  onChange={(e) => setGroupingMode(e.target.value as HonorGroupingMode)}
                  style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                >
                  <option value="per_class">១ ថ្នាក់ = ១ ទំព័រ</option>
                  <option value="combined_all">Top 5 រួមគ្រប់ថ្នាក់</option>
                </select>
                <select
                  value={splitBehavior}
                  onChange={(e) => setSplitBehavior(e.target.value as 'auto' | 'always' | 'never')}
                  style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                >
                  <option value="auto">វគ្គ៖ តាមថ្នាក់</option>
                  <option value="always">បំបែកគ្រប់វគ្គ</option>
                  <option value="never">រួមទាំងថ្នាក់</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.32rem', fontSize: '0.73rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.34rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showScoreUnderName} onChange={(e) => setShowScoreUnderName(e.target.checked)} />
                  <span>បង្ហាញមធ្យមភាគ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.34rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showEnglishName} onChange={(e) => setShowEnglishName(e.target.checked)} />
                  <span>ឈ្មោះអង់គ្លេស</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.34rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showClassTag} onChange={(e) => setShowClassTag(e.target.checked)} />
                  <span>ឈ្មោះថ្នាក់ &amp; គ្រូ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.34rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showWatermarkPattern} onChange={(e) => setShowWatermarkPattern(e.target.checked)} />
                  <span>Watermark អក្សរ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.34rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showCenterWatermarkLogo} onChange={(e) => setShowCenterWatermarkLogo(e.target.checked)} />
                  <span>Logo កណ្ដាល</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.38rem', alignItems: 'center' }}>
                <select
                  value={photoFitMode}
                  onChange={(e) => setPhotoFitMode(e.target.value as 'cover' | 'contain')}
                  style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                >
                  <option value="cover">រូបថត៖ ពេញប្រអប់ (Cover)</option>
                  <option value="contain">រូបថត៖ ទាំងមូល (Contain)</option>
                </select>
                <input
                  type="color"
                  title="ពណ៌ស៊ុមរូបថត"
                  value={photoBorderColor}
                  onChange={(e) => setPhotoBorderColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '28px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Manual Slot Override Drawer */}
              <button
                type="button"
                onClick={() => setIsSlotEditorOpen((v) => !v)}
                style={{
                  padding: '0.34rem 0.52rem',
                  borderRadius: '7px',
                  border: `1px solid ${isSlotEditorOpen ? '#38bdf8' : 'rgba(148,163,184,0.32)'}`,
                  background: isSlotEditorOpen ? 'rgba(56, 189, 248, 0.16)' : '#0f172a',
                  color: isSlotEditorOpen ? '#bae6fd' : '#e2e8f0',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>ប្ដូរសិស្ស / Upload រូបថតផ្ទាល់ (#1 - #{topCount})</span>
                <AppIcon name="chevron-down" size={13} />
              </button>

              {isSlotEditorOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                  {([1, 2, 3, 4, 5] as const).slice(0, topCount).map((rankNum) => {
                    const ov = slotOverrides[rankNum] || {};
                    return (
                      <div
                        key={rankNum}
                        style={{
                          background: '#0f172a',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '7px',
                          padding: '0.38rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.26rem',
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24' }}>
                          ចំណាត់ថ្នាក់លេខ {rankNum}
                        </div>
                        <select
                          value={ov.studentUid || ''}
                          onChange={(e) =>
                            setSlotOverrides((prev) => ({
                              ...prev,
                              [rankNum]: { ...(prev[rankNum] || {}), studentUid: e.target.value || undefined },
                            }))
                          }
                          style={{ ...fieldInputStyle, fontSize: '0.71rem' }}
                        >
                          <option value="">ស្វ័យប្រវត្តិ (តាមលំដាប់ពិន្ទុ)</option>
                          <option value="__empty__">ទុកប្រអប់ទទេ</option>
                          {candidatePool.map((c) => (
                            <option key={c.uid} value={c.uid}>
                              {c.fullName} ({c.classCode} • {c.averageDisplay})
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '0.24rem' }}>
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
                            style={{ ...fieldInputStyle, flex: 1, fontSize: '0.7rem' }}
                          />
                          <label
                            style={{
                              padding: '0.24rem 0.45rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(56, 189, 248, 0.45)',
                              background: 'rgba(56, 189, 248, 0.14)',
                              color: '#bae6fd',
                              fontSize: '0.69rem',
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
                                handleUploadImageDataUrl(e.target.files?.[0] || null, (url) =>
                                  setSlotOverrides((prev) => ({
                                    ...prev,
                                    [rankNum]: { ...(prev[rankNum] || {}), customPhotoUrl: url },
                                  }))
                                )
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
                        padding: '0.24rem 0.48rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#fca5a5',
                        fontSize: '0.7rem',
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

            {/* 5. Editable Titles, Dates & Logos Collapsible Card */}
            <div style={cardStyle}>
              <button
                type="button"
                onClick={() => setIsTextEditorOpen((v) => !v)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#6ee7b7',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span>កែអក្សរចំណងជើង កាលបរិច្ឆេទ &amp; Link ឡូហ្គោ</span>
                <AppIcon name="chevron-down" size={14} />
              </button>

              {isTextEditorOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.15rem' }}>
                  <input type="text" value={titleKhmer} onChange={(e) => setTitleKhmer(e.target.value)} placeholder="ចំណងជើងខ្មែរ" style={fieldInputStyle} />
                  <input type="text" value={titleEnglish} onChange={(e) => setTitleEnglish(e.target.value)} placeholder="English Title" style={fieldInputStyle} />
                  <input type="text" value={congratsKhmer} onChange={(e) => setCongratsKhmer(e.target.value)} placeholder="អបអរសាទរខ្មែរ" style={fieldInputStyle} />
                  <input type="text" value={congratsEnglish} onChange={(e) => setCongratsEnglish(e.target.value)} placeholder="English Congratulation" style={fieldInputStyle} />
                  <input type="date" value={issueDateIso} onChange={(e) => handleIssueDatePick(e.target.value)} style={fieldInputStyle} />
                  <input type="text" value={footerDateKhmer} onChange={(e) => setFooterDateKhmer(e.target.value)} placeholder="កាលបរិច្ឆេទខ្មែរ" style={fieldInputStyle} />
                  <input type="text" value={footerDateEnglish} onChange={(e) => setFooterDateEnglish(e.target.value)} placeholder="English Date" style={fieldInputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.32rem' }}>
                    <input type="text" value={principalTitleKh} onChange={(e) => setPrincipalTitleKh(e.target.value)} placeholder="តួនាទី (នាយក)" style={fieldInputStyle} />
                    <input type="text" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} placeholder="ឈ្មោះនាយក" style={fieldInputStyle} />
                  </div>
                  <input type="text" value={bannerLogoUrl} onChange={(e) => setBannerLogoUrl(e.target.value)} placeholder="Link ឡូហ្គោខាងលើ (ស្រេចចិត្ត)" style={fieldInputStyle} />
                  <input type="text" value={watermarkLogoUrl} onChange={(e) => setWatermarkLogoUrl(e.target.value)} placeholder="Link ឡូហ្គោ Watermark (ស្រេចចិត្ត)" style={fieldInputStyle} />
                </div>
              )}
            </div>
          </PrintStyleSidebar>
        )}

        {/* Right Live Interactive A4 Preview Pane */}
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
                  {isDragMode ? ' • ចុចអូសធាតុណាមួយដើម្បីរំកិល ឬពង្រីក' : ''}
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
                        stampUrl={customStampUrl}
                        signatureUrl={customSignatureUrl}
                        showWatermarkPattern={showWatermarkPattern}
                        showCenterWatermarkLogo={showCenterWatermarkLogo}
                        showStamp={showStamp}
                        showSignature={showSignature}
                        showScoreUnderName={showScoreUnderName}
                        showEnglishName={showEnglishName}
                        showClassTag={showClassTag}
                        classMetaLabel={pg.classMetaLabel}
                        teacherMetaLabel={pg.teacherMetaLabel}
                        photoBorderColor={photoBorderColor}
                        photoFitMode={photoFitMode}
                        layoutConfig={layoutConfig}
                        interactive={isDragMode}
                        previewScale={previewScale}
                        selectedElement={selectedElement}
                        onSelectElement={handleSelectHonorElement}
                        onUpdateElementTransform={updateElementTransform}
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
