"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { patchTeacherTrackingMonth, settingsService, teacherService, teacherTrackingService } from '@/services/db';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { AppIcon } from '@/components/AppIcons';
import {
  CompletionDropdownStatus,
  EXAM_WEEK_KEY,
  ExamScheduleConfig,
  HOMEWORK_STATUS_LABELS,
  KHMER_MONTHS,
  MonthlyTrackingDoc,
  ScreenshotScope,
  TeacherWeekEntry,
  VIDEO_STATUS_LABELS,
  ViewTab,
  WEEK_META,
  WeekKey,
  applyDropdownStatusChange,
  applyStatusCountChange,
  buildGroupChatSummaryText,
  buildMonthlyTeacherSummaries,
  evaluateWeekEntry,
  exportTrackingExcel,
  formatIsoDateKh,
  formatMinutesLabel,
  hasAnyExamScheduleDate,
  hasExamConfigActive,
  isExamWeek,
  normalizeEntry,
  toNonNegInt,
} from '@/components/teacher-tracking/trackingModel';
import {
  ExamHeaderConfig,
  ExamStagesCell,
  IntStepper,
  SpecialTaskCell,
  StatusCountNoteCell,
  TeacherAvatar,
} from '@/components/teacher-tracking/TrackingControls';
import ScreenshotReportBoard from '@/components/teacher-tracking/ScreenshotReportBoard';
import ExamNoticeModal from '@/components/teacher-tracking/ExamNoticeModal';

