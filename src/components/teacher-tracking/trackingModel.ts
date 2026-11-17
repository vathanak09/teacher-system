export type WeekKey = 'w1' | 'w2' | 'w3' | 'w4' | 'w5';
export type ViewTab = WeekKey | 'monthly' | 'screenshot';
export type ScreenshotScope = WeekKey | 'monthly';
export type CompletionDropdownStatus = 'none' | 'partial' | 'done';

export interface ExamScheduleConfig {
  enabled?: boolean;
  collectDate?: string; // ថ្ងៃប្រមូលវិញ្ញាសាពីគ្រូ (YYYY-MM-DD)
  examDate?: string;    // ថ្ងៃត្រូវប្រឡង (YYYY-MM-DD)
  resultDate?: string;  // ថ្ងៃចេញលទ្ធផល (YYYY-MM-DD)
}

export interface TeacherWeekEntry {
  // Col 1: រៀន Topic
  topicDone: boolean;
  topicCount: number;
  topicTitle: string;

  // Col 2: កិច្ចការផ្ទះសិស្ស
  homeworkStatus: CompletionDropdownStatus;
  homeworkCount: number;
  homeworkDone: boolean;
  homeworkNote: string;

  // Col 3: ថតវីដេអូ Topic
  videoStatus: CompletionDropdownStatus;
  videoCount: number;
  videoDone: boolean;
  videoUrl: string;
  videoNote: string;

  // Col 4: វិញ្ញាសាប្រឡង (3 ដំណាក់កាល)
  examStage1Submitted: boolean; // ១. ប្រគល់វិញ្ញាសា
  examStage2Scored: boolean;    // ២. បានបញ្ចូលពិន្ទុ
  examStage3Result: boolean;    // ៣. ចេញលទ្ធផលរួច
  examNote: string;

  // Col 5: Task (កិច្ចការពិសេសដាក់ដោយ Admin)
  taskCount: number;
  taskDescription: string;
  taskDone: boolean;

  // Col 6: អវត្តមាន (ថ្ងៃគត់)
  permissionDays: number;
  absentDays: number;

  // Col 7: មកយឺត (ដង) & នាទីយឺត
  lateCount: number;
  lateMinutes: number;

  // Col 8: ចំណាំ / មូលហេតុរួម
  note: string;
}

export interface MonthlyTrackingDoc {
  id?: string;
  month: string;
  enableWeek5?: boolean;
  hiddenTeacherIds?: string[];
  weekLabels?: Partial<Record<WeekKey, string>>;
  examSchedules?: Partial<Record<WeekKey, ExamScheduleConfig>>;
  records?: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  updatedAt?: string;
}

export interface TeacherMonthlySummary {
  teacher: any;
  perWeek: Record<WeekKey, { entry: TeacherWeekEntry; complete: boolean; status: WeekEvaluation }>;
  totalTopics: number;
  topicWeeksDone: number;
  totalHomeworkCount: number;
  homeworkFullWeeks: number;
  homeworkPartialWeeks: number;
  totalVideoCount: number;
  videoFullWeeks: number;
  videoPartialWeeks: number;
  examActiveWeeks: number;
  examCompletedWeeks: number;
  examTotalStagesDone: number;
  examTotalStagesTarget: number;
  totalTaskCount: number;
  assignedTaskWeeks: number;
  completedTaskWeeks: number;
  permissionDays: number;
  absentDays: number;
  totalAbsenceDays: number;
  lateCount: number;
  lateMinutes: number;
  fullWeeksCompleted: number;
  weeksCount: number;
  completionPct: number;
}

export interface WeekEvaluation {
  isComplete: boolean;
  missingLabels: string[];
  examStagesDone: number;
  examActive: boolean;
  taskAssigned: boolean;
  earnedPoints: number;
  totalPoints: number;
}

