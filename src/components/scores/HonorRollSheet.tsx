"use client";

import React from 'react';
import { ENGLISH_MONTH_NAMES, KHMER_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { convertDriveImageLink } from '@/utils/driveLink';
import ReceiptSignature from '@/components/receipts/ReceiptSignature';

export const HONOR_ROLL_A4_SPEC = {
  sheetW: '210mm',
  sheetH: '296.6mm',
  sheetWPx: 793.7,
  sheetHPx: 1121,
  pageCss: '@page { size: A4 portrait; margin: 0; }',
};

export interface HonorRollStudentSlot {
  rank: 1 | 2 | 3 | 4 | 5;
  studentId?: string;
  fullName: string;
  englishName?: string;
  photo?: string;
  averageDisplay?: string;
  grade?: string;
  classCode?: string;
  level?: string;
}

export interface HonorRollSheetProps {
  /** Slots for Rank 1..5 (or 1..3 when topCount === 3) */
  slots: (HonorRollStudentSlot | null)[];
  topCount: 3 | 5;
  /** Header & Title Text (Editable, defaults match E:\តារាងកិត្តិយស BSIS copy.ai) */
  titleKhmer: string;
  titleEnglish: string;
  congratsKhmer: string;
  congratsEnglish: string;
  /** Footer Dates & Signatory */
  footerDateKhmer: string;
  footerDateEnglish: string;
  principalTitleKh: string;
  signatoryName?: string;
  /** Optional Branding / Display Controls */
  bannerLogoUrl?: string;
  watermarkLogoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  showWatermarkPattern?: boolean;
  showCenterWatermarkLogo?: boolean;
  showStampAndSignature?: boolean;
  showScoreUnderName?: boolean;
  showEnglishName?: boolean;
  showClassTag?: boolean;
  classMetaLabel?: string;
  teacherMetaLabel?: string;
  photoBorderColor?: string;
  photoFitMode?: 'cover' | 'contain';
}

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const KHMER_WEEKDAYS = [
  'អាទិត្យ',
  'ចន្ទ',
  'អង្គារ',
  'ពុធ',
  'ព្រហស្បតិ៍',
  'សុក្រ',
  'សៅរ៍',
];

export function toKhmerDigitsStr(val: number | string): string {
  return String(val).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)] || d);
}

export function getEnglishOrdinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatHonorKhmerDate(dateInput?: Date | string): string {
  const d =
    dateInput instanceof Date
      ? dateInput
      : typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
        ? new Date(`${dateInput}T00:00:00`)
        : new Date();
  if (Number.isNaN(d.getTime())) return 'ថ្ងៃចន្ទ ទី១២ ខែមករា ឆ្នាំ២០២៦';
  const wk = KHMER_WEEKDAYS[d.getDay()] || 'ចន្ទ';
  const dayKh = toKhmerDigitsStr(String(d.getDate()).padStart(2, '0'));
  const monKh = KHMER_MONTH_NAMES[d.getMonth()] || 'មករា';
  const yrKh = toKhmerDigitsStr(d.getFullYear());
  return `ថ្ងៃ${wk} ទី${dayKh} ខែ${monKh} ឆ្នាំ${yrKh}`;
}

export function formatHonorEnglishDate(dateInput?: Date | string): string {
  const d =
    dateInput instanceof Date
      ? dateInput
      : typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
        ? new Date(`${dateInput}T00:00:00`)
        : new Date();
  if (Number.isNaN(d.getTime())) return 'January 12th 2026';
  const mon = ENGLISH_MONTH_NAMES[d.getMonth()] || 'January';
  const day = d.getDate();
  const suf = getEnglishOrdinalSuffix(day);
  return `${mon} ${day}${suf} ${d.getFullYear()}`;
}

export function getMonthLabelsFromYM(monthStr: string): {
  khmerMonth: string;
  englishMonth: string;
} {
  const m = /^(\d{4})-(\d{1,2})$/.exec(String(monthStr || '').trim());
  const idx = m ? Math.max(0, Math.min(11, Number(m[2]) - 1)) : new Date().getMonth();
  return {
    khmerMonth: KHMER_MONTH_NAMES[idx] || 'ធ្នូ',
    englishMonth: ENGLISH_MONTH_NAMES[idx] || 'December',
  };
}

