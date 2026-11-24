"use client";

import React from 'react';
import {
  AttendanceCalendarDay,
  ENGLISH_MONTH_NAMES,
  KHMER_MONTH_NAMES,
  computeClassLevelCounts,
  extractEnrollDayNumber,
  getMonthCalendarDays,
} from '@/utils/cambodiaHolidays';

export type AttendancePrintLayoutMode =
  | 'auto_a4_portrait'
  | 'split_a4_portrait'
  | 'combined_a4_portrait'
  | 'split_a4_landscape';

/** Classes with <= 22 active students fit Part 1 + Part 2 cleanly on 1 compact A4 Portrait page. */
export const AUTO_COMBINED_MAX_STUDENTS = 22;

export interface PrintableClassPacket {
  classObj: any;
  students: any[];
  classIndex: number;
}

export interface PrintableAttendanceSheetProps {
  packet: PrintableClassPacket;
  month: number; // 1..12
  year: number;
  layoutMode: AttendancePrintLayoutMode;
  renderPart?: 'combined' | 'part1_only' | 'part2_only';
  showPart1: boolean;
  showPart2: boolean;
  highlightWeekends: boolean;
  highlightHolidays: boolean;
  zebraRows?: boolean;
  fillPageWithBlankRows?: boolean;
  extraHolidayDays: number[];
  extraBlankRows: number;
}

const WEEKEND_HEADER_BG = '#6aa84f';
const WEEKEND_CELL_BG = '#c5e0b4';
const WEEKEND_CELL_ALT_BG = '#b4d69f';
const HOLIDAY_HEADER_BG = '#ea9999';
const HOLIDAY_CELL_BG = '#f4cccc';
const HOLIDAY_CELL_ALT_BG = '#e9b7b7';
const ZEBRA_ROW_BG = '#eceff3';
const DAY_ORANGE_BG = '#e69138';
const MONTH_SAGE_BG = '#d9ead3';
const SCORE_PEACH_BG = '#f9cb9c';

function groupHolidayLegend(days: AttendanceCalendarDay[]): string[] {
  const holidays = days.filter((d) => d.isHoliday && d.holidayName);
  if (holidays.length === 0) return [];

  const grouped: { start: number; end: number; name: string }[] = [];
  holidays.forEach((h) => {
    const last = grouped[grouped.length - 1];
    if (last && last.name === h.holidayName && h.day === last.end + 1) {
      last.end = h.day;
    } else {
      grouped.push({ start: h.day, end: h.day, name: h.holidayName || '' });
    }
  });

  return grouped.map((g) =>
    g.start === g.end
      ? `ថ្ងៃទី ${g.start} (${g.name})`
      : `ថ្ងៃទី ${g.start}-${g.end} (${g.name})`
  );
}

function getDayHeaderBg(
  d: AttendanceCalendarDay,
  highlightWeekends: boolean,
  highlightHolidays: boolean
): string {
  if (highlightHolidays && d.isHoliday) return HOLIDAY_HEADER_BG;
  if (highlightWeekends && d.isWeekend) return WEEKEND_HEADER_BG;
  return '#ffffff';
}

function getDayCellBg(
  d: AttendanceCalendarDay,
  highlightWeekends: boolean,
  highlightHolidays: boolean,
  isZebraAltRow = false
): string {
  if (highlightHolidays && d.isHoliday) {
    return isZebraAltRow ? HOLIDAY_CELL_ALT_BG : HOLIDAY_CELL_BG;
  }
  if (highlightWeekends && d.isWeekend) {
    return isZebraAltRow ? WEEKEND_CELL_ALT_BG : WEEKEND_CELL_BG;
  }
  return isZebraAltRow ? ZEBRA_ROW_BG : '#ffffff';
}

