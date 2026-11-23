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

export interface OfficialReceiptItem {
  payment: any;
  student: any;
  roomAndTeacher?: string;
  courseName?: string;
  teacherShortCode?: string;
}

interface OfficialReceiptCardProps {
  item: OfficialReceiptItem;
  schoolPhone?: string;
  schoolAddress?: string;
  cashierName?: string;
  headerLogoUrl?: string;
  showAmount?: boolean;
  showCutRight?: boolean;
  showCutBottom?: boolean;
}

export default function OfficialReceiptCard({
  item,
  schoolPhone,
  schoolAddress,
  cashierName,
  headerLogoUrl,
  showAmount = true,
  showCutRight = false,
  showCutBottom = false,
}: OfficialReceiptCardProps) {
  const { payment, student } = item;

  const bannerSrc = resolveReceiptBannerSrc(headerLogoUrl);
  const dateDash = formatDMYDash(payment?.paymentDate || new Date());
  const receiptNo6 = formatReceiptNo6Digit(payment?.receiptNo || payment?.id);
  const studentName = student?.fullName || payment?.studentName || '';
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
  const courseName =
    String(item.courseName || payment?.courseName || levelCode || '').trim();
  const teacherShortCode = String(
    item.teacherShortCode || payment?.teacherShortCode || ''
  ).trim();
  const nextPaymentKh = formatKhmerNextPaymentDate(validUntil);

  const phoneText = (schoolPhone || '').trim() || DEFAULT_RECEIPT_PHONE;
  const addressText = (schoolAddress || '').trim() || DEFAULT_RECEIPT_ADDRESS;
  const cashierText = (cashierName || '').trim() || DEFAULT_RECEIPT_CASHIER;

  return (
    <div
      className="official-receipt-slot"
      style={{
        width: '14.85cm',
        height: '10.5cm',
        boxSizing: 'border-box',
        padding: '3.2mm',
        background: '#ffffff',
        borderRight: showCutRight ? '0.5pt dashed #cbd5e1' : 'none',
        borderBottom: showCutBottom ? '0.5pt dashed #cbd5e1' : 'none',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '1.25pt solid #334155',
          borderRadius: '9px',
          padding: '2.2mm 3.8mm 2.2mm',
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
        {/* Center School Emblem Watermark */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '53%',
            transform: 'translate(-50%, -50%)',
            width: '4.65cm',
            height: '4.65cm',
            objectFit: 'contain',
            opacity: 0.13,
            pointerEvents: 'none',
            zIndex: 0,
            userSelect: 'none',
          }}
        />

        {/* Top-Right Teacher Short Code + Level + Shift */}
        <div
          style={{
            position: 'absolute',
            top: '2.8mm',
            right: '4mm',
            zIndex: 2,
            textAlign: 'right',
            lineHeight: 1.2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4mm' }}>
            {teacherShortCode && (
              <span
                style={{
                  fontSize: '8.2pt',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.02em',
                }}
              >
                {teacherShortCode}
              </span>
            )}
            <span
              style={{
                fontSize: '8.8pt',
                fontWeight: 800,
                color: '#1e293b',
                minWidth: '8mm',
                display: 'inline-block',
              }}
            >
              {levelCode}
            </span>
          </div>
          {shiftCode && (
            <div
              style={{
                fontSize: '8.8pt',
                fontWeight: 800,
                color: '#1e293b',
                marginTop: '0.8mm',
              }}
            >
              {shiftCode}
            </div>
          )}
        </div>

        {/* Top Header Banner + Title */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingRight: '1.2cm' }}>
            <img
              src={bannerSrc}
              alt="Brainstorm International School"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallbackUsed) {
                  img.dataset.fallbackUsed = '1';
                  img.src = '/bsis_receipt_banner.png';
                }
              }}
              style={{
                height: '1.48cm',
                maxWidth: '9.5cm',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.3mm' }}>
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: '12pt',
                color: '#374151',
                lineHeight: 1.38,
              }}
            >
              បង្កាន់ដៃទទួលប្រាក់
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Roboto', sans-serif",
                fontWeight: 900,
                fontSize: '11.2pt',
                color: '#374151',
                letterSpacing: '0.04em',
                lineHeight: 1.05,
                marginTop: '-0.8mm',
              }}
            >
              RECEIPT
            </div>
          </div>

          {/* Date (Left) & Receipt No (Right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: '-2.2mm',
              padding: '0 1mm',
            }}
          >
            <div>
              <span style={{ fontSize: '8.8pt', fontWeight: 600, color: '#334155' }}>Date:</span>
              <span
                style={{
                  fontSize: '9pt',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#1e5aa8',
                  marginLeft: '3.2mm',
                }}
              >
                {dateDash}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '9pt', fontWeight: 700, color: '#334155' }}>№ :</span>
              <span
                style={{
                  fontSize: '10.4pt',
                  fontWeight: 800,
                  color: '#b5392c',
                  letterSpacing: '0.04em',
                  marginLeft: '2mm',
                }}
              >
                {receiptNo6}
              </span>
            </div>
          </div>
        </div>

        {/* Middle 3 Boxed Form Rows */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5mm',
            marginTop: '0.6mm',
          }}
        >
          {/* Row 1: Student Name | Gender | Enroll Day */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.6mm' }}>
            <div
              style={{
                width: '2.35cm',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontSize: '8.8pt', fontWeight: 700, color: '#374151' }}>ឈ្មោះសិស្ស</span>
              <span style={{ fontSize: '6.9pt', fontWeight: 600, color: '#475569' }}>Student&apos;s Name</span>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: '7.6mm',
                border: '1pt solid #334155',
                background: 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 1.5mm',
              }}
            >
              <span
                style={{
                  fontSize: '11pt',
                  fontWeight: 800,
                  color: '#25438a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {studentName}
              </span>
            </div>

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
                paddingLeft: '0.4mm',
              }}
            >
              <span style={{ fontSize: '8.5pt', fontWeight: 700, color: '#374151' }}>ភេទ</span>
              <span style={{ fontSize: '6.8pt', fontWeight: 600, color: '#475569' }}>Gender</span>
            </div>
            <div
              style={{
                width: '1.02cm',
                flexShrink: 0,
                border: '1pt solid #334155',
                background: 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#1e293b',
              }}
            >
              {shortGender}
            </div>

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
                paddingLeft: '0.4mm',
              }}
            >
              <span style={{ fontSize: '8.1pt', fontWeight: 700, color: '#374151' }}>ចូលរៀនថ្ងៃទី</span>
              <span style={{ fontSize: '6.8pt', fontWeight: 600, color: '#475569' }}>Enroll Date</span>
            </div>
            <div
              style={{
                width: '1.02cm',
                flexShrink: 0,
                border: '1pt solid #334155',
                background: 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#1e293b',
              }}
            >
              {enrollDay}
            </div>
          </div>

          {/* Row 2: Pay For | Total Amount */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.6mm' }}>
            <div
              style={{
                width: '2.35cm',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontSize: '8.3pt', fontWeight: 700, color: '#374151' }}>បង់ប្រាក់សម្រាប់</span>
              <span style={{ fontSize: '6.9pt', fontWeight: 600, color: '#475569' }}>Pay for</span>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: '7.4mm',
                border: '1pt solid #334155',
                background: 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 1.5mm',
                fontSize: '9.4pt',
                fontWeight: 800,
                color: '#1e293b',
              }}
            >
              {validitySpaced}
            </div>

            <div
              style={{
                width: '2.7cm',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
                paddingLeft: '0.8mm',
              }}
            >
              <span style={{ fontSize: '8.5pt', fontWeight: 700, color: '#374151' }}>សរុបទឹកប្រាក់</span>
              <span style={{ fontSize: '6.9pt', fontWeight: 600, color: '#475569' }}>Total Amount</span>
            </div>
            <div
              style={{
                width: '3.35cm',
                flexShrink: 0,
                border: '1pt solid #334155',
                background: '#c4cdd9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 1.2mm',
                fontSize: '9.6pt',
                fontWeight: 800,
                color: '#1e293b',
              }}
            >
              {showAmount && totalPaid > 0 ? formatRiels(totalPaid) : ''}
            </div>
          </div>

          {/* Row 3: Course + Shift Split | Next Payment */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.6mm' }}>
            <div
              style={{
                width: '1.58cm',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontSize: '8.4pt', fontWeight: 700, color: '#374151' }}>វគ្គសិក្សា</span>
              <span style={{ fontSize: '6.9pt', fontWeight: 600, color: '#475569' }}>Course</span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '8mm',
                border: '1pt solid #334155',
                background: 'rgba(255, 255, 255, 0.45)',
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
                  padding: '0.4mm 1.4mm',
                  fontSize: '8.4pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  lineHeight: 1.15,
                  wordBreak: 'break-word',
                }}
              >
                {courseName}
              </div>
              <div
                style={{
                  width: '1.12cm',
                  flexShrink: 0,
                  borderLeft: '1pt solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: '7.6pt',
                  fontWeight: 800,
                  color: '#1e293b',
                  lineHeight: 1.12,
                }}
              >
                <span>{shiftLine1}</span>
                {shiftLine2 && <span>{shiftLine2}</span>}
              </div>
            </div>

            <div
              style={{
                width: '2.7cm',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
                paddingLeft: '0.8mm',
              }}
            >
              <span style={{ fontSize: '8.2pt', fontWeight: 700, color: '#374151' }}>ថ្ងៃបង់ប្រាក់បន្ទាប់</span>
              <span style={{ fontSize: '6.9pt', fontWeight: 600, color: '#475569' }}>Next Payment</span>
            </div>
            <div
              style={{
                width: '3.35cm',
                flexShrink: 0,
                border: '1pt solid #334155',
                background: '#ecd3c6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 1mm',
                fontSize: '9.3pt',
                fontWeight: 800,
                color: '#9b3a24',
                whiteSpace: 'nowrap',
              }}
            >
              {nextPaymentKh}
            </div>
          </div>
        </div>

        {/* Footer: Notes + Contact + Address (Left) & Cashier Box (Right) */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '2mm',
            marginTop: '1.2mm',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontSize: '6.55pt', lineHeight: 1.4, color: '#1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.3mm' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '7.3pt',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                បញ្ជាក់ :
              </span>
              <div>
                <div>ទឹកប្រាក់ដែលបានបង់រួចហើយ មិនអាចដកវិញ ឬផ្ទេរទៅអ្នកផ្សេង បានឡើយ ។</div>
                <div>ការបង់ប្រាក់បន្ទាប់ ត្រូវបង់មុនថ្ងៃផុតកំណត់ យ៉ាងហោចណាស់ រយៈពេល ៣ថ្ងៃ។</div>
                <div>ការយឺតយ៉ាវក្នុងការបង់ប្រាក់ នឹងត្រូវផាកពិន័យ ។</div>
              </div>
            </div>

            <div style={{ marginTop: '0.7mm', paddingLeft: '1.08cm' }}>
              <div>
                <span style={{ fontWeight: 800, textDecoration: 'underline' }}>ទំនាក់ទំនង</span>
                <span> : TEL/តេលេក្រាម៖ {phoneText}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8mm' }}>
                <span style={{ fontWeight: 800, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                  អាសយដ្ឋាន
                </span>
                <span>:</span>
                <span style={{ whiteSpace: 'pre-line' }}>{addressText}</span>
              </div>
            </div>
          </div>

          <div style={{ width: '3.6cm', flexShrink: 0, textAlign: 'center' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '8.3pt',
                color: '#1e293b',
                marginBottom: '0.8mm',
              }}
            >
              អ្នកទទួលប្រាក់
            </div>
            <div
              style={{
                height: '1.52cm',
                border: '1pt solid #475569',
                borderRadius: '8px',
                background: 'rgba(241, 245, 249, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '1.2mm',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '8.8pt', color: '#9b3a24' }}>
                {cashierText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