/**
 * Classic Khmer Tacteing Blue Ornament Divider matching E:\តារាងកិត្តិយស BSIS copy.ai
 */
function KhmerTacteingDividerSVG() {
  return (
    <svg
      viewBox="0 0 240 28"
      style={{ width: '44mm', height: '5.2mm', display: 'block', margin: '0.6mm auto 0' }}
      aria-hidden="true"
    >
      <g fill="none" stroke="#1e3a8a" strokeLinecap="round" strokeLinejoin="round">
        {/* Left ornamental flourish */}
        <path d="M 14 14 Q 36 14 54 14" strokeWidth="1.6" />
        <path d="M 32 14 C 38 7, 48 6, 56 12 C 62 17, 72 17, 82 12 C 88 9, 96 10, 102 14" strokeWidth="1.7" />
        <path d="M 38 14 C 44 20, 54 20, 62 15 C 70 10, 82 11, 92 17 C 96 19, 101 18, 105 14" strokeWidth="1.35" />
        <path d="M 18 14 C 22 10, 28 10, 32 14 C 28 18, 22 18, 18 14 Z" fill="#1e3a8a" strokeWidth="0.8" />
        <circle cx="8" cy="14" r="2.2" fill="#1e3a8a" />

        {/* Right mirrored ornamental flourish */}
        <path d="M 226 14 Q 204 14 186 14" strokeWidth="1.6" />
        <path d="M 208 14 C 202 7, 192 6, 184 12 C 178 17, 168 17, 158 12 C 152 9, 144 10, 138 14" strokeWidth="1.7" />
        <path d="M 202 14 C 196 20, 186 20, 178 15 C 170 10, 158 11, 148 17 C 144 19, 139 18, 135 14" strokeWidth="1.35" />
        <path d="M 222 14 C 218 10, 212 10, 208 14 C 212 18, 218 18, 222 14 Z" fill="#1e3a8a" strokeWidth="0.8" />
        <circle cx="232" cy="14" r="2.2" fill="#1e3a8a" />

        {/* Center lotus diamond knot */}
        <path d="M 108 14 L 120 4 L 132 14 L 120 24 Z" fill="#1e3a8a" strokeWidth="1.2" />
        <path d="M 114 14 L 120 8.5 L 126 14 L 120 19.5 Z" fill="#ffffff" stroke="none" />
        <circle cx="120" cy="14" r="2.3" fill="#1e3a8a" stroke="none" />
      </g>
    </svg>
  );
}

/**
 * Glossy 3D Gold Ribbon Medal SVG (1st, 2nd, 3rd, 4th, 5th)
 * Faithfully matches the metallic gold + deep mahogany medallion in E:\តារាងកិត្តិយស BSIS copy.ai
 */
