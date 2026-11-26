"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { ENGLISH_MONTH_NAMES, KHMER_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { convertDriveImageLink } from '@/utils/driveLink';
import ReceiptSignature from '@/components/receipts/ReceiptSignature';
import { OfficialSchoolStamp } from './MonthlyResultSheet';

export const HONOR_ROLL_A4_SPEC = {
  sheetW: '210mm',
  sheetH: '296.6mm',
  sheetWPx: 793.7,
  sheetHPx: 1121,
  pageCss: '@page { size: A4 portrait; margin: 0; }',
};

const PX_PER_MM = 96 / 25.4;

export type HonorRollElementKey =
  | 'headerBanner'
  | 'nationalMotto'
  | 'titleBlock'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4'
  | 'slot5'
  | 'classMeta'
  | 'footerBlock'
  | 'stamp'
  | 'watermarkLogo';

export const HONOR_ELEMENT_LABELS: Record<HonorRollElementKey, string> = {
  headerBanner: 'ឡូហ្គោសាលាខាងលើ',
  nationalMotto: 'បាវចនាជាតិ & Tacteing',
  titleBlock: 'ប្រអប់ចំណងជើង',
  slot1: 'សិស្សលេខ ១ (1st)',
  slot2: 'សិស្សលេខ ២ (2nd)',
  slot3: 'សិស្សលេខ ៣ (3rd)',
  slot4: 'សិស្សលេខ ៤ (4th)',
  slot5: 'សិស្សលេខ ៥ (5th)',
  classMeta: 'ឈ្មោះថ្នាក់ & គ្រូ',
  footerBlock: 'កាលបរិច្ឆេទ & នាយក',
  stamp: 'ត្រាសាលា (Stamp)',
  watermarkLogo: 'ឡូហ្គោ Watermark កណ្ដាល',
};

export interface HonorElementTransform {
  dxMm: number;
  dyMm: number;
  scale: number;
}

export interface HonorRollLayoutConfig {
  // Frame & Medal Sizing
  frameWidthMm: number;
  frameHeightMm: number;
  frameRadiusMm: number;
  medalScale: number;
  medalOffsetXMm: number;
  medalOffsetYMm: number;

  // Anti-overlap Spacing & Row Positions
  titleTopMm: number;
  titleLineGapMm: number;
  rank1TopMm: number;
  row1TopMm: number;
  row2TopMm: number;
  sideMarginMm: number;
  nameGapMm: number;
  nameShiftXMm: number;
  footerTopMm: number;

  // Typography Sizes (pt)
  titleKhPt: number;
  titleEnPt: number;
  congratsKhPt: number;
  congratsEnPt: number;
  studentNamePt: number;
  studentSubPt: number;
  footerFontPt: number;

  // Branding & Official Stamp Sizing
  bannerHeightMm: number;
  watermarkSizeMm: number;
  stampSizeMm: number;
  stampOpacity: number;
  stampRotationDeg: number;

  // Free Per-Element Drag & Scale Offsets
  elements: Partial<Record<HonorRollElementKey, HonorElementTransform>>;
}

export const DEFAULT_HONOR_LAYOUT_CONFIG: HonorRollLayoutConfig = {
  frameWidthMm: 42.5,
  frameHeightMm: 50,
  frameRadiusMm: 5.8,
  medalScale: 0.8,
  medalOffsetXMm: -6.8,
  medalOffsetYMm: -5.2,

  titleTopMm: 34,
  titleLineGapMm: 0.8,
  rank1TopMm: 79,
  row1TopMm: 91,
  row2TopMm: 168,
  sideMarginMm: 15,
  nameGapMm: 5.2,
  nameShiftXMm: -1.8,
  footerTopMm: 245,

  titleKhPt: 19.5,
  titleEnPt: 14.5,
  congratsKhPt: 13.5,
  congratsEnPt: 12.5,
  studentNamePt: 12.2,
  studentSubPt: 7.4,
  footerFontPt: 9.5,

  bannerHeightMm: 21,
  watermarkSizeMm: 124,
  stampSizeMm: 31,
  stampOpacity: 0.9,
  stampRotationDeg: -8,

  elements: {},
};

