"use client";
import React, { useMemo, useState } from 'react';
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
import { TeacherAvatar } from '@/components/teacher-tracking/TrackingControls';
import {
  EnrichedClassSummary,
  TeacherReportRow,
  computeSchoolFinancialAnalytics,
  formatKhmerFullDate,
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
  onInspectTeacher: (teacherId: string) => void;
}) {
  const [teacherViewMode, setTeacherViewMode] = useState<'table' | 'cards'>('table');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [chartGroupMode, setChartGroupMode] = useState<'shift' | 'level'>('shift');

  const today = useMemo(() => new Date(), []);
  const todayFullKh = useMemo(() => formatKhmerFullDate(today), [today]);
  const scoreMonthKh = useMemo(() => formatYearMonthKh(scoreMonth), [scoreMonth]);

  // 1. School-wide Student Counts (fixing legacy 'ឈប់សិក្សា' vs 'ឈប់រៀន')
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

  // 4. Filtered Teacher Reports
  const filteredTeacherReports = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teacherReports.filter((tr) => {
      if (tr.teacher.status === 'ឈប់បង្រៀន') return false;
      if (!q) return true;
      return (
        String(tr.teacher.fullName || '').toLowerCase().includes(q) ||
        String(tr.teacher.englishName || '').toLowerCase().includes(q) ||
        String(tr.teacher.subject || '').toLowerCase().includes(q)
      );
    });
  }, [teacherReports, teacherSearch]);

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

  // 7. Classes needing roster cleanup (deleted from main / dropped / duplicate multi-class)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Executive Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.2rem 1.45rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderLeft: '5px solid #2563eb',
          background:
            'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(13, 148, 136, 0.07) 100%)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.32rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🏢 ទិដ្ឋភាពរួមសាលា (Admin Executive Dashboard)
          </h1>
          <p style={{ margin: '0.28rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
            📅 {todayFullKh} • គ្រប់គ្រងសិស្ស ហិរញ្ញវត្ថុ វត្តមាន និងតាមដានរបាយការណ៍បង្រៀនគ្រូទាំងអស់
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.7rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-bg)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>ខែពិនិត្យពិន្ទុ៖</span>
            <input
              type="month"
              value={scoreMonth}
              onChange={(e) => e.target.value && onScoreMonthChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <Link
            href="/dashboard/teacher-tracking"
            style={{
              padding: '0.48rem 0.9rem',
              borderRadius: '9px',
              background: '#0d9488',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.81rem',
              textDecoration: 'none',
            }}
          >
            ✓ តាមដានការងារគ្រូប្រចាំសប្តាហ៍
          </Link>
        </div>
      </div>

      {/* 1. Five Big School KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 215px), 1fr))',
          gap: '0.9rem',
        }}
      >
        {/* KPI 1: Total Students Across School */}
        <Link
          href="/dashboard/students"
          className="glass-panel glass-panel-hoverable"
          style={{
            padding: '1.05rem 1.15rem',
            borderTop: '3px solid #0ea5e9',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            សិស្សកំពុងសិក្សាទូទាំងសាលា
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {studentMetrics.active}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
              +{studentMetrics.newThisMonth} ចូលថ្មីខែនេះ
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.73rem', fontWeight: 700 }}>
            <span style={{ color: '#ec4899' }}>ស្រី {studentMetrics.girls}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#3b82f6' }}>ប្រុស {studentMetrics.boys}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ព្យួរ {studentMetrics.suspended}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#ef4444' }}>ឈប់រៀន {studentMetrics.dropped}</span>
          </div>
        </Link>

        {/* KPI 2: Revenue This Month (Riels) */}
        <Link
          href="/dashboard/payments"
          className="glass-panel glass-panel-hoverable"
          style={{
            padding: '1.05rem 1.15rem',
            borderTop: '3px solid #16a34a',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            ចំណូលបង់ប្រាក់ក្នុងខែនេះ
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.25 }}>
            {formatRiels(finance.thisMonthRevenueRiels)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            វិក្កយបត្របានបង់៖ <strong>{finance.thisMonthReceiptCount}</strong> សន្លឹកក្នុងខែនេះ
          </div>
        </Link>

        {/* KPI 3: Due & Overdue Students */}
        <Link
          href="/dashboard/payments"
          className="glass-panel glass-panel-hoverable"
          style={{
            padding: '1.05rem 1.15rem',
            borderTop: '3px solid #ef4444',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            សិស្សដល់ថ្ងៃ & ហួសថ្ងៃបង់ប្រាក់
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
            {finance.dueAndOverdueCount}{' '}
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>នាក់</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>
            ត្រូវប្រមូល៖ {formatRiels(finance.totalDueAndOverdueRiels)} →
          </div>
        </Link>

        {/* KPI 4: School Attendance Today */}
        <Link
          href="/dashboard/attendance"
          className="glass-panel glass-panel-hoverable"
          style={{
            padding: '1.05rem 1.15rem',
            borderTop: '3px solid #10b981',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            វត្តមានទូទាំងសាលាថ្ងៃនេះ
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {schoolClassStats.attClassesTaken}/{schoolClassStats.totalClasses}{' '}
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>ថ្នាក់ស្រង់រួច</span>
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#ef4444' }}>អវត្តមាន {schoolClassStats.totalAbsentToday}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ច្បាប់ {schoolClassStats.totalPermissionToday}</span>
          </div>
        </Link>

        {/* KPI 5: Active Teachers & Classes + Monthly Score Status */}
        <Link
          href="/dashboard/scores"
          className="glass-panel glass-panel-hoverable"
          style={{
            padding: '1.05rem 1.15rem',
            borderTop: '3px solid #8b5cf6',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            គ្រូ & ថ្នាក់រៀនសកម្មសរុប
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#7c3aed' }}>
            {schoolClassStats.activeTeachersCount} គ្រូ • {schoolClassStats.totalClasses} ថ្នាក់
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            បញ្ចូលពិន្ទុរួច ({scoreMonthKh})៖{' '}
            <strong style={{ color: '#059669' }}>
              {schoolClassStats.scoreClassesComplete}/{schoolClassStats.totalClasses} ថ្នាក់
            </strong>
          </div>
        </Link>
      </div>

      {/* 2. Per-Teacher Teaching Report & Drill-down (តារាង/កាតរបាយការណ៍បង្រៀនតាមគ្រូម្នាក់ៗ) */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--main-bg)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              👨‍🏫 របាយការណ៍បង្រៀន និងស្ថានភាពការងារតាមគ្រូម្នាក់ៗ ({filteredTeacherReports.length} នាក់)
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              ពិនិត្យមើលថាគ្រូណាបានស្រង់វត្តមានថ្ងៃនេះ បានបញ្ចូលពិន្ទុខែនេះរួច ឬនៅ និងចុចចូលមើល Dashboard គ្រូម្នាក់ៗ
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះគ្រូ..."
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--modal-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.81rem',
                outline: 'none',
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
                onClick={() => setTeacherViewMode('table')}
                style={{
                  padding: '0.38rem 0.7rem',
                  border: 'none',
                  background: teacherViewMode === 'table' ? 'var(--primary-color, #2563eb)' : 'transparent',
                  color: teacherViewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.77rem',
                  cursor: 'pointer',
                }}
              >
                តារាង
              </button>
              <button
                type="button"
                onClick={() => setTeacherViewMode('cards')}
                style={{
                  padding: '0.38rem 0.7rem',
                  border: 'none',
                  background: teacherViewMode === 'cards' ? 'var(--primary-color, #2563eb)' : 'transparent',
                  color: teacherViewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.77rem',
                  cursor: 'pointer',
                }}
              >
                កាតគ្រូ
              </button>
            </div>
          </div>
        </div>

        {teacherViewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', minWidth: '960px' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--main-bg)',
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th style={{ padding: '0.7rem 0.75rem', textAlign: 'left' }}>គ្រូបង្រៀន</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>ថ្នាក់ & សិស្ស</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>វត្តមានថ្ងៃនេះ</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                    ការបញ្ចូលពិន្ទុ ({scoreMonthKh})
                  </th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>វឌ្ឍនភាពសៀវភៅ</th>
                  <th style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>ការងារគ្រូខែនេះ</th>
                  <th style={{ padding: '0.7rem 0.75rem', textAlign: 'right' }}>ពិនិត្យលម្អិត</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeacherReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      មិនមានឈ្មោះគ្រូបង្រៀនទេ
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
                      <tr
                        key={tr.teacher.id}
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                      >
                        <td style={{ padding: '0.7rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <TeacherAvatar teacher={tr.teacher} size={36} />
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                {tr.teacher.fullName}
                              </div>
                              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                                {tr.teacher.subject || tr.teacher.teacherId || 'គ្រូបង្រៀន'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {tr.classCount} ថ្នាក់ • {tr.activeStudentsCount} សិស្ស
                          </div>
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                            ស្រី {tr.girlsCount} • ប្រុស {tr.boysCount}
                          </div>
                        </td>

                        <td style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                          {tr.classCount === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>គ្មានថ្នាក់</span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
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
                                {allAttDone ? '✔ ស្រង់រួច' : '⏳ បាន'} {tr.attendanceClassesTaken}/{tr.classCount} ថ្នាក់
                              </span>
                              {tr.absentTodayCount > 0 && (
                                <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                                  អវត្តមានថ្ងៃនេះ៖ {tr.absentTodayCount} នាក់
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                          {tr.classCount === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>គ្មានថ្នាក់</span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  padding: '0.2rem 0.58rem',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
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
                                {allScoreDone
                                  ? `✔ បញ្ចូលរួច (${tr.scoreClassesComplete}/${tr.classCount})`
                                  : someScoreDone
                                    ? `◔ បានខ្លះ (${tr.scoreClassesComplete}/${tr.classCount})`
                                    : `✖ មិនទាន់បញ្ចូល (0/${tr.classCount})`}
                              </span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {tr.totalScoredStudents}/{tr.totalExpectedScoreStudents} សិស្ស
                              </div>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.79rem', color: '#2563eb' }}>
                              {tr.avgBookProgressPct}%
                            </span>
                            <div
                              style={{
                                width: '76px',
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

                        <td style={{ padding: '0.7rem 0.55rem', textAlign: 'center' }}>
                          {tr.trackingSummary ? (
                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
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
                              <div style={{ fontSize: '0.69rem', color: 'var(--text-secondary)' }}>
                                Topic {tr.trackingSummary.totalTopics} • HW {tr.trackingSummary.totalHomeworkCount} • វីដេអូ {tr.trackingSummary.totalVideoCount}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '0.7rem 0.75rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => onInspectTeacher(tr.teacher.id)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.77rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            មើល Dashboard →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '1.15rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 295px), 1fr))',
              gap: '0.95rem',
            }}
          >
            {filteredTeacherReports.map((tr) => {
              const allScoreDone =
                tr.classCount > 0 && tr.scoreClassesComplete >= tr.classCount;
              const someScoreDone =
                tr.scoreClassesComplete > 0 || tr.scoreClassesPartial > 0;

              return (
                <div
                  key={tr.teacher.id}
                  className="glass-panel glass-panel-hoverable"
                  style={{
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    borderTop: '3px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <TeacherAvatar teacher={tr.teacher} size={42} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tr.teacher.fullName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {tr.teacher.subject || 'គ្រូបង្រៀន'} • {tr.classCount} ថ្នាក់ ({tr.activeStudentsCount} សិស្ស)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.75rem' }}>
                    <div style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', background: 'var(--main-bg)' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>វត្តមានថ្ងៃនេះ</div>
                      <div style={{ fontWeight: 800, color: tr.attendanceClassesTaken >= tr.classCount && tr.classCount > 0 ? '#059669' : '#d97706' }}>
                        {tr.attendanceClassesTaken}/{tr.classCount} ថ្នាក់
                      </div>
                    </div>
                    <div style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', background: 'var(--main-bg)' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>ពិន្ទុខែនេះ</div>
                      <div style={{ fontWeight: 800, color: allScoreDone ? '#059669' : someScoreDone ? '#d97706' : '#dc2626' }}>
                        {allScoreDone ? '✔ រួចរាល់' : someScoreDone ? '◔ បានខ្លះ' : '✖ មិនទាន់'} ({tr.scoreClassesComplete}/{tr.classCount})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      សៀវភៅមធ្យម៖ <strong style={{ color: '#2563eb' }}>{tr.avgBookProgressPct}%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectTeacher(tr.teacher.id)}
                      style={{
                        padding: '0.38rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      មើល Dashboard →
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 315px), 1fr))',
          gap: '1rem',
        }}
      >
        {/* Chart 1: 6-Month Revenue Trend in Riels */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            💰 ចំណូលប្រចាំខែ (៦ ខែចុងក្រោយ — រៀល)
          </h3>
          <div style={{ width: '100%', height: '245px' }}>
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

        {/* Chart 2: Student Payment Status */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🧾 ស្ថានភាពការបង់ប្រាក់សិស្សសកម្ម
          </h3>
          {paymentDonutData.length > 0 ? (
            <div style={{ width: '100%', height: '245px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentDonutData}
                    cx="50%"
                    cy="46%"
                    innerRadius={52}
                    outerRadius={84}
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
                  <Legend wrapperStyle={{ fontSize: '0.76rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              មិនទាន់មានទិន្នន័យ
            </div>
          )}
        </div>

        {/* Chart 3: Students by Shift / Level */}
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📊 ចំនួនសិស្សសកម្មតាម{chartGroupMode === 'shift' ? 'វេន' : 'កម្រិត'}
            </h3>
            <div style={{ display: 'inline-flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setChartGroupMode('shift')}
                style={{
                  padding: '0.24rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: chartGroupMode === 'shift' ? '#3b82f6' : 'var(--main-bg)',
                  color: chartGroupMode === 'shift' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                តាមវេន
              </button>
              <button
                type="button"
                onClick={() => setChartGroupMode('level')}
                style={{
                  padding: '0.24rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: chartGroupMode === 'level' ? '#3b82f6' : 'var(--main-bg)',
                  color: chartGroupMode === 'level' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                តាមកម្រិត
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '245px' }}>
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

      {/* 4. Attention Needed Box (Top Overdue Students & Class Roster Cleanup Alerts) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 335px), 1fr))',
          gap: '1rem',
        }}
      >
        {/* Top Overdue Students */}
        <div className="glass-panel" style={{ padding: '1.2rem', borderTop: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🚨 សិស្សហួសថ្ងៃបង់ប្រាក់យូរជាងគេ (Top Overdue)
            </h3>
            <Link
              href="/dashboard/payments"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}
            >
              ទៅទំព័របង់ប្រាក់ →
            </Link>
          </div>

          {finance.topOverdueStudents.length === 0 ? (
            <div style={{ padding: '1.75rem 0', textAlign: 'center', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
              មិនមានសិស្សដល់ថ្ងៃ ឬហួសថ្ងៃបង់ប្រាក់ទេ ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {finance.topOverdueStudents.map((b) => (
                <div
                  key={b.student.id}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '9px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {b.student.fullName}{' '}
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ({b.student.studentId || 'គ្មានអត្តលេខ'})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      {b.roomAndTeacher || 'មិនទាន់មានថ្នាក់'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.14rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
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
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {formatRiels(b.amountDue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Roster Cleanup Alerts */}
        <div className="glass-panel" style={{ padding: '1.2rem', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🧹 ថ្នាក់រៀនត្រូវពិនិត្យសម្អាតឈ្មោះសិស្ស
            </h3>
            <Link
              href="/dashboard/classes"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', textDecoration: 'none' }}
            >
              ទៅទំព័រថ្នាក់រៀន →
            </Link>
          </div>

          {classesNeedingCleanup.length === 0 ? (
            <div style={{ padding: '1.75rem 0', textAlign: 'center', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
              បញ្ជីសិស្សតាមថ្នាក់ទាំងអស់ស្អាតត្រឹមត្រូវ ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {classesNeedingCleanup.slice(0, 8).map((ra) => (
                <div
                  key={ra.classId}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '9px',
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
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {ra.className}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      គ្រូ៖ {ra.teacherName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {ra.deletedFromMainCount > 0 && (
                      <span
                        style={{
                          padding: '0.16rem 0.48rem',
                          borderRadius: '999px',
                          fontSize: '0.71rem',
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
                          padding: '0.16rem 0.48rem',
                          borderRadius: '999px',
                          fontSize: '0.71rem',
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
                          padding: '0.16rem 0.48rem',
                          borderRadius: '999px',
                          fontSize: '0.71rem',
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