function HonorRollMedalBadge({ rank }: { rank: 1 | 2 | 3 | 4 | 5 }) {
  const suffix =
    rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  const uid = `hrm-${rank}`;

  return (
    <svg
      viewBox="0 0 120 144"
      style={{
        width: '25.5mm',
        height: '30.5mm',
        display: 'block',
        filter: 'drop-shadow(0 2.5px 4px rgba(15, 23, 42, 0.38))',
        overflow: 'visible',
      }}
      aria-label={`${rank}${suffix}`}
    >
      <defs>
        <linearGradient id={`${uid}-ribbon-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id={`${uid}-ribbon-r`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="48%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id={`${uid}-gold-ring`} x1="0.15" y1="0.05" x2="0.88" y2="0.95">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="26%" stopColor="#facc15" />
          <stop offset="55%" stopColor="#d97706" />
          <stop offset="82%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id={`${uid}-gold-inner`} x1="0.85" y1="0.1" x2="0.15" y2="0.92">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="45%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id={`${uid}-core`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="55%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#240b00" />
        </radialGradient>
        <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="22%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="78%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      {/* Left & Right Swallowtail Gold Ribbon Tails */}
      <polygon
        points="42,88 22,138 39,127 52,140 60,94"
        fill={`url(#${uid}-ribbon-l)`}
        stroke="#92400e"
        strokeWidth="1.2"
      />
      <polygon
        points="78,88 98,138 81,127 68,140 60,94"
        fill={`url(#${uid}-ribbon-r)`}
        stroke="#92400e"
        strokeWidth="1.2"
      />
      {/* Ribbon shine folds */}
      <polygon points="44,92 31,129 38,124 49,95" fill="rgba(254, 249, 195, 0.38)" />
      <polygon points="76,92 89,129 82,124 71,95" fill="rgba(254, 249, 195, 0.35)" />

      {/* Horizontal Gold Ribbon Sash Wrap around lower medal */}
      <path
        d="M 10 82 Q 60 99 110 82 L 106 104 Q 60 118 14 104 Z"
        fill={`url(#${uid}-band)`}
        stroke="#92400e"
        strokeWidth="1.4"
      />
      <path
        d="M 14 86 Q 60 101 106 86"
        fill="none"
        stroke="rgba(255, 251, 235, 0.65)"
        strokeWidth="1.6"
      />

      {/* Outer Metallic Gold Medal Disc */}
      <circle
        cx="60"
        cy="54"
        r="46"
        fill={`url(#${uid}-gold-ring)`}
        stroke="#92400e"
        strokeWidth="1.8"
      />
      {/* Raised Inner Bezel Ring */}
      <circle
        cx="60"
        cy="54"
        r="39.5"
        fill={`url(#${uid}-gold-inner)`}
        stroke="#fef08a"
        strokeWidth="1.1"
      />
      {/* Deep Mahogany Glossy Center */}
      <circle
        cx="60"
        cy="54"
        r="34.5"
        fill={`url(#${uid}-core)`}
        stroke="#fbbf24"
        strokeWidth="1.4"
      />
      {/* Curved Top Glass Highlight */}
      <path
        d="M 31 44 A 31 28 0 0 1 89 44 Q 60 56 31 44 Z"
        fill={`url(#${uid}-gloss)`}
      />

      {/* Crisp Embossed Rank Number + Superscript Ordinal */}
      <text
        x="53"
        y="69"
        textAnchor="middle"
        fill="#fffbeb"
        stroke="#92400e"
        strokeWidth="1.2"
        paintOrder="stroke"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 900,
          fontSize: '46px',
        }}
      >
        {rank}
      </text>
      <text
        x="77"
        y="46"
        textAnchor="middle"
        fill="#fef08a"
        stroke="#78350f"
        strokeWidth="0.9"
        paintOrder="stroke"
        style={{
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: 800,
          fontSize: '15px',
        }}
      >
        {suffix}
      </text>
    </svg>
  );
}

/**
 * Builds the 38-row faint repeating bilingual watermark texture from E:\តារាងកិត្តិយស BSIS copy.ai
 */
const WATERMARK_ROWS = Array.from({ length: 38 }, (_, i) => i);

