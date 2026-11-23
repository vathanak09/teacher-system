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

/**
 * Master student.fee stores shorthand values (e.g. 80 = 80,000 Riels).
 * Keeps master student record untouched while converting to Riels in payment views.
 */
export function feeToRiels(rawFee: any): number {
  const num = Number(rawFee || 0);
  if (!isFinite(num) || num <= 0) return 0;
  return num < 5000 ? Math.round(num * 1000) : Math.round(num);
}

/**
 * Legacy payment records stored shorthand numbers (e.g. 80, 240, 320),
 * whereas KHR-tagged records store exact Riels (e.g. 80000, 320000).
 */
export function normalizePaymentRiels(rawValue: any, paymentRecord?: any): number {
  const num = Number(rawValue || 0);
  if (!isFinite(num) || num <= 0) return 0;
  if (paymentRecord?.currency === 'KHR') return Math.round(num);
  return num < 5000 ? Math.round(num * 1000) : Math.round(num);
}

export function formatRiels(amountRiels: number, includeUnit = true): string {
  const rounded = Math.round(Number(amountRiels || 0));
  const formatted = rounded.toLocaleString('en-US');
  return includeUnit ? `${formatted} រៀល` : formatted;
}

export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    return !isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d ? dt : null;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    // Support M/D/YYYY when the middle segment exceeds 12 (e.g. "8/19/2026")
    const d = p2 > 12 && p1 <= 12 ? p2 : p1;
    const m = (p2 > 12 && p1 <= 12 ? p1 : p2) - 1;
    const dt = new Date(y, m, d);
    return !isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d ? dt : null;
  }

  const fallback = new Date(trimmed);
  if (isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDMYSlash(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatKhmerDayMonth(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  return `${d.getDate()}${KHMER_MONTHS[d.getMonth()]}`;
}

export function formatKhmerFullDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  return `ថ្ងៃទី${d.getDate()} ខែ${KHMER_MONTHS[d.getMonth()]} ឆ្នាំ${d.getFullYear()}`;
}

export function formatKhmerValidityPeriod(
  fromStr: string | null | undefined,
  toStr: string | null | undefined
): string {
  const fromFormatted = formatKhmerDayMonth(fromStr);
  const toFormatted = formatKhmerDayMonth(toStr);
  if (fromFormatted && toFormatted) return `${fromFormatted}-${toFormatted}`;
  return fromFormatted || toFormatted || '';
}

export function addMonthsWithAnniversary(
  baseDateStr: string,
  monthsToAdd: number,
  enrollDateStr?: string | null
): string {
  const base = parseLocalDate(baseDateStr);
  if (!base) return '';
  const enroll = parseLocalDate(enrollDateStr);
  const lastDayOfBaseMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const isBaseClampedMonthEnd =
    enroll !== null &&
    base.getDate() === lastDayOfBaseMonth &&
    enroll.getDate() > base.getDate();
  const targetDay = isBaseClampedMonthEnd ? enroll.getDate() : base.getDate();

  const totalMonths = base.getFullYear() * 12 + base.getMonth() + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(targetDay, lastDayOfTargetMonth);

  return toISODateString(new Date(targetYear, targetMonth, clampedDay));
}

export function countElapsedBillingMonths(
  dueDate: Date,
  today: Date,
  enrollDate?: Date | null
): number {
  if (today.getTime() < dueDate.getTime()) return 0;
  let months = 1;
  const baseStr = toISODateString(dueDate);
  const enrollStr = enrollDate ? toISODateString(enrollDate) : baseStr;

  while (months < 120) {
    const nextCycleStr = addMonthsWithAnniversary(baseStr, months, enrollStr);
    const nextCycleDate = parseLocalDate(nextCycleStr);
    if (!nextCycleDate || nextCycleDate.getTime() > today.getTime()) break;
    months++;
  }
  return months;
}

export interface StudentBillingInfo {
  student: any;
  classCode: string;
  teacherName: string;
  roomAndTeacher: string;
  monthlyFee: number;
  enrollDateStr: string;
  dueDateStr: string;
  diffDays: number; // today - dueDate (positive = overdue, 0 = due today, negative = days remaining)
  statusKey: 'paid' | 'due' | 'overdue' | 'no_date';
  statusLabel: string;
  overdueDays: number;
  daysRemaining: number;
  monthsDue: number;
  amountDue: number;
  lastPayment: any | null;
  studentPayments: any[];
}

export function getStudentClassInfo(student: any, classesData: any[]): {
  classCode: string;
  teacherName: string;
  roomAndTeacher: string;
} {
  const sClasses = (classesData || []).filter(
    (c: any) => Array.isArray(c.studentIds) && c.studentIds.includes(student.id)
  );
  if (sClasses.length > 0) {
    const classCode = sClasses.map((c: any) => c.classCode || c.className).filter(Boolean).join(', ');
    const teacherName = sClasses.map((c: any) => c.teacherName).filter(Boolean).join(', ');
    const roomAndTeacher =
      classCode && teacherName ? `${classCode} (${teacherName})` : classCode || teacherName || '';
    return { classCode, teacherName, roomAndTeacher };
  }

  const matched = student.className
    ? (classesData || []).find((c: any) => (c.classCode || c.className) === student.className)
    : null;
  const classCode = matched ? matched.classCode || matched.className || '' : student.className || '';
  const teacherName = matched ? matched.teacherName || '' : student.teacherName || '';
  const roomAndTeacher =
    classCode && teacherName ? `${classCode} (${teacherName})` : classCode || teacherName || '';
  return { classCode, teacherName, roomAndTeacher };
}

export function computeStudentBillingInfo(
  student: any,
  payments: any[],
  classesData: any[],
  referenceToday?: Date
): StudentBillingInfo {
  const todayBase = referenceToday || new Date();
  const today = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate());

  const { classCode, teacherName, roomAndTeacher } = getStudentClassInfo(student, classesData);
  const monthlyFee = feeToRiels(student.fee);

  const studentPayments = (payments || [])
    .filter((p: any) => p.studentDocId === student.id || p.studentId === student.id)
    .sort((a: any, b: any) => {
      const da = parseLocalDate(a.paymentDate)?.getTime() || 0;
      const db = parseLocalDate(b.paymentDate)?.getTime() || 0;
      if (db !== da) return db - da;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  const lastPayment = studentPayments.length > 0 ? studentPayments[0] : null;
  const enrollDateObj = parseLocalDate(student.enrollDate);
  const enrollDateStr = enrollDateObj ? toISODateString(enrollDateObj) : '';
  const billingStartObj = parseLocalDate(student.billingStartDate);
  const baselineAnchorObj = billingStartObj || enrollDateObj;

  const dueDateObj =
    parseLocalDate(student.nextPaymentDate) ||
    parseLocalDate(lastPayment?.validUntil) ||
    baselineAnchorObj;
  const dueDateStr = dueDateObj ? toISODateString(dueDateObj) : '';

  if (!dueDateObj) {
    return {
      student,
      classCode,
      teacherName,
      roomAndTeacher,
      monthlyFee,
      enrollDateStr,
      dueDateStr: '',
      diffDays: 0,
      statusKey: 'no_date',
      statusLabel: 'មិនទាន់មានថ្ងៃកំណត់',
      overdueDays: 0,
      daysRemaining: 0,
      monthsDue: 0,
      amountDue: 0,
      lastPayment,
      studentPayments,
    };
  }

  const diffDays = Math.round((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    const monthsDue = countElapsedBillingMonths(dueDateObj, today, baselineAnchorObj);
    return {
      student,
      classCode,
      teacherName,
      roomAndTeacher,
      monthlyFee,
      enrollDateStr,
      dueDateStr,
      diffDays,
      statusKey: 'overdue',
      statusLabel: `លើស ${diffDays} ថ្ងៃ`,
      overdueDays: diffDays,
      daysRemaining: 0,
      monthsDue,
      amountDue: monthsDue * monthlyFee,
      lastPayment,
      studentPayments,
    };
  }

  if (diffDays === 0) {
    return {
      student,
      classCode,
      teacherName,
      roomAndTeacher,
      monthlyFee,
      enrollDateStr,
      dueDateStr,
      diffDays: 0,
      statusKey: 'due',
      statusLabel: 'ដល់ថ្ងៃបង់ប្រាក់',
      overdueDays: 0,
      daysRemaining: 0,
      monthsDue: 1,
      amountDue: monthlyFee,
      lastPayment,
      studentPayments,
    };
  }

  const daysRemaining = Math.abs(diffDays);
  return {
    student,
    classCode,
    teacherName,
    roomAndTeacher,
    monthlyFee,
    enrollDateStr,
    dueDateStr,
    diffDays,
    statusKey: 'paid',
    statusLabel: daysRemaining <= 5 ? `ជិតដល់ថ្ងៃ (សល់ ${daysRemaining} ថ្ងៃ)` : 'បានបង់រួច',
    overdueDays: 0,
    daysRemaining,
    monthsDue: 0,
    amountDue: 0,
    lastPayment,
    studentPayments,
  };
}

export const DEFAULT_RECEIPT_HEADER_DRIVE_URL =
  'https://drive.google.com/file/d/1ua9ZtPExXLinQMzRRuxpRCfM4HmgUhD0/view?usp=drive_link';
export const DEFAULT_RECEIPT_PHONE = '077 30 85 40 /011 59 59 71';
export const DEFAULT_RECEIPT_ADDRESS =
  'ផ្លូវជាតិលេខ២១ ស្ពានលេខ៧០ ភូមិកំពង់ថ្កុល\nសង្កាត់សំពៅពូន ក្រុងសំពៅពូន ខេត្តកណ្តាល';
export const DEFAULT_RECEIPT_CASHIER = 'សំរិត វឌ្ឍនៈ';

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerDigits(input: string | number): string {
  return String(input ?? '').replace(/\d/g, (d) => KHMER_DIGITS[Number(d)] || d);
}

export function formatDMYDash(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatKhmerValidityPeriodSpaced(
  fromStr: string | null | undefined,
  toStr: string | null | undefined
): string {
  const fromFormatted = formatKhmerDayMonth(fromStr);
  const toFormatted = formatKhmerDayMonth(toStr);
  if (fromFormatted && toFormatted) return `${fromFormatted} - ${toFormatted}`;
  return fromFormatted || toFormatted || '';
}

/** Matches receipt box style: "11-វិច្ឆិកា -២០២៦" */
export function formatKhmerNextPaymentDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthKh = KHMER_MONTHS[d.getMonth()] || '';
  const yearKh = toKhmerDigits(d.getFullYear());
  return `${day}-${monthKh} -${yearKh}`;
}

export function formatReceiptNo6Digit(rawReceiptNo?: string | null): string {
  const trimmed = String(rawReceiptNo || '').trim();
  if (!trimmed) return '000001';
  const match = trimmed.match(/(\d+)$/);
  if (match) {
    return match[1].padStart(6, '0');
  }
  return trimmed;
}

export function formatShortGenderKh(gender?: string | null): string {
  const g = String(gender || '').trim().toLowerCase();
  if (!g) return '';
  if (g === 'ស្រី' || g === 'f' || g === 'female' || g === 'ស') return 'ស';
  if (g === 'ប្រុស' || g === 'm' || g === 'male' || g === 'ប') return 'ប';
  return String(gender || '').trim().slice(0, 2);
}

export function formatShiftTwoLinesKh(shift?: string | null): [string, string] {
  const s = String(shift || '').trim().toUpperCase();
  if (!s) return ['', ''];
  if (s === 'FM' || s === 'FA' || s === 'F' || s.includes('FULL') || s.includes('ពេញ')) {
    return ['ពេញ', 'ម៉ោង'];
  }
  if (s === 'E' || s === 'P' || s === 'PT' || s.includes('PART') || s.includes('ក្រៅ')) {
    return ['ក្រៅ', 'ម៉ោង'];
  }
  return [String(shift || '').trim(), ''];
}

export function extractEnrollDay(enrollDateStr?: string | null): string {
  const dt = parseLocalDate(enrollDateStr);
  if (!dt) return '';
  return String(dt.getDate());
}

const LEVEL_TO_COURSE_MAP: Record<string, string> = {
  K0: 'Smart English Alphabet',
  K1: 'Smart English 1',
  K2: 'Smart English 2',
  K2A: 'Smart English 2',
  L1: 'Family & Friends 01',
  L1A: 'Family & Friends 01',
  L2: 'Family & Friends 2',
  L3: 'Team Together 03',
  SPK: 'Everyone Speak Kids',
  SPK1: 'Everyone Speak Kids',
  BEG: 'New Headway Beginner',
  'PRE-INT': 'Thought & Notion',
  'ខ្មែរ': 'ភាសាខ្មែរ',
};

export function resolveStudentCourseName(student: any, classesData: any[]): string {
  const rawLevel = String(student?.level || '').trim();
  const levelKey = rawLevel.toUpperCase();
  if (LEVEL_TO_COURSE_MAP[levelKey]) return LEVEL_TO_COURSE_MAP[levelKey];
  if (LEVEL_TO_COURSE_MAP[rawLevel]) return LEVEL_TO_COURSE_MAP[rawLevel];

  const sClasses = (classesData || []).filter(
    (c: any) => Array.isArray(c.studentIds) && c.studentIds.includes(student?.id)
  );
  for (const cls of sClasses) {
    if (Array.isArray(cls.books)) {
      const firstBook = cls.books.map((b: any) => String(b?.title || b?.name || '').trim()).find(Boolean);
      if (firstBook) return firstBook;
    }
    if (cls.className) return String(cls.className).trim();
  }
  return rawLevel || '';
}

const KNOWN_TEACHER_SHORT_CODES: Record<string, string> = {
  'DOU DANIN': 'NIN',
  'DOU DANET': 'NET',
  'CHOUY SREYNAT': 'NAT',
  'NENG SREYMOM': 'MOM',
  'NENG RATHA': 'THA',
  'NAN SIEV.I': 'SIEV.I',
  'SAMRITH VATHANAK': 'NAK',
};

export function resolveTeacherShortCode(
  teacherName?: string | null,
  teachersData?: any[],
  fallbackClassCode?: string | null
): string {
  const cleanName = String(teacherName || '').trim();
  if (cleanName && Array.isArray(teachersData) && teachersData.length > 0) {
    const firstTeacherName = cleanName.split(',')[0].trim();
    const matched = teachersData.find(
      (t: any) => String(t?.fullName || '').trim() === firstTeacherName
    );
    if (matched) {
      if (matched.nickname && String(matched.nickname).trim()) {
        return String(matched.nickname).trim().toUpperCase();
      }
      const eng = String(matched.englishName || '').trim().toUpperCase();
      if (eng) {
        if (KNOWN_TEACHER_SHORT_CODES[eng]) return KNOWN_TEACHER_SHORT_CODES[eng];
        const parts = eng.split(/\s+/).filter(Boolean);
        const lastWord = parts[parts.length - 1] || eng;
        return lastWord.length > 6 ? lastWord.slice(-3) : lastWord;
      }
    }
  }
  if (fallbackClassCode) return String(fallbackClassCode).split(',')[0].trim();
  return cleanName.split(/\s+/).pop() || '';
}

export function resolveReceiptBannerSrc(configuredUrl?: string | null): string {
  const raw = String(configuredUrl || '').trim();
  if (!raw || raw.includes('1ua9ZtPExXLinQMzRRuxpRCfM4HmgUhD0')) {
    return '/bsis_receipt_banner.png';
  }
  if (raw.startsWith('/')) return raw;
  return `/api/proxy-image?url=${encodeURIComponent(raw)}`;
}