export function normalizeHonorLayoutConfig(
  raw?: Partial<HonorRollLayoutConfig> | null
): HonorRollLayoutConfig {
  const src = raw || {};
  const clamp = (val: unknown, fallback: number, min: number, max: number) => {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  const nextElements: Partial<Record<HonorRollElementKey, HonorElementTransform>> = {};
  if (src.elements && typeof src.elements === 'object') {
    for (const [k, v] of Object.entries(src.elements)) {
      if (!v || typeof v !== 'object') continue;
      nextElements[k as HonorRollElementKey] = {
        dxMm: clamp((v as any).dxMm, 0, -180, 180),
        dyMm: clamp((v as any).dyMm, 0, -240, 240),
        scale: clamp((v as any).scale, 1, 0.4, 2.2),
      };
    }
  }
  const d = DEFAULT_HONOR_LAYOUT_CONFIG;
  return {
    frameWidthMm: clamp(src.frameWidthMm, d.frameWidthMm, 28, 60),
    frameHeightMm: clamp(src.frameHeightMm, d.frameHeightMm, 34, 72),
    frameRadiusMm: clamp(src.frameRadiusMm, d.frameRadiusMm, 0, 18),
    medalScale: clamp(src.medalScale, d.medalScale, 0.45, 1.5),
    medalOffsetXMm: clamp(src.medalOffsetXMm, d.medalOffsetXMm, -18, 10),
    medalOffsetYMm: clamp(src.medalOffsetYMm, d.medalOffsetYMm, -18, 10),

    titleTopMm: clamp(src.titleTopMm, d.titleTopMm, 20, 62),
    titleLineGapMm: clamp(src.titleLineGapMm, d.titleLineGapMm, 0, 6),
    rank1TopMm: clamp(src.rank1TopMm, d.rank1TopMm, 60, 120),
    row1TopMm: clamp(src.row1TopMm, d.row1TopMm, 68, 130),
    row2TopMm: clamp(src.row2TopMm, d.row2TopMm, 135, 208),
    sideMarginMm: clamp(src.sideMarginMm, d.sideMarginMm, 6, 36),
    nameGapMm: clamp(src.nameGapMm, d.nameGapMm, 0.5, 18),
    nameShiftXMm: clamp(src.nameShiftXMm, d.nameShiftXMm, -16, 16),
    footerTopMm: clamp(src.footerTopMm, d.footerTopMm, 205, 272),

    titleKhPt: clamp(src.titleKhPt, d.titleKhPt, 11, 28),
    titleEnPt: clamp(src.titleEnPt, d.titleEnPt, 9, 22),
    congratsKhPt: clamp(src.congratsKhPt, d.congratsKhPt, 9, 22),
    congratsEnPt: clamp(src.congratsEnPt, d.congratsEnPt, 8, 18),
    studentNamePt: clamp(src.studentNamePt, d.studentNamePt, 8, 22),
    studentSubPt: clamp(src.studentSubPt, d.studentSubPt, 5.5, 14),
    footerFontPt: clamp(src.footerFontPt, d.footerFontPt, 7, 16),

    bannerHeightMm: clamp(src.bannerHeightMm, d.bannerHeightMm, 12, 36),
    watermarkSizeMm: clamp(src.watermarkSizeMm, d.watermarkSizeMm, 60, 180),
    stampSizeMm: clamp(src.stampSizeMm, d.stampSizeMm, 16, 56),
    stampOpacity: clamp(src.stampOpacity, d.stampOpacity, 0.15, 1),
    stampRotationDeg: clamp(src.stampRotationDeg, d.stampRotationDeg, -45, 45),
    elements: nextElements,
  };
}

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
  slots: (HonorRollStudentSlot | null)[];
  topCount: 3 | 5;
  titleKhmer: string;
  titleEnglish: string;
  congratsKhmer: string;
  congratsEnglish: string;
  footerDateKhmer: string;
  footerDateEnglish: string;
  principalTitleKh: string;
  signatoryName?: string;
  bannerLogoUrl?: string;
  watermarkLogoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  showWatermarkPattern?: boolean;
  showCenterWatermarkLogo?: boolean;
  showStamp?: boolean;
  showSignature?: boolean;
  showScoreUnderName?: boolean;
  showEnglishName?: boolean;
  showClassTag?: boolean;
  classMetaLabel?: string;
  teacherMetaLabel?: string;
  photoBorderColor?: string;
  photoFitMode?: 'cover' | 'contain';
  layoutConfig?: HonorRollLayoutConfig;
  /** Interactive drag & resize support (screen preview only) */
  interactive?: boolean;
  previewScale?: number;
  selectedElement?: HonorRollElementKey | null;
  onSelectElement?: (key: HonorRollElementKey | null) => void;
  onUpdateElementTransform?: (
    key: HonorRollElementKey,
    next: HonorElementTransform
  ) => void;
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

function KhmerTacteingDividerSVG() {
  return (
    <svg
      viewBox="0 0 240 28"
      style={{ width: '44mm', height: '5.2mm', display: 'block', margin: '0.6mm auto 0' }}
      aria-hidden="true"
    >
      <g fill="none" stroke="#1e3a8a" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 14 14 Q 36 14 54 14" strokeWidth="1.6" />
        <path d="M 32 14 C 38 7, 48 6, 56 12 C 62 17, 72 17, 82 12 C 88 9, 96 10, 102 14" strokeWidth="1.7" />
        <path d="M 38 14 C 44 20, 54 20, 62 15 C 70 10, 82 11, 92 17 C 96 19, 101 18, 105 14" strokeWidth="1.35" />
        <path d="M 18 14 C 22 10, 28 10, 32 14 C 28 18, 22 18, 18 14 Z" fill="#1e3a8a" strokeWidth="0.8" />
        <circle cx="8" cy="14" r="2.2" fill="#1e3a8a" />

        <path d="M 226 14 Q 204 14 186 14" strokeWidth="1.6" />
        <path d="M 208 14 C 202 7, 192 6, 184 12 C 178 17, 168 17, 158 12 C 152 9, 144 10, 138 14" strokeWidth="1.7" />
        <path d="M 202 14 C 196 20, 186 20, 178 15 C 170 10, 158 11, 148 17 C 144 19, 139 18, 135 14" strokeWidth="1.35" />
        <path d="M 222 14 C 218 10, 212 10, 208 14 C 212 18, 218 18, 222 14 Z" fill="#1e3a8a" strokeWidth="0.8" />
        <circle cx="232" cy="14" r="2.2" fill="#1e3a8a" />

        <path d="M 108 14 L 120 4 L 132 14 L 120 24 Z" fill="#1e3a8a" strokeWidth="1.2" />
        <path d="M 114 14 L 120 8.5 L 126 14 L 120 19.5 Z" fill="#ffffff" stroke="none" />
        <circle cx="120" cy="14" r="2.3" fill="#1e3a8a" stroke="none" />
      </g>
    </svg>
  );
}

function HonorRollMedalBadge({
  rank,
  scale = 0.8,
}: {
  rank: 1 | 2 | 3 | 4 | 5;
  scale?: number;
}) {
  const suffix =
    rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  const uid = `hrm-${rank}`;
  const wMm = (25.5 * scale).toFixed(2);
  const hMm = (30.5 * scale).toFixed(2);

  return (
    <svg
      viewBox="0 0 120 144"
      style={{
        width: `${wMm}mm`,
        height: `${hMm}mm`,
        display: 'block',
        filter: 'drop-shadow(0 2px 3.5px rgba(15, 23, 42, 0.36))',
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
      <polygon points="44,92 31,129 38,124 49,95" fill="rgba(254, 249, 195, 0.38)" />
      <polygon points="76,92 89,129 82,124 71,95" fill="rgba(254, 249, 195, 0.35)" />

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

      <circle
        cx="60"
        cy="54"
        r="46"
        fill={`url(#${uid}-gold-ring)`}
        stroke="#92400e"
        strokeWidth="1.8"
      />
      <circle
        cx="60"
        cy="54"
        r="39.5"
        fill={`url(#${uid}-gold-inner)`}
        stroke="#fef08a"
        strokeWidth="1.1"
      />
      <circle
        cx="60"
        cy="54"
        r="34.5"
        fill={`url(#${uid}-core)`}
        stroke="#fbbf24"
        strokeWidth="1.4"
      />
      <path
        d="M 31 44 A 31 28 0 0 1 89 44 Q 60 56 31 44 Z"
        fill={`url(#${uid}-gloss)`}
      />

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
  showStamp = true,
  showSignature = true,
  showScoreUnderName = false,
  showEnglishName = false,
  showClassTag = false,
  classMetaLabel,
  teacherMetaLabel,
  photoBorderColor = '#111827',
  photoFitMode = 'cover',
  layoutConfig = DEFAULT_HONOR_LAYOUT_CONFIG,
  interactive = false,
  previewScale = 1,
  selectedElement = null,
  onSelectElement,
  onUpdateElementTransform,
}: HonorRollSheetProps) {
  const cfg = layoutConfig || DEFAULT_HONOR_LAYOUT_CONFIG;

  const dragStateRef = useRef<{
    mode: 'move' | 'resize';
    key: HonorRollElementKey;
    startClientX: number;
    startClientY: number;
    startTransform: HonorElementTransform;
  } | null>(null);

  const getTransform = useCallback(
    (key: HonorRollElementKey): HonorElementTransform => {
      const t = cfg.elements?.[key];
      return {
        dxMm: t?.dxMm ?? 0,
        dyMm: t?.dyMm ?? 0,
        scale: t?.scale ?? 1,
      };
    },
    [cfg.elements]
  );

  useEffect(() => {
    if (!interactive) return;

    const handleMove = (e: MouseEvent) => {
      const st = dragStateRef.current;
      if (!st || !onUpdateElementTransform) return;
      const denom = Math.max(0.2, previewScale) * PX_PER_MM;
      const dPxX = e.clientX - st.startClientX;
      const dPxY = e.clientY - st.startClientY;

      if (st.mode === 'move') {
        const nextDx = Number((st.startTransform.dxMm + dPxX / denom).toFixed(1));
        const nextDy = Number((st.startTransform.dyMm + dPxY / denom).toFixed(1));
        onUpdateElementTransform(st.key, {
          ...st.startTransform,
          dxMm: Math.max(-180, Math.min(180, nextDx)),
          dyMm: Math.max(-240, Math.min(240, nextDy)),
        });
      } else {
        const delta = (dPxX + dPxY) / (180 * Math.max(0.25, previewScale));
        const nextScale = Number(
          Math.max(0.45, Math.min(2.1, st.startTransform.scale + delta)).toFixed(2)
        );
        onUpdateElementTransform(st.key, {
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
  }, [interactive, previewScale, onUpdateElementTransform]);

  const startDrag = (
    e: React.MouseEvent,
    key: HonorRollElementKey,
    mode: 'move' | 'resize'
  ) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (onSelectElement) onSelectElement(key);
    dragStateRef.current = {
      mode,
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startTransform: getTransform(key),
    };
  };

  const renderInteractiveBox = (
    key: HonorRollElementKey,
    baseStyle: React.CSSProperties,
    content: React.ReactNode,
    extraTransform = ''
  ) => {
    const tr = getTransform(key);
    const isSel = interactive && selectedElement === key;
    const transformParts: string[] = [];
    if (extraTransform) transformParts.push(extraTransform);
    if (tr.dxMm !== 0 || tr.dyMm !== 0) {
      transformParts.push(`translate(${tr.dxMm}mm, ${tr.dyMm}mm)`);
    }
    if (tr.scale !== 1) {
      transformParts.push(`scale(${tr.scale})`);
    }

    return (
      <div
        key={key}
        onMouseDown={interactive ? (e) => startDrag(e, key, 'move') : undefined}
        style={{
          ...baseStyle,
          transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
          transformOrigin: 'center center',
          cursor: interactive ? 'grab' : undefined,
          outline: isSel ? '1.8px solid #0284c7' : undefined,
          outlineOffset: isSel ? '2px' : undefined,
          borderRadius: isSel ? '4px' : baseStyle.borderRadius,
        }}
      >
        {content}

        {/* Screen-only Selection Label & Resize Corner Handle */}
        {isSel && (
          <>
            <div
              className="no-print"
              style={{
                position: 'absolute',
                top: '-5.8mm',
                left: 0,
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '7pt',
                fontWeight: 700,
                padding: '0.5mm 2mm',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 50,
                boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
              }}
            >
              {HONOR_ELEMENT_LABELS[key]} ({Math.round(tr.scale * 100)}%)
            </div>
            <div
              className="no-print"
              title="អូសដើម្បីពង្រីក ឬបង្រួមទំហំ"
              onMouseDown={(e) => startDrag(e, key, 'resize')}
              style={{
                position: 'absolute',
                right: '-2.2mm',
                bottom: '-2.2mm',
                width: '4.4mm',
                height: '4.4mm',
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

  const bannerSrc =
    (bannerLogoUrl && convertDriveImageLink(bannerLogoUrl)) ||
    '/bsis_receipt_banner.png';
  const centerLogoSrc =
    (watermarkLogoUrl && convertDriveImageLink(watermarkLogoUrl)) ||
    '/logo.png';

  const fw = cfg.frameWidthMm;
  const fh = cfg.frameHeightMm;
  const centerLeftMm = Number(((210 - fw) / 2).toFixed(2));
  const rightLeftMm = Number((210 - cfg.sideMarginMm - fw).toFixed(2));

  const slotPositions: {
    key: HonorRollElementKey;
    rank: 1 | 2 | 3 | 4 | 5;
    leftMm: number;
    topMm: number;
  }[] =
    topCount === 3
      ? [
          { key: 'slot1', rank: 1, leftMm: centerLeftMm, topMm: cfg.rank1TopMm + 8 },
          { key: 'slot2', rank: 2, leftMm: cfg.sideMarginMm + 2, topMm: cfg.row1TopMm + 22 },
          { key: 'slot3', rank: 3, leftMm: rightLeftMm - 2, topMm: cfg.row1TopMm + 22 },
        ]
      : [
          { key: 'slot1', rank: 1, leftMm: centerLeftMm, topMm: cfg.rank1TopMm },
          { key: 'slot2', rank: 2, leftMm: cfg.sideMarginMm, topMm: cfg.row1TopMm },
          { key: 'slot3', rank: 3, leftMm: rightLeftMm, topMm: cfg.row1TopMm },
          { key: 'slot4', rank: 4, leftMm: cfg.sideMarginMm, topMm: cfg.row2TopMm },
          { key: 'slot5', rank: 5, leftMm: rightLeftMm, topMm: cfg.row2TopMm },
        ];

  return (
    <div
      className="receipt-a4-sheet"
      onMouseDown={
        interactive && onSelectElement
          ? () => onSelectElement(null)
          : undefined
      }
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
      {/* Background Layer 1: Repeating Bilingual BSIS Micro-Text Watermark */}
      {showWatermarkPattern && (
        <div
          aria-hidden="true"
          data-print-no-scale="true"
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

      {/* Background Layer 2: Large Centered Semi-Transparent BSIS Crest Watermark (Movable) */}
      {showCenterWatermarkLogo &&
        renderInteractiveBox(
          'watermarkLogo',
          {
            position: 'absolute',
            top: '106mm',
            left: '50%',
            width: `${cfg.watermarkSizeMm}mm`,
            height: `${cfg.watermarkSizeMm}mm`,
            zIndex: 2,
            pointerEvents: interactive ? 'auto' : 'none',
          },
          <img
            src={centerLogoSrc}
            alt=""
            draggable={false}
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fb) {
                img.dataset.fb = '1';
                img.src = '/logo.png';
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.135,
              display: 'block',
              pointerEvents: 'none',
            }}
          />,
          'translateX(-50%)'
        )}

      {/* Top-Left BSIS School Banner (Movable & Resizable) */}
      {renderInteractiveBox(
        'headerBanner',
        {
          position: 'absolute',
          top: '6.5mm',
          left: '8.5mm',
          zIndex: 6,
        },
        <img
          src={bannerSrc}
          alt="Brainstorm International School"
          draggable={false}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fb) {
              img.dataset.fb = '1';
              img.src = '/bsis_receipt_banner.png';
            }
          }}
          style={{
            height: `${cfg.bannerHeightMm}mm`,
            maxWidth: '92mm',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top-Right National Motto & Tacteing Divider (Movable & Resizable) */}
      {renderInteractiveBox(
        'nationalMotto',
        {
          position: 'absolute',
          top: '6.8mm',
          right: '8.5mm',
          minWidth: '64mm',
          textAlign: 'center',
          lineHeight: 1.45,
          zIndex: 6,
        },
        <>
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
        </>
      )}

      {/* Centered Bilingual Title Block (Movable & Resizable) */}
      {renderInteractiveBox(
        'titleBlock',
        {
          position: 'absolute',
          top: `${cfg.titleTopMm}mm`,
          left: '8mm',
          right: '8mm',
          zIndex: 7,
          textAlign: 'center',
        },
        <>
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'Khmer OS Moul', 'Moul', serif",
              fontSize: `${cfg.titleKhPt}pt`,
              fontWeight: 400,
              color: '#1b3588',
              lineHeight: 1.45,
            }}
          >
            {titleKhmer}
          </div>
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'News706 BT', 'Georgia', 'Playfair Display', serif",
              fontSize: `${cfg.titleEnPt}pt`,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.24,
              marginTop: `${cfg.titleLineGapMm}mm`,
            }}
          >
            {titleEnglish}
          </div>
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'Khmer OS Moul', 'Moul', serif",
              fontSize: `${cfg.congratsKhPt}pt`,
              fontWeight: 400,
              color: '#1b3588',
              lineHeight: 1.45,
              marginTop: `${cfg.titleLineGapMm + 0.4}mm`,
            }}
          >
            {congratsKhmer}
          </div>
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'News706 BT', 'Georgia', 'Playfair Display', serif",
              fontSize: `${cfg.congratsEnPt}pt`,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.24,
              marginTop: `${cfg.titleLineGapMm * 0.7}mm`,
            }}
          >
            {congratsEnglish}
          </div>
        </>
      )}

      {/* 5 (or 3) Movable & Resizable Student Photo Cards with Gold Medals */}
      {slotPositions.map((pos, idx) => {
        const student = slots[idx] || null;
        const resolvedPhoto = student?.photo ? convertDriveImageLink(student.photo) : '';

        return renderInteractiveBox(
          pos.key,
          {
            position: 'absolute',
            left: `${pos.leftMm}mm`,
            top: `${pos.topMm}mm`,
            width: `${fw}mm`,
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          <>
            {/* Rounded Rectangle Student Photo Frame */}
            <div
              style={{
                position: 'relative',
                width: `${fw}mm`,
                height: `${fh}mm`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: `${cfg.frameRadiusMm}mm`,
                  border: `1.65pt solid ${photoBorderColor}`,
                  background: resolvedPhoto
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.42)',
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
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: photoFitMode,
                      objectPosition: 'center top',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                ) : student?.fullName ? (
                  <svg
                    viewBox="0 0 64 64"
                    style={{ width: '15mm', height: '15mm', opacity: 0.38, pointerEvents: 'none' }}
                    aria-hidden="true"
                  >
                    <circle cx="32" cy="22" r="12" fill="#94a3b8" />
                    <path d="M 10 56 C 10 42, 20 36, 32 36 C 44 36, 54 42, 54 56 Z" fill="#94a3b8" />
                  </svg>
                ) : null}
              </div>

              {/* Glossy 3D Gold Ribbon Medal Anchored at Bottom-Right Corner */}
              <div
                style={{
                  position: 'absolute',
                  right: `${cfg.medalOffsetXMm}mm`,
                  bottom: `${cfg.medalOffsetYMm}mm`,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                <HonorRollMedalBadge rank={pos.rank} scale={cfg.medalScale} />
              </div>
            </div>

            {/* Student Name & Optional Subtitle Positioned Cleanly Below Medal Ribbon */}
            <div
              style={{
                marginTop: `${cfg.nameGapMm}mm`,
                marginLeft: `${cfg.nameShiftXMm}mm`,
                width: `${Math.max(fw + 14, 54)}mm`,
                textAlign: 'center',
                lineHeight: 1.24,
                position: 'relative',
                zIndex: 11,
              }}
            >
              <div
                style={{
                  fontFamily: "'AngkorSovannRound01', 'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif",
                  fontSize: `${cfg.studentNamePt}pt`,
                  fontWeight: 700,
                  color: '#1b3588',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 0 4px rgba(255,255,255,0.85)',
                }}
              >
                {student?.fullName || '\u00A0'}
              </div>

              {showEnglishName && student?.englishName && (
                <div
                  style={{
                    fontFamily: "'News706 BT', 'Georgia', serif",
                    fontSize: `${cfg.studentSubPt}pt`,
                    fontWeight: 600,
                    color: '#334155',
                    marginTop: '0.35mm',
                  }}
                >
                  {student.englishName}
                </div>
              )}

              {(showScoreUnderName || showClassTag) && student?.fullName && (
                <div
                  style={{
                    fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
                    fontSize: `${cfg.studentSubPt}pt`,
                    fontWeight: 700,
                    color: '#475569',
                    marginTop: '0.35mm',
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
          </>
        );
      })}

      {/* Optional Bottom-Left Class / Teacher Info (Movable & Resizable) */}
      {showClassTag &&
        (classMetaLabel || teacherMetaLabel) &&
        renderInteractiveBox(
          'classMeta',
          {
            position: 'absolute',
            left: '15mm',
            bottom: '13mm',
            zIndex: 8,
            fontFamily: "'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif",
            fontSize: '9pt',
            fontWeight: 700,
            color: '#1e3a8a',
            lineHeight: 1.45,
          },
          <>
            {classMetaLabel && <div>ថ្នាក់ / វគ្គ៖ {classMetaLabel}</div>}
            {teacherMetaLabel && <div>គ្រូបន្ទុកថ្នាក់៖ {teacherMetaLabel}</div>}
          </>
        )}

      {/* Bottom-Right Official Khmer + English Date, Principal & Signature (Movable & Resizable) */}
      {renderInteractiveBox(
        'footerBlock',
        {
          position: 'absolute',
          right: '11mm',
          top: `${cfg.footerTopMm}mm`,
          width: '74mm',
          zIndex: 9,
          textAlign: 'center',
          lineHeight: 1.38,
        },
        <>
          <div
            style={{
              fontFamily: "'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif",
              fontSize: `${cfg.footerFontPt}pt`,
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
              fontSize: `${cfg.footerFontPt}pt`,
              fontWeight: 700,
              color: '#111827',
              marginTop: '0.5mm',
              whiteSpace: 'nowrap',
            }}
          >
            {footerDateEnglish}
          </div>
          <div
            style={{
              fontFamily: "'Khmer OS Muol Light', 'Moul', serif",
              fontSize: `${cfg.footerFontPt}pt`,
              fontWeight: 400,
              color: '#111827',
              marginTop: '0.8mm',
            }}
          >
            {principalTitleKh}
          </div>

          {showSignature && (
            <div
              style={{
                position: 'relative',
                minHeight: '22mm',
                marginTop: '1mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
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
                    fontSize: `${cfg.footerFontPt}pt`,
                    fontWeight: 400,
                    color: '#1e3a8a',
                    marginTop: '0.6mm',
                  }}
                >
                  {signatoryName}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Independent Movable & Resizable Official Red School Stamp */}
      {showStamp &&
        renderInteractiveBox(
          'stamp',
          {
            position: 'absolute',
            right: '43mm',
            top: `${cfg.footerTopMm + 11}mm`,
            width: `${cfg.stampSizeMm}mm`,
            height: `${cfg.stampSizeMm}mm`,
            zIndex: 12,
          },
          <div
            style={{
              width: '100%',
              height: '100%',
              opacity: cfg.stampOpacity,
              transform: `rotate(${cfg.stampRotationDeg}deg)`,
              pointerEvents: 'none',
            }}
          >
            <OfficialSchoolStamp
              stampUrl={stampUrl}
              size={`${cfg.stampSizeMm}mm`}
            />
          </div>
        )}
    </div>
  );
}