export default function HonorRollSheet({
  slots,
  topCount,
  titleKhmer,
  titleEnglish,
  congratsKhmer,
  congratsEnglish,
  footerDateKhmer,
  footerDateEnglish,
  principalTitleKh,
  signatoryName = 'សំរិត វឌ្ឍនៈ',
  bannerLogoUrl,
  watermarkLogoUrl,
  stampUrl,
  signatureUrl,
  showWatermarkPattern = true,
  showCenterWatermarkLogo = true,
  showStampAndSignature = false,
  showScoreUnderName = false,
  showEnglishName = false,
  showClassTag = false,
  classMetaLabel,
  teacherMetaLabel,
  photoBorderColor = '#111827',
  photoFitMode = 'cover',
}: HonorRollSheetProps) {
  const bannerSrc =
    (bannerLogoUrl && convertDriveImageLink(bannerLogoUrl)) ||
    '/bsis_receipt_banner.png';
  const centerLogoSrc =
    (watermarkLogoUrl && convertDriveImageLink(watermarkLogoUrl)) ||
    '/logo.png';
  const resolvedStampSrc =
    (stampUrl && convertDriveImageLink(stampUrl)) || '/bsis_stamp.png';

  // Exact mm coordinates faithfully calibrated from E:\តារាងកិត្តិយស BSIS copy.ai (595.28 x 841.89 pt = 210 x 297 mm)
  const slotPositions: {
    rank: 1 | 2 | 3 | 4 | 5;
    leftMm: number;
    topMm: number;
  }[] =
    topCount === 3
      ? [
          { rank: 1, leftMm: 82.25, topMm: 92 },
          { rank: 2, leftMm: 16, topMm: 118 },
          { rank: 3, leftMm: 148.5, topMm: 118 },
        ]
      : [
          { rank: 1, leftMm: 82.25, topMm: 82.5 },
          { rank: 2, leftMm: 15, topMm: 98.5 },
          { rank: 3, leftMm: 149.5, topMm: 98.5 },
          { rank: 4, leftMm: 15, topMm: 170.5 },
          { rank: 5, leftMm: 149.5, topMm: 170.5 },
        ];

  return (
    <div
      className="receipt-a4-sheet"
      style={{
        width: HONOR_ROLL_A4_SPEC.sheetW,
        height: HONOR_ROLL_A4_SPEC.sheetH,
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: '#111827',
        userSelect: 'none',
      }}
    >
      {/* Background Layer 1: Repeating Bilingual BSIS Micro-Text Security Watermark */}
      {showWatermarkPattern && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2mm 1.5mm',
          }}
        >
          {WATERMARK_ROWS.map((rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '3.2mm',
                whiteSpace: 'nowrap',
                fontSize: '7.4pt',
                lineHeight: 1,
                color: 'rgba(30, 58, 138, 0.11)',
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                BRAINSTORM INTERNATIONAL SCHOOL
              </span>
              <span style={{ fontFamily: "'Kantumruy Pro', 'Siemreap', sans-serif", fontWeight: 500 }}>
                សាលាអន្តរជាតិប្រេនស្តម
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                BRAINSTORM INTERNATIONAL SCHOOL
              </span>
              <span style={{ fontFamily: "'Kantumruy Pro', 'Siemreap', sans-serif", fontWeight: 500 }}>
                សាលាអន្តរជាតិប្រេនស្តម
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Background Layer 2: Large Centered Semi-Transparent BSIS Crest Watermark */}
      {showCenterWatermarkLogo && (
        <img
          src={centerLogoSrc}
          alt=""
          aria-hidden="true"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fb) {
              img.dataset.fb = '1';
              img.src = '/logo.png';
            }
          }}
          style={{
            position: 'absolute',
            top: '108mm',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '128mm',
            height: '128mm',
            objectFit: 'contain',
            opacity: 0.135,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top Header Row: Left BSIS Banner + Right Kingdom of Cambodia Motto & Tacteing Divider */}
      <div
        style={{
          position: 'absolute',
          top: '6.5mm',
          left: '8.5mm',
          right: '8.5mm',
          zIndex: 5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '6mm',
        }}
      >
        {/* Left BSIS Logo + Khmer/English School Name Banner */}
        <div style={{ flexShrink: 0, paddingTop: '0.5mm' }}>
          <img
            src={bannerSrc}
            alt="Brainstorm International School"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fb) {
                img.dataset.fb = '1';
                img.src = '/bsis_receipt_banner.png';
              }
            }}
            style={{
              height: '22.5mm',
              maxWidth: '88mm',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Right National Motto & Classic Khmer Tacteing Blue Ornament */}
        <div
          style={{
            textAlign: 'center',
            minWidth: '64mm',
            paddingTop: '0.4mm',
            lineHeight: 1.45,
          }}
        >
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'Khmer OS Muol Light', 'Moul', serif",
              fontSize: '10.6pt',
              fontWeight: 400,
              color: '#1e3a8a',
              whiteSpace: 'nowrap',
            }}
          >
            ព្រះរាជាណាចក្រកម្ពុជា
          </div>
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'Khmer OS Muol Light', 'Moul', serif",
              fontSize: '10pt',
              fontWeight: 400,
              color: '#1e3a8a',
              whiteSpace: 'nowrap',
              marginTop: '0.4mm',
            }}
          >
            ជាតិ សាសនា ព្រះមហាក្សត្រ
          </div>
          <KhmerTacteingDividerSVG />
        </div>
      </div>

      {/* Centered Bilingual Honor Roll Title Block */}
      <div
        style={{
          position: 'absolute',
          top: '36.5mm',
          left: '8mm',
          right: '8mm',
          zIndex: 5,
          textAlign: 'center',
        }}
      >
        <div
          data-print-heading="true"
          style={{
            fontFamily: "'Khmer OS Moul', 'Moul', serif",
            fontSize: '20.5pt',
            fontWeight: 400,
            color: '#1b3588',
            lineHeight: 1.48,
            letterSpacing: '0.01em',
          }}
        >
          {titleKhmer}
        </div>
        <div
          data-print-heading="true"
          style={{
            fontFamily: "'News706 BT', 'Georgia', 'Playfair Display', serif",
            fontSize: '15.5pt',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.25,
            marginTop: '0.8mm',
          }}
        >
          {titleEnglish}
        </div>
        <div
          data-print-heading="true"
          style={{
            fontFamily: "'Khmer OS Moul', 'Moul', serif",
            fontSize: '14.2pt',
            fontWeight: 400,
            color: '#1b3588',
            lineHeight: 1.48,
            marginTop: '1.2mm',
          }}
        >
          {congratsKhmer}
        </div>
        <div
          style={{
            fontFamily: "'News706 BT', 'Georgia', 'Playfair Display', serif",
            fontSize: '13.5pt',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.25,
            marginTop: '0.6mm',
          }}
        >
          {congratsEnglish}
        </div>
      </div>

      {/* Iconic 5-Student (or 3-Student) Pyramid Photo Cards with Glossy 3D Gold Medals */}
      {slotPositions.map((pos, idx) => {
        const student = slots[idx] || null;
        const resolvedPhoto = student?.photo ? convertDriveImageLink(student.photo) : '';

        return (
          <div
            key={pos.rank}
            style={{
              position: 'absolute',
              left: `${pos.leftMm}mm`,
              top: `${pos.topMm}mm`,
              width: '45.5mm',
              zIndex: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Rounded Rectangle Student Photo Frame */}
            <div
              style={{
                position: 'relative',
                width: '45.5mm',
                height: '55.5mm',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '6.2mm',
                  border: `1.65pt solid ${photoBorderColor}`,
                  background: resolvedPhoto
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.38)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {resolvedPhoto ? (
                  <img
                    src={resolvedPhoto}
                    alt={student?.fullName || `Rank ${pos.rank}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: photoFitMode,
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                  />
                ) : student?.fullName ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1.5mm',
                      color: '#64748b',
                      textAlign: 'center',
                      padding: '3mm',
                    }}
                  >
                    <svg
                      viewBox="0 0 64 64"
                      style={{ width: '16mm', height: '16mm', opacity: 0.4 }}
                      aria-hidden="true"
                    >
                      <circle cx="32" cy="22" r="12" fill="#94a3b8" />
                      <path d="M 10 56 C 10 42, 20 36, 32 36 C 44 36, 54 42, 54 56 Z" fill="#94a3b8" />
                    </svg>
                  </div>
                ) : null}
              </div>

              {/* Glossy 3D Gold Ribbon Medal Anchored at Bottom-Right Corner */}
              <div
                style={{
                  position: 'absolute',
                  right: '-9.2mm',
                  bottom: '-10.5mm',
                  zIndex: 8,
                  pointerEvents: 'none',
                }}
              >
                <HonorRollMedalBadge rank={pos.rank} />
              </div>
            </div>

            {/* Student Name & Optional Subtitle Centered Directly Below Photo Frame */}
            <div
              style={{
                marginTop: '3.2mm',
                width: '56mm',
                textAlign: 'center',
                lineHeight: 1.28,
              }}
            >
              <div
                style={{
                  fontFamily: "'AngkorSovannRound01', 'Kantumruy Pro', 'Khmer OS Muol Light', sans-serif",
                  fontSize: '13.2pt',
                  fontWeight: 700,
                  color: '#1b3588',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {student?.fullName || '\u00A0'}
              </div>

              {showEnglishName && student?.englishName && (
                <div
                  style={{
                    fontFamily: "'News706 BT', 'Georgia', serif",
                    fontSize: '8.5pt',
                    fontWeight: 600,
                    color: '#334155',
                    marginTop: '0.3mm',
                  }}
                >
                  {student.englishName}
                </div>
              )}

              {(showScoreUnderName || showClassTag) && student?.fullName && (
                <div
                  style={{
                    fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
                    fontSize: '7.8pt',
                    fontWeight: 700,
                    color: '#475569',
                    marginTop: '0.4mm',
                  }}
                >
                  {[
                    showClassTag && (student.level || student.classCode)
                      ? `ថ្នាក់ ${student.level || student.classCode}`
                      : '',
                    showScoreUnderName && student.averageDisplay
                      ? `ម.ភាគ ${student.averageDisplay}${student.grade ? ` (${student.grade})` : ''}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Optional Bottom-Left Class / Teacher Info */}
      {showClassTag && (classMetaLabel || teacherMetaLabel) && (
        <div
          style={{
            position: 'absolute',
            left: '15mm',
            bottom: '13mm',
            zIndex: 6,
            fontFamily: "'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif",
            fontSize: '9pt',
            fontWeight: 700,
            color: '#1e3a8a',
            lineHeight: 1.45,
          }}
        >
          {classMetaLabel && <div>ថ្នាក់ / វគ្គ៖ {classMetaLabel}</div>}
          {teacherMetaLabel && <div>គ្រូបន្ទុកថ្នាក់៖ {teacherMetaLabel}</div>}
        </div>
      )}

      {/* Bottom-Right Official Khmer + English Date & Principal Block */}
      <div
        style={{
          position: 'absolute',
          right: '11mm',
          top: '243mm',
          width: '74mm',
          zIndex: 6,
          textAlign: 'center',
          lineHeight: 1.38,
        }}
      >
        <div
          style={{
            fontFamily: "'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif",
            fontSize: '9.8pt',
            fontWeight: 700,
            color: '#111827',
            whiteSpace: 'nowrap',
          }}
        >
          {footerDateKhmer}
        </div>
        <div
          style={{
            fontFamily: "'News706 BT', 'Georgia', serif",
            fontSize: '9.8pt',
            fontWeight: 700,
            color: '#111827',
            marginTop: '0.6mm',
            whiteSpace: 'nowrap',
          }}
        >
          {footerDateEnglish}
        </div>
        <div
          style={{
            fontFamily: "'Khmer OS Muol Light', 'Kantumruy Pro', serif",
            fontSize: '9.8pt',
            fontWeight: 700,
            color: '#111827',
            marginTop: '0.8mm',
          }}
        >
          {principalTitleKh}
        </div>

        {/* Optional Official Stamp, Signature & Principal Name */}
        {showStampAndSignature && (
          <div
            style={{
              position: 'relative',
              height: '24mm',
              marginTop: '0.5mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <img
              src={resolvedStampSrc}
              alt="BSIS Stamp"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              style={{
                position: 'absolute',
                left: '10mm',
                top: '-3mm',
                width: '26mm',
                height: '26mm',
                objectFit: 'contain',
                opacity: 0.85,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '1mm',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32mm',
                height: '14mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptSignature
                signatureUrl={signatureUrl}
                height="13mm"
                color="#1d4ed8"
              />
            </div>
            {signatoryName && (
              <div
                style={{
                  fontFamily: "'Khmer OS Muol Light', 'Moul', serif",
                  fontSize: '9.5pt',
                  fontWeight: 400,
                  color: '#1e3a8a',
                  zIndex: 2,
                }}
              >
                {signatoryName}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
