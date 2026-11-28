"use client";

import React from 'react';
import { KHMER_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import ReceiptSignature from '@/components/receipts/ReceiptSignature';

export interface ResultColorTheme {
  id: string;
  nameKh: string;
  descriptionKh: string;
  swatch: [string, string];
  titleColor: string;
  mottoColor: string;
  metaLabelColor: string;
  metaValueColor: string;
  headerBg: string;
  headerTextColor: string;
  headerBorderColor: string;
  cellBorderColor: string;
  outerBorderColor: string;
  evenRowBg: string;
  oddRowBg: string;
  nameColor: string;
  scoreColor: string;
  avgColor: string;
  rankColor: string;
  signatoryColor: string;
  gradeColors: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    F: string;
  };
}

export const RESULT_COLOR_THEMES: ResultColorTheme[] = [
  {
    id: 'classic_gold',
    nameKh: 'មាស-ខៀវ (គំរូដើម)',
    descriptionKh: 'ក្បាលតារាងពណ៌លឿងមាស អក្សរខៀវ ដូចគំរូដើម',
    swatch: ['#f9df94', '#1d4ed8'],
    titleColor: '#1d4ed8',
    mottoColor: '#111827',
    metaLabelColor: '#1e293b',
    metaValueColor: '#0f172a',
    headerBg: '#f9df94',
    headerTextColor: '#1d4ed8',
    headerBorderColor: '#111827',
    cellBorderColor: '#1f2937',
    outerBorderColor: '#111827',
    evenRowBg: '#ffffff',
    oddRowBg: '#fffdf2',
    nameColor: '#111827',
    scoreColor: '#1d4ed8',
    avgColor: '#15803d',
    rankColor: '#dc2626',
    signatoryColor: '#1d4ed8',
    gradeColors: {
      A: '#dc2626',
      B: '#b45309',
      C: '#7c3aed',
      D: '#15803d',
      E: '#0369a1',
      F: '#111827',
    },
  },
  {
    id: 'ocean_indigo',
    nameKh: 'ខៀវសមុទ្រ (Royal Navy)',
    descriptionKh: 'ក្បាលតារាងខៀវទឹកប៊ិក អក្សរស ជួរឆ្លាស់ខៀវស្រាល',
    swatch: ['#1e40af', '#dbeafe'],
    titleColor: '#1e3a8a',
    mottoColor: '#0f172a',
    metaLabelColor: '#1e3a8a',
    metaValueColor: '#0f172a',
    headerBg: '#1e40af',
    headerTextColor: '#ffffff',
    headerBorderColor: '#1e3a8a',
    cellBorderColor: '#64748b',
    outerBorderColor: '#1e3a8a',
    evenRowBg: '#ffffff',
    oddRowBg: '#eff6ff',
    nameColor: '#0f172a',
    scoreColor: '#1d4ed8',
    avgColor: '#047857',
    rankColor: '#dc2626',
    signatoryColor: '#1e3a8a',
    gradeColors: {
      A: '#dc2626',
      B: '#d97706',
      C: '#6d28d9',
      D: '#047857',
      E: '#0284c7',
      F: '#334155',
    },
  },
  {
    id: 'emerald_jade',
    nameKh: 'បៃតងមរកត (Emerald)',
    descriptionKh: 'ក្បាលតារាងបៃតងស្រស់ អក្សរស ជួរឆ្លាស់បៃតងខ្ចី',
    swatch: ['#047857', '#d1fae5'],
    titleColor: '#065f46',
    mottoColor: '#064e3b',
    metaLabelColor: '#065f46',
    metaValueColor: '#0f172a',
    headerBg: '#059669',
    headerTextColor: '#ffffff',
    headerBorderColor: '#065f46',
    cellBorderColor: '#475569',
    outerBorderColor: '#065f46',
    evenRowBg: '#ffffff',
    oddRowBg: '#ecfdf5',
    nameColor: '#0f172a',
    scoreColor: '#0369a1',
    avgColor: '#047857',
    rankColor: '#b91c1c',
    signatoryColor: '#065f46',
    gradeColors: {
      A: '#b91c1c',
      B: '#c2410c',
      C: '#6d28d9',
      D: '#047857',
      E: '#0284c7',
      F: '#1e293b',
    },
  },
  {
    id: 'royal_violet',
    nameKh: 'ស្វាយទំនើប (Royal Violet)',
    descriptionKh: 'ក្បាលតារាងស្វាយប្រណីត អក្សរស ជួរឆ្លាស់ស្វាយស្រាល',
    swatch: ['#6d28d9', '#ede9fe'],
    titleColor: '#5b21b6',
    mottoColor: '#1e1b4b',
    metaLabelColor: '#4c1d95',
    metaValueColor: '#0f172a',
    headerBg: '#6d28d9',
    headerTextColor: '#ffffff',
    headerBorderColor: '#4c1d95',
    cellBorderColor: '#64748b',
    outerBorderColor: '#4c1d95',
    evenRowBg: '#ffffff',
    oddRowBg: '#f5f3ff',
    nameColor: '#1e1b4b',
    scoreColor: '#4338ca',
    avgColor: '#0f766e',
    rankColor: '#be123c',
    signatoryColor: '#5b21b6',
    gradeColors: {
      A: '#be123c',
      B: '#c2410c',
      C: '#6d28d9',
      D: '#0f766e',
      E: '#0369a1',
      F: '#1f2937',
    },
  },
  {
    id: 'rose_coral',
    nameKh: 'ផ្កាឈូក-មាស (Pastel Rose)',
    descriptionKh: 'ក្បាលតារាងផ្កាឈូកស្រស់ អក្សរឈាមជ្រូក សមរម្យស្អាត',
    swatch: ['#fbcfe8', '#9d174d'],
    titleColor: '#9d174d',
    mottoColor: '#1e293b',
    metaLabelColor: '#831843',
    metaValueColor: '#0f172a',
    headerBg: '#fbcfe8',
    headerTextColor: '#831843',
    headerBorderColor: '#831843',
    cellBorderColor: '#475569',
    outerBorderColor: '#831843',
    evenRowBg: '#ffffff',
    oddRowBg: '#fff1f2',
    nameColor: '#111827',
    scoreColor: '#be185d',
    avgColor: '#047857',
    rankColor: '#dc2626',
    signatoryColor: '#9d174d',
    gradeColors: {
      A: '#dc2626',
      B: '#b45309',
      C: '#7c3aed',
      D: '#047857',
      E: '#0369a1',
      F: '#1f2937',
    },
  },
];

export type ResultSortMode = 'rank_asc' | 'name_asc' | 'student_id' | 'level_name';

export interface MonthlyResultStudentRow {
  rowKey: string;
  studentId: string;
  fullName: string;
  englishName?: string;
  photo?: string;
  gender: string;
  dob?: string;
  level: string;
  totalScore: number | null;
  totalScoreDisplay: string;
  average: number | null;
  averageDisplay: string;
  rank: number | null;
  rankDisplay: string;
  grade: string;
  remarks: string;
  isPassing: boolean;
}

export interface MonthlyResultClassPacket {
  packetKey: string;
  classId: string;
  className: string;
  classCode: string;
  splitLevelLabel?: string;
  shiftLabel: string;
  teacherName: string;
  courseLabel: string;
  bookName: string;
  currentCoeff: number;
  maxTotalScore: number;
  rows: MonthlyResultStudentRow[];
  totalCount: number;
  femaleCount: number;
  scoredCount: number;
  passCount: number;
  failCount: number;
  passRate: string;
  failRate: string;
}

export const A4_PORTRAIT_SPEC = {
  sheetW: '209.6mm',
  sheetH: '296.6mm',
  sheetWPx: 792,
  sheetHPx: 1121,
  pageCss: '@page { size: A4 portrait; margin: 0; }',
};

export type ResultPageLayoutMode = 'fit_one_page' | 'multi_page';

export const MAX_SINGLE_PAGE_RESULT_ROWS = 32;
export const FIRST_PAGE_NO_FOOTER_MAX = 39;
export const CONT_PAGE_NO_FOOTER_MAX = 43;
export const CONT_PAGE_WITH_FOOTER_MAX = 35;

