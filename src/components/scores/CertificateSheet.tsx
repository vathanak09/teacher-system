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

export interface CertificateCardProps {
  recipient: CertificateRecipient;
  docType: CertificateDocType;
  framePreset: CertificateFramePreset;
  customFrameUrl?: string;
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
}

/**
 * Single A5 Landscape (209.6mm x 148.2mm) Bilingual Certificate Card
 */
export function CertificateCardA5({
  recipient,
  docType,
  framePreset,
  customFrameUrl,
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
}: CertificateCardProps) {
  const [customFrameFailed, setCustomFrameFailed] = React.useState(false);
  const [photoFailed, setPhotoFailed] = React.useState(false);

  const frameImgSrc = resolveSheetAssetSrc(customFrameUrl);
  const photoImgSrc = resolveSheetAssetSrc(recipient.photo);

  React.useEffect(() => {
    setCustomFrameFailed(false);
  }, [customFrameUrl]);

  React.useEffect(() => {
    setPhotoFailed(false);
  }, [recipient.photo]);

  const logoSrc = resolveSheetAssetSrc(schoolProfile?.schoolLogoUrl) || '/logo.png';
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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Khmer OS Siemreap', 'Noto Sans Khmer', 'Times New Roman', serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Ornate Background Border Frame (Custom Image Link or Built-in Vector Frame) */}
      {frameImgSrc && !customFrameFailed ? (
        <img
          src={frameImgSrc}
          alt="Certificate Frame"
          onError={() => setCustomFrameFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ) : (
        <OrnateVectorCertificateFrame preset={framePreset} />
      )}

      {/* Safe Content Area Inside Ornate Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          padding: '9.5mm 12.5mm 8.5mm 12.5mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Header: School Crest + Bilingual School Name + Certificate Heading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${framePreset.innerColor}55`,
            paddingBottom: '2.2mm',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', minWidth: '52mm' }}>
            <img
              src={logoSrc}
              alt="BSIS Logo"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = '/logo.png';
                }
              }}
              style={{
                width: '12.5mm',
                height: '12.5mm',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: '8.8pt',
                  fontWeight: 400,
                  color: framePreset.titleColor,
                  fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {schoolKhName}
              </div>
              <div
                style={{
                  fontSize: '5.8pt',
                  fontWeight: 700,
                  color: framePreset.outerColor,
                  letterSpacing: '0.35px',
                  whiteSpace: 'nowrap',
                  marginTop: '0.3mm',
                }}
              >
                {schoolEnName}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div
              style={{
                fontSize: '16.5pt',
                fontWeight: 400,
                color: framePreset.titleColor,
                fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                lineHeight: 1.15,
              }}
            >
              {khHeading}
            </div>
            <div
              style={{
                fontSize: '8pt',
                fontWeight: 700,
                letterSpacing: '1.3px',
                color: framePreset.innerColor,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                marginTop: '0.4mm',
              }}
            >
              {enHeading}
            </div>
          </div>

          {/* Right corner Rank Medal Badge */}
          <div
            style={{
              minWidth: '30mm',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                padding: '1mm 2.8mm',
                borderRadius: '999px',
                border: `1.2px solid ${framePreset.innerColor}`,
                background: 'rgba(255, 255, 255, 0.85)',
                color: framePreset.titleColor,
                fontSize: '8pt',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              លេខ {khRank} • Rank {enRank}
            </div>
          </div>
        </div>

        {/* Bilingual 2-Column Body Matching Reference Image */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: '7mm',
            paddingTop: '1.8mm',
            paddingBottom: '1.2mm',
            flex: 1,
            alignContent: 'center',
          }}
        >
          {/* Left Column: Khmer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2.1mm',
              fontSize: '9.5pt',
              lineHeight: 1.35,
              color: '#111827',
              borderRight: '1px dashed rgba(148, 163, 184, 0.45)',
              paddingRight: '4mm',
            }}
          >
            <div style={{ fontWeight: 500 }}>{khLeadText}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '2mm' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm', minWidth: 0 }}>
                <span style={{ whiteSpace: 'nowrap' }}>ឈ្មោះ ៖</span>
                <span
                  style={{
                    fontSize: '13.5pt',
                    fontWeight: 400,
                    color: '#1d4ed8',
                    fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {recipient.fullName || '-'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2mm', flexShrink: 0 }}>
                <span>ភេទ</span>
                <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '10.5pt' }}>
                  {recipient.gender || '-'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3.5mm' }}>
              <span>
                ដែលបានជាប់ចំណាត់ថ្នាក់លេខ ៖{' '}
                <strong style={{ color: '#1d4ed8', fontSize: '11.5pt', marginLeft: '1.5mm' }}>
                  {khRank}
                </strong>
              </span>
              <span>
                និទ្ទេស{' '}
                <strong style={{ color: '#dc2626', fontSize: '11.5pt', marginLeft: '1.5mm' }}>
                  {recipient.grade || '-'}
                </strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3mm' }}>
              <span style={{ whiteSpace: 'nowrap' }}>នៃការប្រឡង</span>
              <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '10.5pt' }}>
                {examKhmer}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
              <span style={{ whiteSpace: 'nowrap' }}>វគ្គសិក្សាសៀវភៅ ៖</span>
              <span
                style={{
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: '9.8pt',
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
              <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '9.8pt' }}>
                {conductedDate}
              </span>
            </div>
          </div>

          {/* Right Column: English */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2.1mm',
              fontSize: '9.3pt',
              lineHeight: 1.35,
              color: '#111827',
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            <div style={{ fontWeight: 500 }}>{enLeadText}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '2mm' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm', minWidth: 0 }}>
                <span>to</span>
                <span
                  style={{
                    fontSize: '11.8pt',
                    fontWeight: 700,
                    color: '#1d4ed8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {recipient.englishName || recipient.fullName || '-'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5mm', flexShrink: 0 }}>
                <span>Gender:</span>
                <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{engGender}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3mm' }}>
              <span>
                who has successfully got the{' '}
                <strong style={{ color: '#dc2626', fontSize: '11.5pt', marginLeft: '1.5mm' }}>
                  {enRank}
                </strong>
              </span>
              <span>
                grade{' '}
                <strong style={{ color: '#dc2626', fontSize: '11.5pt', marginLeft: '1.5mm' }}>
                  {recipient.grade || '-'}
                </strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
              <span>of</span>
              <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '10pt' }}>
                {examEnglish}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5mm' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Level</span>
              <span
                style={{
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: '9.8pt',
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
              <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '9.8pt' }}>
                {conductedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer: Optional Student Photo (Left) + Issued Date, Stamp & Principal Signature (Right) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '1mm',
          }}
        >
          {/* Left: Student Photo (toggleable) + Subtle Class/Teacher Meta */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3mm' }}>
            {showStudentPhoto && (
              <div
                style={{
                  width: '23mm',
                  height: '29mm',
                  borderRadius: '2.2mm',
                  border: `1.5px solid ${framePreset.innerColor}`,
                  background: '#f8fafc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
                  flexShrink: 0,
                }}
              >
                {photoImgSrc && !photoFailed ? (
                  <img
                    src={photoImgSrc}
                    alt={recipient.fullName}
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
            )}

            <div style={{ fontSize: '7.5pt', color: '#64748b', lineHeight: 1.35, paddingBottom: '0.5mm' }}>
              <div style={{ fontWeight: 700, color: '#475569' }}>
                ថ្នាក់ {recipient.classCode || recipient.className}
                {recipient.level ? ` (${recipient.level})` : ''}
              </div>
              {recipient.teacherName && <div>គ្រូ៖ {recipient.teacherName}</div>}
              {recipient.studentId && <div>ID: {recipient.studentId}</div>}
            </div>
          </div>

          {/* Right: Issued Date + The Principal of BSIS + Official Stamp & Signature */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '72mm',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: '8.8pt',
                color: '#0f172a',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                marginBottom: '0.4mm',
              }}
            >
              <span>Issued Date</span>
              <strong style={{ marginLeft: '4mm', fontWeight: 700 }}>{issuedDate}</strong>
            </div>

            <div
              style={{
                fontSize: '8.8pt',
                fontWeight: 700,
                color: '#1e293b',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                marginBottom: '-2.5mm',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {principalTitle}
            </div>

            <div style={{ position: 'relative', width: '48mm', height: '21.5mm' }}>
              <div style={{ position: 'absolute', left: '2mm', top: '-1mm' }}>
                <OfficialSchoolStamp
                  stampUrl={stampUrl}
                  schoolProfile={schoolProfile}
                  size="22.5mm"
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
                  height="8.5mm"
                  color="#1d4ed8"
                />
              </div>
            </div>

            {signatoryName && (
              <div
                style={{
                  marginTop: '-0.8mm',
                  paddingLeft: '14mm',
                  fontSize: '9.8pt',
                  fontWeight: 400,
                  color: framePreset.signatoryColor,
                  fontFamily: "'Khmer OS Muol Light', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif",
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  zIndex: 4,
                }}
              >
                {signatoryName}
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
          padding: '2.5mm 3.5mm',
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
          padding: '2.5mm 3.5mm',
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
        padding: '2.5mm 3.5mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <CertificateCardA5 recipient={recipient} {...sharedCardProps} />
    </div>
  );
}
