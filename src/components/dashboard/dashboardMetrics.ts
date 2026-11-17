import {
  KHMER_MONTHS,
  StudentBillingInfo,
  computeStudentBillingInfo,
  formatKhmerFullDate,
  normalizePaymentRiels,
  parseLocalDate,
} from '@/utils/paymentBilling';
import {
  MonthlyTrackingDoc,
  TeacherMonthlySummary,
  WEEK_META,
  buildMonthlyTeacherSummaries,
  hasExamConfigActive,
} from '@/components/teacher-tracking/trackingModel';

export { KHMER_MONTHS, formatKhmerFullDate };

export interface ClassTodayAttendance {
  isTaken: boolean;
  isFullyTaken: boolean;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  permissionCount: number;
}

export interface ClassScoreStatus {
  scoredCount: number;
  expectedCount: number;
  percent: number;
  state: 'complete' | 'partial' | 'none' | 'empty';
}

export interface ClassBookProgress {
  taughtPages: number;
  totalPages: number;
  percent: number;
  hasBooks: boolean;
}

export interface ClassRosterAlert {
  classId: string;
  className: string;
  classCode: string;
  teacherName: string;
  deletedFromMainCount: number;
  droppedOutCount: number;
  multiClassCount: number;
}

export interface EnrichedClassSummary {
  cls: any;
  activeStudents: any[];
  boysCount: number;
  girlsCount: number;
  droppedCount: number;
  suspendedCount: number;
  attendanceToday: ClassTodayAttendance;
  scoreStatus: ClassScoreStatus;
  bookProgress: ClassBookProgress;
  rosterAlert: ClassRosterAlert;
  pendingTasksCount: number;
  latestRecord: any | null;
}

export interface TeacherReportRow {
  teacher: any;
  classes: EnrichedClassSummary[];
  classCount: number;
  shiftsSummary: string;
  activeStudentsCount: number;
  girlsCount: number;
  boysCount: number;
  suspendedCount: number;
  droppedCount: number;
  attendanceClassesTaken: number;
  presentTodayCount: number;
  absentTodayCount: number;
  permissionTodayCount: number;
  scoreClassesComplete: number;
  scoreClassesPartial: number;
  totalScoredStudents: number;
  totalExpectedScoreStudents: number;
  avgBookProgressPct: number;
  pendingTasksCount: number;
  trackingSummary: TeacherMonthlySummary | null;
}

export function isStudentDropped(status?: string | null): boolean {
  const s = String(status || '').trim();
  return s === 'ឈប់រៀន' || s === 'ឈប់សិក្សា' || s === 'បញ្ចប់ការសិក្សា';
}

export function isStudentSuspended(status?: string | null): boolean {
  const s = String(status || '').trim();
  return s === 'ព្យួរការសិក្សា' || s === 'ផ្អាក';
}

export function isStudentActive(status?: string | null): boolean {
  return !isStudentDropped(status) && !isStudentSuspended(status);
}

export function isFemaleGender(gender?: string | null): boolean {
  const g = String(gender || '').trim().toLowerCase();
  return g === 'ស្រី' || g === 'f' || g === 'female';
}

export function getClassMemberIds(cls: any): string[] {
  if (!cls) return [];
  if (Array.isArray(cls.studentIds) && cls.studentIds.length > 0) {
    return Array.from(new Set(cls.studentIds.filter(Boolean)));
  }
  if (Array.isArray(cls.studentsData) && cls.studentsData.length > 0) {
    return Array.from(new Set(cls.studentsData.map((s: any) => s?.id).filter(Boolean)));
  }
  return [];
}

export function doesClassBelongToTeacher(
  cls: any,
  teacher: any | null,
  fallbackUserId?: string,
  fallbackUserName?: string,
  fallbackProfileId?: string
): boolean {
  if (!cls) return false;
  const clsTeacherId = String(cls.teacherId || '').trim();
  const clsTeacherName = String(cls.teacherName || '').trim();

  if (teacher) {
    if (teacher.id && clsTeacherId === String(teacher.id).trim()) return true;
    if (teacher.linkedUserId && clsTeacherId === String(teacher.linkedUserId).trim()) return true;
    if (teacher.teacherId && clsTeacherId === String(teacher.teacherId).trim()) return true;
    if (teacher.fullName && clsTeacherName && clsTeacherName === String(teacher.fullName).trim()) {
      return true;
    }
  }
  if (fallbackProfileId && clsTeacherId === fallbackProfileId.trim()) return true;
  if (fallbackUserId && clsTeacherId === fallbackUserId.trim()) return true;
  if (fallbackUserName && clsTeacherName && clsTeacherName === fallbackUserName.trim()) return true;
  return false;
}

