"use client";

import React from 'react';
import { ENGLISH_MONTH_NAMES, KHMER_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import ReceiptSignature from '@/components/receipts/ReceiptSignature';
import {
  A4_PORTRAIT_SPEC,
  OfficialSchoolStamp,
  resolveSheetAssetSrc,
  toKhmerDigits,
} from './MonthlyResultSheet';

export type CertificateDocType = 'praise' | 'certificate';
export type CertificatePrintPaperMode = 'a4_two_up' | 'a5_single';

export interface CertificateFramePreset {
  id: string;
  nameKh: string;
  outerColor: string;
  innerColor: string;
  accentColor: string;
  bgTint: string;
  titleColor: string;
  signatoryColor: string;
  swatch: [string, string];
}

export const CERTIFICATE_FRAME_PRESETS: CertificateFramePreset[] = [
  {
    id: 'gold_khmer',
    nameKh: 'មាសក្បាច់ខ្មែរ (Gold)',
    outerColor: '#b45309',
    innerColor: '#d97706',
    accentColor: '#eab308',
    bgTint: '#fffdf7',
    titleColor: '#92400e',
    signatoryColor: '#dc2626',
    swatch: ['#d97706', '#fef3c7'],
  },
  {
    id: 'royal_navy',
    nameKh: 'ខៀវរាជ & មាស (Navy)',
    outerColor: '#1e3a8a',
    innerColor: '#ca8a04',
    accentColor: '#1d4ed8',
    bgTint: '#f8fbff',
    titleColor: '#1e3a8a',
    signatoryColor: '#dc2626',
    swatch: ['#1e3a8a', '#ca8a04'],
  },
  {
    id: 'emerald_heritage',
    nameKh: 'បៃតងមរកត & មាស',
    outerColor: '#065f46',
    innerColor: '#d97706',
    accentColor: '#059669',
    bgTint: '#f7fdf9',
    titleColor: '#065f46',
    signatoryColor: '#b91c1c',
    swatch: ['#065f46', '#d97706'],
  },
  {
    id: 'crimson_prestige',
    nameKh: 'ក្រហមឈាមជ្រូក & មាស',
    outerColor: '#881337',
    innerColor: '#d97706',
    accentColor: '#be123c',
    bgTint: '#fffafa',
    titleColor: '#881337',
    signatoryColor: '#be123c',
    swatch: ['#881337', '#d97706'],
  },
];

export const A5_LANDSCAPE_SPEC = {
  sheetW: '209.6mm',
  sheetH: '148.2mm',
  sheetWPx: 792,
  sheetHPx: 560,
  pageCss: '@page { size: A5 landscape; margin: 0; }',
};

export interface CertificateRecipient {
  uid: string;
  classId: string;
  classCode: string;
  className: string;
  shiftLabel: string;
  teacherName: string;
  studentId: string;
  fullName: string;
  englishName: string;
  gender: string;
  level: string;
  bookName: string;
  rank: number;
  grade: string;
  averageDisplay: string;
  photo: string;
}

export function formatConductedDateDefault(date?: Date): string {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const monShort = (ENGLISH_MONTH_NAMES[d.getMonth()] || 'Jan').slice(0, 3);
  const yyyy = d.getFullYear();
  return `${dd}/${monShort}/${yyyy}`;
}

export function formatIssuedDateDefault(date?: Date): string {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const monFull = ENGLISH_MONTH_NAMES[d.getMonth()] || 'January';
  const yyyy = d.getFullYear();
  return `${dd}-${monFull}-${yyyy}`;
}

export function formatExamLabelsFromMonthStr(monthStr: string, customMonthKhmer?: string): {
  examKhmer: string;
  examEnglish: string;
} {
  const parts = String(monthStr || '').split('-');
  const mIdx = Math.max(0, Math.min(11, Number(parts[1] || '1') - 1));
  const khMonth = KHMER_MONTH_NAMES[mIdx] || KHMER_MONTH_NAMES[0];
  const enMonth = ENGLISH_MONTH_NAMES[mIdx] || ENGLISH_MONTH_NAMES[0];
  const customKh = String(customMonthKhmer || '').trim();
  const examKhmer = customKh
    ? customKh.startsWith('ប្រចាំ')
      ? customKh
      : customKh.startsWith('ខែ')
        ? `ប្រចាំ${customKh}`
        : `ប្រចាំខែ${customKh}`
    : `ប្រចាំខែ${khMonth}`;
  const examEnglish = `The Monthly Exam of ${enMonth}`;
  return { examKhmer, examEnglish };
}

function toEnglishGender(rawGender: string): string {
  const g = String(rawGender || '').trim().toLowerCase();
  if (g === 'ស្រី' || g === 'female' || g === 'f') return 'Female';
  if (g === 'ប្រុស' || g === 'male' || g === 'm') return 'Male';
  return rawGender || '-';
}

/**
 * Vector ornate Khmer/Certificate decorative border frame (`ស៊ុមក្បាច់ជុំវិញ`)
 * Used directly or as automatic fallback when no custom PNG frame link is provided.
 */
function OrnateVectorCertificateFrame({ preset }: { preset: CertificateFramePreset }) {
  const corners = [
    { key: 'tl', x: 0, y: 0, sx: 1, sy: 1 },
    { key: 'tr', x: 1000, y: 0, sx: -1, sy: 1 },
    { key: 'bl', x: 0, y: 707, sx: 1, sy: -1 },
    { key: 'br', x: 1000, y: 707, sx: -1, sy: -1 },
  ];

  return (
    <svg
      viewBox="0 0 1000 707"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Background subtle parchment tint */}
      <rect x="0" y="0" width="1000" height="707" fill={preset.bgTint} />

      {/* Outer heavy ornamental band */}
      <rect
        x="16"
        y="16"
        width="968"
        height="675"
        rx="10"
        fill="none"
        stroke={preset.outerColor}
        strokeWidth="5"
      />
      <rect
        x="24"
        y="24"
        width="952"
        height="659"
        rx="6"
        fill="none"
        stroke={preset.innerColor}
        strokeWidth="2.2"
        strokeDasharray="10 4 3 4"
      />
      {/* Inner hairline border */}
      <rect
        x="33"
        y="33"
        width="934"
        height="641"
        rx="4"
        fill="#ffffff"
        fillOpacity="0.65"
        stroke={preset.outerColor}
        strokeWidth="1.5"
      />

      {/* Four ornate Khmer/baroque corner flourishes */}
      {corners.map((c) => (
        <g
          key={c.key}
          transform={`translate(${c.x}, ${c.y}) scale(${c.sx}, ${c.sy})`}
        >
          {/* Corner diamond & scroll backing */}
          <path
            d="M 14 14 L 118 14 C 90 22, 74 36, 62 50 C 78 36, 98 30, 128 30 M 14 14 L 14 118 C 22 90, 36 74, 50 62 C 36 78, 30 98, 30 128"
            fill="none"
            stroke={preset.outerColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 22 22 C 50 22, 66 38, 72 62 C 48 56, 32 42, 22 22 Z"
            fill={preset.innerColor}
            fillOpacity="0.22"
            stroke={preset.innerColor}
            strokeWidth="2"
          />
          <path
            d="M 18 54 C 42 52, 52 42, 54 18 M 36 86 C 58 78, 78 58, 86 36"
            fill="none"
            stroke={preset.accentColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="29" cy="29" r="5.5" fill={preset.outerColor} />
          <circle cx="29" cy="29" r="2.2" fill="#ffffff" />
          <circle cx="92" cy="24" r="3" fill={preset.innerColor} />
          <circle cx="24" cy="92" r="3" fill={preset.innerColor} />
        </g>
      ))}

      {/* Top and Bottom subtle center crest diamonds */}
      <g transform="translate(500, 24)">
        <polygon points="-24,0 0,-9 24,0 0,9" fill={preset.innerColor} />
        <polygon points="-11,0 0,-4.5 11,0 0,4.5" fill="#ffffff" />
      </g>
      <g transform="translate(500, 683)">
        <polygon points="-24,0 0,-9 24,0 0,9" fill={preset.innerColor} />
        <polygon points="-11,0 0,-4.5 11,0 0,4.5" fill="#ffffff" />
      </g>
    </svg>
  );
}

/**
 * Cambodian Tacteng open-book & twin-scroll flourish placed under the National Motto
 */
function KhmerMottoOrnamentSVG({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 180 22"
      aria-hidden="true"
      style={{
        width: '28mm',
        height: '3.2mm',
        display: 'block',
        margin: '0.35mm auto 0 auto',
      }}
    >
      {/* Left double Khmer scrolls */}
      <path
        d="M 10 14 C 17 8, 26 9, 32 13 C 36 16, 42 15, 44 12 C 42 10, 38 11, 39 14 C 31 19, 19 17, 10 14 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M 46 13 C 53 7, 62 9, 67 13 C 71 16, 76 15, 78 12 C 76 10, 72 11, 73 14 C 66 19, 54 17, 46 13 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Mirrored right double scrolls */}
      <g transform="translate(180, 0) scale(-1, 1)">
        <path
          d="M 10 14 C 17 8, 26 9, 32 13 C 36 16, 42 15, 44 12 C 42 10, 38 11, 39 14 C 31 19, 19 17, 10 14 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 46 13 C 53 7, 62 9, 67 13 C 71 16, 76 15, 78 12 C 76 10, 72 11, 73 14 C 66 19, 54 17, 46 13 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
      {/* Center open book / sacred manuscript emblem */}
      <g transform="translate(82, 2)">
        <path
          d="M 1 3 C 4 1, 7 2, 8 4 C 9 2, 12 1, 15 3 L 15 16 C 12 14, 9 15, 8 17 C 7 15, 4 14, 1 16 Z"
          fill="#ffffff"
          stroke={color}
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <line x1="8" y1="4" x2="8" y2="17" stroke={color} strokeWidth="1.15" />
        <line x1="3" y1="6.5" x2="6.4" y2="7" stroke={color} strokeWidth="0.9" />
        <line x1="3" y1="9.5" x2="6.4" y2="10" stroke={color} strokeWidth="0.9" />
        <line x1="3" y1="12.5" x2="6.4" y2="13" stroke={color} strokeWidth="0.9" />
        <line x1="9.6" y1="7" x2="13" y2="6.5" stroke={color} strokeWidth="0.9" />
        <line x1="9.6" y1="10" x2="13" y2="9.5" stroke={color} strokeWidth="0.9" />
        <line x1="9.6" y1="13" x2="13" y2="12.5" stroke={color} strokeWidth="0.9" />
      </g>
    </svg>
  );
}

function buildScallopedSealPath(cx: number, cy: number, lobes: number, rAvg: number, amp: number): string {
  const steps = lobes * 6;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = rAvg + amp * Math.cos(lobes * theta);
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${pts.join(' ')} Z`;
}

/**
 * Ornate scalloped rank rosette medal with crown, flanking stars, and twin ribbons
 */
function RankRibbonBadgeSVG({
  khRank,
  enRank,
  color,
  sizeMm,
  khFont,
  enFont,
}: {
  khRank: string;
  enRank: string;
  color: string;
  sizeMm: number;
  khFont: string;
  enFont: string;
}) {
  const sealPath = React.useMemo(() => buildScallopedSealPath(60, 52, 20, 44.5, 3.1), []);
  const heightMm = Number((sizeMm * 1.18).toFixed(2));
  const darkEdge = '#991b1b';

  return (
    <svg
      viewBox="0 0 120 142"
      aria-label={`Rank ${enRank}`}
      style={{
        width: `${sizeMm}mm`,
        height: `${heightMm}mm`,
        display: 'block',
        overflow: 'visible',
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        filter: 'drop-shadow(0 1.5px 2px rgba(15, 23, 42, 0.16))',
      }}
    >
      {/* Left Ribbon Tail (Dark crimson backing + vivid inner fill) */}
      <polygon points="36,84 59,92 43,139 30,122 14,132" fill={darkEdge} />
      <polygon points="41,85 55,90 40,134 30,121 19,129" fill={color} fillOpacity="0.88" />

      {/* Right Ribbon Tail (Slightly shorter matching reference badge) */}
      <polygon points="62,92 85,84 104,126 88,118 75,133" fill={darkEdge} />
      <polygon points="66,90 80,85 98,123 87,117 77,128" fill={color} fillOpacity="0.88" />

      {/* Scalloped Outer Rosette */}
      <path d={sealPath} fill={color} />
      {/* Double Inner White Rings */}
      <circle cx="60" cy="52" r="39" fill="none" stroke="#ffffff" strokeWidth="1.9" />
      <circle cx="60" cy="52" r="34.5" fill="#ffffff" />

      {/* Crown + Flanking Stars at Top of White Disc */}
      <g fill={color}>
        <polygon points="48,35 46,26.5 53,31 60,21.5 67,31 74,26.5 72,35" />
        <rect x="48.5" y="36.2" width="23" height="1.5" rx="0.7" />
        <circle cx="46" cy="25.5" r="1.4" />
        <circle cx="60" cy="20.5" r="1.6" />
        <circle cx="74" cy="25.5" r="1.4" />
        {/* Left & Right 5-point stars */}
        <polygon points="38,27 39.2,30 42.4,30.2 39.9,32.1 40.7,35.2 38,33.5 35.3,35.2 36.1,32.1 33.6,30.2 36.8,30" />
        <polygon points="82,27 83.2,30 86.4,30.2 83.9,32.1 84.7,35.2 82,33.5 79.3,35.2 80.1,32.1 77.6,30.2 80.8,30" />
      </g>

      {/* Center Rank Text inside White Rosette */}
      <text
        x="60"
        y="59"
        textAnchor="middle"
        fill={darkEdge}
        fontSize="16"
        fontWeight="700"
        style={{ fontFamily: khFont }}
      >
        លេខ {khRank}
      </text>
      <text
        x="60"
        y="74.5"
        textAnchor="middle"
        fill={color}
        fontSize="9.6"
        fontWeight="700"
        style={{ fontFamily: enFont }}
      >
        Rank {enRank}
      </text>
    </svg>
  );
}

export interface FrameMarginsCm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_CERTIFICATE_MARGINS_CM: FrameMarginsCm = {
  top: 4,
  right: 4,
  bottom: 4,
  left: 4,
};

export type CertElementKey =
  | 'nationalMotto'
  | 'schoolLogo'
  | 'titleBlock'
  | 'rankBadge'
  | 'khmerBody'
  | 'englishBody'
  | 'studentPhoto'
  | 'classMeta'
  | 'stampBlock';

export type CertResizeHandleMode =
  | 'elementScale'
  | 'photoSize'
  | 'photoWidth'
  | 'photoHeight'
  | 'logoSize'
  | 'logoWidth'
  | 'logoHeight'
  | 'stampSize'
  | 'ribbonSize'
  | 'frameSize'
  | 'frameWidth'
  | 'frameHeight';

export const CERT_ELEMENT_LABELS: Record<CertElementKey, string> = {
  nationalMotto: 'បាវចនា (ព្រះរាជាណាចក្រកម្ពុជា)',
  schoolLogo: 'ឡូហ្គោ & ឈ្មោះសាលា',
  titleBlock: 'ចំណងជើងប័ណ្ណ',
  rankBadge: 'រូបបូរ / ចំណាត់ថ្នាក់',
  khmerBody: 'ខ្លឹមសារខ្មែរ (ឆ្វេង)',
  englishBody: 'ខ្លឹមសារអង់គ្លេស (ស្តាំ)',
  studentPhoto: 'ប្រអប់រូបថតសិស្ស',
  classMeta: 'ព័ត៌មានថ្នាក់ & គ្រូ',
  stampBlock: 'ថ្ងៃចុះហត្ថលេខា, ត្រា & ហត្ថលេខា',
};

export interface CertFontOption {
  label: string;
  value: string;
}

export const KHMER_DISPLAY_FONT_OPTIONS: CertFontOption[] = [
  { label: 'អក្សរមូល (Moul / Khmer OS Muol Light)', value: "'Moul', 'Khmer OS Muol Light', serif" },
  { label: 'គូលែន (Koulen)', value: "'Koulen', 'Khmer OS Muol', sans-serif" },
  { label: 'មេតាល់ (Metal)', value: "'Metal', 'Khmer OS Bokor', serif" },
  { label: 'កន្ទ្រុយ ប្រូ (Kantumruy Pro)', value: "'Kantumruy Pro', sans-serif" },
  { label: 'បាត់ដំបង (Battambang)', value: "'Battambang', 'Khmer OS Battambang', serif" },
  { label: 'សៀមរាប (Siemreap)', value: "'Siemreap', 'Khmer OS Siemreap', serif" },
  { label: 'សុវណ្ណភូមិ (Suwannaphum)', value: "'Suwannaphum', serif" },
  { label: 'ហនុមាន (Hanuman)', value: "'Hanuman', serif" },
  { label: 'អក្សរដៃ (Fasthand)', value: "'Fasthand', cursive" },
];

export const KHMER_BODY_FONT_OPTIONS: CertFontOption[] = [
  { label: 'សៀមរាប (Khmer OS Siemreap / Siemreap)', value: "'Siemreap', 'Khmer OS Siemreap', 'Kantumruy Pro', serif" },
  { label: 'កន្ទ្រុយ ប្រូ (Kantumruy Pro - ទំនើប)', value: "'Kantumruy Pro', sans-serif" },
  { label: 'បាត់ដំបង (Battambang)', value: "'Battambang', 'Khmer OS Battambang', serif" },
  { label: 'ហនុមាន (Hanuman)', value: "'Hanuman', serif" },
  { label: 'សុវណ្ណភូមិ (Suwannaphum)', value: "'Suwannaphum', serif" },
  { label: 'ចេនឡា (Chenla)', value: "'Chenla', serif" },
  { label: 'អក្សរមូល (Moul)', value: "'Moul', 'Khmer OS Muol Light', serif" },
];

export const ENGLISH_FONT_OPTIONS: CertFontOption[] = [
  { label: 'Georgia Classic (ផ្លូវការ)', value: "'Georgia', 'Times New Roman', serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Georgia, serif" },
  { label: 'Playfair Display (ប្រណីត)', value: "'Playfair Display', Georgia, serif" },
  { label: 'Cinzel (វិញ្ញាបនបត្រ/ឆ្លាក់)', value: "'Cinzel', Georgia, serif" },
  { label: 'Inter (ទំនើបស្អាត)', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Arial / Helvetica', value: "Arial, Helvetica, sans-serif" },
];

export const RIBBON_COLOR_SWATCHES = [
  { label: 'ទឹកក្រូច-ក្រហម (លំនាំដើម)', color: '#ea580c' },
  { label: 'មាសក្បាច់', color: '#d97706' },
  { label: 'ក្រហម', color: '#dc2626' },
  { label: 'ខៀវរាជ', color: '#1d4ed8' },
  { label: 'បៃតងមរកត', color: '#059669' },
];

export interface CertElementLayout {
  dxMm: number;
  dyMm: number;
  scale: number;
  visible?: boolean;
}

export interface CertificateDesignConfig {
  titleFontPt: number;
  subtitleFontPt: number;
  mottoKhFontPt: number;
  mottoEnFontPt: number;
  mottoColor: string;
  mottoLineHeight: number;
  studentNameKhPt: number;
  studentNameEnPt: number;
  khmerBodyFontPt: number;
  englishBodyFontPt: number;
  bodyLineHeight: number;
  letterSpacingPx: number;
  rowGapMm: number;
  signatoryFontPt: number;
  khmerTitleFont: string;
  khmerBodyFont: string;
  studentNameKhFont: string;
  englishFont: string;
  topLogoUrl: string;
  logoLayoutMode: 'vertical' | 'horizontal';
  logoWidthMm: number;
  logoHeightMm: number;
  showLogoSchoolText: boolean;
  schoolLogoSizeMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  photoRadiusMm: number;
  stampSizeMm: number;
  signatureHeightMm: number;
  showWatermark: boolean;
  watermarkOpacity: number;
  watermarkSizeMm: number;
  rankBadgeStyle: 'ribbon' | 'pill';
  rankRibbonSizeMm: number;
  rankRibbonColor: string;
  frameScaleX: number;
  frameScaleY: number;
  frameOffsetXMm: number;
  frameOffsetYMm: number;
  frameInsetMm: number;
  valueColor: string;
  accentColor: string;
  bodyColor: string;
  showHeaderDivider: boolean;
  showCenterDivider: boolean;
  elements: Record<CertElementKey, CertElementLayout>;
}

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesignConfig = {
  titleFontPt: 15,
  subtitleFontPt: 7.5,
  mottoKhFontPt: 8,
  mottoEnFontPt: 5.5,
  mottoColor: '#0b3be0',
  mottoLineHeight: 1.18,
  studentNameKhPt: 13.2,
  studentNameEnPt: 11.5,
  khmerBodyFontPt: 9.2,
  englishBodyFontPt: 9.1,
  bodyLineHeight: 1.32,
  letterSpacingPx: 0,
  rowGapMm: 1.75,
  signatoryFontPt: 9.8,
  khmerTitleFont: "'Moul', 'Khmer OS Muol Light', serif",
  khmerBodyFont: "'Siemreap', 'Khmer OS Siemreap', 'Kantumruy Pro', serif",
  studentNameKhFont: "'Moul', 'Khmer OS Muol Light', serif",
  englishFont: "'Georgia', 'Times New Roman', serif",
  topLogoUrl: '',
  logoLayoutMode: 'vertical',
  logoWidthMm: 16,
  logoHeightMm: 22,
  showLogoSchoolText: true,
  schoolLogoSizeMm: 12.5,
  photoWidthMm: 22,
  photoHeightMm: 27.5,
  photoRadiusMm: 2.2,
  stampSizeMm: 22,
  signatureHeightMm: 8.5,
  showWatermark: true,
  watermarkOpacity: 0.08,
  watermarkSizeMm: 54,
  rankBadgeStyle: 'ribbon',
  rankRibbonSizeMm: 22,
  rankRibbonColor: '#ea580c',
  frameScaleX: 1,
  frameScaleY: 1,
  frameOffsetXMm: 0,
  frameOffsetYMm: 0,
  frameInsetMm: 0,
  valueColor: '#1d4ed8',
  accentColor: '#dc2626',
  bodyColor: '#111827',
  showHeaderDivider: true,
  showCenterDivider: true,
  elements: {
    nationalMotto: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    schoolLogo: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    titleBlock: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    rankBadge: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    khmerBody: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    englishBody: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    studentPhoto: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    classMeta: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
    stampBlock: { dxMm: 0, dyMm: 0, scale: 1, visible: true },
  },
};

export function normalizeCertificateDesign(
  raw?: Partial<CertificateDesignConfig> | null
): CertificateDesignConfig {
  const baseEl = DEFAULT_CERTIFICATE_DESIGN.elements;
  const rawEl = raw?.elements || ({} as Partial<Record<CertElementKey, CertElementLayout>>);
  const mergedElements = {} as Record<CertElementKey, CertElementLayout>;
  (Object.keys(baseEl) as CertElementKey[]).forEach((key) => {
    const src = rawEl[key];
    mergedElements[key] = {
      dxMm: typeof src?.dxMm === 'number' && Number.isFinite(src.dxMm) ? src.dxMm : 0,
      dyMm: typeof src?.dyMm === 'number' && Number.isFinite(src.dyMm) ? src.dyMm : 0,
      scale: typeof src?.scale === 'number' && Number.isFinite(src.scale) && src.scale > 0 ? src.scale : 1,
      visible: src?.visible !== false,
    };
  });

  return {
    ...DEFAULT_CERTIFICATE_DESIGN,
    ...(raw || {}),
    elements: mergedElements,
  };
}

export function computeCertificateContentMetrics(frameMarginsCm?: FrameMarginsCm) {
  const clampCm = (v: number) => Math.max(0.4, Math.min(5.5, Number.isFinite(v) ? v : 4));
  const mTopMm = clampCm(frameMarginsCm?.top ?? 4) * 10;
  const mRightMm = clampCm(frameMarginsCm?.right ?? 4) * 10;
  const mBottomMm = clampCm(frameMarginsCm?.bottom ?? 4) * 10;
  const mLeftMm = clampCm(frameMarginsCm?.left ?? 4) * 10;

  const cardW = 206.6;
  const cardH = 146.2;
  const safeW = Math.max(40, cardW - mLeftMm - mRightMm);
  const safeH = Math.max(30, cardH - mTopMm - mBottomMm);

  const NATURAL_W = 208;
  const NATURAL_H = 109;
  const contentScale = Math.min(safeW / NATURAL_W, safeH / NATURAL_H);

  return {
    mTopMm,
    mRightMm,
    mBottomMm,
    mLeftMm,
    safeW,
    safeH,
    NATURAL_W,
    NATURAL_H,
    contentScale,
  };
}

export interface CertificateCardProps {
  recipient: CertificateRecipient;
  docType: CertificateDocType;
  framePreset: CertificateFramePreset;
  customFrameUrl?: string;
  frameMarginsCm?: FrameMarginsCm;
  designConfig?: CertificateDesignConfig;
  examKhmer: string;
  examEnglish: string;
  conductedDate: string;
  issuedDate: string;
  showStudentPhoto: boolean;
  stampUrl?: string;
  signatureUrl?: string;
  signatoryName?: string;
  principalTitle?: string;
  schoolProfile?: SchoolProfileInfo;
  editorSelectedKey?: CertElementKey | null;
  editorDraggingKey?: CertElementKey | null;
  frameDragEnabled?: boolean;
  editorDraggingFrame?: boolean;
  showMarginGuide?: boolean;
  onElementPointerDown?: (key: CertElementKey, e: React.PointerEvent) => void;
  onResizeHandlePointerDown?: (
    key: CertElementKey,
    mode: CertResizeHandleMode,
    e: React.PointerEvent
  ) => void;
  onFramePointerDown?: (e: React.PointerEvent) => void;
  onFrameResizePointerDown?: (
    mode: 'frameSize' | 'frameWidth' | 'frameHeight',
    e: React.PointerEvent
  ) => void;
}

/**
 * Single A5 Landscape (209.6mm x 148.2mm) Bilingual Certificate Card
 */
export function CertificateCardA5({
  recipient,
  docType,
  framePreset,
  customFrameUrl,
  frameMarginsCm = DEFAULT_CERTIFICATE_MARGINS_CM,
  designConfig,
  examKhmer,
  examEnglish,
  conductedDate,
  issuedDate,
  showStudentPhoto,
  stampUrl,
  signatureUrl,
  signatoryName = 'សំរិត វឌ្ឍនៈ',
  principalTitle = 'The Principal of BSIS',
  schoolProfile,
  editorSelectedKey = null,
  editorDraggingKey = null,
  frameDragEnabled = false,
  editorDraggingFrame = false,
  showMarginGuide = false,
  onElementPointerDown,
  onResizeHandlePointerDown,
  onFramePointerDown,
  onFrameResizePointerDown,
}: CertificateCardProps) {
  const [customFrameFailed, setCustomFrameFailed] = React.useState(false);
  const [photoFailed, setPhotoFailed] = React.useState(false);
  const [topLogoFailed, setTopLogoFailed] = React.useState(false);

  const design = React.useMemo(() => normalizeCertificateDesign(designConfig), [designConfig]);
  const isEditing = Boolean(onElementPointerDown);

  const frameImgSrc = resolveSheetAssetSrc(customFrameUrl);
  const photoImgSrc = resolveSheetAssetSrc(recipient.photo);
  const customTopLogoSrc = resolveSheetAssetSrc(design.topLogoUrl);

  React.useEffect(() => {
    setCustomFrameFailed(false);
  }, [customFrameUrl]);

  React.useEffect(() => {
    setPhotoFailed(false);
  }, [recipient.photo]);

  React.useEffect(() => {
    setTopLogoFailed(false);
  }, [design.topLogoUrl]);

  const watermarkLogoSrc = resolveSheetAssetSrc(schoolProfile?.schoolLogoUrl) || '/logo.png';
  const hasCustomTopLogo = Boolean(customTopLogoSrc && !topLogoFailed);
  const topLogoSrc = hasCustomTopLogo ? customTopLogoSrc : watermarkLogoSrc;
  const schoolKhName = schoolProfile?.schoolFullNameKh || schoolProfile?.schoolName || DEFAULT_SCHOOL_PROFILE.schoolFullNameKh;
  const schoolEnName = (schoolProfile?.schoolFullNameEn || DEFAULT_SCHOOL_PROFILE.schoolFullNameEn).toUpperCase();

  const bookOrLevelLabel = recipient.bookName || recipient.level || '-';
  const khHeading = docType === 'certificate' ? 'វិញ្ញាបនបត្រ' : 'ប័ណ្ណសរសើរ';
  const enHeading =
    docType === 'certificate' ? 'CERTIFICATE OF ACHIEVEMENT' : 'LETTER OF ADMIRATION';
  const khLeadText =
    docType === 'certificate'
      ? `${schoolProfile?.schoolName || 'សាលាអន្តរជាតិប្រេនស្តម'} សូមផ្តល់វិញ្ញាបនបត្រជូនសិស្ស`
      : `${schoolProfile?.schoolName || 'សាលាអន្តរជាតិប្រេនស្តម'} សូមសរសើរចំពោះសិស្ស`;
  const enLeadText =
    docType === 'certificate'
      ? 'The Director of BSIS awards this certificate'
      : 'The Director of BSIS gives this admirable letter';

  const khRank = recipient.rank > 0 ? toKhmerDigits(recipient.rank) : '-';
  const enRank = recipient.rank > 0 ? String(recipient.rank) : '-';
  const engGender = toEnglishGender(recipient.gender);

  const { mTopMm, mRightMm, mBottomMm, mLeftMm, NATURAL_W, NATURAL_H, contentScale } =
    computeCertificateContentMetrics(frameMarginsCm);

  const getInteractiveProps = (key: CertElementKey, baseStyle?: React.CSSProperties): React.CSSProperties => {
    const el = design.elements[key];
    const isSel = isEditing && editorSelectedKey === key;
    const isDrag = isEditing && editorDraggingKey === key;
    return {
      ...baseStyle,
      position: baseStyle?.position || 'relative',
      zIndex: isEditing ? (isSel ? 50 : 12) : baseStyle?.zIndex,
      transform: `translate(${el.dxMm}mm, ${el.dyMm}mm) scale(${el.scale})`,
      transformOrigin: 'center center',
      ...(isEditing
        ? {
            cursor: isDrag ? 'grabbing' : 'grab',
            outline: isSel ? '2px solid #2563eb' : '1px dashed rgba(37, 99, 235, 0.42)',
            outlineOffset: '1.5mm',
            borderRadius: '2px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            backgroundColor: isSel ? 'rgba(59, 130, 246, 0.08)' : baseStyle?.backgroundColor,
          }
        : {}),
    };
  };

  const renderResizeHandle = (
    key: CertElementKey,
    mode: CertResizeHandleMode,
    placement: 'se' | 'e' | 's' | 'inner-se',
    title: string,
    accentHex = '#2563eb'
  ) => {
    if (!isEditing || editorSelectedKey !== key || !onResizeHandlePointerDown) return null;
    const cursor =
      placement === 'e' ? 'ew-resize' : placement === 's' ? 'ns-resize' : 'nwse-resize';
    const posStyle: React.CSSProperties =
      placement === 'e'
        ? { right: '-2.2mm', top: '50%', transform: 'translateY(-50%)', width: '2.6mm', height: '5.5mm', borderRadius: '999px' }
        : placement === 's'
          ? { bottom: '-2.2mm', left: '50%', transform: 'translateX(-50%)', width: '5.5mm', height: '2.6mm', borderRadius: '999px' }
          : placement === 'inner-se'
            ? { right: '-1.6mm', bottom: '-1.6mm', width: '3.6mm', height: '3.6mm', borderRadius: '999px' }
            : { right: '-2.8mm', bottom: '-2.8mm', width: '4mm', height: '4mm', borderRadius: '1px' };

    return (
      <div
        role="button"
        aria-label={title}
        title={title}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeHandlePointerDown(key, mode, e);
        }}
        style={{
          position: 'absolute',
          ...posStyle,
          background: '#ffffff',
          border: `1.5px solid ${accentHex}`,
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.45)',
          cursor,
          zIndex: 60,
          touchAction: 'none',
        }}
      />
    );
  };

  return (
    <div
      onDragStart={isEditing ? (e) => e.preventDefault() : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Khmer OS Siemreap', 'Noto Sans Khmer', 'Times New Roman', serif",
        userSelect: isEditing ? 'none' : undefined,
        WebkitUserSelect: isEditing ? 'none' : undefined,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Ornate Background Border Frame (Uploaded / Linked Image or Built-in Vector Frame) */}
      <div
        onPointerDown={
          isEditing && frameDragEnabled && onFramePointerDown ? onFramePointerDown : undefined
        }
        style={{
          position: 'absolute',
          top: `${design.frameInsetMm}mm`,
          right: `${design.frameInsetMm}mm`,
          bottom: `${design.frameInsetMm}mm`,
          left: `${design.frameInsetMm}mm`,
          transform: `translate(${design.frameOffsetXMm}mm, ${design.frameOffsetYMm}mm) scale(${design.frameScaleX}, ${design.frameScaleY})`,
          transformOrigin: 'center center',
          pointerEvents: isEditing && frameDragEnabled ? 'auto' : 'none',
          cursor: isEditing && frameDragEnabled ? (editorDraggingFrame ? 'grabbing' : 'move') : 'default',
          outline: isEditing && frameDragEnabled ? '2px dashed #f59e0b' : 'none',
          outlineOffset: '-2mm',
          zIndex: isEditing && frameDragEnabled ? 45 : 1,
          touchAction: 'none',
        }}
      >
        {frameImgSrc && !customFrameFailed ? (
          <img
            src={frameImgSrc}
            alt="Certificate Frame"
            draggable={false}
            onError={() => setCustomFrameFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <OrnateVectorCertificateFrame preset={framePreset} />
        )}

        {isEditing && frameDragEnabled && onFrameResizePointerDown && (
          <>
            <div
              role="button"
              title="ទាញផ្លាស់ប្តូរទទឹងស៊ុម"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFrameResizePointerDown('frameWidth', e);
              }}
              style={{
                position: 'absolute',
                right: '1.5mm',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3.2mm',
                height: '9mm',
                borderRadius: '999px',
                background: '#f59e0b',
                border: '1.5px solid #ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
                cursor: 'ew-resize',
                zIndex: 65,
              }}
            />
            <div
              role="button"
              title="ទាញផ្លាស់ប្តូរកម្ពស់ស៊ុម"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFrameResizePointerDown('frameHeight', e);
              }}
              style={{
                position: 'absolute',
                bottom: '1.5mm',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '9mm',
                height: '3.2mm',
                borderRadius: '999px',
                background: '#f59e0b',
                border: '1.5px solid #ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
                cursor: 'ns-resize',
                zIndex: 65,
              }}
            />
            <div
              role="button"
              title="ទាញពង្រីក/បង្រួមស៊ុមទាំងមូល"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFrameResizePointerDown('frameSize', e);
              }}
              style={{
                position: 'absolute',
                right: '1.8mm',
                bottom: '1.8mm',
                width: '4.6mm',
                height: '4.6mm',
                borderRadius: '2px',
                background: '#f59e0b',
                border: '1.5px solid #ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
                cursor: 'nwse-resize',
                zIndex: 65,
              }}
            />
          </>
        )}
      </div>

      {/* Safe Content Area Respecting Top/Right/Bottom/Left Frame Margins */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          padding: `${mTopMm}mm ${mRightMm}mm ${mBottomMm}mm ${mLeftMm}mm`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: isEditing ? 'visible' : 'hidden',
        }}
      >
        {/* Optional Editor-only 4-side Margin Guide Rectangle */}
        {showMarginGuide && (
          <div
            style={{
              position: 'absolute',
              top: `${mTopMm}mm`,
              right: `${mRightMm}mm`,
              bottom: `${mBottomMm}mm`,
              left: `${mLeftMm}mm`,
              border: '1px dashed rgba(14, 165, 233, 0.7)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        <div
          style={{
            width: `${NATURAL_W}mm`,
            height: `${NATURAL_H}mm`,
            flexShrink: 0,
            position: 'relative',
            transform: `scale(${contentScale})`,
            transformOrigin: 'center center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
        {/* Centered Background Watermark School Logo */}
        {design.showWatermark && watermarkLogoSrc && (
          <img
            src={watermarkLogoSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${design.watermarkSizeMm}mm`,
              height: `${design.watermarkSizeMm}mm`,
              objectFit: 'contain',
              opacity: design.watermarkOpacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Top Header: School Crest / Vertical Logo (Left) + National Motto & Title (Center) + Rank Ribbon Medal (Right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2.5mm',
            borderBottom: design.showHeaderDivider ? `1px solid ${framePreset.innerColor}55` : 'none',
            paddingBottom: '1.4mm',
          }}
        >
          {design.elements.schoolLogo.visible !== false ? (
            design.logoLayoutMode !== 'horizontal' ? (
              <div
                className="cert-inherit-font"
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('schoolLogo', e) : undefined}
                style={getInteractiveProps('schoolLogo', {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.7mm',
                  minWidth: '28mm',
                })}
              >
                <div
                  style={{
                    position: 'relative',
                    width: `${design.logoWidthMm}mm`,
                    height: `${design.logoHeightMm}mm`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={topLogoSrc}
                    alt="School Vertical Logo"
                    draggable={false}
                    onError={() => {
                      if (hasCustomTopLogo) setTopLogoFailed(true);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                  {renderResizeHandle('schoolLogo', 'logoWidth', 'e', 'ទាញផ្លាស់ប្តូរទទឹង Logo', '#d97706')}
                  {renderResizeHandle('schoolLogo', 'logoHeight', 's', 'ទាញផ្លាស់ប្តូរកម្ពស់ Logo', '#d97706')}
                  {renderResizeHandle('schoolLogo', 'logoSize', 'inner-se', 'ទាញផ្លាស់ប្តូរទំហំ Logo', '#d97706')}
                </div>
                {design.showLogoSchoolText && (
                  <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                    <div
                      style={{
                        fontSize: '7.4pt',
                        fontWeight: 400,
                        color: framePreset.titleColor,
                        fontFamily: design.khmerTitleFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {schoolKhName}
                    </div>
                    <div
                      style={{
                        fontSize: '4.9pt',
                        fontWeight: 700,
                        color: framePreset.outerColor,
                        fontFamily: design.englishFont,
                        letterSpacing: '0.25px',
                        whiteSpace: 'nowrap',
                        marginTop: '0.2mm',
                      }}
                    >
                      {schoolEnName}
                    </div>
                  </div>
                )}
                {renderResizeHandle('schoolLogo', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមប្រអប់ឡូហ្គោ')}
              </div>
            ) : (
              <div
                className="cert-inherit-font"
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('schoolLogo', e) : undefined}
                style={getInteractiveProps('schoolLogo', {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2.2mm',
                  minWidth: '48mm',
                })}
              >
                <div style={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                  <img
                    src={topLogoSrc}
                    alt="BSIS Logo"
                    draggable={false}
                    onError={() => {
                      if (hasCustomTopLogo) setTopLogoFailed(true);
                    }}
                    style={{
                      width: `${design.schoolLogoSizeMm}mm`,
                      height: `${design.schoolLogoSizeMm}mm`,
                      objectFit: 'contain',
                      flexShrink: 0,
                    }}
                  />
                  {renderResizeHandle('schoolLogo', 'logoSize', 'inner-se', 'ទាញផ្លាស់ប្តូរទំហំឡូហ្គោ', '#d97706')}
                </div>
                {design.showLogoSchoolText && (
                  <div style={{ lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontSize: '8.4pt',
                        fontWeight: 400,
                        color: framePreset.titleColor,
                        fontFamily: design.khmerTitleFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {schoolKhName}
                    </div>
                    <div
                      style={{
                        fontSize: '5.5pt',
                        fontWeight: 700,
                        color: framePreset.outerColor,
                        fontFamily: design.englishFont,
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                        marginTop: '0.25mm',
                      }}
                    >
                      {schoolEnName}
                    </div>
                  </div>
                )}
                {renderResizeHandle('schoolLogo', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមប្រអប់ឡូហ្គោ')}
              </div>
            )
          ) : (
            <div style={{ minWidth: '32mm' }} />
          )}

          {/* Center Stack: National Motto + Certificate Title */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5mm',
              minWidth: 0,
            }}
          >
            {design.elements.nationalMotto.visible !== false && (
              <div
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('nationalMotto', e) : undefined}
                style={getInteractiveProps('nationalMotto', {
                  textAlign: 'center',
                  lineHeight: design.mottoLineHeight,
                  color: design.mottoColor,
                })}
              >
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${design.mottoKhFontPt}pt`,
                    fontWeight: 400,
                    fontFamily: design.khmerTitleFont,
                    color: design.mottoColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${design.mottoEnFontPt}pt`,
                    fontWeight: 700,
                    fontFamily: design.englishFont,
                    letterSpacing: '0.5px',
                    color: design.mottoColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  KINGDOM OF CAMBODIA
                </div>
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${Math.max(5.5, design.mottoKhFontPt - 0.5)}pt`,
                    fontWeight: 400,
                    fontFamily: design.khmerTitleFont,
                    color: design.mottoColor,
                    whiteSpace: 'nowrap',
                    marginTop: '0.2mm',
                  }}
                >
                  ជាតិ{'\u00A0\u00A0'}សាសនា{'\u00A0\u00A0'}ព្រះមហាក្សត្រ
                </div>
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${Math.max(4.5, design.mottoEnFontPt - 0.3)}pt`,
                    fontWeight: 700,
                    fontFamily: design.englishFont,
                    letterSpacing: '0.55px',
                    color: design.mottoColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  NATION{'\u00A0\u00A0\u00A0'}RELIGION{'\u00A0\u00A0\u00A0'}KING
                </div>
                <div style={{ pointerEvents: 'none' }}>
                  <KhmerMottoOrnamentSVG color={design.mottoColor} />
                </div>
                {renderResizeHandle('nationalMotto', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមបាវចនា', '#1d4ed8')}
              </div>
            )}

            {design.elements.titleBlock.visible !== false && (
              <div
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('titleBlock', e) : undefined}
                style={getInteractiveProps('titleBlock', { textAlign: 'center' })}
              >
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${design.titleFontPt}pt`,
                    fontWeight: 400,
                    color: framePreset.titleColor,
                    fontFamily: design.khmerTitleFont,
                    lineHeight: 1.14,
                  }}
                >
                  {khHeading}
                </div>
                <div
                  className="cert-inherit-font"
                  style={{
                    fontSize: `${design.subtitleFontPt}pt`,
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    color: framePreset.innerColor,
                    fontFamily: design.englishFont,
                    marginTop: '0.3mm',
                  }}
                >
                  {enHeading}
                </div>
                {renderResizeHandle('titleBlock', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមចំណងជើង')}
              </div>
            )}
          </div>

          {/* Right corner Rank Ribbon Rosette or Pill Badge */}
          <div style={{ minWidth: '34mm', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {design.elements.rankBadge.visible !== false && (
              <div
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('rankBadge', e) : undefined}
                style={getInteractiveProps('rankBadge', {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                {design.rankBadgeStyle !== 'pill' ? (
                  <RankRibbonBadgeSVG
                    khRank={khRank}
                    enRank={enRank}
                    color={design.rankRibbonColor}
                    sizeMm={design.rankRibbonSizeMm}
                    khFont={design.khmerTitleFont}
                    enFont={design.englishFont}
                  />
                ) : (
                  <div
                    className="cert-inherit-font"
                    style={{
                      padding: '1mm 2.8mm',
                      borderRadius: '999px',
                      border: `1.2px solid ${framePreset.innerColor}`,
                      background: 'rgba(255, 255, 255, 0.85)',
                      color: framePreset.titleColor,
                      fontSize: '8pt',
                      fontWeight: 700,
                      fontFamily: design.khmerBodyFont,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    លេខ {khRank} • Rank {enRank}
                  </div>
                )}
                {renderResizeHandle(
                  'rankBadge',
                  design.rankBadgeStyle !== 'pill' ? 'ribbonSize' : 'elementScale',
                  'se',
                  'ទាញពង្រីក/បង្រួមបូរចំណាត់ថ្នាក់',
                  design.rankRibbonColor
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bilingual 2-Column Body Matching Reference Image */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: '7mm',
            paddingTop: '1.2mm',
            paddingBottom: '0.8mm',
            flex: 1,
            alignContent: 'center',
          }}
        >
          {/* Left Column: Khmer */}
          {design.elements.khmerBody.visible !== false ? (
            <div
              className="cert-inherit-font"
              onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('khmerBody', e) : undefined}
              style={getInteractiveProps('khmerBody', {
                display: 'flex',
                flexDirection: 'column',
                gap: `${design.rowGapMm}mm`,
                fontSize: `${design.khmerBodyFontPt}pt`,
                fontFamily: design.khmerBodyFont,
                lineHeight: design.bodyLineHeight,
                letterSpacing: `${design.letterSpacingPx}px`,
                color: design.bodyColor,
                borderRight: design.showCenterDivider ? '1px dashed rgba(148, 163, 184, 0.45)' : 'none',
                paddingRight: '4mm',
              })}
            >
              <div style={{ fontWeight: 500 }}>{khLeadText}</div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'flex-start',
                  flexWrap: 'wrap',
                  columnGap: '4.5mm',
                  rowGap: '0.4mm',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2mm' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ឈ្មោះ ៖</span>
                  <span
                    style={{
                      fontSize: `${design.studentNameKhPt}pt`,
                      fontWeight: 400,
                      color: design.valueColor,
                      fontFamily: design.studentNameKhFont,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {recipient.fullName || '-'}
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1.8mm', flexShrink: 0 }}>
                  <span>ភេទ</span>
                  <span style={{ color: design.valueColor, fontWeight: 700, fontSize: `${design.khmerBodyFontPt + 0.8}pt` }}>
                    {recipient.gender || '-'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3.5mm' }}>
                <span>
                  ដែលបានជាប់ចំណាត់ថ្នាក់លេខ ៖{' '}
                  <strong style={{ color: design.valueColor, fontSize: `${design.khmerBodyFontPt + 1.8}pt`, marginLeft: '1.5mm' }}>
                    {khRank}
                  </strong>
                </span>
                <span>
                  និទ្ទេស{' '}
                  <strong style={{ color: design.accentColor, fontSize: `${design.khmerBodyFontPt + 1.8}pt`, marginLeft: '1.5mm' }}>
                    {recipient.grade || '-'}
                  </strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>នៃការប្រឡង</span>
                <span style={{ color: design.valueColor, fontWeight: 700, fontSize: `${design.khmerBodyFontPt + 0.8}pt` }}>
                  {examKhmer}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>វគ្គសិក្សាសៀវភៅ ៖</span>
                <span
                  style={{
                    color: design.valueColor,
                    fontWeight: 700,
                    fontSize: `${design.khmerBodyFontPt + 0.3}pt`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bookOrLevelLabel}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>ដែលបានប្រព្រឹត្តទៅនៅថ្ងៃទី ៖</span>
                <span style={{ color: design.valueColor, fontWeight: 700, fontSize: `${design.khmerBodyFontPt + 0.3}pt` }}>
                  {conductedDate}
                </span>
              </div>
              {renderResizeHandle('khmerBody', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមខ្លឹមសារខ្មែរ')}
            </div>
          ) : (
            <div />
          )}

          {/* Right Column: English */}
          {design.elements.englishBody.visible !== false ? (
            <div
              className="cert-inherit-font"
              onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('englishBody', e) : undefined}
              style={getInteractiveProps('englishBody', {
                display: 'flex',
                flexDirection: 'column',
                gap: `${design.rowGapMm}mm`,
                fontSize: `${design.englishBodyFontPt}pt`,
                lineHeight: design.bodyLineHeight,
                letterSpacing: `${design.letterSpacingPx}px`,
                color: design.bodyColor,
                fontFamily: design.englishFont,
              })}
            >
              <div style={{ fontWeight: 500 }}>{enLeadText}</div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'flex-start',
                  flexWrap: 'wrap',
                  columnGap: '4.5mm',
                  rowGap: '0.4mm',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2mm' }}>
                  <span>to</span>
                  <span
                    style={{
                      fontSize: `${design.studentNameEnPt}pt`,
                      fontWeight: 700,
                      color: design.valueColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {recipient.englishName || recipient.fullName || '-'}
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1.5mm', flexShrink: 0 }}>
                  <span>Gender:</span>
                  <span style={{ color: design.valueColor, fontWeight: 700 }}>{engGender}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3mm' }}>
                <span>
                  who has successfully got the{' '}
                  <strong style={{ color: design.accentColor, fontSize: `${design.englishBodyFontPt + 2}pt`, marginLeft: '1.5mm' }}>
                    {enRank}
                  </strong>
                </span>
                <span>
                  grade{' '}
                  <strong style={{ color: design.accentColor, fontSize: `${design.englishBodyFontPt + 2}pt`, marginLeft: '1.5mm' }}>
                    {recipient.grade || '-'}
                  </strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
                <span>of</span>
                <span style={{ color: design.valueColor, fontWeight: 700, fontSize: `${design.englishBodyFontPt + 0.6}pt` }}>
                  {examEnglish}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>Level</span>
                <span
                  style={{
                    color: design.valueColor,
                    fontWeight: 700,
                    fontSize: `${design.englishBodyFontPt + 0.4}pt`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bookOrLevelLabel}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>which was conducted on</span>
                <span style={{ color: design.valueColor, fontWeight: 700, fontSize: `${design.englishBodyFontPt + 0.4}pt` }}>
                  {conductedDate}
                </span>
              </div>
              {renderResizeHandle('englishBody', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមខ្លឹមសារអង់គ្លេស')}
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Bottom Footer: Optional Student Photo & Class Meta (Left) + Stamp & Principal Signature (Right) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '0.6mm',
          }}
        >
          {/* Left: Student Photo + Class/Teacher Meta */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3mm' }}>
            {showStudentPhoto && design.elements.studentPhoto.visible !== false && (
              <div
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('studentPhoto', e) : undefined}
                style={getInteractiveProps('studentPhoto', {
                  width: `${design.photoWidthMm}mm`,
                  height: `${design.photoHeightMm}mm`,
                  overflow: 'visible',
                  flexShrink: 0,
                })}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: `${design.photoRadiusMm}mm`,
                    border: `1.5px solid ${framePreset.innerColor}`,
                    background: '#f8fafc',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {photoImgSrc && !photoFailed ? (
                    <img
                      src={photoImgSrc}
                      alt={recipient.fullName}
                      draggable={false}
                      onError={() => setPhotoFailed(true)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '6.8pt',
                        padding: '1mm',
                        lineHeight: 1.2,
                      }}
                    >
                      រូបថត
                      <br />
                      សិស្ស
                    </div>
                  )}
                </div>
                {renderResizeHandle('studentPhoto', 'photoWidth', 'e', 'ទាញទទឹងប្រអប់រូបថត', '#0284c7')}
                {renderResizeHandle('studentPhoto', 'photoHeight', 's', 'ទាញកម្ពស់ប្រអប់រូបថត', '#0284c7')}
                {renderResizeHandle('studentPhoto', 'photoSize', 'se', 'ទាញពង្រីក/បង្រួមប្រអប់រូបថត', '#0284c7')}
              </div>
            )}

            {design.elements.classMeta.visible !== false && (
              <div
                className="cert-inherit-font"
                onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('classMeta', e) : undefined}
                style={getInteractiveProps('classMeta', {
                  fontSize: '7.5pt',
                  color: '#64748b',
                  fontFamily: design.khmerBodyFont,
                  lineHeight: 1.35,
                  paddingBottom: '0.5mm',
                })}
              >
                <div style={{ fontWeight: 700, color: '#475569' }}>
                  ថ្នាក់ {recipient.classCode || recipient.className}
                  {recipient.level ? ` (${recipient.level})` : ''}
                </div>
                {recipient.teacherName && <div>គ្រូ៖ {recipient.teacherName}</div>}
                {recipient.studentId && <div>ID: {recipient.studentId}</div>}
                {renderResizeHandle('classMeta', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមព័ត៌មានថ្នាក់')}
              </div>
            )}
          </div>

          {/* Right: Issued Date + The Principal of BSIS + Official Stamp & Signature */}
          {design.elements.stampBlock.visible !== false && (
            <div
              onPointerDown={onElementPointerDown ? (e) => onElementPointerDown('stampBlock', e) : undefined}
              style={getInteractiveProps('stampBlock', {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '72mm',
                position: 'relative',
              })}
            >
              <div
                className="cert-inherit-font"
                style={{
                  fontSize: '8.8pt',
                  color: design.bodyColor,
                  fontFamily: design.englishFont,
                  marginBottom: '0.4mm',
                }}
              >
                <span>Issued Date</span>
                <strong style={{ marginLeft: '4mm', fontWeight: 700 }}>{issuedDate}</strong>
              </div>

              <div
                className="cert-inherit-font"
                style={{
                  fontSize: '8.8pt',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontFamily: design.englishFont,
                  marginBottom: '-2.5mm',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {principalTitle}
              </div>

              <div style={{ position: 'relative', width: '48mm', height: `${Math.max(18, design.stampSizeMm)}mm` }}>
                <div style={{ position: 'absolute', left: '2mm', top: '-1mm' }}>
                  <OfficialSchoolStamp
                    stampUrl={stampUrl}
                    schoolProfile={schoolProfile}
                    size={`${design.stampSizeMm}mm`}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: '-2mm',
                    bottom: '0.5mm',
                    width: '28mm',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <ReceiptSignature
                    signatureUrl={signatureUrl}
                    height={`${design.signatureHeightMm}mm`}
                    color={design.valueColor}
                  />
                </div>
                {renderResizeHandle('stampBlock', 'stampSize', 'inner-se', 'ទាញផ្លាស់ប្តូរទំហំត្រា & ហត្ថលេខា', '#e11d48')}
              </div>

              {signatoryName && (
                <div
                  style={{
                    marginTop: '-0.8mm',
                    paddingLeft: '14mm',
                    fontSize: `${design.signatoryFontPt}pt`,
                    fontWeight: 400,
                    color: framePreset.signatoryColor,
                    fontFamily: design.studentNameKhFont,
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    zIndex: 4,
                  }}
                >
                  {signatoryName}
                </div>
              )}
              {renderResizeHandle('stampBlock', 'elementScale', 'se', 'ទាញពង្រីក/បង្រួមប្រអប់ហត្ថលេខា')}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export interface CertificatePairA4PageProps {
  topRecipient: CertificateRecipient;
  bottomRecipient?: CertificateRecipient | null;
  showCutGuide?: boolean;
  sharedCardProps: Omit<CertificateCardProps, 'recipient'>;
}

/**
 * Full A4 Portrait Sheet (209.6mm x 296.6mm) holding up to 2 A5 Landscape Certificates stacked vertically.
 */
export function CertificatePairA4Page({
  topRecipient,
  bottomRecipient,
  showCutGuide = true,
  sharedCardProps,
}: CertificatePairA4PageProps) {
  return (
    <div
      className="receipt-a4-sheet"
      style={{
        width: A4_PORTRAIT_SPEC.sheetW,
        height: A4_PORTRAIT_SPEC.sheetH,
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top A5 Slot */}
      <div
        style={{
          width: '100%',
          height: A5_LANDSCAPE_SPEC.sheetH,
          padding: '1mm 1.5mm',
          boxSizing: 'border-box',
          borderBottom: showCutGuide ? '1px dashed rgba(148, 163, 184, 0.55)' : 'none',
          overflow: 'hidden',
        }}
      >
        <CertificateCardA5 recipient={topRecipient} {...sharedCardProps} />
      </div>

      {/* Bottom A5 Slot */}
      <div
        style={{
          width: '100%',
          height: A5_LANDSCAPE_SPEC.sheetH,
          padding: '1mm 1.5mm',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {bottomRecipient ? (
          <CertificateCardA5 recipient={bottomRecipient} {...sharedCardProps} />
        ) : null}
      </div>
    </div>
  );
}

export function CertificateSingleA5Page({
  recipient,
  sharedCardProps,
}: {
  recipient: CertificateRecipient;
  sharedCardProps: Omit<CertificateCardProps, 'recipient'>;
}) {
  return (
    <div
      className="receipt-a4-sheet"
      style={{
        width: A5_LANDSCAPE_SPEC.sheetW,
        height: A5_LANDSCAPE_SPEC.sheetH,
        backgroundColor: '#ffffff',
        padding: '1mm 1.5mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <CertificateCardA5 recipient={recipient} {...sharedCardProps} />
    </div>
  );
}
