"use client";
import React, { useMemo } from 'react';
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
import { CLASS_COLORS, CLASS_ICONS } from '@/constants/classAppearance';
import { formatDateToDMY } from '@/utils/dateFormatter';
import { AppIcon } from '@/components/AppIcons';
import KhmerMonthPicker from '@/components/KhmerMonthPicker';
import { TeacherAvatar } from '@/components/teacher-tracking/TrackingControls';
import {
  ActiveExamNotice,
  EXAM_STAGES,
  WEEK_META,
  countExamStages,
  formatKhmerDateWithWeekday,
  getAutoExamPrepareDate,
} from '@/components/teacher-tracking/trackingModel';
import {
  EnrichedClassSummary,
  TeacherReportRow,
  formatKhmerFullDate,
  formatShortMonthKh,
  formatYearMonthKh,
} from './dashboardMetrics';

const GRADE_PALETTE: { grade: string; label: string; color: string }[] = [
  { grade: 'A', label: 'និទ្ទេស A (ល្អប្រសើរ)', color: '#10b981' },
  { grade: 'B', label: 'និទ្ទេស B (ល្អ)', color: '#3b82f6' },
  { grade: 'C', label: 'និទ្ទេស C (ល្អបង្គួរ)', color: '#06b6d4' },
  { grade: 'D', label: 'និទ្ទេស D (មធ្យម)', color: '#f59e0b' },
  { grade: 'E', label: 'និទ្ទេស E (មធ្យមទាប)', color: '#f97316' },
  { grade: 'F', label: 'និទ្ទេស F (ខ្សោយ)', color: '#ef4444' },
];