export function formatYearMonthKh(ym: string): string {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return ym;
  const year = Number(m[1]);
  const monthIdx = Number(m[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return ym;
  return `ខែ${KHMER_MONTHS[monthIdx]} ${year}`;
}

export function buildEnrichedClasses(params: {
  classes: any[];
  students: any[];
  attendanceDocs: any[];
  monthScores: any[];
  teachingRecords: any[];
  tasks: any[];
  scoreMonth: string;
  today?: Date;
}): EnrichedClassSummary[] {
  const {
    classes,
    students,
    attendanceDocs,
    monthScores,
    teachingRecords,
    tasks,
    scoreMonth,
    today = new Date(),
  } = params;

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const studentMap = new Map<string, any>();
  students.forEach((s) => {
    if (s?.id) studentMap.set(s.id, s);
  });

  // Track how many classes each student is enrolled in (for multi-class duplicate alert)
  const studentClassCountMap = new Map<string, number>();
  classes.forEach((c) => {
    const memberIds = getClassMemberIds(c);
    memberIds.forEach((sid) => {
      studentClassCountMap.set(sid, (studentClassCountMap.get(sid) || 0) + 1);
    });
  });

  // Map today's attendance doc by classId
  const todayAttByClass = new Map<string, any>();
  attendanceDocs.forEach((doc) => {
    const expectedId = `${doc.classId}_${todayYear}_${todayMonth}`;
    if (
      doc?.id === expectedId ||
      (doc?.classId && Number(doc.year) === todayYear && Number(doc.month) === todayMonth)
    ) {
      todayAttByClass.set(doc.classId || String(doc.id).split('_')[0], doc);
    }
  });

  return classes.map((c) => {
    const memberIds = getClassMemberIds(c);
    const activeStudents: any[] = [];
    let girlsCount = 0;
    let boysCount = 0;
    let droppedCount = 0;
    let suspendedCount = 0;
    let deletedFromMainCount = 0;
    let multiClassCount = 0;

    memberIds.forEach((sid) => {
      const st = studentMap.get(sid);
      if (students.length > 0 && !st) {
        deletedFromMainCount += 1;
      } else if (st) {
        if (isStudentDropped(st.status)) {
          droppedCount += 1;
        } else if (isStudentSuspended(st.status)) {
          suspendedCount += 1;
        } else {
          activeStudents.push(st);
          if (isFemaleGender(st.gender)) girlsCount += 1;
          else boysCount += 1;
        }
      }
      if ((studentClassCountMap.get(sid) || 0) > 1) {
        multiClassCount += 1;
      }
    });

    // Fallback if class matches by s.className when studentIds array is empty
    if (memberIds.length === 0 && c.className) {
      students.forEach((st) => {
        if (st.className === c.className || st.className === c.classCode) {
          if (isStudentDropped(st.status)) droppedCount += 1;
          else if (isStudentSuspended(st.status)) suspendedCount += 1;
          else {
            activeStudents.push(st);
            if (isFemaleGender(st.gender)) girlsCount += 1;
            else boysCount += 1;
          }
        }
      });
    }

    // 1. Attendance Today
    const attDoc = todayAttByClass.get(c.id);
    const attRecords = attDoc?.records || {};
    let presentCount = 0;
    let absentCount = 0;
    let permissionCount = 0;

    activeStudents.forEach((st) => {
      const stuRec = attRecords?.[st.id];
      if (stuRec && typeof stuRec === 'object') {
        const val = stuRec[todayDay] ?? stuRec[String(todayDay)] ?? '';
        if (val === 'present') presentCount += 1;
        else if (val === 'absent') absentCount += 1;
        else if (val === 'permission') permissionCount += 1;
      }
    });

    const markedCount = presentCount + absentCount + permissionCount;
    const attendanceToday: ClassTodayAttendance = {
      isTaken: activeStudents.length > 0 && markedCount > 0,
      isFullyTaken: activeStudents.length > 0 && markedCount >= activeStudents.length,
      markedCount,
      presentCount,
      absentCount,
      permissionCount,
    };

    // 2. Score Entry Status for scoreMonth
    const classScoreRows = monthScores.filter(
      (sc) => sc.classId === c.id && (!sc.month || sc.month === scoreMonth)
    );
    const expectedCount =
      classScoreRows.length > 0 ? classScoreRows.length : activeStudents.length;
    const scoredCount = classScoreRows.filter(
      (sc) => sc.totalScore !== undefined && sc.totalScore !== null && String(sc.totalScore).trim() !== ''
    ).length;
    const scorePct =
      expectedCount > 0 ? Math.min(100, Math.round((scoredCount / expectedCount) * 100)) : 0;

    let scoreState: ClassScoreStatus['state'] = 'none';
    if (expectedCount === 0) scoreState = 'empty';
    else if (scorePct >= 80) scoreState = 'complete';
    else if (scoredCount > 0) scoreState = 'partial';
    else scoreState = 'none';

    const scoreStatus: ClassScoreStatus = {
      scoredCount,
      expectedCount,
      percent: scorePct,
      state: scoreState,
    };

    // 3. Book / Teaching Progress
    const classRecords = teachingRecords
      .filter((r) => r.classId === c.id)
      .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
    const latestRecord = classRecords.length > 0 ? classRecords[0] : null;

    let totalBookPages = 0;
    let totalTaughtPages = 0;
    if (Array.isArray(c.books) && c.books.length > 0) {
      c.books.forEach((b: any) => {
        const pagesTotal = Number(b.totalPages) || 0;
        if (pagesTotal > 0) {
          totalBookPages += pagesTotal;
          const bookRecs = classRecords.filter((r: any) => r.bookId === b.id);
          if (bookRecs.length > 0) {
            const maxP = Math.max(...bookRecs.map((r: any) => Number(r.pages) || 0));
            totalTaughtPages += Math.min(pagesTotal, maxP);
          }
        }
      });
    }
    const bookPct =
      totalBookPages > 0 ? Math.min(100, Math.round((totalTaughtPages / totalBookPages) * 100)) : 0;

    const bookProgress: ClassBookProgress = {
      taughtPages: totalTaughtPages,
      totalPages: totalBookPages,
      percent: bookPct,
      hasBooks: totalBookPages > 0,
    };

    // 4. Ongoing Tasks
    const pendingTasksCount = tasks.filter(
      (t) => t.classId === c.id && !t.success && Number(t.progress || 0) < 100
    ).length;

    const rosterAlert: ClassRosterAlert = {
      classId: c.id,
      className: c.className || c.classCode || 'ថ្នាក់រៀន',
      classCode: c.classCode || '',
      teacherName: c.teacherName || 'មិនទាន់កំណត់',
      deletedFromMainCount,
      droppedOutCount: droppedCount,
      multiClassCount,
    };

    return {
      cls: c,
      activeStudents,
      boysCount,
      girlsCount,
      droppedCount,
      suspendedCount,
      attendanceToday,
      scoreStatus,
      bookProgress,
      rosterAlert,
      pendingTasksCount,
      latestRecord,
    };
  });
}

export function buildTeacherReportRows(params: {
  teachers: any[];
  enrichedClasses: EnrichedClassSummary[];
  trackingDoc: MonthlyTrackingDoc | null;
  scoreMonth: string;
}): TeacherReportRow[] {
  const { teachers, enrichedClasses, trackingDoc, scoreMonth } = params;

  // Determine active weeks for tracking summary
  const [yrStr, moStr] = scoreMonth.split('-');
  const daysInMo =
    yrStr && moStr ? new Date(Number(yrStr), Number(moStr), 0).getDate() : 30;
  const hasAnyW5 =
    Boolean(trackingDoc?.examSchedules?.w5 && hasExamConfigActive(trackingDoc.examSchedules.w5)) ||
    Object.values(trackingDoc?.records || {}).some((r) => Boolean(r?.w5));
  const enableW5 =
    trackingDoc?.enableWeek5 !== undefined
      ? Boolean(trackingDoc.enableWeek5) || hasAnyW5
      : daysInMo > 28 || hasAnyW5;
  const activeWeeks = enableW5 ? WEEK_META : WEEK_META.slice(0, 4);

  const trackingSummaries = buildMonthlyTeacherSummaries(
    teachers,
    activeWeeks,
    trackingDoc?.records || {},
    trackingDoc?.examSchedules || {}
  );
  const trackingMap = new Map<string, TeacherMonthlySummary>();
  trackingSummaries.forEach((ts) => trackingMap.set(ts.teacher.id, ts));

  return teachers.map((teacher) => {
    const myClasses = enrichedClasses.filter((ec) =>
      doesClassBelongToTeacher(ec.cls, teacher)
    );

    // Deduplicate students across a single teacher's classes
    const uniqueStudents = new Map<string, any>();
    let droppedCount = 0;
    let suspendedCount = 0;
    const shiftCounts = new Map<string, number>();

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

    const shiftsSummary =
      shiftCounts.size > 0
        ? Array.from(shiftCounts.entries())
            .map(([sh, cnt]) => `${sh} (${cnt})`)
            .join(' • ')
        : 'មិនទាន់កំណត់វេន';

    const avgBookProgressPct =
      bookClassesCount > 0 ? Math.round(bookPctSum / bookClassesCount) : 0;

    return {
      teacher,
      classes: myClasses,
      classCount: myClasses.length,
      shiftsSummary,
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
      avgBookProgressPct,
      pendingTasksCount,
      trackingSummary: trackingMap.get(teacher.id) || null,
    };
  });
}

export function computeSchoolFinancialAnalytics(params: {
  students: any[];
  payments: any[];
  classes: any[];
  upcomingDays?: number;
  today?: Date;
}) {
  const { students, payments, classes, upcomingDays = 5, today = new Date() } = params;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0..11

  // 1. Current month revenue & 6-month trend
  const last6Months: { key: string; label: string; revenue: number; count: number }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(currentYear, currentMonth - offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    last6Months.push({
      key,
      label: `${KHMER_MONTHS[m]} ${String(y).slice(2)}`,
      revenue: 0,
      count: 0,
    });
  }
  const monthBucketMap = new Map(last6Months.map((item) => [item.key, item]));

  let thisMonthRevenueRiels = 0;
  let thisMonthReceiptCount = 0;
  const thisMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  payments.forEach((p) => {
    const dt = parseLocalDate(p.paymentDate);
    if (!dt) return;
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const amt = normalizePaymentRiels(p.amount, p);
    if (ym === thisMonthKey) {
      thisMonthRevenueRiels += amt;
      thisMonthReceiptCount += 1;
    }
    const bucket = monthBucketMap.get(ym);
    if (bucket) {
      bucket.revenue += amt;
      bucket.count += 1;
    }
  });

  // 2. Student Billing Status across active students
  const activeStudents = students.filter((s) => isStudentActive(s.status));
  const billingList: StudentBillingInfo[] = activeStudents.map((s) =>
    computeStudentBillingInfo(s, payments, classes, today)
  );

  let paidUpCount = 0;
  let upcomingCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let totalDueAndOverdueRiels = 0;

  const dueAndOverdueStudents: StudentBillingInfo[] = [];

  billingList.forEach((b) => {
    if (b.statusKey === 'overdue') {
      overdueCount += 1;
      totalDueAndOverdueRiels += b.amountDue;
      dueAndOverdueStudents.push(b);
    } else if (b.statusKey === 'due') {
      dueTodayCount += 1;
      totalDueAndOverdueRiels += b.amountDue;
      dueAndOverdueStudents.push(b);
    } else if (b.statusKey === 'paid') {
      if (b.daysRemaining <= upcomingDays) {
        upcomingCount += 1;
      } else {
        paidUpCount += 1;
      }
    }
  });

  const topOverdueStudents = [...dueAndOverdueStudents]
    .sort((a, b) => {
      if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
      return b.amountDue - a.amountDue;
    })
    .slice(0, 8);

  return {
    thisMonthRevenueRiels,
    thisMonthReceiptCount,
    last6Months,
    paidUpCount,
    upcomingCount,
    dueTodayCount,
    overdueCount,
    dueAndOverdueCount: dueTodayCount + overdueCount,
    totalDueAndOverdueRiels,
    topOverdueStudents,
  };
}
