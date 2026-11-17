"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { teacherService, teacherTrackingService } from '@/services/db';
import { convertDriveImageLink } from '@/utils/driveLink';

type WeekKey = 'w1' | 'w2' | 'w3' | 'w4' | 'w5';
type ViewTab = WeekKey | 'monthly' | 'screenshot';
type ScreenshotScope = WeekKey | 'monthly';

interface TeacherWeekEntry {
  topicDone: boolean;
  topicCount: number;
  topicTitle: string;
  homeworkDone: boolean;
  homeworkNote: string;
  videoDone: boolean;
  videoUrl: string;
  permissionDays: number; // integer
  absentDays: number;     // integer
  lateCount: number;      // integer (times)
  lateMinutes: number;    // integer (minutes)
  note: string;
}

interface MonthlyTrackingDoc {
  id?: string;
  month: string;
  enableWeek5?: boolean;
  weekLabels?: Partial<Record<WeekKey, string>>;
  records?: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  updatedAt?: string;
}

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

const WEEK_META: { key: WeekKey; label: string; shortLabel: string }[] = [
  { key: 'w1', label: 'សប្តាហ៍ទី ១', shortLabel: 'S1' },
  { key: 'w2', label: 'សប្តាហ៍ទី ២', shortLabel: 'S2' },
  { key: 'w3', label: 'សប្តាហ៍ទី ៣', shortLabel: 'S3' },
  { key: 'w4', label: 'សប្តាហ៍ទី ៤', shortLabel: 'S4' },
  { key: 'w5', label: 'សប្តាហ៍ទី ៥', shortLabel: 'S5' },
];

const DEFAULT_ENTRY: TeacherWeekEntry = {
  topicDone: false,
  topicCount: 0,
  topicTitle: '',
  homeworkDone: false,
  homeworkNote: '',
  videoDone: false,
  videoUrl: '',
  permissionDays: 0,
  absentDays: 0,
  lateCount: 0,
  lateMinutes: 0,
  note: '',
};

function toNonNegInt(val: unknown): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

function normalizeEntry(raw?: Partial<TeacherWeekEntry> | null): TeacherWeekEntry {
  if (!raw) return { ...DEFAULT_ENTRY };
  const rawTopicCount = toNonNegInt(raw.topicCount);
  const topicDone = Boolean(raw.topicDone) || rawTopicCount >= 1;
  const topicCount = topicDone ? Math.max(1, rawTopicCount) : 0;
  return {
    topicDone,
    topicCount,
    topicTitle: String(raw.topicTitle || ''),
    homeworkDone: Boolean(raw.homeworkDone),
    homeworkNote: String(raw.homeworkNote || ''),
    videoDone: Boolean(raw.videoDone),
    videoUrl: String(raw.videoUrl || ''),
    permissionDays: toNonNegInt(raw.permissionDays),
    absentDays: toNonNegInt(raw.absentDays),
    lateCount: toNonNegInt(raw.lateCount),
    lateMinutes: toNonNegInt(raw.lateMinutes),
    note: String(raw.note || ''),
  };
}

function isWeekComplete(entry: TeacherWeekEntry): boolean {
  return entry.topicDone && entry.topicCount >= 1 && entry.homeworkDone && entry.videoDone;
}

