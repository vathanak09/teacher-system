"use client";

import React from 'react';
import {
  DEFAULT_RECEIPT_ADDRESS,
  DEFAULT_RECEIPT_PHONE,
  KHMER_MONTHS,
  parseLocalDate,
  resolveReceiptBannerSrc,
  toKhmerDigits,
} from '@/utils/paymentBilling';
import ReceiptSignature from './ReceiptSignature';

export const DEFAULT_NOTICE_CASHIER = 'ណេង ស្រីមុំ';
export const DEFAULT_PENALTY_PERCENT_PER_DAY = 0.5;

const ENG_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatEngShortDate(dateInput?: string | Date | null): string {
  const d =
    dateInput instanceof Date
      ? dateInput
      : typeof dateInput === 'string' && dateInput.trim()
        ? parseLocalDate(dateInput) || new Date()
        : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const mon = ENG_SHORT_MONTHS[d.getMonth()] || 'Jan';
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}

export function calculateNoticePenalty(
  baseAmountRiels: number,
  overdueDays: number,
  penaltyPercentPerDay: number
): number {
  const base = Math.max(0, Number(baseAmountRiels || 0));
  const days = Math.max(0, Number(overdueDays || 0));
  const rate = Math.max(0, Number(penaltyPercentPerDay || 0));
  if (base <= 0 || days <= 0 || rate <= 0) return 0;
  return Math.round(base * (rate / 100) * days);
}

export interface DueNoticeItem {
  student: any;
  classCode?: string;
  teacherName?: string;
  teacherShortCode?: string;
  roomAndTeacher?: string;
  monthlyFee: number;
  enrollDateStr: string;
  dueDateStr: string;
  statusKey: 'paid' | 'due' | 'overdue' | 'no_date';
  monthsDue: number;
  overdueDays: number;
  daysRemaining?: number;
  amountDue: number;
}

export interface DueNoticeCardProps {
  item: DueNoticeItem;
  penaltyPercentPerDay: number;
  showPenalty: boolean;
  showAmount: boolean;
  hideHeader: boolean;
  hideFooter: boolean;
  showSignature: boolean;
  issueDate?: Date | string;
  schoolPhone?: string;
  schoolAddress?: string;
  headerLogoUrl?: string;
  noticeCashierName?: string;
  noticeSignatureUrl?: string;
  showCutRight?: boolean;
  showCutBottom?: boolean;
}