export function getAttendanceSheetSpec(layoutMode: AttendancePrintLayoutMode) {
  const isLandscape = layoutMode === 'split_a4_landscape';
  return {
    isLandscape,
    sheetW: isLandscape ? '296.6mm' : '209.6mm',
    sheetH: isLandscape ? '209.6mm' : '296.6mm',
    sheetWPx: isLandscape ? 1121 : 793.7,
    sheetHPx: isLandscape ? 792 : 1121,
    pageCss: isLandscape
      ? '@page { size: A4 landscape; margin: 0; }'
      : '@page { size: A4 portrait; margin: 0; }',
  };
}

export default function PrintableAttendanceSheet({
  packet,
  month,
  year,
  layoutMode,
  renderPart,
  showPart1,
  showPart2,
  highlightWeekends,
  highlightHolidays,
  zebraRows = true,
  fillPageWithBlankRows = true,
  extraHolidayDays,
  extraBlankRows,
}: PrintableAttendanceSheetProps) {
  const { classObj, students, classIndex } = packet;
  const spec = getAttendanceSheetSpec(layoutMode);
  const isLandscape = spec.isLandscape;
  const effectiveRenderPart =
    renderPart ||
    ((layoutMode === 'combined_a4_portrait' ||
      (layoutMode === 'auto_a4_portrait' && students.length <= AUTO_COMBINED_MAX_STUDENTS)) &&
    showPart1 &&
    showPart2
      ? 'combined'
      : showPart1
        ? 'part1_only'
        : 'part2_only');
  const isCombined = effectiveRenderPart === 'combined';

  const calendarDays = getMonthCalendarDays(year, month, extraHolidayDays);
  const monthNameEn = ENGLISH_MONTH_NAMES[month - 1] || '';
  const monthNameKh = KHMER_MONTH_NAMES[month - 1] || '';
  const roomCode = String(classObj?.classCode || classObj?.className || '').trim() || '-';
  const className = String(classObj?.className || '').trim();
  const shiftLabel = String(classObj?.shift || '').trim();
  const teacherName = String(classObj?.teacherName || '').trim();

  const totalStudents = students.length;
  const femaleCount = students.filter((s) => s?.gender === 'ស្រី').length;
  const levelCounts = computeClassLevelCounts(students);
  const holidayLegendItems = highlightHolidays ? groupHolidayLegend(calendarDays) : [];

  const minBlankCount = Math.max(0, Math.min(20, Number(extraBlankRows || 0)));
  // Full-page blank row fill targets:
  // - Combined A4 Portrait (Part 1 + Part 2 on 1 page): 24 rows per table (48 total)
  // - Split A4 Portrait (single table per page): 48 rows filling page to bottom
  // - Split A4 Landscape (single table per page): 32 rows filling page to bottom
  const fullPageTargetRows = isLandscape ? 32 : isCombined ? 24 : 48;
  const desiredRows = fillPageWithBlankRows
    ? Math.max(totalStudents + minBlankCount, fullPageTargetRows)
    : Math.max(1, totalStudents + minBlankCount);
  const actualBlankCount = Math.max(0, desiredRows - totalStudents);
  const totalRowSlots = totalStudents + actualBlankCount;
  const rowSlots: (any | null)[] = [
    ...students,
    ...Array.from({ length: actualBlankCount }, () => null),
  ];

  // Compact ("ហាប់ណែន") row heights engineered to fill A4 cleanly with zero overflow
  const computeRowHeightMm = (isPart2OnSplit = false): number => {
    const availHeightMm = isLandscape
      ? isPart2OnSplit
        ? 166
        : 160
      : isCombined
        ? 119
        : isPart2OnSplit
          ? 250
          : 244;
    const raw = availHeightMm / Math.max(1, totalRowSlots);
    const maxCap = isCombined ? 4.95 : isLandscape ? 5.2 : 5.2;
    const minFloor = 3.55;
    return Number(Math.max(minFloor, Math.min(maxCap, raw)).toFixed(2));
  };

  const part1RowH = computeRowHeightMm(false);
  const part2RowH = computeRowHeightMm(!isCombined);

  const metaFontPt = isLandscape
    ? part1RowH >= 5.4
      ? '7.2pt'
      : '6.6pt'
    : part1RowH >= 5
      ? '6.2pt'
      : '5.8pt';

  const idFontPt = isLandscape
    ? part1RowH >= 5.4
      ? '6.8pt'
      : '6.2pt'
    : part1RowH >= 5
      ? '5.9pt'
      : '5.5pt';

  const nameFontPt = isLandscape
    ? part1RowH >= 5.4
      ? '8.8pt'
      : '8pt'
    : part1RowH >= 5
      ? '8pt'
      : part1RowH >= 4.3
        ? '7.4pt'
        : '6.9pt';

  // Tight metadata columns + generous Student Name column so Khmer names never clip
  const p1Cols = isLandscape
    ? {
        no: '5.2mm',
        shift: '6mm',
        level: '6.8mm',
        id: '11.8mm',
        name: '44mm',
        gender: '6.8mm',
        enroll: '5.8mm',
        totalPX: '6.8mm',
      }
    : {
        no: '4.2mm',
        shift: '4.6mm',
        level: '5.2mm',
        id: '9.4mm',
        name: '31.5mm',
        gender: '5.4mm',
        enroll: '4.7mm',
        totalPX: '5.4mm',
      };

  const renderHeaderBanner = (subtitleLabel?: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2.2mm',
        marginBottom: '0.8mm',
        color: '#000000',
      }}
    >
      {/* Far Left: Logo + School Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm', flexShrink: 0 }}>
        <img
          src="/logo.png"
          alt="BSIS"
          style={{
            width: isLandscape ? '13mm' : '11.5mm',
            height: isLandscape ? '13mm' : '11.5mm',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <div
          style={{
            fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
            fontWeight: 900,
            fontSize: isLandscape ? '8.6pt' : '7.4pt',
            lineHeight: 1.15,
            color: '#000000',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          <div>BRAINSTORM</div>
          <div>INTERNATIONAL</div>
          <div>SCHOOL</div>
        </div>
      </div>

      {/* Room Code + Per-Level Counts (K0: 27, K1: 13...) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3mm',
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
          <div
            style={{
              fontSize: isLandscape ? '12.5pt' : '11pt',
              fontWeight: 900,
              color: '#000000',
              whiteSpace: 'nowrap',
            }}
          >
            {roomCode}
          </div>
          {className && className !== roomCode && (
            <div style={{ fontSize: '6.8pt', color: '#000000', whiteSpace: 'nowrap' }}>
              {className}
            </div>
          )}
        </div>

        {/* Exact vertical level-count breakdown matching reference image */}
        {levelCounts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '1.2mm',
              borderLeft: '0.6pt solid #000000',
              paddingLeft: '2mm',
            }}
          >
            {levelCounts.map((lc) => (
              <div
                key={lc.level}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '4.6mm',
                }}
              >
                <span
                  style={{
                    fontSize: isLandscape ? '8pt' : '7.2pt',
                    fontWeight: 800,
                    color: '#000000',
                    lineHeight: 1.1,
                  }}
                >
                  {lc.count}
                </span>
                <span
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: isLandscape ? '7.8pt' : '7pt',
                    fontWeight: 800,
                    color: '#000000',
                    lineHeight: 1.05,
                    maxHeight: '10mm',
                    overflow: 'hidden',
                    marginTop: '0.5mm',
                  }}
                >
                  {lc.level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center Official Title */}
      <div style={{ textAlign: 'center', flex: 1, minWidth: 0, lineHeight: 1.12 }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: isLandscape ? '13.5pt' : '12pt',
            color: '#000000',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitleLabel ? 'Score List' : 'Attendance List'}
        </div>
        <div
          style={{
            fontFamily: "'Moul', 'Kantumruy Pro', serif",
            fontWeight: 400,
            fontSize: isLandscape ? '12.5pt' : '11.2pt',
            color: '#000000',
            whiteSpace: 'nowrap',
            marginTop: '0.3mm',
          }}
        >
          {subtitleLabel || 'បញ្ជីវត្តមាន'}
        </div>
      </div>

      {/* Shift & Teacher Info */}
      <div
        style={{
          textAlign: 'center',
          flexShrink: 0,
          lineHeight: 1.2,
          padding: '0 1.5mm',
        }}
      >
        <div
          style={{
            fontSize: isLandscape ? '9.5pt' : '8.5pt',
            fontWeight: 800,
            color: '#000000',
            whiteSpace: 'nowrap',
          }}
        >
          {shiftLabel || 'Fulltime'}
        </div>
        {teacherName && (
          <div
            style={{
              fontSize: isLandscape ? '7.8pt' : '7pt',
              fontWeight: 600,
              color: '#000000',
              whiteSpace: 'nowrap',
              marginTop: '0.4mm',
            }}
          >
            គ្រូ៖ {teacherName}
          </div>
        )}
      </div>

      {/* Right Month Highlight Box */}
      <div
        style={{
          background: MONTH_SAGE_BG,
          border: '0.75pt solid #000000',
          padding: isLandscape ? '2.2mm 5mm' : '1.8mm 3.6mm',
          textAlign: 'center',
          flexShrink: 0,
          minWidth: isLandscape ? '34mm' : '27mm',
          lineHeight: 1.15,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isLandscape ? '11.5pt' : '10.2pt',
            fontWeight: 900,
            color: '#000000',
            whiteSpace: 'nowrap',
          }}
        >
          {monthNameEn}
        </div>
        <div
          style={{
            fontSize: isLandscape ? '7.6pt' : '6.8pt',
            fontWeight: 700,
            color: '#000000',
            whiteSpace: 'nowrap',
          }}
        >
          {monthNameKh} {year}
        </div>
      </div>
    </div>
  );

  const renderPart1Table = () => (
    <div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          border: '1.1pt solid #000000',
          color: '#000000',
          fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
        }}
      >
        <colgroup>
          <col style={{ width: p1Cols.no }} />
          <col style={{ width: p1Cols.shift }} />
          <col style={{ width: p1Cols.level }} />
          <col style={{ width: p1Cols.id }} />
          <col style={{ width: p1Cols.name }} />
          <col style={{ width: p1Cols.gender }} />
          <col style={{ width: p1Cols.enroll }} />
          {calendarDays.map((d) => (
            <col key={`p1-col-${d.day}`} />
          ))}
          <col style={{ width: p1Cols.totalPX }} />
          <col style={{ width: p1Cols.totalPX }} />
        </colgroup>

        <thead>
          {/* Header Row 1: Class No | Total:Total/Female | Orange Day | Sun..Mon | Total */}
          <tr style={{ height: isLandscape ? '7.2mm' : '6.4mm' }}>
            <th
              style={{
                border: '0.6pt solid #000000',
                fontSize: '7.5pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: 0,
              }}
            >
              {classIndex + 1}
            </th>
            <th
              colSpan={5}
              style={{
                border: '0.6pt solid #000000',
                fontSize: isLandscape ? '8.8pt' : '7.8pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: '0 1mm',
                whiteSpace: 'nowrap',
              }}
            >
              Total:{totalStudents}/{femaleCount}
            </th>
            <th
              style={{
                border: '0.6pt solid #000000',
                background: DAY_ORANGE_BG,
                padding: 0,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '7.4pt',
                  fontWeight: 800,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                Day
              </div>
            </th>
            {calendarDays.map((d) => (
              <th
                key={`wd-${d.day}`}
                style={{
                  border: '0.55pt solid #000000',
                  background: getDayHeaderBg(d, highlightWeekends, highlightHolidays),
                  padding: 0,
                  textAlign: 'center',
                  verticalAlign: 'middle',
                }}
                title={d.holidayName || d.weekdayShort}
              >
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: isLandscape ? '7.2pt' : '6.3pt',
                    fontWeight: d.isWeekend || d.isHoliday ? 800 : 600,
                    margin: '0 auto',
                    lineHeight: 1,
                    color: '#000000',
                  }}
                >
                  {d.weekdayShort}
                </div>
              </th>
            ))}
            <th
              colSpan={2}
              style={{
                border: '0.6pt solid #000000',
                fontSize: isLandscape ? '8pt' : '7.2pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: 0,
              }}
            >
              Total
            </th>
          </tr>

          {/* Header Row 2: ល.រ | Shift | Level | ID | RoomCode | ភេទ | ថ្ងៃចូល | 1..31 | P | X */}
          <tr style={{ height: isLandscape ? '7.4mm' : '6.6mm' }}>
            <th style={{ border: '0.6pt solid #000000', padding: 0, textAlign: 'center' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '6.8pt',
                  fontWeight: 800,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                ល.រ
              </div>
            </th>
            <th style={{ border: '0.6pt solid #000000', padding: 0, textAlign: 'center' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '6.8pt',
                  fontWeight: 700,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                Shift
              </div>
            </th>
            <th style={{ border: '0.6pt solid #000000', padding: 0, textAlign: 'center' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '6.8pt',
                  fontWeight: 700,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                Level
              </div>
            </th>
            <th
              style={{
                border: '0.6pt solid #000000',
                fontSize: '7.4pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: 0,
              }}
            >
              ID
            </th>
            <th
              style={{
                border: '0.6pt solid #000000',
                fontSize: isLandscape ? '10.2pt' : '9.2pt',
                fontWeight: 900,
                textAlign: 'center',
                padding: '0 1mm',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {roomCode}
            </th>
            <th style={{ border: '0.6pt solid #000000', padding: 0, textAlign: 'center' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '6.8pt',
                  fontWeight: 800,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                ភេទ
              </div>
            </th>
            <th style={{ border: '0.6pt solid #000000', padding: 0, textAlign: 'center' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '6.6pt',
                  fontWeight: 800,
                  margin: '0 auto',
                  lineHeight: 1,
                }}
              >
                ថ្ងៃចូល
              </div>
            </th>
            {calendarDays.map((d) => (
              <th
                key={`dn-${d.day}`}
                style={{
                  border: '0.55pt solid #000000',
                  background: getDayCellBg(d, highlightWeekends, highlightHolidays),
                  padding: 0,
                  textAlign: 'center',
                  verticalAlign: 'middle',
                }}
              >
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: isLandscape ? '7.2pt' : '6.3pt',
                    fontWeight: 800,
                    margin: '0 auto',
                    lineHeight: 1,
                    color: '#000000',
                  }}
                >
                  {d.day}
                </div>
              </th>
            ))}
            <th
              style={{
                border: '0.6pt solid #000000',
                fontSize: '7.5pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: 0,
              }}
            >
              P
            </th>
            <th
              style={{
                border: '0.6pt solid #000000',
                fontSize: '7.5pt',
                fontWeight: 800,
                textAlign: 'center',
                padding: 0,
              }}
            >
              X
            </th>
          </tr>
        </thead>

        <tbody>
          {rowSlots.map((st, idx) => {
            const isAltRow = zebraRows && idx % 2 === 1;
            const rowBg = isAltRow ? ZEBRA_ROW_BG : '#ffffff';
            return (
              <tr key={`att-row-${idx}`} style={{ height: `${part1RowH}mm`, background: rowBg }}>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: metaFontPt,
                    fontWeight: 400,
                    padding: 0,
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: metaFontPt,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    padding: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {st?.shift || ''}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: metaFontPt,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    padding: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {st?.level || ''}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: idFontPt,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    padding: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {st?.studentId || ''}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'left',
                    fontSize: nameFontPt,
                    fontWeight: 400,
                    letterSpacing: '-0.015em',
                    padding: '0 0.8mm',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {st?.fullName || ''}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: metaFontPt,
                    fontWeight: 400,
                    padding: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st?.gender || ''}
                </td>
                <td
                  style={{
                    border: '0.5pt solid #000000',
                    background: rowBg,
                    textAlign: 'center',
                    fontSize: metaFontPt,
                    fontWeight: 400,
                    padding: 0,
                  }}
                >
                  {st ? extractEnrollDayNumber(st.enrollDate) : ''}
                </td>
                {calendarDays.map((d) => (
                  <td
                    key={`c-${idx}-${d.day}`}
                    style={{
                      border: '0.5pt solid #000000',
                      background: getDayCellBg(d, highlightWeekends, highlightHolidays, isAltRow),
                      padding: 0,
                    }}
                  />
                ))}
                <td style={{ border: '0.5pt solid #000000', background: rowBg, padding: 0 }} />
                <td style={{ border: '0.5pt solid #000000', background: rowBg, padding: 0 }} />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend Strip: Weekend + Cambodia Public Holidays for this Month */}
      <div
        style={{
          marginTop: '1mm',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2.5mm',
          fontSize: isLandscape ? '7.2pt' : '6.4pt',
          color: '#000000',
          lineHeight: 1.3,
        }}
      >
        {highlightWeekends && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1mm', whiteSpace: 'nowrap' }}>
            <span
              style={{
                width: '3mm',
                height: '2.5mm',
                background: WEEKEND_HEADER_BG,
                border: '0.4pt solid #000000',
                display: 'inline-block',
              }}
            />
            <span>សៅរ៍-អាទិត្យ (Sat-Sun)</span>
          </span>
        )}
        {highlightHolidays && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1mm' }}>
            <span
              style={{
                width: '3mm',
                height: '2.5mm',
                background: HOLIDAY_HEADER_BG,
                border: '0.4pt solid #000000',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span>
              ថ្ងៃបុណ្យជាតិកម្ពុជា៖{' '}
              {holidayLegendItems.length > 0
                ? holidayLegendItems.join(' • ')
                : 'គ្មានថ្ងៃបុណ្យជាតិក្នុងខែនេះ'}
            </span>
          </span>
        )}
      </div>
    </div>
  );

  const renderPart2ScoreTable = () => {
    // Score sub-column counts matching screenshot identically:
    // 2 narrow blank cols + 1 Attendance + 5 Homework & Exercise + 6 Quizzes/Dictation/Speaking + 3 Test + 1 Total
    const blankSubCols = [0, 1];
    const hwCols = [0, 1, 2, 3, 4];
    const quizCols = [0, 1, 2, 3, 4, 5];
    const testCols = [0, 1, 2];

    const thickDivider = '1.1pt solid #000000';
    const thinCell = '0.5pt solid #000000';

    return (
      <div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            border: '1.1pt solid #000000',
            color: '#000000',
            fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
          }}
        >
          <colgroup>
            <col style={{ width: p1Cols.no }} />
            <col style={{ width: p1Cols.shift }} />
            <col style={{ width: p1Cols.level }} />
            <col style={{ width: p1Cols.id }} />
            <col style={{ width: p1Cols.name }} />
            <col style={{ width: p1Cols.gender }} />
            <col style={{ width: p1Cols.enroll }} />
            {/* 2 narrow spacer columns */}
            <col style={{ width: isLandscape ? '6.5mm' : '4.5mm' }} />
            <col style={{ width: isLandscape ? '6.5mm' : '4.5mm' }} />
            {/* Attendance (1 col) */}
            <col style={{ width: isLandscape ? '18mm' : '14.5mm' }} />
            {/* Homework & Exercise (5 cols) */}
            {hwCols.map((i) => (
              <col key={`hw-c-${i}`} />
            ))}
            {/* Quizzes, Dictation, Speaking (6 cols) */}
            {quizCols.map((i) => (
              <col key={`qz-c-${i}`} />
            ))}
            {/* Test (3 cols) */}
            {testCols.map((i) => (
              <col key={`ts-c-${i}`} />
            ))}
            {/* Total (1 wide col) */}
            <col style={{ width: isLandscape ? '24mm' : '18mm' }} />
          </colgroup>

          <thead>
            <tr style={{ height: isLandscape ? '7.2mm' : '6.5mm' }}>
              <th
                colSpan={6}
                style={{
                  border: '0.6pt solid #000000',
                  background: SCORE_PEACH_BG,
                  fontSize: isLandscape ? '10.5pt' : '9.2pt',
                  fontWeight: 900,
                  textAlign: 'center',
                  padding: '0 1.2mm',
                  whiteSpace: 'nowrap',
                }}
              >
                SCORE LIST{' '}
                <span style={{ fontFamily: "'Moul', 'Kantumruy Pro', serif", fontWeight: 400 }}>
                  បញ្ជីពិន្ទុ
                </span>
              </th>
              <th
                style={{
                  border: '0.6pt solid #000000',
                  background: SCORE_PEACH_BG,
                  padding: 0,
                }}
              />
              <th style={{ border: '0.6pt solid #000000', padding: 0 }} />
              <th
                style={{
                  border: '0.6pt solid #000000',
                  borderRight: thickDivider,
                  padding: 0,
                }}
              />
              <th
                style={{
                  border: '0.6pt solid #000000',
                  borderLeft: thickDivider,
                  borderRight: thickDivider,
                  fontSize: isLandscape ? '8.5pt' : '7.4pt',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '0 0.5mm',
                  whiteSpace: 'nowrap',
                }}
              >
                Attendance
              </th>
              <th
                colSpan={hwCols.length}
                style={{
                  border: '0.6pt solid #000000',
                  borderLeft: thickDivider,
                  borderRight: thickDivider,
                  fontSize: isLandscape ? '8.5pt' : '7.3pt',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '0 0.5mm',
                  whiteSpace: 'nowrap',
                }}
              >
                Homework &amp; Exercise
              </th>
              <th
                colSpan={quizCols.length}
                style={{
                  border: '0.6pt solid #000000',
                  borderLeft: thickDivider,
                  borderRight: thickDivider,
                  fontSize: isLandscape ? '8.4pt' : '7pt',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '0 0.5mm',
                  whiteSpace: 'nowrap',
                }}
              >
                Quizzes, Dictation , Speaking
              </th>
              <th
                colSpan={testCols.length}
                style={{
                  border: '0.6pt solid #000000',
                  borderLeft: thickDivider,
                  borderRight: thickDivider,
                  fontSize: isLandscape ? '8.5pt' : '7.4pt',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '0 0.5mm',
                  whiteSpace: 'nowrap',
                }}
              >
                Test
              </th>
              <th
                style={{
                  border: '0.6pt solid #000000',
                  borderLeft: thickDivider,
                  fontSize: isLandscape ? '8.5pt' : '7.5pt',
                  fontWeight: 800,
                  textAlign: 'center',
                  padding: '0 0.5mm',
                  whiteSpace: 'nowrap',
                }}
              >
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {rowSlots.map((st, idx) => {
              const isAltRow = zebraRows && idx % 2 === 1;
              const rowBg = isAltRow ? ZEBRA_ROW_BG : '#ffffff';
              return (
                <tr key={`score-row-${idx}`} style={{ height: `${part2RowH}mm`, background: rowBg }}>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'center',
                      fontSize: metaFontPt,
                      fontWeight: 400,
                      padding: 0,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'center',
                      fontSize: metaFontPt,
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      padding: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {st?.shift || ''}
                  </td>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'center',
                      fontSize: metaFontPt,
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      padding: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {st?.level || ''}
                  </td>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'center',
                      fontSize: idFontPt,
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      padding: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {st?.studentId || ''}
                  </td>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'left',
                      fontSize: nameFontPt,
                      fontWeight: 400,
                      letterSpacing: '-0.015em',
                      padding: '0 0.8mm',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {st?.fullName || ''}
                  </td>
                  <td
                    style={{
                      border: thinCell,
                      background: rowBg,
                      textAlign: 'center',
                      fontSize: metaFontPt,
                      fontWeight: 400,
                      padding: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {st?.gender || ''}
                  </td>
                  {/* Blank enroll/spacer cell matching Part 1 */}
                  <td style={{ border: thinCell, background: rowBg, padding: 0 }} />
                  {/* 2 narrow spacer columns */}
                  {blankSubCols.map((bIdx) => (
                    <td
                      key={`sp-${idx}-${bIdx}`}
                      style={{
                        border: thinCell,
                        borderRight: bIdx === 1 ? thickDivider : thinCell,
                        background: rowBg,
                        padding: 0,
                      }}
                    />
                  ))}
                  {/* Attendance */}
                  <td
                    style={{
                      border: thinCell,
                      borderLeft: thickDivider,
                      borderRight: thickDivider,
                      background: rowBg,
                      padding: 0,
                    }}
                  />
                  {/* Homework & Exercise (5 cols) */}
                  {hwCols.map((hIdx) => (
                    <td
                      key={`hw-${idx}-${hIdx}`}
                      style={{
                        border: thinCell,
                        borderLeft: hIdx === 0 ? thickDivider : thinCell,
                        borderRight: hIdx === hwCols.length - 1 ? thickDivider : thinCell,
                        background: rowBg,
                        padding: 0,
                      }}
                    />
                  ))}
                  {/* Quizzes, Dictation, Speaking (6 cols) */}
                  {quizCols.map((qIdx) => (
                    <td
                      key={`qz-${idx}-${qIdx}`}
                      style={{
                        border: thinCell,
                        borderLeft: qIdx === 0 ? thickDivider : thinCell,
                        borderRight: qIdx === quizCols.length - 1 ? thickDivider : thinCell,
                        background: rowBg,
                        padding: 0,
                      }}
                    />
                  ))}
                  {/* Test (3 cols) */}
                  {testCols.map((tIdx) => (
                    <td
                      key={`ts-${idx}-${tIdx}`}
                      style={{
                        border: thinCell,
                        borderLeft: tIdx === 0 ? thickDivider : thinCell,
                        borderRight: tIdx === testCols.length - 1 ? thickDivider : thinCell,
                        background: rowBg,
                        padding: 0,
                      }}
                    />
                  ))}
                  {/* Total */}
                  <td
                    style={{
                      border: thinCell,
                      borderLeft: thickDivider,
                      background: rowBg,
                      padding: 0,
                    }}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Outer A4 container has padding: 0 (so globals.css print reset never strips margins);
  // Inner safe-margin wrapper guarantees 6mm–7mm margins on all 4 sides in Chrome Print!
  const sheetBaseStyle: React.CSSProperties = {
    width: spec.sheetW,
    height: spec.sheetH,
    boxSizing: 'border-box',
    padding: 0,
    background: '#ffffff',
    color: '#000000',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };

  const innerPageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    padding: isLandscape ? '5mm 6mm' : '4.8mm 5.8mm',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2mm',
  };

  // Mode 1: Combined Part 1 + Part 2 on ONE A4 Portrait sheet
  if (effectiveRenderPart === 'combined') {
    return (
      <div className="receipt-a4-sheet" style={sheetBaseStyle}>
        <div style={innerPageStyle}>
          {renderHeaderBanner()}
          {renderPart1Table()}
          <div style={{ marginTop: '0.4mm' }}>{renderPart2ScoreTable()}</div>
        </div>
      </div>
    );
  }

  // Mode 2: Single Part per A4 Sheet
  if (effectiveRenderPart === 'part1_only') {
    return (
      <div className="receipt-a4-sheet" style={sheetBaseStyle}>
        <div style={innerPageStyle}>
          {renderHeaderBanner()}
          {renderPart1Table()}
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-a4-sheet" style={sheetBaseStyle}>
      <div style={innerPageStyle}>
        {renderHeaderBanner('បញ្ជីពិន្ទុ')}
        {renderPart2ScoreTable()}
      </div>
    </div>
  );
}
