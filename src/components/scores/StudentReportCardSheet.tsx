"use client";

import React from 'react';
import { ENGLISH_MONTH_NAMES, KHMER_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import {
  DEFAULT_SCHOOL_PROFILE,
  SchoolProfileInfo,
} from '@/components/settings/SchoolInfoSettingsPanel';
import ReceiptSignature from '@/components/receipts/ReceiptSignature';
import {
  MonthlyResultClassPacket,
  OfficialSchoolStamp,
  computeMonthlyResultPacketsForClass,
  resolveSheetAssetSrc,
} from './MonthlyResultSheet';

const KHMER_TO_ARABIC_MAP: Record<string, string> = {
  '០': '0',
  '១': '1',
  '២': '2',
  '៣': '3',
  '៤': '4',
  '៥': '5',
  '៦': '6',
  '៧': '7',
  '៨': '8',
  '៩': '9',
};

export function toArabicDigits(input: string | number): string {
  return String(input ?? '').replace(/[០-៩]/g, (ch) => KHMER_TO_ARABIC_MAP[ch] ?? ch);
}
import {
  ActiveScoreSubjectColumn,
  EvaluationGradeValue,
  LOCKED_SUBJECT_KEY_SET,
  TRAIT_EVALUATION_COLUMNS,
  getActiveSubjectColumns,
  getColumnEvalValue,
  getColumnNumericValue,
  normalizeEvaluationValue,
  resolveClassColumnsConfig,
} from './scoreColumns';

export type ReportCardPaperMode = 'a4_landscape_2up' | 'a5_portrait_single';
export type ReportCardSortMode = 'rank_asc' | 'name_asc' | 'student_id' | 'level_name';

export const REPORT_CARD_A4_LANDSCAPE_SPEC = {
  sheetW: '296.6mm',
  sheetH: '209.6mm',
  sheetWPx: 1121,
  sheetHPx: 792,
  pageCss: '@page { size: A4 landscape; margin: 0; }',
};

export const REPORT_CARD_A5_PORTRAIT_SPEC = {
  sheetW: '148.3mm',
  sheetH: '209.6mm',
  sheetWPx: 560.5,
  sheetHPx: 792,
  pageCss: '@page { size: A5 portrait; margin: 0; }',
};

export interface ReportCardPastelTheme {
  id: string;
  shortNameKh: string;
  nameKh: string;
  descriptionKh: string;
  swatch: [string, string];
  accentBar: string;
  accentDark: string;
  accentMuted: string;
  cardBorder: string;
  softBorder: string;
  softTintBg: string;
  titleBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableBorder: string;
  signatoryColor: string;
}

export const REPORT_CARD_PASTEL_THEMES: ReportCardPastelTheme[] = [
  {
    id: 'sage_classic',
    shortNameKh: 'បៃតងស្លឹកខ្ចី',
    nameKh: 'បៃតងស្លឹកខ្ចីផ្លូវការ (Classic Sage)',
    descriptionKh: 'ក្បាលតារាងបៃតងស្រាលផ្លូវការដូចគំរូ សាមញ្ញ ស្រឡះភ្នែក',
    swatch: ['#4d7c52', '#d7e8d2'],
    accentBar: '#4d7c52',
    accentDark: '#1f4a27',
    accentMuted: '#3f6a46',
    cardBorder: '#c5d6c1',
    softBorder: '#c8d9c4',
    softTintBg: '#f6faf5',
    titleBg: '#eaf3e7',
    tableHeaderBg: '#d4e6cf',
    tableHeaderText: '#1b4322',
    tableBorder: '#6e8c6a',
    signatoryColor: '#1f4a27',
  },
  {
    id: 'navy_formal',
    shortNameKh: 'ខៀវរាជការ',
    nameKh: 'ខៀវរាជការផ្លូវការ (Formal Navy)',
    descriptionKh: 'ខៀវស្រាលផ្លូវការ សក្ដិសមសម្រាប់ឯកសារសិក្សាសាលារៀន',
    swatch: ['#2c5282', '#dce7f5'],
    accentBar: '#2c5282',
    accentDark: '#1c3b63',
    accentMuted: '#3b6496',
    cardBorder: '#c4d4e8',
    softBorder: '#c9d8eb',
    softTintBg: '#f6f9fd',
    titleBg: '#eaf1fa',
    tableHeaderBg: '#d9e6f5',
    tableHeaderText: '#1a365d',
    tableBorder: '#6a84a3',
    signatoryColor: '#1d4ed8',
  },
  {
    id: 'sky_soft',
    shortNameKh: 'ខៀវមេឃស្រាល',
    nameKh: 'ខៀវផ្ទៃមេឃស្រាល (Soft Sky)',
    descriptionKh: 'ពណ៌ខៀវមេឃទន់ភ្លន់ ស្អាត និងទំនើប',
    swatch: ['#0369a1', '#dbeeff'],
    accentBar: '#0369a1',
    accentDark: '#0c4a6e',
    accentMuted: '#0284c7',
    cardBorder: '#c0dff3',
    softBorder: '#c5e2f5',
    softTintBg: '#f5fafe',
    titleBg: '#e8f4fc',
    tableHeaderBg: '#d6ecfb',
    tableHeaderText: '#0c4a6e',
    tableBorder: '#6b9ab8',
    signatoryColor: '#0369a1',
  },
  {
    id: 'teal_calm',
    shortNameKh: 'បៃតងខៀវ',
    nameKh: 'បៃតងខៀវស្រាល (Calm Teal)',
    descriptionKh: 'បៃតងលាយខៀវស្រាល ត្រជាក់ភ្នែក មានសណ្ដាប់ធ្នាប់',
    swatch: ['#0f766e', '#d6f0ed'],
    accentBar: '#0f766e',
    accentDark: '#134e4a',
    accentMuted: '#0f766e',
    cardBorder: '#b8dfd9',
    softBorder: '#c0e3de',
    softTintBg: '#f4fbfa',
    titleBg: '#e6f5f3',
    tableHeaderBg: '#d2ede9',
    tableHeaderText: '#134e4a',
    tableBorder: '#64948e',
    signatoryColor: '#0f766e',
  },
  {
    id: 'indigo_academic',
    shortNameKh: 'ស្វាយខៀវ',
    nameKh: 'ស្វាយខៀវសិក្សា (Academic Indigo)',
    descriptionKh: 'ស្វាយខៀវស្រាលបែបសាកលវិទ្យាល័យ ប្រណីត និងផ្លូវការ',
    swatch: ['#4338ca', '#e2e5f8'],
    accentBar: '#4338ca',
    accentDark: '#2e2a72',
    accentMuted: '#4f46e5',
    cardBorder: '#cdd1ef',
    softBorder: '#d2d6f2',
    softTintBg: '#f7f8fe',
    titleBg: '#eceefb',
    tableHeaderBg: '#dfe3f8',
    tableHeaderText: '#2e2a72',
    tableBorder: '#797fb0',
    signatoryColor: '#3730a3',
  },
  {
    id: 'warm_sand',
    shortNameKh: 'មាសខ្សាច់',
    nameKh: 'មាសខ្សាច់ស្រាល (Warm Sand)',
    descriptionKh: 'ពណ៌មាសខ្សាច់កក់ក្ដៅ ថ្លៃថ្នូរ ដូចសញ្ញាបត្រផ្លូវការ',
    swatch: ['#9a6b2f', '#f2e7d0'],
    accentBar: '#9a6b2f',
    accentDark: '#694416',
    accentMuted: '#9a6b2f',
    cardBorder: '#e2d4b7',
    softBorder: '#e5d9bf',
    softTintBg: '#fcfaf5',
    titleBg: '#f6efe0',
    tableHeaderBg: '#efe2c8',
    tableHeaderText: '#5e3c11',
    tableBorder: '#9e8863',
    signatoryColor: '#7c4d17',
  },
  {
    id: 'soft_olive',
    shortNameKh: 'អូលីវស្រាល',
    nameKh: 'បៃតងអូលីវស្រាល (Soft Olive)',
    descriptionKh: 'បៃតងអូលីវទន់ភ្លន់ សាមញ្ញ និងមានលំនឹង',
    swatch: ['#5b6e32', '#e4ead2'],
    accentBar: '#5b6e32',
    accentDark: '#3a491b',
    accentMuted: '#5b6e32',
    cardBorder: '#cfd8b8',
    softBorder: '#d4ddc0',
    softTintBg: '#f9fbf5',
    titleBg: '#eff3e4',
    tableHeaderBg: '#e2e9ce',
    tableHeaderText: '#364419',
    tableBorder: '#808e5f',
    signatoryColor: '#3f521d',
  },
  {
    id: 'dusty_rose',
    shortNameKh: 'ផ្កាឈូកស្រាល',
    nameKh: 'ផ្កាឈូកស្រាលផ្លូវការ (Dusty Rose)',
    descriptionKh: 'ផ្កាឈូកស្រទន់បែបផ្លូវការ មិនឆើតឆាយ ស្រស់ស្អាត',
    swatch: ['#9d4b63', '#f3dfe4'],
    accentBar: '#9d4b63',
    accentDark: '#6e2a3e',
    accentMuted: '#9d4b63',
    cardBorder: '#e3c7cf',
    softBorder: '#e7ced5',
    softTintBg: '#fcf7f8',
    titleBg: '#f7eaee',
    tableHeaderBg: '#f1dce2',
    tableHeaderText: '#682539',
    tableBorder: '#9e7280',
    signatoryColor: '#7c2d44',
  },
  {
    id: 'soft_lavender',
    shortNameKh: 'ស្វាយស្រាល',
    nameKh: 'ផ្កាឡាវេនឌ័រស្រាល (Soft Lavender)',
    descriptionKh: 'ពណ៌ស្វាយទន់ភ្លន់ ស្អាត និងសាមញ្ញ',
    swatch: ['#6d4c9f', '#ebe3f6'],
    accentBar: '#6d4c9f',
    accentDark: '#472c70',
    accentMuted: '#6d4c9f',
    cardBorder: '#d7c9eb',
    softBorder: '#dcd0ee',
    softTintBg: '#f9f7fd',
    titleBg: '#f1ecfa',
    tableHeaderBg: '#e8dff5',
    tableHeaderText: '#43286b',
    tableBorder: '#8a76aa',
    signatoryColor: '#563685',
  },
  {
    id: 'formal_slate',
    shortNameKh: 'ប្រផេះសាមញ្ញ',
    nameKh: 'ប្រផេះសាមញ្ញផ្លូវការ (Formal Slate)',
    descriptionKh: 'ពណ៌ប្រផេះស្រាលសាមញ្ញបំផុត ងាយព្រីនទាំងពណ៌ និងស-ខ្មៅ',
    swatch: ['#334155', '#e4e8ee'],
    accentBar: '#334155',
    accentDark: '#1e293b',
    accentMuted: '#475569',
    cardBorder: '#cbd5e1',
    softBorder: '#d3dce6',
    softTintBg: '#f8fafc',
    titleBg: '#eef2f6',
    tableHeaderBg: '#e2e8f0',
    tableHeaderText: '#1e293b',
    tableBorder: '#64748b',
    signatoryColor: '#1e293b',
  },
];

export interface BilingualSubjectMeta {
  labelKh: string;
  labelEn: string;
  dotColor: string;
}

const KNOWN_SUBJECT_BILINGUAL_MAP: Record<string, BilingualSubjectMeta> = {
  reading: { labelKh: 'អំណាន', labelEn: 'Reading', dotColor: '#38bdf8' },
  spelling: { labelKh: 'ប្រកបពាក្យ', labelEn: 'Spelling', dotColor: '#a78bfa' },
  dictation: { labelKh: 'សរសេរតាមអាន', labelEn: 'Dictation', dotColor: '#f472b6' },
  homework: { labelKh: 'កិច្ចការផ្ទះ', labelEn: 'Homework', dotColor: '#fb923c' },
  presentation: { labelKh: 'បទបង្ហាញ', labelEn: 'Presentation', dotColor: '#facc15' },
  writing: { labelKh: 'សំណេរ', labelEn: 'Writing', dotColor: '#60a5fa' },
  speaking: { labelKh: 'ការនិយាយ', labelEn: 'Speaking', dotColor: '#34d399' },
  listening: { labelKh: 'ការស្តាប់', labelEn: 'Listening', dotColor: '#2dd4bf' },
  quiz: { labelKh: 'សំណួរខ្លី', labelEn: 'Quiz', dotColor: '#818cf8' },
  exercise: { labelKh: 'លំហាត់', labelEn: 'Exercise', dotColor: '#22c55e' },
  test: { labelKh: 'ប្រឡងប្រចាំខែ', labelEn: 'Monthly Test', dotColor: '#f43f5e' },
  morality: { labelKh: 'សីលធម៌រស់នៅ', labelEn: 'Morality', dotColor: '#10b981' },
  punctuality: { labelKh: 'ឧស្សាហ៍ព្យាយាម', labelEn: 'Punctuality', dotColor: '#0ea5e9' },
  hygiene: { labelKh: 'សុខភាពអនាម័យ', labelEn: 'Hygiene', dotColor: '#14b8a6' },
};

const FALLBACK_DOT_COLORS = [
  '#38bdf8',
  '#34d399',
  '#a78bfa',
  '#fb923c',
  '#f472b6',
  '#facc15',
  '#2dd4bf',
];

export interface StudentReportEvaluationRow {
  key: string;
  labelKh: string;
  labelEn: string;
  dotColor: string;
  isTrait: boolean;
  isExamColumn: boolean;
  inputMode: 'number' | 'evaluation';
  numericValueDisplay: string;
  numericPercent: number | null;
  evaluation: EvaluationGradeValue | '';
}

export interface StudentReportCardData {
  uid: string;
  studentDocId: string;
  studentId: string;
  fullName: string;
  englishName: string;
  gender: string;
  photo: string;
  classId: string;
  classCode: string;
  className: string;
  level: string;
  bookName: string;
  shiftLabel: string;
  teacherName: string;
  totalScoreDisplay: string;
  averageDisplay: string;
  grade: string;
  remarksKh: string;
  remarksEn: string;
  rank: number | null;
  rankDisplay: string;
  totalInGroup: number;
  hasScore: boolean;
  evaluationRows: StudentReportEvaluationRow[];
  permissionCount: number;
  absentCount: number;
  autoRecommendation: string;
}

export interface MonthlyAttendanceCountMap {
  /** key: `${classId}__${studentDocId}` */
  byClassStudent: Record<string, { permission: number; absent: number; present: number }>;
}

function cleanStr(val: unknown): string {
  return String(val ?? '').trim();
}

function getEnglishMentionForGrade(grade: string): string {
  switch (grade) {
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Good';
    case 'C':
      return 'Fairly Good';
    case 'D':
    case 'E':
      return 'Fair';
    case 'F':
      return 'Poor';
    default:
      return '';
  }
}

function inferColumnScaleMax(values: number[]): number {
  if (values.length === 0) return 10;
  const maxVal = Math.max(...values);
  if (maxVal <= 10) return 10;
  if (maxVal <= 15) return 15;
  if (maxVal <= 20) return 20;
  if (maxVal <= 25) return 25;
  if (maxVal <= 30) return 30;
  if (maxVal <= 50) return 50;
  if (maxVal <= 100) return 100;
  return maxVal;
}

function mapPercentToEval(pct: number): EvaluationGradeValue {
  if (pct >= 85) return 'ល្អណាស់';
  if (pct >= 70) return 'ល្អ';
  if (pct >= 50) return 'មធ្យម';
  return 'ខ្សោយ';
}

export function formatReportCardMonthTitle(monthStr: string, customTitle?: string): {
  titleKh: string;
  subtitleEn: string;
} {
  const custom = cleanStr(customTitle);
  const m = /^(\d{4})-(\d{1,2})$/.exec(cleanStr(monthStr));
  const yearNum = m ? Number(m[1]) : new Date().getFullYear();
  const mIdx = m ? Math.max(0, Math.min(11, Number(m[2]) - 1)) : new Date().getMonth();
  const khMonth = KHMER_MONTH_NAMES[mIdx] || KHMER_MONTH_NAMES[0];
  const enMonth = ENGLISH_MONTH_NAMES[mIdx] || ENGLISH_MONTH_NAMES[0];

  if (custom) {
    return {
      titleKh: toArabicDigits(custom),
      subtitleEn: `MONTHLY ACADEMIC REPORT • ${enMonth.toUpperCase()} ${yearNum}`,
    };
  }
  return {
    titleKh: `លទ្ធផលសិក្សាប្រចាំខែ${khMonth} ឆ្នាំ${yearNum}`,
    subtitleEn: `MONTHLY ACADEMIC REPORT • ${enMonth.toUpperCase()} ${yearNum}`,
  };
}

function buildAutoRecommendation(
  rows: StudentReportEvaluationRow[],
  grade: string,
  absentCount: number
): string {
  const poorItems = rows.filter((r) => r.evaluation === 'ខ្សោយ').map((r) => r.labelKh);
  const fairItems = rows.filter((r) => r.evaluation === 'មធ្យម').map((r) => r.labelKh);
  const parts: string[] = [];

  if (poorItems.length > 0) {
    parts.push(`សូមជួយពង្រឹងបន្ថែមលើ៖ ${poorItems.slice(0, 4).join(' • ')}។`);
  }
  if (fairItems.length > 0) {
    parts.push(
      poorItems.length > 0
        ? `គួរហ្វឹកហាត់បន្ថែមលើ៖ ${fairItems.slice(0, 3).join(' • ')}។`
        : `សូមជួយជំរុញ និងហ្វឹកហាត់បន្ថែមលើ៖ ${fairItems.slice(0, 4).join(' • ')}។`
    );
  }
  if (parts.length === 0) {
    if (grade === 'A' || grade === 'B') {
      parts.push('សិស្សមានការសិក្សា និងវិន័យល្អប្រសើរ! សូមបន្តការខិតខំប្រឹងប្រែង និងរក្សាលទ្ធផលល្អនេះបន្តទៀត។');
    } else if (rows.some((r) => r.evaluation)) {
      parts.push('សិស្សមានការវិវត្តន៍ល្អ សូមបន្តការយកចិត្តទុកដាក់រៀនសូត្រ និងធ្វើកិច្ចការផ្ទះឱ្យបានទៀងទាត់។');
    } else {
      parts.push('សូមមាតាបិតាជួយតាមដាន និងលើកទឹកចិត្តដល់ការសិក្សារបស់សិស្សជាប្រចាំ។');
    }
  }
  if (absentCount >= 3) {
    parts.push(`សូមជួយតាមដានវត្តមានសិស្ស (អវត្តមានឥតច្បាប់ ${absentCount} ដង)។`);
  }
  return parts.join(' ');
}

export interface ReportCardSubjectFilterItem {
  key: string;
  labelKh: string;
  labelEn: string;
  dotColor: string;
  kind: 'subject' | 'exam' | 'trait';
}

/**
 * Collects the ordered union of active score-table columns across the selected classes
 * plus the 3 trait columns so the print modal can toggle showing/hiding each item.
 */
export function getReportCardAvailableSubjectItems(params: {
  selectedClasses: any[];
  monthCoeffMap: Record<string, any>;
  scoreSettings: any;
}): ReportCardSubjectFilterItem[] {
  const { selectedClasses, monthCoeffMap, scoreSettings } = params;
  const itemMap = new Map<string, ReportCardSubjectFilterItem>();

  const registerCols = (cols: ActiveScoreSubjectColumn[]) => {
    cols.forEach((col, idx) => {
      if (itemMap.has(col.key)) return;
      const known = KNOWN_SUBJECT_BILINGUAL_MAP[col.key.toLowerCase()];
      itemMap.set(col.key, {
        key: col.key,
        labelKh: known ? known.labelKh : col.label,
        labelEn: known ? known.labelEn : col.label,
        dotColor: known?.dotColor || FALLBACK_DOT_COLORS[idx % FALLBACK_DOT_COLORS.length],
        kind: LOCKED_SUBJECT_KEY_SET.has(col.key) ? 'exam' : 'subject',
      });
    });
  };

  if (selectedClasses.length === 0) {
    const fallbackCfg = resolveClassColumnsConfig(null, scoreSettings?.defaultColumnsConfig);
    registerCols(getActiveSubjectColumns(fallbackCfg));
  } else {
    selectedClasses.forEach((cls) => {
      const classMonthEntry = cls?.id ? monthCoeffMap?.[cls.id] : null;
      const cfg = resolveClassColumnsConfig(classMonthEntry, scoreSettings?.defaultColumnsConfig);
      registerCols(getActiveSubjectColumns(cfg));
    });
  }

  TRAIT_EVALUATION_COLUMNS.forEach((trait) => {
    const known = KNOWN_SUBJECT_BILINGUAL_MAP[trait.key];
    itemMap.set(trait.key, {
      key: trait.key,
      labelKh: trait.labelKh,
      labelEn: trait.labelEn,
      dotColor: known?.dotColor || '#10b981',
      kind: 'trait',
    });
  });

  return Array.from(itemMap.values());
}

export interface BuildReportCardsParams {
  classObj: any;
  allStudents: any[];
  allTeachers: any[];
  allClasses: any[];
  classScoreRows: any[];
  monthCoeffMap: Record<string, any>;
  scoreSettings: any;
  sortMode: ReportCardSortMode;
  splitBehavior: 'auto' | 'always' | 'never';
  includeUnscored: boolean;
  includeExamColumns?: boolean;
  includeTraitPunctuality?: boolean;
  hiddenSubjectKeys?: string[];
  attendanceMap: MonthlyAttendanceCountMap;
}

export function buildStudentReportCardsForClass({
  classObj,
  allStudents,
  allTeachers,
  allClasses,
  classScoreRows,
  monthCoeffMap,
  scoreSettings,
  sortMode,
  splitBehavior,
  includeUnscored,
  includeExamColumns = true,
  includeTraitPunctuality = true,
  hiddenSubjectKeys = [],
  attendanceMap,
}: BuildReportCardsParams): StudentReportCardData[] {
  const packets: MonthlyResultClassPacket[] = computeMonthlyResultPacketsForClass(
    {
      classObj,
      allStudents,
      allTeachers,
      allClasses,
      classScoreRows,
      monthCoeffMap,
      scoreSettings,
      sortMode,
      includeUnscored,
    },
    splitBehavior
  );

  const hiddenSet = new Set<string>(hiddenSubjectKeys);

  // Resolve exact active score columns for this class + month
  const classMonthEntry = classObj?.id ? monthCoeffMap?.[classObj.id] : null;
  const colsConfig = resolveClassColumnsConfig(
    classMonthEntry,
    scoreSettings?.defaultColumnsConfig
  );
  const activeCols: ActiveScoreSubjectColumn[] = getActiveSubjectColumns(colsConfig).filter(
    (col) =>
      !hiddenSet.has(col.key) &&
      (includeExamColumns || !LOCKED_SUBJECT_KEY_SET.has(col.key))
  );

  // Precompute max scale per numeric column across this class so numeric scores map cleanly to Excellent/Good/Fair/Poor
  const numericColMaxMap = new Map<string, number>();
  activeCols.forEach((col) => {
    if (col.inputMode !== 'number') return;
    const nums: number[] = [];
    classScoreRows.forEach((sr) => {
      const raw = getColumnNumericValue(sr, col.key).trim();
      if (!raw) return;
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n >= 0) nums.push(n);
    });
    numericColMaxMap.set(col.key, inferColumnScaleMax(nums));
  });

  // Index score rows & students for fast lookup
  const scoreByKey = new Map<string, any>();
  classScoreRows.forEach((sr) => {
    const rid = cleanStr(sr?.id);
    const sid = cleanStr(sr?.studentId);
    const sdoc = cleanStr(sr?.studentDocId);
    const scode = cleanStr(sr?.studentIdCode);
    if (rid) scoreByKey.set(`rid:${rid}`, sr);
    if (sid) scoreByKey.set(`id:${sid}`, sr);
    if (sdoc) scoreByKey.set(`id:${sdoc}`, sr);
    if (scode) scoreByKey.set(`sid:${scode}`, sr);
  });

  const studentByKey = new Map<string, any>();
  allStudents.forEach((st) => {
    const id = cleanStr(st?.id);
    const code = cleanStr(st?.studentId);
    if (id) studentByKey.set(`id:${id}`, st);
    if (code) studentByKey.set(`sid:${code}`, st);
  });

  const cards: StudentReportCardData[] = [];
  const activeTraits = TRAIT_EVALUATION_COLUMNS.filter(
    (t) => !hiddenSet.has(t.key) && (includeTraitPunctuality || t.key !== 'punctuality')
  );

  packets.forEach((pkt) => {
    pkt.rows.forEach((row) => {
      const sr =
        scoreByKey.get(`rid:${row.rowKey}`) ||
        (row.studentId ? scoreByKey.get(`sid:${row.studentId}`) : null) ||
        scoreByKey.get(`id:${row.rowKey}`) ||
        null;
      const matchedStudent =
        (sr?.studentDocId && studentByKey.get(`id:${cleanStr(sr.studentDocId)}`)) ||
        (sr?.studentId && studentByKey.get(`id:${cleanStr(sr.studentId)}`)) ||
        (row.studentId && studentByKey.get(`sid:${row.studentId}`)) ||
        studentByKey.get(`id:${row.rowKey}`) ||
        null;

      const studentDocId =
        cleanStr(matchedStudent?.id) ||
        cleanStr(sr?.studentDocId) ||
        cleanStr(sr?.studentId) ||
        row.rowKey;

      const evalRows: StudentReportEvaluationRow[] = [];

      // 1. Dynamic Subject Columns from Score Entry Table
      activeCols.forEach((col, idx) => {
        const known = KNOWN_SUBJECT_BILINGUAL_MAP[col.key.toLowerCase()];
        const dotColor = known?.dotColor || FALLBACK_DOT_COLORS[idx % FALLBACK_DOT_COLORS.length];
        const labelKh = known ? known.labelKh : col.label;
        const labelEn = known ? known.labelEn : '';

        if (col.inputMode === 'evaluation') {
          const ev = sr ? (getColumnEvalValue(sr, col.key) as EvaluationGradeValue | '') : '';
          evalRows.push({
            key: col.key,
            labelKh,
            labelEn,
            dotColor,
            isTrait: false,
            isExamColumn: LOCKED_SUBJECT_KEY_SET.has(col.key),
            inputMode: 'evaluation',
            numericValueDisplay: '',
            numericPercent: null,
            evaluation: ev,
          });
        } else {
          const rawNumStr = sr ? getColumnNumericValue(sr, col.key).trim() : '';
          const parsed = rawNumStr ? parseFloat(rawNumStr) : NaN;
          const colMax = numericColMaxMap.get(col.key) || 10;
          const pct = Number.isFinite(parsed) && colMax > 0 ? Math.min(100, (parsed / colMax) * 100) : null;
          const derivedEval = pct !== null ? mapPercentToEval(pct) : '';
          evalRows.push({
            key: col.key,
            labelKh,
            labelEn,
            dotColor,
            isTrait: false,
            isExamColumn: LOCKED_SUBJECT_KEY_SET.has(col.key),
            inputMode: 'number',
            numericValueDisplay: Number.isFinite(parsed)
              ? Number.isInteger(parsed)
                ? String(parsed)
                : String(Number(parsed.toFixed(1)))
              : '',
            numericPercent: pct,
            evaluation: derivedEval,
          });
        }
      });

      // 2. Trait Evaluation Rows (Morality, optional Punctuality, Hygiene)
      activeTraits.forEach((trait) => {
        const known = KNOWN_SUBJECT_BILINGUAL_MAP[trait.key];
        const ev = sr ? normalizeEvaluationValue(sr[trait.key]) : '';
        evalRows.push({
          key: trait.key,
          labelKh: trait.labelKh,
          labelEn: trait.labelEn,
          dotColor: known?.dotColor || '#10b981',
          isTrait: true,
          isExamColumn: false,
          inputMode: 'evaluation',
          numericValueDisplay: '',
          numericPercent: null,
          evaluation: ev,
        });
      });

      const attKey = `${pkt.classId}__${studentDocId}`;
      const attRec = attendanceMap.byClassStudent[attKey] || {
        permission: 0,
        absent: 0,
        present: 0,
      };

      const autoRecommendation = buildAutoRecommendation(evalRows, row.grade, attRec.absent);

      cards.push({
        uid: `${pkt.packetKey}__${row.rowKey}`,
        studentDocId,
        studentId: row.studentId,
        fullName: row.fullName,
        englishName: row.englishName || cleanStr(matchedStudent?.englishName),
        gender: row.gender,
        photo: row.photo || cleanStr(matchedStudent?.photo),
        classId: pkt.classId,
        classCode: pkt.classCode || pkt.className,
        className: pkt.className,
        level: row.level || pkt.splitLevelLabel || pkt.courseLabel || '',
        bookName: pkt.bookName || '',
        shiftLabel: pkt.shiftLabel || cleanStr(matchedStudent?.shift),
        teacherName: pkt.teacherName || '',
        totalScoreDisplay: row.totalScoreDisplay,
        averageDisplay: row.averageDisplay,
        grade: row.grade,
        remarksKh: row.remarks,
        remarksEn: getEnglishMentionForGrade(row.grade),
        rank: row.rank,
        rankDisplay: row.rankDisplay,
        totalInGroup: pkt.scoredCount || pkt.totalCount,
        hasScore: row.totalScore !== null,
        evaluationRows: evalRows,
        permissionCount: attRec.permission,
        absentCount: attRec.absent,
        autoRecommendation,
      });
    });
  });

  return cards;
}