export default function DueNoticeCard({
  item,
  penaltyPercentPerDay,
  showPenalty,
  showAmount,
  hideHeader,
  hideFooter,
  showSignature,
  issueDate,
  schoolPhone,
  schoolAddress,
  headerLogoUrl,
  noticeCashierName,
  noticeSignatureUrl,
  showCutRight = false,
  showCutBottom = false,
}: DueNoticeCardProps) {
  const student = item.student || {};
  const studentName = String(student.fullName || '').trim();
  const levelCode = String(student.level || '').trim();
  const shiftCode = String(student.shift || '').trim();
  const teacherShortCode = String(item.teacherShortCode || '').trim();

  const dueDateObj = parseLocalDate(item.dueDateStr);
  const dueDay = dueDateObj ? String(dueDateObj.getDate()).padStart(2, '0') : '--';
  const dueMonthKh = dueDateObj ? KHMER_MONTHS[dueDateObj.getMonth()] || '' : '--';
  const dueYear = dueDateObj ? String(dueDateObj.getFullYear()) : '----';

  const monthsCount = Math.max(1, Number(item.monthsDue || 1));
  const monthsKh2Digit = toKhmerDigits(String(monthsCount).padStart(2, '0'));
  const baseAmount = Math.max(Number(item.amountDue || 0), Number(item.monthlyFee || 0));
  const overdueDays = Math.max(0, Number(item.overdueDays || 0));
  const daysRemaining = Math.max(0, Number(item.daysRemaining || 0));

  const penaltyAmount = showPenalty
    ? calculateNoticePenalty(baseAmount, overdueDays, penaltyPercentPerDay)
    : 0;
  const grandTotal = baseAmount + penaltyAmount;
  const hasVisiblePenalty = showPenalty && overdueDays > 0 && penaltyPercentPerDay > 0 && penaltyAmount > 0;

  const bannerSrc = resolveReceiptBannerSrc(headerLogoUrl);
  const phoneText = (schoolPhone || '').trim() || DEFAULT_RECEIPT_PHONE;
  const addressText = (schoolAddress || '').trim() || DEFAULT_RECEIPT_ADDRESS;
  const cashierText = (noticeCashierName || '').trim() || DEFAULT_NOTICE_CASHIER;
  const issueDateText = formatEngShortDate(issueDate);

  const nameFontSize =
    studentName.length > 20 ? '9.2pt' : studentName.length > 15 ? '10.2pt' : '11.4pt';

  return (
    <div
      className="due-notice-slot"
      style={{
        width: '10.5cm',
        height: '9.9cm',
        boxSizing: 'border-box',
        padding: '2.4mm 3.2mm 2.2mm',
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
        borderRight: showCutRight ? '0.5pt dashed #94a3b8' : 'none',
        borderBottom: showCutBottom ? '0.5pt dashed #94a3b8' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Top Area: Overdue/Penalty (Left) + Official Banner/Title (Center) + Teacher/Level/Shift (Right) */}
      <div style={{ position: 'relative', minHeight: '19mm' }}>
        {/* Top-Left: Overdue days + Penalty per day (ALWAYS visible unless penalty toggled off) */}
        <div
          style={{
            position: 'absolute',
            top: '0.2mm',
            left: 0,
            zIndex: 2,
            lineHeight: 1.2,
          }}
        >
          <div
            style={{
              fontSize: '8.6pt',
              fontWeight: 800,
              color:
                overdueDays > 0
                  ? '#7e22ce'
                  : item.statusKey === 'due'
                    ? '#d97706'
                    : '#2563eb',
              whiteSpace: 'nowrap',
            }}
          >
            {overdueDays > 0
              ? `លើស ${overdueDays} ថ្ងៃ`
              : item.statusKey === 'due'
                ? 'ដល់ថ្ងៃបង់'
                : `សល់ ${daysRemaining} ថ្ងៃ`}
          </div>

          {hasVisiblePenalty && (
            <div
              style={{
                marginTop: '1mm',
                fontSize: '7.2pt',
                fontWeight: 800,
                color: '#b91c1c',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              <div>ផាក {penaltyPercentPerDay}%</div>
              <div>ក្នុងមួយថ្ងៃ</div>
              <div style={{ fontWeight: 900 }}>
                = {penaltyAmount.toLocaleString('en-US')} ៛
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Teacher Short Code + Level + Shift (ALWAYS visible) */}
        <div
          style={{
            position: 'absolute',
            top: '0.2mm',
            right: 0,
            zIndex: 2,
            textAlign: 'right',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '2.2mm' }}>
            {teacherShortCode && (
              <span style={{ fontSize: '7.8pt', fontWeight: 700, color: '#cbd5e1' }}>
                {teacherShortCode}
              </span>
            )}
            <span style={{ fontSize: '8.4pt', fontWeight: 800, color: '#0f172a' }}>
              {levelCode}
            </span>
          </div>
          {shiftCode && (
            <div style={{ fontSize: '8.4pt', fontWeight: 800, color: '#0f172a', marginTop: '0.8mm' }}>
              {shiftCode}
            </div>
          )}
        </div>

        {/* Center Header: School Banner + Title (visibility:hidden preserves exact mm spacing!) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 1.4cm',
            visibility: hideHeader ? 'hidden' : 'visible',
          }}
        >
          <img
            src={bannerSrc}
            alt="BSIS"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fallbackUsed) {
                img.dataset.fallbackUsed = '1';
                img.src = '/bsis_receipt_banner.png';
              }
            }}
            style={{
              height: '11.4mm',
              maxWidth: '58mm',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div
            style={{
              fontFamily: "'Moul', 'Kantumruy Pro', serif",
              fontSize: '10.2pt',
              color: '#1e293b',
              textDecoration: 'underline',
              textUnderlineOffset: '2.5px',
              marginTop: '0.6mm',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            លិខិតអញ្ជើញបង់ថ្លៃសិក្សា
          </div>
        </div>
      </div>

      {/* Middle Body (ALWAYS visible — matches both full slip and pre-printed overlay!) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5mm',
          marginTop: '0.6mm',
        }}
      >
        {/* Row 1: Student Name in Dashed Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
          <span
            style={{
              fontSize: '9.2pt',
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            សូមអញ្ជើញសិស្សឈ្មោះ
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: '8.2mm',
              border: '0.9pt dashed #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1.5mm',
            }}
          >
            <span
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: '#b91c1c',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {studentName || '-'}
            </span>
          </div>
        </div>

        {/* Row 2: Months Due */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
          }}
        >
          <div>
            <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
              មកបង់ថ្លៃសិក្សា ចំនួន{' '}
            </span>
            <span style={{ fontSize: '10.4pt', fontWeight: 900, color: '#1d4ed8' }}>
              {monthsKh2Digit} ខែ
            </span>
          </div>
          <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
            ដែលសិស្សខាងលើ
          </span>
        </div>

        {/* Row 3: Due Date (Pink Day Box + Blue Month + Blue Year) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.2mm',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
            ត្រូវបង់នៅ ថ្ងៃទី
          </span>
          <span
            style={{
              minWidth: '13mm',
              height: '6.4mm',
              background: '#f2cfd2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1.5mm',
              fontSize: '10.4pt',
              fontWeight: 900,
              color: '#1d4ed8',
            }}
          >
            {dueDay}
          </span>
          <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>ខែ</span>
          <span style={{ fontSize: '10pt', fontWeight: 900, color: '#1d4ed8' }}>
            {dueMonthKh}
          </span>
          <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a', marginLeft: '1.5mm' }}>
            ឆ្នាំ
          </span>
          <span style={{ fontSize: '10.2pt', fontWeight: 900, color: '#1d4ed8' }}>
            {dueYear}
          </span>
        </div>

        {/* Row 4: Total Amount (Toggleable via showAmount — Orange-Peach Highlight Box) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.2mm',
            whiteSpace: 'nowrap',
            height: showAmount ? '6.8mm' : hideHeader || hideFooter ? '6.8mm' : '2.2mm',
            visibility: showAmount ? 'visible' : 'hidden',
          }}
        >
          <span style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
            សរុបជាទឹកប្រាក់ ចំនួន
          </span>
          <div
            style={{
              flex: 1,
              height: '6.8mm',
              background: '#f6cca0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10.8pt',
              fontWeight: 900,
              color: '#1d4ed8',
              padding: '0 2mm',
            }}
          >
            {grandTotal > 0 ? `${grandTotal.toLocaleString('en-US')} ៛` : '—'}
          </div>
        </div>

        {/* Row 5 & 6: Call-to-Action + Issue Date */}
        <div style={{ marginTop: '0.2mm', lineHeight: 1.35 }}>
          <div
            style={{
              fontSize: '8.7pt',
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            +បន្ទាប់ពីទទួលបានលិខិតនេះ សូមប្អូន មកបង់ប្រាក់
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '1.5mm',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: '8.7pt',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.015em',
              }}
            >
              ឱ្យបានរួសរាន់តាមការអញ្ជើញរបស់សាលា។
            </span>
            <span style={{ fontSize: '8.2pt', fontWeight: 900, color: '#b91c1c' }}>
              {issueDateText}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Notes + Contact + Address (Left) & បេឡា Signature (Right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.4mm',
          marginTop: '0.6mm',
          visibility: hideFooter ? 'hidden' : 'visible',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '5.85pt',
            lineHeight: 1.38,
            letterSpacing: '-0.02em',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1mm' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '6.6pt',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              បញ្ជាក់ :
            </span>
            <div>
              <div style={{ whiteSpace: 'nowrap' }}>
                សូមភ្ជាប់លិខិតនេះ មកជាមួយ នៅពេលបង់ប្រាក់។
              </div>
              <div style={{ whiteSpace: 'nowrap' }}>
                ការយឺតយ៉ាវក្នុងការបង់ប្រាក់ នឹងត្រូវផាកពិន័យ ។
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.4mm' }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, textDecoration: 'underline' }}>ទំនាក់ទំនង</span>
              <span> : TEL / តេលេក្រាម {phoneText}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6mm' }}>
              <span style={{ fontWeight: 800, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                អាសយដ្ឋាន
              </span>
              <span>:</span>
              <span style={{ whiteSpace: 'pre-line' }}>{addressText}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            width: '2.4cm',
            flexShrink: 0,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          <div style={{ fontSize: '7.6pt', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
            បេឡា
          </div>
          <div
            style={{
              height: '9.2mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0.3mm 0',
            }}
          >
            {showSignature && (
              <ReceiptSignature
                signatureUrl={noticeSignatureUrl}
                height="8.6mm"
                color="#0f172a"
              />
            )}
          </div>
          <div style={{ fontSize: '7.5pt', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap' }}>
            {cashierText}
          </div>
        </div>
      </div>
    </div>
  );
}
