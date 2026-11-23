"use client";

import React from 'react';
import {
  DEFAULT_RECEIPT_ADDRESS,
  DEFAULT_RECEIPT_CASHIER,
  DEFAULT_RECEIPT_PHONE,
  extractEnrollDay,
  formatDMYDash,
  formatKhmerNextPaymentDate,
  formatKhmerValidityPeriodSpaced,
  formatReceiptNo6Digit,
  formatRiels,
  formatShiftTwoLinesKh,
  formatShortGenderKh,
  normalizePaymentRiels,
  resolveReceiptBannerSrc,
} from '@/utils/paymentBilling';
import ReceiptSignature from './receipts/ReceiptSignature';

export type ReceiptOrientation = 'landscape' | 'portrait';
export type ReceiptTemplateId = 'classic' | 'modern_navy' | 'modern_teal' | 'modern_royal';

export interface OfficialReceiptItem {
  payment: any;
  student: any;
  roomAndTeacher?: string;
  courseName?: string;
  teacherShortCode?: string;
}

export interface ReceiptCardSharedProps {
  item: OfficialReceiptItem;
  orientation?: ReceiptOrientation;
  schoolPhone?: string;
  schoolAddress?: string;
  cashierName?: string;
  cashierSignatureUrl?: string;
  headerLogoUrl?: string;
  showAmount?: boolean;
  showSignature?: boolean;
  showCutRight?: boolean;
  showCutBottom?: boolean;
}

export function extractReceiptDisplayData(props: ReceiptCardSharedProps) {
  const { item, schoolPhone, schoolAddress, cashierName, headerLogoUrl } = props;
  const { payment, student } = item;

  const bannerSrc = resolveReceiptBannerSrc(headerLogoUrl);
  const dateDash = formatDMYDash(payment?.paymentDate || new Date());
  const receiptNo6 = formatReceiptNo6Digit(payment?.receiptNo || payment?.id);
  const studentName = String(student?.fullName || payment?.studentName || '').trim();
  const studentIdCode = String(student?.studentId || payment?.studentIdCode || '').trim();
  const shortGender = formatShortGenderKh(student?.gender || payment?.gender);
  const enrollDay = extractEnrollDay(student?.enrollDate || payment?.enrollDate);

  const validFrom = payment?.validFrom || payment?.paymentDate || '';
  const validUntil = payment?.validUntil || student?.nextPaymentDate || '';
  const validitySpaced =
    formatKhmerValidityPeriodSpaced(validFrom, validUntil) || payment?.validityPeriod || '';

  const totalPaid = normalizePaymentRiels(payment?.amount, payment);
  const levelCode = String(payment?.level || student?.level || '').trim();
  const shiftCode = String(payment?.shift || student?.shift || '').trim();
  const [shiftLine1, shiftLine2] = formatShiftTwoLinesKh(shiftCode);
  const shiftFullKh = [shiftLine1, shiftLine2].filter(Boolean).join('');
  const courseName = String(item.courseName || payment?.courseName || levelCode || '').trim();
  const teacherShortCode = String(
    item.teacherShortCode || payment?.teacherShortCode || ''
  ).trim();
  const roomAndTeacher = String(item.roomAndTeacher || payment?.roomAndTeacher || '').trim();
  const nextPaymentKh = formatKhmerNextPaymentDate(validUntil);
  const payMethod = String(payment?.method || 'Cash').trim();
  const monthsPaid = Number(payment?.monthsPaid || 1);

  const phoneText = (schoolPhone || '').trim() || DEFAULT_RECEIPT_PHONE;
  const addressText = (schoolAddress || '').trim() || DEFAULT_RECEIPT_ADDRESS;
  const cashierText = (cashierName || '').trim() || DEFAULT_RECEIPT_CASHIER;

  return {
    bannerSrc,
    dateDash,
    receiptNo6,
    studentName,
    studentIdCode,
    shortGender,
    enrollDay,
    validitySpaced,
    totalPaid,
    levelCode,
    shiftCode,
    shiftLine1,
    shiftLine2,
    shiftFullKh,
    courseName,
    teacherShortCode,
    roomAndTeacher,
    nextPaymentKh,
    payMethod,
    monthsPaid,
    phoneText,
    addressText,
    cashierText,
  };
}

