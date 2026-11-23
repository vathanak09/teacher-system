"use client";

import React from 'react';
import { formatRiels } from '@/utils/paymentBilling';
import {
  extractReceiptDisplayData,
  ReceiptCardSharedProps,
  ReceiptTemplateId,
} from '../OfficialReceiptCard';
import ReceiptSignature from './ReceiptSignature';

export const RECEIPT_TEMPLATE_OPTIONS: {
  id: ReceiptTemplateId;
  label: string;
  shortLabel: string;
  accent: string;
}[] = [
  { id: 'classic', label: 'គំរូដើម (BSIS Classic)', shortLabel: 'ដើម BSIS', accent: '#334155' },
  { id: 'modern_navy', label: 'ទំនើប ១ (Navy Gold)', shortLabel: 'Navy Gold', accent: '#1e3a8a' },
  { id: 'modern_teal', label: 'ទំនើប ២ (Teal Minimal)', shortLabel: 'Teal Minimal', accent: '#0d9488' },
  { id: 'modern_royal', label: 'ទំនើប ៣ (Royal Frame)', shortLabel: 'Royal Frame', accent: '#2563eb' },
];

/* =========================================================================
 * STYLE 2: MODERN NAVY GOLD (Executive School Receipt — Landscape & Portrait)
 * ========================================================================= */