export default function TeacherDashboardView({
  teacherReport,
  fallbackName,
  isAdminInspecting = false,
  onBackToAdmin,
  scoreMonth,
  trackingMonth,
  onScoreMonthChange,
  monthScores,
  teachingRecords,
  tasks,
  activeExamNotice,
  onOpenExamNotice,
}: {
  teacherReport: TeacherReportRow;
  fallbackName?: string;
  isAdminInspecting?: boolean;
  onBackToAdmin?: () => void;
  scoreMonth: string;
  trackingMonth?: string;
  onScoreMonthChange: (nextYm: string) => void;
  monthScores: any[];
  teachingRecords: any[];
  tasks: any[];
  activeExamNotice?: ActiveExamNotice | null;
  onOpenExamNotice?: () => void;
}) {
  const { teacher, classes } = teacherReport;
  const displayName = teacher?.fullName || fallbackName || 'គ្រូបង្រៀន';
  const subjectText = teacher?.subject || 'គ្រូបង្រៀន';
  const todayFullKh = useMemo(() => formatKhmerFullDate(new Date()), []);
  const scoreMonthKh = useMemo(() => formatYearMonthKh(scoreMonth), [scoreMonth]);
  const shortScoreMonthKh = useMemo(() => formatShortMonthKh(scoreMonth), [scoreMonth]);
  const trackingMonthKh = useMemo(
    () => formatYearMonthKh(trackingMonth || scoreMonth),
    [trackingMonth, scoreMonth]
  );

  const myClassIds = useMemo(() => new Set(classes.map((ec) => ec.cls.id)), [classes]);

  // Grade distribution (A-F) across all scored students in this teacher's classes for scoreMonth
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    monthScores.forEach((sc) => {
      if (!myClassIds.has(sc.classId)) return;
      if (
        sc.totalScore === undefined ||
        sc.totalScore === null ||
        String(sc.totalScore).trim() === ''
      ) {
        return;
      }
      const g = String(sc.grade || '').trim().toUpperCase();
      if (counts[g] !== undefined) {
        counts[g] += 1;
      } else {
        const avg = parseFloat(sc.average);
        if (!isNaN(avg)) {
          const pct = (avg / 50) * 100;
          if (pct >= 90) counts.A += 1;
          else if (pct >= 80) counts.B += 1;
          else if (pct >= 70) counts.C += 1;
          else if (pct >= 60) counts.D += 1;
          else if (pct >= 50) counts.E += 1;
          else counts.F += 1;
        }
      }
    });
    return GRADE_PALETTE.map((item) => ({
      name: `និទ្ទេស ${item.grade}`,
      fullLabel: item.label,
      value: counts[item.grade],
      color: item.color,
    })).filter((d) => d.value > 0);
  }, [monthScores, myClassIds]);

  // Class comparison bar chart data (Book Progress % + Score Entry %)
  const classChartData = useMemo(
    () =>
      classes.map((ec) => ({
        name: ec.cls.classCode || ec.cls.className || 'ថ្នាក់',
        fullName: ec.cls.className || ec.cls.classCode || 'ថ្នាក់',
        សៀវភៅ: ec.bookProgress.percent,
        ពិន្ទុ: ec.scoreStatus.percent,
      })),
    [classes]
  );

  // Recent teaching records
  const recentRecords = useMemo(() => {
    const classMap = new Map<string, any>();
    classes.forEach((ec) => classMap.set(ec.cls.id, ec.cls));
    return teachingRecords
      .filter((r) => myClassIds.has(r.classId))
      .sort((a, b) =>
        String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || ''))
      )
      .slice(0, 6)
      .map((r) => {
        const cls = classMap.get(r.classId);
        const book = Array.isArray(cls?.books)
          ? cls.books.find((bk: any) => bk.id === r.bookId)
          : null;
        return {
          ...r,
          className: cls?.className || cls?.classCode || 'ថ្នាក់',
          bookTitle: book?.title || r.bookName || '',
        };
      });
  }, [teachingRecords, myClassIds, classes]);

  // Ongoing class tasks
  const myOngoingTasks = useMemo(() => {
    const classMap = new Map<string, any>();
    classes.forEach((ec) => classMap.set(ec.cls.id, ec.cls));
    return tasks
      .filter((t) => myClassIds.has(t.classId) && !t.success && Number(t.progress || 0) < 100)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 6)
      .map((t) => ({
        ...t,
        className:
          classMap.get(t.classId)?.className || classMap.get(t.classId)?.classCode || '',
      }));
  }, [tasks, myClassIds, classes]);

  // Special tasks assigned by Admin in teacherTracking for this month
  const adminSpecialTasks = useMemo(() => {
    const ts = teacherReport.trackingSummary;
    if (!ts) return [];
    const list: { weekLabel: string; count: number; description: string; done: boolean }[] = [];
    WEEK_META.forEach((w) => {
      const pw = ts.perWeek?.[w.key];
      if (!pw) return;
      if (pw.entry.taskCount > 0 || pw.entry.taskDescription.trim()) {
        list.push({
          weekLabel: w.label,
          count: pw.entry.taskCount,
          description: pw.entry.taskDescription,
          done: pw.entry.taskDone,
        });
      }
    });
    return list;
  }, [teacherReport.trackingSummary]);

  const ts = teacherReport.trackingSummary;
  const w4ExamEntry = ts?.perWeek?.w4?.entry;
  const w4ExamStagesCount = w4ExamEntry ? countExamStages(w4ExamEntry) : 0;
  const hasAnyTrackingActivity = Boolean(
    ts &&
      (ts.totalTopics > 0 ||
        ts.totalHomeworkCount > 0 ||
        ts.totalVideoCount > 0 ||
        w4ExamStagesCount > 0 ||
        adminSpecialTasks.length > 0)
  );

  const allAttDone =
    teacherReport.classCount > 0 &&
    teacherReport.attendanceClassesTaken >= teacherReport.classCount;
  const allScoresDone =
    teacherReport.classCount > 0 &&
    teacherReport.scoreClassesComplete >= teacherReport.classCount;
  const someScoresDone =
    teacherReport.scoreClassesComplete > 0 || teacherReport.scoreClassesPartial > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Optional Admin Inspection Banner */}
      {isAdminInspecting && (
        <div
          style={{
            padding: '0.75rem 1.05rem',
            borderRadius: '14px',
            background:
              'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(37, 99, 235, 0.12))',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              <AppIcon name="eye" size={13} />
              ទិដ្ឋភាពគ្រូបង្រៀន
            </span>
            <span>
              កំពុងមើល Dashboard របស់៖ <strong>{displayName}</strong>
            </span>
          </div>

          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9px',
                border: 'none',
                background: '#7c3aed',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.79rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="chevron-left" size={14} />
              ត្រឡប់ទៅទិដ្ឋភាពរួមសាលា
            </button>
          )}
        </div>
      )}

      {/* 1. Modern Welcome Hero Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.15rem 1.25rem',
          borderRadius: '18px',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--primary-color, #3b82f6) 11%, var(--card-bg)) 0%, var(--card-bg) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.95rem',
        }}
      >
        {/* Top Row: Profile + Khmer Month Picker */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <div
              style={{
                padding: '3px',
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--primary-color, #3b82f6) 22%, transparent)',
                flexShrink: 0,
              }}
            >
              <TeacherAvatar teacher={teacher || { fullName: displayName }} size={54} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.22rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                  }}
                >
                  សួស្តី, {displayName}
                </h1>
                <span
                  style={{
                    padding: '0.16rem 0.58rem',
                    borderRadius: '999px',
                    background: 'color-mix(in srgb, var(--primary-color, #3b82f6) 15%, transparent)',
                    color: 'var(--primary-color, #2563eb)',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                  }}
                >
                  {subjectText}
                </span>
              </div>
              <div
                style={{
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  fontSize: '0.79rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <AppIcon
                  name="calendar"
                  size={14}
                  style={{ color: 'var(--primary-color, #3b82f6)' }}
                />
                <span>{todayFullKh}</span>
              </div>
            </div>
          </div>

          <KhmerMonthPicker
            value={scoreMonth}
            onChange={onScoreMonthChange}
            label="ខែពិន្ទុ៖"
          />
        </div>

        {/* Bottom Row: Clean 3-Column Quick Actions */}
        <div className="dashboard-quick-actions">
          <Link
            href="/dashboard/attendance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.8rem',
              borderRadius: '11px',
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.79rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            <AppIcon name="clipboard-check" size={15} />
            <span>វត្តមានថ្ងៃនេះ</span>
          </Link>

          <Link
            href="/dashboard/scores"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.8rem',
              borderRadius: '11px',
              background: '#f59e0b',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.79rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            <AppIcon name="star" size={15} />
            <span>បញ្ចូលពិន្ទុ</span>
          </Link>

          <Link
            href="/dashboard/classes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.8rem',
              borderRadius: '11px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.79rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <AppIcon
              name="graduation-cap"
              size={15}
              style={{ color: 'var(--primary-color, #3b82f6)' }}
            />
            <span>ថ្នាក់រៀន</span>
          </Link>
        </div>
      </div>

      {/* 1.5 Persistent Exam Schedule Notice Reminder Banner */}
      {activeExamNotice && (
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1.05rem',
            borderRadius: '16px',
            borderLeft: '4px solid #7c3aed',
            background:
              'linear-gradient(135deg, rgba(124, 58, 237, 0.09) 0%, var(--card-bg) 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.68rem', flex: 1, minWidth: '240px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="bell" size={18} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                សេចក្តីជូនដំណឹងប្រឡង ({activeExamNotice.monthDisplayKh})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem' }}>
                {[
                  { label: 'ធ្វើវិញ្ញាសា', iso: getAutoExamPrepareDate(activeExamNotice.monthKey), color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
                  { label: 'ប្រមូលវិញ្ញាសា', iso: activeExamNotice.config.collectDate, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
                  { label: 'ថ្ងៃប្រឡង', iso: activeExamNotice.config.examDate, color: '#d97706', bg: 'rgba(217, 119, 6, 0.14)' },
                  { label: 'ចេញលទ្ធផល', iso: activeExamNotice.config.resultDate, color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
                ]
                  .filter((item) => Boolean(item.iso?.trim()))
                  .map((item) => {
                    const fmt = formatKhmerDateWithWeekday(item.iso);
                    const dueTag =
                      fmt.daysDiff === 0
                        ? 'ថ្ងៃនេះ'
                        : fmt.daysDiff !== null && fmt.daysDiff > 0
                          ? `សល់ ${fmt.daysDiff}ថ្ងៃ`
                          : null;
                    return (
                      <span
                        key={item.label}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.28rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          background: item.bg,
                          color: item.color,
                          fontSize: '0.73rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>{item.label}៖ {fmt.dmy}</span>
                        {dueTag && (
                          <span
                            style={{
                              padding: '0.04rem 0.35rem',
                              borderRadius: '999px',
                              background: 'rgba(255,255,255,0.75)',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                            }}
                          >
                            {dueTag}
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>

          {onOpenExamNotice && (
            <button
              type="button"
              onClick={onOpenExamNotice}
              style={{
                padding: '0.48rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                fontSize: '0.79rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
              }}
            >
              <AppIcon name="file-text" size={14} />
              <span>មើលលិខិតជូនដំណឹង</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Four Core Teacher KPIs — 2x2 Grid on Mobile, 4 Columns on Desktop */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Assigned Classes */}
        <Link
          href="/dashboard/classes"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              ថ្នាក់ទទួលបន្ទុក
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="graduation-cap" size={16} />
            </div>
          </div>

          <div className="dashboard-kpi-value" style={{ color: 'var(--text-primary)' }}>
            {teacherReport.classCount}{' '}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ថ្នាក់
            </span>
          </div>

          <div
            style={{
              fontSize: '0.71rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {teacherReport.shiftsSummary}
          </div>
        </Link>

        {/* KPI 2: My Active Students */}
        <Link
          href="/dashboard/classes"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              សិស្សសរុបរបស់ខ្ញុំ
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'rgba(14, 165, 233, 0.12)',
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

          <div className="dashboard-kpi-value" style={{ color: '#0284c7' }}>
            {teacherReport.activeStudentsCount}{' '}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              នាក់
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.71rem', fontWeight: 700 }}>
            <span style={{ color: '#ec4899' }}>ស្រី {teacherReport.girlsCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#3b82f6' }}>ប្រុស {teacherReport.boysCount}</span>
            {teacherReport.droppedCount > 0 && (
              <>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ color: '#ef4444' }}>ឈប់ {teacherReport.droppedCount}</span>
              </>
            )}
          </div>
        </Link>

        {/* KPI 3: Attendance Today */}
        <Link
          href="/dashboard/attendance"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              វត្តមានថ្ងៃនេះ
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: allAttDone
                  ? 'rgba(16, 185, 129, 0.14)'
                  : 'rgba(245, 158, 11, 0.14)',
                color: allAttDone ? '#059669' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="clipboard-check" size={16} />
            </div>
          </div>

          <div
            className="dashboard-kpi-value"
            style={{ color: allAttDone ? '#059669' : '#d97706' }}
          >
            {teacherReport.attendanceClassesTaken}/{teacherReport.classCount}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ថ្នាក់</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}>
            <span style={{ color: '#10b981' }}>មក {teacherReport.presentTodayCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#ef4444' }}>អវត្តមាន {teacherReport.absentTodayCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ច្បាប់ {teacherReport.permissionTodayCount}</span>
          </div>
        </Link>

        {/* KPI 4: Monthly Scores & Tasks */}
        <Link
          href="/dashboard/scores"
          className="glass-panel glass-panel-hoverable dashboard-kpi-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              ពិន្ទុ ({shortScoreMonthKh}) & កិច្ចការ
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: allScoresDone
                  ? 'rgba(16, 185, 129, 0.14)'
                  : someScoresDone
                    ? 'rgba(245, 158, 11, 0.14)'
                    : 'rgba(239, 68, 68, 0.12)',
                color: allScoresDone ? '#059669' : someScoresDone ? '#d97706' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name={allScoresDone ? 'check-circle' : 'star'} size={16} />
            </div>
          </div>

          <div
            className="dashboard-kpi-value"
            style={{
              color: allScoresDone ? '#059669' : someScoresDone ? '#d97706' : '#dc2626',
            }}
          >
            {teacherReport.scoreClassesComplete}/{teacherReport.classCount}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ថ្នាក់រួច</span>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            សិស្ស {teacherReport.totalScoredStudents}/{teacherReport.totalExpectedScoreStudents} • សល់{' '}
            <strong style={{ color: teacherReport.pendingTasksCount > 0 ? '#f59e0b' : '#10b981' }}>
              {teacherReport.pendingTasksCount}
            </strong>
          </div>
        </Link>
      </div>

      {/* Optional Compact Goals & Admin Special Tasks Strip (only shown when month has tracking activity) */}
      {hasAnyTrackingActivity && ts && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <AppIcon name="clipboard-check" size={17} style={{ color: '#0d9488' }} />
            <span>គោលដៅការងារគ្រូប្រចាំខែ ({trackingMonthKh})</span>
          </div>

          <div className="dashboard-goals-grid">
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Topic បានរៀន</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb' }}>{ts.totalTopics} Topics</div>
            </div>
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>កិច្ចការផ្ទះ</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>{ts.totalHomeworkCount} ដង</div>
            </div>
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>វីដេអូ Topic</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed' }}>{ts.totalVideoCount} វីដេអូ</div>
            </div>
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '10px', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>អត្រាសម្រេចរួម</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d9488' }}>{ts.completionPct}%</div>
            </div>
          </div>

          {(w4ExamStagesCount > 0 || adminSpecialTasks.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
              {w4ExamEntry && w4ExamStagesCount > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    fontSize: '0.75rem',
                  }}
                >
                  <AppIcon name="file-text" size={14} style={{ color: '#7c3aed' }} />
                  <strong style={{ color: '#7c3aed' }}>វិញ្ញាសា (សប្តាហ៍ទី ៤)៖</strong>
                  {EXAM_STAGES.map((st) => {
                    const done = Boolean(w4ExamEntry[st.key]);
                    return (
                      <span
                        key={st.key}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '0.12rem 0.42rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: done ? 'rgba(16, 185, 129, 0.16)' : 'var(--main-bg)',
                          color: done ? '#059669' : 'var(--text-secondary)',
                        }}
                      >
                        {done ? <AppIcon name="check" size={11} /> : <span>{st.step}.</span>}
                        <span>{st.shortLabel}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {adminSpecialTasks.map((tk, i) => (
                <div
                  key={`${tk.weekLabel}-${i}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '9px',
                    background: tk.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                    border: tk.done
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(2, 132, 199, 0.3)',
                    fontSize: '0.76rem',
                  }}
                >
                  <AppIcon
                    name={tk.done ? 'check-circle' : 'clock'}
                    size={14}
                    style={{ color: tk.done ? '#059669' : '#0284c7' }}
                  />
                  <span style={{ fontWeight: 800, color: tk.done ? '#059669' : '#0284c7' }}>
                    Task ({tk.weekLabel}
                    {tk.count > 0 ? ` • ចំនួន ${tk.count}` : ''})៖
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {tk.description || 'កិច្ចការពិសេស'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. My Classes & Today's Status Grid */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AppIcon
              name="graduation-cap"
              size={19}
              style={{ color: 'var(--primary-color, #3b82f6)' }}
            />
            <h2 style={{ margin: 0, fontSize: '1.04rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ថ្នាក់រៀនរបស់ខ្ញុំ & ស្ថានភាពថ្ងៃនេះ ({classes.length} ថ្នាក់)
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ចុចលើវត្តមាន ឬពិន្ទុ ដើម្បីចូលបំពេញទិន្នន័យភ្លាមៗ
          </span>
        </div>

        {classes.length === 0 ? (
          <div
            className="glass-panel"
            style={{ padding: '2.2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            មិនទាន់មានថ្នាក់រៀនត្រូវបានកំណត់ជូនគ្រូរូបនេះនៅឡើយទេ។
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 305px), 1fr))',
              gap: '0.9rem',
            }}
          >
            {classes.map((ec: EnrichedClassSummary) => {
              const { cls, activeStudents, attendanceToday, scoreStatus, bookProgress } = ec;
              const iconObj = CLASS_ICONS.find((ic) => ic.id === cls.icon) || CLASS_ICONS[0];
              const colorHex =
                CLASS_COLORS.find((co) => co.id === cls.color)?.value || CLASS_COLORS[0].value;

              const scoreBadgePalette =
                scoreStatus.state === 'complete'
                  ? {
                      bg: 'rgba(16, 185, 129, 0.12)',
                      border: 'rgba(16, 185, 129, 0.25)',
                      color: '#059669',
                      icon: 'check-circle' as const,
                      label: 'បញ្ចូលពិន្ទុរួច',
                    }
                  : scoreStatus.state === 'partial'
                    ? {
                        bg: 'rgba(245, 158, 11, 0.13)',
                        border: 'rgba(245, 158, 11, 0.28)',
                        color: '#d97706',
                        icon: 'clock' as const,
                        label: 'ដាក់ពិន្ទុបានខ្លះ',
                      }
                    : {
                        bg: 'rgba(239, 68, 68, 0.1)',
                        border: 'rgba(239, 68, 68, 0.22)',
                        color: '#dc2626',
                        icon: 'x-circle' as const,
                        label: 'មិនទាន់ដាក់ពិន្ទុ',
                      };

              return (
                <div
                  key={cls.id}
                  className="glass-panel glass-panel-hoverable"
                  style={{
                    padding: '1.05rem',
                    borderRadius: '16px',
                    borderTop: `3px solid ${colorHex}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                  }}
                >
                  {/* Top Class Info */}
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '11px',
                        background: `${colorHex}18`,
                        color: colorHex,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {iconObj.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cls.className}
                        </h3>
                        {cls.classCode && (
                          <span
                            style={{
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              background: 'var(--main-bg)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {cls.classCode}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {cls.shift || 'មិនកំណត់វេន'}
                        {cls.time ? ` • ${cls.time}` : ''} •{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {activeStudents.length} សិស្ស
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side 2-Column Status Pair (Today's Attendance + Monthly Score) */}
                  <div className="dashboard-status-pair">
                    <Link
                      href="/dashboard/attendance"
                      style={{
                        padding: '0.5rem 0.6rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        background: attendanceToday.isTaken
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                        border: attendanceToday.isTaken
                          ? '1px solid rgba(16, 185, 129, 0.25)'
                          : '1px solid rgba(245, 158, 11, 0.26)',
                        color: attendanceToday.isTaken ? '#059669' : '#d97706',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 800 }}>
                        <AppIcon
                          name={attendanceToday.isTaken ? 'check-circle' : 'clock'}
                          size={13}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attendanceToday.isTaken ? 'វត្តមានស្រង់រួច' : 'មិនទាន់ស្រង់វត្តមាន'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 600 }}>
                        {attendanceToday.isTaken
                          ? `មក ${attendanceToday.presentCount} • អវត្តមាន ${attendanceToday.absentCount}`
                          : 'ចុចចូលស្រង់ថ្ងៃនេះ'}
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/scores"
                      style={{
                        padding: '0.5rem 0.6rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        background: scoreBadgePalette.bg,
                        border: `1px solid ${scoreBadgePalette.border}`,
                        color: scoreBadgePalette.color,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 800 }}>
                        <AppIcon name={scoreBadgePalette.icon} size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {scoreBadgePalette.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 600 }}>
                        {scoreStatus.scoredCount}/{scoreStatus.expectedCount} សិស្ស ({scoreStatus.percent}%)
                      </div>
                    </Link>
                  </div>

                  {/* Book Progress Bar */}
                  <div style={{ paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.74rem',
                        marginBottom: '0.28rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        <AppIcon name="book-open" size={13} />
                        <span>សៀវភៅបង្រៀន</span>
                      </span>
                      <span style={{ fontWeight: 800, color: colorHex }}>
                        {bookProgress.hasBooks
                          ? `${bookProgress.percent}% (${bookProgress.taughtPages}/${bookProgress.totalPages})`
                          : 'មិនទាន់កំណត់'}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '999px',
                        background: 'var(--border-color)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${bookProgress.percent}%`,
                          height: '100%',
                          background: colorHex,
                          borderRadius: '999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 315px), 1fr))',
          gap: '0.95rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <AppIcon name="bar-chart" size={17} style={{ color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              វឌ្ឍនភាពសៀវភៅ & ការដាក់ពិន្ទុតាមថ្នាក់ (%)
            </h3>
          </div>
          {classChartData.length > 0 ? (
            <div style={{ width: '100%', height: '245px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData} margin={{ top: 8, right: 12, left: -18, bottom: 16 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--modal-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  <Bar dataKey="សៀវភៅ" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="ពិន្ទុ" fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                height: '210px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.84rem',
              }}
            >
              មិនទាន់មានទិន្នន័យថ្នាក់រៀន
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <AppIcon name="award" size={17} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              សមាមាត្រនិទ្ទេសពិន្ទុសិស្ស A–F ({scoreMonthKh})
            </h3>
          </div>
          {gradeDistribution.length > 0 ? (
            <div style={{ width: '100%', height: '245px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="48%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {gradeDistribution.map((entry) => (
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
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                height: '210px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.83rem',
                textAlign: 'center',
              }}
            >
              <span>មិនទាន់មានទិន្នន័យពិន្ទុសម្រាប់ {scoreMonthKh} ទេ</span>
              <Link
                href="/dashboard/scores"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--primary-color)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                }}
              >
                <span>ចូលទៅបញ្ចូលពិន្ទុឥឡូវនេះ</span>
                <AppIcon name="chevron-right" size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Teaching Records & Ongoing Class Tasks */}
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
              <AppIcon name="book-open" size={17} style={{ color: '#2563eb' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                កំណត់ត្រាបង្រៀនចុងក្រោយ
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
                color: 'var(--primary-color)',
                textDecoration: 'none',
              }}
            >
              <span>មើលទាំងអស់</span>
              <AppIcon name="chevron-right" size={13} />
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <div style={{ padding: '1.6rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
              មិនទាន់មានកំណត់ត្រាបង្រៀនទេ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {recentRecords.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '0.68rem 0.8rem',
                    borderRadius: '10px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.22rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {rec.className}
                      {rec.bookTitle ? ` • ${rec.bookTitle}` : ''}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {rec.date ? formatDateToDMY(rec.date) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                    {rec.pages ? <strong style={{ color: '#2563eb' }}>ទំព័រ {rec.pages}៖ </strong> : null}
                    {rec.content || rec.other || 'បានកត់ត្រាការបង្រៀន'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AppIcon name="pin" size={17} style={{ color: '#0d9488' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                កិច្ចការក្នុងថ្នាក់កំពុងអនុវត្ត
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
                color: 'var(--primary-color)',
                textDecoration: 'none',
              }}
            >
              <span>គ្រប់គ្រង</span>
              <AppIcon name="chevron-right" size={13} />
            </Link>
          </div>

          {myOngoingTasks.length === 0 ? (
            <div
              style={{
                padding: '1.6rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.83rem',
              }}
            >
              <AppIcon name="check-circle" size={16} />
              <span>មិនមានកិច្ចការដែលនៅសល់ទេ</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {myOngoingTasks.map((task) => {
                const pct = Math.min(100, Math.max(0, Number(task.progress) || 0));
                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '0.7rem 0.8rem',
                      borderRadius: '10px',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.38rem' }}>
                      <strong style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>{task.title}</strong>
                      {task.className && (
                        <span
                          style={{
                            padding: '0.12rem 0.48rem',
                            borderRadius: '999px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#2563eb',
                            fontSize: '0.71rem',
                            fontWeight: 700,
                          }}
                        >
                          {task.className}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          borderRadius: '999px',
                          background: 'var(--border-color)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: '#3b82f6',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