export default function OfficialReceiptCard(props: ReceiptCardSharedProps) {
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

  const thinBorder = '0.65pt solid #475569';
  const outerBorder = '0.85pt solid #475569';
  const nameFontSize =
    d.studentName.length > 22 ? '8.8pt' : d.studentName.length > 16 ? '9.8pt' : '10.5pt';

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
          border: outerBorder,
          borderRadius: '8px',
          padding: isPortrait ? '3mm 3.4mm 2.8mm' : '2mm 3.2mm 2mm',
          position: 'relative',
          overflow: 'hidden',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
            top: isPortrait ? '50%' : '53%',
            transform: 'translate(-50%, -50%)',
            width: isPortrait ? '4.8cm' : '4.5cm',
            height: isPortrait ? '4.8cm' : '4.5cm',
            objectFit: 'contain',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
            userSelect: 'none',
          }}
        />

        {/* Top-Right Teacher Short Code + Level + Shift */}
        <div
          style={{
            position: 'absolute',
            top: '2.4mm',
            right: '3.4mm',
            zIndex: 2,
            textAlign: 'right',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '3.2mm' }}>
            {d.teacherShortCode && (
              <span
                style={{
                  fontSize: '7.6pt',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.01em',
                }}
              >
                {d.teacherShortCode}
              </span>
            )}
            <span
              style={{
                fontSize: '8.3pt',
                fontWeight: 800,
                color: '#1e293b',
                minWidth: '6.5mm',
                display: 'inline-block',
              }}
            >
              {d.levelCode}
            </span>
          </div>
          {d.shiftCode && (
            <div style={{ fontSize: '8.3pt', fontWeight: 800, color: '#1e293b', marginTop: '0.5mm' }}>
              {d.shiftCode}
            </div>
          )}
        </div>

        {/* Header Banner + Title + Date/ReceiptNo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingRight: isPortrait ? '1.3cm' : '1.4cm',
            }}
          >
            <img
              src={d.bannerSrc}
              alt="Brainstorm International School"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallbackUsed) {
                  img.dataset.fallbackUsed = '1';
                  img.src = '/bsis_receipt_banner.png';
                }
              }}
              style={{
                height: isPortrait ? '1.22cm' : '1.42cm',
                maxWidth: isPortrait ? '7.5cm' : '9.2cm',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: isPortrait ? '1.2mm' : '0.3mm' }}>
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: isPortrait ? '11pt' : '11.4pt',
                color: '#374151',
                lineHeight: 1.32,
                whiteSpace: 'nowrap',
              }}
            >
              បង្កាន់ដៃទទួលប្រាក់
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Roboto', sans-serif",
                fontWeight: 900,
                fontSize: isPortrait ? '10.2pt' : '10.6pt',
                color: '#374151',
                letterSpacing: '0.05em',
                lineHeight: 1.05,
                marginTop: '-0.6mm',
              }}
            >
              RECEIPT
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: isPortrait ? '1mm' : '-1.8mm',
              padding: '0 0.6mm',
              whiteSpace: 'nowrap',
            }}
          >
            <div>
              <span style={{ fontSize: '8.3pt', fontWeight: 600, color: '#334155' }}>Date:</span>
              <span
                style={{
                  fontSize: '8.6pt',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#1e5aa8',
                  marginLeft: '2.5mm',
                }}
              >
                {d.dateDash}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '8.5pt', fontWeight: 700, color: '#334155' }}>№ :</span>
              <span
                style={{
                  fontSize: '9.8pt',
                  fontWeight: 800,
                  color: '#b5392c',
                  letterSpacing: '0.04em',
                  marginLeft: '1.8mm',
                }}
              >
                {d.receiptNo6}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body — Landscape (Exact Photo Match) vs Portrait (Clean Stacked A6) */}
        {!isPortrait ? (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.35mm',
              marginTop: '0.5mm',
            }}
          >
            {/* Row 1: Name | Gender | Enroll Day */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.4mm' }}>
              <div
                style={{
                  width: '2.25cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '8.1pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.015em' }}>
                  ឈ្មោះសិស្ស
                </span>
                <span style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>
                  Student&apos;s Name
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '6.9mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.4mm',
                }}
              >
                <span
                  style={{
                    fontSize: nameFontSize,
                    fontWeight: 800,
                    color: '#25438a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.studentName}
                </span>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '8pt', fontWeight: 700, color: '#374151' }}>ភេទ</span>
                <span style={{ fontSize: '6.4pt', fontWeight: 600, color: '#475569' }}>Gender</span>
              </div>
              <div
                style={{
                  width: '0.96cm',
                  height: '6.9mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.4pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.shortGender}
              </div>

              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '7.6pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  ចូលរៀនថ្ងៃទី
                </span>
                <span style={{ fontSize: '6.4pt', fontWeight: 600, color: '#475569' }}>Enroll Date</span>
              </div>
              <div
                style={{
                  width: '0.96cm',
                  height: '6.9mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.4pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.enrollDay}
              </div>
            </div>

            {/* Row 2: Pay For | Total Amount */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.4mm' }}>
              <div
                style={{
                  width: '2.25cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '7.8pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  បង់ប្រាក់សម្រាប់
                </span>
                <span style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>Pay for</span>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '6.8mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.2mm',
                  fontSize: '8.9pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.validitySpaced}
              </div>

              <div
                style={{
                  width: '2.55cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  paddingLeft: '0.6mm',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '7.9pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  សរុបទឹកប្រាក់
                </span>
                <span style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>Total Amount</span>
              </div>
              <div
                style={{
                  width: '3.25cm',
                  height: '6.8mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: '#c4cdd9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1mm',
                  fontSize: '9pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : ''}
              </div>
            </div>

            {/* Row 3: Course + Shift Split | Next Payment */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.4mm' }}>
              <div
                style={{
                  width: '1.48cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '7.9pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.015em' }}>
                  វគ្គសិក្សា
                </span>
                <span style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>Course</span>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: '7.2mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0.3mm 1.2mm',
                    fontSize: d.courseName.length > 22 ? '7.4pt' : '8pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    lineHeight: 1.12,
                  }}
                >
                  {d.courseName}
                </div>
                <div
                  style={{
                    width: '1.05cm',
                    flexShrink: 0,
                    borderLeft: thinBorder,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '7.2pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{d.shiftLine1}</span>
                  {d.shiftLine2 && <span>{d.shiftLine2}</span>}
                </div>
              </div>

              <div
                style={{
                  width: '2.55cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  paddingLeft: '0.6mm',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.025em' }}>
                  ថ្ងៃបង់ប្រាក់បន្ទាប់
                </span>
                <span style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>Next Payment</span>
              </div>
              <div
                style={{
                  width: '3.25cm',
                  minHeight: '7.2mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: '#ecd3c6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 0.8mm',
                  fontSize: '8.7pt',
                  fontWeight: 800,
                  color: '#9b3a24',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.nextPaymentKh}
              </div>
            </div>
          </div>
        ) : (
          /* Portrait Classic Form Layout (10.5cm × 14.85cm) */
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '2.2mm',
              marginTop: '1.5mm',
            }}
          >
            {/* Name Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6mm' }}>
              <div style={{ width: '2.25cm', flexShrink: 0, lineHeight: 1.12, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '7.9pt', fontWeight: 700, color: '#374151' }}>ឈ្មោះសិស្ស</div>
                <div style={{ fontSize: '6.4pt', fontWeight: 600, color: '#475569' }}>Student&apos;s Name</div>
              </div>
              <div
                style={{
                  flex: 1,
                  height: '7.2mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.5mm',
                }}
              >
                <span style={{ fontSize: nameFontSize, fontWeight: 800, color: '#25438a', whiteSpace: 'nowrap' }}>
                  {d.studentName}
                </span>
              </div>
            </div>

            {/* Gender + Enroll Day Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6mm' }}>
              <div style={{ width: '2.25cm', flexShrink: 0, lineHeight: 1.12, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '7.9pt', fontWeight: 700, color: '#374151' }}>ភេទ / ចូលរៀន</div>
                <div style={{ fontSize: '6.3pt', fontWeight: 600, color: '#475569' }}>Gender / Enroll</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
                <div
                  style={{
                    flex: 1,
                    height: '6.8mm',
                    border: thinBorder,
                    background: 'rgba(255,255,255,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8.8pt',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ភេទ៖ {d.shortGender || '-'}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '6.8mm',
                    border: thinBorder,
                    background: 'rgba(255,255,255,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8.8pt',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ថ្ងៃទី {d.enrollDay || '-'}
                </div>
              </div>
            </div>

            {/* Pay For Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6mm' }}>
              <div style={{ width: '2.25cm', flexShrink: 0, lineHeight: 1.12, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '7.7pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>បង់ប្រាក់សម្រាប់</div>
                <div style={{ fontSize: '6.4pt', fontWeight: 600, color: '#475569' }}>Pay for</div>
              </div>
              <div
                style={{
                  flex: 1,
                  height: '6.9mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9pt',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {d.validitySpaced}
              </div>
            </div>

            {/* Course + Shift Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6mm' }}>
              <div style={{ width: '2.25cm', flexShrink: 0, lineHeight: 1.12, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '7.9pt', fontWeight: 700, color: '#374151' }}>វគ្គសិក្សា</div>
                <div style={{ fontSize: '6.4pt', fontWeight: 600, color: '#475569' }}>Course</div>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: '7.2mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.55)',
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0.4mm 1.2mm',
                    fontSize: '8.1pt',
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  {d.courseName}
                </div>
                <div
                  style={{
                    width: '1.2cm',
                    flexShrink: 0,
                    borderLeft: thinBorder,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '7.2pt',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{d.shiftLine1}</span>
                  {d.shiftLine2 && <span>{d.shiftLine2}</span>}
                </div>
              </div>
            </div>

            {/* Total Amount + Next Payment Dual Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm', marginTop: '0.6mm' }}>
              <div>
                <div style={{ fontSize: '7.3pt', fontWeight: 700, color: '#374151', marginBottom: '0.6mm', whiteSpace: 'nowrap' }}>
                  សរុបទឹកប្រាក់ / Total Amount
                </div>
                <div
                  style={{
                    height: '7.6mm',
                    border: thinBorder,
                    background: '#c4cdd9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9.2pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '7.3pt', fontWeight: 700, color: '#374151', marginBottom: '0.6mm', whiteSpace: 'nowrap' }}>
                  ថ្ងៃបង់បន្ទាប់ / Next Payment
                </div>
                <div
                  style={{
                    height: '7.6mm',
                    border: thinBorder,
                    background: '#ecd3c6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8.7pt',
                    fontWeight: 800,
                    color: '#9b3a24',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.nextPaymentKh}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Notes + Contact + Address & Cashier Signature Box */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: isPortrait ? 'stretch' : 'flex-end',
            justifyContent: 'space-between',
            gap: isPortrait ? '1.8mm' : '1.6mm',
            marginTop: '1mm',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: isPortrait ? '5.85pt' : '5.85pt',
              lineHeight: 1.42,
              letterSpacing: '-0.015em',
              color: '#1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.1mm' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '6.8pt',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                បញ្ជាក់ :
              </span>
              <div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  ទឹកប្រាក់ដែលបានបង់រួចហើយ មិនអាចដកវិញ ឬផ្ទេរទៅអ្នកផ្សេង បានឡើយ ។
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  ការបង់ប្រាក់បន្ទាប់ ត្រូវបង់មុនថ្ងៃផុតកំណត់ យ៉ាងហោចណាស់ រយៈពេល ៣ថ្ងៃ។
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  ការយឺតយ៉ាវក្នុងការបង់ប្រាក់ នឹងត្រូវផាកពិន័យ ។
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.6mm', paddingLeft: isPortrait ? '0' : '0.96cm' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 800, textDecoration: 'underline' }}>ទំនាក់ទំនង</span>
                <span> : TEL/តេលេក្រាម៖ {d.phoneText}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7mm' }}>
                <span style={{ fontWeight: 800, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                  អាសយដ្ឋាន
                </span>
                <span>:</span>
                <span style={{ whiteSpace: 'pre-line' }}>{d.addressText}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              width: isPortrait ? '3.7cm' : '3.25cm',
              marginLeft: isPortrait ? 'auto' : 0,
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: '7.9pt',
                color: '#1e293b',
                marginBottom: '0.6mm',
                whiteSpace: 'nowrap',
              }}
            >
              អ្នកទទួលប្រាក់
            </div>
            <div
              style={{
                height: isPortrait ? '1.65cm' : '1.46cm',
                border: thinBorder,
                borderRadius: '7px',
                background: 'rgba(241, 245, 249, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '0.8mm 1mm 1mm',
                position: 'relative',
              }}
            >
              {showSignature && (
                <div style={{ width: '100%', marginBottom: '-0.8mm' }}>
                  <ReceiptSignature
                    signatureUrl={cashierSignatureUrl}
                    height={isPortrait ? '9mm' : '8.2mm'}
                  />
                </div>
              )}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '8.3pt',
                  color: '#9b3a24',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.cashierText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
