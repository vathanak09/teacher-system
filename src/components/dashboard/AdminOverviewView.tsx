"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatRiels, parseLocalDate } from '@/utils/paymentBilling';
import { AppIcon } from '@/components/AppIcons';
import KhmerMonthPicker from '@/components/KhmerMonthPicker';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { TeacherAvatar } from '@/components/teacher-tracking/TrackingControls';
import {
  EnrichedClassSummary,
  TeacherReportRow,
  computeSchoolFinancialAnalytics,
  formatKhmerFullDate,
  formatShortMonthKh,
  formatYearMonthKh,
  isFemaleGender,
  isStudentActive,
  isStudentDropped,
  isStudentSuspended,
} from './dashboardMetrics';

function formatCompactRiels(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
  return String(val);
}

export default function AdminOverviewView({
  students,
  teachers,
  enrichedClasses,
  teacherReports,
  payments,
  upcomingDays = 5,
  scoreMonth,
  onScoreMonthChange,
  hiddenTeacherIds = [],
  onChangeHiddenTeacherIds,
  onInspectTeacher,
}: {
  students: any[];
  teachers: any[];
  enrichedClasses: EnrichedClassSummary[];
  teacherReports: TeacherReportRow[];
  payments: any[];
  upcomingDays?: number;
  scoreMonth: string;
  onScoreMonthChange: (ym: string) => void;
  hiddenTeacherIds?: string[];
  onChangeHiddenTeacherIds?: (next: string[]) => void;
  onInspectTeacher: (teacherId: string) => void;
}) {
  const [teacherViewMode, setTeacherViewMode] = useState<'table' | 'cards'>('table');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [chartGroupMode, setChartGroupMode] = useState<'shift' | 'level'>('shift');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setTeacherViewMode('cards');
    }
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayFullKh = useMemo(() => formatKhmerFullDate(today), [today]);
  const scoreMonthKh = useMemo(() => formatYearMonthKh(scoreMonth), [scoreMonth]);
  const shortScoreMonthKh = useMemo(() => formatShortMonthKh(scoreMonth), [scoreMonth]);

  // 1. School-wide Student Counts
  const studentMetrics = useMemo(() => {
    let active = 0;
    let girls = 0;
    let boys = 0;
    let suspended = 0;
    let dropped = 0;
    let newThisMonth = 0;

    const curY = today.getFullYear();
    const curM = today.getMonth();

    students.forEach((s) => {
      if (isStudentDropped(s.status)) {
        dropped += 1;
      } else if (isStudentSuspended(s.status)) {
        suspended += 1;
      } else {
        active += 1;
        if (isFemaleGender(s.gender)) girls += 1;
        else boys += 1;
      }

      const enrollDt = parseLocalDate(s.enrollDate);
      if (enrollDt && enrollDt.getFullYear() === curY && enrollDt.getMonth() === curM) {
        newThisMonth += 1;
      }
    });

    return { active, girls, boys, suspended, dropped, newThisMonth, totalAll: students.length };
  }, [students, today]);

  // 2. Financial & Billing Analytics
  const finance = useMemo(
    () =>
      computeSchoolFinancialAnalytics({
        students,
        payments,
        classes: enrichedClasses.map((ec) => ec.cls),
        upcomingDays,
        today,
      }),
    [students, payments, enrichedClasses, upcomingDays, today]
  );

  // 3. School-wide Attendance & Score Totals
  const schoolClassStats = useMemo(() => {
    let attClassesTaken = 0;
    let totalAbsentToday = 0;
    let totalPermissionToday = 0;
    let totalPresentToday = 0;
    let scoreClassesComplete = 0;

    enrichedClasses.forEach((ec) => {
      if (ec.attendanceToday.isTaken) attClassesTaken += 1;
      totalAbsentToday += ec.attendanceToday.absentCount;
      totalPermissionToday += ec.attendanceToday.permissionCount;
      totalPresentToday += ec.attendanceToday.presentCount;
      if (ec.scoreStatus.state === 'complete') scoreClassesComplete += 1;
    });

    const activeTeachersCount = teachers.filter((t) => t.status !== 'ឈប់បង្រៀន').length;

    return {
      totalClasses: enrichedClasses.length,
      activeTeachersCount,
      attClassesTaken,
      totalAbsentToday,
      totalPermissionToday,
      totalPresentToday,
      scoreClassesComplete,
    };
  }, [enrichedClasses, teachers]);

  // 4. Teacher Visibility Dropdown & Filtered Teacher Reports
  const eligibleTeacherReports = useMemo(
    () => teacherReports.filter((tr) => tr.teacher.status !== 'ឈប់បង្រៀន'),
    [teacherReports]
  );

  const hiddenTeacherSet = useMemo(() => new Set(hiddenTeacherIds), [hiddenTeacherIds]);

  const teacherVisibilityOptions = useMemo(
    () =>
      eligibleTeacherReports.map((tr) => ({
        value: tr.teacher.id,
        label: tr.teacher.subject
          ? `${tr.teacher.fullName} (${tr.teacher.subject})`
          : tr.teacher.fullName,
      })),
    [eligibleTeacherReports]
  );

  const selectedVisibleTeacherIds = useMemo(
    () =>
      eligibleTeacherReports
        .filter((tr) => !hiddenTeacherSet.has(tr.teacher.id))
        .map((tr) => tr.teacher.id),
    [eligibleTeacherReports, hiddenTeacherSet]
  );

  const handleVisibleTeachersChange = (nextSelectedIds: string[]) => {
    if (!onChangeHiddenTeacherIds) return;
    const nextSelectedSet = new Set(nextSelectedIds);
    const eligibleIdSet = new Set(eligibleTeacherReports.map((tr) => tr.teacher.id));
    const preservedOtherHidden = hiddenTeacherIds.filter((id) => !eligibleIdSet.has(id));
    const newlyHiddenEligible = eligibleTeacherReports
      .filter((tr) => !nextSelectedSet.has(tr.teacher.id))
      .map((tr) => tr.teacher.id);
    onChangeHiddenTeacherIds([...preservedOtherHidden, ...newlyHiddenEligible]);
  };

  const hiddenEligibleCount = eligibleTeacherReports.length - selectedVisibleTeacherIds.length;
  const teacherDropdownTriggerLabel =
    hiddenEligibleCount === 0
      ? `បង្ហាញគ្រូ៖ ទាំងអស់ (${eligibleTeacherReports.length})`
      : `បង្ហាញគ្រូ៖ ${selectedVisibleTeacherIds.length}/${eligibleTeacherReports.length} នាក់`;

  const filteredTeacherReports = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return eligibleTeacherReports.filter((tr) => {
      if (hiddenTeacherSet.has(tr.teacher.id)) return false;
      if (!q) return true;
      return (
        String(tr.teacher.fullName || '').toLowerCase().includes(q) ||
        String(tr.teacher.englishName || '').toLowerCase().includes(q) ||
        String(tr.teacher.subject || '').toLowerCase().includes(q)
      );
    });
  }, [eligibleTeacherReports, hiddenTeacherSet, teacherSearch]);

  // 5. Payment Status Donut Data
  const paymentDonutData = useMemo(
    () =>
      [
        { name: 'បង់រួច', value: finance.paidUpCount, color: '#10b981' },
        { name: `ជិតដល់ថ្ងៃ (≤${upcomingDays}ថ្ងៃ)`, value: finance.upcomingCount, color: '#3b82f6' },
        { name: 'ដល់ថ្ងៃបង់', value: finance.dueTodayCount, color: '#f59e0b' },
        { name: 'ហួសថ្ងៃបង់', value: finance.overdueCount, color: '#ef4444' },
      ].filter((d) => d.value > 0),
    [finance, upcomingDays]
  );

  // 6. Active Students by Shift or Level Chart Data
  const studentBreakdownChart = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((s) => {
      if (!isStudentActive(s.status)) return;
      const rawKey =
        chartGroupMode === 'shift'
          ? String(s.shift || '').trim() || 'មិនកំណត់វេន'
          : String(s.level || '').trim() || 'មិនកំណត់កម្រិត';
      counts.set(rawKey, (counts.get(rawKey) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, ចំនួនសិស្ស]) => ({ name, ចំនួនសិស្ស }))
      .sort((a, b) => b.ចំនួនសិស្ស - a.ចំនួនសិស្ស)
      .slice(0, 10);
  }, [students, chartGroupMode]);

  // 7. Classes needing roster cleanup
  const classesNeedingCleanup = useMemo(
    () =>
      enrichedClasses
        .map((ec) => ec.rosterAlert)
        .filter(
          (ra) =>
            ra.deletedFromMainCount > 0 || ra.droppedOutCount > 0 || ra.multiClassCount > 0
        )
        .sort(
          (a, b) =>
            b.deletedFromMainCount * 3 +
            b.droppedOutCount * 2 +
            b.multiClassCount -
            (a.deletedFromMainCount * 3 + a.droppedOutCount * 2 + a.multiClassCount)
        ),
    [enrichedClasses]
  );

  const emptyTeachersNotice = (
    <>
      <div>
        {hiddenEligibleCount > 0 && !teacherSearch.trim()
          ? 'គ្រូបង្រៀនត្រូវបានលាក់ទាំងអស់។ ចុចប៊ូតុងខាងក្រោមដើម្បីបង្ហាញវិញ។'
          : 'មិនមានឈ្មោះគ្រូបង្រៀនទេ'}
      </div>
      {hiddenEligibleCount > 0 && onChangeHiddenTeacherIds && (
        <button
          type="button"
          onClick={() => onChangeHiddenTeacherIds([])}
          style={{
            marginTop: '0.65rem',
            padding: '0.4rem 0.9rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--primary-color, #2563eb)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          បង្ហាញគ្រូទាំងអស់វិញ
        </button>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
      {/* Executive Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.15rem 1.3rem',
          borderRadius: '18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.9rem',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--primary-color, #2563eb) 10%, var(--card-bg)) 0%, var(--card-bg) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'color-mix(in srgb, var(--primary-color, #2563eb) 15%, transparent)',
              color: 'var(--primary-color, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="building" size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ទិដ្ឋភាពរួមសាលា
            </h1>
            <div
              style={{
                marginTop: '0.22rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.79rem',
                color: 'var(--text-secondary)',
              }}
            >
              <AppIcon name="calendar" size={14} style={{ color: 'var(--primary-color, #2563eb)' }} />
              <span>{todayFullKh}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <KhmerMonthPicker value={scoreMonth} onChange={onScoreMonthChange} label="ខែពិន្ទុ៖" />

          <Link
            href="/dashboard/teacher-tracking"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.46rem 0.85rem',
              borderRadius: '10px',
              background: '#0d9488',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.79rem',
              textDecoration: 'none',
              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.22)',
            }}
          >
            <AppIcon name="user-check" size={15} />
            <span>តាមដានការងារគ្រូ</span>
          </Link>
        </div>
      </div>

      {/* 1. Five School KPIs — Featured Span + 2x2 Grid on Mobile, 5 Columns on Desktop */}
      <div className="dashboard-admin-kpi-grid">
        {/* KPI 1: Total Students Across School (spans 2 cols on mobile for symmetrical 1 + 2x2 layout) */}
        <Link
          href="/dashboard/students"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card dashboard-kpi-span-mobile"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              សិស្សកំពុងសិក្សាទូទាំងសាលា
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'rgba(14, 165, 233, 0.14)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="users" size={16} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="dashboard-kpi-value" style={{ color: 'var(--text-primary)' }}>
              {studentMetrics.active}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                នាក់
              </span>
            </span>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 800,
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#059669',
              }}
            >
              +{studentMetrics.newThisMonth} ចូលថ្មីខែនេះ
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.71rem', fontWeight: 700 }}>
            <span style={{ color: '#ec4899' }}>ស្រី {studentMetrics.girls}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#3b82f6' }}>ប្រុស {studentMetrics.boys}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ព្យួរ {studentMetrics.suspended}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#ef4444' }}>ឈប់រៀន {studentMetrics.dropped}</span>
          </div>
        </Link>

        {/* KPI 2: Revenue This Month */}
        <Link
          href="/dashboard/payments"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              ចំណូលខែនេះ
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(22, 163, 74, 0.14)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="wallet" size={15} />
            </div>
          </div>

          <div
            className="dashboard-kpi-value"
            style={{ color: '#16a34a', fontSize: '1.18rem' }}
          >
            {formatRiels(finance.thisMonthRevenueRiels)}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            បានបង់ <strong>{finance.thisMonthReceiptCount}</strong> វិក្កយបត្រ
          </div>
        </Link>

        {/* KPI 3: Due & Overdue Students */}
        <Link
          href="/dashboard/payments"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              ដល់ថ្ងៃ & ហួសថ្ងៃ
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.14)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="alert-triangle" size={15} />
            </div>
          </div>

          <div className="dashboard-kpi-value" style={{ color: '#dc2626' }}>
            {finance.dueAndOverdueCount}{' '}
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>នាក់</span>
          </div>

          <div
            style={{
              fontSize: '0.69rem',
              color: '#dc2626',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatRiels(finance.totalDueAndOverdueRiels)}
          </div>
        </Link>

        {/* KPI 4: School Attendance Today */}
        <Link
          href="/dashboard/attendance"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              វត្តមានថ្ងៃនេះ
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="clipboard-check" size={15} />
            </div>
          </div>

          <div className="dashboard-kpi-value" style={{ color: 'var(--text-primary)' }}>
            {schoolClassStats.attClassesTaken}/{schoolClassStats.totalClasses}{' '}
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              ថ្នាក់
            </span>
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#ef4444' }}>អវត្តមាន {schoolClassStats.totalAbsentToday}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ច្បាប់ {schoolClassStats.totalPermissionToday}</span>
          </div>
        </Link>

        {/* KPI 5: Active Teachers & Classes */}
        <Link
          href="/dashboard/scores"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              គ្រូ & ថ្នាក់សកម្ម
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.14)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="graduation-cap" size={15} />
            </div>
          </div>

          <div className="dashboard-kpi-value" style={{ color: '#7c3aed', fontSize: '1.22rem' }}>
            {schoolClassStats.activeTeachersCount} គ្រូ • {schoolClassStats.totalClasses} ថ្នាក់
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            ពិន្ទុ ({shortScoreMonthKh})៖{' '}
            <strong style={{ color: '#059669' }}>
              {schoolClassStats.scoreClassesComplete}/{schoolClassStats.totalClasses}
            </strong>
          </div>
        </Link>
      </div>

      {/* 2. Per-Teacher Teaching Report & Drill-down */}
      <div className="glass-panel" style={{ padding: '0', borderRadius: '18px', overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.95rem 1.15rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--main-bg)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AppIcon name="users" size={18} style={{ color: 'var(--primary-color, #2563eb)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                របាយការណ៍បង្រៀនតាមគ្រូម្នាក់ៗ ({filteredTeacherReports.length} នាក់)
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ស្ថានភាពវត្តមានថ្ងៃនេះ • ការបញ្ចូលពិន្ទុ ({scoreMonthKh}) • សៀវភៅបង្រៀន • ថ្ងៃទី ២០ រាប់ខែថ្មី
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
            {onChangeHiddenTeacherIds && eligibleTeacherReports.length > 0 && (
              <MultiSelectDropdown
                options={teacherVisibilityOptions}
                selectedValues={selectedVisibleTeacherIds}
                onChange={handleVisibleTeachersChange}
                allLabel={`បង្ហាញគ្រូ៖ ទាំងអស់ (${eligibleTeacherReports.length})`}
                title="ជ្រើសរើសគ្រូបង្ហាញ"
                searchable={true}
                searchPlaceholder="ស្វែងរកឈ្មោះគ្រូ..."
                fixedTriggerLabel={teacherDropdownTriggerLabel}
                icon={<AppIcon name="users" size={15} />}
              />
            )}

            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះគ្រូ..."
              style={{
                padding: '0.38rem 0.7rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--modal-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.79rem',
                outline: 'none',
                minWidth: '155px',
                flex: '1 1 155px',
              }}
            />

            <div
              style={{
                display: 'inline-flex',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                background: 'var(--modal-bg)',
              }}
            >
              <button
                type="button"
                onClick={() => setTeacherViewMode('cards')}
                style={{
                  padding: '0.36rem 0.68rem',
                  border: 'none',
                  background:
                    teacherViewMode === 'cards' ? 'var(--primary-color, #2563eb)' : 'transparent',
                  color: teacherViewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                កាតគ្រូ
              </button>
              <button
                type="button"
                onClick={() => setTeacherViewMode('table')}
                style={{
                  padding: '0.36rem 0.68rem',
                  border: 'none',
                  background:
                    teacherViewMode === 'table' ? 'var(--primary-color, #2563eb)' : 'transparent',
                  color: teacherViewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                តារាង
              </button>
            </div>
          </div>
        </div>

        {teacherViewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '940px' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--main-bg)',
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th style={{ padding: '0.68rem 0.75rem', textAlign: 'left' }}>គ្រូបង្រៀន</th>
                  <th style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>ថ្នាក់ & សិស្ស</th>
                  <th style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>វត្តមានថ្ងៃនេះ</th>
                  <th style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                    ការបញ្ចូលពិន្ទុ ({scoreMonthKh})
                  </th>
                  <th style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>សៀវភៅមធ្យម</th>
                  <th style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>ការងារគ្រូខែនេះ</th>
                  <th style={{ padding: '0.68rem 0.75rem', textAlign: 'right' }}>ពិនិត្យលម្អិត</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeacherReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {emptyTeachersNotice}
                    </td>
                  </tr>
                ) : (
                  filteredTeacherReports.map((tr) => {
                    const allAttDone =
                      tr.classCount > 0 && tr.attendanceClassesTaken >= tr.classCount;
                    const allScoreDone =
                      tr.classCount > 0 && tr.scoreClassesComplete >= tr.classCount;
                    const someScoreDone =
                      tr.scoreClassesComplete > 0 || tr.scoreClassesPartial > 0;
                    const trackPct = tr.trackingSummary?.completionPct ?? 0;

                    return (
                      <tr key={tr.teacher.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.68rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <TeacherAvatar teacher={tr.teacher} size={36} />
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                {tr.teacher.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                {tr.teacher.subject || tr.teacher.teacherId || 'គ្រូបង្រៀន'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {tr.classCount} ថ្នាក់ • {tr.activeStudentsCount} សិស្ស
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            ស្រី {tr.girlsCount} • ប្រុស {tr.boysCount}
                          </div>
                        </td>

                        <td style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                          {tr.classCount === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>គ្មានថ្នាក់</span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  background: allAttDone
                                    ? 'rgba(16, 185, 129, 0.14)'
                                    : tr.attendanceClassesTaken > 0
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(239, 68, 68, 0.12)',
                                  color: allAttDone
                                    ? '#059669'
                                    : tr.attendanceClassesTaken > 0
                                      ? '#d97706'
                                      : '#dc2626',
                                }}
                              >
                                <AppIcon
                                  name={allAttDone ? 'check-circle' : 'clock'}
                                  size={13}
                                />
                                <span>
                                  {allAttDone ? 'ស្រង់រួច' : 'បាន'} {tr.attendanceClassesTaken}/{tr.classCount}
                                </span>
                              </span>
                              {tr.absentTodayCount > 0 && (
                                <div style={{ fontSize: '0.69rem', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                                  អវត្តមានថ្ងៃនេះ៖ {tr.absentTodayCount} នាក់
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                          {tr.classCount === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>គ្មានថ្នាក់</span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  background: allScoreDone
                                    ? 'rgba(16, 185, 129, 0.14)'
                                    : someScoreDone
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(239, 68, 68, 0.13)',
                                  color: allScoreDone
                                    ? '#059669'
                                    : someScoreDone
                                      ? '#d97706'
                                      : '#dc2626',
                                }}
                              >
                                <AppIcon
                                  name={
                                    allScoreDone
                                      ? 'check-circle'
                                      : someScoreDone
                                        ? 'clock'
                                        : 'x-circle'
                                  }
                                  size={13}
                                />
                                <span>
                                  {allScoreDone
                                    ? `រួចរាល់ (${tr.scoreClassesComplete}/${tr.classCount})`
                                    : someScoreDone
                                      ? `បានខ្លះ (${tr.scoreClassesComplete}/${tr.classCount})`
                                      : `មិនទាន់ (0/${tr.classCount})`}
                                </span>
                              </span>
                              <div style={{ fontSize: '0.69rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {tr.totalScoredStudents}/{tr.totalExpectedScoreStudents} សិស្ស
                              </div>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#2563eb' }}>
                              {tr.avgBookProgressPct}%
                            </span>
                            <div
                              style={{
                                width: '74px',
                                height: '6px',
                                borderRadius: '999px',
                                background: 'var(--border-color)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${tr.avgBookProgressPct}%`,
                                  height: '100%',
                                  background: '#3b82f6',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.68rem 0.55rem', textAlign: 'center' }}>
                          {tr.trackingSummary ? (
                            <div style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                              <span
                                style={{
                                  color:
                                    trackPct === 100
                                      ? '#059669'
                                      : trackPct >= 60
                                        ? '#d97706'
                                        : 'var(--text-secondary)',
                                }}
                              >
                                សម្រេច {trackPct}%
                              </span>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                Topic {tr.trackingSummary.totalTopics} • HW {tr.trackingSummary.totalHomeworkCount} • វីដេអូ {tr.trackingSummary.totalVideoCount}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '0.68rem 0.75rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => onInspectTeacher(tr.teacher.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.38rem 0.75rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span>មើល Dashboard</span>
                            <AppIcon name="chevron-right" size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : filteredTeacherReports.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {emptyTeachersNotice}
          </div>
        ) : (
          <div
            style={{
              padding: '0.95rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
              gap: '0.85rem',
            }}
          >
            {filteredTeacherReports.map((tr) => {
              const allAttDone =
                tr.classCount > 0 && tr.attendanceClassesTaken >= tr.classCount;
              const allScoreDone =
                tr.classCount > 0 && tr.scoreClassesComplete >= tr.classCount;
              const someScoreDone =
                tr.scoreClassesComplete > 0 || tr.scoreClassesPartial > 0;

              return (
                <div
                  key={tr.teacher.id}
                  className="glass-panel glass-panel-hoverable"
                  style={{
                    padding: '1rem',
                    borderRadius: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <TeacherAvatar teacher={tr.teacher} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tr.teacher.fullName}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {tr.teacher.subject || 'គ្រូបង្រៀន'} • {tr.classCount} ថ្នាក់ ({tr.activeStudentsCount} សិស្ស)
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Side-by-Side Status Tiles */}
                  <div className="dashboard-status-pair">
                    <div
                      style={{
                        padding: '0.45rem 0.55rem',
                        borderRadius: '9px',
                        background: 'var(--main-bg)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.69rem', fontWeight: 600 }}>
                        វត្តមានថ្ងៃនេះ
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          marginTop: '2px',
                          color: allAttDone ? '#059669' : '#d97706',
                        }}
                      >
                        <AppIcon name={allAttDone ? 'check-circle' : 'clock'} size={13} />
                        <span>
                          {tr.attendanceClassesTaken}/{tr.classCount} ថ្នាក់
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.45rem 0.55rem',
                        borderRadius: '9px',
                        background: 'var(--main-bg)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.69rem', fontWeight: 600 }}>
                        ពិន្ទុ ({shortScoreMonthKh})
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          marginTop: '2px',
                          color: allScoreDone ? '#059669' : someScoreDone ? '#d97706' : '#dc2626',
                        }}
                      >
                        <AppIcon
                          name={
                            allScoreDone ? 'check-circle' : someScoreDone ? 'clock' : 'x-circle'
                          }
                          size={13}
                        />
                        <span>
                          {tr.scoreClassesComplete}/{tr.classCount} ថ្នាក់
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      សៀវភៅ៖ <strong style={{ color: '#2563eb' }}>{tr.avgBookProgressPct}%</strong>
                      {tr.trackingSummary ? (
                        <>
                          {' • '}ការងារ៖{' '}
                          <strong style={{ color: '#0d9488' }}>
                            {tr.trackingSummary.completionPct}%
                          </strong>
                        </>
                      ) : null}
                    </span>

                    <button
                      type="button"
                      onClick={() => onInspectTeacher(tr.teacher.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.28rem',
                        padding: '0.36rem 0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>មើល Dashboard</span>
                      <AppIcon name="chevron-right" size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. School Analytics Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 305px), 1fr))',
          gap: '0.95rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <AppIcon name="wallet" size={17} style={{ color: '#16a34a' }} />
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ចំណូលប្រចាំខែ (៦ ខែចុងក្រោយ — រៀល)
            </h3>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finance.last6Months} margin={{ top: 8, right: 10, left: -8, bottom: 8 }}>
                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis
                  tickFormatter={formatCompactRiels}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any) => [formatRiels(Number(value) || 0), 'ចំណូលសរុប']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                  }}
                />
                <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <AppIcon name="receipt" size={17} style={{ color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ស្ថានភាពការបង់ប្រាក់សិស្សសកម្ម
            </h3>
          </div>
          {paymentDonutData.length > 0 ? (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentDonutData}
                    cx="50%"
                    cy="46%"
                    innerRadius={50}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentDonutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--modal-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              មិនទាន់មានទិន្នន័យ
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem' }}>
              <AppIcon name="bar-chart" size={17} style={{ color: '#6366f1' }} />
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                សិស្សសកម្មតាម{chartGroupMode === 'shift' ? 'វេន' : 'កម្រិត'}
              </h3>
            </div>
            <div style={{ display: 'inline-flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setChartGroupMode('shift')}
                style={{
                  padding: '0.22rem 0.52rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: chartGroupMode === 'shift' ? '#6366f1' : 'var(--main-bg)',
                  color: chartGroupMode === 'shift' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.71rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                វេន
              </button>
              <button
                type="button"
                onClick={() => setChartGroupMode('level')}
                style={{
                  padding: '0.22rem 0.52rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: chartGroupMode === 'level' ? '#6366f1' : 'var(--main-bg)',
                  color: chartGroupMode === 'level' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.71rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                កម្រិត
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentBreakdownChart} margin={{ top: 8, right: 10, left: -18, bottom: 16 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                  }}
                />
                <Bar dataKey="ចំនួនសិស្ស" fill="#6366f1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Attention Needed Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 315px), 1fr))',
          gap: '0.95rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AppIcon name="alert-triangle" size={17} style={{ color: '#dc2626' }} />
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                សិស្សហួសថ្ងៃបង់ប្រាក់យូរជាងគេ
              </h3>
            </div>
            <Link
              href="/dashboard/payments"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#dc2626',
                textDecoration: 'none',
              }}
            >
              <span>ទំព័របង់ប្រាក់</span>
              <AppIcon name="chevron-right" size={13} />
            </Link>
          </div>

          {finance.topOverdueStudents.length === 0 ? (
            <div
              style={{
                padding: '1.6rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.84rem',
              }}
            >
              <AppIcon name="check-circle" size={16} />
              <span>មិនមានសិស្សដល់ថ្ងៃ ឬហួសថ្ងៃបង់ប្រាក់ទេ</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {finance.topOverdueStudents.map((b) => (
                <div
                  key={b.student.id}
                  style={{
                    padding: '0.62rem 0.78rem',
                    borderRadius: '10px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                      {b.student.fullName}{' '}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ({b.student.studentId || 'គ្មានអត្តលេខ'})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {b.roomAndTeacher || 'មិនទាន់មានថ្នាក់'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.12rem 0.48rem',
                        borderRadius: '999px',
                        fontSize: '0.71rem',
                        fontWeight: 800,
                        background:
                          b.overdueDays > 0
                            ? 'rgba(239, 68, 68, 0.14)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: b.overdueDays > 0 ? '#dc2626' : '#d97706',
                      }}
                    >
                      {b.overdueDays > 0 ? `លើស ${b.overdueDays} ថ្ងៃ` : 'ដល់ថ្ងៃនេះ'}
                    </span>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {formatRiels(b.amountDue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AppIcon name="layers" size={17} style={{ color: '#d97706' }} />
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ថ្នាក់រៀនត្រូវពិនិត្យសម្អាតឈ្មោះសិស្ស
              </h3>
            </div>
            <Link
              href="/dashboard/classes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#d97706',
                textDecoration: 'none',
              }}
            >
              <span>ទំព័រថ្នាក់រៀន</span>
              <AppIcon name="chevron-right" size={13} />
            </Link>
          </div>

          {classesNeedingCleanup.length === 0 ? (
            <div
              style={{
                padding: '1.6rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.84rem',
              }}
            >
              <AppIcon name="check-circle" size={16} />
              <span>បញ្ជីសិស្សតាមថ្នាក់ទាំងអស់ស្អាតត្រឹមត្រូវ</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {classesNeedingCleanup.slice(0, 8).map((ra) => (
                <div
                  key={ra.classId}
                  style={{
                    padding: '0.62rem 0.78rem',
                    borderRadius: '10px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                      {ra.className}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      គ្រូ៖ {ra.teacherName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
                    {ra.deletedFromMainCount > 0 && (
                      <span
                        style={{
                          padding: '0.14rem 0.45rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.13)',
                          color: '#dc2626',
                        }}
                      >
                        លុបពីបញ្ជីធំ៖ {ra.deletedFromMainCount}
                      </span>
                    )}
                    {ra.droppedOutCount > 0 && (
                      <span
                        style={{
                          padding: '0.14rem 0.45rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: '#d97706',
                        }}
                      >
                        ឈប់រៀន៖ {ra.droppedOutCount}
                      </span>
                    )}
                    {ra.multiClassCount > 0 && (
                      <span
                        style={{
                          padding: '0.14rem 0.45rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'rgba(139, 92, 246, 0.14)',
                          color: '#7c3aed',
                        }}
                      >
                        ជាន់ថ្នាក់៖ {ra.multiClassCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
