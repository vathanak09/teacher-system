"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  attendanceService,
  classService,
  paymentService,
  scoreService,
  settingsService,
  studentService,
  taskService,
  teacherService,
  teacherTrackingService,
  teachingRecordService,
} from '@/services/db';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import { AppIcon } from '@/components/AppIcons';
import { TeacherAvatar } from '@/components/teacher-tracking/TrackingControls';
import { MonthlyTrackingDoc } from '@/components/teacher-tracking/trackingModel';
import {
  TeacherReportRow,
  buildEnrichedClasses,
  buildTeacherReportRows,
  doesClassBelongToTeacher,
  isFemaleGender,
} from '@/components/dashboard/dashboardMetrics';
import AdminOverviewView from '@/components/dashboard/AdminOverviewView';
import TeacherDashboardView from '@/components/dashboard/TeacherDashboardView';

function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [teacherProfileId, setTeacherProfileId] = useState('');

  // Admin "View As Teacher" switcher state (null = School-Wide Admin Overview)
  const [inspectedTeacherId, setInspectedTeacherId] = useState<string | null>(null);
  const [scoreMonth, setScoreMonth] = useState<string>(getCurrentYearMonth);

  // Live Data Streams
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<number>(5);
  const [attendanceDocs, setAttendanceDocs] = useState<any[]>([]);
  const [monthScores, setMonthScores] = useState<any[]>([]);
  const [teachingRecords, setTeachingRecords] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [trackingDoc, setTrackingDoc] = useState<MonthlyTrackingDoc | null>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    const savedProfileId = localStorage.getItem('teacherProfileId') || '';

    setRole(currentRole);
    setUserId(currentUserId);
    setUserName(currentUserName);
    setTeacherProfileId(savedProfileId);

    const unsubs: (() => void)[] = [];

    unsubs.push(
      classService.subscribeAll((data) => {
        if (currentRole === 'admin') {
          setClasses(data);
        } else {
          setClasses(
            data.filter((c: any) =>
              doesClassBelongToTeacher(c, null, currentUserId, currentUserName, savedProfileId)
            )
          );
        }
      })
    );

    unsubs.push(studentService.subscribeAll(setStudents));

    unsubs.push(
      teacherService.subscribeAll((data) => {
        const sorted = [...data].sort((a: any, b: any) =>
          String(a.teacherId || a.fullName || '').localeCompare(
            String(b.teacherId || b.fullName || ''),
            undefined,
            { numeric: true }
          )
        );
        if (currentRole === 'admin') {
          setTeachers(sorted);
        } else {
          setTeachers(
            sorted.filter(
              (t: any) =>
                (savedProfileId && t.id === savedProfileId) ||
                (currentUserId && t.linkedUserId === currentUserId) ||
                (currentUserName && t.fullName === currentUserName)
            )
          );
        }
      })
    );

    unsubs.push(attendanceService.subscribeAll(setAttendanceDocs));
    unsubs.push(teachingRecordService.subscribeAll(setTeachingRecords));
    unsubs.push(taskService.subscribeAll(setTasks));

    if (currentRole === 'admin') {
      unsubs.push(paymentService.subscribeAll(setPayments));
      unsubs.push(
        settingsService.subscribeOne('paymentSyncSettings', (docData) => {
          if (docData?.upcomingDays !== undefined) {
            setUpcomingDays(Math.max(1, Number(docData.upcomingDays) || 5));
          }
        })
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  // Subscribe to selected month's Scores & Teacher Tracking on RTDB (zero Firestore reads)
  useEffect(() => {
    if (!scoreMonth) return;
    const unsubScores = scoreService.subscribeByQuery('month', '==', scoreMonth, setMonthScores);
    const unsubTracking = teacherTrackingService.subscribeOne(scoreMonth, (doc) => {
      setTrackingDoc(doc);
    });
    return () => {
      unsubScores();
      unsubTracking();
    };
  }, [scoreMonth]);

  const enrichedClasses = useMemo(
    () =>
      buildEnrichedClasses({
        classes,
        students,
        attendanceDocs,
        monthScores,
        teachingRecords,
        tasks,
        scoreMonth,
      }),
    [classes, students, attendanceDocs, monthScores, teachingRecords, tasks, scoreMonth]
  );

  const teacherReports = useMemo(
    () =>
      buildTeacherReportRows({
        teachers,
        enrichedClasses,
        trackingDoc,
        scoreMonth,
      }),
    [teachers, enrichedClasses, trackingDoc, scoreMonth]
  );

  const activeTeachersForSwitcher = useMemo(
    () => teachers.filter((t) => t.status !== 'ឈប់បង្រៀន'),
    [teachers]
  );

  const switcherDropdownOptions = useMemo(
    () => [
      { value: '__admin__', label: 'ទិដ្ឋភាពរួមសាលា (Admin Overview)' },
      ...activeTeachersForSwitcher.map((t) => ({
        value: t.id,
        label: t.fullName,
        sublabel: t.subject || t.teacherId || undefined,
      })),
    ],
    [activeTeachersForSwitcher]
  );

  // Build personal TeacherReportRow when logged in as Teacher (including fallback if no Teacher doc linked)
  const currentTeacherReport: TeacherReportRow | null = useMemo(() => {
    if (role === 'admin') {
      if (!inspectedTeacherId) return null;
      return teacherReports.find((tr) => tr.teacher.id === inspectedTeacherId) || null;
    }

    if (teacherReports.length > 0) {
      return teacherReports[0];
    }

    // Fallback synthesis from logged-in teacher's classes
    const myClasses = enrichedClasses;
    const uniqueStudents = new Map<string, any>();
    let droppedCount = 0;
    let suspendedCount = 0;
    let attendanceClassesTaken = 0;
    let presentTodayCount = 0;
    let absentTodayCount = 0;
    let permissionTodayCount = 0;
    let scoreClassesComplete = 0;
    let scoreClassesPartial = 0;
    let totalScoredStudents = 0;
    let totalExpectedScoreStudents = 0;
    let bookClassesCount = 0;
    let bookPctSum = 0;
    let pendingTasksCount = 0;
    const shiftCounts = new Map<string, number>();

    myClasses.forEach((ec) => {
      const sh = String(ec.cls.shift || '').trim();
      if (sh) shiftCounts.set(sh, (shiftCounts.get(sh) || 0) + 1);
      ec.activeStudents.forEach((st) => uniqueStudents.set(st.id, st));
      droppedCount += ec.droppedCount;
      suspendedCount += ec.suspendedCount;
      if (ec.attendanceToday.isTaken) attendanceClassesTaken += 1;
      presentTodayCount += ec.attendanceToday.presentCount;
      absentTodayCount += ec.attendanceToday.absentCount;
      permissionTodayCount += ec.attendanceToday.permissionCount;
      if (ec.scoreStatus.state === 'complete') scoreClassesComplete += 1;
      else if (ec.scoreStatus.state === 'partial') scoreClassesPartial += 1;
      totalScoredStudents += ec.scoreStatus.scoredCount;
      totalExpectedScoreStudents += ec.scoreStatus.expectedCount;
      if (ec.bookProgress.hasBooks) {
        bookClassesCount += 1;
        bookPctSum += ec.bookProgress.percent;
      }
      pendingTasksCount += ec.pendingTasksCount;
    });

    let girlsCount = 0;
    let boysCount = 0;
    uniqueStudents.forEach((st) => {
      if (isFemaleGender(st.gender)) girlsCount += 1;
      else boysCount += 1;
    });

    return {
      teacher: { id: userId || 'me', fullName: userName || 'គ្រូបង្រៀន', subject: 'គ្រូបង្រៀន' },
      classes: myClasses,
      classCount: myClasses.length,
      shiftsSummary:
        shiftCounts.size > 0
          ? Array.from(shiftCounts.entries())
              .map(([s, n]) => `${s} (${n})`)
              .join(' • ')
          : 'មិនទាន់កំណត់វេន',
      activeStudentsCount: uniqueStudents.size,
      girlsCount,
      boysCount,
      suspendedCount,
      droppedCount,
      attendanceClassesTaken,
      presentTodayCount,
      absentTodayCount,
      permissionTodayCount,
      scoreClassesComplete,
      scoreClassesPartial,
      totalScoredStudents,
      totalExpectedScoreStudents,
      avgBookProgressPct: bookClassesCount > 0 ? Math.round(bookPctSum / bookClassesCount) : 0,
      pendingTasksCount,
      trackingSummary: null,
    };
  }, [role, inspectedTeacherId, teacherReports, enrichedClasses, userId, userName]);

  return (
    <div
      className="page-container animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', paddingBottom: '2.5rem' }}
    >
      {/* 1. Admin "View As Teacher" Switcher Bar (Horizontal Avatar Pills + Search Dropdown) */}
      {role === 'admin' && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          {/* Horizontal Scrollable Teacher Avatar Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              overflowX: 'auto',
              flex: 1,
              minWidth: '240px',
              paddingBottom: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setInspectedTeacherId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.44rem 0.9rem',
                borderRadius: '999px',
                border: inspectedTeacherId === null ? 'none' : '1px solid var(--border-color)',
                background:
                  inspectedTeacherId === null
                    ? 'linear-gradient(135deg, #2563eb, #0d9488)'
                    : 'var(--main-bg)',
                color: inspectedTeacherId === null ? '#ffffff' : 'var(--text-primary)',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow:
                  inspectedTeacherId === null ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
              }}
            >
              <AppIcon name="building" size={15} />
              <span>ទិដ្ឋភាពរួមសាលា</span>
            </button>

            {activeTeachersForSwitcher.map((t) => {
              const isSelected = inspectedTeacherId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInspectedTeacherId(t.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.28rem 0.75rem 0.28rem 0.32rem',
                    borderRadius: '999px',
                    border: isSelected ? 'none' : '1px solid var(--border-color)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
                      : 'var(--main-bg)',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.79rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 4px 12px rgba(124, 58, 237, 0.26)' : 'none',
                  }}
                  title={`មើល Dashboard របស់គ្រូ ${t.fullName}`}
                >
                  <TeacherAvatar teacher={t} size={26} />
                  <span>{t.fullName}</span>
                </button>
              );
            })}
          </div>

          {/* Searchable Teacher Selector Dropdown */}
          <div style={{ width: '245px', maxWidth: '100%', flexShrink: 0 }}>
            <CustomSelectDropdown
              options={switcherDropdownOptions}
              value={inspectedTeacherId || '__admin__'}
              onChange={(val) => setInspectedTeacherId(val === '__admin__' ? null : val)}
              searchable={true}
              searchPlaceholder="ស្វែងរកឈ្មោះគ្រូ..."
              style={{
                padding: '0.42rem 0.75rem',
                fontSize: '0.81rem',
                fontWeight: 700,
                borderRadius: '9px',
                background: 'var(--modal-bg)',
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Render Admin Overview OR Teacher Dashboard */}
      {role === 'admin' && inspectedTeacherId === null ? (
        <AdminOverviewView
          students={students}
          teachers={teachers}
          enrichedClasses={enrichedClasses}
          teacherReports={teacherReports}
          payments={payments}
          upcomingDays={upcomingDays}
          scoreMonth={scoreMonth}
          onScoreMonthChange={setScoreMonth}
          onInspectTeacher={(tid) => {
            setInspectedTeacherId(tid);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : currentTeacherReport ? (
        <TeacherDashboardView
          teacherReport={currentTeacherReport}
          fallbackName={userName}
          isAdminInspecting={role === 'admin' && inspectedTeacherId !== null}
          onBackToAdmin={() => setInspectedTeacherId(null)}
          scoreMonth={scoreMonth}
          onScoreMonthChange={setScoreMonth}
          monthScores={monthScores}
          teachingRecords={teachingRecords}
          tasks={tasks}
        />
      ) : null}
    </div>
  );
}
