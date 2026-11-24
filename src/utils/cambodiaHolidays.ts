export interface CambodiaHoliday {
  khName: string;
  enName: string;
}

export interface AttendanceCalendarDay {
  day: number;
  weekdayIdx: number; // 0 = Sun ... 6 = Sat
  weekdayShort: string;
  isSat: boolean;
  isSun: boolean;
  isWeekend: boolean;
  holidayName: string | null;
  holidayEnName: string | null;
  isHoliday: boolean;
}

export const ENGLISH_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const KHMER_MONTH_NAMES = [
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

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Fixed Cambodia Public Holidays (MM-DD)
const FIXED_CAMBODIA_HOLIDAYS: Record<string, CambodiaHoliday> = {
  '01-01': { khName: 'ទិវាចូលឆ្នាំសកល', enName: 'International New Year' },
  '01-07': { khName: 'ទិវាជ័យជម្នះ ៧ មករា', enName: 'Victory over Genocide Day' },
  '03-08': { khName: 'ទិវានារីអន្តរជាតិ', enName: "International Women's Day" },
  '05-01': { khName: 'ទិវាពលកម្មអន្តរជាតិ', enName: 'International Labor Day' },
  '05-14': { khName: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះមហាក្សត្រ', enName: "King's Birthday" },
  '06-18': { khName: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះវររាជមាតាជាតិខ្មែរ', enName: "Queen Mother's Birthday" },
  '09-24': { khName: 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ', enName: 'Constitutional Day' },
  '10-15': { khName: 'ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធព្រះបរមរតនកោដ្ឋ', enName: 'Commemoration of King Father' },
  '10-29': { khName: 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ', enName: "King's Coronation Day" },
  '11-09': { khName: 'បុណ្យឯករាជ្យជាតិ', enName: 'Independence Day' },
  '12-29': { khName: 'ទិវាសន្តិភាពនៅកម្ពុជា', enName: 'Peace Day in Cambodia' },
};

// Year-specific Khmer New Year & Lunar Public Holidays (2025-2029)
const LUNAR_AND_YEAR_HOLIDAYS: Record<number, Record<string, CambodiaHoliday>> = {
  2025: {
    '02-12': { khName: 'ពិធីបុណ្យមាឃបូជា', enName: 'Meak Bochea Day' },
    '04-14': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-15': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-16': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '05-11': { khName: 'ពិធីបុណ្យវិសាខបូជា', enName: 'Visak Bochea Day' },
    '05-15': { khName: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', enName: 'Royal Ploughing Ceremony' },
    '09-21': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '09-22': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '09-23': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '11-04': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-05': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-06': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
  },
  2026: {
    '02-02': { khName: 'ពិធីបុណ្យមាឃបូជា', enName: 'Meak Bochea Day' },
    '04-14': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-15': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-16': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '05-01': { khName: 'ទិវាពលកម្មអន្តរជាតិ & វិសាខបូជា', enName: 'Labor Day & Visak Bochea' },
    '05-05': { khName: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', enName: 'Royal Ploughing Ceremony' },
    '10-10': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '10-11': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '10-12': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '11-23': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-24': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-25': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
  },
  2027: {
    '02-21': { khName: 'ពិធីបុណ្យមាឃបូជា', enName: 'Meak Bochea Day' },
    '04-14': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-15': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-16': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '05-20': { khName: 'ពិធីបុណ្យវិសាខបូជា', enName: 'Visak Bochea Day' },
    '05-24': { khName: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', enName: 'Royal Ploughing Ceremony' },
    '09-29': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '09-30': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '10-01': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '11-13': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-14': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-15': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
  },
  2028: {
    '02-10': { khName: 'ពិធីបុណ្យមាឃបូជា', enName: 'Meak Bochea Day' },
    '04-13': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-14': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-15': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '05-08': { khName: 'ពិធីបុណ្យវិសាខបូជា', enName: 'Visak Bochea Day' },
    '05-12': { khName: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', enName: 'Royal Ploughing Ceremony' },
    '09-17': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '09-18': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '09-19': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '11-01': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-02': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-03': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
  },
  2029: {
    '01-29': { khName: 'ពិធីបុណ្យមាឃបូជា', enName: 'Meak Bochea Day' },
    '04-14': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-15': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '04-16': { khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ', enName: 'Khmer New Year' },
    '05-27': { khName: 'ពិធីបុណ្យវិសាខបូជា', enName: 'Visak Bochea Day' },
    '05-31': { khName: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', enName: 'Royal Ploughing Ceremony' },
    '10-06': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '10-07': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '10-08': { khName: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', enName: 'Pchum Ben' },
    '11-20': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-21': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
    '11-22': { khName: 'ព្រះរាជពិធីបុណ្យអុំទូក', enName: 'Water Festival' },
  },
};

export function getCambodiaHolidaysForMonth(
  year: number,
  month: number // 1..12
): Record<number, CambodiaHoliday> {
  const result: Record<number, CambodiaHoliday> = {};
  const mm = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  const yearSpecific = LUNAR_AND_YEAR_HOLIDAYS[year] || {};

  // Fallback Khmer New Year for years outside explicit table
  const hasExplicitKny = Boolean(LUNAR_AND_YEAR_HOLIDAYS[year]);

  for (let day = 1; day <= daysInMonth; day++) {
    const dd = String(day).padStart(2, '0');
    const key = `${mm}-${dd}`;
    if (yearSpecific[key]) {
      result[day] = yearSpecific[key];
    } else if (FIXED_CAMBODIA_HOLIDAYS[key]) {
      result[day] = FIXED_CAMBODIA_HOLIDAYS[key];
    } else if (!hasExplicitKny && month === 4 && day >= 14 && day <= 16) {
      result[day] = {
        khName: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ',
        enName: 'Khmer New Year',
      };
    }
  }

  return result;
}

export function getMonthCalendarDays(
  year: number,
  month: number,
  extraHolidayDays: number[] = []
): AttendanceCalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = getCambodiaHolidaysForMonth(year, month);
  const extraSet = new Set(extraHolidayDays.filter((d) => Number.isInteger(d) && d >= 1 && d <= daysInMonth));

  const days: AttendanceCalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(year, month - 1, day);
    const weekdayIdx = dt.getDay();
    const isSat = weekdayIdx === 6;
    const isSun = weekdayIdx === 0;
    const official = holidays[day];
    const isExtra = extraSet.has(day);

    days.push({
      day,
      weekdayIdx,
      weekdayShort: WEEKDAY_SHORT[weekdayIdx] || '',
      isSat,
      isSun,
      isWeekend: isSat || isSun,
      holidayName: official ? official.khName : isExtra ? 'ថ្ងៃឈប់សម្រាកពិសេស' : null,
      holidayEnName: official ? official.enName : isExtra ? 'School Holiday' : null,
      isHoliday: Boolean(official) || isExtra,
    });
  }

  return days;
}

export function extractEnrollDayNumber(enrollDate?: string): string {
  if (!enrollDate) return '';
  const trimmed = String(enrollDate).trim();
  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return String(parseInt(isoMatch[3], 10));
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) return String(parseInt(dmyMatch[1], 10));
  // Bare day number
  if (/^\d{1,2}$/.test(trimmed)) return String(parseInt(trimmed, 10));
  return '';
}

export function computeClassLevelCounts(
  students: any[]
): { level: string; count: number }[] {
  const counts = new Map<string, number>();
  students.forEach((s) => {
    const lvl = String(s?.level || '-').trim() || '-';
    counts.set(lvl, (counts.get(lvl) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => a.level.localeCompare(b.level, 'en', { numeric: true }));
}