function formatMinutesLabel(mins: number): string {
  if (mins <= 0) return '0 នាទី';
  if (mins < 60) return `${mins} នាទី`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${mins} នាទី (${h}ម៉ ${m}ន)` : `${mins} នាទី (${h} ម៉ោង)`;
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function TeacherTrackingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState('');

  // Month & Year state
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(now.getMonth() + 1);
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
  const [searchQuery, setSearchQuery] = useState('');

  // Tracking Document State for current month
  const [enableWeek5, setEnableWeek5] = useState(false);
  const [weekLabels, setWeekLabels] = useState<Partial<Record<WeekKey, string>>>({});
  const [records, setRecords] = useState<Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Navigation Tabs & Screenshot Modal
  const [activeTab, setActiveTab] = useState<ViewTab>('w1');
  const [screenshotScope, setScreenshotScope] = useState<ScreenshotScope>('w1');
  const [screenshotLightCard, setScreenshotLightCard] = useState(true);
  const [screenshotShowDetails, setScreenshotShowDetails] = useState(true);
  const [isFullscreenShot, setIsFullscreenShot] = useState(false);
  const [hideFullscreenToolbar, setHideFullscreenToolbar] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Safe Debounced Auto-Save Refs (prevents cursor jumping while typing)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const latestPayloadRef = useRef<{
    month: string;
    enableWeek5: boolean;
    weekLabels: Partial<Record<WeekKey, string>>;
    records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  }>({
    month: monthKey,
    enableWeek5: false,
    weekLabels: {},
    records: {},
  });

  useEffect(() => {
    setMounted(true);
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);

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

    return () => {
      unsubTeachers();
    };
  }, [router]);

  // Subscribe to selected month's RTDB tracking doc
  useEffect(() => {
    if (role !== 'admin') return;
    setIsLoadingDoc(true);

    // Flush any pending save from previous month before switching
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const unsubDoc = teacherTrackingService.subscribeOne(monthKey, (doc: MonthlyTrackingDoc | null) => {
      // Do not overwrite user's active typing while a local debounce or write is in flight
      if (saveTimerRef.current || inFlightRef.current) {
        setIsLoadingDoc(false);
        return;
      }
      if (doc) {
        const nextW5 = Boolean(doc.enableWeek5);
        const nextLabels = doc.weekLabels || {};
        const nextRecords = doc.records || {};
        setEnableWeek5(nextW5);
        setWeekLabels(nextLabels);
        setRecords(nextRecords);
        latestPayloadRef.current = {
          month: monthKey,
          enableWeek5: nextW5,
          weekLabels: nextLabels,
          records: nextRecords,
        };
      } else {
        setEnableWeek5(false);
        setWeekLabels({});
        setRecords({});
        latestPayloadRef.current = {
          month: monthKey,
          enableWeek5: false,
          weekLabels: {},
          records: {},
        };
      }
      setIsLoadingDoc(false);
    });

    return () => {
      unsubDoc();
    };
  }, [monthKey, role]);

  // Close fullscreen screenshot on ESC
  useEffect(() => {
    if (!isFullscreenShot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hideFullscreenToolbar) {
          setHideFullscreenToolbar(false);
        } else {
          setIsFullscreenShot(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreenShot, hideFullscreenToolbar]);

  // Keep activeTab & screenshotScope valid if Week 5 is turned off
  useEffect(() => {
    if (!enableWeek5) {
      if (activeTab === 'w5') setActiveTab('w4');
      if (screenshotScope === 'w5') setScreenshotScope('w4');
    }
  }, [enableWeek5, activeTab, screenshotScope]);

  const flushSave = useCallback(async () => {
    const payload = latestPayloadRef.current;
    inFlightRef.current = true;
    setSaveState('saving');
    try {
      await teacherTrackingService.add(
        {
          month: payload.month,
          enableWeek5: payload.enableWeek5,
          weekLabels: payload.weekLabels,
          records: payload.records,
        },
        payload.month
      );
      setSaveState('saved');
    } catch (err) {
      console.error('Failed saving teacher tracking:', err);
      setSaveState('error');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const scheduleSave = useCallback(
    (
      nextPayload: {
        month: string;
        enableWeek5: boolean;
        weekLabels: Partial<Record<WeekKey, string>>;
        records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
      },
      immediate = false
    ) => {
      latestPayloadRef.current = nextPayload;
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
    [flushSave]
  );

  const activeWeeks = useMemo(
    () => (enableWeek5 ? WEEK_META : WEEK_META.slice(0, 4)),
    [enableWeek5]
  );

  const visibleTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTeachers.filter((t) => {
      if (!showInactiveTeachers && t.status === 'ឈប់បង្រៀន') return false;
      if (!q) return true;
      return (
        String(t.fullName || '').toLowerCase().includes(q) ||
        String(t.englishName || '').toLowerCase().includes(q) ||
        String(t.subject || '').toLowerCase().includes(q) ||
        String(t.teacherId || '').toLowerCase().includes(q)
      );
    });
  }, [allTeachers, showInactiveTeachers, searchQuery]);

  const getEntry = useCallback(
    (teacherId: string, week: WeekKey): TeacherWeekEntry => {
      return normalizeEntry(records?.[teacherId]?.[week]);
    },
    [records]
  );

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
        scheduleSave(
          {
            month: monthKey,
            enableWeek5,
            weekLabels,
            records: nextRecords,
          },
          immediate
        );
        return nextRecords;
      });
    },
    [monthKey, enableWeek5, weekLabels, scheduleSave]
  );

  const handleToggleWeek5 = (checked: boolean) => {
    setEnableWeek5(checked);
    scheduleSave(
      {
        month: monthKey,
        enableWeek5: checked,
        weekLabels,
        records,
      },
      true
    );
  };

  const handleWeekLabelChange = (week: WeekKey, labelText: string) => {
    setWeekLabels((prev) => {
      const next = { ...prev, [week]: labelText };
      scheduleSave(
        {
          month: monthKey,
          enableWeek5,
          weekLabels: next,
          records,
        },
        false
      );
      return next;
    });
  };

  // Monthly roll-up per teacher
  const monthlySummaries = useMemo(() => {
    const weeksCount = activeWeeks.length;
    const totalTasksTarget = weeksCount * 3; // Topic + Homework + Video per week

    return visibleTeachers.map((teacher) => {
      let totalTopics = 0;
      let topicWeeksDone = 0;
      let homeworkWeeksDone = 0;
      let videoWeeksDone = 0;
      let permissionDays = 0;
      let absentDays = 0;
      let lateCount = 0;
      let lateMinutes = 0;
      let fullWeeksCompleted = 0;

      const perWeek: Record<WeekKey, { entry: TeacherWeekEntry; complete: boolean }> = {} as any;

      for (const w of activeWeeks) {
        const e = getEntry(teacher.id, w.key);
        const complete = isWeekComplete(e);
        perWeek[w.key] = { entry: e, complete };

        totalTopics += e.topicCount;
        if (e.topicDone && e.topicCount >= 1) topicWeeksDone += 1;
        if (e.homeworkDone) homeworkWeeksDone += 1;
        if (e.videoDone) videoWeeksDone += 1;
        permissionDays += e.permissionDays;
        absentDays += e.absentDays;
        lateCount += e.lateCount;
        lateMinutes += e.lateMinutes;
        if (complete) fullWeeksCompleted += 1;
      }

      const tasksDone = topicWeeksDone + homeworkWeeksDone + videoWeeksDone;
      const completionPct =
        totalTasksTarget > 0 ? Math.round((tasksDone / totalTasksTarget) * 100) : 0;

      return {
        teacher,
        perWeek,
        totalTopics,
        topicWeeksDone,
        homeworkWeeksDone,
        videoWeeksDone,
        permissionDays,
        absentDays,
        totalAbsenceDays: permissionDays + absentDays,
        lateCount,
        lateMinutes,
        fullWeeksCompleted,
        weeksCount,
        completionPct,
      };
    });
  }, [visibleTeachers, activeWeeks, getEntry]);

  // Global KPI totals across visible teachers for the selected month
  const kpiStats = useMemo(() => {
    const teacherCount = monthlySummaries.length;
    const weeksCount = activeWeeks.length;
    let totalTopics = 0;
    let homeworkDoneTotal = 0;
    let videoDoneTotal = 0;
    let permissionTotal = 0;
    let absentTotal = 0;
    let lateCountTotal = 0;
    let lateMinutesTotal = 0;
    let perfectTeachers = 0;

    for (const s of monthlySummaries) {
      totalTopics += s.totalTopics;
      homeworkDoneTotal += s.homeworkWeeksDone;
      videoDoneTotal += s.videoWeeksDone;
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
      homeworkDoneTotal,
      videoDoneTotal,
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

  // Copy Formatted Summary Text for Telegram / Group Chat
  const handleCopyGroupChatSummary = async () => {
    const lines: string[] = [];
    if (screenshotScope === 'monthly') {
      lines.push(`📊 របាយការណ៍បូកសរុបការងារគ្រូបង្រៀន — ${monthDisplayKh}`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      monthlySummaries.forEach((s, idx) => {
        const badge = s.completionPct === 100 ? '✅' : s.completionPct >= 70 ? '🟡' : '⚠️';
        const absencePart =
          s.totalAbsenceDays > 0
            ? `ច្បាប់:${s.permissionDays} | ឥតច្បាប់:${s.absentDays}`
            : 'អវត្តមាន: 0';
        const latePart =
          s.lateCount > 0 || s.lateMinutes > 0
            ? `យឺត:${s.lateCount}ដង (${s.lateMinutes}នាទី)`
            : 'យឺត: 0';
        lines.push(
          `${idx + 1}. ${badge} ${s.teacher.fullName} (${s.completionPct}%)\n   • Topic: ${s.totalTopics} | HW: ${s.homeworkWeeksDone}/${s.weeksCount} | វីដេអូ: ${s.videoWeeksDone}/${s.weeksCount}\n   • ${absencePart} | ${latePart}`
        );
      });
    } else {
      const wMeta = WEEK_META.find((w) => w.key === screenshotScope)!;
      const dateTag = weekLabels[screenshotScope] ? ` (${weekLabels[screenshotScope]})` : '';
      lines.push(`📋 របាយការណ៍តាមដានការងារគ្រូ — ${wMeta.label}${dateTag} • ${monthDisplayKh}`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      visibleTeachers.forEach((t, idx) => {
        const e = getEntry(t.id, screenshotScope);
        const ok = isWeekComplete(e);
        const tStr = e.topicDone ? `✅(${e.topicCount})` : '❌';
        const hwStr = e.homeworkDone ? '✅' : '❌';
        const vStr = e.videoDone ? '✅' : '❌';
        const absStr =
          e.permissionDays > 0 || e.absentDays > 0
            ? `ច្បាប់:${e.permissionDays} ឥតច្បាប់:${e.absentDays}`
            : 'អវត្តមាន:0';
        const lateStr =
          e.lateCount > 0 || e.lateMinutes > 0
            ? `យឺត:${e.lateCount}ដង(${e.lateMinutes}ន)`
            : 'យឺត:0';
        lines.push(
          `${idx + 1}. ${ok ? '🌟' : '⚠️'} ${t.fullName} — Topic:${tStr} | HW:${hwStr} | វីដេអូ:${vStr} | ${absStr} | ${lateStr}`
        );
      });
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2400);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // Export Monthly + Weekly Tracking to Excel (.xlsx)
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly Roll-up Summary
    const summaryHeader = [
      'ល.រ',
      'អត្តលេខគ្រូ',
      'ឈ្មោះគ្រូបង្រៀន',
      'មុខវិជ្ជា',
      ...activeWeeks.map((w) => w.label),
      'សរុប Topic ក្នុងខែ',
      `កិច្ចការផ្ទះ (/${activeWeeks.length})`,
      `វីដេអូ Topic (/${activeWeeks.length})`,
      'ច្បាប់សរុប (ថ្ងៃ)',
      'ឥតច្បាប់សរុប (ថ្ងៃ)',
      'អវត្តមានសរុប (ថ្ងៃ)',
      'មកយឺតសរុប (ដង)',
      'នាទីយឺតសរុប (នាទី)',
      'អត្រាសម្រេច (%)',
    ];

    const summaryRows = monthlySummaries.map((s, idx) => [
      idx + 1,
      s.teacher.teacherId || '',
      s.teacher.fullName || '',
      s.teacher.subject || '',
      ...activeWeeks.map((w) => (s.perWeek[w.key]?.complete ? 'គ្រប់' : 'ខ្វះ')),
      s.totalTopics,
      s.homeworkWeeksDone,
      s.videoWeeksDone,
      s.permissionDays,
      s.absentDays,
      s.totalAbsenceDays,
      s.lateCount,
      s.lateMinutes,
      `${s.completionPct}%`,
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet([
      [`របាយការណ៍បូកសរុបការងារគ្រូបង្រៀន — ${monthDisplayKh}`],
      [],
      summaryHeader,
      ...summaryRows,
    ]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'បូកសរុបប្រចាំខែ');

    // Individual sheets per active week
    for (const w of activeWeeks) {
      const wHeader = [
        'ល.រ',
        'អត្តលេខគ្រូ',
        'ឈ្មោះគ្រូបង្រៀន',
        'មុខវិជ្ជា',
        'រៀន Topic',
        'ចំនួន Topic',
        'ចំណងជើង Topic',
        'ដាក់កិច្ចការផ្ទះ',
        'ចំណាំ Homework',
        'ថតវីដេអូ Topic',
        'Link វីដេអូ',
        'ច្បាប់ (ថ្ងៃ)',
        'ឥតច្បាប់ (ថ្ងៃ)',
        'មកយឺត (ដង)',
        'នាទីយឺត (នាទី)',
        'ចំណាំផ្សេងៗ',
        'ស្ថានភាពសប្តាហ៍',
      ];
      const wRows = visibleTeachers.map((t, idx) => {
        const e = getEntry(t.id, w.key);
        return [
          idx + 1,
          t.teacherId || '',
          t.fullName || '',
          t.subject || '',
          e.topicDone ? 'បានរៀន' : 'មិនទាន់',
          e.topicCount,
          e.topicTitle,
          e.homeworkDone ? 'បានដាក់' : 'មិនទាន់',
          e.homeworkNote,
          e.videoDone ? 'បានថត' : 'មិនទាន់',
          e.videoUrl,
          e.permissionDays,
          e.absentDays,
          e.lateCount,
          e.lateMinutes,
          e.note,
          isWeekComplete(e) ? 'គ្រប់លក្ខខណ្ឌ' : 'នៅខ្វះ',
        ];
      });
      const wsWeek = XLSX.utils.aoa_to_sheet([
        [`${w.label}${weekLabels[w.key] ? ` (${weekLabels[w.key]})` : ''} — ${monthDisplayKh}`],
        [],
        wHeader,
        ...wRows,
      ]);
      XLSX.utils.book_append_sheet(wb, wsWeek, w.label);
    }

    XLSX.writeFile(wb, `តាមដានការងារគ្រូ_${monthKey}.xlsx`);
  };

  // Helper renderer for Teacher Avatar
  const renderAvatar = (teacher: any, size = 36, forceLight = false) => {
    const photoUrl = teacher.photo ? convertDriveImageLink(teacher.photo) : '';
    const initial = String(teacher.fullName || 'គ').trim().charAt(0);
    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={teacher.fullName}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            border: forceLight ? '2px solid #e2e8f0' : '2px solid var(--border-color)',
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488, #0284c7)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: Math.max(12, Math.round(size * 0.42)),
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  };

  // Integer Stepper Component (strictly whole numbers, NO 0.5)
  const renderIntStepper = (
    value: number,
    onChange: (nextVal: number, immediate: boolean) => void,
    accentColor = '#0f172a',
    highlightWhenPositive = false,
    badgeBg = 'rgba(239, 68, 68, 0.1)'
  ) => {
    const active = highlightWhenPositive && value > 0;
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '8px',
          border: active ? `1px solid ${accentColor}` : '1px solid var(--border-color)',
          background: active ? badgeBg : 'var(--main-bg)',
          overflow: 'hidden',
          height: '30px',
        }}
      >
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1), true)}
          style={{
            width: '24px',
            height: '100%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            lineHeight: 1,
          }}
          title="ដក ១"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(toNonNegInt(e.target.value), false)}
          style={{
            width: '34px',
            height: '100%',
            border: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: active ? accentColor : 'var(--text-primary)',
            outline: 'none',
            MozAppearance: 'textfield',
          }}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1, true)}
          style={{
            width: '24px',
            height: '100%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            lineHeight: 1,
          }}
          title="បូក ១"
        >
          +
        </button>
      </div>
    );
  };

  // Reusable Screenshot Report Board (used both inline on tab AND in Full-Screen Portal for Group Chat)
  const renderScreenshotBoard = (isFullModal = false) => {
    const light = screenshotLightCard;
    const cardBg = light ? '#ffffff' : '#0f172a';
    const rowAltBg = light ? '#f8fafc' : 'rgba(30, 41, 59, 0.55)';
    const borderCol = light ? '#e2e8f0' : 'rgba(148, 163, 184, 0.2)';
    const textMain = light ? '#0f172a' : '#f8fafc';
    const textSub = light ? '#64748b' : '#94a3b8';
    const headerGrad = light
      ? 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)'
      : 'linear-gradient(135deg, #115e59 0%, #1e3a8a 100%)';

    const isMonthlyScope = screenshotScope === 'monthly';
    const currentWeekMeta = !isMonthlyScope
      ? WEEK_META.find((w) => w.key === screenshotScope)!
      : null;
    const currentWeekDateStr =
      !isMonthlyScope && weekLabels[screenshotScope]
        ? ` (${weekLabels[screenshotScope]})`
        : '';

    // Compute quick scope stats for screenshot header strip
    let scopeCompleteCount = 0;
    let scopeTopicsTotal = 0;
    let scopeAbsenceTotal = 0;
    let scopeLateCountTotal = 0;
    let scopeLateMinTotal = 0;

    if (isMonthlyScope) {
      for (const s of monthlySummaries) {
        if (s.completionPct === 100) scopeCompleteCount += 1;
        scopeTopicsTotal += s.totalTopics;
        scopeAbsenceTotal += s.totalAbsenceDays;
        scopeLateCountTotal += s.lateCount;
        scopeLateMinTotal += s.lateMinutes;
      }
    } else {
      for (const t of visibleTeachers) {
        const e = getEntry(t.id, screenshotScope);
        if (isWeekComplete(e)) scopeCompleteCount += 1;
        scopeTopicsTotal += e.topicCount;
        scopeAbsenceTotal += e.permissionDays + e.absentDays;
        scopeLateCountTotal += e.lateCount;
        scopeLateMinTotal += e.lateMinutes;
      }
    }

    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());

    return (
      <div
        style={{
          background: cardBg,
          color: textMain,
          borderRadius: '18px',
          border: `1.5px solid ${borderCol}`,
          boxShadow: isFullModal
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          maxWidth: isFullModal ? '1220px' : '100%',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Crisp Report Banner */}
        <div
          style={{
            background: headerGrad,
            color: '#ffffff',
            padding: '1.15rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                opacity: 0.9,
                marginBottom: '0.2rem',
              }}
            >
              សាលាអន្តរជាតិប្រេនស្គម • ប្រព័ន្ធតាមដានគុណភាពបង្រៀន
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                lineHeight: 1.35,
              }}
            >
              {isMonthlyScope
                ? `របាយការណ៍បូកសរុបការងារគ្រូបង្រៀន — ${monthDisplayKh}`
                : `របាយការណ៍តាមដានការងារគ្រូបង្រៀន — ${currentWeekMeta?.label}${currentWeekDateStr} • ${monthDisplayKh}`}
            </h2>
          </div>

          {/* Summary Pills inside Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.16)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              គ្រូសរុប៖ {visibleTeachers.length} នាក់
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.28)',
                border: '1px solid rgba(167, 243, 208, 0.45)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              គ្រប់លក្ខខណ្ឌ៖ {scopeCompleteCount}/{visibleTeachers.length}
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.16)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              Topic សរុប៖ {scopeTopicsTotal}
            </div>
            <div
              style={{
                background:
                  scopeAbsenceTotal > 0 ? 'rgba(244, 63, 94, 0.32)' : 'rgba(255,255,255,0.16)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              អវត្តមាន៖ {scopeAbsenceTotal} ថ្ងៃ
            </div>
            <div
              style={{
                background:
                  scopeLateCountTotal > 0 ? 'rgba(245, 158, 11, 0.34)' : 'rgba(255,255,255,0.16)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              មកយឺត៖ {scopeLateCountTotal} ដង ({scopeLateMinTotal} នាទី)
            </div>
          </div>
        </div>

        {/* All-Teachers Clean Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.84rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: light ? '#f1f5f9' : '#1e293b',
                  borderBottom: `2px solid ${borderCol}`,
                  color: light ? '#334155' : '#cbd5e1',
                }}
              >
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', width: '42px', fontWeight: 700 }}>
                  ល.រ
                </th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>
                  គ្រូបង្រៀន
                </th>
                {isMonthlyScope && (
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                    តាមសប្តាហ៍
                  </th>
                )}
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                  រៀន Topic
                </th>
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                  កិច្ចការផ្ទះ
                </th>
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                  ថតវីដេអូ
                </th>
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                  អវត្តមាន (ថ្ងៃ)
                </th>
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                  មកយឺត (ដង / នាទី)
                </th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>
                  លទ្ធផល
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isMonthlyScope ? 9 : 8}
                    style={{ padding: '2rem', textAlign: 'center', color: textSub }}
                  >
                    មិនមានទិន្នន័យគ្រូបង្រៀនទេ
                  </td>
                </tr>
              ) : isMonthlyScope ? (
                monthlySummaries.map((s, idx) => {
                  const pct = s.completionPct;
                  const statusBg =
                    pct === 100
                      ? 'rgba(16, 185, 129, 0.15)'
                      : pct >= 70
                        ? 'rgba(245, 158, 11, 0.16)'
                        : 'rgba(239, 68, 68, 0.15)';
                  const statusColor =
                    pct === 100 ? '#059669' : pct >= 70 ? '#d97706' : '#dc2626';

                  return (
                    <tr
                      key={s.teacher.id}
                      style={{
                        background: idx % 2 === 1 ? rowAltBg : 'transparent',
                        borderBottom: `1px solid ${borderCol}`,
                      }}
                    >
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center', fontWeight: 700, color: textSub }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.58rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {renderAvatar(s.teacher, 32, light)}
                          <div>
                            <div style={{ fontWeight: 700, color: textMain, lineHeight: 1.25 }}>
                              {s.teacher.fullName}
                            </div>
                            {s.teacher.subject && (
                              <div style={{ fontSize: '0.73rem', color: textSub }}>
                                {s.teacher.subject}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          {activeWeeks.map((w) => {
                            const done = s.perWeek[w.key]?.complete;
                            return (
                              <span
                                key={w.key}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '24px',
                                  height: '22px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: done
                                    ? 'rgba(16, 185, 129, 0.16)'
                                    : 'rgba(239, 68, 68, 0.12)',
                                  color: done ? '#059669' : '#dc2626',
                                }}
                              >
                                {w.shortLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.22rem 0.55rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            background:
                              s.topicWeeksDone >= s.weeksCount
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color: s.topicWeeksDone >= s.weeksCount ? '#059669' : '#d97706',
                          }}
                        >
                          {s.totalTopics} Topics ({s.topicWeeksDone}/{s.weeksCount})
                        </span>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                        <span
                          style={{
                            color: s.homeworkWeeksDone >= s.weeksCount ? '#059669' : '#d97706',
                          }}
                        >
                          {s.homeworkWeeksDone} / {s.weeksCount} សប្តាហ៍
                        </span>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                        <span
                          style={{
                            color: s.videoWeeksDone >= s.weeksCount ? '#059669' : '#d97706',
                          }}
                        >
                          {s.videoWeeksDone} / {s.weeksCount} វីដេអូ
                        </span>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        {s.totalAbsenceDays === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>
                            គ្មាន (0)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {s.permissionDays > 0 && (
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#d97706',
                                  padding: '0.16rem 0.45rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                ច្បាប់: {s.permissionDays}
                              </span>
                            )}
                            {s.absentDays > 0 && (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#dc2626',
                                  padding: '0.16rem 0.45rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                ឥតច្បាប់: {s.absentDays}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        {s.lateCount === 0 && s.lateMinutes === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>
                            គ្មាន (0)
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(249, 115, 22, 0.14)',
                              color: '#ea580c',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              display: 'inline-block',
                            }}
                          >
                            {s.lateCount} ដង • {s.lateMinutes} នាទី
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.58rem 0.75rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusColor,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            display: 'inline-block',
                          }}
                        >
                          {pct}% {pct === 100 ? '✓ ល្អប្រសើរ' : pct >= 70 ? 'ល្អបង្គួរ' : 'ត្រូវពង្រឹង'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                visibleTeachers.map((teacher, idx) => {
                  const e = getEntry(teacher.id, screenshotScope);
                  const complete = isWeekComplete(e);
                  const missingCount =
                    (e.topicDone && e.topicCount >= 1 ? 0 : 1) +
                    (e.homeworkDone ? 0 : 1) +
                    (e.videoDone ? 0 : 1);

                  return (
                    <tr
                      key={teacher.id}
                      style={{
                        background: idx % 2 === 1 ? rowAltBg : 'transparent',
                        borderBottom: `1px solid ${borderCol}`,
                      }}
                    >
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center', fontWeight: 700, color: textSub }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.58rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {renderAvatar(teacher, 32, light)}
                          <div>
                            <div style={{ fontWeight: 700, color: textMain, lineHeight: 1.25 }}>
                              {teacher.fullName}
                            </div>
                            {teacher.subject && (
                              <div style={{ fontSize: '0.73rem', color: textSub }}>
                                {teacher.subject}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        {e.topicDone && e.topicCount >= 1 ? (
                          <div>
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#059669',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                fontWeight: 700,
                                fontSize: '0.77rem',
                                display: 'inline-block',
                              }}
                            >
                              ✓ បានរៀន ({e.topicCount})
                            </span>
                            {screenshotShowDetails && e.topicTitle && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: textSub,
                                  marginTop: '3px',
                                  maxWidth: '180px',
                                  marginInline: 'auto',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {e.topicTitle}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.13)',
                              color: '#dc2626',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '0.77rem',
                            }}
                          >
                            ✕ មិនទាន់
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: e.homeworkDone
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.13)',
                            color: e.homeworkDone ? '#059669' : '#dc2626',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.77rem',
                            display: 'inline-block',
                          }}
                        >
                          {e.homeworkDone ? '✓ បានដាក់' : '✕ មិនទាន់'}
                        </span>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: e.videoDone
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.13)',
                            color: e.videoDone ? '#059669' : '#dc2626',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.77rem',
                            display: 'inline-block',
                          }}
                        >
                          {e.videoDone ? '✓ បានថត' : '✕ មិនទាន់'}
                        </span>
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        {e.permissionDays === 0 && e.absentDays === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>
                            គ្មាន (0)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {e.permissionDays > 0 && (
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#d97706',
                                  padding: '0.16rem 0.45rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                ច្បាប់: {e.permissionDays}
                              </span>
                            )}
                            {e.absentDays > 0 && (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#dc2626',
                                  padding: '0.16rem 0.45rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                ឥតច្បាប់: {e.absentDays}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.58rem 0.5rem', textAlign: 'center' }}>
                        {e.lateCount === 0 && e.lateMinutes === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>
                            គ្មាន (0)
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(249, 115, 22, 0.14)',
                              color: '#ea580c',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              display: 'inline-block',
                            }}
                          >
                            {e.lateCount} ដង • {e.lateMinutes} នាទី
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.58rem 0.75rem', textAlign: 'center' }}>
                        <div>
                          <span
                            style={{
                              background: complete
                                ? 'rgba(16, 185, 129, 0.16)'
                                : 'rgba(245, 158, 11, 0.16)',
                              color: complete ? '#059669' : '#d97706',
                              padding: '0.24rem 0.65rem',
                              borderRadius: '999px',
                              fontWeight: 800,
                              fontSize: '0.77rem',
                              display: 'inline-block',
                            }}
                          >
                            {complete ? '🌟 គ្រប់លក្ខខណ្ឌ' : `⚠️ ខ្វះ ${missingCount} ផ្នែក`}
                          </span>
                          {screenshotShowDetails && e.note && (
                            <div
                              style={{
                                fontSize: '0.71rem',
                                color: textSub,
                                marginTop: '3px',
                                maxWidth: '150px',
                                marginInline: 'auto',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.note}
                            </div>
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

        {/* Clean Footer */}
        <div
          style={{
            padding: '0.7rem 1.25rem',
            background: light ? '#f8fafc' : '#0b1120',
            borderTop: `1px solid ${borderCol}`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.74rem',
            color: textSub,
          }}
        >
          <span>
            គោលការណ៍ប្រចាំសប្តាហ៍៖ រៀនយ៉ាងតិច ១ Topic • ដាក់កិច្ចការផ្ទះឱ្យសិស្ស • ថតវីដេអូសម្រាប់ Topic
          </span>
          <span style={{ fontWeight: 600 }}>កាលបរិច្ឆេទបូកសរុប៖ {todayStr}</span>
        </div>
      </div>
    );
  };

  if (role && role !== 'admin') return null;

  const isWeekTab = activeTab !== 'monthly' && activeTab !== 'screenshot';
  const currentWeekKey: WeekKey = isWeekTab ? activeTab : 'w1';
  const currentWeekInfo = WEEK_META.find((w) => w.key === currentWeekKey)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', paddingBottom: '2.5rem' }}>
      {/* Top Page Title & Action Bar */}
      <div
        className="card"
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
                {saveState === 'saving'
                  ? 'កំពុងរក្សាទុក...'
                  : saveState === 'error'
                    ? 'បញ្ហាក្នុងការរក្សាទុក!'
                    : 'រក្សាទុកស្វ័យប្រវត្តិ ✓'}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              កត់ត្រាការរៀន Topic • កិច្ចការផ្ទះសិស្ស • វីដេអូ Topic • អវត្តមាន & ការមកយឺតរបស់គ្រូប្រចាំសប្តាហ៍ និងខែ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
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
              background: 'var(--card-bg)',
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
        className="card"
        style={{
          padding: '0.85rem 1.15rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
        }}
      >
        {/* Month / Year Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleStepMonth(-1)}
            style={{
              padding: '0.42rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            title="ខែមុន"
          >
            ◀
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
              <option key={mName} value={i + 1}>
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
              <option key={yr} value={yr}>
                ឆ្នាំ {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleStepMonth(1)}
            style={{
              padding: '0.42rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            title="ខែបន្ទាប់"
          >
            ▶
          </button>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginLeft: '0.35rem',
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
              onChange={(e) => handleToggleWeek5(e.target.checked)}
              style={{ accentColor: '#0d9488' }}
            />
            មានសប្តាហ៍ទី ៥
          </label>
        </div>

        {/* Search & Inactive Teachers Toggle */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
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
              minWidth: '205px',
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

      {/* 4 Monthly Executive KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div className="card" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #0d9488' }}>
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

        <div className="card" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #3b82f6' }}>
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

        <div className="card" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            កិច្ចការផ្ទះ & វីដេអូប្រចាំខែ
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            HW: <span style={{ color: '#10b981' }}>{kpiStats.homeworkDoneTotal}</span> • វីដេអូ:{' '}
            <span style={{ color: '#8b5cf6' }}>{kpiStats.videoDoneTotal}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ក្នុងចំណោម {kpiStats.targetSlots} សប្តាហ៍-គ្រូ សរុប
          </div>
        </div>

        <div className="card" style={{ padding: '0.95rem 1.1rem', borderTop: '3px solid #f43f5e' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            អវត្តមាន & មកយឺតសរុបក្នុងខែ
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            អវត្តមាន <span style={{ color: '#ef4444' }}>{kpiStats.totalAbsences} ថ្ងៃ</span> • យឺត{' '}
            <span style={{ color: '#f97316' }}>{kpiStats.lateCountTotal} ដង</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ច្បាប់ {kpiStats.permissionTotal} | ឥតច្បាប់ {kpiStats.absentTotal} | សរុប {formatMinutesLabel(kpiStats.lateMinutesTotal)}
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        className="card"
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
                border: isSelected ? 'none' : '1px solid transparent',
                background: isSelected ? '#0d9488' : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {w.label}
            </button>
          );
        })}

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.2rem' }} />

        <button
          type="button"
          onClick={() => {
            setActiveTab('monthly');
            setScreenshotScope('monthly');
          }}
          style={{
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
          📊 បូកសរុបប្រចាំខែ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('screenshot')}
          style={{
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
          📸 ផ្ទាំងមើលគ្រូទាំងអស់ (Screenshot)
        </button>
      </div>

      {/* TAB CONTENT 1: WEEKLY FAST-ENTRY TABLE */}
      {isWeekTab && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Week Subheader with Optional Week Date Range */}
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
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  minWidth: '235px',
                  outline: 'none',
                }}
              />
            </div>

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
              📸 មើលផ្ទាំង Screenshot សម្រាប់ {currentWeekInfo.label}
            </button>
          </div>

          {isLoadingDoc ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              កំពុងទាញយកទិន្នន័យ...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', minWidth: '1080px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--main-bg)',
                      borderBottom: '2px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th style={{ padding: '0.7rem 0.5rem', textAlign: 'center', width: '40px' }}>ល.រ</th>
                    <th
                      style={{
                        padding: '0.7rem 0.75rem',
                        textAlign: 'left',
                        minWidth: '185px',
                        position: 'sticky',
                        left: 0,
                        background: 'var(--main-bg)',
                        zIndex: 2,
                      }}
                    >
                      គ្រូបង្រៀន
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'left', minWidth: '215px' }}>
                      ១. រៀន Topic (≥១/សប្តាហ៍)
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'left', minWidth: '155px' }}>
                      ២. កិច្ចការផ្ទះសិស្ស
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'left', minWidth: '205px' }}>
                      ៣. ថតវីដេអូ Topic
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center', minWidth: '175px' }}>
                      ៤. អវត្តមាន (ថ្ងៃគត់)
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center', minWidth: '185px' }}>
                      ៥. មកយឺត & នាទីយឺត
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'left', minWidth: '135px' }}>
                      ចំណាំ / មូលហេតុ
                    </th>
                    <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center', minWidth: '115px' }}>
                      ស្ថានភាព
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        មិនមានឈ្មោះគ្រូបង្រៀនត្រូវនឹងការស្វែងរកទេ
                      </td>
                    </tr>
                  ) : (
                    visibleTeachers.map((teacher, idx) => {
                      const entry = getEntry(teacher.id, currentWeekKey);
                      const complete = isWeekComplete(entry);
                      const cleanVideoHref = normalizeExternalUrl(entry.videoUrl);

                      return (
                        <tr
                          key={teacher.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: complete ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                          }}
                        >
                          {/* ល.រ */}
                          <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {idx + 1}
                          </td>

                          {/* គ្រូបង្រៀន (Sticky on scroll) */}
                          <td
                            style={{
                              padding: '0.65rem 0.75rem',
                              position: 'sticky',
                              left: 0,
                              background: 'var(--card-bg)',
                              zIndex: 1,
                              borderRight: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {renderAvatar(teacher, 34)}
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
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                                  {teacher.subject || teacher.teacherId || 'គ្រូបង្រៀន'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ១. រៀន Topic */}
                          <td style={{ padding: '0.65rem 0.6rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                                    padding: '0.28rem 0.6rem',
                                    borderRadius: '7px',
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
                                  }}
                                >
                                  {entry.topicDone ? '✓ បានរៀន' : 'មិនទាន់'}
                                </button>

                                {renderIntStepper(
                                  entry.topicCount,
                                  (val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({
                                        ...prev,
                                        topicCount: val,
                                        topicDone: val >= 1,
                                      }),
                                      imm
                                    ),
                                  '#059669',
                                  true,
                                  'rgba(16, 185, 129, 0.1)'
                                )}
                              </div>

                              <input
                                type="text"
                                value={entry.topicTitle}
                                onChange={(e) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, topicTitle: e.target.value }),
                                    false
                                  )
                                }
                                placeholder="ចំណងជើង Topic..."
                                style={{
                                  width: '100%',
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--main-bg)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.77rem',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </td>

                          {/* ២. ដាក់កិច្ចការផ្ទះឱ្យសិស្ស */}
                          <td style={{ padding: '0.65rem 0.6rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, homeworkDone: !prev.homeworkDone }),
                                    true
                                  )
                                }
                                style={{
                                  padding: '0.32rem 0.65rem',
                                  borderRadius: '7px',
                                  border: entry.homeworkDone
                                    ? '1px solid #10b981'
                                    : '1px solid var(--border-color)',
                                  background: entry.homeworkDone
                                    ? 'rgba(16, 185, 129, 0.14)'
                                    : 'var(--main-bg)',
                                  color: entry.homeworkDone ? '#059669' : 'var(--text-secondary)',
                                  fontWeight: 700,
                                  fontSize: '0.77rem',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                }}
                              >
                                {entry.homeworkDone ? '✓ បានដាក់ HW' : '✕ មិនទាន់ដាក់'}
                              </button>
                              <input
                                type="text"
                                value={entry.homeworkNote}
                                onChange={(e) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => ({ ...prev, homeworkNote: e.target.value }),
                                    false
                                  )
                                }
                                placeholder="ចំណាំកិច្ចការផ្ទះ..."
                                style={{
                                  width: '100%',
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--main-bg)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.77rem',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </td>

                          {/* ៣. ថតវីដេអូ Topic */}
                          <td style={{ padding: '0.65rem 0.6rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({ ...prev, videoDone: !prev.videoDone }),
                                      true
                                    )
                                  }
                                  style={{
                                    flex: 1,
                                    padding: '0.32rem 0.6rem',
                                    borderRadius: '7px',
                                    border: entry.videoDone
                                      ? '1px solid #10b981'
                                      : '1px solid var(--border-color)',
                                    background: entry.videoDone
                                      ? 'rgba(16, 185, 129, 0.14)'
                                      : 'var(--main-bg)',
                                    color: entry.videoDone ? '#059669' : 'var(--text-secondary)',
                                    fontWeight: 700,
                                    fontSize: '0.77rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {entry.videoDone ? '✓ បានថតវីដេអូ' : '✕ មិនទាន់ថត'}
                                </button>
                                {cleanVideoHref && (
                                  <a
                                    href={cleanVideoHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="បើកមើលវីដេអូ"
                                    style={{
                                      padding: '0.3rem 0.5rem',
                                      borderRadius: '7px',
                                      background: 'rgba(59, 130, 246, 0.14)',
                                      color: '#2563eb',
                                      fontWeight: 700,
                                      fontSize: '0.76rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    🔗 មើល
                                  </a>
                                )}
                              </div>
                              <input
                                type="url"
                                value={entry.videoUrl}
                                onChange={(e) =>
                                  updateTeacherWeek(
                                    teacher.id,
                                    currentWeekKey,
                                    (prev) => {
                                      const val = e.target.value;
                                      return {
                                        ...prev,
                                        videoUrl: val,
                                        videoDone: val.trim() ? true : prev.videoDone,
                                      };
                                    },
                                    false
                                  )
                                }
                                placeholder="Link វីដេអូ (Telegram/Drive)..."
                                style={{
                                  width: '100%',
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--main-bg)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.77rem',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </td>

                          {/* ៤. អវត្តមានសប្តាហ៍ (ច្បាប់ & ឥតច្បាប់ — integer only) */}
                          <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.73rem', color: '#d97706', fontWeight: 700, width: '48px', textAlign: 'right' }}>
                                  ច្បាប់៖
                                </span>
                                {renderIntStepper(
                                  entry.permissionDays,
                                  (val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({ ...prev, permissionDays: val }),
                                      imm
                                    ),
                                  '#d97706',
                                  true,
                                  'rgba(245, 158, 11, 0.12)'
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.73rem', color: '#dc2626', fontWeight: 700, width: '48px', textAlign: 'right' }}>
                                  ឥតច្បាប់៖
                                </span>
                                {renderIntStepper(
                                  entry.absentDays,
                                  (val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({ ...prev, absentDays: val }),
                                      imm
                                    ),
                                  '#dc2626',
                                  true,
                                  'rgba(239, 68, 68, 0.12)'
                                )}
                              </div>
                            </div>
                          </td>

                          {/* ៥. មកយឺត (ដង) & នាទីដែលយឺត (នាទី) */}
                          <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 700, width: '36px', textAlign: 'right' }}>
                                  ដង៖
                                </span>
                                {renderIntStepper(
                                  entry.lateCount,
                                  (val, imm) =>
                                    updateTeacherWeek(
                                      teacher.id,
                                      currentWeekKey,
                                      (prev) => ({
                                        ...prev,
                                        lateCount: val,
                                        lateMinutes: val === 0 ? 0 : prev.lateMinutes,
                                      }),
                                      imm
                                    ),
                                  '#ea580c',
                                  true,
                                  'rgba(249, 115, 22, 0.12)'
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 700, width: '36px', textAlign: 'right' }}>
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
                                      width: '48px',
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

                          {/* ចំណាំ / មូលហេតុ */}
                          <td style={{ padding: '0.65rem 0.6rem' }}>
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
                              placeholder="ចំណាំ..."
                              style={{
                                width: '100%',
                                padding: '0.38rem 0.55rem',
                                borderRadius: '7px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--main-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.78rem',
                                outline: 'none',
                              }}
                            />
                          </td>

                          {/* ស្ថានភាពសប្តាហ៍ */}
                          <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.28rem 0.65rem',
                                borderRadius: '999px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                background: complete
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                                color: complete ? '#059669' : '#d97706',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {complete ? '✓ គ្រប់លក្ខខណ្ឌ' : 'នៅខ្វះ'}
                            </span>
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
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
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
              📸 Screenshot តារាងបូកសរុបខែ
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', minWidth: '960px' }}>
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
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>សប្តាហ៍ (S1–S{activeWeeks.length})</th>
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>សរុប Topic</th>
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>កិច្ចការផ្ទះ</th>
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>វីដេអូបានថត</th>
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>អវត្តមានសរុបក្នុងខែ</th>
                  <th style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>មកយឺតសរុបក្នុងខែ</th>
                  <th style={{ padding: '0.7rem 0.75rem', textAlign: 'center', minWidth: '145px' }}>អត្រាសម្រេច</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map((s, idx) => (
                  <tr key={s.teacher.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {renderAvatar(s.teacher, 34)}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {s.teacher.fullName}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                            {s.teacher.subject || s.teacher.teacherId || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '5px' }}>
                        {activeWeeks.map((w) => {
                          const done = s.perWeek[w.key]?.complete;
                          return (
                            <button
                              key={w.key}
                              type="button"
                              onClick={() => setActiveTab(w.key)}
                              title={`ចូលមើល ${w.label}`}
                              style={{
                                width: '28px',
                                height: '25px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '0.72rem',
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
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                      <span
                        style={{
                          padding: '0.24rem 0.6rem',
                          borderRadius: '999px',
                          background:
                            s.topicWeeksDone >= s.weeksCount
                              ? 'rgba(16, 185, 129, 0.14)'
                              : 'rgba(59, 130, 246, 0.12)',
                          color: s.topicWeeksDone >= s.weeksCount ? '#059669' : '#2563eb',
                          fontSize: '0.8rem',
                        }}
                      >
                        {s.totalTopics} Topics ({s.topicWeeksDone}/{s.weeksCount})
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                      <span style={{ color: s.homeworkWeeksDone >= s.weeksCount ? '#059669' : 'var(--text-primary)' }}>
                        {s.homeworkWeeksDone} / {s.weeksCount} សប្តាហ៍
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                      <span style={{ color: s.videoWeeksDone >= s.weeksCount ? '#059669' : 'var(--text-primary)' }}>
                        {s.videoWeeksDone} / {s.weeksCount} វីដេអូ
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                      {s.totalAbsenceDays === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>0 ថ្ងៃ</span>
                      ) : (
                        <div style={{ fontSize: '0.79rem', fontWeight: 700 }}>
                          <span style={{ color: '#d97706' }}>ច្បាប់ {s.permissionDays}</span>
                          {' • '}
                          <span style={{ color: '#dc2626' }}>ឥតច្បាប់ {s.absentDays}</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            សរុប {s.totalAbsenceDays} ថ្ងៃ
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                      {s.lateCount === 0 && s.lateMinutes === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>0 ដង</span>
                      ) : (
                        <div style={{ fontSize: '0.79rem', fontWeight: 700, color: '#ea580c' }}>
                          {s.lateCount} ដង
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
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
                            width: '90px',
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

      {/* TAB CONTENT 3: INLINE SCREENSHOT VIEW FOR ALL TEACHERS */}
      {activeTab === 'screenshot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Screenshot Customization Toolbar */}
          <div
            className="card"
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
              <button
                type="button"
                onClick={() => setScreenshotLightCard((v) => !v)}
                style={{
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
                {screenshotLightCard ? '☀️ ផ្ទៃភ្លឺច្បាស់' : '🌙 ផ្ទៃងងឹត'}
              </button>

              {screenshotScope !== 'monthly' && (
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
                  បង្ហាញចំណងជើង Topic
                </label>
              )}

              <button
                type="button"
                onClick={handleCopyGroupChatSummary}
                style={{
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
                {copiedSummary ? '✓ បានចម្លងអត្ថបទ!' : '📋 ចម្លងអត្ថបទសង្ខេប'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setHideFullscreenToolbar(false);
                  setIsFullscreenShot(true);
                }}
                style={{
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
                🖥️ បើកពេញអេក្រង់ដើម្បី Screenshot
              </button>
            </div>
          </div>

          {/* Inline Preview of the Clean Screenshot Board */}
          {renderScreenshotBoard(false)}
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
              zIndex: 20050,
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
                  maxWidth: '1220px',
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
                  <button
                    type="button"
                    onClick={() => setScreenshotLightCard((v) => !v)}
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
                  >
                    {screenshotLightCard ? '☀️ ផ្ទៃភ្លឺ' : '🌙 ផ្ទៃងងឹត'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyGroupChatSummary}
                    style={{
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
                    {copiedSummary ? '✓ បានចម្លង!' : '📋 ចម្លងអត្ថបទ'}
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
                    }}
                  >
                    ✕ បិទ
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

            {renderScreenshotBoard(true)}
          </div>,
          document.body
        )}
    </div>
  );
}
