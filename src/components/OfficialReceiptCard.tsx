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
  classCode?: string;
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
  prePrintedOnly?: boolean;
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
    prePrintedOnly = false,
    showCutRight = false,
    showCutBottom = false,
  } = props;

  const d = extractReceiptDisplayData(props);
  const isPortrait = orientation === 'portrait';
  const slotW = isPortrait ? '10.5cm' : '14.85cm';
  const slotH = isPortrait ? '14.85cm' : '10.5cm';

  const thinBorder = '0.75pt solid #334155';
  const outerBorder = '0.9pt solid #334155';
  const nameFontSize =
    d.studentName.length > 22 ? '10.5pt' : d.studentName.length > 16 ? '11.8pt' : '13pt';

  return (
    <div
      className="official-receipt-slot"
      style={{
        width: slotW,
        height: slotH,
        boxSizing: 'border-box',
        padding: '2.5mm',
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
          border: prePrintedOnly ? '0.9pt solid transparent' : outerBorder,
          borderRadius: '9px',
          padding: isPortrait ? '3.2mm 3.4mm 2.8mm' : '2.2mm 3.4mm 2mm',
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
        {/* Center School Emblem Watermark (Hidden when printing onto pre-printed stationery) */}
        {!prePrintedOnly && (
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: isPortrait ? '51%' : '54%',
              transform: 'translate(-50%, -50%)',
              width: isPortrait ? '5.4cm' : '5.2cm',
              height: isPortrait ? '5.4cm' : '5.2cm',
              objectFit: 'contain',
              opacity: 0.13,
              pointerEvents: 'none',
              zIndex: 0,
              userSelect: 'none',
            }}
          />
        )}

        {/* Top-Right Teacher Short Code + Level + Shift */}
        <div
          style={{
            position: 'absolute',
            top: '2.8mm',
            right: '3.8mm',
            zIndex: 2,
            textAlign: 'right',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '3.5mm' }}>
            {d.teacherShortCode && (
              <span
                style={{
                  fontSize: '8.8pt',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.02em',
                }}
              >
                {d.teacherShortCode}
              </span>
            )}
            <span
              style={{
                fontSize: '9.4pt',
                fontWeight: 800,
                color: '#1e293b',
                minWidth: '7mm',
                display: 'inline-block',
              }}
            >
              {d.levelCode}
            </span>
          </div>
          {d.shiftCode && (
            <div style={{ fontSize: '9.4pt', fontWeight: 800, color: '#1e293b', marginTop: '0.6mm' }}>
              {d.shiftCode}
            </div>
          )}
        </div>

        {/* Header Banner + Title (visibility:hidden preserves exact mm coordinates in prePrintedOnly mode) */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingRight: isPortrait ? '1.3cm' : '1.9cm',
              visibility: prePrintedOnly ? 'hidden' : 'visible',
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
                height: isPortrait ? '1.45cm' : '1.78cm',
                maxWidth: isPortrait ? '7.8cm' : '10.2cm',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: isPortrait ? '1.2mm' : '0.2mm',
              visibility: prePrintedOnly ? 'hidden' : 'visible',
            }}
          >
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: isPortrait ? '13pt' : '14.2pt',
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
                fontSize: isPortrait ? '11.8pt' : '12.8pt',
                color: '#374151',
                letterSpacing: '0.04em',
                lineHeight: 1.05,
                marginTop: '-0.8mm',
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
              marginTop: isPortrait ? '1.2mm' : '-2.4mm',
              padding: '0 0.6mm',
              whiteSpace: 'nowrap',
            }}
          >
            <div>
              <span style={{ fontSize: '9.6pt', fontWeight: 600, color: '#334155' }}>Date:</span>
              <span
                style={{
                  fontSize: '10pt',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#1e5aa8',
                  marginLeft: '3.2mm',
                }}
              >
                {d.dateDash}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '9.8pt', fontWeight: 700, color: '#334155' }}>№ :</span>
              <span
                style={{
                  fontSize: '11.6pt',
                  fontWeight: 800,
                  color: '#b5392c',
                  letterSpacing: '0.04em',
                  marginLeft: '2mm',
                }}
              >
                {d.receiptNo6}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body — Landscape (Full Original Proportions) vs Portrait */}
        {!isPortrait ? (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.9mm',
              marginTop: '0.6mm',
            }}
          >
            {/* Row 1: Name | Gender | Enroll Day */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5mm' }}>
              <div
                style={{
                  width: '2.5cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '10pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.015em' }}>
                  ឈ្មោះសិស្ស
                </span>
                <span style={{ fontSize: '7.6pt', fontWeight: 600, color: '#475569' }}>
                  Student&apos;s Name
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '8.6mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.6mm',
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
                <span style={{ fontSize: '9.4pt', fontWeight: 700, color: '#374151' }}>ភេទ</span>
                <span style={{ fontSize: '7.4pt', fontWeight: 600, color: '#475569' }}>Gender</span>
              </div>
              <div
                style={{
                  width: '1.04cm',
                  height: '8.6mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11.4pt',
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
                <span style={{ fontSize: '9pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  ចូលរៀនថ្ងៃទី
                </span>
                <span style={{ fontSize: '7.4pt', fontWeight: 600, color: '#475569' }}>Enroll Date</span>
              </div>
              <div
                style={{
                  width: '1.04cm',
                  height: '8.6mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11.4pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.enrollDay}
              </div>
            </div>

            {/* Row 2: Pay For | Total Amount */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5mm' }}>
              <div
                style={{
                  width: '2.5cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '9.4pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  បង់ប្រាក់សម្រាប់
                </span>
                <span style={{ fontSize: '7.6pt', fontWeight: 600, color: '#475569' }}>Pay for</span>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '8.5mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.45)',
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
                    padding: '0 1.2mm',
                    fontSize: '10.4pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.validitySpaced}
                </div>
                <div
                  style={{
                    width: '1.18cm',
                    flexShrink: 0,
                    borderLeft: thinBorder,
                    background: 'rgba(241, 245, 249, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9pt',
                    fontWeight: 800,
                    color: '#1e40af',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.monthsPaid} ខែ
                </div>
              </div>

              <div
                style={{
                  width: '2.85cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  paddingLeft: '0.6mm',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>
                  សរុបទឹកប្រាក់
                </span>
                <span style={{ fontSize: '7.6pt', fontWeight: 600, color: '#475569' }}>Total Amount</span>
              </div>
              <div
                style={{
                  width: '3.45cm',
                  height: '8.5mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: '#c4cdd9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.2mm',
                  fontSize: '10.8pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : ''}
              </div>
            </div>

            {/* Row 3: Course + Shift Split | Next Payment */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5mm' }}>
              <div
                style={{
                  width: '1.7cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.015em' }}>
                  វគ្គសិក្សា
                </span>
                <span style={{ fontSize: '7.6pt', fontWeight: 600, color: '#475569' }}>Course</span>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: '9mm',
                  border: thinBorder,
                  background: 'rgba(255, 255, 255, 0.45)',
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
                    padding: '0.4mm 1.4mm',
                    fontSize: d.courseName.length > 22 ? '8.6pt' : '9.6pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    lineHeight: 1.14,
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
                    textAlign: 'center',
                    fontSize: '8.6pt',
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
                  width: '2.85cm',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  lineHeight: 1.12,
                  paddingLeft: '0.6mm',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '9pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.025em' }}>
                  ថ្ងៃបង់ប្រាក់បន្ទាប់
                </span>
                <span style={{ fontSize: '7.6pt', fontWeight: 600, color: '#475569' }}>Next Payment</span>
              </div>
              <div
                style={{
                  width: '3.45cm',
                  minHeight: '9mm',
                  flexShrink: 0,
                  border: thinBorder,
                  background: '#ecd3c6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1mm',
                  fontSize: '10.6pt',
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
              gap: '2.6mm',
              marginTop: '1.5mm',
            }}
          >
            {/* Name Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
              <div style={{ width: '2.5cm', flexShrink: 0, lineHeight: 1.14, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9.4pt', fontWeight: 700, color: '#374151' }}>ឈ្មោះសិស្ស</div>
                <div style={{ fontSize: '7.2pt', fontWeight: 600, color: '#475569' }}>Student&apos;s Name</div>
              </div>
              <div
                style={{
                  flex: 1,
                  height: '8.6mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.52)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.6mm',
                }}
              >
                <span style={{ fontSize: nameFontSize, fontWeight: 800, color: '#25438a', whiteSpace: 'nowrap' }}>
                  {d.studentName}
                </span>
              </div>
            </div>

            {/* Gender + Enroll Day Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
              <div style={{ width: '2.5cm', flexShrink: 0, lineHeight: 1.14, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9pt', fontWeight: 700, color: '#374151' }}>ភេទ / ចូលរៀន</div>
                <div style={{ fontSize: '7pt', fontWeight: 600, color: '#475569' }}>Gender / Enroll</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
                <div
                  style={{
                    flex: 1,
                    height: '8.2mm',
                    border: thinBorder,
                    background: 'rgba(255,255,255,0.52)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10pt',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ភេទ៖ {d.shortGender || '-'}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '8.2mm',
                    border: thinBorder,
                    background: 'rgba(255,255,255,0.52)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10pt',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ថ្ងៃទី {d.enrollDay || '-'}
                </div>
              </div>
            </div>

            {/* Pay For Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
              <div style={{ width: '2.5cm', flexShrink: 0, lineHeight: 1.14, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9pt', fontWeight: 700, color: '#374151', letterSpacing: '-0.02em' }}>បង់ប្រាក់សម្រាប់</div>
                <div style={{ fontSize: '7.2pt', fontWeight: 600, color: '#475569' }}>Pay for</div>
              </div>
              <div
                style={{
                  flex: 1,
                  height: '8.4mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.52)',
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
                    padding: '0 1.2mm',
                    fontSize: '10.2pt',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.validitySpaced}
                </div>
                <div
                  style={{
                    width: '1.3cm',
                    flexShrink: 0,
                    borderLeft: thinBorder,
                    background: 'rgba(241, 245, 249, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9pt',
                    fontWeight: 800,
                    color: '#1e40af',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.monthsPaid} ខែ
                </div>
              </div>
            </div>

            {/* Course + Shift Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8mm' }}>
              <div style={{ width: '2.5cm', flexShrink: 0, lineHeight: 1.14, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '9.4pt', fontWeight: 700, color: '#374151' }}>វគ្គសិក្សា</div>
                <div style={{ fontSize: '7.2pt', fontWeight: 600, color: '#475569' }}>Course</div>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: '8.8mm',
                  border: thinBorder,
                  background: 'rgba(255,255,255,0.52)',
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
                    fontSize: '9.2pt',
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  {d.courseName}
                </div>
                <div
                  style={{
                    width: '1.3cm',
                    flexShrink: 0,
                    borderLeft: thinBorder,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8.2pt',
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm', marginTop: '0.8mm' }}>
              <div>
                <div style={{ fontSize: '8.2pt', fontWeight: 700, color: '#374151', marginBottom: '0.8mm', whiteSpace: 'nowrap' }}>
                  សរុបទឹកប្រាក់ / Total
                </div>
                <div
                  style={{
                    height: '9mm',
                    border: thinBorder,
                    background: '#c4cdd9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10.6pt',
                    fontWeight: 800,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showAmount && d.totalPaid > 0 ? formatRiels(d.totalPaid) : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '8.2pt', fontWeight: 700, color: '#374151', marginBottom: '0.8mm', whiteSpace: 'nowrap' }}>
                  ថ្ងៃបង់បន្ទាប់ / Next
                </div>
                <div
                  style={{
                    height: '9mm',
                    border: thinBorder,
                    background: '#ecd3c6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10pt',
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

        {/* Footer: visibility:hidden preserves exact mm spacing when prePrintedOnly is enabled */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: isPortrait ? 'column' : 'row',
            alignItems: isPortrait ? 'stretch' : 'flex-end',
            justifyContent: 'space-between',
            gap: isPortrait ? '2.2mm' : '1.8mm',
            marginTop: '1mm',
            visibility: prePrintedOnly ? 'hidden' : 'visible',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: isPortrait ? '6.6pt' : '7.15pt',
              lineHeight: 1.44,
              letterSpacing: '-0.02em',
              color: '#1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2mm' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: isPortrait ? '7.6pt' : '8.5pt',
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

            <div style={{ marginTop: '0.8mm', paddingLeft: isPortrait ? '0' : '1.18cm' }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 800, fontSize: isPortrait ? '7.2pt' : '7.8pt', textDecoration: 'underline' }}>
                  ទំនាក់ទំនង
                </span>
                <span> : TEL/តេលេក្រាម៖ {d.phoneText}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8mm' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: isPortrait ? '7.2pt' : '7.8pt',
                    textDecoration: 'underline',
                    whiteSpace: 'nowrap',
                  }}
                >
                  អាសយដ្ឋាន
                </span>
                <span>:</span>
                <span style={{ whiteSpace: 'pre-line' }}>{d.addressText}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              width: isPortrait ? '4cm' : '3.65cm',
              marginLeft: isPortrait ? 'auto' : 0,
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: '9.4pt',
                color: '#1e293b',
                marginBottom: '0.8mm',
                whiteSpace: 'nowrap',
              }}
            >
              អ្នកទទួលប្រាក់
            </div>
            <div
              style={{
                height: isPortrait ? '1.85cm' : '1.78cm',
                border: thinBorder,
                borderRadius: '8px',
                background: 'rgba(241, 245, 249, 0.52)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '0.8mm 1.2mm 1.2mm',
                position: 'relative',
              }}
            >
              {showSignature && (
                <div style={{ width: '100%', marginBottom: '-0.8mm' }}>
                  <ReceiptSignature
                    signatureUrl={cashierSignatureUrl}
                    height={isPortrait ? '10.2mm' : '9.8mm'}
                  />
                </div>
              )}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '9.8pt',
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
