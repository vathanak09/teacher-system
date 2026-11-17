import * as XLSX from 'xlsx';
import type { AppIconName } from '@/components/AppIcons';

export type ShiftType = 'morning' | 'afternoon' | 'evening_parttime';
export type WeekDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
export type RowCategory = 'arrival' | 'lesson' | 'break' | 'dismissal';

export interface ScheduleTimeRow {
  id: string;
  timeLabel: string;
  slotLabel: string;
  category: RowCategory;
  subtitle?: string;
}

export interface ScheduleCellContent {
  subject: string;
  teacherNote?: string;
  color?: string;
}

export interface ScheduleRecord {
  id: string;
  title: string;
  shiftType: ShiftType;
  description: string;
  assignedClassIds: string[];
  rows: ScheduleTimeRow[];
  cells: Record<string, Partial<Record<WeekDayKey, ScheduleCellContent>>>;
  createdById: string;
  createdByName: string;
  createdByRole: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const WEEK_DAYS: {
  key: WeekDayKey;
  label: string;
  shortLabel: string;
  jsDay: number;
}[] = [
  { key: 'mon', label: 'ថ្ងៃច័ន្ទ', shortLabel: 'ច័ន្ទ', jsDay: 1 },
  { key: 'tue', label: 'ថ្ងៃអង្គារ', shortLabel: 'អង្គារ', jsDay: 2 },
  { key: 'wed', label: 'ថ្ងៃពុធ', shortLabel: 'ពុធ', jsDay: 3 },
  { key: 'thu', label: 'ថ្ងៃព្រហស្បតិ៍', shortLabel: 'ព្រហ.', jsDay: 4 },
  { key: 'fri', label: 'ថ្ងៃសុក្រ', shortLabel: 'សុក្រ', jsDay: 5 },
];

export const SHIFT_ORDER: ShiftType[] = ['morning', 'afternoon', 'evening_parttime'];

export interface ShiftPresetMeta {
  key: ShiftType;
  label: string;
  shortLabel: string;
  modeTag: string;
  timeSpan: string;
  color: string;
  bg: string;
  border: string;
  iconName: AppIconName;
  defaultTitle: string;
  defaultDescription: string;
  defaultRows: ScheduleTimeRow[];
}

export const SHIFT_PRESETS: Record<ShiftType, ShiftPresetMeta> = {
  morning: {
    key: 'morning',
    label: 'វេនព្រឹក (ពេញម៉ោង)',
    shortLabel: 'វេនព្រឹក',
    modeTag: 'ពេញម៉ោង',
    timeSpan: '7:00 – 10:00',
    color: '#0284c7',
    bg: 'rgba(14, 165, 233, 0.12)',
    border: 'rgba(14, 165, 233, 0.35)',
    iconName: 'sun',
    defaultTitle: 'កាលវិភាគវេនព្រឹក (7:00 – 10:00)',
    defaultDescription: 'គ្រូមកដល់ម៉ោង 7:00 • មេរៀន 7:30–8:30 • ចេញលេង 8:30–8:50 • មេរៀន 8:50–9:50 • ចេញផ្ទះ/ប្រជុំជួរ 9:50–10:00',
    defaultRows: [
      {
        id: 'm_arrival',
        timeLabel: '7:00 - 7:30',
        slotLabel: 'គ្រូមកដល់ & ចូលថ្នាក់រៀន',
        category: 'arrival',
        subtitle: 'គ្រូមកដល់ម៉ោង 7:00 និងរៀបចំចូលថ្នាក់',
      },
      {
        id: 'm_lesson1',
        timeLabel: '7:30 - 8:30',
        slotLabel: 'មេរៀនទី ១',
        category: 'lesson',
        subtitle: 'ចាប់ផ្តើមមេរៀនដំបូង (១ ម៉ោង)',
      },
      {
        id: 'm_break',
        timeLabel: '8:30 - 8:50',
        slotLabel: 'ចេញលេង (Break)',
        category: 'break',
        subtitle: 'សម្រាក ២០ នាទី',
      },
      {
        id: 'm_lesson2',
        timeLabel: '8:50 - 9:50',
        slotLabel: 'ចូលរៀនវិញ / មេរៀនទី ២',
        category: 'lesson',
        subtitle: 'បន្តមេរៀនទី ២ (១ ម៉ោង)',
      },
      {
        id: 'm_dismissal',
        timeLabel: '9:50 - 10:00',
        slotLabel: 'ចេញទៅផ្ទះ / ប្រជុំជួរ',
        category: 'dismissal',
        subtitle: 'ចេញម៉ោង 9:50 (ដល់ 10:00 បើត្រូវប្រជុំជួរ)',
      },
    ],
  },
  afternoon: {
    key: 'afternoon',
    label: 'វេនរសៀល (ពេញម៉ោង)',
    shortLabel: 'វេនរសៀល',
    modeTag: 'ពេញម៉ោង',
    timeSpan: '1:00 – 4:00',
    color: '#d97706',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    iconName: 'sunset',
    defaultTitle: 'កាលវិភាគវេនរសៀល (1:00 – 4:00)',
    defaultDescription: 'គ្រូមកដល់ម៉ោង 1:00 • មេរៀន 1:30–2:30 • ចេញលេង 2:30–2:50 • មេរៀន 2:50–3:50 • ចេញផ្ទះ/ប្រជុំជួរ 3:50–4:00',
    defaultRows: [
      {
        id: 'a_arrival',
        timeLabel: '1:00 - 1:30',
        slotLabel: 'គ្រូមកដល់ & ចូលថ្នាក់រៀន',
        category: 'arrival',
        subtitle: 'គ្រូមកដល់ម៉ោង 1:00 និងរៀបចំចូលថ្នាក់',
      },
      {
        id: 'a_lesson1',
        timeLabel: '1:30 - 2:30',
        slotLabel: 'មេរៀនទី ១',
        category: 'lesson',
        subtitle: 'ចាប់ផ្តើមមេរៀនទី ១ (១ ម៉ោង)',
      },
      {
        id: 'a_break',
        timeLabel: '2:30 - 2:50',
        slotLabel: 'ចេញលេង (Break)',
        category: 'break',
        subtitle: 'សម្រាក ២០ នាទី',
      },
      {
        id: 'a_lesson2',
        timeLabel: '2:50 - 3:50',
        slotLabel: 'ចូលរៀនវិញ / មេរៀនទី ២',
        category: 'lesson',
        subtitle: 'បន្តមេរៀនទី ២ (១ ម៉ោង)',
      },
      {
        id: 'a_dismissal',
        timeLabel: '3:50 - 4:00',
        slotLabel: 'ចេញទៅផ្ទះ / ប្រជុំជួរ',
        category: 'dismissal',
        subtitle: 'ចេញម៉ោង 3:50 (ដល់ 4:00 បើត្រូវប្រជុំជួរ)',
      },
    ],
  },
  evening_parttime: {
    key: 'evening_parttime',
    label: 'វេនល្ងាច / Part-time (ក្រៅម៉ោង)',
    shortLabel: 'វេនល្ងាច / Part-time',
    modeTag: 'ក្រៅម៉ោង / Part-time',
    timeSpan: '5:00 – 6:20',
    color: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.35)',
    iconName: 'moon',
    defaultTitle: 'កាលវិភាគវេនល្ងាច / Part-time (5:00 – 6:20)',
    defaultDescription: 'គ្រូមកដល់ម៉ោង 5:00 • ចូលរៀនប្រហែល 5:20 • ចេញទៅផ្ទះម៉ោង 6:20',
    defaultRows: [
      {
        id: 'e_arrival',
        timeLabel: '5:00 - 5:20',
        slotLabel: 'គ្រូមកដល់ & ចូលថ្នាក់រៀន',
        category: 'arrival',
        subtitle: 'គ្រូមកដល់ម៉ោង 5:00 (រៀបចំប្រហែល ២០ នាទី)',
      },
      {
        id: 'e_lesson1',
        timeLabel: '5:20 - 6:20',
        slotLabel: 'ចូលរៀន / មេរៀន',
        category: 'lesson',
        subtitle: 'សិក្សា ១ ម៉ោង (5:20 – 6:20)',
      },
      {
        id: 'e_dismissal',
        timeLabel: '6:20',
        slotLabel: 'ចេញទៅផ្ទះ',
        category: 'dismissal',
        subtitle: 'បញ្ចប់ម៉ោងសិក្សា ចេញទៅផ្ទះម៉ោង 6:20',
      },
    ],
  },
};

