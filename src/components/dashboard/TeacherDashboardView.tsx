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
import { TeacherAvatar } from '@/components/teacher-tracking/TrackingControls';
import { EXAM_STAGES, WEEK_META } from '@/components/teacher-tracking/trackingModel';
import {
  EnrichedClassSummary,
  TeacherReportRow,
  formatKhmerFullDate,
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
  onScoreMonthChange,
  monthScores,
  teachingRecords,
  tasks,
}: {
  teacherReport: TeacherReportRow;
  fallbackName?: string;
  isAdminInspecting?: boolean;
  onBackToAdmin?: () => void;
  scoreMonth: string;
  onScoreMonthChange: (nextYm: string) => void;
  monthScores: any[];
  teachingRecords: any[];
  tasks: any[];
}) {
  const { teacher, classes } = teacherReport;
  const displayName = teacher?.fullName || fallbackName || 'គ្រូបង្រៀន';
  const subjectText = teacher?.subject || 'គ្រូបង្រៀន';
  const todayFullKh = useMemo(() => formatKhmerFullDate(new Date()), []);
  const scoreMonthKh = useMemo(() => formatYearMonthKh(scoreMonth), [scoreMonth]);

  const myClassIds = useMemo(() => new Set(classes.map((ec) => ec.cls.id)), [classes]);

  // Grade distribution (A-F) across all scored students in this teacher's classes for scoreMonth
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    monthScores.forEach((sc) => {
      if (!myClassIds.has(sc.classId)) return;
      if (sc.totalScore === undefined || sc.totalScore === null || String(sc.totalScore).trim() === '') {
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

  // Recent teaching records for this teacher's classes
  const recentRecords = useMemo(() => {
    const classMap = new Map<string, any>();
    classes.forEach((ec) => classMap.set(ec.cls.id, ec.cls));
    return teachingRecords
      .filter((r) => myClassIds.has(r.classId))
      .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')))
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

  // Ongoing class tasks for this teacher's classes
  const myOngoingTasks = useMemo(() => {
    const classMap = new Map<string, any>();
    classes.forEach((ec) => classMap.set(ec.cls.id, ec.cls));
    return tasks
      .filter((t) => myClassIds.has(t.classId) && !t.success && Number(t.progress || 0) < 100)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 6)
      .map((t) => ({
        ...t,
        className: classMap.get(t.classId)?.className || classMap.get(t.classId)?.classCode || '',
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

  const w4ExamEntry = teacherReport.trackingSummary?.perWeek?.w4?.entry;
  const w4ExamActive = teacherReport.trackingSummary?.perWeek?.w4?.status?.examActive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Optional Admin Inspection Banner */}
      {isAdminInspecting && (
        <div
          style={{
            padding: '0.8rem 1.15rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(37, 99, 235, 0.14))',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            <span
              style={{
                padding: '0.22rem 0.6rem',
                borderRadius: '999px',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              👁️ ទិដ្ឋភាពគ្រូបង្រៀន
            </span>
            <span>
              អ្នកកំពុងពិនិត្យផ្ទាំង Dashboard របស់គ្រូ៖ <strong>{displayName}</strong>
            </span>
          </div>

          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              style={{
                padding: '0.44rem 0.9rem',
                borderRadius: '9px',
                border: 'none',
                background: '#7c3aed',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ← ត្រឡប់ទៅទិដ្ឋភាពរួមសាលា
            </button>
          )}
        </div>
      )}

      {/* 1. Welcome Hero & Quick Actions */}
      <div
        className="glass-panel"
        style={{
          padding: '1.35rem 1.5rem',
          background:
            'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderLeft: '5px solid var(--primary-color, #3b82f6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.15rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <TeacherAvatar teacher={teacher || { fullName: displayName }} size={60} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                សួស្តី, {displayName}
              </h1>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary-color, #2563eb)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                }}
              >
                {subjectText}
              </span>
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              📅 {todayFullKh} • តាមដានវត្តមាន ពិន្ទុ និងមេរៀនប្រចាំថ្ងៃ
            </p>
          </div>
        </div>

        {/* Quick Actions & Month Selector */}
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
            title="ជ្រើសរើសខែសម្រាប់ពិនិត្យស្ថានភាពពិន្ទុ"
          >
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>ខែពិន្ទុ៖</span>
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
            href="/dashboard/attendance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.9rem',
              borderRadius: '10px',
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
            }}
          >
            ✓ ស្រង់វត្តមានថ្ងៃនេះ
          </Link>

          <Link
            href="/dashboard/scores"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.9rem',
              borderRadius: '10px',
              background: '#f59e0b',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.24)',
            }}
          >
            ★ បញ្ចូលពិន្ទុ
          </Link>

          <Link
            href="/dashboard/classes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.52rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
            }}
          >
            🎓 ថ្នាក់រៀន
          </Link>
        </div>
      </div>

      {/* 2. Four Core Teacher KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 225px), 1fr))',
          gap: '0.95rem',
        }}
      >
        {/* KPI 1: Assigned Classes */}
        <div className="glass-panel" style={{ padding: '1.1rem 1.2rem', borderTop: '3px solid #6366f1' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            ថ្នាក់រៀនទទួលបន្ទុក
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {teacherReport.classCount} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>ថ្នាក់</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {teacherReport.shiftsSummary}
          </div>
        </div>

        {/* KPI 2: My Students */}
        <div className="glass-panel" style={{ padding: '1.1rem 1.2rem', borderTop: '3px solid #0ea5e9' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            សិស្សសរុបរបស់ខ្ញុំ (កំពុងសិក្សា)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            {teacherReport.activeStudentsCount}{' '}
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>នាក់</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ color: '#ec4899' }}>ស្រី {teacherReport.girlsCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#3b82f6' }}>ប្រុស {teacherReport.boysCount}</span>
            {(teacherReport.suspendedCount > 0 || teacherReport.droppedCount > 0) && (
              <>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ color: '#f59e0b' }}>ព្យួរ {teacherReport.suspendedCount}</span>
                <span style={{ color: '#ef4444' }}>ឈប់ {teacherReport.droppedCount}</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 3: Attendance Today */}
        <div className="glass-panel" style={{ padding: '1.1rem 1.2rem', borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            វត្តមានថ្ងៃនេះ
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color:
                teacherReport.classCount > 0 &&
                teacherReport.attendanceClassesTaken >= teacherReport.classCount
                  ? '#059669'
                  : '#d97706',
              margin: '0.25rem 0',
            }}
          >
            ស្រង់រួច {teacherReport.attendanceClassesTaken}/{teacherReport.classCount}{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ថ្នាក់</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ color: '#10b981' }}>មក {teacherReport.presentTodayCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#ef4444' }}>អវត្តមាន {teacherReport.absentTodayCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <span style={{ color: '#f59e0b' }}>ច្បាប់ {teacherReport.permissionTodayCount}</span>
          </div>
        </div>

        {/* KPI 4: Monthly Scores & Tasks */}
        <div className="glass-panel" style={{ padding: '1.1rem 1.2rem', borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            ពិន្ទុ ({scoreMonthKh}) & កិច្ចការ
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color:
                teacherReport.classCount > 0 &&
                teacherReport.scoreClassesComplete >= teacherReport.classCount
                  ? '#059669'
                  : teacherReport.scoreClassesComplete > 0 || teacherReport.scoreClassesPartial > 0
                    ? '#d97706'
                    : '#dc2626',
              margin: '0.25rem 0',
            }}
          >
            {teacherReport.scoreClassesComplete}/{teacherReport.classCount}{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ថ្នាក់រួចរាល់ ✔</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ដាក់ពិន្ទុបាន {teacherReport.totalScoredStudents}/{teacherReport.totalExpectedScoreStudents} សិស្ស • កិច្ចការសល់{' '}
            <strong style={{ color: teacherReport.pendingTasksCount > 0 ? '#f59e0b' : '#10b981' }}>
              {teacherReport.pendingTasksCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Optional Strip: My Monthly Work Tracking, Week 4 Exam Stages & Admin Special Tasks */}
      {teacherReport.trackingSummary &&
        (teacherReport.trackingSummary.totalTopics > 0 ||
          adminSpecialTasks.length > 0 ||
          w4ExamActive) && (
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
              borderLeft: '4px solid #0d9488',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                📋 គោលដៅការងារគ្រូប្រចាំខែ ({scoreMonthKh})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.77rem', fontWeight: 700 }}>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                  Topic បានរៀន៖ {teacherReport.trackingSummary.totalTopics}
                </span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                  Homework៖ {teacherReport.trackingSummary.totalHomeworkCount} ដង
                </span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
                  វីដេអូ Topic៖ {teacherReport.trackingSummary.totalVideoCount}
                </span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(13, 148, 136, 0.14)', color: '#0d9488' }}>
                  សម្រេចរួម៖ {teacherReport.trackingSummary.completionPct}%
                </span>
              </div>
            </div>

            {(w4ExamEntry || adminSpecialTasks.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                {w4ExamActive && w4ExamEntry && (
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
                      fontSize: '0.76rem',
                    }}
                  >
                    <strong style={{ color: '#7c3aed' }}>📝 វិញ្ញាសា (សប្តាហ៍ទី ៤)៖</strong>
                    {EXAM_STAGES.map((st) => {
                      const done = Boolean(w4ExamEntry[st.key]);
                      return (
                        <span
                          key={st.key}
                          style={{
                            padding: '0.12rem 0.45rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            background: done ? 'rgba(16, 185, 129, 0.16)' : 'var(--main-bg)',
                            color: done ? '#059669' : 'var(--text-secondary)',
                          }}
                        >
                          {done ? '✓' : st.step} {st.shortLabel}
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
                      fontSize: '0.77rem',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: tk.done ? '#059669' : '#0284c7' }}>
                      {tk.done ? '✓' : '⏳'} Task ({tk.weekLabel}
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
            gap: '0.5rem',
            marginBottom: '0.85rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🎓 ថ្នាក់រៀនរបស់ខ្ញុំ & ស្ថានភាពថ្ងៃនេះ ({classes.length} ថ្នាក់)
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            ចុចលើផ្លាកវត្តមាន ឬពិន្ទុ ដើម្បីចូលបំពេញទិន្នន័យភ្លាមៗ
          </span>
        </div>

        {classes.length === 0 ? (
          <div
            className="glass-panel"
            style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            មិនទាន់មានថ្នាក់រៀនត្រូវបានកំណត់ជូនគ្រូរូបនេះនៅឡើយទេ។
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 315px), 1fr))',
              gap: '1rem',
            }}
          >
            {classes.map((ec: EnrichedClassSummary) => {
              const { cls, activeStudents, attendanceToday, scoreStatus, bookProgress } = ec;
              const iconObj = CLASS_ICONS.find((ic) => ic.id === cls.icon) || CLASS_ICONS[0];
              const colorHex =
                CLASS_COLORS.find((co) => co.id === cls.color)?.value || CLASS_COLORS[0].value;

              const scoreBadgePalette =
                scoreStatus.state === 'complete'
                  ? { bg: 'rgba(16, 185, 129, 0.14)', color: '#059669', label: 'បញ្ចូលពិន្ទុរួច ✔' }
                  : scoreStatus.state === 'partial'
                    ? { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', label: 'ដាក់ពិន្ទុបានខ្លះ ◔' }
                    : { bg: 'rgba(239, 68, 68, 0.13)', color: '#dc2626', label: 'មិនទាន់បញ្ចូលពិន្ទុ ✖' };

              return (
                <div
                  key={cls.id}
                  className="glass-panel glass-panel-hoverable"
                  style={{
                    padding: '1.15rem',
                    borderLeft: `5px solid ${colorHex}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Class Info */}
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
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
                            fontSize: '1.05rem',
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
                              padding: '0.12rem 0.48rem',
                              borderRadius: '6px',
                              background: 'var(--main-bg)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {cls.classCode}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {cls.shift || 'មិនកំណត់វេន'}
                        {cls.time ? ` • ម៉ោង ${cls.time}` : ''}
                      </div>
                      <div style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        សិស្សកំពុងសិក្សា៖ {activeStudents.length} នាក់{' '}
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                          (ស្រី {ec.girlsCount} • ប្រុស {ec.boysCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pills: Today's Attendance & Monthly Score */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    <Link
                      href="/dashboard/attendance"
                      style={{
                        flex: 1,
                        minWidth: '135px',
                        padding: '0.42rem 0.6rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: attendanceToday.isTaken
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(245, 158, 11, 0.14)',
                        color: attendanceToday.isTaken ? '#059669' : '#d97706',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span>
                        {attendanceToday.isTaken ? 'វត្តមានថ្ងៃនេះ៖ ស្រង់រួច ✔' : 'វត្តមានថ្ងៃនេះ៖ មិនទាន់ស្រង់'}
                      </span>
                      <span style={{ fontSize: '0.69rem', opacity: 0.9, fontWeight: 600 }}>
                        {attendanceToday.isTaken
                          ? `មក ${attendanceToday.presentCount} • អវត្តមាន ${attendanceToday.absentCount} • ច្បាប់ ${attendanceToday.permissionCount}`
                          : 'ចុចដើម្បីចូលស្រង់វត្តមាន →'}
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/scores"
                      style={{
                        flex: 1,
                        minWidth: '135px',
                        padding: '0.42rem 0.6rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: scoreBadgePalette.bg,
                        color: scoreBadgePalette.color,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span>{scoreBadgePalette.label}</span>
                      <span style={{ fontSize: '0.69rem', opacity: 0.9, fontWeight: 600 }}>
                        {scoreStatus.scoredCount}/{scoreStatus.expectedCount} សិស្ស ({scoreStatus.percent}%)
                      </span>
                    </Link>
                  </div>

                  {/* Book Progress Bar */}
                  <div style={{ paddingTop: '0.45rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.76rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        📚 វឌ្ឍនភាពសៀវភៅបង្រៀន
                      </span>
                      <span style={{ fontWeight: 800, color: colorHex }}>
                        {bookProgress.hasBooks
                          ? `${bookProgress.percent}% (${bookProgress.taughtPages}/${bookProgress.totalPages} ទំព័រ)`
                          : 'មិនទាន់កំណត់សៀវភៅ'}
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

      {/* 4. Charts Row: Book/Score Progress & Student Grade Ratio (A-F) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          gap: '1rem',
        }}
      >
        {/* Bar Chart: Class Book & Score Progress */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            📊 វឌ្ឍនភាពសៀវភៅ & ការដាក់ពិន្ទុតាមថ្នាក់ (%)
          </h3>
          {classChartData.length > 0 ? (
            <div style={{ width: '100%', height: '255px' }}>
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
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              មិនទាន់មានទិន្នន័យថ្នាក់រៀន
            </div>
          )}
        </div>

        {/* Donut Chart: Student Grade Distribution (A-F) */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🏆 សមាមាត្រនិទ្ទេសពិន្ទុសិស្ស A–F ({scoreMonthKh})
          </h3>
          {gradeDistribution.length > 0 ? (
            <div style={{ width: '100%', height: '255px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={88}
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
                height: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.84rem',
                textAlign: 'center',
              }}
            >
              <span>មិនទាន់មានទិន្នន័យពិន្ទុសម្រាប់ {scoreMonthKh} ទេ</span>
              <Link
                href="/dashboard/scores"
                style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
              >
                ចូលទៅបញ្ចូលពិន្ទុឥឡូវនេះ →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Teaching Records & Ongoing Class Tasks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          gap: '1rem',
        }}
      >
        {/* Recent Teaching Records */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📖 កំណត់ត្រាបង្រៀនចុងក្រោយ
            </h3>
            <Link
              href="/dashboard/classes"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-color)', textDecoration: 'none' }}
            >
              មើលទាំងអស់ →
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <div style={{ padding: '1.8rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              មិនទាន់មានកំណត់ត្រាបង្រៀនទេ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentRecords.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                      {rec.className}
                      {rec.bookTitle ? ` • ${rec.bookTitle}` : ''}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {rec.date ? formatDateToDMY(rec.date) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {rec.pages ? <strong style={{ color: '#2563eb' }}>ទំព័រ {rec.pages}៖ </strong> : null}
                    {rec.content || rec.other || 'បានកត់ត្រាការបង្រៀន'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ongoing Tasks */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📌 កិច្ចការក្នុងថ្នាក់កំពុងអនុវត្ត
            </h3>
            <Link
              href="/dashboard/classes"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-color)', textDecoration: 'none' }}
            >
              គ្រប់គ្រងកិច្ចការ →
            </Link>
          </div>

          {myOngoingTasks.length === 0 ? (
            <div style={{ padding: '1.8rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              មិនមានកិច្ចការដែលនៅសល់ទេ ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {myOngoingTasks.map((task) => {
                const pct = Math.min(100, Math.max(0, Number(task.progress) || 0));
                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{task.title}</strong>
                      {task.className && (
                        <span
                          style={{
                            padding: '0.12rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#2563eb',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {task.className}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
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