export default function TeacherTrackingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState('');

  // Month & Year state
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(now.getMonth() + 1);
  const daysInSelectedMonth = useMemo(
    () => new Date(selectedYear, selectedMonthNum, 0).getDate(),
    [selectedYear, selectedMonthNum]
  );
  const defaultHasWeek5 = daysInSelectedMonth > 28;
  const monthKey = useMemo(
    () => `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`,
    [selectedYear, selectedMonthNum]
  );
  const monthDisplayKh = useMemo(
    () => `ខែ${KHMER_MONTHS[selectedMonthNum - 1]} ឆ្នាំ ${selectedYear}`,
    [selectedMonthNum, selectedYear]
  );

  // Teachers & Filters
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [showInactiveTeachers, setShowInactiveTeachers] = useState(false);
  const [hiddenTeacherIds, setHiddenTeacherIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tracking Document State for current month
  const [enableWeek5, setEnableWeek5] = useState(defaultHasWeek5);
  const [weekLabels, setWeekLabels] = useState<Partial<Record<WeekKey, string>>>({});
  const [examSchedules, setExamSchedules] = useState<Partial<Record<WeekKey, ExamScheduleConfig>>>({});
  const [records, setRecords] = useState<Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Navigation Tabs, Screenshot Modal & Exam Notice Letter Modal
  const [activeTab, setActiveTab] = useState<ViewTab>('w1');
  const [screenshotScope, setScreenshotScope] = useState<ScreenshotScope>('w1');
  const [screenshotLightCard, setScreenshotLightCard] = useState(true);
  const [screenshotShowDetails, setScreenshotShowDetails] = useState(true);
  const [isFullscreenShot, setIsFullscreenShot] = useState(false);
  const [hideFullscreenToolbar, setHideFullscreenToolbar] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isExamNoticeOpen, setIsExamNoticeOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [schoolName, setSchoolName] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('schoolName') || 'សាលាអន្តរជាតិប្រេនស្តម'
      : 'សាលាអន្តរជាតិប្រេនស្តម'
  );

  // Safe Debounced Auto-Save Refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const dirtyMetaFieldsRef = useRef<
    Set<'enableWeek5' | 'hiddenTeacherIds' | 'weekLabels' | 'examSchedules'>
  >(new Set());
  const dirtyRecordPathsRef = useRef<Set<string>>(new Set());
  const latestPayloadRef = useRef<{
    month: string;
    enableWeek5: boolean;
    hiddenTeacherIds: string[];
    weekLabels: Partial<Record<WeekKey, string>>;
    examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>;
    records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  }>({
    month: monthKey,
    enableWeek5: defaultHasWeek5,
    hiddenTeacherIds: [],
    weekLabels: {},
    examSchedules: {},
    records: {},
  });

  useEffect(() => {
    setMounted(true);
    const currentRole = localStorage.getItem('userRole') || '';
    const currentName = localStorage.getItem('userName') || 'Admin';
    setRole(currentRole);
    setAdminName(currentName);

    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubTeachers = teacherService.subscribeAll((data) => {
      const sorted = [...data].sort((a: any, b: any) =>
        String(a.teacherId || a.fullName || '').localeCompare(
          String(b.teacherId || b.fullName || ''),
          undefined,
          { numeric: true }
        )
      );
      setAllTeachers(sorted);
    });

    const unsubSettings = settingsService.subscribeOne('global', (docData) => {
      if (docData?.schoolName) {
        setSchoolName(String(docData.schoolName));
      }
    });

    return () => {
      unsubTeachers();
      unsubSettings();
    };
  }, [router]);

  // Subscribe to selected month's RTDB tracking doc
  useEffect(() => {
    if (role !== 'admin') return;
    setIsLoadingDoc(true);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtyMetaFieldsRef.current.clear();
    dirtyRecordPathsRef.current.clear();

    const unsubDoc = teacherTrackingService.subscribeOne(monthKey, (doc: MonthlyTrackingDoc | null) => {
      if (saveTimerRef.current || inFlightRef.current) {
        setIsLoadingDoc(false);
        return;
      }

      let storedHiddenFallback: string[] = [];
      try {
        const raw = localStorage.getItem('teacherTracking_hiddenIds');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) storedHiddenFallback = parsed;
      } catch {
        storedHiddenFallback = [];
      }

      if (doc) {
        const hasAnyW5Data =
          Boolean(doc.examSchedules?.w5 && hasExamConfigActive(doc.examSchedules.w5)) ||
          Object.values(doc.records || {}).some((teacherRec) => Boolean(teacherRec?.w5));
        const nextW5 =
          doc.enableWeek5 !== undefined
            ? Boolean(doc.enableWeek5) || hasAnyW5Data
            : defaultHasWeek5 || hasAnyW5Data;
        const nextHidden = Array.isArray(doc.hiddenTeacherIds) ? doc.hiddenTeacherIds : [];
        const nextLabels = doc.weekLabels || {};
        const nextExams = doc.examSchedules || {};
        const nextRecords = doc.records || {};

        setEnableWeek5(nextW5);
        setHiddenTeacherIds(nextHidden);
        setWeekLabels(nextLabels);
        setExamSchedules(nextExams);
        setRecords(nextRecords);
        latestPayloadRef.current = {
          month: monthKey,
          enableWeek5: nextW5,
          hiddenTeacherIds: nextHidden,
          weekLabels: nextLabels,
          examSchedules: nextExams,
          records: nextRecords,
        };
      } else {
        setEnableWeek5(defaultHasWeek5);
        setHiddenTeacherIds(storedHiddenFallback);
        setWeekLabels({});
        setExamSchedules({});
        setRecords({});
        latestPayloadRef.current = {
          month: monthKey,
          enableWeek5: defaultHasWeek5,
          hiddenTeacherIds: storedHiddenFallback,
          weekLabels: {},
          examSchedules: {},
          records: {},
        };
      }
      setIsLoadingDoc(false);
    });

    return () => {
      unsubDoc();
    };
  }, [monthKey, role, defaultHasWeek5]);

  // Close fullscreen screenshot on ESC
  useEffect(() => {
    if (!isFullscreenShot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hideFullscreenToolbar) setHideFullscreenToolbar(false);
        else setIsFullscreenShot(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreenShot, hideFullscreenToolbar]);

  // Keep activeTab & screenshotScope valid if Week 5 is disabled
  useEffect(() => {
    if (!enableWeek5) {
      if (activeTab === 'w5') setActiveTab('w4');
      if (screenshotScope === 'w5') setScreenshotScope('w4');
    }
  }, [enableWeek5, activeTab, screenshotScope]);

  const flushSave = useCallback(async () => {
    const payload = latestPayloadRef.current;
    const metaFieldsToSave = Array.from(dirtyMetaFieldsRef.current);
    const recordPathsToSave = Array.from(dirtyRecordPathsRef.current);

    if (metaFieldsToSave.length === 0 && recordPathsToSave.length === 0) {
      setSaveState('saved');
      return;
    }

    dirtyMetaFieldsRef.current.clear();
    dirtyRecordPathsRef.current.clear();

    const updatesMap: Record<string, unknown> = {};
    for (const metaKey of metaFieldsToSave) {
      if (metaKey === 'enableWeek5') updatesMap.enableWeek5 = payload.enableWeek5;
      else if (metaKey === 'hiddenTeacherIds') updatesMap.hiddenTeacherIds = payload.hiddenTeacherIds;
      else if (metaKey === 'weekLabels') updatesMap.weekLabels = payload.weekLabels;
      else if (metaKey === 'examSchedules') updatesMap.examSchedules = payload.examSchedules;
    }

    for (const pathKey of recordPathsToSave) {
      const slashIdx = pathKey.indexOf('/');
      if (slashIdx <= 0) continue;
      const tid = pathKey.slice(0, slashIdx);
      const wk = pathKey.slice(slashIdx + 1) as WeekKey;
      const entry = payload.records?.[tid]?.[wk];
      if (!entry) continue;
      const cleanEntry: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(entry)) {
        if (v !== undefined) cleanEntry[k] = v;
      }
      updatesMap[`records/${tid}/${wk}`] = cleanEntry;
    }

    if (Object.keys(updatesMap).length === 0) {
      setSaveState('saved');
      return;
    }

    inFlightRef.current = true;
    setSaveState('saving');
    let saveFailed = false;
    try {
      await patchTeacherTrackingMonth(payload.month, updatesMap);
      if (
        dirtyMetaFieldsRef.current.size === 0 &&
        dirtyRecordPathsRef.current.size === 0 &&
        !saveTimerRef.current
      ) {
        setSaveState('saved');
      }
    } catch (err) {
      saveFailed = true;
      for (const metaKey of metaFieldsToSave) dirtyMetaFieldsRef.current.add(metaKey);
      for (const pathKey of recordPathsToSave) dirtyRecordPathsRef.current.add(pathKey);
      console.error('Failed saving teacher tracking:', err);
      setSaveState('error');
    } finally {
      inFlightRef.current = false;
      if (
        !saveFailed &&
        !saveTimerRef.current &&
        (dirtyMetaFieldsRef.current.size > 0 || dirtyRecordPathsRef.current.size > 0)
      ) {
        void flushSave();
      }
    }
  }, []);

  const scheduleSavePatch = useCallback(
    (
      patch: Partial<{
        enableWeek5: boolean;
        hiddenTeacherIds: string[];
        weekLabels: Partial<Record<WeekKey, string>>;
        examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>;
        records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
      }>,
      immediate = false
    ) => {
      if ('enableWeek5' in patch) dirtyMetaFieldsRef.current.add('enableWeek5');
      if ('hiddenTeacherIds' in patch) dirtyMetaFieldsRef.current.add('hiddenTeacherIds');
      if ('weekLabels' in patch) dirtyMetaFieldsRef.current.add('weekLabels');
      if ('examSchedules' in patch) dirtyMetaFieldsRef.current.add('examSchedules');

      latestPayloadRef.current = {
        ...latestPayloadRef.current,
        month: monthKey,
        ...patch,
      };
      setSaveState('saving');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (immediate) {
        void flushSave();
      } else {
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          void flushSave();
        }, 380);
      }
    },
    [monthKey, flushSave]
  );

  const activeWeeks = useMemo(
    () => (enableWeek5 ? WEEK_META : WEEK_META.slice(0, 4)),
    [enableWeek5]
  );

  const eligibleTeachers = useMemo(
    () => allTeachers.filter((t) => showInactiveTeachers || t.status !== 'ឈប់បង្រៀន'),
    [allTeachers, showInactiveTeachers]
  );

  const teacherFilterOptions = useMemo(
    () =>
      eligibleTeachers.map((t) => ({
        value: t.id,
        label: t.subject ? `${t.fullName} (${t.subject})` : t.fullName,
      })),
    [eligibleTeachers]
  );

  const selectedVisibleTeacherIds = useMemo(() => {
    const hiddenSet = new Set(hiddenTeacherIds);
    return eligibleTeachers.filter((t) => !hiddenSet.has(t.id)).map((t) => t.id);
  }, [eligibleTeachers, hiddenTeacherIds]);

  const handleVisibleTeachersChange = useCallback(
    (nextSelectedIds: string[]) => {
      const nextSelectedSet = new Set(nextSelectedIds);
      const eligibleIdSet = new Set(eligibleTeachers.map((t) => t.id));
      const preservedOtherHidden = hiddenTeacherIds.filter((id) => !eligibleIdSet.has(id));
      const newlyHiddenEligible = eligibleTeachers
        .filter((t) => !nextSelectedSet.has(t.id))
        .map((t) => t.id);
      const nextHidden = [...preservedOtherHidden, ...newlyHiddenEligible];

      setHiddenTeacherIds(nextHidden);
      try {
        localStorage.setItem('teacherTracking_hiddenIds', JSON.stringify(nextHidden));
      } catch {
        // ignore storage quota errors
      }
      scheduleSavePatch({ hiddenTeacherIds: nextHidden }, true);
    },
    [eligibleTeachers, hiddenTeacherIds, scheduleSavePatch]
  );

  const visibleTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const hiddenSet = new Set(hiddenTeacherIds);
    return eligibleTeachers.filter((t) => {
      if (hiddenSet.has(t.id)) return false;
      if (!q) return true;
      return (
        String(t.fullName || '').toLowerCase().includes(q) ||
        String(t.englishName || '').toLowerCase().includes(q) ||
        String(t.subject || '').toLowerCase().includes(q) ||
        String(t.teacherId || '').toLowerCase().includes(q)
      );
    });
  }, [eligibleTeachers, hiddenTeacherIds, searchQuery]);

  const updateTeacherWeek = useCallback(
    (
      teacherId: string,
      week: WeekKey,
      updater: (prev: TeacherWeekEntry) => TeacherWeekEntry,
      immediate = false
    ) => {
      setRecords((prevRecords) => {
        const currentEntry = normalizeEntry(prevRecords?.[teacherId]?.[week]);
        const updatedEntry = updater(currentEntry);
        const nextRecords = {
          ...prevRecords,
          [teacherId]: {
            ...(prevRecords?.[teacherId] || {}),
            [week]: updatedEntry,
          },
        };
        dirtyRecordPathsRef.current.add(`${teacherId}/${week}`);
        scheduleSavePatch({ records: nextRecords }, immediate);
        return nextRecords;
      });
    },
    [scheduleSavePatch]
  );

  const handleToggleWeek5 = (checked: boolean, switchToW5 = false) => {
    setEnableWeek5(checked);
    if (checked && switchToW5) {
      setActiveTab('w5');
      setScreenshotScope('w5');
    }
    scheduleSavePatch({ enableWeek5: checked }, true);
  };

  const handleWeekLabelChange = (week: WeekKey, labelText: string) => {
    setWeekLabels((prev) => {
      const next = { ...prev, [week]: labelText };
      scheduleSavePatch({ weekLabels: next }, false);
      return next;
    });
  };

  const handleExamScheduleChange = (week: WeekKey, nextCfg: ExamScheduleConfig) => {
    const resolvedCfg: ExamScheduleConfig = {
      ...nextCfg,
      issuerName: nextCfg.issuerName !== undefined ? nextCfg.issuerName : adminName,
    };
    setExamSchedules((prev) => {
      const next = { ...prev, [week]: resolvedCfg };
      scheduleSavePatch({ examSchedules: next }, true);
      return next;
    });
  };

  const monthlySummaries = useMemo(
    () => buildMonthlyTeacherSummaries(visibleTeachers, activeWeeks, records, examSchedules),
    [visibleTeachers, activeWeeks, records, examSchedules]
  );

  // Global KPI totals across visible teachers
  const kpiStats = useMemo(() => {
    const teacherCount = monthlySummaries.length;
    const weeksCount = activeWeeks.length;
    let totalTopics = 0;
    let totalHomeworkCount = 0;
    let totalVideoCount = 0;
    let permissionTotal = 0;
    let absentTotal = 0;
    let lateCountTotal = 0;
    let lateMinutesTotal = 0;
    let perfectTeachers = 0;

    for (const s of monthlySummaries) {
      totalTopics += s.totalTopics;
      totalHomeworkCount += s.totalHomeworkCount;
      totalVideoCount += s.totalVideoCount;
      permissionTotal += s.permissionDays;
      absentTotal += s.absentDays;
      lateCountTotal += s.lateCount;
      lateMinutesTotal += s.lateMinutes;
      if (s.completionPct === 100 && weeksCount > 0) perfectTeachers += 1;
    }

    return {
      teacherCount,
      weeksCount,
      targetSlots: teacherCount * weeksCount,
      totalTopics,
      totalHomeworkCount,
      totalVideoCount,
      permissionTotal,
      absentTotal,
      totalAbsences: permissionTotal + absentTotal,
      lateCountTotal,
      lateMinutesTotal,
      perfectTeachers,
    };
  }, [monthlySummaries, activeWeeks]);

  const handleStepMonth = (delta: number) => {
    let m = selectedMonthNum + delta;
    let y = selectedYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonthNum(m);
    setSelectedYear(y);
  };

  const openScreenshotView = (scope?: ScreenshotScope, fullscreen = false) => {
    const resolvedScope: ScreenshotScope =
      scope || (activeTab === 'screenshot' ? screenshotScope : activeTab);
    setScreenshotScope(resolvedScope);
    if (fullscreen) {
      setHideFullscreenToolbar(false);
      setIsFullscreenShot(true);
    } else {
      setActiveTab('screenshot');
    }
  };

  const handleCopyGroupChatSummary = async () => {
    const text = buildGroupChatSummaryText({
      scope: screenshotScope,
      monthDisplayKh,
      weekLabels,
      examSchedules,
      teachers: visibleTeachers,
      records,
      monthlySummaries,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2400);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleExportExcel = async () => {
    await exportTrackingExcel({
      monthKey,
      monthDisplayKh,
      activeWeeks,
      weekLabels,
      examSchedules,
      teachers: visibleTeachers,
      records,
      monthlySummaries,
    });
  };

  if (role && role !== 'admin') return null;

  const isWeekTab = activeTab !== 'monthly' && activeTab !== 'screenshot';
  const currentWeekKey: WeekKey = isWeekTab ? activeTab : 'w1';
  const currentWeekHasExam = isExamWeek(currentWeekKey);
  const currentWeekInfo = WEEK_META.find((w) => w.key === currentWeekKey)!;
  const currentExamCfg = currentWeekHasExam ? examSchedules?.[currentWeekKey] : undefined;

  const w4ExamCfg = examSchedules?.[EXAM_WEEK_KEY];
  const activeMonthExamRibbons = hasExamConfigActive(w4ExamCfg)
    ? [{ label: 'សប្តាហ៍ទី ៤', cfg: w4ExamCfg! }]
    : [];

  const hiddenEligibleCount = eligibleTeachers.length - selectedVisibleTeacherIds.length;
  const teacherDropdownTriggerLabel =
    hiddenEligibleCount === 0
      ? `បង្ហាញគ្រូ៖ ទាំងអស់ (${eligibleTeachers.length})`
      : `បង្ហាញគ្រូ៖ ${selectedVisibleTeacherIds.length}/${eligibleTeachers.length} នាក់`;

  const renderTeacherVisibilityDropdown = () => (
    <MultiSelectDropdown
      options={teacherFilterOptions}
      selectedValues={selectedVisibleTeacherIds}
      onChange={handleVisibleTeachersChange}
      allLabel={`បង្ហាញគ្រូ៖ ទាំងអស់ (${eligibleTeachers.length})`}
      title="ជ្រើសរើសគ្រូបង្ហាញ"
      searchable={true}
      searchPlaceholder="ស្វែងរកឈ្មោះគ្រូ..."
      fixedTriggerLabel={teacherDropdownTriggerLabel}
      icon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingBottom: '2.5rem' }}>
      {/* Top Page Title & Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.15rem 1.35rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderLeft: '4px solid #0d9488',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(13, 148, 136, 0.14)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                តាមដានការងារគ្រូបង្រៀន
              </h1>
              <span
                style={{
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  background:
                    saveState === 'error'
                      ? 'rgba(239, 68, 68, 0.14)'
                      : saveState === 'saving'
                        ? 'rgba(245, 158, 11, 0.14)'
                        : 'rgba(16, 185, 129, 0.14)',
                  color:
                    saveState === 'error'
                      ? '#dc2626'
                      : saveState === 'saving'
                        ? '#d97706'
                        : '#059669',
                }}
              >
                {saveState === 'saving' ? (
                  'កំពុងរក្សាទុក...'
                ) : saveState === 'error' ? (
                  'បញ្ហាក្នុងការរក្សាទុក!'
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>រក្សាទុកស្វ័យប្រវត្តិ</span>
                    <AppIcon name="check" size={11} strokeWidth={2.8} />
                  </span>
                )}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Topic • កិច្ចការផ្ទះ • វីដេអូ • វិញ្ញាសាប្រឡង • Task ពិសេស • អវត្តមាន & មកយឺត
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsExamNoticeOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.83rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.28)',
            }}
            title="បើកលិខិតជូនដំណឹងកាលបរិច្ឆេទប្រឡងសម្រាប់ Screenshot ចូល Group Chat និងជូនដំណឹងលើ Dashboard គ្រូ"
          >
            <AppIcon name="bell" size={16} />
            <span>លិខិតជូនដំណឹងប្រឡង</span>
            {hasAnyExamScheduleDate(w4ExamCfg) && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#34d399',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.35)',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              openScreenshotView(
                activeTab === 'screenshot' ? screenshotScope : activeTab,
                true
              )
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488, #0284c7)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.83rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.28)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            ផ្ទាំង Screenshot ចូល Group Chat
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.83rem',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ទាញយក Excel
          </button>
        </div>
      </div>

      {/* Month Picker & Search Filter Strip */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.15rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleStepMonth(-1)}
            style={{
              padding: '0.42rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="ខែមុន"
          >
            <AppIcon name="chevron-left" size={15} />
          </button>

          <select
            value={selectedMonthNum}
            onChange={(e) => setSelectedMonthNum(Number(e.target.value))}
            style={{
              padding: '0.44rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              outline: 'none',
            }}
          >
            {KHMER_MONTHS.map((mName, i) => (
              <option key={mName} value={i + 1} style={{ background: 'var(--modal-bg)' }}>
                ខែ{mName}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '0.44rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              outline: 'none',
            }}
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
              <option key={yr} value={yr} style={{ background: 'var(--modal-bg)' }}>
                ឆ្នាំ {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleStepMonth(1)}
            style={{
              padding: '0.42rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="ខែបន្ទាប់"
          >
            <AppIcon name="chevron-right" size={15} />
          </button>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              padding: '0.32rem 0.6rem',
              borderRadius: '7px',
              background: 'var(--main-bg)',
              fontWeight: 600,
            }}
          >
            {daysInSelectedMonth} ថ្ងៃ
          </span>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.7rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: enableWeek5 ? 'rgba(13, 148, 136, 0.12)' : 'var(--main-bg)',
              color: enableWeek5 ? '#0d9488' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={enableWeek5}
              onChange={(e) => handleToggleWeek5(e.target.checked, false)}
              style={{ accentColor: '#0d9488' }}
            />
            មានសប្តាហ៍ទី ៥
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
          {renderTeacherVisibilityDropdown()}

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះគ្រូ ឬមុខវិជ្ជា..."
            style={{
              padding: '0.44rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.83rem',
              minWidth: '185px',
              outline: 'none',
            }}
          />
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.38rem',
              fontSize: '0.79rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showInactiveTeachers}
              onChange={(e) => setShowInactiveTeachers(e.target.checked)}
            />
            បង្ហាញទាំងគ្រូឈប់បង្រៀន
          </label>
        </div>
      </div>

      {/* 4 Monthly KPI Cards (2x2 on mobile, 4-col on desktop) */}
      <div className="dashboard-kpi-grid">
        <div className="glass-panel" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #0d9488' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            គ្រូកំពុងតាមដាន ({monthDisplayKh})
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            {kpiStats.teacherCount} នាក់
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            សម្រេច 100% ពេញខែ៖ {kpiStats.perfectTeachers}/{kpiStats.teacherCount} នាក់
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Topic បានរៀនសរុបក្នុងខែ
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3b82f6', margin: '0.2rem 0' }}>
            {kpiStats.totalTopics} Topics
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            គោលដៅអប្បបរមា៖ {kpiStats.targetSlots} Topics ({kpiStats.weeksCount} សប្តាហ៍)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            កិច្ចការផ្ទះ & វីដេអូសរុបក្នុងខែ
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            HW: <span style={{ color: '#10b981' }}>{kpiStats.totalHomeworkCount} ដង</span> • វីដេអូ:{' '}
            <span style={{ color: '#8b5cf6' }}>{kpiStats.totalVideoCount} វីដេអូ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            គិតលើ {kpiStats.targetSlots} សប្តាហ៍-គ្រូ សរុប
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #f43f5e' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            អវត្តមាន & មកយឺតសរុបក្នុងខែ
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            អវត្តមាន <span style={{ color: '#ef4444' }}>{kpiStats.totalAbsences} ថ្ងៃ</span> • យឺត{' '}
            <span style={{ color: '#f97316' }}>{kpiStats.lateCountTotal} ដង</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ច្បាប់ {kpiStats.permissionTotal} | ឥតច្បាប់ {kpiStats.absentTotal} | សរុប{' '}
            {formatMinutesLabel(kpiStats.lateMinutesTotal)}
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs (Weeks 1..5 + Quick +Week 5 + Monthly + Screenshot) */}
      <div
        className="glass-panel"
        style={{
          padding: '0.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          alignItems: 'center',
        }}
      >
        {activeWeeks.map((w) => {
          const isSelected = activeTab === w.key;
          return (
            <button
              key={w.key}
              type="button"
              onClick={() => {
                setActiveTab(w.key);
                setScreenshotScope(w.key);
              }}
              style={{
                padding: '0.52rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                background: isSelected ? '#0d9488' : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {w.label}
              {isExamWeek(w.key) ? ' (ប្រឡង)' : ''}
            </button>
          );
        })}

        {!enableWeek5 && (
          <button
            type="button"
            onClick={() => handleToggleWeek5(true, true)}
            style={{
              padding: '0.48rem 0.85rem',
              borderRadius: '9px',
              border: '1px dashed #0d9488',
              background: 'rgba(13, 148, 136, 0.06)',
              color: '#0d9488',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
            title="បន្ថែមសប្តាហ៍ទី ៥ ប្រសិនបើខែនេះមាន ៥ សប្តាហ៍"
          >
            + សប្តាហ៍ទី ៥
          </button>
        )}

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.2rem' }} />

        <button
          type="button"
          onClick={() => {
            setActiveTab('monthly');
            setScreenshotScope('monthly');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.52rem 1rem',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'monthly' ? '#2563eb' : 'transparent',
            color: activeTab === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="bar-chart" size={15} />
          <span>បូកសរុបប្រចាំខែ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('screenshot')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.52rem 1rem',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'screenshot' ? '#7c3aed' : 'transparent',
            color: activeTab === 'screenshot' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="camera" size={15} />
          <span>ផ្ទាំងមើលគ្រូទាំងអស់ (Screenshot)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: WEEKLY FAST-ENTRY TABLE */}
      {isWeekTab && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: 'var(--main-bg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  padding: '0.26rem 0.7rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                }}
              >
                {currentWeekInfo.label}
              </span>
              <input
                type="text"
                value={weekLabels[currentWeekKey] || ''}
                onChange={(e) => handleWeekLabelChange(currentWeekKey, e.target.value)}
                placeholder="កាលបរិច្ឆេទសប្តាហ៍ (ឧ. ០១ - ០៧ វិច្ឆិកា)..."
                style={{
                  padding: '0.36rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--modal-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  minWidth: '235px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              {!currentWeekHasExam && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('w4');
                    setScreenshotScope('w4');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.38rem 0.72rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    background: 'rgba(139, 92, 246, 0.08)',
                    color: '#7c3aed',
                    fontWeight: 700,
                    fontSize: '0.77rem',
                    cursor: 'pointer',
                  }}
                  title="វិញ្ញាសាប្រឡងមាននៅសប្តាហ៍ទី ៤"
                >
                  <AppIcon name="file-text" size={14} />
                  <span>វិញ្ញាសាប្រឡង (សប្តាហ៍ទី ៤)</span>
                  <AppIcon name="chevron-right" size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => openScreenshotView(currentWeekKey, true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(13, 148, 136, 0.35)',
                  background: 'rgba(13, 148, 136, 0.1)',
                  color: '#0d9488',
                  fontWeight: 700,
                  fontSize: '0.79rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="camera" size={14} />
                <span>Screenshot {currentWeekInfo.label}</span>
              </button>
            </div>
          </div>

          {isLoadingDoc ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              កំពុងទាញយកទិន្នន័យ...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                  minWidth: currentWeekHasExam ? '1580px' : '1310px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--main-bg)',
                      borderBottom: '2px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th style={{ padding: '0.7rem 0.45rem', textAlign: 'center', width: '38px', verticalAlign: 'middle' }}>
                      ល.រ
                    </th>
                    <th
                      style={{
                        padding: '0.7rem 0.7rem',
                        textAlign: 'left',
                        minWidth: '175px',
                        position: 'sticky',
                        left: 0,
                        background: 'var(--modal-bg)',
                        zIndex: 3,
                        borderRight: '1px solid var(--border-color)',
                        verticalAlign: 'middle',
                      }}
                    >
                      គ្រូបង្រៀន
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'left', minWidth: '195px', verticalAlign: 'middle' }}>
                      ១. រៀន Topic (≥១/សប្តាហ៍)
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'left', minWidth: '215px', verticalAlign: 'middle' }}>
                      ២. កិច្ចការផ្ទះសិស្ស
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'left', minWidth: '225px', verticalAlign: 'middle' }}>
                      ៣. ថតវីដេអូ Topic
                    </th>

                    {/* Col 4 (Week 4 once-a-month only): វិញ្ញាសាប្រឡង */}
                    {currentWeekHasExam && (
                      <th
                        style={{
                          padding: '0.55rem 0.65rem',
                          textAlign: 'left',
                          minWidth: '262px',
                          verticalAlign: 'top',
                          background: 'rgba(139, 92, 246, 0.05)',
                          borderLeft: '1px solid var(--border-color)',
                          borderRight: '1px solid var(--border-color)',
                        }}
                      >
                        <ExamHeaderConfig
                          config={currentExamCfg}
                          onChange={(nextCfg) => handleExamScheduleChange(currentWeekKey, nextCfg)}
                          onOpenNotice={() => setIsExamNoticeOpen(true)}
                        />
                      </th>
                    )}

                    {/* Task (Special Task by Admin) */}
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'left', minWidth: '205px', verticalAlign: 'middle' }}>
                      {currentWeekHasExam ? '៥' : '៤'}. Task (កិច្ចការពិសេស)
                    </th>

                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center', minWidth: '165px', verticalAlign: 'middle' }}>
                      {currentWeekHasExam ? '៦' : '៥'}. អវត្តមាន (ថ្ងៃគត់)
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center', minWidth: '175px', verticalAlign: 'middle' }}>
                      {currentWeekHasExam ? '៧' : '៦'}. មកយឺត & នាទីយឺត
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'left', minWidth: '130px', verticalAlign: 'middle' }}>
                      ចំណាំរួម
                    </th>
                    <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center', minWidth: '112px', verticalAlign: 'middle' }}>
                      ស្ថានភាព
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleTeachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={currentWeekHasExam ? 11 : 10}
                        style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                      >
                        មិនមានឈ្មោះគ្រូបង្រៀនត្រូវនឹងការស្វែងរកទេ
                      </td>
                    </tr>
                  ) : (
                    visibleTeachers.map((teacher, idx) => {
                      const entry = normalizeEntry(records?.[teacher.id]?.[currentWeekKey]);
                      const ev = evaluateWeekEntry(entry, currentExamCfg, currentWeekKey);

                      return (
                        <tr
                          key={teacher.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: ev.isComplete ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                            verticalAlign: 'top',
                          }}
                        >
                          {/* ល.រ */}
                          <td
                            style={{
                              padding: '0.68rem 0.45rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              verticalAlign: 'middle',
                            }}
                          >
                            {idx + 1}
                          </td>

                          {/* គ្រូបង្រៀន (Sticky left with solid background) */}
                          <td
                            style={{
                              padding: '0.68rem 0.7rem',
                              position: 'sticky',
                              left: 0,
                              background: 'var(--modal-bg)',
                              zIndex: 2,
                              borderRight: '1px solid var(--border-color)',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <TeacherAvatar teacher={teacher} size={34} />
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {teacher.fullName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {teacher.subject || teacher.teacherId || 'គ្រូបង្រៀន'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 1: រៀន Topic */}
                          <td style={{ padding: '0.65rem 0.55rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => {
                                        const nextDone = !prev.topicDone;
                                        return {
                                          ...prev,
                                          topicDone: nextDone,
                                          topicCount: nextDone ? Math.max(1, prev.topicCount) : 0,
                                        };
                                      },
                                      true
                                    )
                                  }
                                  style={{
                                    flex: 1,
                                    height: '30px',
                                    padding: '0 0.5rem',
                                    borderRadius: '8px',
                                    border: entry.topicDone
                                      ? '1px solid #10b981'
                                      : '1px solid var(--border-color)',
                                    background: entry.topicDone
                                      ? 'rgba(16, 185, 129, 0.14)'
                                      : 'var(--main-bg)',
                                    color: entry.topicDone ? '#059669' : 'var(--text-secondary)',
                                    fontWeight: 700,
                                    fontSize: '0.76rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  {entry.topicDone && <AppIcon name="check" size={12} strokeWidth={2.8} />}
                                  <span>{entry.topicDone ? 'បានរៀន' : 'មិនទាន់'}</span>
                                </button>

                                <IntStepper
                                  value={entry.topicCount}
                                  onChange={(val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({
                                        ...prev,
                                        topicCount: val,
                                        topicDone: val >= 1,
                                      }),
                                      imm
                                    )
                                  }
                                  accentColor="#059669"
                                  highlightWhenPositive={true}
                                  badgeBg="rgba(16, 185, 129, 0.1)"
                                />
                              </div>

                              <textarea
                                value={entry.topicTitle}
                                rows={2}
                                onChange={(e) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, topicTitle: e.target.value }),
                                    false
                                  )
                                }
                                placeholder="ចំណងជើង / បរិយាយ Topic..."
                                style={{
                                  width: '100%',
                                  padding: '0.32rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--main-bg)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.75rem',
                                  lineHeight: 1.35,
                                  resize: 'vertical',
                                  minHeight: '42px',
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </td>

                          {/* Col 2: កិច្ចការផ្ទះ (Dropdown + Stepper + Comment Note) */}
                          <td style={{ padding: '0.65rem 0.55rem' }}>
                            <StatusCountNoteCell
                              status={entry.homeworkStatus}
                              count={entry.homeworkCount}
                              note={entry.homeworkNote}
                              labels={HOMEWORK_STATUS_LABELS}
                              notePlaceholder="មតិបន្ថែម / ចំណាំ HW..."
                              onStatusChange={(nextStatus: CompletionDropdownStatus) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => applyDropdownStatusChange(prev, 'homework', nextStatus),
                                  true
                                )
                              }
                              onCountChange={(val, imm) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => applyStatusCountChange(prev, 'homework', val),
                                  imm
                                )
                              }
                              onNoteChange={(text) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({ ...prev, homeworkNote: text }),
                                  false
                                )
                              }
                            />
                          </td>

                          {/* Col 3: ថតវីដេអូ Topic (Dropdown + Stepper + Video URL + Comment Note) */}
                          <td style={{ padding: '0.65rem 0.55rem' }}>
                            <StatusCountNoteCell
                              status={entry.videoStatus}
                              count={entry.videoCount}
                              note={entry.videoNote}
                              labels={VIDEO_STATUS_LABELS}
                              urlValue={entry.videoUrl}
                              urlPlaceholder="Link វីដេអូ (Telegram/Drive)..."
                              notePlaceholder="មតិបន្ថែម / ចំណាំវីដេអូ..."
                              onStatusChange={(nextStatus: CompletionDropdownStatus) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => applyDropdownStatusChange(prev, 'video', nextStatus),
                                  true
                                )
                              }
                              onCountChange={(val, imm) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => applyStatusCountChange(prev, 'video', val),
                                  imm
                                )
                              }
                              onUrlChange={(urlVal) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({
                                    ...prev,
                                    videoUrl: urlVal,
                                    videoStatus:
                                      urlVal.trim() && prev.videoStatus === 'none'
                                        ? 'done'
                                        : prev.videoStatus,
                                    videoDone:
                                      urlVal.trim() && prev.videoStatus === 'none'
                                        ? true
                                        : prev.videoDone,
                                    videoCount:
                                      urlVal.trim() && prev.videoCount === 0
                                        ? 1
                                        : prev.videoCount,
                                  }),
                                  false
                                )
                              }
                              onNoteChange={(text) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({ ...prev, videoNote: text }),
                                  false
                                )
                              }
                            />
                          </td>

                          {/* Col 4 (Week 4 only): វិញ្ញាសាប្រឡង (3 Stages) */}
                          {currentWeekHasExam && (
                            <td
                              style={{
                                padding: '0.65rem 0.6rem',
                                background: 'rgba(139, 92, 246, 0.02)',
                                borderLeft: '1px solid var(--border-color)',
                                borderRight: '1px solid var(--border-color)',
                              }}
                            >
                              <ExamStagesCell
                                entry={entry}
                                onToggleStage={(field) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, [field]: !prev[field] }),
                                    true
                                  )
                                }
                                onNoteChange={(text) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, examNote: text }),
                                    false
                                  )
                                }
                              />
                            </td>
                          )}

                          {/* Col 5: Task (កិច្ចការពិសេសពី Admin) */}
                          <td style={{ padding: '0.65rem 0.55rem' }}>
                            <SpecialTaskCell
                              entry={entry}
                              onCountChange={(val, imm) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({ ...prev, taskCount: val }),
                                  imm
                                )
                              }
                              onToggleDone={() =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => {
                                    const nextDone = !prev.taskDone;
                                    return {
                                      ...prev,
                                      taskDone: nextDone,
                                      taskCount:
                                        nextDone && prev.taskCount === 0 && !prev.taskDescription.trim()
                                          ? 1
                                          : prev.taskCount,
                                    };
                                  },
                                  true
                                )
                              }
                              onDescriptionChange={(desc) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({ ...prev, taskDescription: desc }),
                                  false
                                )
                              }
                            />
                          </td>

                          {/* Col 6: អវត្តមាន (integer only) */}
                          <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, width: '48px', textAlign: 'right' }}>
                                  ច្បាប់៖
                                </span>
                                <IntStepper
                                  value={entry.permissionDays}
                                  onChange={(val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({ ...prev, permissionDays: val }),
                                      imm
                                    )
                                  }
                                  accentColor="#d97706"
                                  highlightWhenPositive={true}
                                  badgeBg="rgba(245, 158, 11, 0.12)"
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, width: '48px', textAlign: 'right' }}>
                                  ឥតច្បាប់៖
                                </span>
                                <IntStepper
                                  value={entry.absentDays}
                                  onChange={(val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({ ...prev, absentDays: val }),
                                      imm
                                    )
                                  }
                                  accentColor="#dc2626"
                                  highlightWhenPositive={true}
                                  badgeBg="rgba(239, 68, 68, 0.12)"
                                />
                              </div>
                            </div>
                          </td>

                          {/* Col 7: មកយឺត & នាទីយឺត */}
                          <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, width: '34px', textAlign: 'right' }}>
                                  ដង៖
                                </span>
                                <IntStepper
                                  value={entry.lateCount}
                                  onChange={(val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({
                                        ...prev,
                                        lateCount: val,
                                        lateMinutes: val === 0 ? 0 : prev.lateMinutes,
                                      }),
                                      imm
                                    )
                                  }
                                  accentColor="#ea580c"
                                  highlightWhenPositive={true}
                                  badgeBg="rgba(249, 115, 22, 0.12)"
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, width: '34px', textAlign: 'right' }}>
                                  នាទី៖
                                </span>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    borderRadius: '8px',
                                    border:
                                      entry.lateMinutes > 0
                                        ? '1px solid #ea580c'
                                        : '1px solid var(--border-color)',
                                    background:
                                      entry.lateMinutes > 0
                                        ? 'rgba(249, 115, 22, 0.12)'
                                        : 'var(--main-bg)',
                                    height: '30px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    inputMode="numeric"
                                    value={entry.lateMinutes}
                                    onChange={(e) => {
                                      const mins = toNonNegInt(e.target.value);
                                      updateTeacherWeek(
                                        teacher.id,
                                        currentWeekKey,
                                        (prev) => ({
                                          ...prev,
                                          lateMinutes: mins,
                                          lateCount: mins > 0 && prev.lateCount === 0 ? 1 : prev.lateCount,
                                        }),
                                        false
                                      );
                                    }}
                                    style={{
                                      width: '44px',
                                      height: '100%',
                                      border: 'none',
                                      background: 'transparent',
                                      textAlign: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      color: entry.lateMinutes > 0 ? '#ea580c' : 'var(--text-primary)',
                                      outline: 'none',
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTeacherWeek(
                                        teacher.id,
                                        currentWeekKey,
                                        (prev) => ({
                                          ...prev,
                                          lateMinutes: prev.lateMinutes + 5,
                                          lateCount: prev.lateCount === 0 ? 1 : prev.lateCount,
                                        }),
                                        true
                                      )
                                    }
                                    style={{
                                      height: '100%',
                                      padding: '0 6px',
                                      border: 'none',
                                      borderLeft: '1px solid var(--border-color)',
                                      background: 'transparent',
                                      color: 'var(--text-secondary)',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                    title="បន្ថែម ៥ នាទី"
                                  >
                                    +5
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ចំណាំរួម */}
                          <td style={{ padding: '0.65rem 0.55rem', verticalAlign: 'middle' }}>
                            <input
                              type="text"
                              value={entry.note}
                              onChange={(e) =>
                                updateTeacherWeek(
                                  teacher.id,
                                  currentWeekKey,
                                  (prev) => ({ ...prev, note: e.target.value }),
                                  false
                                )
                              }
                              placeholder="ចំណាំផ្សេងៗ..."
                              style={{
                                width: '100%',
                                padding: '0.38rem 0.5rem',
                                borderRadius: '7px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--main-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.76rem',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* ស្ថានភាពសប្តាហ៍ */}
                          <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.26rem 0.6rem',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  background: ev.isComplete
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(245, 158, 11, 0.15)',
                                  color: ev.isComplete ? '#059669' : '#d97706',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {ev.isComplete && <AppIcon name="check" size={11} strokeWidth={2.8} />}
                                <span>
                                  {ev.isComplete
                                    ? 'គ្រប់លក្ខខណ្ឌ'
                                    : `ខ្វះ ${ev.missingLabels.length}`}
                                </span>
                              </span>
                              {!ev.isComplete && (
                                <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                  {ev.missingLabels.join(', ')}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MONTHLY ROLL-UP SUMMARY */}
      {activeTab === 'monthly' && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '0.9rem 1.2rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--main-bg)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                តារាងបូកសរុបលទ្ធផលការងារ និងអវត្តមានគ្រូប្រចាំខែ — {monthDisplayKh}
              </h3>
              <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ចុចលើស្លាក S1–S{activeWeeks.length} ដើម្បីចូលកែទិន្នន័យសប្តាហ៍នោះផ្ទាល់
              </div>
            </div>

            <button
              type="button"
              onClick={() => openScreenshotView('monthly', true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.44rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="camera" size={14} />
              <span>Screenshot តារាងបូកសរុបខែ</span>
            </button>
          </div>

          {activeMonthExamRibbons.length > 0 && (
            <div
              style={{
                padding: '0.58rem 1.2rem',
                background: 'rgba(139, 92, 246, 0.08)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.78rem',
                color: '#7c3aed',
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <AppIcon name="file-text" size={14} />
                <span>កាលវិភាគប្រឡងប្រចាំខែ៖</span>
              </span>
              {activeMonthExamRibbons.map((item) => (
                <span key={item.label}>
                  [{item.label}] ប្រមូល៖ {formatIsoDateKh(item.cfg.collectDate)} • ប្រឡង៖{' '}
                  {formatIsoDateKh(item.cfg.examDate)} • លទ្ធផល៖{' '}
                  {formatIsoDateKh(item.cfg.resultDate)}
                </span>
              ))}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', minWidth: '1120px' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--main-bg)',
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th style={{ padding: '0.7rem 0.5rem', textAlign: 'center', width: '42px' }}>ល.រ</th>
                  <th style={{ padding: '0.7rem 0.75rem', textAlign: 'left' }}>គ្រូបង្រៀន</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>សប្តាហ៍ (S1–S{activeWeeks.length})</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>សរុប Topic</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>កិច្ចការផ្ទះ</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>វីដេអូ Topic</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>វិញ្ញាសា (សប្តាហ៍ទី ៤)</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>Task ពិសេស</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>អវត្តមានខែ</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>មកយឺតខែ</th>
                  <th style={{ padding: '0.7rem 0.75rem', textAlign: 'center', minWidth: '130px' }}>អត្រាសម្រេច</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map((s, idx) => (
                  <tr key={s.teacher.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.58rem' }}>
                        <TeacherAvatar teacher={s.teacher} size={34} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {s.teacher.fullName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {s.teacher.subject || s.teacher.teacherId || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        {activeWeeks.map((w) => {
                          const done = s.perWeek[w.key]?.complete;
                          return (
                            <button
                              key={w.key}
                              type="button"
                              onClick={() => setActiveTab(w.key)}
                              title={`ចូលមើល ${w.label}`}
                              style={{
                                width: '27px',
                                height: '24px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                background: done
                                  ? 'rgba(16, 185, 129, 0.16)'
                                  : 'rgba(239, 68, 68, 0.12)',
                                color: done ? '#059669' : '#dc2626',
                              }}
                            >
                              {w.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center', fontWeight: 700 }}>
                      <span
                        style={{
                          padding: '0.22rem 0.55rem',
                          borderRadius: '999px',
                          background:
                            s.topicWeeksDone >= s.weeksCount
                              ? 'rgba(16, 185, 129, 0.14)'
                              : 'rgba(59, 130, 246, 0.12)',
                          color: s.topicWeeksDone >= s.weeksCount ? '#059669' : '#2563eb',
                          fontSize: '0.78rem',
                        }}
                      >
                        {s.totalTopics} Topics ({s.topicWeeksDone}/{s.weeksCount})
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: s.homeworkFullWeeks >= s.weeksCount ? '#059669' : 'var(--text-primary)' }}>
                        {s.totalHomeworkCount} ដង
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                        {s.homeworkFullWeeks} ពេញ
                        {s.homeworkPartialWeeks > 0 ? ` • ${s.homeworkPartialWeeks} តិចតួច` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: s.videoFullWeeks >= s.weeksCount ? '#059669' : 'var(--text-primary)' }}>
                        {s.totalVideoCount} វីដេអូ
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                        {s.videoFullWeeks} ពេញ
                        {s.videoPartialWeeks > 0 ? ` • ${s.videoPartialWeeks} តិចតួច` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      {s.examActiveWeeks === 0 ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>— (គ្មាន)</span>
                      ) : (
                        <span
                          style={{
                            padding: '0.22rem 0.55rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            background:
                              s.examTotalStagesDone >= s.examTotalStagesTarget
                                ? 'rgba(16, 185, 129, 0.14)'
                                : 'rgba(139, 92, 246, 0.14)',
                            color:
                              s.examTotalStagesDone >= s.examTotalStagesTarget
                                ? '#059669'
                                : '#7c3aed',
                          }}
                        >
                          {s.examTotalStagesDone}/{s.examTotalStagesTarget} ដំណាក់កាល
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      {s.assignedTaskWeeks === 0 ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>—</span>
                      ) : (
                        <span
                          style={{
                            padding: '0.22rem 0.55rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            background:
                              s.completedTaskWeeks >= s.assignedTaskWeeks
                                ? 'rgba(16, 185, 129, 0.14)'
                                : 'rgba(2, 132, 199, 0.14)',
                            color:
                              s.completedTaskWeeks >= s.assignedTaskWeeks ? '#059669' : '#0284c7',
                          }}
                        >
                          {s.totalTaskCount} ({s.completedTaskWeeks}/{s.assignedTaskWeeks})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      {s.totalAbsenceDays === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.79rem' }}>0 ថ្ងៃ</span>
                      ) : (
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          <span style={{ color: '#d97706' }}>ច្បាប់ {s.permissionDays}</span>
                          {' • '}
                          <span style={{ color: '#dc2626' }}>ឥតច្បាប់ {s.absentDays}</span>
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                            សរុប {s.totalAbsenceDays} ថ្ងៃ
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center' }}>
                      {s.lateCount === 0 && s.lateMinutes === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.79rem' }}>0 ដង</span>
                      ) : (
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c' }}>
                          {s.lateCount} ដង
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                            {formatMinutesLabel(s.lateMinutes)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color:
                              s.completionPct === 100
                                ? '#059669'
                                : s.completionPct >= 70
                                  ? '#d97706'
                                  : '#dc2626',
                          }}
                        >
                          {s.completionPct}%
                        </span>
                        <div
                          style={{
                            width: '86px',
                            height: '6px',
                            borderRadius: '999px',
                            background: 'var(--border-color)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${s.completionPct}%`,
                              height: '100%',
                              background:
                                s.completionPct === 100
                                  ? '#10b981'
                                  : s.completionPct >= 70
                                    ? '#f59e0b'
                                    : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ADMIN ALL-TEACHERS SCREENSHOT BOARD */}
      {activeTab === 'screenshot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.15rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                ទិន្នន័យលើផ្ទាំង៖
              </span>
              {activeWeeks.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => setScreenshotScope(w.key)}
                  style={{
                    padding: '0.36rem 0.7rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: screenshotScope === w.key ? '#0d9488' : 'var(--main-bg)',
                    color: screenshotScope === w.key ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {w.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setScreenshotScope('monthly')}
                style={{
                  padding: '0.36rem 0.75rem',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  background: screenshotScope === 'monthly' ? '#2563eb' : 'var(--main-bg)',
                  color: screenshotScope === 'monthly' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                សរុបពេញ ១ ខែ
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.55rem' }}>
              {renderTeacherVisibilityDropdown()}

              <button
                type="button"
                onClick={() => setScreenshotLightCard((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.38rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--main-bg)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name={screenshotLightCard ? 'sun' : 'moon'} size={14} />
                <span>{screenshotLightCard ? 'ផ្ទៃភ្លឺច្បាស់' : 'ផ្ទៃងងឹត'}</span>
              </button>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={screenshotShowDetails}
                  onChange={(e) => setScreenshotShowDetails(e.target.checked)}
                />
                បង្ហាញការបរិយាយ & មតិលម្អិត
              </label>

              <button
                type="button"
                onClick={handleCopyGroupChatSummary}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: copiedSummary ? 'rgba(16, 185, 129, 0.15)' : 'var(--main-bg)',
                  color: copiedSummary ? '#059669' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name={copiedSummary ? 'check' : 'copy'} size={14} />
                <span>{copiedSummary ? 'បានចម្លងអត្ថបទ!' : 'ចម្លងអត្ថបទសង្ខេប'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHideFullscreenToolbar(false);
                  setIsFullscreenShot(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  padding: '0.42rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.79rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="maximize" size={14} />
                <span>បើកពេញអេក្រង់ដើម្បី Screenshot</span>
              </button>
            </div>
          </div>

          <ScreenshotReportBoard
            isFullModal={false}
            lightMode={screenshotLightCard}
            showDetails={screenshotShowDetails}
            scope={screenshotScope}
            monthDisplayKh={monthDisplayKh}
            activeWeeks={activeWeeks}
            weekLabels={weekLabels}
            examSchedules={examSchedules}
            teachers={visibleTeachers}
            records={records}
            monthlySummaries={monthlySummaries}
          />
        </div>
      )}

      {/* FULL-SCREEN CLEAN SCREENSHOT PORTAL FOR GROUP CHAT */}
      {mounted &&
        isFullscreenShot &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 15000,
              background: screenshotLightCard ? '#e2e8f0' : '#020617',
              overflowY: 'auto',
              padding: hideFullscreenToolbar ? '1.25rem' : '0 1.25rem 2rem',
            }}
          >
            {!hideFullscreenToolbar ? (
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  maxWidth: '1380px',
                  margin: '0 auto 1rem',
                  padding: '0.7rem 1rem',
                  borderRadius: '0 0 14px 14px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                  {activeWeeks.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setScreenshotScope(w.key)}
                      style={{
                        padding: '0.32rem 0.65rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: screenshotScope === w.key ? '#14b8a6' : 'rgba(255,255,255,0.12)',
                        color: screenshotScope === w.key ? '#042f2e' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.77rem',
                        cursor: 'pointer',
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setScreenshotScope('monthly')}
                    style={{
                      padding: '0.32rem 0.7rem',
                      borderRadius: '7px',
                      border: 'none',
                      background: screenshotScope === 'monthly' ? '#38bdf8' : 'rgba(255,255,255,0.12)',
                      color: screenshotScope === 'monthly' ? '#082f49' : '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.77rem',
                      cursor: 'pointer',
                    }}
                  >
                    បូកសរុបខែ
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
                  {renderTeacherVisibilityDropdown()}

                  <button
                    type="button"
                    onClick={() => setScreenshotLightCard((v) => !v)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                      padding: '0.34rem 0.68rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <AppIcon name={screenshotLightCard ? 'sun' : 'moon'} size={13} />
                    <span>{screenshotLightCard ? 'ផ្ទៃភ្លឺ' : 'ផ្ទៃងងឹត'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyGroupChatSummary}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                      padding: '0.34rem 0.68rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: copiedSummary ? '#10b981' : 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <AppIcon name={copiedSummary ? 'check' : 'copy'} size={13} />
                    <span>{copiedSummary ? 'បានចម្លង!' : 'ចម្លងអត្ថបទ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHideFullscreenToolbar(true)}
                    style={{
                      padding: '0.34rem 0.68rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="លាក់របារខាងលើដើម្បីថតអេក្រង់ស្អាត ១០០%"
                  >
                    លាក់របារបញ្ជា
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenShot(false)}
                    style={{
                      padding: '0.34rem 0.75rem',
                      borderRadius: '7px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.77rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <AppIcon name="x" size={13} strokeWidth={2.6} />
                    <span>បិទ</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHideFullscreenToolbar(false)}
                style={{
                  position: 'fixed',
                  bottom: '14px',
                  right: '14px',
                  zIndex: 20,
                  padding: '0.35rem 0.7rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'rgba(15, 23, 42, 0.45)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                បង្ហាញរបារបញ្ជា (ESC)
              </button>
            )}

            <ScreenshotReportBoard
              isFullModal={true}
              lightMode={screenshotLightCard}
              showDetails={screenshotShowDetails}
              scope={screenshotScope}
              monthDisplayKh={monthDisplayKh}
              activeWeeks={activeWeeks}
              weekLabels={weekLabels}
              examSchedules={examSchedules}
              teachers={visibleTeachers}
              records={records}
              monthlySummaries={monthlySummaries}
            />
          </div>,
          document.body
        )}

      {/* Exam Notice Letter & Screenshot Modal */}
      <ExamNoticeModal
        isOpen={isExamNoticeOpen}
        onClose={() => setIsExamNoticeOpen(false)}
        monthKey={monthKey}
        monthDisplayKh={monthDisplayKh}
        schoolName={schoolName}
        adminName={adminName}
        config={examSchedules?.[EXAM_WEEK_KEY] || {}}
        onChangeConfig={(nextCfg) => handleExamScheduleChange(EXAM_WEEK_KEY, nextCfg)}
      />
    </div>
  );
}