export const ROW_CATEGORY_META: Record<
  RowCategory,
  { label: string; color: string; bg: string; iconName: AppIconName }
> = {
  arrival: {
    label: 'មកដល់ / ចូលថ្នាក់',
    color: '#0284c7',
    bg: 'rgba(14, 165, 233, 0.1)',
    iconName: 'clock',
  },
  lesson: {
    label: 'ម៉ោងសិក្សា',
    color: '#4f46e5',
    bg: 'rgba(99, 102, 241, 0.1)',
    iconName: 'book-open',
  },
  break: {
    label: 'ចេញលេង (Break)',
    color: '#d97706',
    bg: 'rgba(245, 158, 11, 0.12)',
    iconName: 'coffee',
  },
  dismissal: {
    label: 'ចេញទៅផ្ទះ / ប្រជុំជួរ',
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.1)',
    iconName: 'flag',
  },
};

export const CELL_COLOR_OPTIONS: {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { id: 'blue', label: 'ខៀវ', color: '#1d4ed8', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)' },
  { id: 'indigo', label: 'ស្វាយខៀវ', color: '#4338ca', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.35)' },
  { id: 'emerald', label: 'បៃតង', color: '#047857', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  { id: 'amber', label: 'ទឹកក្រូច', color: '#b45309', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.38)' },
  { id: 'rose', label: 'ផ្កាឈូកក្រហម', color: '#be123c', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)' },
  { id: 'violet', label: 'ស្វាយ', color: '#6d28d9', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)' },
  { id: 'slate', label: 'ប្រផេះ', color: '#334155', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.35)' },
];

export const SUBJECT_SUGGESTIONS: string[] = [
  'Phonics & Pronunciation',
  'Vocabulary & Spelling',
  'Grammar & Structure',
  'Reading & Comprehension',
  'Listening & Speaking',
  'Writing & Sentence Building',
  'Conversation & Roleplay',
  'Homework Review & Dictation',
  'Monthly Quiz / Review',
  'ប្រជុំជួរទង់ជាតិ / Warm-up',
];

export function getCellColorStyle(colorId?: string) {
  return CELL_COLOR_OPTIONS.find((c) => c.id === colorId) || CELL_COLOR_OPTIONS[0];
}

export function clonePresetRows(shiftType: ShiftType): ScheduleTimeRow[] {
  const preset = SHIFT_PRESETS[shiftType] || SHIFT_PRESETS.morning;
  return preset.defaultRows.map((row) => ({ ...row }));
}

export function normalizeScheduleRecord(raw: any): ScheduleRecord {
  const shiftType: ShiftType =
    raw?.shiftType === 'afternoon' || raw?.shiftType === 'evening_parttime'
      ? raw.shiftType
      : 'morning';

  const rawClassIds: unknown[] = Array.isArray(raw?.assignedClassIds)
    ? raw.assignedClassIds
    : raw?.assignedClassIds && typeof raw.assignedClassIds === 'object'
      ? Object.values(raw.assignedClassIds)
      : [];

  const assignedClassIds: string[] = Array.from(
    new Set<string>(
      rawClassIds.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
    )
  );

  const rawRows = Array.isArray(raw?.rows)
    ? raw.rows
    : raw?.rows && typeof raw.rows === 'object'
      ? Object.values(raw.rows)
      : [];

  const rows: ScheduleTimeRow[] =
    rawRows.length > 0
      ? rawRows
          .filter((r: any) => r && (r.timeLabel || r.slotLabel))
          .map((r: any, idx: number) => ({
            id: String(r.id || `row_${idx + 1}`),
            timeLabel: String(r.timeLabel || ''),
            slotLabel: String(r.slotLabel || ''),
            category:
              r.category === 'arrival' ||
              r.category === 'break' ||
              r.category === 'dismissal'
                ? r.category
                : 'lesson',
            subtitle: String(r.subtitle || ''),
          }))
      : clonePresetRows(shiftType);

  const cells: Record<string, Partial<Record<WeekDayKey, ScheduleCellContent>>> = {};
  if (raw?.cells && typeof raw.cells === 'object') {
    for (const [rowId, dayMap] of Object.entries(raw.cells)) {
      if (!dayMap || typeof dayMap !== 'object') continue;
      const normalizedDays: Partial<Record<WeekDayKey, ScheduleCellContent>> = {};
      for (const day of WEEK_DAYS) {
        const cell = (dayMap as any)[day.key];
        if (cell && typeof cell === 'object' && (cell.subject || cell.teacherNote)) {
          normalizedDays[day.key] = {
            subject: String(cell.subject || ''),
            teacherNote: String(cell.teacherNote || ''),
            color: String(cell.color || 'blue'),
          };
        }
      }
      if (Object.keys(normalizedDays).length > 0) {
        cells[rowId] = normalizedDays;
      }
    }
  }

  return {
    id: String(raw?.id || ''),
    title: String(raw?.title || SHIFT_PRESETS[shiftType].defaultTitle),
    shiftType,
    description: String(raw?.description || ''),
    assignedClassIds,
    rows,
    cells,
    createdById: String(raw?.createdById || ''),
    createdByName: String(raw?.createdByName || ''),
    createdByRole: String(raw?.createdByRole || 'admin'),
    updatedByName: String(raw?.updatedByName || ''),
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
}

export function inferShiftTypeFromClass(cls: any): ShiftType {
  const txt = `${cls?.shift || ''} ${cls?.time || ''}`.toLowerCase();
  if (
    txt.includes('ល្ងាច') ||
    txt.includes('part') ||
    txt.includes('ក្រៅម៉ោង') ||
    txt.includes('evening') ||
    txt.includes('5:') ||
    txt.includes('17:')
  ) {
    return 'evening_parttime';
  }
  if (
    txt.includes('រសៀល') ||
    txt.includes('afternoon') ||
    txt.includes('1:') ||
    txt.includes('13:') ||
    txt.includes('2:')
  ) {
    return 'afternoon';
  }
  return 'morning';
}

export function doesStudentBelongToClass(student: any, cls: any): boolean {
  if (!student || !cls) return false;
  if (Array.isArray(cls.studentIds) && cls.studentIds.includes(student.id)) return true;
  if (
    Array.isArray(cls.studentsData) &&
    cls.studentsData.some((s: any) => s?.id === student.id || (student.studentId && s?.studentId === student.studentId))
  ) {
    return true;
  }
  if (
    student.className &&
    (student.className === cls.className || student.className === cls.classCode)
  ) {
    return true;
  }
  return false;
}

export function exportScheduleExcel(
  schedule: ScheduleRecord,
  classMap: Map<string, any>
) {
  const shiftMeta = SHIFT_PRESETS[schedule.shiftType];
  const assignedNames = schedule.assignedClassIds
    .map((cid) => {
      const cls = classMap.get(cid);
      if (!cls) return cid;
      return cls.classCode && cls.className && cls.classCode !== cls.className
        ? `${cls.classCode} (${cls.className})`
        : cls.className || cls.classCode || cid;
    })
    .join(', ');

  const sheetRows: any[][] = [
    [schedule.title],
    [`វេនសិក្សា៖ ${shiftMeta.label} (${shiftMeta.timeSpan})`, `ថ្នាក់រៀន៖ ${assignedNames || 'មិនទាន់ Assign'}`],
    [],
    ['ម៉ោងសិក្សា', 'សកម្មភាព / មុខវិជ្ជា', ...WEEK_DAYS.map((d) => d.label)],
  ];

  schedule.rows.forEach((row) => {
    const dayCells = WEEK_DAYS.map((d) => {
      const cell = schedule.cells?.[row.id]?.[d.key];
      if (!cell || (!cell.subject && !cell.teacherNote)) {
        if (row.category === 'break') return 'ចេញលេង / សម្រាក';
        if (row.category === 'arrival') return 'គ្រូមកដល់ / ចូលថ្នាក់';
        if (row.category === 'dismissal') return 'ចេញទៅផ្ទះ / ប្រជុំជួរ';
        return '';
      }
      return cell.teacherNote ? `${cell.subject}\n(${cell.teacherNote})` : cell.subject;
    });
    sheetRows.push([row.timeLabel, row.slotLabel, ...dayCells]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  const safeName = (schedule.title || 'schedule').replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}
