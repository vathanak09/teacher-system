"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { attendanceService, settingsService } from '@/services/db';
import {
  DEFAULT_SCHOOL_PROFILE,
  SchoolProfileInfo,
} from '@/components/settings/SchoolInfoSettingsPanel';
import { AppIcon } from '../AppIcons';
import PrintExportControls from '@/components/print/PrintExportControls';
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
import { DEFAULT_RECEIPT_HEADER_DRIVE_URL } from '@/utils/paymentBilling';
import { formatDefaultKhmerDate } from './MonthlyResultSheet';
import { MonthlyResultBrandingConfig } from './MonthlyResultPrintModal';
import {
  MonthlyAttendanceCountMap,
  REPORT_CARD_A4_LANDSCAPE_SPEC,
  REPORT_CARD_A5_PORTRAIT_SPEC,
  REPORT_CARD_PASTEL_THEMES,
  ReportCardPaperMode,
  ReportCardPastelTheme,
  ReportCardSortMode,
  ReportCardSubjectFilterItem,
  StudentReportCardData,
  StudentReportCardSharedProps,
  StudentReportPairA4LandscapeSheet,
  StudentReportSingleA5Sheet,
  buildStudentReportCardsForClass,
  getReportCardAvailableSubjectItems,
  toArabicDigits,
} from './StudentReportCardSheet';

export interface StudentReportCardModalProps {
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
  initialStudentId?: string | null;
  onSaveBrandingSettings?: (patch: MonthlyResultBrandingConfig) => Promise<void>;
}