const EVAL_GRADE_COL_STYLES: Record<
  EvaluationGradeValue,
  { cellBg: string; headerColor: string; badgeBg: string; badgeBorder: string; stroke: string }
> = {
  'ល្អណាស់': {
    cellBg: '#ecfdf5',
    headerColor: '#065f46',
    badgeBg: '#d1fae5',
    badgeBorder: '#34d399',
    stroke: '#047857',
  },
  'ល្អ': {
    cellBg: '#eff6ff',
    headerColor: '#1e40af',
    badgeBg: '#dbeafe',
    badgeBorder: '#60a5fa',
    stroke: '#1d4ed8',
  },
  'មធ្យម': {
    cellBg: '#fffbeb',
    headerColor: '#92400e',
    badgeBg: '#fef3c7',
    badgeBorder: '#fbbf24',
    stroke: '#b45309',
  },
  'ខ្សោយ': {
    cellBg: '#fff1f2',
    headerColor: '#9f1239',
    badgeBg: '#ffe4e6',
    badgeBorder: '#fb7185',
    stroke: '#be123c',
  },
};

function EvalCheckIcon({ grade }: { grade: EvaluationGradeValue }) {
  const p = EVAL_GRADE_COL_STYLES[grade];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '4.6mm',
        height: '4.6mm',
        borderRadius: '50%',
        background: p.badgeBg,
        border: `0.45pt solid ${p.badgeBorder}`,
      }}
    >
      <svg
        viewBox="0 0 16 16"
        style={{ width: '3.2mm', height: '3.2mm', display: 'block' }}
        aria-hidden="true"
      >
        <path
          d="M3.2 8.4 L6.5 11.6 L12.8 4.6"
          fill="none"
          stroke={p.stroke}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function PastelMottoOrnament({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 180 14"
      style={{ width: '26mm', height: '2.2mm', display: 'block', margin: '0.3mm auto 0' }}
      aria-hidden="true"
    >
      <g fill="none" stroke={color} strokeLinecap="round" opacity="0.72">
        <path d="M 10 7 Q 45 7 75 7" strokeWidth="1.2" />
        <path d="M 105 7 Q 135 7 170 7" strokeWidth="1.2" />
        <polygon points="90,2 98,7 90,12 82,7" fill={color} stroke="none" />
        <circle cx="72" cy="7" r="1.8" fill={color} stroke="none" />
        <circle cx="108" cy="7" r="1.8" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

export interface StudentReportCardSharedProps {
  monthStr: string;
  customTitle?: string;
  khmerIssueDate: string;
  theme: ReportCardPastelTheme;
  logoUrl?: string;
  logoHeightMm?: number;
  stampUrl?: string;
  signatureUrl?: string;
  signatoryName?: string;
  principalTitleKh?: string;
  principalTitleEn?: string;
  teacherTitleKh?: string;
  teacherTitleEn?: string;
  approvalLabelKh?: string;
  approvalLabelEn?: string;
  schoolProfile?: SchoolProfileInfo;
  showStudentPhoto?: boolean;
  showNumericScores?: boolean;
  showAttendance?: boolean;
  showStampAndSignature?: boolean;
  showParentComments?: boolean;
  stampSizeMm?: number;
  signatureHeightMm?: number;
  customRecommendations?: Record<string, string>;
}

/**
 * Single A5 Portrait Student Monthly Academic Report Card (148.3mm × 209.6mm)
 * Designed with soft pastel multi-color accents & Kantumruy Pro typography,
 * ready for 2-up printing on A4 Landscape (296.6mm × 209.6mm).
 */
export function StudentReportCardA5({
  student,
  shared,
  showCutRight = false,
}: {
  student: StudentReportCardData;
  shared: StudentReportCardSharedProps;
  showCutRight?: boolean;
}) {
  const {
    monthStr,
    customTitle,
    khmerIssueDate,
    theme,
    logoUrl,
    logoHeightMm = 15,
    stampUrl,
    signatureUrl,
    signatoryName = 'សំរិត វឌ្ឍនៈ',
    principalTitleKh = 'នាយក',
    principalTitleEn = 'School Principal',
    teacherTitleKh = 'គ្រូប្រចាំថ្នាក់',
    teacherTitleEn = 'Teacher',
    approvalLabelKh = 'បានឃើញ និងឯកភាព',
    approvalLabelEn = 'Seen and approved by',
    schoolProfile,
    showStudentPhoto = true,
    showNumericScores = true,
    showAttendance = true,
    showStampAndSignature = true,
    showParentComments = true,
    stampSizeMm = 28,
    signatureHeightMm = 9.5,
    customRecommendations = {},
  } = shared;

  const [logoImgFailed, setLogoImgFailed] = React.useState(false);
  const [photoImgFailed, setPhotoImgFailed] = React.useState(false);

  const trimmedLogoUrl = String(logoUrl || '').trim();
  const resolvedLogoSrc = (() => {
    if (!trimmedLogoUrl || trimmedLogoUrl.includes('1ua9ZtPExXLinQMzRRuxpRCfM4HmgUhD0')) {
      return '/bsis_receipt_banner.png';
    }
    return resolveSheetAssetSrc(trimmedLogoUrl) || '/bsis_receipt_banner.png';
  })();
  const studentPhotoSrc = resolveSheetAssetSrc(student.photo);

  React.useEffect(() => {
    setLogoImgFailed(false);
  }, [logoUrl]);

  React.useEffect(() => {
    setPhotoImgFailed(false);
  }, [student.photo]);

  const { titleKh, subtitleEn } = formatReportCardMonthTitle(monthStr, customTitle);

  const recommendationText =
    (customRecommendations[student.uid] !== undefined
      ? customRecommendations[student.uid]
      : student.autoRecommendation) || '';

  const rowCount = student.evaluationRows.length;
  const compactRowPadY = rowCount >= 11 ? '0.65mm' : rowCount >= 9 ? '0.95mm' : '1.35mm';
  const compactRowFont = rowCount >= 11 ? '7.2pt' : rowCount >= 9 ? '7.7pt' : '8.2pt';

  // Mention text color ONLY changes strictly to match scores/page.tsx (A/B Red, C Purple, D/E Green, F Slate)
  const gradeTextColor = (() => {
    switch (student.grade) {
      case 'A':
      case 'B':
        return '#dc2626';
      case 'C':
        return '#c026d3';
      case 'D':
      case 'E':
        return '#16a34a';
      case 'F':
        return '#475569';
      default:
        return '#475569';
    }
  })();

  const boldSummaryNumStyle: React.CSSProperties = {
    fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
    fontSize: '11.6pt',
    fontWeight: 900,
    marginTop: '0.25mm',
    letterSpacing: '0.01em',
    fontVariantNumeric: 'tabular-nums',
    WebkitTextStroke: '0.22px currentColor',
  };

  return (
    <div
      className="student-report-a5-slot"
      style={{
        width: '148.3mm',
        height: '209.6mm',
        boxSizing: 'border-box',
        padding: '4mm 4.2mm',
        background: '#ffffff',
        borderRight: showCutRight ? '0.5pt dashed #94a3b8' : 'none',
        fontFamily: "'Kantumruy Pro', 'Kantumruy', 'Khmer OS Siemreap', sans-serif",
        color: '#0f172a',
        position: 'relative',
        overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Inner Formal Framed Card (Solid Light Styling, Zero Gradients) */}
      <div
        data-print-page-pad="true"
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: '2.8mm',
          border: `0.75pt solid ${theme.cardBorder}`,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Clean Solid Top Accent Line */}
        <div
          style={{
            height: '1.6mm',
            width: '100%',
            background: theme.accentBar,
            flexShrink: 0,
          }}
        />

        {/* Card Body Content */}
        <div
          style={{
            flex: 1,
            padding: '2.5mm 3.5mm 2.5mm 3.5mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.9mm',
            minHeight: 0,
          }}
        >
          {/* 1. TOP HEADER: Left School Logo + Name | Right National Motto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '2mm',
              }}
            >
              {/* School Logo — 100% Pure Image From Link (No HTML Text Overlay) */}
              <div
                data-print-section="branding"
                title="ចុចដើម្បីប្ដូរ Link ឡូហ្គោ ត្រា និងហត្ថលេខា"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  maxWidth: '84mm',
                  minWidth: 0,
                }}
              >
                <img
                  src={logoImgFailed ? '/bsis_receipt_banner.png' : resolvedLogoSrc}
                  alt="School Logo"
                  onError={() => {
                    if (!logoImgFailed) setLogoImgFailed(true);
                  }}
                  style={{
                    height: `${logoHeightMm}mm`,
                    width: 'auto',
                    maxWidth: '84mm',
                    objectFit: 'contain',
                    objectPosition: 'left center',
                    display: 'block',
                  }}
                />
              </div>

              {/* Right: National Motto */}
              <div
                data-print-section="branding"
                title="ចុចដើម្បីកែការកំណត់ក្បាលទំព័រ"
                style={{
                  textAlign: 'center',
                  color: theme.accentDark,
                  lineHeight: 1.32,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '7.4pt', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontSize: '6.9pt', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <PastelMottoOrnament color={theme.accentMuted} />
              </div>
            </div>

            {/* Center Formal Solid Title Banner */}
            <div
              style={{
                background: theme.titleBg,
                border: `0.6pt solid ${theme.softBorder}`,
                borderRadius: '2mm',
                padding: '1.35mm 3mm',
                textAlign: 'center',
                lineHeight: 1.28,
              }}
            >
              <div
                data-print-heading="true"
                style={{
                  fontSize: '10.6pt',
                  fontWeight: 800,
                  color: theme.accentDark,
                  letterSpacing: '0.01em',
                }}
              >
                {titleKh}
              </div>
              <div
                style={{
                  fontSize: '6.1pt',
                  fontWeight: 700,
                  color: theme.accentMuted,
                  letterSpacing: '0.08em',
                  marginTop: '0.2mm',
                }}
              >
                {subtitleEn}
              </div>
            </div>
          </div>

          {/* 2. STUDENT DETAILS BLOCK + TOP-RIGHT STUDENT PHOTO (Clean Solid Soft Tint) */}
          <div
            data-print-section="student-info"
            title="ចុចដើម្បីកែជម្រើសបង្ហាញព័ត៌មានសិស្ស និងរូបថត"
            style={{
              background: theme.softTintBg,
              border: `0.6pt solid ${theme.softBorder}`,
              borderRadius: '2mm',
              padding: '2mm 2.6mm',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              gap: '2.5mm',
            }}
          >
            {/* Left: Clean Formal Bilingual Student Details */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '1.15mm',
                fontSize: '7.8pt',
                lineHeight: 1.26,
              }}
            >
              {/* Name + English Name (Large Bold Deep Blue) */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.4mm', flexWrap: 'wrap' }}>
                <span style={{ color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  សិស្សឈ្មោះ / Name ៖
                </span>
                <span
                  data-print-preserve-color="true"
                  data-print-preserve-weight="true"
                  data-print-no-scale="true"
                  style={{
                    fontSize: '11.2pt',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    WebkitTextStroke: '0.32px currentColor',
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {student.fullName || '-'}
                </span>
                {student.englishName && (
                  <span
                    data-print-preserve-color="true"
                    data-print-preserve-weight="true"
                    data-print-no-scale="true"
                    style={{
                      fontSize: '7.8pt',
                      fontWeight: 700,
                      color: '#1e40af',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ({student.englishName})
                  </span>
                )}
              </div>

              {/* Row 2: Gender + Student ID + Total Students in Class */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.4mm',
                  flexWrap: 'nowrap',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.9mm', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>ភេទ / Sex ៖</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '7.6pt' }}>
                    {student.gender || '-'}
                  </span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.9mm', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>អត្តលេខ / ID ៖</span>
                  <span
                    data-print-preserve-color="true"
                    data-print-preserve-weight="true"
                    style={{ color: theme.accentDark, fontWeight: 800, fontSize: '7.6pt' }}
                  >
                    {student.studentId || '-'}
                  </span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.9mm', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>សិស្សសរុប ៖</span>
                  <span
                    data-print-preserve-color="true"
                    data-print-preserve-weight="true"
                    style={{
                      fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                      color: '#0f766e',
                      fontWeight: 800,
                      fontSize: '8pt',
                    }}
                  >
                    {student.totalInGroup > 0 ? `${student.totalInGroup} នាក់` : '-'}
                  </span>
                </div>
              </div>

              {/* Row 3: Level / Book + Room */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2mm',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1.2mm', minWidth: 0 }}>
                  <span style={{ color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    វគ្គសិក្សា / Level ៖
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {student.bookName || student.level || '-'}
                  </span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1.2mm' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>បន្ទប់ / Room ៖</span>
                  <span
                    style={{
                      padding: '0.1mm 1.6mm',
                      borderRadius: '1.2mm',
                      background: theme.tableHeaderBg,
                      color: theme.tableHeaderText,
                      fontWeight: 800,
                      fontSize: '7.5pt',
                    }}
                  >
                    {student.classCode || '-'}
                  </span>
                </div>
              </div>

              {/* Row 4: Shift + Teacher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2mm',
                  fontSize: '7.3pt',
                  color: '#334155',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>វេន / Shift ៖ </span>
                  <strong style={{ color: '#0f172a' }}>{student.shiftLabel || '-'}</strong>
                </div>
                {student.teacherName && (
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>គ្រូ / Teacher ៖ </span>
                    <strong style={{ color: '#0f172a' }}>{student.teacherName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Top-Right: Student Photo */}
            {showStudentPhoto && (
              <div
                style={{
                  width: '19.5mm',
                  height: '23.5mm',
                  borderRadius: '1.8mm',
                  border: `0.75pt solid ${theme.tableBorder}`,
                  background: '#ffffff',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {studentPhotoSrc && !photoImgFailed ? (
                  <img
                    src={studentPhotoSrc}
                    alt={student.fullName}
                    onError={() => setPhotoImgFailed(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: theme.titleBg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.8mm',
                    }}
                  >
                    <svg
                      viewBox="0 0 48 48"
                      style={{ width: '9.5mm', height: '9.5mm', opacity: 0.48 }}
                      aria-hidden="true"
                    >
                      <circle cx="24" cy="17" r="8.5" fill={theme.accentMuted} />
                      <path
                        d="M 8 42 C 8 31, 15 27, 24 27 C 33 27, 40 31, 40 42 Z"
                        fill={theme.accentMuted}
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: '5.5pt',
                        fontWeight: 700,
                        color: theme.accentMuted,
                      }}
                    >
                      រូបថតសិស្ស
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. FORMAL EVALUATION TABLE + 4-PILL SOLID PASTEL SUMMARY STRIP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6mm' }}>
            <div
              style={{
                borderRadius: '1.8mm',
                overflow: 'hidden',
                border: `0.75pt solid ${theme.tableBorder}`,
                background: '#ffffff',
              }}
            >
            <table
              data-pt-tk="student-report-eval"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: compactRowFont,
              }}
            >
              <colgroup>
                <col style={{ width: '37%' }} />
                <col style={{ width: '9.5%' }} />
                <col style={{ width: '9.5%' }} />
                <col style={{ width: '9.5%' }} />
                <col style={{ width: '9.5%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: theme.tableHeaderBg, color: theme.tableHeaderText }}>
                  <th
                    rowSpan={2}
                    style={{
                      borderRight: `0.6pt solid ${theme.tableBorder}`,
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '1.2mm 1.5mm',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '7.8pt',
                      lineHeight: 1.25,
                    }}
                  >
                    <div>មុខវិជ្ជា</div>
                    <div style={{ fontSize: '6.4pt', fontWeight: 700, opacity: 0.85 }}>
                      SUBJECT
                    </div>
                  </th>
                  <th
                    colSpan={4}
                    style={{
                      borderRight: `0.6pt solid ${theme.tableBorder}`,
                      borderBottom: `0.55pt solid ${theme.tableBorder}`,
                      padding: '0.8mm 1mm',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '7.6pt',
                    }}
                  >
                    និទ្ទេស / Grades
                  </th>
                  <th
                    rowSpan={2}
                    style={{
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '1.1mm 1.2mm',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '7.2pt',
                      lineHeight: 1.25,
                    }}
                  >
                    <div>ចំណុចត្រូវជួយកែលម្អ</div>
                    <div style={{ fontSize: '6.1pt', fontWeight: 700, opacity: 0.85 }}>
                      Recommendation
                    </div>
                  </th>
                </tr>
                <tr style={{ fontSize: '6.4pt', lineHeight: 1.18 }}>
                  <th
                    style={{
                      background: EVAL_GRADE_COL_STYLES['ល្អណាស់'].cellBg,
                      color: EVAL_GRADE_COL_STYLES['ល្អណាស់'].headerColor,
                      borderRight: `0.5pt dashed ${theme.tableBorder}`,
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '0.7mm 0.4mm',
                      fontWeight: 700,
                    }}
                  >
                    <div>ល្អណាស់</div>
                    <div style={{ fontSize: '5.4pt', fontWeight: 600 }}>Excellent</div>
                  </th>
                  <th
                    style={{
                      background: EVAL_GRADE_COL_STYLES['ល្អ'].cellBg,
                      color: EVAL_GRADE_COL_STYLES['ល្អ'].headerColor,
                      borderRight: `0.5pt dashed ${theme.tableBorder}`,
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '0.7mm 0.4mm',
                      fontWeight: 700,
                    }}
                  >
                    <div>ល្អ</div>
                    <div style={{ fontSize: '5.4pt', fontWeight: 600 }}>Good</div>
                  </th>
                  <th
                    style={{
                      background: EVAL_GRADE_COL_STYLES['មធ្យម'].cellBg,
                      color: EVAL_GRADE_COL_STYLES['មធ្យម'].headerColor,
                      borderRight: `0.5pt dashed ${theme.tableBorder}`,
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '0.7mm 0.4mm',
                      fontWeight: 700,
                    }}
                  >
                    <div>មធ្យម</div>
                    <div style={{ fontSize: '5.4pt', fontWeight: 600 }}>Fair</div>
                  </th>
                  <th
                    style={{
                      background: EVAL_GRADE_COL_STYLES['ខ្សោយ'].cellBg,
                      color: EVAL_GRADE_COL_STYLES['ខ្សោយ'].headerColor,
                      borderRight: `0.6pt solid ${theme.tableBorder}`,
                      borderBottom: `0.75pt solid ${theme.tableBorder}`,
                      padding: '0.7mm 0.4mm',
                      fontWeight: 700,
                    }}
                  >
                    <div>ខ្សោយ</div>
                    <div style={{ fontSize: '5.4pt', fontWeight: 600 }}>Poor</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {student.evaluationRows.map((evRow, rIdx) => {
                  const isLast = rIdx === student.evaluationRows.length - 1;
                  const rowBorderBottom = isLast ? 'none' : '0.45pt dashed #cbd5e1';

                  return (
                    <tr key={evRow.key} style={{ background: '#ffffff' }}>
                      <td
                        style={{
                          borderRight: `0.6pt solid ${theme.tableBorder}`,
                          borderBottom: rowBorderBottom,
                          padding: `${compactRowPadY} 1.8mm`,
                          verticalAlign: 'middle',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1mm',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: evRow.isTrait ? 700 : 600,
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {evRow.labelKh}
                            {evRow.labelEn ? (
                              <span
                                style={{
                                  color: '#64748b',
                                  fontWeight: 500,
                                  fontSize: '6.6pt',
                                }}
                              >
                                {' '}
                                / {evRow.labelEn}
                              </span>
                            ) : null}
                          </span>

                          {showNumericScores && evRow.numericValueDisplay && (
                            <span
                              data-print-preserve-color="true"
                              data-print-preserve-weight="true"
                              style={{
                                fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                                fontSize: '6.9pt',
                                fontWeight: 800,
                                padding: '0.08mm 1.3mm',
                                borderRadius: '1mm',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '0.45pt solid #bfdbfe',
                                flexShrink: 0,
                              }}
                            >
                              {toArabicDigits(evRow.numericValueDisplay)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4 Evaluation Grade Columns (Restored v1 Solid Pastel Highlight + Circle Checkmark) */}
                      {(
                        ['ល្អណាស់', 'ល្អ', 'មធ្យម', 'ខ្សោយ'] as EvaluationGradeValue[]
                      ).map((gradeVal, cIdx) => {
                        const isChecked = evRow.evaluation === gradeVal;
                        return (
                          <td
                            key={gradeVal}
                            style={{
                              borderRight:
                                cIdx === 3
                                  ? `0.6pt solid ${theme.tableBorder}`
                                  : '0.45pt dashed #cbd5e1',
                              borderBottom: rowBorderBottom,
                              padding: `${compactRowPadY} 0.4mm`,
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              background: isChecked
                                ? EVAL_GRADE_COL_STYLES[gradeVal].cellBg
                                : '#ffffff',
                            }}
                          >
                            {isChecked ? <EvalCheckIcon grade={gradeVal} /> : null}
                          </td>
                        );
                      })}

                      {/* Merged Recommendation Column on First Row (Clean Crisp White) */}
                      {rIdx === 0 && (
                        <td
                          rowSpan={student.evaluationRows.length}
                          data-print-section="recommendations"
                          title="ចុចដើម្បីកែមតិណែនាំសម្រាប់សិស្សម្នាក់ៗ"
                          style={{
                            background: '#ffffff',
                            color: '#1e293b',
                            padding: '2mm 2mm',
                            verticalAlign: 'top',
                            textAlign: 'left',
                            fontSize: '7.1pt',
                            lineHeight: 1.48,
                            fontWeight: 500,
                          }}
                        >
                          {recommendationText}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* 4-Card Summary Strip: Distinct Bold Colored Numbers, Actual Grade Mention Color, Big Bold Red Rank */}
            <div
              data-print-preserve-color="true"
              data-print-preserve-weight="true"
              data-print-no-scale="true"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr 0.9fr',
                gap: '1.6mm',
              }}
            >
              {/* Total Score */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '0.75pt solid #93c5fd',
                  borderRadius: '2.2mm',
                  padding: '1.15mm 1.3mm',
                  textAlign: 'center',
                  lineHeight: 1.18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '6.3pt', fontWeight: 700, color: '#1e40af' }}>
                  ពិន្ទុសរុប / SCORE
                </div>
                <div style={{ ...boldSummaryNumStyle, color: '#1d4ed8' }}>
                  {student.totalScoreDisplay ? toArabicDigits(student.totalScoreDisplay) : '—'}
                </div>
              </div>

              {/* Average */}
              <div
                style={{
                  background: '#ecfdf5',
                  border: '0.75pt solid #6ee7b7',
                  borderRadius: '2.2mm',
                  padding: '1.15mm 1.3mm',
                  textAlign: 'center',
                  lineHeight: 1.18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '6.3pt', fontWeight: 700, color: '#047857' }}>
                  មធ្យមភាគ / Average
                </div>
                <div style={{ ...boldSummaryNumStyle, color: '#0f766e' }}>
                  {student.averageDisplay ? toArabicDigits(student.averageDisplay) : '—'}
                </div>
              </div>

              {/* Mention / Grade (Fixed soft card color; ONLY grade text color changes per scores/page.tsx) */}
              <div
                style={{
                  background: '#f5f3ff',
                  border: '0.75pt solid #c4b5fd',
                  borderRadius: '2.2mm',
                  padding: '1.15mm 1.3mm',
                  textAlign: 'center',
                  lineHeight: 1.18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '6.3pt', fontWeight: 700, color: '#5b21b6' }}>
                  និទ្ទេស / Mention
                </div>
                <div
                  style={{
                    marginTop: '0.25mm',
                    whiteSpace: 'nowrap',
                    color: gradeTextColor,
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: '1mm',
                  }}
                >
                  {student.grade ? (
                    <>
                      <span
                        style={{
                          fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                          fontSize: '11.4pt',
                          fontWeight: 900,
                          WebkitTextStroke: '0.22px currentColor',
                        }}
                      >
                        {student.grade}
                      </span>
                      {student.remarksKh && (
                        <span
                          style={{
                            fontSize: '8.7pt',
                            fontWeight: 800,
                            WebkitTextStroke: '0.22px currentColor',
                          }}
                        >
                          • {student.remarksKh}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '10pt', fontWeight: 800 }}>—</span>
                  )}
                </div>
              </div>

              {/* Rank (Big Bold Vivid Red, Western Digit Only) */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '0.75pt solid #fbbf24',
                  borderRadius: '2.2mm',
                  padding: '1.05mm 1.3mm',
                  textAlign: 'center',
                  lineHeight: 1.14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '6.3pt', fontWeight: 700, color: '#92400e' }}>
                  ចំណាត់ថ្នាក់ / Rank
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                    fontSize: '13.4pt',
                    fontWeight: 900,
                    color: '#dc2626',
                    marginTop: '0.15mm',
                    fontVariantNumeric: 'tabular-nums',
                    WebkitTextStroke: '0.3px currentColor',
                  }}
                >
                  {student.rankDisplay ? toArabicDigits(student.rankDisplay) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. CLEAN ATTENDANCE LINE + SIDE-BY-SIDE PRINCIPAL & TEACHER SIGNATURES */}
          <div
            data-print-section="footer-sign"
            title="ចុចដើម្បីកែកាលបរិច្ឆេទ ត្រា ហត្ថលេខា និងវត្តមាន"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.7mm',
            }}
          >
            {/* Formal Minimal Attendance Strip (Clean White + Subtle Hairline Borders) */}
            {showAttendance && (
              <div
                style={{
                  background: '#ffffff',
                  borderTop: `0.55pt solid ${theme.softBorder}`,
                  borderBottom: `0.55pt solid ${theme.softBorder}`,
                  padding: '1mm 1.5mm',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2mm',
                  fontSize: '7.4pt',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1.2mm' }}>
                  <span style={{ fontWeight: 800, color: theme.accentDark }}>
                    វត្តមាន
                  </span>
                  <span style={{ fontSize: '6.4pt', fontWeight: 600, color: '#64748b' }}>
                    (Attendance)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1mm' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>មានច្បាប់ / P៖</span>
                    <span
                      data-print-preserve-color="true"
                      data-print-preserve-weight="true"
                      style={{
                        fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                        color: '#0369a1',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {student.permissionCount} ដង
                    </span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1mm' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>ឥតច្បាប់ / A៖</span>
                    <span
                      data-print-preserve-color="true"
                      data-print-preserve-weight="true"
                      style={{
                        fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
                        color: student.absentCount > 0 ? '#dc2626' : '#047857',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {student.absentCount} ដង
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side Signatures: Left Principal + Stamp/Signature | Right Date + Teacher */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '2mm',
                padding: '0 1mm',
              }}
            >
              {/* Left: Seen & Approved by Principal + Optional Stamp & Signature */}
              {showStampAndSignature ? (
                <div
                  style={{
                    width: '62mm',
                    textAlign: 'center',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1.24,
                  }}
                >
                  <div style={{ fontSize: '7.3pt', fontWeight: 700, color: '#1e293b' }}>
                    {approvalLabelKh}
                  </div>
                  <div style={{ fontSize: '6.2pt', fontWeight: 600, color: '#64748b' }}>
                    {approvalLabelEn}
                  </div>
                  <div style={{ fontSize: '7.4pt', fontWeight: 800, color: '#0f172a', marginTop: '0.15mm' }}>
                    {principalTitleKh} / {principalTitleEn}
                  </div>

                  {/* Layered Stamp + Signature */}
                  <div
                    style={{
                      position: 'relative',
                      width: '54mm',
                      height: `${Math.max(15, Math.min(23, stampSizeMm * 0.66))}mm`,
                      marginTop: '-1mm',
                      overflow: 'visible',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '3mm',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${stampSizeMm}mm`,
                        height: `${stampSizeMm}mm`,
                        opacity: 0.88,
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    >
                      <OfficialSchoolStamp
                        stampUrl={stampUrl}
                        schoolProfile={schoolProfile}
                        size={`${stampSizeMm}mm`}
                      />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        left: '21mm',
                        bottom: '0.2mm',
                        width: '28mm',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 4,
                      }}
                    >
                      <ReceiptSignature
                        signatureUrl={signatureUrl}
                        height={`${signatureHeightMm}mm`}
                        color={theme.signatoryColor}
                      />
                    </div>
                  </div>

                  {signatoryName && (
                    <div
                      style={{
                        marginTop: '0.3mm',
                        paddingLeft: '8mm',
                        fontSize: '8pt',
                        fontWeight: 800,
                        color: theme.signatoryColor,
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        zIndex: 5,
                      }}
                    >
                      {signatoryName}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '58mm' }} />
              )}

              {/* Right: Issue Date + Teacher */}
              <div
                style={{
                  width: '56mm',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '7.2pt', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                  {toArabicDigits(khmerIssueDate)}
                </div>
                <div style={{ fontSize: '7.5pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', marginTop: '0.3mm' }}>
                  {teacherTitleKh} / {teacherTitleEn}
                </div>
                <div style={{ height: '14mm' }} />
                {student.teacherName && (
                  <div
                    style={{
                      fontSize: '7.8pt',
                      fontWeight: 700,
                      color: theme.accentDark,
                      borderTop: '0.45pt dashed #cbd5e1',
                      paddingTop: '0.6mm',
                      minWidth: '34mm',
                    }}
                  >
                    {student.teacherName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. PARENTS / GUARDIAN COMMENTS BOX (Crisp Clean White + Subtle Border) */}
          {showParentComments && (
            <div
              data-print-section="parent-comments"
              title="ចុចដើម្បីបង្ហាញ ឬលាក់ប្រអប់មតិមាតាបិតា"
              style={{
                background: '#ffffff',
                border: `0.6pt solid ${theme.softBorder}`,
                borderRadius: '2mm',
                padding: '1.35mm 2.8mm 1.9mm',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1mm',
              }}
            >
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div
                  style={{
                    fontSize: '7.4pt',
                    fontWeight: 800,
                    color: theme.accentDark,
                  }}
                >
                  មតិយោបល់ មាតាបិតា និងអាណាព្យាបាលសិស្ស
                </div>
                <div style={{ fontSize: '6pt', fontWeight: 600, color: '#64748b' }}>
                  Parents or guardian&apos;s comments
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3.6mm', paddingTop: '1mm' }}>
                <div style={{ borderBottom: '0.55pt dotted #94a3b8' }} />
                <div style={{ borderBottom: '0.55pt dotted #94a3b8' }} />
                <div style={{ borderBottom: '0.55pt dotted #94a3b8' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Full A4 Landscape Sheet (296.6mm × 209.6mm) holding 2 A5 Portrait Student Report Cards side-by-side.
 */
export function StudentReportPairA4LandscapeSheet({
  leftStudent,
  rightStudent,
  showCutGuide = true,
  shared,
}: {
  leftStudent: StudentReportCardData;
  rightStudent?: StudentReportCardData | null;
  showCutGuide?: boolean;
  shared: StudentReportCardSharedProps;
}) {
  return (
    <div
      className="receipt-a4-sheet"
      data-print-grid="true"
      style={{
        width: REPORT_CARD_A4_LANDSCAPE_SPEC.sheetW,
        height: REPORT_CARD_A4_LANDSCAPE_SPEC.sheetH,
        background: '#ffffff',
        display: 'grid',
        gridTemplateColumns: '148.3mm 148.3mm',
        gridTemplateRows: '209.6mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <StudentReportCardA5
        student={leftStudent}
        shared={shared}
        showCutRight={showCutGuide}
      />
      {rightStudent ? (
        <StudentReportCardA5
          student={rightStudent}
          shared={shared}
          showCutRight={false}
        />
      ) : (
        <div
          style={{
            width: '148.3mm',
            height: '209.6mm',
            background: '#ffffff',
          }}
        />
      )}
    </div>
  );
}

/**
 * Single A5 Portrait Sheet (148.3mm × 209.6mm) for direct A5 paper printing.
 */
export function StudentReportSingleA5Sheet({
  student,
  shared,
}: {
  student: StudentReportCardData;
  shared: StudentReportCardSharedProps;
}) {
  return (
    <div
      className="receipt-a4-sheet"
      style={{
        width: REPORT_CARD_A5_PORTRAIT_SPEC.sheetW,
        height: REPORT_CARD_A5_PORTRAIT_SPEC.sheetH,
        background: '#ffffff',
        boxSizing: 'border-box',
        overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <StudentReportCardA5 student={student} shared={shared} showCutRight={false} />
    </div>
  );
}