export interface PaginatedResultSlice {
  rowsSlice: MonthlyResultStudentRow[];
  startIndex: number;
  pageIndex: number;
  totalPagesForClass: number;
  isLastPageForClass: boolean;
}

/**
 * Splits class rows across A4 Portrait pages in 'multi_page' mode,
 * or keeps the entire class on 1 single vertically-fitted A4 Portrait page in 'fit_one_page' mode.
 */
export function paginateMonthlyResultRows(
  rows: MonthlyResultStudentRow[],
  layoutMode: ResultPageLayoutMode = 'fit_one_page'
): PaginatedResultSlice[] {
  if (layoutMode === 'fit_one_page' || rows.length <= MAX_SINGLE_PAGE_RESULT_ROWS) {
    return [
      {
        rowsSlice: rows,
        startIndex: 0,
        pageIndex: 0,
        totalPagesForClass: 1,
        isLastPageForClass: true,
      },
    ];
  }

  const slices: { rowsSlice: MonthlyResultStudentRow[]; startIndex: number }[] = [];
  let cursor = 0;

  // Page 1 (full header + table, no footer)
  const firstTake =
    rows.length <= FIRST_PAGE_NO_FOOTER_MAX
      ? Math.max(1, rows.length - 5)
      : FIRST_PAGE_NO_FOOTER_MAX;
  slices.push({ rowsSlice: rows.slice(0, firstTake), startIndex: 0 });
  cursor = firstTake;

  // Continuation pages
  while (cursor < rows.length) {
    const remaining = rows.length - cursor;
    if (remaining <= CONT_PAGE_WITH_FOOTER_MAX) {
      slices.push({ rowsSlice: rows.slice(cursor), startIndex: cursor });
      cursor = rows.length;
    } else if (remaining <= CONT_PAGE_NO_FOOTER_MAX) {
      // Reserve 5 rows so the final footer page is never empty or awkward
      const take = Math.max(1, remaining - 5);
      slices.push({ rowsSlice: rows.slice(cursor, cursor + take), startIndex: cursor });
      cursor += take;
    } else {
      slices.push({
        rowsSlice: rows.slice(cursor, cursor + CONT_PAGE_NO_FOOTER_MAX),
        startIndex: cursor,
      });
      cursor += CONT_PAGE_NO_FOOTER_MAX;
    }
  }

  const total = slices.length;
  return slices.map((s, idx) => ({
    rowsSlice: s.rowsSlice,
    startIndex: s.startIndex,
    pageIndex: idx,
    totalPagesForClass: total,
    isLastPageForClass: idx === total - 1,
  }));
}

const PROXY_ALLOWED_HOSTS = new Set([
  'drive.google.com',
  'drive.usercontent.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'res.cloudinary.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

export function resolveSheetAssetSrc(configuredUrl?: string | null): string {
  const raw = String(configuredUrl || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/') || raw.startsWith('data:')) return raw;
  try {
    const parsed = new URL(raw);
    if (PROXY_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
      return `/api/proxy-image?url=${encodeURIComponent(raw)}`;
    }
  } catch {
    // ignore invalid URL parse and return raw fallback
  }
  return raw;
}

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)] ?? d);
}

export function formatKhmerMonthTitle(monthStr: string, customMonthName?: string): string {
  const custom = String(customMonthName || '').trim();
  if (custom) {
    return custom.startsWith('ខែ') ? `ចំណាត់ថ្នាក់ប្រចាំ ${custom}` : `ចំណាត់ថ្នាក់ប្រចាំ ខែ${custom}`;
  }
  const parts = String(monthStr || '').split('-');
  const mIdx = Number(parts[1] || '1') - 1;
  const khMonth = KHMER_MONTH_NAMES[mIdx] || '';
  return khMonth ? `ចំណាត់ថ្នាក់ប្រចាំ ខែ${khMonth}` : 'ចំណាត់ថ្នាក់ប្រចាំខែ';
}

export function formatDefaultKhmerDate(date?: Date): string {
  const d = date || new Date();
  const day = d.getDate();
  const monthName = KHMER_MONTH_NAMES[d.getMonth()] || KHMER_MONTH_NAMES[0];
  const year = d.getFullYear();
  return `ថ្ងៃទី${toKhmerDigits(String(day).padStart(2, '0'))} ខែ${monthName} ឆ្នាំ${toKhmerDigits(year)}`;
}

function cleanStr(val: any): string {
  return String(val || '').trim();
}

function hasEnteredScore(sr: any): boolean {
  if (!sr) return false;
  const rawTotal = sr.totalScore;
  if (rawTotal === '' || rawTotal === undefined || rawTotal === null) return false;
  const trimmed = String(rawTotal).trim();
  if (!trimmed) return false;
  const num = Number(trimmed);
  return !isNaN(num) && isFinite(num);
}

function isInactiveOrDroppedStudent(st: any): boolean {
  if (!st || st.isDeleted) return true;
  const status = cleanStr(st.status);
  if (!status || status === 'កំពុងសិក្សា') return false;
  const lower = status.toLowerCase();
  if (lower === 'active' || lower === 'studying') return false;

  if (
    status.includes('ឈប់') ||
    status.includes('បោះបង់') ||
    status.includes('ព្យួរ') ||
    status.includes('ផ្អាក') ||
    status.includes('បញ្ចប់') ||
    status.includes('លុប')
  ) {
    return true;
  }

  return (
    lower === 'dropped' ||
    lower === 'dropout' ||
    lower === 'drop out' ||
    lower === 'inactive' ||
    lower === 'suspended' ||
    lower === 'paused' ||
    lower === 'graduated' ||
    lower === 'deleted' ||
    lower === 'removed' ||
    lower === 'left'
  );
}

function resolveShiftLabel(rawShift: string): string {
  const upper = cleanStr(rawShift).toUpperCase();
  if (!upper) return '';
  if (upper.includes('E')) return 'ក្រៅម៉ោង';
  if (upper.includes('FA') || upper.includes('FM') || upper.includes('F')) return 'ពេញម៉ោង';
  return cleanStr(rawShift);
}

function matchBookLevel(bookLevelStr: any, studentLevelStr: any): boolean {
  const bL = cleanStr(bookLevelStr);
  const sL = cleanStr(studentLevelStr);
  if (!bL || !sL) return false;
  if (bL === sL) return true;
  const bNum = bL.match(/\d+/)?.[0];
  const sNum = sL.match(/\d+/)?.[0];
  if (bNum && sNum && bNum === sNum) return true;
  return bL.includes(sL) || sL.includes(bL);
}

function computeRemarksFromGrade(grade: string): string {
  switch (grade) {
    case 'A':
      return 'ល្អប្រសើរ';
    case 'B':
      return 'ល្អ';
    case 'C':
      return 'ល្អបង្គួរ';
    case 'D':
    case 'E':
      return 'មធ្យម';
    case 'F':
      return 'ខ្សោយ';
    default:
      return '';
  }
}

export const UNASSIGNED_RESULT_LEVEL = 'មិនទាន់កំណត់វគ្គ';

export interface ComputePacketParams {
  classObj: any;
  allStudents: any[];
  allTeachers: any[];
  allClasses: any[];
  classScoreRows: any[];
  monthCoeffMap: Record<string, any>;
  scoreSettings: any;
  sortMode: ResultSortMode;
  includeUnscored: boolean;
  levelFilter?: string;
}