export default function StudentReportCardModal({
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
  initialStudentId,
  onSaveBrandingSettings,
}: StudentReportCardModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  // Student picker popover
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentUids, setSelectedStudentUids] = useState<string[] | null>(null);
  const studentMenuRef = useRef<HTMLDivElement>(null);

  // Subject columns picker popover (synced from score entry table)
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [hiddenSubjectKeys, setHiddenSubjectKeys] = useState<string[]>([]);
  const subjectMenuRef = useRef<HTMLDivElement>(null);

  // Single-page preview toggle & pagination
  const [singlePageView, setSinglePageView] = useState<boolean>(false);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);

  // Layout, Theme & Content Options
  const [paperMode, setPaperMode] = useState<ReportCardPaperMode>('a4_landscape_2up');
  const [themeId, setThemeId] = useState<string>(REPORT_CARD_PASTEL_THEMES[0].id);
  const [sortMode, setSortMode] = useState<ReportCardSortMode>('rank_asc');
  const [splitBehavior, setSplitBehavior] = useState<'auto' | 'always' | 'never'>('auto');
  const [includeUnscored, setIncludeUnscored] = useState<boolean>(false);
  const [includeExamColumns, setIncludeExamColumns] = useState<boolean>(true);
  const [includeTraitPunctuality, setIncludeTraitPunctuality] = useState<boolean>(true);
  const [showStudentPhoto, setShowStudentPhoto] = useState<boolean>(true);
  const [showNumericScores, setShowNumericScores] = useState<boolean>(true);
  const [showAttendance, setShowAttendance] = useState<boolean>(true);
  const [showStampAndSignature, setShowStampAndSignature] = useState<boolean>(true);
  const [showParentComments, setShowParentComments] = useState<boolean>(true);
  const [showCutGuide, setShowCutGuide] = useState<boolean>(true);
  const [stampSizeMm, setStampSizeMm] = useState<number>(28);
  const [signatureHeightMm, setSignatureHeightMm] = useState<number>(9.5);

  // Branding & Editable Text Fields
  const [logoUrl, setLogoUrl] = useState<string>(
    scoreSettings?.reportCardLogoUrl || DEFAULT_RECEIPT_HEADER_DRIVE_URL
  );
  const [logoHeightMm, setLogoHeightMm] = useState<number>(15);
  const [stampUrl, setStampUrl] = useState<string>(scoreSettings?.resultStampUrl || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(scoreSettings?.resultSignatureUrl || '');
  const [signatoryName, setSignatoryName] = useState<string>(
    scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ'
  );
  const [customTitle, setCustomTitle] = useState<string>('');
  const [khmerIssueDate, setKhmerIssueDate] = useState<string>(
    toArabicDigits(monthExtraData?.issueDateKhmer || formatDefaultKhmerDate())
  );
  const [approvalLabelKh, setApprovalLabelKh] = useState<string>('បានឃើញ និងឯកភាព');
  const [principalTitleKh, setPrincipalTitleKh] = useState<string>('នាយក');
  const [teacherTitleKh, setTeacherTitleKh] = useState<string>('គ្រូប្រចាំថ្នាក់');

  // Per-student custom recommendation editor
  const [editingRecUid, setEditingRecUid] = useState<string>('');
  const [customRecommendations, setCustomRecommendations] = useState<Record<string, string>>({});

  // Live Attendance Data fetched from RTDB
  const [attendanceMap, setAttendanceMap] = useState<MonthlyAttendanceCountMap>({
    byClassStudent: {},
  });
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileInfo>(DEFAULT_SCHOOL_PROFILE);

  const printStyle = usePrintDocumentStyle('student_report', isOpen);
  const tableSelection = useTableSelection(isOpen);
  const { focusRequest, requestFocus } = usePrintSidebarFocus();
  const portalRootRef = useRef<HTMLDivElement>(null);

  const handleAreaSelected = useCallback(
    (area: PrintSelectedArea) => {
      setIsSidebarOpen(true);
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

  // Sync branding & date when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLogoUrl(
      scoreSettings?.reportCardLogoUrl || DEFAULT_RECEIPT_HEADER_DRIVE_URL
    );
    setStampUrl(scoreSettings?.resultStampUrl || '');
    setSignatureUrl(scoreSettings?.resultSignatureUrl || '');
    setSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');
    setKhmerIssueDate(
      toArabicDigits(String(monthExtraData?.issueDateKhmer || '').trim() || formatDefaultKhmerDate())
    );
    setSaveFeedback('');
  }, [
    isOpen,
    scoreSettings?.reportCardLogoUrl,
    scoreSettings?.resultStampUrl,
    scoreSettings?.resultSignatureUrl,
    scoreSettings?.resultSignatoryName,
    monthExtraData?.issueDateKhmer,
  ]);

  // Subscribe to schoolInfo for fallback logo & bilingual school name
  useEffect(() => {
    if (!isOpen) return;
    const unsub = settingsService.subscribeOne('schoolInfo', (data: any) => {
      if (data) setSchoolProfile({ ...DEFAULT_SCHOOL_PROFILE, ...data });
    });
    return () => unsub();
  }, [isOpen]);

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

  // Initialize selected class(es) when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsClassMenuOpen(false);
    setIsStudentMenuOpen(false);
    setIsSubjectMenuOpen(false);
    setSelectedStudentUids(null);
    setActivePageIdx(0);
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

  // Fetch real monthly attendance counts for all selected classes
  useEffect(() => {
    if (!isOpen || selectedClassIds.length === 0) return;
    const m = /^(\d{4})-(\d{1,2})$/.exec(String(selectedMonth || '').trim());
    if (!m) {
      setAttendanceMap({ byClassStudent: {} });
      return;
    }
    const yr = Number(m[1]);
    const mo = Number(m[2]);
    let cancelled = false;
    setIsLoadingAttendance(true);

    Promise.all(
      selectedClassIds.map(async (cid) => {
        try {
          const doc = await attendanceService.getById(`${cid}_${yr}_${mo}`);
          return { cid, records: doc?.records && typeof doc.records === 'object' ? doc.records : {} };
        } catch {
          return { cid, records: {} };
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const nextMap: Record<string, { permission: number; absent: number; present: number }> = {};
        results.forEach(({ cid, records }) => {
          Object.entries(records as Record<string, Record<string, string>>).forEach(
            ([stId, dayMap]) => {
              if (!dayMap || typeof dayMap !== 'object') return;
              let permission = 0;
              let absent = 0;
              let present = 0;
              Object.values(dayMap).forEach((val) => {
                if (val === 'permission') permission += 1;
                else if (val === 'absent') absent += 1;
                else if (val === 'present') present += 1;
              });
              nextMap[`${cid}__${stId}`] = { permission, absent, present };
            }
          );
        });
        setAttendanceMap({ byClassStudent: nextMap });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAttendance(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedClassIds, selectedMonth]);

  // Close popovers when clicking outside
  useEffect(() => {
    if (!isClassMenuOpen && !isStudentMenuOpen && !isSubjectMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (isClassMenuOpen && classMenuRef.current && !classMenuRef.current.contains(target)) {
        setIsClassMenuOpen(false);
      }
      if (isStudentMenuOpen && studentMenuRef.current && !studentMenuRef.current.contains(target)) {
        setIsStudentMenuOpen(false);
      }
      if (isSubjectMenuOpen && subjectMenuRef.current && !subjectMenuRef.current.contains(target)) {
        setIsSubjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isClassMenuOpen, isStudentMenuOpen, isSubjectMenuOpen]);

  const activeSheetSpec =
    paperMode === 'a4_landscape_2up'
      ? REPORT_CARD_A4_LANDSCAPE_SPEC
      : REPORT_CARD_A5_PORTRAIT_SPEC;

  // Responsive preview zoom accounting for Left Sidebar
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const sideOffset = isSidebarOpen && window.innerWidth >= 960 ? 404 : 48;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      setPreviewScale(Math.min(1, availW / activeSheetSpec.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, isSidebarOpen, activeSheetSpec.sheetWPx]);

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
    styleEl.textContent = activeSheetSpec.pageCss;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen, activeSheetSpec.pageCss]);

  const activeTheme: ReportCardPastelTheme = useMemo(
    () =>
      REPORT_CARD_PASTEL_THEMES.find((t) => t.id === themeId) || REPORT_CARD_PASTEL_THEMES[0],
    [themeId]
  );

  const selectedClassObjects = useMemo(() => {
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses.filter((c) => selectedSet.has(c.id));
  }, [sortedClasses, selectedClassIds]);

  // All active columns from the score entry table + 3 trait columns for the selected classes & month
  const availableSubjectItems: ReportCardSubjectFilterItem[] = useMemo(
    () =>
      getReportCardAvailableSubjectItems({
        selectedClasses: selectedClassObjects,
        monthCoeffMap,
        scoreSettings,
      }),
    [selectedClassObjects, monthCoeffMap, scoreSettings]
  );

  const visibleSubjectCount = useMemo(() => {
    const hiddenSet = new Set(hiddenSubjectKeys);
    return availableSubjectItems.filter(
      (item) =>
        !hiddenSet.has(item.key) &&
        (includeExamColumns || item.kind !== 'exam') &&
        (includeTraitPunctuality || item.key !== 'punctuality')
    ).length;
  }, [availableSubjectItems, hiddenSubjectKeys, includeExamColumns, includeTraitPunctuality]);

  const filteredSubjectItems = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return availableSubjectItems;
    return availableSubjectItems.filter(
      (item) =>
        item.labelKh.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
    );
  }, [availableSubjectItems, subjectSearch]);

  const toggleSubjectVisibility = (key: string) => {
    setHiddenSubjectKeys((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        if (key === 'quiz' || key === 'exercise' || key === 'test') {
          setIncludeExamColumns(true);
        }
        if (key === 'punctuality') {
          setIncludeTraitPunctuality(true);
        }
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  // Build all candidate student report cards for selected classes
  const allCandidateCards: StudentReportCardData[] = useMemo(() => {
    return selectedClassObjects
      .flatMap((classObj) => {
        const classScoreRows = allScores.filter(
          (s: any) => s?.classId === classObj.id && s?.month === selectedMonth
        );
        return buildStudentReportCardsForClass({
          classObj,
          allStudents,
          allTeachers,
          allClasses: classes,
          classScoreRows,
          monthCoeffMap,
          scoreSettings,
          sortMode,
          splitBehavior,
          includeUnscored: includeUnscored || Boolean(initialStudentId),
          includeExamColumns,
          includeTraitPunctuality,
          hiddenSubjectKeys,
          attendanceMap,
        });
      });
  }, [
    selectedClassObjects,
    allScores,
    selectedMonth,
    allStudents,
    allTeachers,
    classes,
    monthCoeffMap,
    scoreSettings,
    sortMode,
    splitBehavior,
    includeUnscored,
    initialStudentId,
    includeExamColumns,
    includeTraitPunctuality,
    hiddenSubjectKeys,
    attendanceMap,
  ]);

  // If opened from a specific student's row, pre-filter strictly to that student once per open
  const hasAppliedInitialStudentRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      hasAppliedInitialStudentRef.current = false;
    }
  }, [isOpen, initialStudentId]);

  useEffect(() => {
    if (!isOpen || !initialStudentId || hasAppliedInitialStudentRef.current || allCandidateCards.length === 0) return;
    const found = allCandidateCards.find(
      (c) =>
        c.studentDocId === initialStudentId ||
        c.studentId === initialStudentId ||
        c.uid.endsWith(`__${initialStudentId}`)
    );
    if (found) {
      hasAppliedInitialStudentRef.current = true;
      setSelectedStudentUids([found.uid]);
      setEditingRecUid(found.uid);
    }
  }, [isOpen, initialStudentId, allCandidateCards]);

  // Keep active recommendation selector valid
  useEffect(() => {
    if (allCandidateCards.length === 0) {
      setEditingRecUid('');
      return;
    }
    if (!editingRecUid || !allCandidateCards.some((c) => c.uid === editingRecUid)) {
      setEditingRecUid(allCandidateCards[0].uid);
    }
  }, [allCandidateCards, editingRecUid]);

  const activeCards: StudentReportCardData[] = useMemo(() => {
    if (selectedStudentUids === null) return allCandidateCards;
    const set = new Set(selectedStudentUids);
    return allCandidateCards.filter((c) => set.has(c.uid));
  }, [allCandidateCards, selectedStudentUids]);

  // Pair cards 2-up for A4 Landscape or 1-up for A5 Portrait
  const renderedPages = useMemo(() => {
    if (paperMode === 'a5_portrait_single') {
      return activeCards.map((st, idx) => ({
        key: `a5-${st.uid}-${idx}`,
        label: `${st.fullName} (ថ្នាក់ ${st.classCode} • A5 បញ្ឈរ)`,
        left: st,
        right: null as StudentReportCardData | null,
      }));
    }
    const pairs: {
      key: string;
      label: string;
      left: StudentReportCardData;
      right: StudentReportCardData | null;
    }[] = [];
    for (let i = 0; i < activeCards.length; i += 2) {
      const left = activeCards[i];
      const right = activeCards[i + 1] || null;
      pairs.push({
        key: `a4l-${left.uid}-${right?.uid || 'single'}`,
        label: right
          ? `${left.fullName} + ${right.fullName} (2 សន្លឹក A5 លើ A4 ផ្ដេក)`
          : `${left.fullName} (1 សន្លឹក A5 លើ A4 ផ្ដេក)`,
        left,
        right,
      });
    }
    return pairs;
  }, [activeCards, paperMode]);

  // Keep activePageIdx valid whenever renderedPages shrinks or filters change
  useEffect(() => {
    if (renderedPages.length === 0) {
      setActivePageIdx(0);
    } else if (activePageIdx >= renderedPages.length) {
      setActivePageIdx(renderedPages.length - 1);
    }
  }, [renderedPages.length, activePageIdx]);

  const handlePrint = () => {
    if (typeof window === 'undefined' || renderedPages.length === 0) return;

    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = activeSheetSpec.pageCss;

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
        reportCardLogoUrl: logoUrl.trim(),
        resultStampUrl: stampUrl.trim(),
        resultSignatureUrl: signatureUrl.trim(),
        resultSignatoryName: signatoryName.trim() || 'សំរិត វឌ្ឍនៈ',
      });
      setSaveFeedback('បានរក្សាទុក!');
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch (err) {
      console.error('Failed saving student report branding:', err);
      setSaveFeedback('បរាជ័យ!');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const getDocOptions = () => ({
    paperMode,
    themeId,
    sortMode,
    splitBehavior,
    includeUnscored,
    includeExamColumns,
    includeTraitPunctuality,
    hiddenSubjectKeys,
    singlePageView,
    showStudentPhoto,
    showNumericScores,
    showAttendance,
    showStampAndSignature,
    showParentComments,
    showCutGuide,
    logoHeightMm,
    stampSizeMm,
    signatureHeightMm,
    customTitle,
    approvalLabelKh,
    principalTitleKh,
    teacherTitleKh,
  });

  const applyDocOptions = (opts: Record<string, any>) => {
    if (opts.paperMode === 'a4_landscape_2up' || opts.paperMode === 'a5_portrait_single') {
      setPaperMode(opts.paperMode);
    }
    if (typeof opts.themeId === 'string') setThemeId(opts.themeId);
    if (opts.sortMode) setSortMode(opts.sortMode as ReportCardSortMode);
    if (opts.splitBehavior) setSplitBehavior(opts.splitBehavior);
    if (typeof opts.includeUnscored === 'boolean') setIncludeUnscored(opts.includeUnscored);
    if (typeof opts.includeExamColumns === 'boolean') setIncludeExamColumns(opts.includeExamColumns);
    if (typeof opts.includeTraitPunctuality === 'boolean') setIncludeTraitPunctuality(opts.includeTraitPunctuality);
    if (Array.isArray(opts.hiddenSubjectKeys)) {
      setHiddenSubjectKeys(opts.hiddenSubjectKeys.map((k: unknown) => String(k)));
    }
    if (typeof opts.singlePageView === 'boolean') setSinglePageView(opts.singlePageView);
    if (typeof opts.showStudentPhoto === 'boolean') setShowStudentPhoto(opts.showStudentPhoto);
    if (typeof opts.showNumericScores === 'boolean') setShowNumericScores(opts.showNumericScores);
    if (typeof opts.showAttendance === 'boolean') setShowAttendance(opts.showAttendance);
    if (typeof opts.showStampAndSignature === 'boolean') setShowStampAndSignature(opts.showStampAndSignature);
    if (typeof opts.showParentComments === 'boolean') setShowParentComments(opts.showParentComments);
    if (typeof opts.showCutGuide === 'boolean') setShowCutGuide(opts.showCutGuide);
    if (typeof opts.logoHeightMm === 'number') setLogoHeightMm(opts.logoHeightMm);
    if (typeof opts.stampSizeMm === 'number') setStampSizeMm(opts.stampSizeMm);
    if (typeof opts.signatureHeightMm === 'number') setSignatureHeightMm(opts.signatureHeightMm);
    if (typeof opts.customTitle === 'string') setCustomTitle(opts.customTitle);
    if (typeof opts.approvalLabelKh === 'string') setApprovalLabelKh(opts.approvalLabelKh);
    if (typeof opts.principalTitleKh === 'string') setPrincipalTitleKh(opts.principalTitleKh);
    if (typeof opts.teacherTitleKh === 'string') setTeacherTitleKh(opts.teacherTitleKh);
  };

  const toggleClassId = (id: string) => {
    setSelectedStudentUids(null);
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStudentUid = (uid: string) => {
    setSelectedStudentUids((prev) => {
      const current = prev === null ? allCandidateCards.map((c) => c.uid) : prev;
      return current.includes(uid)
        ? current.filter((x) => x !== uid)
        : [...current, uid];
    });
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

  const filteredStudentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return allCandidateCards;
    return allCandidateCards.filter(
      (st) =>
        st.fullName.toLowerCase().includes(q) ||
        st.englishName.toLowerCase().includes(q) ||
        st.studentId.toLowerCase().includes(q) ||
        st.classCode.toLowerCase().includes(q)
    );
  }, [allCandidateCards, studentSearch]);

  if (!isOpen || typeof document === 'undefined') return null;

  const classButtonLabel =
    selectedClassIds.length === 0
      ? 'ជ្រើសរើសថ្នាក់...'
      : selectedClassIds.length === sortedClasses.length && sortedClasses.length > 0
        ? `គ្រប់ថ្នាក់ (${sortedClasses.length})`
        : selectedClassIds.length === 1
          ? (() => {
              const found = sortedClasses.find((c) => c.id === selectedClassIds[0]);
              return found ? `ថ្នាក់ ${found.classCode || found.className}` : '1 ថ្នាក់';
            })()
          : `បានជ្រើស ${selectedClassIds.length} ថ្នាក់`;

  const studentButtonLabel =
    selectedStudentUids === null
      ? `សិស្សទាំងអស់ (${allCandidateCards.length})`
      : selectedStudentUids.length === 1
        ? (() => {
            const st = allCandidateCards.find((c) => c.uid === selectedStudentUids[0]);
            return st ? st.fullName : '1 នាក់';
          })()
        : `បានជ្រើស ${activeCards.length} / ${allCandidateCards.length} នាក់`;

  const sharedCardProps: StudentReportCardSharedProps = {
    monthStr: selectedMonth,
    customTitle,
    khmerIssueDate,
    theme: activeTheme,
    logoUrl,
    logoHeightMm,
    stampUrl,
    signatureUrl,
    signatoryName,
    principalTitleKh,
    teacherTitleKh,
    approvalLabelKh,
    schoolProfile,
    showStudentPhoto,
    showNumericScores,
    showAttendance,
    showStampAndSignature,
    showParentComments,
    stampSizeMm,
    signatureHeightMm,
    customRecommendations,
  };

  const editingStudentObj =
    allCandidateCards.find((c) => c.uid === editingRecUid) || allCandidateCards[0] || null;

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

  const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    padding: '0.62rem 0.7rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.46rem',
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
      {/* Top Action & Filter Toolbar (Hidden on Print) */}
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.48rem' }}>
            {/* Title Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', color: '#f8fafc', fontWeight: 800, fontSize: '0.92rem' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #0ea5e9, #8b5cf6)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="file-text" size={15} strokeWidth={2.2} />
              </span>
              <span>លទ្ធផលសិក្សាសិស្សម្នាក់ៗ (A5 → A4 ផ្ដេក)</span>
            </div>

            {/* Class Picker */}
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
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  minWidth: '145px',
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
                    maxHeight: '350px',
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
                      onClick={() => {
                        setSelectedStudentUids(null);
                        setSelectedClassIds(sortedClasses.map((c) => c.id));
                      }}
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
                      onClick={() => {
                        setSelectedStudentUids(null);
                        setSelectedClassIds(
                          sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0).map((c) => c.id)
                        );
                      }}
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
                      onClick={() => {
                        setSelectedStudentUids(null);
                        setSelectedClassIds([]);
                      }}
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

            {/* Individual Student Picker */}
            <div ref={studentMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsStudentMenuOpen((v) => !v)}
                style={{
                  padding: '0.38rem 0.65rem',
                  borderRadius: '8px',
                  background: selectedStudentUids !== null ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                  border: `1px solid ${isStudentMenuOpen || selectedStudentUids !== null ? '#34d399' : 'rgba(148, 163, 184, 0.35)'}`,
                  color: '#f8fafc',
                  fontSize: '0.79rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  minWidth: '150px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                  {studentButtonLabel}
                </span>
                <AppIcon name="chevron-down" size={14} />
              </button>

              {isStudentMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '320px',
                    maxHeight: '370px',
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
                    placeholder="ស្វែងរកឈ្មោះសិស្ស ឬអត្តលេខ..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={fieldInputStyle}
                  />
                  <div style={{ display: 'flex', gap: '0.32rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentUids(null)}
                      style={{
                        flex: 1,
                        padding: '0.26rem 0.4rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.14)',
                        color: '#6ee7b7',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ទាំងអស់ ({allCandidateCards.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentUids([])}
                      style={{
                        padding: '0.26rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ដកចេញទាំងអស់
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '240px' }}>
                    {filteredStudentOptions.map((st) => {
                      const checked =
                        selectedStudentUids === null || selectedStudentUids.includes(st.uid);
                      return (
                        <label
                          key={st.uid}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.32rem 0.45rem',
                            borderRadius: '6px',
                            background: checked ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                            color: '#f1f5f9',
                            fontSize: '0.77rem',
                            cursor: 'pointer',
                            gap: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudentUid(st.uid)}
                            />
                            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {st.fullName}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                              ({st.classCode})
                            </span>
                          </div>
                          {st.rankDisplay && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.06rem 0.35rem',
                                borderRadius: '999px',
                                background: 'rgba(251, 191, 36, 0.18)',
                                color: '#fde68a',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              #{st.rankDisplay}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Columns Dropdown Checkbox (Show/Hide Score-Table Subjects on Print) */}
            <div ref={subjectMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsSubjectMenuOpen((v) => !v)}
                style={{
                  padding: '0.38rem 0.65rem',
                  borderRadius: '8px',
                  background:
                    visibleSubjectCount < availableSubjectItems.length
                      ? 'rgba(245, 158, 11, 0.2)'
                      : '#1e293b',
                  border: `1px solid ${
                    isSubjectMenuOpen || visibleSubjectCount < availableSubjectItems.length
                      ? '#fbbf24'
                      : 'rgba(148, 163, 184, 0.35)'
                  }`,
                  color: '#f8fafc',
                  fontSize: '0.79rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.36rem',
                }}
                title="ជ្រើសរើសមុខវិជ្ជាពីតារាងបញ្ចូលពិន្ទុ ដើម្បីបង្ហាញ ឬលាក់ពេល Print"
              >
                <AppIcon name="sliders" size={13} />
                <span>
                  មុខវិជ្ជា ({visibleSubjectCount}/{availableSubjectItems.length})
                </span>
                <AppIcon name="chevron-down" size={14} />
              </button>

              {isSubjectMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '320px',
                    maxHeight: '390px',
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
                  <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#fde68a' }}>
                    មុខវិជ្ជាពីតារាងបញ្ចូលពិន្ទុ (បង្ហាញ/លាក់ពេល Print)
                  </div>
                  <input
                    type="text"
                    placeholder="ស្វែងរកមុខវិជ្ជា..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    style={fieldInputStyle}
                  />
                  <div style={{ display: 'flex', gap: '0.32rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setHiddenSubjectKeys([]);
                        setIncludeExamColumns(true);
                        setIncludeTraitPunctuality(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.26rem 0.4rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.14)',
                        color: '#6ee7b7',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      បង្ហាញទាំងអស់
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIncludeExamColumns(false);
                        setHiddenSubjectKeys((prev) =>
                          Array.from(new Set([...prev, 'quiz', 'exercise', 'test']))
                        );
                      }}
                      style={{
                        padding: '0.26rem 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(251, 191, 36, 0.38)',
                        background: 'rgba(251, 191, 36, 0.12)',
                        color: '#fde68a',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      លាក់ Quiz/Ex/Test
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHiddenSubjectKeys(availableSubjectItems.map((item) => item.key))
                      }
                      style={{
                        padding: '0.26rem 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#fca5a5',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      លាក់អស់
                    </button>
                  </div>

                  <div
                    style={{
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.22rem',
                      maxHeight: '245px',
                    }}
                  >
                    {filteredSubjectItems.map((item) => {
                      const isShown =
                        !hiddenSubjectKeys.includes(item.key) &&
                        (includeExamColumns || item.kind !== 'exam') &&
                        (includeTraitPunctuality || item.key !== 'punctuality');
                      return (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.32rem 0.45rem',
                            borderRadius: '6px',
                            background: isShown ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                            color: '#f1f5f9',
                            fontSize: '0.77rem',
                            cursor: 'pointer',
                            gap: '0.38rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isShown}
                              onChange={() => toggleSubjectVisibility(item.key)}
                            />
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: item.dotColor,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.labelKh}
                            </span>
                            {item.labelEn && item.labelEn !== item.labelKh && (
                              <span style={{ color: '#94a3b8', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                ({item.labelEn})
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              padding: '0.06rem 0.36rem',
                              borderRadius: '999px',
                              background:
                                item.kind === 'exam'
                                  ? 'rgba(99, 102, 241, 0.22)'
                                  : item.kind === 'trait'
                                    ? 'rgba(14, 165, 233, 0.2)'
                                    : 'rgba(16, 185, 129, 0.18)',
                              color:
                                item.kind === 'exam'
                                  ? '#c7d2fe'
                                  : item.kind === 'trait'
                                    ? '#7dd3fc'
                                    : '#6ee7b7',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.kind === 'exam'
                              ? 'ប្រឡង'
                              : item.kind === 'trait'
                                ? 'វាយតម្លៃ'
                                : 'មុខវិជ្ជា'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Single-Page Preview View Checkbox */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.36rem',
                padding: '0.35rem 0.62rem',
                borderRadius: '8px',
                background: singlePageView ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                border: `1px solid ${singlePageView ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}`,
                color: singlePageView ? '#e0f2fe' : '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
              title="ធីកដើម្បីមើលផ្ទាំងលទ្ធផលម្ដងមួយទំព័រ (នៅពេល Print នៅតែព្រីនគ្រប់ទំព័រទាំងអស់)"
            >
              <input
                type="checkbox"
                checked={singlePageView}
                onChange={(e) => setSinglePageView(e.target.checked)}
                style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <span>មើលម្ដង ១ ទំព័រ</span>
            </label>

            {/* Month Picker */}
            <input
              type="month"
              value={selectedMonth.startsWith('FINAL_') ? '' : selectedMonth}
              onChange={(e) => {
                if (e.target.value) onMonthChange(e.target.value);
              }}
              style={{
                padding: '0.36rem 0.54rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.79rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />

            {isLoadingAttendance && (
              <span style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
                កំពុងទាញវត្តមាន...
              </span>
            )}
          </div>

          {/* Right Actions: Sidebar toggle, Print, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
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
              <span>{isSidebarOpen ? 'លាក់ការកំណត់' : 'ការកំណត់ ពណ៌ & Font'}</span>
            </button>

            <PrintExportControls
              getExportElements={() =>
                collectPrintSheetElements(
                  portalRootRef.current,
                  '.receipt-a4-sheets-container .receipt-a4-preview-scale > *'
                )
              }
              fileNameBase={`bsis-report-cards-${selectedMonth || 'export'}`}
              disabled={renderedPages.length === 0}
            />

            <button
              type="button"
              onClick={handlePrint}
              disabled={renderedPages.length === 0}
              style={{
                padding: '0.44rem 0.92rem',
                borderRadius: '8px',
                background:
                  renderedPages.length === 0
                    ? '#475569'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: renderedPages.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.38rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              }}
            >
              <AppIcon name="printer" size={15} strokeWidth={2.2} />
              <span>
                ព្រីន ({activeCards.length} សិស្ស • {renderedPages.length} ទំព័រ)
              </span>
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

      {/* Two-Column Split Workspace */}
      <PrintTableOverrideStyles
        scopeId="student-report-print"
        styleConfig={printStyle.styleConfig}
        tableSelection={tableSelection}
      />
      <div className="print-workspace-body">
        {isSidebarOpen && (
          <PrintStyleSidebar
            title="ការកំណត់លទ្ធផលសិស្ស (A5)"
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
            {/* 1. Paper Mode, Sort & 10 Formal Solid Light Themes */}
            <div data-sidebar-section="layout" style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>
                ខ្នាតក្រដាស A5 &amp; គំរូពណ៌ផ្លូវការ (១០ ជម្រើស)
              </div>

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
                  onClick={() => setPaperMode('a4_landscape_2up')}
                  style={{
                    padding: '0.3rem 0.35rem',
                    borderRadius: '5px',
                    border: 'none',
                    background: paperMode === 'a4_landscape_2up' ? '#059669' : 'transparent',
                    color: paperMode === 'a4_landscape_2up' ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  A4 ផ្ដេក (2×A5)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperMode('a5_portrait_single')}
                  style={{
                    padding: '0.3rem 0.35rem',
                    borderRadius: '5px',
                    border: 'none',
                    background: paperMode === 'a5_portrait_single' ? '#2563eb' : 'transparent',
                    color: paperMode === 'a5_portrait_single' ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  A5 បញ្ឈរ (1/ទំព័រ)
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.24rem', fontWeight: 600 }}>
                  គំរូពណ៌ Solid ស្រាលផ្លូវការ ({REPORT_CARD_PASTEL_THEMES.length} ជម្រើស)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.26rem' }}>
                  {REPORT_CARD_PASTEL_THEMES.map((t, idx) => {
                    const isSelected = t.id === activeTheme.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeId(t.id)}
                        title={`${idx + 1}. ${t.nameKh} — ${t.descriptionKh}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.32rem',
                          padding: '0.25rem 0.38rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.16)' : '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.69rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '12px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            border: '1px solid rgba(255,255,255,0.4)',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ width: '40%', height: '100%', background: t.swatch[0] }} />
                          <span style={{ width: '60%', height: '100%', background: t.swatch[1] }} />
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idx + 1}. {t.shortNameKh}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    តម្រៀបសិស្ស
                  </label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as ReportCardSortMode)}
                    style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                  >
                    <option value="rank_asc">ចំណាត់ថ្នាក់ (១→N)</option>
                    <option value="name_asc">ឈ្មោះ (ក→អ)</option>
                    <option value="level_name">វគ្គ &amp; ឈ្មោះ</option>
                    <option value="student_id">អត្តលេខ (ID)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                    បំបែកតាមវគ្គ
                  </label>
                  <select
                    value={splitBehavior}
                    onChange={(e) => setSplitBehavior(e.target.value as 'auto' | 'always' | 'never')}
                    style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                  >
                    <option value="auto">តាមថ្នាក់</option>
                    <option value="always">បំបែកគ្រប់វគ្គ</option>
                    <option value="never">រួមទាំងថ្នាក់</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Student Info, Photo & Score Columns Toggles */}
            <div data-sidebar-section="student-info" style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7b7' }}>
                ព័ត៌មានសិស្ស រូបថត &amp; មុខវិជ្ជា
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.73rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showStudentPhoto} onChange={(e) => setShowStudentPhoto(e.target.checked)} />
                  <span>រូបថតសិស្ស</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showNumericScores} onChange={(e) => setShowNumericScores(e.target.checked)} />
                  <span>បង្ហាញលេខពិន្ទុ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={
                      includeExamColumns &&
                      !hiddenSubjectKeys.includes('quiz') &&
                      !hiddenSubjectKeys.includes('exercise') &&
                      !hiddenSubjectKeys.includes('test')
                    }
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIncludeExamColumns(next);
                      setHiddenSubjectKeys((prev) =>
                        next
                          ? prev.filter((k) => k !== 'quiz' && k !== 'exercise' && k !== 'test')
                          : Array.from(new Set([...prev, 'quiz', 'exercise', 'test']))
                      );
                    }}
                  />
                  <span>Quiz / Ex / Test</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeTraitPunctuality && !hiddenSubjectKeys.includes('punctuality')}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIncludeTraitPunctuality(next);
                      setHiddenSubjectKeys((prev) =>
                        next
                          ? prev.filter((k) => k !== 'punctuality')
                          : Array.from(new Set([...prev, 'punctuality']))
                      );
                    }}
                  />
                  <span>ឧស្សាហ៍ព្យាយាម</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeUnscored} onChange={(e) => setIncludeUnscored(e.target.checked)} />
                  <span>សិស្សអត់ពិន្ទុ</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7dd3fc', cursor: 'pointer', fontWeight: 700 }}>
                  <input type="checkbox" checked={singlePageView} onChange={(e) => setSinglePageView(e.target.checked)} />
                  <span>មើលម្ដង ១ ទំព័រ</span>
                </label>
                {paperMode === 'a4_landscape_2up' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCutGuide} onChange={(e) => setShowCutGuide(e.target.checked)} />
                    <span>បន្ទាត់កាត់កណ្ដាល</span>
                  </label>
                )}
              </div>
            </div>

            {/* 3. Logo, Stamp, Signature & Title Links */}
            <div data-sidebar-section="branding" style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                ឡូហ្គោសាលា (Link), ត្រា &amp; ចំណងជើង
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.16rem' }}>
                  Link រូបភាពឡូហ្គោសាលា (បង្ហាញ 100% តាមរូប Link)
                </label>
                <div style={{ display: 'flex', gap: '0.26rem' }}>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="បិទភ្ជាប់ Link រូបភាពឡូហ្គោសាលា..."
                    style={{ ...fieldInputStyle, flex: 1 }}
                  />
                  {logoUrl !== DEFAULT_RECEIPT_HEADER_DRIVE_URL && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(DEFAULT_RECEIPT_HEADER_DRIVE_URL)}
                      title="ត្រឡប់ប្រើ Link រូបឡូហ្គោសាលាដើម"
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(147, 197, 253, 0.4)',
                        background: 'rgba(59, 130, 246, 0.16)',
                        color: '#93c5fd',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="refresh-cw" size={12} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '0.32rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1' }}>
                    <span>កម្ពស់រូបឡូហ្គោ</span>
                    <span style={{ color: '#93c5fd', fontWeight: 700 }}>{logoHeightMm} mm</span>
                  </label>
                  <input
                    type="range"
                    min={9}
                    max={24}
                    step={0.5}
                    value={logoHeightMm}
                    onChange={(e) => setLogoHeightMm(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.16rem' }}>
                  ចំណងជើងបន្ថែម (ទុកទំនេរ = ស្វ័យប្រវត្តិតាមខែ/ឆ្នាំ)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="ឧ. លទ្ធផលសិក្សាប្រចាំខែវិច្ឆិកា 2026"
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#fda4af', marginBottom: '0.14rem', fontWeight: 600 }}>
                    Link ត្រា (Stamp)
                  </label>
                  <input
                    type="text"
                    value={stampUrl}
                    onChange={(e) => setStampUrl(e.target.value)}
                    placeholder="ត្រា BSIS ដើម..."
                    style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#c4b5fd', marginBottom: '0.14rem', fontWeight: 600 }}>
                    Link ហត្ថលេខា
                  </label>
                  <input
                    type="text"
                    value={signatureUrl}
                    onChange={(e) => setSignatureUrl(e.target.value)}
                    placeholder="ប៊ិកខៀវដើម..."
                    style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                  />
                </div>
              </div>

              {onSaveBrandingSettings && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700 }}>
                    {saveFeedback}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    style={{
                      padding: '0.32rem 0.68rem',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: isSavingBranding ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <AppIcon name="check" size={13} strokeWidth={2.5} />
                    <span>{isSavingBranding ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក Link'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Attendance, Date, Signatures & Parent Comments */}
            <div data-sidebar-section="footer-sign" style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fda4af' }}>
                វត្តមាន កាលបរិច្ឆេទ ហត្ថលេខា &amp; មតិមាតាបិតា
              </div>

              <div data-sidebar-section="parent-comments" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.73rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showAttendance} onChange={(e) => setShowAttendance(e.target.checked)} />
                  <span>វត្តមាន</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showStampAndSignature} onChange={(e) => setShowStampAndSignature(e.target.checked)} />
                  <span>ត្រា &amp; នាយក</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showParentComments} onChange={(e) => setShowParentComments(e.target.checked)} />
                  <span>មតិមាតាបិតា</span>
                </label>
              </div>

              <input
                type="text"
                value={khmerIssueDate}
                onChange={(e) => setKhmerIssueDate(e.target.value)}
                placeholder="ថ្ងៃទី28 ខែវិច្ឆិកា ឆ្នាំ2026"
                style={fieldInputStyle}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={approvalLabelKh}
                  onChange={(e) => setApprovalLabelKh(e.target.value)}
                  placeholder="បានឃើញ និងឯកភាព"
                  style={fieldInputStyle}
                />
                <input
                  type="text"
                  value={principalTitleKh}
                  onChange={(e) => setPrincipalTitleKh(e.target.value)}
                  placeholder="នាយក"
                  style={fieldInputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="ឈ្មោះនាយក"
                  style={fieldInputStyle}
                />
                <input
                  type="text"
                  value={teacherTitleKh}
                  onChange={(e) => setTeacherTitleKh(e.target.value)}
                  placeholder="គ្រូប្រចាំថ្នាក់"
                  style={fieldInputStyle}
                />
              </div>

              {showStampAndSignature && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1' }}>
                      <span>ទំហំត្រា</span>
                      <span style={{ color: '#fda4af', fontWeight: 700 }}>{stampSizeMm} mm</span>
                    </label>
                    <input
                      type="range"
                      min={16}
                      max={40}
                      step={0.5}
                      value={stampSizeMm}
                      onChange={(e) => setStampSizeMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1' }}>
                      <span>ហត្ថលេខា</span>
                      <span style={{ color: '#93c5fd', fontWeight: 700 }}>{signatureHeightMm} mm</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={18}
                      step={0.5}
                      value={signatureHeightMm}
                      onChange={(e) => setSignatureHeightMm(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Per-Student Recommendation Editor */}
            {editingStudentObj && (
              <div data-sidebar-section="recommendations" style={cardStyle}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fde68a' }}>
                  កែមតិណែនាំសិស្ស (Recommendation)
                </div>
                <select
                  value={editingStudentObj.uid}
                  onChange={(e) => setEditingRecUid(e.target.value)}
                  style={{ ...fieldInputStyle, fontSize: '0.72rem' }}
                >
                  {allCandidateCards.map((st) => (
                    <option key={st.uid} value={st.uid}>
                      {st.fullName} ({st.classCode})
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={
                    customRecommendations[editingStudentObj.uid] !== undefined
                      ? customRecommendations[editingStudentObj.uid]
                      : editingStudentObj.autoRecommendation
                  }
                  onChange={(e) =>
                    setCustomRecommendations((prev) => ({
                      ...prev,
                      [editingStudentObj.uid]: e.target.value,
                    }))
                  }
                  style={{
                    ...fieldInputStyle,
                    resize: 'vertical',
                    lineHeight: 1.45,
                  }}
                />
                {customRecommendations[editingStudentObj.uid] !== undefined && (
                  <button
                    type="button"
                    onClick={() =>
                      setCustomRecommendations((prev) => {
                        const next = { ...prev };
                        delete next[editingStudentObj.uid];
                        return next;
                      })
                    }
                    style={{
                      alignSelf: 'flex-end',
                      padding: '0.16rem 0.5rem',
                      borderRadius: '5px',
                      border: '1px solid rgba(251, 191, 36, 0.45)',
                      background: 'rgba(251, 191, 36, 0.14)',
                      color: '#fde68a',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ប្រើមតិណែនាំស្វ័យប្រវត្តិវិញ
                  </button>
                )}
              </div>
            )}
          </PrintStyleSidebar>
        )}

        {/* Right Live Preview Canvas */}
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
                  maxWidth: '450px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
                  មិនមានទិន្នន័យសិស្សសម្រាប់បង្ហាញ
                </div>
                <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  សូមជ្រើសរើសថ្នាក់រៀន ឬគ្រីស «សិស្សអត់ពិន្ទុ» នៅផ្ទាំងខាងឆ្វេង ដើម្បីមើលគំរូ និងព្រីនលទ្ធផលសិស្សម្នាក់ៗ។
                </div>
              </div>
            ) : (
              <>
                {singlePageView && (
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
                      disabled={activePageIdx <= 0}
                      onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: activePageIdx <= 0 ? 'not-allowed' : 'pointer',
                        opacity: activePageIdx <= 0 ? 0.4 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <AppIcon name="chevron-left" size={14} />
                      ទំព័រមុន
                    </button>

                    <select
                      value={activePageIdx}
                      onChange={(e) => setActivePageIdx(Number(e.target.value))}
                      style={{
                        padding: '0.34rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        background: '#0f172a',
                        color: '#e0f2fe',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        outline: 'none',
                        maxWidth: '330px',
                      }}
                    >
                      {renderedPages.map((pageItem, pIdx) => (
                        <option key={pageItem.key} value={pIdx}>
                          ទំព័រទី {pIdx + 1} / {renderedPages.length} — {pageItem.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={activePageIdx >= renderedPages.length - 1}
                      onClick={() =>
                        setActivePageIdx((p) => Math.min(renderedPages.length - 1, p + 1))
                      }
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: activePageIdx >= renderedPages.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: activePageIdx >= renderedPages.length - 1 ? 0.4 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      ទំព័របន្ទាប់
                      <AppIcon name="chevron-right" size={14} />
                    </button>
                  </div>
                )}

                {renderedPages.map((pg, idx) => (
                  <div
                    key={pg.key}
                    className={
                      singlePageView && idx !== activePageIdx
                        ? 'report-card-hidden-screen'
                        : undefined
                    }
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
                      width: `${activeSheetSpec.sheetWPx * previewScale}px`,
                      height: `${activeSheetSpec.sheetHPx * previewScale}px`,
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
                        width: activeSheetSpec.sheetW,
                        height: activeSheetSpec.sheetH,
                      }}
                    >
                      <PrintInteractiveSheet
                        scopeId="student-report-print"
                        pageIdx={idx}
                        styleConfig={printStyle.styleConfig}
                        tableSelection={tableSelection}
                        onCellSelected={() => setIsSidebarOpen(true)}
                        onAreaSelected={handleAreaSelected}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {paperMode === 'a4_landscape_2up' ? (
                          <StudentReportPairA4LandscapeSheet
                            leftStudent={pg.left}
                            rightStudent={pg.right}
                            showCutGuide={showCutGuide}
                            shared={sharedCardProps}
                          />
                        ) : (
                          <StudentReportSingleA5Sheet
                            student={pg.left}
                            shared={sharedCardProps}
                          />
                        )}
                      </PrintInteractiveSheet>
                    </div>
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