export function ModernNavyReceiptCard(props: ReceiptCardSharedProps) {
  const {
    orientation = 'landscape',
    cashierSignatureUrl,
    showAmount = true,
    showSignature = true,
    showCutRight = false,
    showCutBottom = false,
  } = props;

  const d = extractReceiptDisplayData(props);
  const isPortrait = orientation === 'portrait';
  const slotW = isPortrait ? '10.5cm' : '14.85cm';
  const slotH = isPortrait ? '14.85cm' : '10.5cm';

  return (
    <div
      className="official-receipt-slot"
      style={{
        width: slotW,
        height: slotH,
        boxSizing: 'border-box',
        padding: '2.8mm',
        background: '#ffffff',
        borderRight: showCutRight ? '0.45pt dashed #cbd5e1' : 'none',
        borderBottom: showCutBottom ? '0.45pt dashed #cbd5e1' : 'none',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '0.75pt solid #cbd5e1',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Subtle Center Watermark */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '56%',
            transform: 'translate(-50%, -50%)',
            width: '4.2cm',
            height: '4.2cm',
            objectFit: 'contain',
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Top Navy-Gold Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f2957 0%, #1e3a8a 100%)',
            borderBottom: '1.8pt solid #eab308',
            padding: isPortrait ? '2.8mm 3.4mm' : '2.2mm 3.6mm',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2.5mm',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.4mm', minWidth: 0 }}>
            <div
              style={{
                width: isPortrait ? '1.1cm' : '1.15cm',
                height: isPortrait ? '1.1cm' : '1.15cm',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '0.7mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="BSIS"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.2 }}>
              <div
                style={{
                  fontFamily: "'Moul', 'Kantumruy Pro', serif",
                  fontSize: isPortrait ? '8.4pt' : '9.6pt',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                សាលាអន្តរជាតិ ប្រេនស្តម
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isPortrait ? '6.2pt' : '6.8pt',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#fde68a',
                  whiteSpace: 'nowrap',
                }}
              >
                BRAINSTORM INTERNATIONAL SCHOOL
              </div>
              <div
                style={{
                  fontSize: '6.3pt',
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: '0.4mm',
                  whiteSpace: 'nowrap',
                }}
              >
                {[d.teacherShortCode, d.levelCode, d.shiftCode].filter(Boolean).join(' • ')}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.2 }}>
            <div
              style={{
                fontSize: isPortrait ? '7.5pt' : '8.2pt',
                fontWeight: 800,
                color: '#fde047',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              បង្កាន់ដៃ • RECEIPT
            </div>
            <div
              style={{
                marginTop: '0.7mm',
                display: 'inline-block',
                padding: '0.5mm 2.2mm',
                borderRadius: '999px',
                background: '#ffffff',
                color: '#b91c1c',
                fontWeight: 800,
                fontSize: '8.5pt',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              № {d.receiptNo6}
            </div>
            <div
              style={{
                fontSize: '6.9pt',
                color: '#e2e8f0',
                marginTop: '0.5mm',
                whiteSpace: 'nowrap',
              }}
            >
              Date: {d.dateDash}
            </div>
          </div>
        </div>

        {/* Body Info Grid */}
        <div
          style={{
            flex: 1,
            padding: isPortrait ? '2.6mm 3.4mm 1.5mm' : '2mm 3.6mm 1.2mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: isPortrait ? '2mm' : '1.4mm',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Student Details Card Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPortrait ? '1fr 1fr' : '1.45fr 0.72fr 0.78fr',
              gap: isPortrait ? '1.6mm' : '1.4mm',
            }}
          >
            <div
              style={{
                gridColumn: isPortrait ? '1 / span 2' : 'auto',
                background: '#f8fafc',
                border: '0.6pt solid #e2e8f0',
                borderRadius: '6px',
                padding: '1.1mm 2.2mm',
              }}
            >
              <div style={{ fontSize: '6.2pt', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                ឈ្មោះសិស្ស / Student&apos;s Name
              </div>
              <div
                style={{
                  fontSize: d.studentName.length > 18 ? '8.8pt' : '9.8pt',
                  fontWeight: 800,
                  color: '#1e3a8a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {d.studentName || '-'}
                {d.studentIdCode ? (
                  <span style={{ fontSize: '7.2pt', color: '#64748b', fontWeight: 600, marginLeft: '2mm' }}>
                    ({d.studentIdCode})
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '0.6pt solid #e2e8f0',
                borderRadius: '6px',
                padding: '1.1mm 2mm',
              }}
            >
              <div style={{ fontSize: '6.2pt', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                ភេទ & ថ្ងៃចូលរៀន
              </div>
              <div style={{ fontSize: '8.4pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {d.shortGender || '-'} • ថ្ងៃទី {d.enrollDay || '-'}
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '0.6pt solid #e2e8f0',
                borderRadius: '6px',
                padding: '1.1mm 2mm',
              }}
            >
              <div style={{ fontSize: '6.2pt', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                វេនសិក្សា / Shift
              </div>
              <div style={{ fontSize: '8.4pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {d.shiftFullKh || d.shiftCode || '-'} ({d.shiftCode || '-'})
              </div>
            </div>

            <div
              style={{
                gridColumn: isPortrait ? '1 / span 2' : 'auto',
                background: '#f8fafc',
                border: '0.6pt solid #e2e8f0',
                borderRadius: '6px',
                padding: '1.1mm 2.2mm',
              }}
            >
              <div style={{ fontSize: '6.2pt', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                វគ្គសិក្សា / Course
              </div>
              <div
                style={{
                  fontSize: '8.4pt',
                  fontWeight: 800,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {d.courseName || '-'}
              </div>
            </div>

            <div
              style={{
                gridColumn: isPortrait ? '1 / span 2' : '2 / span 2',
                background: '#f8fafc',
                border: '0.6pt solid #e2e8f0',
                borderRadius: '6px',
                padding: '1.1mm 2.2mm',
              }}
            >
              <div style={{ fontSize: '6.2pt', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                បង់ប្រាក់សម្រាប់ / Pay For ({d.monthsPaid} ខែ • {d.payMethod})
              </div>
              <div style={{ fontSize: '8.8pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {d.validitySpaced || '-'}
              </div>
            </div>
          </div>

          {/* Highlighted Amount + Next Payment Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8mm' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '0.65pt solid #93c5fd',
                borderRadius: '7px',
                padding: '1.3mm 2.4mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5mm',
              }}
            >
              <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: 700, color: '#1e40af' }}>សរុបទឹកប្រាក់</div>
                <div style={{ fontSize: '5.8pt', fontWeight: 600, color: '#3b82f6' }}>Total Paid</div>
              </div>
              <div style={{ fontSize: '9.8pt', fontWeight: 900, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : '—'}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                border: '0.65pt solid #fdba74',
                borderRadius: '7px',
                padding: '1.3mm 2.4mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5mm',
              }}
            >
              <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '6.8pt', fontWeight: 700, color: '#9a3412' }}>ថ្ងៃបង់បន្ទាប់</div>
                <div style={{ fontSize: '5.8pt', fontWeight: 600, color: '#c2410c' }}>Next Payment</div>
              </div>
              <div style={{ fontSize: '8.7pt', fontWeight: 900, color: '#9a3412', whiteSpace: 'nowrap' }}>
                {d.nextPaymentKh}
              </div>
            </div>
          </div>

          {/* Footer: Terms & Contact + Signature */}
          <div
            style={{
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: isPortrait ? 'stretch' : 'flex-end',
              justifyContent: 'space-between',
              gap: isPortrait ? '1.8mm' : '2mm',
              borderTop: '0.55pt dashed #cbd5e1',
              paddingTop: '1.2mm',
            }}
          >
            <div style={{ flex: 1, minWidth: 0, fontSize: '6.55pt', lineHeight: 1.4, color: '#475569', letterSpacing: '-0.018em' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#0f172a' }}>បញ្ជាក់៖</strong> ទឹកប្រាក់ដែលបានបង់រួចហើយ មិនអាចដកវិញ ឬផ្ទេរទៅអ្នកផ្សេងបានឡើយ។
              </div>
              <div style={{ whiteSpace: 'nowrap' }}>
                ការបង់ប្រាក់បន្ទាប់ត្រូវបង់មុនថ្ងៃផុតកំណត់យ៉ាងហោចណាស់ ៣ថ្ងៃ • យឺតយ៉ាវត្រូវផាកពិន័យ។
              </div>
              <div style={{ marginTop: '0.5mm', color: '#1e293b', whiteSpace: 'nowrap' }}>
                <strong>ទំនាក់ទំនង៖</strong> {d.phoneText}
              </div>
              <div style={{ color: '#334155', whiteSpace: 'pre-line' }}>
                <strong>អាសយដ្ឋាន៖</strong> {d.addressText}
              </div>
            </div>

            <div
              style={{
                width: isPortrait ? '3.8cm' : '3.45cm',
                marginLeft: isPortrait ? 'auto' : 0,
                flexShrink: 0,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '8pt', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                អ្នកទទួលប្រាក់ / Cashier
              </div>
              <div
                style={{
                  marginTop: '0.4mm',
                  minHeight: '1.25cm',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  borderBottom: '0.6pt solid #94a3b8',
                  paddingBottom: '0.6mm',
                }}
              >
                {showSignature && (
                  <ReceiptSignature
                    signatureUrl={cashierSignatureUrl}
                    height="9mm"
                    color="#1e3a8a"
                  />
                )}
              </div>
              <div style={{ fontSize: '8.8pt', fontWeight: 800, color: '#0f2957', marginTop: '0.5mm', whiteSpace: 'nowrap' }}>
                {d.cashierText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * STYLE 3: MODERN TEAL MINIMAL (Clean Soft Studio — Landscape & Portrait)
 * ========================================================================= */
export function ModernTealReceiptCard(props: ReceiptCardSharedProps) {
  const {
    orientation = 'landscape',
    cashierSignatureUrl,
    showAmount = true,
    showSignature = true,
    showCutRight = false,
    showCutBottom = false,
  } = props;

  const d = extractReceiptDisplayData(props);
  const isPortrait = orientation === 'portrait';
  const slotW = isPortrait ? '10.5cm' : '14.85cm';
  const slotH = isPortrait ? '14.85cm' : '10.5cm';

  return (
    <div
      className="official-receipt-slot"
      style={{
        width: slotW,
        height: slotH,
        boxSizing: 'border-box',
        padding: '2.8mm',
        background: '#ffffff',
        borderRight: showCutRight ? '0.45pt dashed #cbd5e1' : 'none',
        borderBottom: showCutBottom ? '0.45pt dashed #cbd5e1' : 'none',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '0.75pt solid #99f6e4',
          borderLeft: isPortrait ? '0.75pt solid #99f6e4' : '3mm solid #0d9488',
          borderTop: isPortrait ? '3mm solid #0d9488' : '0.75pt solid #99f6e4',
          borderRadius: '10px',
          padding: isPortrait ? '2.8mm 3.4mm' : '2.4mm 3.6mm',
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Row: Official Banner + PAID Pill & Receipt Number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2mm',
            borderBottom: '0.65pt solid #e2e8f0',
            paddingBottom: '1.6mm',
          }}
        >
          <img
            src={d.bannerSrc}
            alt="BSIS"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fallbackUsed) {
                img.dataset.fallbackUsed = '1';
                img.src = '/bsis_receipt_banner.png';
              }
            }}
            style={{
              height: isPortrait ? '1.05cm' : '1.2cm',
              maxWidth: isPortrait ? '5.8cm' : '7.4cm',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          <div style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.2 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4mm 2.2mm',
                borderRadius: '999px',
                background: '#ccfbf1',
                color: '#0f766e',
                border: '0.6pt solid #5eead4',
                fontSize: '7pt',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              បានបង់រួច • PAID
            </span>
            <div style={{ fontSize: '9.4pt', fontWeight: 900, color: '#0f172a', marginTop: '0.6mm', whiteSpace: 'nowrap' }}>
              № <span style={{ color: '#0d9488' }}>{d.receiptNo6}</span>
            </div>
            <div style={{ fontSize: '6.8pt', color: '#64748b', whiteSpace: 'nowrap' }}>
              {d.dateDash} {[d.levelCode, d.shiftCode].filter(Boolean).length ? `• ${[d.teacherShortCode, d.levelCode, d.shiftCode].filter(Boolean).join(' / ')}` : ''}
            </div>
          </div>
        </div>

        {/* Clean Title + Student Name Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2mm',
            background: '#f0fdfa',
            border: '0.6pt solid #ccfbf1',
            borderRadius: '7px',
            padding: '1.5mm 2.6mm',
            marginTop: '1mm',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '6.4pt', color: '#0f766e', fontWeight: 700, whiteSpace: 'nowrap' }}>
              បង្កាន់ដៃទទួលប្រាក់ • STUDENT RECEIPT
            </div>
            <div
              style={{
                fontSize: d.studentName.length > 18 ? '9.2pt' : '10.4pt',
                fontWeight: 900,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {d.studentName || '-'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.25, whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '7.4pt', fontWeight: 700, color: '#334155' }}>
              ភេទ៖ {d.shortGender || '-'} • ចូលរៀនថ្ងៃទី {d.enrollDay || '-'}
            </div>
            {d.studentIdCode && (
              <div style={{ fontSize: '6.8pt', color: '#64748b', fontWeight: 600 }}>
                ID: {d.studentIdCode}
              </div>
            )}
          </div>
        </div>

        {/* Clean Key-Value Rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isPortrait ? '1fr' : '1fr 1fr',
            gap: isPortrait ? '1.6mm' : '1.4mm 2.4mm',
            marginTop: '1mm',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '0.5pt solid #e2e8f0',
              paddingBottom: '1mm',
              gap: '2mm',
            }}
          >
            <span style={{ fontSize: '7.2pt', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
              បង់ប្រាក់សម្រាប់ (Pay for)
            </span>
            <span style={{ fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {d.validitySpaced || '-'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '0.5pt solid #e2e8f0',
              paddingBottom: '1mm',
              gap: '2mm',
            }}
          >
            <span style={{ fontSize: '7.2pt', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
              វគ្គសិក្សា (Course)
            </span>
            <span
              style={{
                fontSize: '8.1pt',
                fontWeight: 800,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {d.courseName || '-'} ({d.shiftFullKh || d.shiftCode || '-'})
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0d9488',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '1.3mm 2.4mm',
              gap: '2mm',
            }}
          >
            <span style={{ fontSize: '7.2pt', fontWeight: 700, whiteSpace: 'nowrap' }}>
              សរុបទឹកប្រាក់ (Total)
            </span>
            <span style={{ fontSize: '9.4pt', fontWeight: 900, whiteSpace: 'nowrap' }}>
              {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : '—'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fef2f2',
              border: '0.6pt solid #fecaca',
              color: '#991b1b',
              borderRadius: '6px',
              padding: '1.3mm 2.4mm',
              gap: '2mm',
            }}
          >
            <span style={{ fontSize: '7.2pt', fontWeight: 700, whiteSpace: 'nowrap' }}>
              ថ្ងៃបង់បន្ទាប់ (Next)
            </span>
            <span style={{ fontSize: '8.7pt', fontWeight: 900, whiteSpace: 'nowrap' }}>
              {d.nextPaymentKh}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: isPortrait ? 'stretch' : 'flex-end',
            justifyContent: 'space-between',
            gap: isPortrait ? '1.8mm' : '2mm',
            marginTop: '1.2mm',
            paddingTop: '1mm',
            borderTop: '0.5pt solid #e2e8f0',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontSize: '6.55pt', lineHeight: 1.4, color: '#475569', letterSpacing: '-0.018em' }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#0f766e' }}>បញ្ជាក់៖</strong> ប្រាក់ដែលបានបង់រួចហើយមិនអាចដកវិញ ឬផ្ទេរបានឡើយ • បង់មុនផុតកំណត់ ៣ថ្ងៃ។
            </div>
            <div style={{ marginTop: '0.4mm', color: '#0f172a', whiteSpace: 'nowrap' }}>
              <strong>TEL/Telegram:</strong> {d.phoneText}
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>
              <strong>អាសយដ្ឋាន៖</strong> {d.addressText}
            </div>
          </div>

          <div
            style={{
              width: isPortrait ? '3.8cm' : '3.45cm',
              marginLeft: isPortrait ? 'auto' : 0,
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
              អ្នកទទួលប្រាក់
            </div>
            <div
              style={{
                minHeight: '1.25cm',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                borderBottom: '0.6pt dashed #0d9488',
                paddingBottom: '0.5mm',
              }}
            >
              {showSignature && (
                <ReceiptSignature
                  signatureUrl={cashierSignatureUrl}
                  height="8.8mm"
                  color="#0f766e"
                />
              )}
            </div>
            <div style={{ fontSize: '8.8pt', fontWeight: 800, color: '#0f766e', marginTop: '0.4mm', whiteSpace: 'nowrap' }}>
              {d.cashierText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * STYLE 4: MODERN ROYAL FRAME (Official Double-Border Academic Receipt)
 * ========================================================================= */
export function ModernRoyalReceiptCard(props: ReceiptCardSharedProps) {
  const {
    orientation = 'landscape',
    cashierSignatureUrl,
    showAmount = true,
    showSignature = true,
    showCutRight = false,
    showCutBottom = false,
  } = props;

  const d = extractReceiptDisplayData(props);
  const isPortrait = orientation === 'portrait';
  const slotW = isPortrait ? '10.5cm' : '14.85cm';
  const slotH = isPortrait ? '14.85cm' : '10.5cm';
  const cellBorder = '0.55pt solid #94a3b8';

  return (
    <div
      className="official-receipt-slot"
      style={{
        width: slotW,
        height: slotH,
        boxSizing: 'border-box',
        padding: '2.6mm',
        background: '#ffffff',
        borderRight: showCutRight ? '0.45pt dashed #cbd5e1' : 'none',
        borderBottom: showCutBottom ? '0.45pt dashed #cbd5e1' : 'none',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '0.9pt solid #1d4ed8',
          borderRadius: '8px',
          padding: '1mm',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            border: '0.45pt solid #93c5fd',
            borderRadius: '6px',
            padding: isPortrait ? '2.5mm 3mm' : '2mm 3.2mm',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
            color: '#0f172a',
          }}
        >
          {/* Watermark */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '54%',
              transform: 'translate(-50%, -50%)',
              width: '4.4cm',
              height: '4.4cm',
              objectFit: 'contain',
              opacity: 0.08,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Centered Header Banner + Ribbon Title */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '7.4pt',
                fontWeight: 800,
                color: '#1e40af',
                textAlign: 'right',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              <div>{[d.teacherShortCode, d.levelCode].filter(Boolean).join(' • ')}</div>
              {d.shiftCode && <div style={{ color: '#475569' }}>{d.shiftCode}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingRight: '1.2cm' }}>
              <img
                src={d.bannerSrc}
                alt="BSIS"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackUsed) {
                    img.dataset.fallbackUsed = '1';
                    img.src = '/bsis_receipt_banner.png';
                  }
                }}
                style={{
                  height: isPortrait ? '1.12cm' : '1.3cm',
                  maxWidth: isPortrait ? '7.2cm' : '8.8cm',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1mm',
                gap: '1.5mm',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '7.6pt', fontWeight: 700, color: '#1e40af' }}>
                Date: <em style={{ fontStyle: 'italic' }}>{d.dateDash}</em>
              </span>

              <span
                style={{
                  padding: '0.5mm 3.5mm',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '8.2pt',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}
              >
                បង្កាន់ដៃទទួលប្រាក់ • RECEIPT
              </span>

              <span style={{ fontSize: '8.4pt', fontWeight: 900, color: '#b91c1c' }}>
                № {d.receiptNo6}
              </span>
            </div>
          </div>

          {/* Crisp Academic Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              position: 'relative',
              zIndex: 1,
              marginTop: '1mm',
              background: 'rgba(255,255,255,0.68)',
              fontSize: '7.8pt',
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: cellBorder,
                    background: '#eff6ff',
                    padding: '1.1mm 1.8mm',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    width: isPortrait ? '33%' : '20%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ឈ្មោះសិស្ស
                </td>
                <td
                  colSpan={isPortrait ? 1 : 3}
                  style={{
                    border: cellBorder,
                    padding: '1.1mm 2mm',
                    fontWeight: 800,
                    fontSize: '9.4pt',
                    color: '#1e3a8a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.studentName || '-'}
                  {d.studentIdCode ? ` (${d.studentIdCode})` : ''}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: cellBorder,
                    background: '#eff6ff',
                    padding: '1.1mm 1.8mm',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ភេទ / ចូលរៀន
                </td>
                <td
                  style={{
                    border: cellBorder,
                    padding: '1.1mm 2mm',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.shortGender || '-'} • ថ្ងៃទី {d.enrollDay || '-'}
                </td>
                {!isPortrait && (
                  <>
                    <td
                      style={{
                        border: cellBorder,
                        background: '#eff6ff',
                        padding: '1.1mm 1.8mm',
                        fontWeight: 700,
                        color: '#1e3a8a',
                        width: '18%',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      វគ្គ & វេន
                    </td>
                    <td
                      style={{
                        border: cellBorder,
                        padding: '1.1mm 2mm',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.courseName || '-'} ({d.shiftFullKh || d.shiftCode || '-'})
                    </td>
                  </>
                )}
              </tr>

              {isPortrait && (
                <tr>
                  <td
                    style={{
                      border: cellBorder,
                      background: '#eff6ff',
                      padding: '1.1mm 1.8mm',
                      fontWeight: 700,
                      color: '#1e3a8a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    វគ្គ & វេន
                  </td>
                  <td
                    style={{
                      border: cellBorder,
                      padding: '1.1mm 2mm',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.courseName || '-'} ({d.shiftFullKh || d.shiftCode || '-'})
                  </td>
                </tr>
              )}

              <tr>
                <td
                  style={{
                    border: cellBorder,
                    background: '#eff6ff',
                    padding: '1.1mm 1.8mm',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  បង់សម្រាប់
                </td>
                <td
                  style={{
                    border: cellBorder,
                    padding: '1.1mm 2mm',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.validitySpaced || '-'}
                </td>
                {!isPortrait && (
                  <>
                    <td
                      style={{
                        border: cellBorder,
                        background: '#eff6ff',
                        padding: '1.1mm 1.8mm',
                        fontWeight: 700,
                        color: '#1e3a8a',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      វិធីបង់ / ខែ
                    </td>
                    <td
                      style={{
                        border: cellBorder,
                        padding: '1.1mm 2mm',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.monthsPaid} ខែ • {d.payMethod}
                    </td>
                  </>
                )}
              </tr>

              <tr>
                <td
                  style={{
                    border: cellBorder,
                    background: '#dbeafe',
                    padding: '1.2mm 1.8mm',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  សរុបទឹកប្រាក់
                </td>
                <td
                  style={{
                    border: cellBorder,
                    background: '#eff6ff',
                    padding: '1.2mm 2mm',
                    fontWeight: 900,
                    fontSize: '9pt',
                    color: '#1e3a8a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : ''}
                </td>
                {!isPortrait && (
                  <>
                    <td
                      style={{
                        border: cellBorder,
                        background: '#fed7aa',
                        padding: '1.2mm 1.8mm',
                        fontWeight: 800,
                        color: '#9a3412',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ថ្ងៃបង់បន្ទាប់
                    </td>
                    <td
                      style={{
                        border: cellBorder,
                        background: '#ffedd5',
                        padding: '1.2mm 2mm',
                        fontWeight: 900,
                        fontSize: '8.5pt',
                        color: '#9a3412',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.nextPaymentKh}
                    </td>
                  </>
                )}
              </tr>

              {isPortrait && (
                <tr>
                  <td
                    style={{
                      border: cellBorder,
                      background: '#fed7aa',
                      padding: '1.2mm 1.8mm',
                      fontWeight: 800,
                      color: '#9a3412',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ថ្ងៃបង់បន្ទាប់
                  </td>
                  <td
                    style={{
                      border: cellBorder,
                      background: '#ffedd5',
                      padding: '1.2mm 2mm',
                      fontWeight: 900,
                      fontSize: '8.7pt',
                      color: '#9a3412',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.nextPaymentKh}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: isPortrait ? 'stretch' : 'flex-end',
              justifyContent: 'space-between',
              gap: isPortrait ? '1.6mm' : '1.8mm',
              marginTop: '1mm',
            }}
          >
            <div style={{ flex: 1, minWidth: 0, fontSize: '6.55pt', lineHeight: 1.4, color: '#334155', letterSpacing: '-0.018em' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1e3a8a', textDecoration: 'underline' }}>បញ្ជាក់៖</strong>{' '}
                ទឹកប្រាក់ដែលបានបង់រួចហើយ មិនអាចដកវិញ ឬផ្ទេរទៅអ្នកផ្សេងបានឡើយ។
              </div>
              <div style={{ whiteSpace: 'nowrap' }}>
                ត្រូវបង់មុនថ្ងៃផុតកំណត់យ៉ាងហោចណាស់ ៣ថ្ងៃ • ការយឺតយ៉ាវនឹងត្រូវផាកពិន័យ។
              </div>
              <div style={{ marginTop: '0.4mm', whiteSpace: 'nowrap' }}>
                <strong>ទំនាក់ទំនង៖</strong> {d.phoneText}
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>
                <strong>អាសយដ្ឋាន៖</strong> {d.addressText}
              </div>
            </div>

            <div
              style={{
                width: isPortrait ? '3.8cm' : '3.45cm',
                marginLeft: isPortrait ? 'auto' : 0,
                flexShrink: 0,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '8.4pt', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5mm', whiteSpace: 'nowrap' }}>
                អ្នកទទួលប្រាក់
              </div>
              <div
                style={{
                  height: '1.55cm',
                  border: '0.6pt solid #93c5fd',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  padding: '0.6mm 1mm 0.8mm',
                }}
              >
                {showSignature && (
                  <div style={{ width: '100%', marginBottom: '-0.6mm' }}>
                    <ReceiptSignature
                      signatureUrl={cashierSignatureUrl}
                      height="9mm"
                      color="#1d4ed8"
                    />
                  </div>
                )}
                <span style={{ fontSize: '8.8pt', fontWeight: 800, color: '#9b3a24', whiteSpace: 'nowrap' }}>
                  {d.cashierText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
