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
  gender: string;
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
  classId: string;
  className: string;
  classCode: string;
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

export const MAX_SINGLE_PAGE_RESULT_ROWS = 36;
export const MULTI_PAGE_CHUNK_ROWS = 32;

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
}: ComputePacketParams): MonthlyResultClassPacket {
  const classId = cleanStr(classObj?.id);
  const className = cleanStr(classObj?.className || classObj?.classCode);
  const classCode = cleanStr(classObj?.classCode || classObj?.className);

  // Coeff resolution matching scores/page.tsx (including (maxTotalScore + 5) / 50 in auto mode!)
  const savedCoeffCfg = classId ? monthCoeffMap?.[classId] : null;
  const hasSavedMonthCoeff =
    savedCoeffCfg && (savedCoeffCfg.coefficientType === 'custom' || savedCoeffCfg.coefficientType === 'auto');
  const coeffType = hasSavedMonthCoeff
    ? savedCoeffCfg.coefficientType
    : scoreSettings?.coefficientType === 'custom'
      ? 'custom'
      : 'auto';
  const customMaxScore = hasSavedMonthCoeff
    ? Number(savedCoeffCfg.customMaxScore) > 0
      ? Number(savedCoeffCfg.customMaxScore)
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
    const validTotals = classScoreRows
      .map((s) => parseFloat(s?.totalScore))
      .filter((n) => !isNaN(n) && isFinite(n));
    maxTotalScore = validTotals.length > 0 ? Math.max(...validTotals) : 0;
    if (maxTotalScore <= 0) maxTotalScore = 50;
    const c = (maxTotalScore + 5) / 50;
    currentCoeff = c > 0 ? c : 1;
  }

  // Merge active class students + any score rows for this class
  const studentByKey = new Map<string, any>();
  allStudents.forEach((st) => {
    if (st?.id) studentByKey.set(`id:${cleanStr(st.id)}`, st);
    if (st?.studentId) studentByKey.set(`sid:${cleanStr(st.studentId)}`, st);
  });

  const memberIds = new Set<string>(
    Array.isArray(classObj?.studentIds)
      ? classObj.studentIds.map((x: any) => cleanStr(x))
      : Array.isArray(classObj?.studentsData)
        ? classObj.studentsData.map((x: any) => cleanStr(x?.id))
        : []
  );

  const scoreByStudentKey = new Map<string, any>();
  classScoreRows.forEach((sr) => {
    if (sr?.studentId) scoreByStudentKey.set(`id:${cleanStr(sr.studentId)}`, sr);
    if (sr?.studentIdCode) scoreByStudentKey.set(`sid:${cleanStr(sr.studentIdCode)}`, sr);
    if (sr?.id) scoreByStudentKey.set(`rid:${cleanStr(sr.id)}`, sr);
  });

  const looksLikeFirestoreDocId = (val: string) => /^[A-Za-z0-9]{18,}$/.test(val);

  const seenStudentIdentity = new Set<string>();
  const rawEntries: {
    rowKey: string;
    student: any | null;
    scoreRow: any | null;
    studentId: string;
    fullName: string;
    gender: string;
    level: string;
  }[] = [];

  // 1. Add scored rows first so every entered score is guaranteed to appear
  classScoreRows.forEach((sr, idx) => {
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

    rawEntries.push({
      rowKey: cleanStr(sr.id) || identity,
      student: matchedStudent,
      scoreRow: sr,
      studentId: resolvedStudentCode,
      fullName: resolvedFullName,
      gender: cleanStr(matchedStudent?.gender || sr.gender),
      level: cleanStr(matchedStudent?.level || sr.level),
    });
  });

  // 2. Add remaining active students in this class if includeUnscored is enabled
  if (includeUnscored) {
    allStudents.forEach((st) => {
      if (!st || st.status === 'ឈប់រៀន') return;
      const stDocId = cleanStr(st.id);
      const stCode = cleanStr(st.studentId);
      const stCls = cleanStr(st.className);
      const inClass =
        (stDocId && memberIds.has(stDocId)) ||
        (stCls && (stCls === className || (classCode && stCls === classCode)));
      if (!inClass) return;

      if ((stDocId && seenStudentIdentity.has(stDocId)) || (stCode && seenStudentIdentity.has(stCode))) {
        return;
      }
      if (stDocId) seenStudentIdentity.add(stDocId);
      if (stCode) seenStudentIdentity.add(stCode);

      const sr =
        (stDocId && scoreByStudentKey.get(`id:${stDocId}`)) ||
        (stCode && scoreByStudentKey.get(`sid:${stCode}`)) ||
        null;
      rawEntries.push({
        rowKey: stDocId || stCode,
        student: st,
        scoreRow: sr,
        studentId: stCode,
        fullName: cleanStr(st.fullName),
        gender: cleanStr(st.gender),
        level: cleanStr(st.level),
      });
    });
  }

  const gradeA = Number(scoreSettings?.gradeA) || 90;
  const gradeB = Number(scoreSettings?.gradeB) || 80;
  const gradeC = Number(scoreSettings?.gradeC) || 70;
  const gradeD = Number(scoreSettings?.gradeD) || 60;
  const gradeE = Number(scoreSettings?.gradeE) || 50;

  // Compute score, average, grade, remarks
  const enriched = rawEntries.map((entry) => {
    const rawTotal = entry.scoreRow?.totalScore;
    const hasScore = rawTotal !== '' && rawTotal !== undefined && rawTotal !== null && !isNaN(Number(rawTotal));
    const totalNum = hasScore ? Number(rawTotal) : null;
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
    gender: r.gender,
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
    classId,
    className,
    classCode,
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
 * Built-in red vector official BSIS seal (matches reference stamp cleanly at any DPI)
 */
function OfficialSchoolStamp({
  stampUrl,
  schoolProfile,
  size = '27mm',
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
  showStampAndSignature?: boolean;
  schoolProfile?: SchoolProfileInfo;
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
  showStampAndSignature = true,
  schoolProfile,
}: MonthlyResultSheetProps) {
  const rowCountOnPage = rowsSlice.length;
  // Dynamic compact sizing ("ហាប់ណែន ហ្វុងសមល្មម") tuned for A4 Portrait
  const isVeryDense = rowCountOnPage > 29;
  const isMediumDense = rowCountOnPage > 21 && rowCountOnPage <= 29;

  const rowHeightMm = isVeryDense ? 4.85 : isMediumDense ? 5.65 : 6.45;
  const headerHeightMm = isVeryDense ? 8.2 : 9.2;
  const bodyFontPt = isVeryDense ? 8.3 : isMediumDense ? 9.1 : 9.8;
  const headerFontPt = isVeryDense ? 8.8 : 9.6;

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
        style={{
          width: '100%',
          height: '100%',
          padding: '6.5mm 9mm 6mm 9mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Row: Vertical Logo (Left) + National Motto (Right) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minHeight: '22mm',
          }}
        >
          <VerticalSchoolLogo
            verticalLogoUrl={verticalLogoUrl}
            schoolProfile={schoolProfile}
            accentColor={theme.titleColor}
          />

          <div
            style={{
              textAlign: 'center',
              color: theme.mottoColor,
              lineHeight: 1.5,
              paddingTop: '0.8mm',
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

        {/* Center Main Title */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '-2.5mm',
            marginBottom: '2.2mm',
          }}
        >
          <div
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
            rowGap: '1mm',
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

        {/* Ranking Table: exact rows matching students in class */}
        <table
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
              marginTop: isVeryDense ? '2mm' : '3.2mm',
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
                  fontSize: isVeryDense ? '8.5pt' : '9.2pt',
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
                  fontSize: isVeryDense ? '8.5pt' : '9.2pt',
                  color: '#0f172a',
                }}
              >
                <div style={{ fontWeight: 600 }}>{khmerIssueDate}</div>
                <div style={{ fontWeight: 700, marginTop: '0.5mm' }}>គ្រូបន្ទុកថ្នាក់</div>
              </div>
            </div>

            {/* Bottom Footer Row: Official Stamp + Approval + Signature + Signatory Name */}
            {showStampAndSignature && (
              <div
                style={{
                  marginTop: isVeryDense ? '0.5mm' : '1.2mm',
                  marginLeft: '-2mm',
                  width: '54mm',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: '8.8pt',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '-3.5mm',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {approvalLabel}
                </div>

                <div style={{ position: 'relative', height: isVeryDense ? '24mm' : '27mm' }}>
                  <OfficialSchoolStamp
                    stampUrl={stampUrl}
                    schoolProfile={schoolProfile}
                    size={isVeryDense ? '24mm' : '27mm'}
                  />

                  {/* Signature layered gracefully across lower-right portion of stamp just like reference */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '56%',
                      bottom: '-1.5mm',
                      transform: 'translateX(-30%)',
                      width: '30mm',
                      zIndex: 3,
                      pointerEvents: 'none',
                    }}
                  >
                    <ReceiptSignature
                      signatureUrl={signatureUrl}
                      height={isVeryDense ? '8.5mm' : '9.5mm'}
                      color={theme.signatoryColor}
                    />
                  </div>
                </div>

                {signatoryName && (
                  <div
                    style={{
                      marginTop: '0.5mm',
                      marginLeft: '14mm',
                      fontSize: '9.8pt',
                      fontWeight: 400,
                      color: theme.signatoryColor,
                      fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                      position: 'relative',
                      zIndex: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {signatoryName}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