export const KHMER_MONTHS = [
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

export const WEEK_META: { key: WeekKey; label: string; shortLabel: string }[] = [
  { key: 'w1', label: 'សប្តាហ៍ទី ១', shortLabel: 'S1' },
  { key: 'w2', label: 'សប្តាហ៍ទី ២', shortLabel: 'S2' },
  { key: 'w3', label: 'សប្តាហ៍ទី ៣', shortLabel: 'S3' },
  { key: 'w4', label: 'សប្តាហ៍ទី ៤', shortLabel: 'S4' },
  { key: 'w5', label: 'សប្តាហ៍ទី ៥', shortLabel: 'S5' },
];

export const HOMEWORK_STATUS_LABELS: Record<CompletionDropdownStatus, string> = {
  none: 'មិនបានដាក់',
  partial: 'បានដាក់តិចតួច',
  done: 'បានដាក់',
};

export const VIDEO_STATUS_LABELS: Record<CompletionDropdownStatus, string> = {
  none: 'មិនបានថត',
  partial: 'បានថតតិចតួច',
  done: 'បានថត',
};

export const EXAM_STAGES: {
  key: 'examStage1Submitted' | 'examStage2Scored' | 'examStage3Result';
  step: number;
  label: string;
  shortLabel: string;
}[] = [
  { key: 'examStage1Submitted', step: 1, label: '១. ប្រគល់វិញ្ញាសា', shortLabel: 'ប្រគល់' },
  { key: 'examStage2Scored', step: 2, label: '២. បានបញ្ចូលពិន្ទុ', shortLabel: 'ពិន្ទុ' },
  { key: 'examStage3Result', step: 3, label: '៣. ចេញលទ្ធផលរួច', shortLabel: 'លទ្ធផល' },
];

export const DEFAULT_ENTRY: TeacherWeekEntry = {
  topicDone: false,
  topicCount: 0,
  topicTitle: '',
  homeworkStatus: 'none',
  homeworkCount: 0,
  homeworkDone: false,
  homeworkNote: '',
  videoStatus: 'none',
  videoCount: 0,
  videoDone: false,
  videoUrl: '',
  videoNote: '',
  examStage1Submitted: false,
  examStage2Scored: false,
  examStage3Result: false,
  examNote: '',
  taskCount: 0,
  taskDescription: '',
  taskDone: false,
  permissionDays: 0,
  absentDays: 0,
  lateCount: 0,
  lateMinutes: 0,
  note: '',
};

/** Parse non-negative whole integers cleanly (never allows 0.5). */
export function toNonNegInt(val: unknown): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/** Normalize persisted entry with full backwards compatibility for earlier schema. */
export function normalizeEntry(raw?: Partial<TeacherWeekEntry> | null): TeacherWeekEntry {
  if (!raw) return { ...DEFAULT_ENTRY };

  const rawTopicCount = toNonNegInt(raw.topicCount);
  const topicDone = Boolean(raw.topicDone) || rawTopicCount >= 1;
  const topicCount = topicDone ? Math.max(1, rawTopicCount) : 0;

  const rawHwCount = toNonNegInt(raw.homeworkCount);
  const homeworkStatus: CompletionDropdownStatus =
    raw.homeworkStatus === 'partial' || raw.homeworkStatus === 'done' || raw.homeworkStatus === 'none'
      ? raw.homeworkStatus
      : raw.homeworkDone
        ? 'done'
        : rawHwCount > 0
          ? 'done'
          : 'none';
  const homeworkDone = homeworkStatus === 'done';
  const homeworkCount = homeworkStatus === 'none' ? 0 : Math.max(1, rawHwCount || 1);

  const rawVideoCount = toNonNegInt(raw.videoCount);
  const videoStatus: CompletionDropdownStatus =
    raw.videoStatus === 'partial' || raw.videoStatus === 'done' || raw.videoStatus === 'none'
      ? raw.videoStatus
      : raw.videoDone
        ? 'done'
        : rawVideoCount > 0
          ? 'done'
          : 'none';
  const videoDone = videoStatus === 'done';
  const videoCount = videoStatus === 'none' ? 0 : Math.max(1, rawVideoCount || 1);

  return {
    topicDone,
    topicCount,
    topicTitle: String(raw.topicTitle || ''),
    homeworkStatus,
    homeworkCount,
    homeworkDone,
    homeworkNote: String(raw.homeworkNote || ''),
    videoStatus,
    videoCount,
    videoDone,
    videoUrl: String(raw.videoUrl || ''),
    videoNote: String(raw.videoNote || ''),
    examStage1Submitted: Boolean(raw.examStage1Submitted),
    examStage2Scored: Boolean(raw.examStage2Scored),
    examStage3Result: Boolean(raw.examStage3Result),
    examNote: String(raw.examNote || ''),
    taskCount: toNonNegInt(raw.taskCount),
    taskDescription: String(raw.taskDescription || ''),
    taskDone: Boolean(raw.taskDone),
    permissionDays: toNonNegInt(raw.permissionDays),
    absentDays: toNonNegInt(raw.absentDays),
    lateCount: toNonNegInt(raw.lateCount),
    lateMinutes: toNonNegInt(raw.lateMinutes),
    note: String(raw.note || ''),
  };
}

export const EXAM_WEEK_KEY: WeekKey = 'w4';

export function isExamWeek(week: WeekKey): boolean {
  return week === EXAM_WEEK_KEY;
}

export function hasExamConfigActive(cfg?: ExamScheduleConfig | null): boolean {
  if (!cfg) return false;
  if (cfg.enabled === false) return false;
  return Boolean(
    cfg.enabled ||
      cfg.collectDate?.trim() ||
      cfg.examDate?.trim() ||
      cfg.resultDate?.trim()
  );
}

export function isExamEnabledInWeek4(cfg?: ExamScheduleConfig | null): boolean {
  return cfg?.enabled !== false;
}

export function countExamStages(entry: TeacherWeekEntry): number {
  return (
    (entry.examStage1Submitted ? 1 : 0) +
    (entry.examStage2Scored ? 1 : 0) +
    (entry.examStage3Result ? 1 : 0)
  );
}

export function hasTeacherSpecialTask(entry: TeacherWeekEntry): boolean {
  return entry.taskCount > 0 || entry.taskDescription.trim().length > 0;
}

/**
 * Evaluate completion status & points for one teacher in a given week.
 * Exam milestones apply ONLY in Week 4 (once-a-month exam).
 * Special task counts only when Admin assigned a task for that teacher.
 */
export function evaluateWeekEntry(
  entry: TeacherWeekEntry,
  weekExamCfg?: ExamScheduleConfig | null,
  weekKey: WeekKey = 'w1'
): WeekEvaluation {
  const missingLabels: string[] = [];
  let earnedPoints = 0;
  let totalPoints = 3; // Topic + Homework + Video

  if (entry.topicDone && entry.topicCount >= 1) {
    earnedPoints += 1;
  } else {
    missingLabels.push('Topic');
  }

  if (entry.homeworkStatus === 'done') {
    earnedPoints += 1;
  } else if (entry.homeworkStatus === 'partial') {
    earnedPoints += 0.5;
    missingLabels.push('HW តិចតួច');
  } else {
    missingLabels.push('កិច្ចការផ្ទះ');
  }

  if (entry.videoStatus === 'done') {
    earnedPoints += 1;
  } else if (entry.videoStatus === 'partial') {
    earnedPoints += 0.5;
    missingLabels.push('វីដេអូតិចតួច');
  } else {
    missingLabels.push('វីដេអូ');
  }

  const examStagesDone = countExamStages(entry);
  const examActive = isExamWeek(weekKey) && (isExamEnabledInWeek4(weekExamCfg) || examStagesDone > 0);
  if (examActive) {
    totalPoints += 1;
    earnedPoints += examStagesDone / 3;
    if (examStagesDone < 3) {
      missingLabels.push(`វិញ្ញាសា (${examStagesDone}/3)`);
    }
  }

  const taskAssigned = hasTeacherSpecialTask(entry);
  if (taskAssigned) {
    totalPoints += 1;
    if (entry.taskDone) {
      earnedPoints += 1;
    } else {
      missingLabels.push('Task');
    }
  }

  return {
    isComplete: missingLabels.length === 0,
    missingLabels,
    examStagesDone,
    examActive,
    taskAssigned,
    earnedPoints,
    totalPoints,
  };
}

/** Shared status-count updater for both Homework and Video columns. */
export function applyDropdownStatusChange(
  entry: TeacherWeekEntry,
  prefix: 'homework' | 'video',
  nextStatus: CompletionDropdownStatus
): TeacherWeekEntry {
  const currentCount = prefix === 'homework' ? entry.homeworkCount : entry.videoCount;
  const nextCount = nextStatus === 'none' ? 0 : Math.max(1, currentCount);
  const nextDone = nextStatus === 'done';

  if (prefix === 'homework') {
    return {
      ...entry,
      homeworkStatus: nextStatus,
      homeworkCount: nextCount,
      homeworkDone: nextDone,
    };
  }
  return {
    ...entry,
    videoStatus: nextStatus,
    videoCount: nextCount,
    videoDone: nextDone,
  };
}

export function applyStatusCountChange(
  entry: TeacherWeekEntry,
  prefix: 'homework' | 'video',
  nextCount: number
): TeacherWeekEntry {
  const safeCount = toNonNegInt(nextCount);
  const currentStatus = prefix === 'homework' ? entry.homeworkStatus : entry.videoStatus;
  const nextStatus: CompletionDropdownStatus =
    safeCount === 0 ? 'none' : currentStatus === 'none' ? 'done' : currentStatus;
  const nextDone = nextStatus === 'done';

  if (prefix === 'homework') {
    return {
      ...entry,
      homeworkCount: safeCount,
      homeworkStatus: nextStatus,
      homeworkDone: nextDone,
    };
  }
  return {
    ...entry,
    videoCount: safeCount,
    videoStatus: nextStatus,
    videoDone: nextDone,
  };
}

export function formatIsoDateKh(dateStr?: string): string {
  if (!dateStr) return '—';
  const trimmed = dateStr.trim();
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  return trimmed;
}

export function formatMinutesLabel(mins: number): string {
  if (mins <= 0) return '0 នាទី';
  if (mins < 60) return `${mins} នាទី`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${mins} នាទី (${h}ម៉ ${m}ន)` : `${mins} នាទី (${h} ម៉ោង)`;
}

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getStatusBadgePalette(status: CompletionDropdownStatus): {
  bg: string;
  border: string;
  color: string;
  iconName: 'check' | 'clock' | 'x';
} {
  if (status === 'done') {
    return {
      bg: 'rgba(16, 185, 129, 0.14)',
      border: '#10b981',
      color: '#059669',
      iconName: 'check',
    };
  }
  if (status === 'partial') {
    return {
      bg: 'rgba(245, 158, 11, 0.16)',
      border: '#f59e0b',
      color: '#d97706',
      iconName: 'clock',
    };
  }
  return {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.35)',
    color: '#dc2626',
    iconName: 'x',
  };
}

export function buildMonthlyTeacherSummaries(
  teachers: any[],
  activeWeeks: { key: WeekKey; label: string; shortLabel: string }[],
  records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>,
  examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>
): TeacherMonthlySummary[] {
  return teachers.map((teacher) => {
    let totalTopics = 0;
    let topicWeeksDone = 0;
    let totalHomeworkCount = 0;
    let homeworkFullWeeks = 0;
    let homeworkPartialWeeks = 0;
    let totalVideoCount = 0;
    let videoFullWeeks = 0;
    let videoPartialWeeks = 0;
    let examActiveWeeks = 0;
    let examCompletedWeeks = 0;
    let examTotalStagesDone = 0;
    let examTotalStagesTarget = 0;
    let totalTaskCount = 0;
    let assignedTaskWeeks = 0;
    let completedTaskWeeks = 0;
    let permissionDays = 0;
    let absentDays = 0;
    let lateCount = 0;
    let lateMinutes = 0;
    let fullWeeksCompleted = 0;
    let totalEarnedPoints = 0;
    let totalPossiblePoints = 0;

    const perWeek: Record<WeekKey, { entry: TeacherWeekEntry; complete: boolean; status: WeekEvaluation }> =
      {} as any;

    for (const w of activeWeeks) {
      const e = normalizeEntry(records?.[teacher.id]?.[w.key]);
      const ev = evaluateWeekEntry(e, examSchedules?.[w.key], w.key);
      perWeek[w.key] = { entry: e, complete: ev.isComplete, status: ev };

      totalTopics += e.topicCount;
      if (e.topicDone && e.topicCount >= 1) topicWeeksDone += 1;

      totalHomeworkCount += e.homeworkCount;
      if (e.homeworkStatus === 'done') homeworkFullWeeks += 1;
      else if (e.homeworkStatus === 'partial') homeworkPartialWeeks += 1;

      totalVideoCount += e.videoCount;
      if (e.videoStatus === 'done') videoFullWeeks += 1;
      else if (e.videoStatus === 'partial') videoPartialWeeks += 1;

      if (ev.examActive) {
        examActiveWeeks += 1;
        examTotalStagesDone += ev.examStagesDone;
        examTotalStagesTarget += 3;
        if (ev.examStagesDone === 3) examCompletedWeeks += 1;
      }

      totalTaskCount += e.taskCount;
      if (ev.taskAssigned) {
        assignedTaskWeeks += 1;
        if (e.taskDone) completedTaskWeeks += 1;
      }

      permissionDays += e.permissionDays;
      absentDays += e.absentDays;
      lateCount += e.lateCount;
      lateMinutes += e.lateMinutes;

      if (ev.isComplete) fullWeeksCompleted += 1;
      totalEarnedPoints += ev.earnedPoints;
      totalPossiblePoints += ev.totalPoints;
    }

    const completionPct =
      totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0;

    return {
      teacher,
      perWeek,
      totalTopics,
      topicWeeksDone,
      totalHomeworkCount,
      homeworkFullWeeks,
      homeworkPartialWeeks,
      totalVideoCount,
      videoFullWeeks,
      videoPartialWeeks,
      examActiveWeeks,
      examCompletedWeeks,
      examTotalStagesDone,
      examTotalStagesTarget,
      totalTaskCount,
      assignedTaskWeeks,
      completedTaskWeeks,
      permissionDays,
      absentDays,
      totalAbsenceDays: permissionDays + absentDays,
      lateCount,
      lateMinutes,
      fullWeeksCompleted,
      weeksCount: activeWeeks.length,
      completionPct,
    };
  });
}

export function buildGroupChatSummaryText(params: {
  scope: ScreenshotScope;
  monthDisplayKh: string;
  weekLabels: Partial<Record<WeekKey, string>>;
  examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>;
  teachers: any[];
  records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  monthlySummaries: TeacherMonthlySummary[];
}): string {
  const { scope, monthDisplayKh, weekLabels, examSchedules, teachers, records, monthlySummaries } = params;
  const lines: string[] = [];

  if (scope === 'monthly') {
    lines.push(`របាយការណ៍បូកសរុបការងារគ្រូបង្រៀន — ${monthDisplayKh}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    monthlySummaries.forEach((s, idx) => {
      const badge = s.completionPct === 100 ? '[គ្រប់]' : s.completionPct >= 70 ? '[មធ្យម]' : '[ខ្វះ]';
      const absPart =
        s.totalAbsenceDays > 0
          ? `ច្បាប់:${s.permissionDays} | ឥតច្បាប់:${s.absentDays}`
          : 'អវត្តមាន:0';
      const latePart =
        s.lateCount > 0 || s.lateMinutes > 0
          ? `យឺត:${s.lateCount}ដង (${s.lateMinutes}ន)`
          : 'យឺត:0';
      const examPart =
        s.examActiveWeeks > 0
          ? ` | វិញ្ញាសា:${s.examTotalStagesDone}/${s.examTotalStagesTarget}`
          : '';
      const taskPart =
        s.assignedTaskWeeks > 0
          ? ` | Task:${s.totalTaskCount}(✓${s.completedTaskWeeks}/${s.assignedTaskWeeks})`
          : '';

      lines.push(
        `${idx + 1}. ${badge} ${s.teacher.fullName} (${s.completionPct}%)\n   • Topic:${s.totalTopics} | HW:${s.totalHomeworkCount}(${s.homeworkFullWeeks}✓/${s.homeworkPartialWeeks}◔) | វីដេអូ:${s.totalVideoCount}(${s.videoFullWeeks}✓/${s.videoPartialWeeks}◔)${examPart}${taskPart}\n   • ${absPart} | ${latePart}`
      );
    });
    return lines.join('\n');
  }

  const wMeta = WEEK_META.find((w) => w.key === scope)!;
  const dateTag = weekLabels[scope] ? ` (${weekLabels[scope]})` : '';
  const examCfg = examSchedules?.[scope];
  const scopeHasExam = isExamWeek(scope);

  lines.push(`របាយការណ៍តាមដានការងារគ្រូ — ${wMeta.label}${dateTag} • ${monthDisplayKh}`);
  if (scopeHasExam && hasExamConfigActive(examCfg)) {
    lines.push(
      `កាលវិភាគប្រឡង៖ ប្រមូល ${formatIsoDateKh(examCfg?.collectDate)} | ប្រឡង ${formatIsoDateKh(examCfg?.examDate)} | លទ្ធផល ${formatIsoDateKh(examCfg?.resultDate)}`
    );
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  teachers.forEach((t, idx) => {
    const e = normalizeEntry(records?.[t.id]?.[scope]);
    const ev = evaluateWeekEntry(e, examCfg, scope);
    const tStr = e.topicDone ? `✓(${e.topicCount})` : '✕';
    const hwIcon = e.homeworkStatus === 'done' ? '✓' : e.homeworkStatus === 'partial' ? '◔' : '✕';
    const hwStr = `${hwIcon}(${e.homeworkCount})`;
    const vIcon = e.videoStatus === 'done' ? '✓' : e.videoStatus === 'partial' ? '◔' : '✕';
    const vStr = `${vIcon}(${e.videoCount})`;
    const exStr = ev.examActive ? ` | វិញ្ញាសា:${ev.examStagesDone}/3` : '';
    const tkStr = ev.taskAssigned ? ` | Task:${e.taskCount}(${e.taskDone ? '✓' : '...'})` : '';
    const absStr =
      e.permissionDays > 0 || e.absentDays > 0
        ? `ច្បាប់:${e.permissionDays} ឥតច្បាប់:${e.absentDays}`
        : 'អវត្តមាន:0';
    const lateStr =
      e.lateCount > 0 || e.lateMinutes > 0 ? `យឺត:${e.lateCount}ដង(${e.lateMinutes}ន)` : 'យឺត:0';

    lines.push(
      `${idx + 1}. ${ev.isComplete ? '[គ្រប់]' : '[ខ្វះ]'} ${t.fullName} — Topic:${tStr} | HW:${hwStr} | វីដេអូ:${vStr}${exStr}${tkStr} | ${absStr} | ${lateStr}`
    );
  });

  return lines.join('\n');
}

export async function exportTrackingExcel(params: {
  monthKey: string;
  monthDisplayKh: string;
  activeWeeks: { key: WeekKey; label: string; shortLabel: string }[];
  weekLabels: Partial<Record<WeekKey, string>>;
  examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>;
  teachers: any[];
  records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  monthlySummaries: TeacherMonthlySummary[];
}) {
  const {
    monthKey,
    monthDisplayKh,
    activeWeeks,
    weekLabels,
    examSchedules,
    teachers,
    records,
    monthlySummaries,
  } = params;

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const summaryHeader = [
    'ល.រ',
    'អត្តលេខគ្រូ',
    'ឈ្មោះគ្រូបង្រៀន',
    'មុខវិជ្ជា',
    ...activeWeeks.map((w) => w.label),
    'សរុប Topic',
    'សប្តាហ៍ Topic គ្រប់',
    'ចំនួនកិច្ចការផ្ទះសរុប',
    'HW បានដាក់/តិចតួច',
    'ចំនួនវីដេអូសរុប',
    'វីដេអូ បានថត/តិចតួច',
    'វិញ្ញាសាប្រឡង (សប្តាហ៍ទី ៤)',
    'Task ពិសេស (ចំនួន / រួចរាល់)',
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
    `${s.topicWeeksDone}/${s.weeksCount}`,
    s.totalHomeworkCount,
    `${s.homeworkFullWeeks} ពេញ / ${s.homeworkPartialWeeks} តិចតួច`,
    s.totalVideoCount,
    `${s.videoFullWeeks} ពេញ / ${s.videoPartialWeeks} តិចតួច`,
    s.examActiveWeeks > 0 ? `${s.examTotalStagesDone}/${s.examTotalStagesTarget}` : 'គ្មានប្រឡង',
    s.assignedTaskWeeks > 0
      ? `${s.totalTaskCount} (${s.completedTaskWeeks}/${s.assignedTaskWeeks})`
      : 'គ្មាន',
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

  for (const w of activeWeeks) {
    const includeExam = isExamWeek(w.key);
    const examCfg = examSchedules?.[w.key];
    const examScheduleRow =
      includeExam && hasExamConfigActive(examCfg)
        ? [
            `កាលវិភាគវិញ្ញាសា៖ ប្រមូល ${formatIsoDateKh(examCfg?.collectDate)} | ថ្ងៃប្រឡង ${formatIsoDateKh(examCfg?.examDate)} | ចេញលទ្ធផល ${formatIsoDateKh(examCfg?.resultDate)}`,
          ]
        : [];

    const wHeader = [
      'ល.រ',
      'អត្តលេខគ្រូ',
      'ឈ្មោះគ្រូបង្រៀន',
      'មុខវិជ្ជា',
      'រៀន Topic',
      'ចំនួន Topic',
      'ចំណងជើង Topic',
      'ស្ថានភាពកិច្ចការផ្ទះ',
      'ចំនួនកិច្ចការផ្ទះ',
      'មតិ/ចំណាំ HW',
      'ស្ថានភាពថតវីដេអូ',
      'ចំនួនវីដេអូ',
      'Link វីដេអូ',
      'មតិ/ចំណាំវីដេអូ',
      ...(includeExam
        ? [
            'វិញ្ញាសា: ប្រគល់វិញ្ញាសា',
            'វិញ្ញាសា: បញ្ចូលពិន្ទុ',
            'វិញ្ញាសា: ចេញលទ្ធផលរួច',
            'ចំណាំវិញ្ញាសា',
          ]
        : []),
      'Task: ចំនួន',
      'Task: រៀបរាប់កិច្ចការ',
      'Task: ស្ថានភាព',
      'ច្បាប់ (ថ្ងៃ)',
      'ឥតច្បាប់ (ថ្ងៃ)',
      'មកយឺត (ដង)',
      'នាទីយឺត (នាទី)',
      'ចំណាំផ្សេងៗ',
      'ស្ថានភាពសប្តាហ៍',
    ];

    const wRows = teachers.map((t, idx) => {
      const e = normalizeEntry(records?.[t.id]?.[w.key]);
      const ev = evaluateWeekEntry(e, examCfg, w.key);
      return [
        idx + 1,
        t.teacherId || '',
        t.fullName || '',
        t.subject || '',
        e.topicDone ? 'បានរៀន' : 'មិនទាន់',
        e.topicCount,
        e.topicTitle,
        HOMEWORK_STATUS_LABELS[e.homeworkStatus],
        e.homeworkCount,
        e.homeworkNote,
        VIDEO_STATUS_LABELS[e.videoStatus],
        e.videoCount,
        e.videoUrl,
        e.videoNote,
        ...(includeExam
          ? [
              e.examStage1Submitted ? 'រួចរាល់' : 'មិនទាន់',
              e.examStage2Scored ? 'រួចរាល់' : 'មិនទាន់',
              e.examStage3Result ? 'រួចរាល់' : 'មិនទាន់',
              e.examNote,
            ]
          : []),
        e.taskCount,
        e.taskDescription,
        ev.taskAssigned ? (e.taskDone ? 'រួចរាល់' : 'កំពុងធ្វើ') : 'គ្មាន',
        e.permissionDays,
        e.absentDays,
        e.lateCount,
        e.lateMinutes,
        e.note,
        ev.isComplete ? 'គ្រប់លក្ខខណ្ឌ' : `ខ្វះ (${ev.missingLabels.join(', ')})`,
      ];
    });

    const sheetRows: any[][] = [
      [`${w.label}${weekLabels[w.key] ? ` (${weekLabels[w.key]})` : ''} — ${monthDisplayKh}`],
    ];
    if (examScheduleRow.length > 0) sheetRows.push(examScheduleRow);
    sheetRows.push([], wHeader, ...wRows);

    const wsWeek = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, wsWeek, w.label);
  }

  XLSX.writeFile(wb, `តាមដានការងារគ្រូ_${monthKey}.xlsx`);
}