export function computeMonthlyResultPacket({
  classObj,
  allStudents,
  allTeachers,
  allClasses,
  classScoreRows,
  monthCoeffMap,
  scoreSettings,
  sortMode,
  includeUnscored,
  levelFilter,
}: ComputePacketParams): MonthlyResultClassPacket {
  const classId = cleanStr(classObj?.id);
  const className = cleanStr(classObj?.className || classObj?.classCode);
  const classCode = cleanStr(classObj?.classCode || classObj?.className);

  // Merge active class students + any score rows for this class
  const studentByKey = new Map<string, any>();
  allStudents.forEach((st) => {
    const stId = cleanStr(st?.id);
    const stCode = cleanStr(st?.studentId);
    if (stId) studentByKey.set(`id:${stId}`, st);
    if (stCode) studentByKey.set(`sid:${stCode}`, st);
  });

  // Authoritative class roster: only students explicitly enrolled in this class (studentIds / legacy studentsData).
  // Never fall back to st.className because st.className can remain stale after removing or moving students across classes.
  const memberIds = new Set<string>(
    Array.isArray(classObj?.studentIds) && classObj.studentIds.length > 0
      ? classObj.studentIds.map((x: any) => cleanStr(x)).filter(Boolean)
      : Array.isArray(classObj?.studentsData) && classObj.studentsData.length > 0
        ? classObj.studentsData.map((x: any) => cleanStr(x?.id)).filter(Boolean)
        : []
  );

  const scoreByStudentKey = new Map<string, any>();
  classScoreRows.forEach((sr) => {
    const sid = cleanStr(sr?.studentId);
    const sdoc = cleanStr(sr?.studentDocId);
    const scode = cleanStr(sr?.studentIdCode);
    const rid = cleanStr(sr?.id);
    const setIfBetter = (key: string) => {
      const existing = scoreByStudentKey.get(key);
      if (!existing || (!cleanStr(existing.level) && cleanStr(sr?.level))) {
        scoreByStudentKey.set(key, sr);
      }
    };
    if (sid) setIfBetter(`id:${sid}`);
    if (sdoc) setIfBetter(`id:${sdoc}`);
    if (scode) setIfBetter(`sid:${scode}`);
    if (rid) setIfBetter(`rid:${rid}`);
  });

  const looksLikeFirestoreDocId = (val: string) => /^[A-Za-z0-9]{18,}$/.test(val);

  const seenStudentIdentity = new Set<string>();
  const allRawEntries: {
    rowKey: string;
    student: any | null;
    scoreRow: any | null;
    studentId: string;
    fullName: string;
    englishName: string;
    photo: string;
    gender: string;
    dob: string;
    level: string;
  }[] = [];

  // 1. Add scored rows first so every entered score is guaranteed to appear.
  // Blank/unscored rows are skipped here so:
  // - When includeUnscored is unchecked, only students with actual entered scores appear.
  // - When includeUnscored is checked, stale blank rows of dropped-out or transferred students do not leak in.
  classScoreRows.forEach((sr, idx) => {
    if (!hasEnteredScore(sr)) return;

    const rawSrStudentId = cleanStr(sr.studentId);
    const rawSrDocId = cleanStr(sr.studentDocId);
    const rawSrCode = cleanStr(sr.studentIdCode);

    const matchedStudent =
      (rawSrStudentId && studentByKey.get(`id:${rawSrStudentId}`)) ||
      (rawSrDocId && studentByKey.get(`id:${rawSrDocId}`)) ||
      (rawSrCode && studentByKey.get(`sid:${rawSrCode}`)) ||
      (rawSrStudentId && studentByKey.get(`sid:${rawSrStudentId}`)) ||
      null;

    const identity =
      cleanStr(matchedStudent?.id) ||
      rawSrStudentId ||
      rawSrCode ||
      cleanStr(sr.id) ||
      `score-${idx}`;
    if (seenStudentIdentity.has(identity)) return;
    seenStudentIdentity.add(identity);
    if (matchedStudent?.id) seenStudentIdentity.add(cleanStr(matchedStudent.id));
    if (matchedStudent?.studentId) seenStudentIdentity.add(cleanStr(matchedStudent.studentId));
    if (rawSrStudentId) seenStudentIdentity.add(rawSrStudentId);
    if (rawSrCode) seenStudentIdentity.add(rawSrCode);

    const resolvedStudentCode =
      cleanStr(matchedStudent?.studentId) ||
      rawSrCode ||
      (rawSrStudentId && !looksLikeFirestoreDocId(rawSrStudentId) ? rawSrStudentId : '');

    const resolvedFullName =
      cleanStr(matchedStudent?.fullName) ||
      cleanStr(sr.fullName) ||
      cleanStr(sr.studentName);

    // Prioritize temporary per-month score-row level override over master student level
    const resolvedLevel = cleanStr(sr.level) || cleanStr(matchedStudent?.level);

    allRawEntries.push({
      rowKey: cleanStr(sr.id) || identity,
      student: matchedStudent,
      scoreRow: sr,
      studentId: resolvedStudentCode,
      fullName: resolvedFullName,
      englishName: cleanStr(matchedStudent?.englishName || sr.englishName),
      photo: cleanStr(matchedStudent?.photo || sr.photo),
      gender: cleanStr(matchedStudent?.gender || sr.gender),
      dob: cleanStr(matchedStudent?.dob || sr.dob),
      level: resolvedLevel,
    });
  });

  // 2. Add remaining active students strictly enrolled in this class if includeUnscored is enabled
  if (includeUnscored) {
    allStudents.forEach((st) => {
      if (isInactiveOrDroppedStudent(st)) return;
      const stDocId = cleanStr(st.id);
      const stCode = cleanStr(st.studentId);
      if (!stDocId || !memberIds.has(stDocId)) return;

      if ((stDocId && seenStudentIdentity.has(stDocId)) || (stCode && seenStudentIdentity.has(stCode))) {
        return;
      }
      if (stDocId) seenStudentIdentity.add(stDocId);
      if (stCode) seenStudentIdentity.add(stCode);

      const sr =
        (stDocId && scoreByStudentKey.get(`id:${stDocId}`)) ||
        (stCode && scoreByStudentKey.get(`sid:${stCode}`)) ||
        null;
      allRawEntries.push({
        rowKey: stDocId || stCode,
        student: st,
        scoreRow: sr,
        studentId: stCode,
        fullName: cleanStr(st.fullName),
        englishName: cleanStr(st.englishName),
        photo: cleanStr(st.photo),
        gender: cleanStr(st.gender),
        dob: cleanStr(st.dob),
        level: cleanStr(sr?.level) || cleanStr(st.level),
      });
    });
  }

  // Optional level filter for split-by-level calculation
  const rawEntries =
    levelFilter !== undefined
      ? allRawEntries.filter((entry) => (entry.level || UNASSIGNED_RESULT_LEVEL) === levelFilter)
      : allRawEntries;

  // Coeff resolution matching scores/page.tsx (supports per-level coeff when split-by-level is active!)
  const savedClassCfg = classId ? monthCoeffMap?.[classId] : null;
  const savedLevelCfg =
    levelFilter !== undefined ? savedClassCfg?.levelCoefficients?.[levelFilter] : null;
  const activeCfg =
    savedLevelCfg && (savedLevelCfg.coefficientType === 'custom' || savedLevelCfg.coefficientType === 'auto')
      ? savedLevelCfg
      : savedClassCfg;
  const hasSavedMonthCoeff =
    activeCfg && (activeCfg.coefficientType === 'custom' || activeCfg.coefficientType === 'auto');
  const coeffType = hasSavedMonthCoeff
    ? activeCfg.coefficientType
    : scoreSettings?.coefficientType === 'custom'
      ? 'custom'
      : 'auto';
  const customMaxScore = hasSavedMonthCoeff
    ? Number(activeCfg.customMaxScore) > 0
      ? Number(activeCfg.customMaxScore)
      : 250
    : Number(scoreSettings?.customMaxScore) > 0
      ? Number(scoreSettings.customMaxScore)
      : 250;

  let currentCoeff = 1;
  let maxTotalScore = 50;
  if (coeffType === 'custom') {
    const c = customMaxScore / 50;
    currentCoeff = c > 0 ? c : 1;
    maxTotalScore = customMaxScore;
  } else {
    const validTotals = rawEntries
      .map((entry) => parseFloat(entry.scoreRow?.totalScore))
      .filter((n) => !isNaN(n) && isFinite(n));
    maxTotalScore = validTotals.length > 0 ? Math.max(...validTotals) : 0;
    if (maxTotalScore <= 0) maxTotalScore = 50;
    const c = (maxTotalScore + 5) / 50;
    currentCoeff = c > 0 ? c : 1;
  }

  const gradeA = Number(scoreSettings?.gradeA) || 90;
  const gradeB = Number(scoreSettings?.gradeB) || 80;
  const gradeC = Number(scoreSettings?.gradeC) || 70;
  const gradeD = Number(scoreSettings?.gradeD) || 60;
  const gradeE = Number(scoreSettings?.gradeE) || 50;

  // Compute score, average, grade, remarks
  const enriched = rawEntries.map((entry) => {
    const hasScore = hasEnteredScore(entry.scoreRow);
    const totalNum = hasScore ? Number(String(entry.scoreRow.totalScore).trim()) : null;
    const avg = totalNum !== null ? totalNum / (currentCoeff > 0 ? currentCoeff : 1) : null;
    const avgPercentage = avg !== null ? (avg / 50) * 100 : null;

    let grade = '';
    if (avgPercentage !== null) {
      if (avgPercentage >= gradeA) grade = 'A';
      else if (avgPercentage >= gradeB) grade = 'B';
      else if (avgPercentage >= gradeC) grade = 'C';
      else if (avgPercentage >= gradeD) grade = 'D';
      else if (avgPercentage >= gradeE) grade = 'E';
      else grade = 'F';
    }

    const remarks = grade ? computeRemarksFromGrade(grade) : '';
    const isPassing = avgPercentage !== null ? avgPercentage >= gradeE : false;

    const totalScoreDisplay =
      totalNum === null
        ? ''
        : Number.isInteger(totalNum)
          ? String(totalNum)
          : String(Number(totalNum.toFixed(2)));

    const averageDisplay =
      avg === null ? '' : avg.toFixed(2);

    return {
      ...entry,
      totalNum,
      avg,
      totalScoreDisplay,
      averageDisplay,
      grade,
      remarks,
      isPassing,
      rank: null as number | null,
    };
  });

  // Assign competition rank across scored rows
  const scoredOnly = enriched.filter((r) => r.avg !== null).sort((a, b) => (b.avg as number) - (a.avg as number));
  let currentRank = 1;
  let lastAvg = -1;
  for (let i = 0; i < scoredOnly.length; i++) {
    const r = scoredOnly[i];
    const avgRounded = Number((r.avg as number).toFixed(6));
    if (avgRounded !== lastAvg) {
      currentRank = i + 1;
      lastAvg = avgRounded;
    }
    r.rank = currentRank;
  }

  // Sort rows for display
  const sorted = [...enriched].sort((a, b) => {
    if (sortMode === 'rank_asc') {
      if (a.rank !== null && b.rank !== null) {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.fullName.localeCompare(b.fullName, 'km');
      }
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return a.fullName.localeCompare(b.fullName, 'km');
    }
    if (sortMode === 'student_id') {
      return a.studentId.localeCompare(b.studentId, 'en', { numeric: true });
    }
    if (sortMode === 'level_name') {
      const lvlCmp = (a.level || 'ZZZ').localeCompare(b.level || 'ZZZ', 'en', { numeric: true });
      if (lvlCmp !== 0) return lvlCmp;
      return a.fullName.localeCompare(b.fullName, 'km');
    }
    return a.fullName.localeCompare(b.fullName, 'km');
  });

  const rows: MonthlyResultStudentRow[] = sorted.map((r) => ({
    rowKey: r.rowKey,
    studentId: r.studentId,
    fullName: r.fullName,
    englishName: r.englishName,
    photo: r.photo,
    gender: r.gender,
    dob: r.dob,
    level: r.level,
    totalScore: r.totalNum,
    totalScoreDisplay: r.totalScoreDisplay,
    average: r.avg,
    averageDisplay: r.averageDisplay,
    rank: r.rank,
    rankDisplay: r.rank !== null ? String(r.rank) : '',
    grade: r.grade,
    remarks: r.remarks,
    isPassing: r.isPassing,
  }));

  // Resolve teacher
  const teacherId = cleanStr(classObj?.teacherId);
  let teacherName = cleanStr(classObj?.teacherName);
  if (!teacherName && teacherId) {
    const tObj = allTeachers.find((t) => cleanStr(t.id) === teacherId || cleanStr(t.teacherId) === teacherId);
    if (tObj) teacherName = cleanStr(tObj.fullName);
  }

  // Resolve dominant shift & level directly from rawEntries
  const shiftCounts = new Map<string, number>();
  const levelCounts = new Map<string, number>();
  rawEntries.forEach((entry) => {
    const sh = resolveShiftLabel(entry.student?.shift || classObj?.shift || '');
    if (sh) shiftCounts.set(sh, (shiftCounts.get(sh) || 0) + 1);
    if (entry.level) levelCounts.set(entry.level, (levelCounts.get(entry.level) || 0) + 1);
  });

  let shiftLabel = resolveShiftLabel(classObj?.shift || '');
  if (!shiftLabel && shiftCounts.size > 0) {
    shiftLabel = Array.from(shiftCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }

  const orderedLevels = Array.from(levelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([lvl]) => lvl);
  const dominantLevel = orderedLevels[0] || '';
  const courseLabel =
    orderedLevels.length > 0
      ? orderedLevels.length === 1
        ? `${orderedLevels[0]}${classCode && classCode !== orderedLevels[0] ? ` (${classCode})` : ''}`
        : `${orderedLevels.slice(0, 3).join(', ')}${classCode ? ` (${classCode})` : ''}`
      : classCode || className;

  // Resolve book name matching scores/page.tsx
  let bookName = '';
  const classBooks = Array.isArray(classObj?.books) ? classObj.books : [];
  if (classBooks.length > 0 && dominantLevel) {
    const matched = classBooks.find((b: any) => matchBookLevel(b?.level || b?.levelId || '', dominantLevel));
    if (matched) bookName = typeof matched === 'string' ? matched : cleanStr(matched.name || matched.title);
  }
  if (!bookName && dominantLevel) {
    for (const otherCls of allClasses) {
      if (!Array.isArray(otherCls?.books)) continue;
      const matched = otherCls.books.find((b: any) => matchBookLevel(b?.level || b?.levelId || '', dominantLevel));
      if (matched) {
        const candidate = typeof matched === 'string' ? matched : cleanStr(matched.name || matched.title);
        if (candidate) {
          bookName = candidate;
          break;
        }
      }
    }
  }
  if (!bookName && classBooks.length > 0) {
    if (classBooks.length === 1) {
      const b = classBooks[0];
      bookName = typeof b === 'string' ? b : cleanStr(b.name || b.title);
    } else {
      bookName = classBooks
        .map((b: any) => (typeof b === 'string' ? b : cleanStr(b.name || b.title)))
        .filter(Boolean)
        .join(', ');
    }
  }

  const totalCount = rows.length;
  const femaleCount = rows.filter(
    (r) => r.gender === 'ស្រី' || r.gender.toLowerCase() === 'female' || r.gender.toLowerCase() === 'f'
  ).length;
  const scoredCount = rows.filter((r) => r.average !== null).length;
  const passCount = rows.filter((r) => r.average !== null && r.isPassing).length;
  const failCount = scoredCount - passCount;
  const passRate = scoredCount > 0 ? ((passCount / scoredCount) * 100).toFixed(2) : '0.00';
  const failRate = scoredCount > 0 ? ((failCount / scoredCount) * 100).toFixed(2) : '0.00';

  return {
    packetKey: levelFilter ? `${classId}__${levelFilter}` : `${classId}__ALL`,
    classId,
    className,
    classCode,
    splitLevelLabel: levelFilter,
    shiftLabel: shiftLabel || 'ពេញម៉ោង',
    teacherName,
    courseLabel,
    bookName,
    currentCoeff,
    maxTotalScore,
    rows,
    totalCount,
    femaleCount,
    scoredCount,
    passCount,
    failCount,
    passRate,
    failRate,
  };
}

/**
 * Produces either 1 packet for the whole class or 1 independent packet per level
 * when split-by-level is active for this class (or explicitly forced in the print modal).
 */
export function computeMonthlyResultPacketsForClass(
  params: Omit<ComputePacketParams, 'levelFilter'>,
  splitBehavior: 'auto' | 'always' | 'never' = 'auto'
): MonthlyResultClassPacket[] {
  const classId = cleanStr(params.classObj?.id);
  const classHasSplitEnabled = Boolean(params.monthCoeffMap?.[classId]?.splitByLevel);
  const shouldSplit =
    splitBehavior === 'always' || (splitBehavior === 'auto' && classHasSplitEnabled);

  if (!shouldSplit) {
    return [computeMonthlyResultPacket(params)];
  }

  // Probe the class once to discover distinct effective levels (including score-row overrides)
  const fullPacket = computeMonthlyResultPacket(params);
  const distinctLevels = Array.from(
    new Set(fullPacket.rows.map((r) => r.level || UNASSIGNED_RESULT_LEVEL))
  ).sort((a, b) => {
    if (a === UNASSIGNED_RESULT_LEVEL) return 1;
    if (b === UNASSIGNED_RESULT_LEVEL) return -1;
    return a.localeCompare(b, 'en', { numeric: true });
  });

  if (distinctLevels.length <= 1) {
    return [fullPacket];
  }

  return distinctLevels.map((lvl) =>
    computeMonthlyResultPacket({
      ...params,
      levelFilter: lvl,
    })
  );
}

/**
 * Built-in red vector official BSIS seal (matches reference stamp cleanly at any DPI)
 */
export function OfficialSchoolStamp({
  stampUrl,
  schoolProfile,
  size = '35mm',
}: {
  stampUrl?: string;
  schoolProfile?: SchoolProfileInfo;
  size?: string;
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const src = resolveSheetAssetSrc(stampUrl);

  React.useEffect(() => {
    setImgFailed(false);
  }, [stampUrl]);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt="School Stamp"
        draggable={false}
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto',
        }}
      />
    );
  }

  const khName = schoolProfile?.schoolFullNameKh || 'សាលាអន្តរជាតិ ប្រេនស្តម';
  const enName = (schoolProfile?.schoolFullNameEn || 'BRAINSTORM INTERNATIONAL SCHOOL').toUpperCase();

  return (
    <svg
      viewBox="0 0 220 220"
      aria-label="BSIS Stamp"
      style={{
        width: size,
        height: size,
        display: 'block',
        margin: '0 auto',
        opacity: 0.9,
      }}
    >
      <defs>
        <path id="bsisStampTopArc" d="M 32,112 A 78,78 0 1,1 188,112" />
        <path id="bsisStampBottomArc" d="M 30,112 A 80,80 0 0,0 190,112" />
      </defs>
      {/* Outer double border */}
      <circle cx="110" cy="110" r="103" fill="none" stroke="#ef4444" strokeWidth="3.2" />
      <circle cx="110" cy="110" r="97" fill="none" stroke="#ef4444" strokeWidth="1.2" />
      {/* Inner circle border */}
      <circle cx="110" cy="110" r="64" fill="none" stroke="#ef4444" strokeWidth="1.6" />
      <circle cx="110" cy="110" r="60" fill="none" stroke="#ef4444" strokeWidth="0.8" />

      {/* Top curved Khmer title */}
      <text
        fill="#ef4444"
        fontSize="14.5"
        fontWeight="700"
        fontFamily="'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif"
      >
        <textPath href="#bsisStampTopArc" startOffset="50%" textAnchor="middle">
          {khName}
        </textPath>
      </text>

      {/* Bottom curved English title */}
      <text
        fill="#ef4444"
        fontSize="9.6"
        fontWeight="700"
        letterSpacing="0.8"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href="#bsisStampBottomArc" startOffset="50%" textAnchor="middle">
          {enName}
        </textPath>
      </text>

      {/* Small stars on sides */}
      <circle cx="37" cy="110" r="2.2" fill="#ef4444" />
      <circle cx="183" cy="110" r="2.2" fill="#ef4444" />

      {/* Inner shield crest + B S I S grid */}
      <path
        d="M84 82 L136 82 L136 116 C136 135 123 147 110 154 C97 147 84 135 84 116 Z"
        fill="#ef4444"
      />
      <line x1="110" y1="84" x2="110" y2="150" stroke="#ffffff" strokeWidth="1.6" />
      <line x1="86" y1="114" x2="134" y2="114" stroke="#ffffff" strokeWidth="1.6" />
      <text x="97" y="105" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">
        B
      </text>
      <text x="123" y="105" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">
        S
      </text>
      <text x="97" y="133" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">
        I
      </text>
      <text x="123" y="133" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif">
        S
      </text>

      {/* Stylized left/right laurel accents */}
      <path
        d="M78 140 C66 131 61 116 64 98 M142 140 C154 131 159 116 156 98"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

/**
 * Top-left Vertical Logo block (`ឡូហ្គោបញ្ឈរ`) supporting pasted URL or stacked crisp school emblem
 */
function VerticalSchoolLogo({
  verticalLogoUrl,
  schoolProfile,
  accentColor,
}: {
  verticalLogoUrl?: string;
  schoolProfile?: SchoolProfileInfo;
  accentColor: string;
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const src = resolveSheetAssetSrc(verticalLogoUrl);

  React.useEffect(() => {
    setImgFailed(false);
  }, [verticalLogoUrl]);

  if (src && !imgFailed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <img
          src={src}
          alt="School Vertical Logo"
          onError={() => setImgFailed(true)}
          style={{
            height: '23mm',
            maxWidth: '56mm',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  const profileLogoSrc = resolveSheetAssetSrc(schoolProfile?.schoolLogoUrl) || '/logo.png';
  const khName = schoolProfile?.schoolFullNameKh || DEFAULT_SCHOOL_PROFILE.schoolFullNameKh;
  const enName = (schoolProfile?.schoolFullNameEn || DEFAULT_SCHOOL_PROFILE.schoolFullNameEn).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '48mm',
        lineHeight: 1.15,
      }}
    >
      <img
        src={profileLogoSrc}
        alt="School Logo"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (!img.dataset.fallback) {
            img.dataset.fallback = '1';
            img.src = '/logo.png';
          }
        }}
        style={{
          width: '13.5mm',
          height: '13.5mm',
          objectFit: 'contain',
          display: 'block',
          marginBottom: '0.8mm',
        }}
      />
      <div
        style={{
          fontSize: '9pt',
          fontWeight: 400,
          color: accentColor,
          fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        {khName}
      </div>
      <div
        style={{
          fontSize: '5.5pt',
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.2px',
          whiteSpace: 'nowrap',
          marginTop: '0.2mm',
        }}
      >
        {enName}
      </div>
    </div>
  );
}

export type MonthlyResultFooterKey =
  | 'issueDate'
  | 'teacherTitle'
  | 'approvalLabel'
  | 'stamp'
  | 'signature'
  | 'signatoryName';

export const MONTHLY_RESULT_FOOTER_LABELS: Record<MonthlyResultFooterKey, string> = {
  issueDate: 'កាលបរិច្ឆេទ (Date)',
  teacherTitle: 'គ្រូបន្ទុកថ្នាក់',
  approvalLabel: 'បានឃើញ និងឯកភាព',
  stamp: 'ត្រាសាលា (Stamp)',
  signature: 'ហត្ថលេខា (Signature)',
  signatoryName: 'ឈ្មោះអ្នកចុះហត្ថលេខា',
};

export interface MonthlyResultElementTransform {
  dxMm: number;
  dyMm: number;
  scale: number;
  fontSizePt?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  opacity?: number;
  rotationDeg?: number;
  visible?: boolean;
}

export interface MonthlyResultFooterLayout {
  stampSizeMm: number;
  stampOpacity?: number;
  stampRotationDeg?: number;
  signatureHeightMm: number;
  signatureColor?: string;
  elements: Partial<Record<MonthlyResultFooterKey, MonthlyResultElementTransform>>;
}

export const DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT: MonthlyResultFooterLayout = {
  stampSizeMm: 35,
  stampOpacity: 0.92,
  stampRotationDeg: 0,
  signatureHeightMm: 10,
  signatureColor: '',
  elements: {},
};

export function normalizeMonthlyResultFooterLayout(
  raw?: Partial<MonthlyResultFooterLayout> | null
): MonthlyResultFooterLayout {
  const src = raw || {};
  const clamp = (val: unknown, fallback: number, min: number, max: number) => {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  const nextElements: Partial<Record<MonthlyResultFooterKey, MonthlyResultElementTransform>> = {};
  if (src.elements && typeof src.elements === 'object') {
    for (const [k, v] of Object.entries(src.elements)) {
      if (!v || typeof v !== 'object') continue;
      const obj = v as Record<string, any>;
      const tr: MonthlyResultElementTransform = {
        dxMm: clamp(obj.dxMm, 0, -180, 180),
        dyMm: clamp(obj.dyMm, 0, -180, 180),
        scale: clamp(obj.scale, 1, 0.45, 2.2),
      };
      if (typeof obj.fontSizePt === 'number' && Number.isFinite(obj.fontSizePt)) {
        tr.fontSizePt = clamp(obj.fontSizePt, 9.2, 5, 24);
      }
      if (typeof obj.fontFamily === 'string' && obj.fontFamily.trim()) {
        tr.fontFamily = obj.fontFamily;
      }
      if (typeof obj.color === 'string' && obj.color.trim()) {
        tr.color = obj.color;
      }
      if (typeof obj.bold === 'boolean') tr.bold = obj.bold;
      if (typeof obj.italic === 'boolean') tr.italic = obj.italic;
      if (typeof obj.opacity === 'number' && Number.isFinite(obj.opacity)) {
        tr.opacity = clamp(obj.opacity, 1, 0.15, 1);
      }
      if (typeof obj.rotationDeg === 'number' && Number.isFinite(obj.rotationDeg)) {
        tr.rotationDeg = clamp(obj.rotationDeg, 0, -45, 45);
      }
      if (typeof obj.visible === 'boolean') tr.visible = obj.visible;
      nextElements[k as MonthlyResultFooterKey] = tr;
    }
  }
  return {
    stampSizeMm: clamp(src.stampSizeMm, DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT.stampSizeMm, 16, 64),
    stampOpacity: clamp(
      src.stampOpacity,
      DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT.stampOpacity ?? 0.92,
      0.15,
      1
    ),
    stampRotationDeg: clamp(
      src.stampRotationDeg,
      DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT.stampRotationDeg ?? 0,
      -45,
      45
    ),
    signatureHeightMm: clamp(
      src.signatureHeightMm,
      DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT.signatureHeightMm,
      5,
      28
    ),
    signatureColor: typeof src.signatureColor === 'string' ? src.signatureColor : '',
    elements: nextElements,
  };
}

const MR_PX_PER_MM = 96 / 25.4;

export interface MonthlyResultSheetProps {
  packet: MonthlyResultClassPacket;
  rowsSlice: MonthlyResultStudentRow[];
  startIndex: number;
  pageIndex: number;
  totalPagesForClass: number;
  isLastPageForClass: boolean;
  monthStr: string;
  customMonthName?: string;
  khmerIssueDate: string;
  theme: ResultColorTheme;
  verticalLogoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  signatoryName?: string;
  approvalLabel?: string;
  teacherTitleLabel?: string;
  showStampAndSignature?: boolean;
  schoolProfile?: SchoolProfileInfo;
  layoutMode?: ResultPageLayoutMode;
  footerLayout?: MonthlyResultFooterLayout;
  interactive?: boolean;
  previewScale?: number;
  selectedFooterElement?: MonthlyResultFooterKey | null;
  onSelectFooterElement?: (key: MonthlyResultFooterKey | null) => void;
  onUpdateFooterElementTransform?: (
    key: MonthlyResultFooterKey,
    next: MonthlyResultElementTransform
  ) => void;
}

export default function MonthlyResultSheet({
  packet,
  rowsSlice,
  startIndex,
  pageIndex,
  totalPagesForClass,
  isLastPageForClass,
  monthStr,
  customMonthName,
  khmerIssueDate,
  theme,
  verticalLogoUrl,
  stampUrl,
  signatureUrl,
  signatoryName = 'សំរិត វឌ្ឍនៈ',
  approvalLabel = 'បានឃើញ និងឯកភាព',
  teacherTitleLabel = 'គ្រូបន្ទុកថ្នាក់',
  showStampAndSignature = true,
  schoolProfile,
  layoutMode = 'fit_one_page',
  footerLayout = DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT,
  interactive = false,
  previewScale = 1,
  selectedFooterElement = null,
  onSelectFooterElement,
  onUpdateFooterElementTransform,
}: MonthlyResultSheetProps) {
  const rowCountOnPage = rowsSlice.length;
  // Slightly tighter, clean row height while keeping Khmer font comfortably readable
  const isCompact = rowCountOnPage > 22;

  const rowHeightMm = isCompact ? 5.35 : 5.8;
  const headerHeightMm = isCompact ? 8.2 : 8.6;
  const bodyFontPt = isCompact ? 9.2 : 9.5;
  const headerFontPt = isCompact ? 9.3 : 9.5;

  const fCfg = footerLayout || DEFAULT_MONTHLY_RESULT_FOOTER_LAYOUT;
  const stampSizeMm = fCfg.stampSizeMm || 35;
  const stampOpacity = fCfg.stampOpacity ?? 0.92;
  const stampRotationDeg = fCfg.stampRotationDeg ?? 0;
  const signatureHeightMm = fCfg.signatureHeightMm || 10;
  const signatureColor = fCfg.signatureColor || theme.signatoryColor;

  // In 'fit_one_page' mode, proportionally scale content by vertical height so the entire list + footer
  // fits cleanly on 1 A4 Portrait sheet, naturally leaving balanced white margins on left & right sides.
  const headerBudgetMm = pageIndex === 0 ? 39 : 13;
  const footerBudgetMm = isLastPageForClass ? (showStampAndSignature ? Math.max(54, stampSizeMm + 21) : 21) : 0;
  const estimatedContentHeightMm =
    headerBudgetMm + headerHeightMm + rowCountOnPage * (rowHeightMm + 0.16) + footerBudgetMm;
  const usablePageHeightMm = 283.5; // 296.6mm - 11mm vertical padding - safety margin
  const fitScale =
    layoutMode === 'fit_one_page' && estimatedContentHeightMm > usablePageHeightMm
      ? Math.max(0.52, usablePageHeightMm / estimatedContentHeightMm)
      : 1;

  const dragStateRef = React.useRef<{
    mode: 'move' | 'resize';
    key: MonthlyResultFooterKey;
    startClientX: number;
    startClientY: number;
    startTransform: MonthlyResultElementTransform;
  } | null>(null);

  const getFooterTransform = React.useCallback(
    (key: MonthlyResultFooterKey): MonthlyResultElementTransform => {
      const t = fCfg.elements?.[key];
      return {
        ...(t || {}),
        dxMm: t?.dxMm ?? 0,
        dyMm: t?.dyMm ?? 0,
        scale: t?.scale ?? 1,
      };
    },
    [fCfg.elements]
  );

  React.useEffect(() => {
    if (!interactive) return;

    const handleMove = (e: MouseEvent) => {
      const st = dragStateRef.current;
      if (!st || !onUpdateFooterElementTransform) return;
      const denom = Math.max(0.2, previewScale * fitScale) * MR_PX_PER_MM;
      const dPxX = e.clientX - st.startClientX;
      const dPxY = e.clientY - st.startClientY;

      if (st.mode === 'move') {
        const nextDx = Number((st.startTransform.dxMm + dPxX / denom).toFixed(1));
        const nextDy = Number((st.startTransform.dyMm + dPxY / denom).toFixed(1));
        onUpdateFooterElementTransform(st.key, {
          ...st.startTransform,
          dxMm: Math.max(-180, Math.min(180, nextDx)),
          dyMm: Math.max(-180, Math.min(180, nextDy)),
        });
      } else {
        const delta = (dPxX + dPxY) / (150 * Math.max(0.25, previewScale * fitScale));
        const nextScale = Number(
          Math.max(0.45, Math.min(2.2, st.startTransform.scale + delta)).toFixed(2)
        );
        onUpdateFooterElementTransform(st.key, {
          ...st.startTransform,
          scale: nextScale,
        });
      }
    };

    const handleUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [interactive, previewScale, fitScale, onUpdateFooterElementTransform]);

  const startFooterDrag = (
    e: React.MouseEvent,
    key: MonthlyResultFooterKey,
    mode: 'move' | 'resize'
  ) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (onSelectFooterElement) onSelectFooterElement(key);
    dragStateRef.current = {
      mode,
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startTransform: getFooterTransform(key),
    };
  };

  const renderMovableFooterBlock = (
    key: MonthlyResultFooterKey,
    baseStyle: React.CSSProperties,
    content: React.ReactNode
  ) => {
    const tr = getFooterTransform(key);
    if (tr.visible === false) return null;
    const isSel = interactive && selectedFooterElement === key;
    const transformParts: string[] = [];
    if (tr.dxMm !== 0 || tr.dyMm !== 0) {
      transformParts.push(`translate(${tr.dxMm}mm, ${tr.dyMm}mm)`);
    }
    if (tr.scale !== 1) {
      transformParts.push(`scale(${tr.scale})`);
    }
    return (
      <div
        key={key}
        data-print-movable="true"
        data-print-no-scale="true"
        onMouseDown={interactive ? (e) => startFooterDrag(e, key, 'move') : undefined}
        style={{
          ...baseStyle,
          ...(tr.fontSizePt !== undefined ? { fontSize: `${tr.fontSizePt}pt` } : {}),
          ...(tr.fontFamily ? { fontFamily: tr.fontFamily } : {}),
          ...(tr.color ? { color: tr.color } : {}),
          ...(tr.bold !== undefined ? { fontWeight: tr.bold ? 700 : 400 } : {}),
          ...(tr.italic !== undefined ? { fontStyle: tr.italic ? 'italic' : 'normal' } : {}),
          ...(tr.opacity !== undefined ? { opacity: tr.opacity } : {}),
          position: baseStyle.position || 'relative',
          zIndex: isSel ? 50 : baseStyle.zIndex,
          transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
          transformOrigin: 'center center',
          cursor: interactive ? 'grab' : undefined,
          userSelect: interactive ? 'none' : undefined,
          WebkitUserSelect: interactive ? 'none' : undefined,
        }}
      >
        {content}
        {interactive && (
          <div
            className="no-print"
            style={{
              position: 'absolute',
              inset: '-1.5px',
              border: isSel ? '1.8px solid #0284c7' : '1px dashed rgba(2, 132, 199, 0.45)',
              borderRadius: '3px',
              background: isSel ? 'rgba(2, 132, 199, 0.06)' : 'transparent',
              pointerEvents: 'none',
              zIndex: 48,
            }}
          />
        )}
        {isSel && (
          <>
            <div
              className="no-print"
              style={{
                position: 'absolute',
                top: '-5.5mm',
                left: 0,
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '6.8pt',
                fontWeight: 700,
                padding: '0.4mm 1.8mm',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 52,
                boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
              }}
            >
              {MONTHLY_RESULT_FOOTER_LABELS[key]} ({Math.round(tr.scale * 100)}%)
            </div>
            <div
              className="no-print"
              title="អូសដើម្បីពង្រីក ឬបង្រួមទំហំ"
              onMouseDown={(e) => startFooterDrag(e, key, 'resize')}
              style={{
                position: 'absolute',
                right: '-2mm',
                bottom: '-2mm',
                width: '4mm',
                height: '4mm',
                borderRadius: '50%',
                background: '#0284c7',
                border: '1.5px solid #ffffff',
                cursor: 'nwse-resize',
                zIndex: 55,
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            />
          </>
        )}
      </div>
    );
  };

  const titleText = formatKhmerMonthTitle(monthStr, customMonthName);

  return (
    <div
      className="receipt-a4-sheet"
      style={{
        width: A4_PORTRAIT_SPEC.sheetW,
        height: A4_PORTRAIT_SPEC.sheetH,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Khmer OS Siemreap', 'Noto Sans Khmer', Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Inner margin wrapper so .receipt-a4-sheet's print padding:0 override leaves exact margins intact */}
      <div
        data-print-page-pad="true"
        style={{
          width: '100%',
          height: '100%',
          padding: '5.5mm 9mm 5.5mm 9mm',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '191.6mm',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            transform: fitScale < 1 ? `scale(${fitScale})` : undefined,
            transformOrigin: 'top center',
          }}
        >
        {pageIndex === 0 ? (
          <>
            {/* Top Row: Vertical Logo (Left, shifted slightly right & 1 line lower than motto) + National Motto (Top-Right) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                minHeight: '26mm',
              }}
            >
              <div
                data-print-section="branding"
                title="ចុចដើម្បីកែឡូហ្គោ ត្រា និងហត្ថលេខា"
                style={{ marginLeft: '7mm', marginTop: '4.8mm' }}
              >
                <VerticalSchoolLogo
                  verticalLogoUrl={verticalLogoUrl}
                  schoolProfile={schoolProfile}
                  accentColor={theme.titleColor}
                />
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: theme.mottoColor,
                  lineHeight: 1.5,
                  paddingTop: '0mm',
                  paddingRight: '2mm',
                }}
              >
                <div
                  style={{
                    fontSize: '10.2pt',
                    fontWeight: 400,
                    fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                  }}
                >
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div
                  style={{
                    fontSize: '9.8pt',
                    fontWeight: 400,
                    fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                  }}
                >
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
              </div>
            </div>

            {/* Center Main Title: tucked cleanly alongside lower part of vertical logo (not dropped below) */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '-10.5mm',
                marginBottom: '2.6mm',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                data-print-heading="true"
                style={{
                  fontSize: '15.5pt',
                  fontWeight: 400,
                  color: theme.titleColor,
                  fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                  letterSpacing: '0.2px',
                }}
              >
                {titleText}
                {totalPagesForClass > 1 && (
                  <span style={{ fontSize: '9.5pt', fontWeight: 400, marginLeft: '2mm', color: theme.metaLabelColor }}>
                    ({pageIndex + 1}/{totalPagesForClass})
                  </span>
                )}
              </div>
            </div>

            {/* 2x2 Metadata Block matching reference layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                rowGap: '0.9mm',
                columnGap: '8mm',
                padding: '0 6mm 2mm 6mm',
                fontSize: '9.4pt',
                color: theme.metaValueColor,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2mm' }}>
                <span style={{ fontWeight: 700, color: theme.metaLabelColor, minWidth: '22mm' }}>វេនសិក្សា :</span>
                <span style={{ fontWeight: 600 }}>{packet.shiftLabel || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2mm', justifyContent: 'flex-start', paddingLeft: '14mm' }}>
                <span style={{ fontWeight: 700, color: theme.metaLabelColor, minWidth: '17mm' }}>វគ្គសិក្សា :</span>
                <span style={{ fontWeight: 700 }}>{packet.courseLabel || packet.classCode || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2mm' }}>
                <span style={{ fontWeight: 700, color: theme.metaLabelColor, minWidth: '22mm' }}>គ្រូបន្ទុកថ្នាក់ :</span>
                <span style={{ fontWeight: 600 }}>{packet.teacherName || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2mm', justifyContent: 'flex-start', paddingLeft: '14mm' }}>
                <span style={{ fontWeight: 700, color: theme.metaLabelColor, minWidth: '17mm' }}>សៀវភៅ</span>
                <span style={{ fontWeight: 600 }}>{packet.bookName || '-'}</span>
              </div>
            </div>
          </>
        ) : (
          /* Compact continuation header for Page 2+ so the list continues cleanly without wasted header height */
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '2.5mm',
              paddingBottom: '1.2mm',
              borderBottom: `1px solid ${theme.cellBorderColor}`,
            }}
          >
            <div
              data-print-heading="true"
              style={{
                fontSize: '12pt',
                fontWeight: 400,
                color: theme.titleColor,
                fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
              }}
            >
              {titleText} (ទំព័រ {pageIndex + 1}/{totalPagesForClass})
            </div>
            <div style={{ fontSize: '9pt', color: theme.metaLabelColor, fontWeight: 600 }}>
              វគ្គសិក្សា៖ {packet.courseLabel || packet.classCode || '-'} • គ្រូបន្ទុកថ្នាក់៖ {packet.teacherName || '-'}
            </div>
          </div>
        )}

        {/* Ranking Table: exact rows matching students in class */}
        <table
          data-pt-tk="monthly-result"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            border: `1.5px solid ${theme.outerBorderColor}`,
            fontSize: `${bodyFontPt}pt`,
          }}
        >
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '11.5%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr
              style={{
                backgroundColor: theme.headerBg,
                color: theme.headerTextColor,
                height: `${headerHeightMm}mm`,
                fontSize: `${headerFontPt}pt`,
              }}
            >
              {[
                'ល.រ',
                'អត្តលេខ',
                'គោត្តនាម និងនាម',
                'ភេទ',
                'ពិន្ទុ',
                'មធ្យមភាគ',
                'ចំណាត់ថ្នាក់',
                'និទ្ទេស',
                'លទ្ធផល',
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    border: `1px solid ${theme.headerBorderColor}`,
                    borderBottom: `1.5px solid ${theme.outerBorderColor}`,
                    padding: '0.6mm 1mm',
                    fontWeight: 700,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    lineHeight: 1.15,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsSlice.length === 0 ? (
              <tr style={{ height: '12mm', backgroundColor: '#ffffff' }}>
                <td
                  colSpan={9}
                  style={{
                    border: `1px solid ${theme.cellBorderColor}`,
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '9.5pt',
                  }}
                >
                  មិនទាន់មានទិន្នន័យសិស្សសម្រាប់ថ្នាក់នេះទេ
                </td>
              </tr>
            ) : (
              rowsSlice.map((row, idx) => {
                const bgColor = idx % 2 === 1 ? theme.oddRowBg : theme.evenRowBg;
                const gradeKey = row.grade as keyof ResultColorTheme['gradeColors'];
                const gradeColor = theme.gradeColors[gradeKey] || '#111827';
                const rowNo = startIndex + idx + 1;

                return (
                  <tr
                    key={row.rowKey}
                    style={{
                      height: `${rowHeightMm}mm`,
                      backgroundColor: bgColor,
                    }}
                  >
                    {/* ល.រ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 700,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {rowNo}
                    </td>
                    {/* អត្តលេខ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 500,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.studentId || '-'}
                    </td>
                    {/* គោត្តនាម និងនាម */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'left',
                        fontWeight: 500,
                        color: theme.nameColor,
                        padding: '0.25mm 1.8mm',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.fullName || '-'}
                    </td>
                    {/* ភេទ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 500,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.gender || '-'}
                    </td>
                    {/* ពិន្ទុ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: theme.scoreColor,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.totalScoreDisplay || '-'}
                    </td>
                    {/* មធ្យមភាគ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: theme.avgColor,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.averageDisplay || '-'}
                    </td>
                    {/* ចំណាត់ថ្នាក់ */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: theme.rankColor,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.rankDisplay || '-'}
                    </td>
                    {/* និទ្ទេស */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 800,
                        color: gradeColor,
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.grade || '-'}
                    </td>
                    {/* លទ្ធផល */}
                    <td
                      style={{
                        border: `1px solid ${theme.cellBorderColor}`,
                        textAlign: 'center',
                        fontWeight: 500,
                        color: row.grade === 'F' ? '#b91c1c' : '#111827',
                        padding: '0.25mm 0.8mm',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.remarks || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer Section (Summary Stats + Stamp + Signatures) on Last Page for Class */}
        {isLastPageForClass && (
          <div
            style={{
              marginTop: '3mm',
              paddingLeft: '4mm',
              paddingRight: '4mm',
            }}
          >
            {/* Top Footer Row: Summary Stats (Left) + Khmer Date & Homeroom Teacher (Right) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '6mm',
              }}
            >
              <div
                style={{
                  fontSize: '9.2pt',
                  lineHeight: 1.5,
                  color: '#0f172a',
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  ~បញ្ឈប់បញ្ជីត្រឹមចំនួនសិស្ស {packet.totalCount} នាក់ &nbsp;ស្រី {packet.femaleCount} នាក់
                </div>
                <div style={{ paddingLeft: '1.5mm', fontWeight: 500 }}>
                  ~លើមធ្យមភាគ {packet.passCount} នាក់ &nbsp;ភាគរយ {packet.passRate}%
                </div>
                <div style={{ paddingLeft: '1.5mm', fontWeight: 500 }}>
                  ~ក្រោមមធ្យមភាគ {packet.failCount} នាក់ &nbsp;ភាគរយ {packet.failRate}%
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  minWidth: '58mm',
                  paddingTop: '0.5mm',
                  fontSize: '9.2pt',
                  color: '#0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5mm',
                }}
              >
                {renderMovableFooterBlock(
                  'issueDate',
                  { fontWeight: 600, whiteSpace: 'nowrap', zIndex: 8 },
                  <>{khmerIssueDate}</>
                )}
                {renderMovableFooterBlock(
                  'teacherTitle',
                  { fontWeight: 700, whiteSpace: 'nowrap', zIndex: 8 },
                  <>{teacherTitleLabel}</>
                )}
              </div>
            </div>

            {/* Bottom Footer Row: Independently Movable Approval, Official Stamp (3.5cm), Signature & Signatory Name */}
            {showStampAndSignature && (
              <div
                style={{
                  marginTop: '1.2mm',
                  marginLeft: '-2mm',
                  width: '64mm',
                  textAlign: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {renderMovableFooterBlock(
                  'approvalLabel',
                  {
                    fontSize: '8.8pt',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '-2.5mm',
                    zIndex: 9,
                    whiteSpace: 'nowrap',
                  },
                  <>{approvalLabel}</>
                )}

                <div
                  style={{
                    position: 'relative',
                    width: '60mm',
                    height: `${Math.max(26, stampSizeMm * 0.85)}mm`,
                    overflow: 'visible',
                  }}
                >
                  {renderMovableFooterBlock(
                    'stamp',
                    {
                      position: 'absolute',
                      left: '2mm',
                      top: '50%',
                      marginTop: `${-(stampSizeMm / 2)}mm`,
                      width: `${stampSizeMm}mm`,
                      height: `${stampSizeMm}mm`,
                      zIndex: 4,
                    },
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        opacity: stampOpacity,
                        transform: stampRotationDeg ? `rotate(${stampRotationDeg}deg)` : undefined,
                        pointerEvents: 'none',
                      }}
                    >
                      <OfficialSchoolStamp
                        stampUrl={stampUrl}
                        schoolProfile={schoolProfile}
                        size={`${stampSizeMm}mm`}
                      />
                    </div>
                  )}

                  {/* Signature layered gracefully across lower-right portion of stamp, independently movable */}
                  {renderMovableFooterBlock(
                    'signature',
                    {
                      position: 'absolute',
                      left: '24mm',
                      bottom: '0mm',
                      width: '32mm',
                      minHeight: `${Math.max(8, signatureHeightMm)}mm`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    },
                    <ReceiptSignature
                      signatureUrl={signatureUrl}
                      height={`${signatureHeightMm}mm`}
                      color={signatureColor}
                    />
                  )}
                </div>

                {signatoryName &&
                  renderMovableFooterBlock(
                    'signatoryName',
                    {
                      marginTop: '0.5mm',
                      marginLeft: '14mm',
                      fontSize: '9.8pt',
                      fontWeight: 400,
                      color: theme.signatoryColor,
                      fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                      zIndex: 11,
                      whiteSpace: 'nowrap',
                    },
                    <>{signatoryName}</>
                  )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
