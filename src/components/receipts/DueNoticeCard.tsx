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

/**
 * Returns the active billing cycle's printed notice count before payment.
 * Automatically resets to 0 when the student's due date advances to a new billing cycle.
 */
export function getEffectiveNoticePrintCount(
  student: any,
  currentDueDateStr?: string
): number {
  if (!student) return 0;
  const rawCount = Math.max(0, Number(student.dueNoticePrintCount || 0));
  if (rawCount <= 0) return 0;
  const savedCycle = String(student.dueNoticeCycleKey || '').trim();
  const activeCycle = String(currentDueDateStr || '').trim();
  if (savedCycle && activeCycle && savedCycle !== activeCycle) {
    return 0;
  }
  return rawCount;
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
  noticePrintCount?: number;
  lastNoticePrintedAt?: string;
}

export interface DueNoticeCardProps {
  item: DueNoticeItem;
  penaltyPercentPerDay: number;
  showPenalty: boolean;
  showAmount: boolean;
  hideHeader: boolean;
  hideFooter: boolean;
  showSignature: boolean;
  showPrintCount?: boolean;
  displayPrintNumber?: number;
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
  showPrintCount = true,
  displayPrintNumber,
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
  const hasVisiblePenalty =
    showPenalty && overdueDays > 0 && penaltyPercentPerDay > 0 && penaltyAmount > 0;

  const printNumber =
    typeof displayPrintNumber === 'number'
      ? displayPrintNumber
      : getEffectiveNoticePrintCount(student, item.dueDateStr) + 1;

  const bannerSrc = resolveReceiptBannerSrc(headerLogoUrl);
  const phoneText = (schoolPhone || '').trim() || DEFAULT_RECEIPT_PHONE;
  const addressText = (schoolAddress || '').trim() || DEFAULT_RECEIPT_ADDRESS;
  const cashierText = (noticeCashierName || '').trim() || DEFAULT_NOTICE_CASHIER;
  const issueDateText = formatEngShortDate(issueDate);

  const nameFontSize =
    studentName.length > 22 ? '11.6pt' : studentName.length > 16 ? '13.2pt' : '14.6pt';

  return (
    <div
      className="due-notice-slot"
      style={{
        width: '10.5cm',
        height: '98.85mm',
        boxSizing: 'border-box',
        padding: '3.4mm 4.6mm 3.2mm',
        background: '#ffffff',
        color: '#000000',
        fontFamily: "'Kantumruy Pro', 'Battambang', sans-serif",
        fontWeight: 400,
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
      <div style={{ position: 'relative', minHeight: '17.2mm' }}>
        {/* Top-Left: Overdue days + Penalty per day */}
        <div
          data-print-section="penalty-date"
          title="ចុចដើម្បីកែអត្រាផាកពិន័យ និងថ្ងៃចេញលិខិត"
          style={{
            position: 'absolute',
            top: '0.2mm',
            left: 0,
            zIndex: 2,
            lineHeight: 1.24,
          }}
        >
          <div
            style={{
              fontSize: '8.8pt',
              fontWeight: 400,
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
                marginTop: '0.8mm',
                fontSize: '7.4pt',
                fontWeight: 400,
                color: '#b91c1c',
                lineHeight: 1.22,
                whiteSpace: 'nowrap',
              }}
            >
              <div>ផាក {penaltyPercentPerDay}%</div>
              <div>ក្នុងមួយថ្ងៃ</div>
              <div style={{ fontWeight: 800 }}>
                = {penaltyAmount.toLocaleString('en-US')} ៛
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Teacher Short Code + Level + Shift + Notice Print Count */}
        <div
          data-print-section="display-toggles"
          title="ចុចដើម្បីបង្ហាញ ឬលាក់ផ្នែកលើលិខិត"
          style={{
            position: 'absolute',
            top: '0.2mm',
            right: 0,
            zIndex: 2,
            textAlign: 'right',
            lineHeight: 1.24,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '2mm' }}>
            {teacherShortCode && (
              <span style={{ fontSize: '8pt', fontWeight: 400, color: '#000000' }}>
                {teacherShortCode}
              </span>
            )}
            <span style={{ fontSize: '8.6pt', fontWeight: 400, color: '#000000' }}>
              {levelCode}
            </span>
          </div>
          {shiftCode && (
            <div style={{ fontSize: '8.6pt', fontWeight: 400, color: '#000000', marginTop: '0.5mm' }}>
              {shiftCode}
            </div>
          )}
          {showPrintCount && printNumber > 0 && (
            <div
              style={{
                fontSize: '7.4pt',
                fontWeight: 400,
                color: '#000000',
                marginTop: '0.6mm',
              }}
            >
              លើកទី {printNumber}
            </div>
          )}
        </div>

        {/* Center Header: School Banner + Title (visibility:hidden preserves exact mm spacing) */}
        <div
          data-print-section="display-toggles"
          title="ចុចដើម្បីបង្ហាញ ឬលាក់ Header លើលិខិត"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 1.35cm',
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
              height: '10.6mm',
              maxWidth: '54mm',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div
            data-print-heading="true"
            style={{
              fontFamily: "'Moul', 'Kantumruy Pro', serif",
              fontSize: '10.2pt',
              fontWeight: 400,
              color: '#000000',
              textDecoration: 'underline',
              textUnderlineOffset: '2.5px',
              marginTop: '0.6mm',
              whiteSpace: 'nowrap',
              lineHeight: 1.28,
            }}
          >
            លិខិតអញ្ជើញបង់ថ្លៃសិក្សា
          </div>
        </div>
      </div>

      {/* Middle Body: Only Student Name, Months, Dates & Money Amounts are Bold + Larger */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.6mm',
          marginTop: '0.8mm',
        }}
      >
        {/* Row 1: Student Name in Dashed Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.2mm' }}>
          <span
            style={{
              fontSize: '9.6pt',
              fontWeight: 400,
              color: '#000000',
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
              height: '9.4mm',
              border: '0.9pt dashed #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1.8mm',
            }}
          >
            <span
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: '#b91c1c',
                lineHeight: 1.15,
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
            <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000' }}>
              មកបង់ថ្លៃសិក្សា ចំនួន{' '}
            </span>
            <span style={{ fontSize: '11.4pt', fontWeight: 800, color: '#1d4ed8' }}>
              {monthsKh2Digit} ខែ
            </span>
          </div>
          <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000' }}>
            ដែលសិស្សខាងលើ
          </span>
        </div>

        {/* Row 3: Due Date (Pink Day Box + Blue Month + Blue Year — Bold & Larger) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.2mm',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000' }}>
            ត្រូវបង់នៅ ថ្ងៃទី
          </span>
          <span
            style={{
              minWidth: '13mm',
              height: '6.6mm',
              background: '#f2cfd2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 1.6mm',
              fontSize: '11.4pt',
              fontWeight: 800,
              color: '#1d4ed8',
            }}
          >
            {dueDay}
          </span>
          <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000' }}>ខែ</span>
          <span style={{ fontSize: '11pt', fontWeight: 800, color: '#1d4ed8' }}>
            {dueMonthKh}
          </span>
          <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000', marginLeft: '1.2mm' }}>
            ឆ្នាំ
          </span>
          <span style={{ fontSize: '11.2pt', fontWeight: 800, color: '#1d4ed8' }}>
            {dueYear}
          </span>
        </div>

        {/* Row 4: Total Amount (Toggleable via showAmount — Orange-Peach Highlight Box) */}
        <div
          data-print-section="display-toggles"
          title="ចុចដើម្បីបង្ហាញ ឬលាក់ទឹកប្រាក់"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.2mm',
            whiteSpace: 'nowrap',
            height: showAmount ? '7mm' : hideHeader || hideFooter ? '7mm' : '1.8mm',
            visibility: showAmount ? 'visible' : 'hidden',
          }}
        >
          <span style={{ fontSize: '9.4pt', fontWeight: 400, color: '#000000', flexShrink: 0 }}>
            សរុបជាទឹកប្រាក់ ចំនួន
          </span>
          <div
            style={{
              flex: 1,
              height: '7mm',
              background: '#f6cca0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11.8pt',
              fontWeight: 800,
              color: '#1d4ed8',
              padding: '0 2mm',
            }}
          >
            {grandTotal > 0 ? `${grandTotal.toLocaleString('en-US')} ៛` : '—'}
          </div>
        </div>

        {/* Row 5 & 6: Call-to-Action (Normal) + Issue Date (Bold) */}
        <div style={{ marginTop: '0.4mm', lineHeight: 1.38 }}>
          <div
            style={{
              fontSize: '9pt',
              fontWeight: 400,
              color: '#000000',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.015em',
            }}
          >
            +បន្ទាប់ពីទទួលបានលិខិតនេះ សូមប្អូន មកបង់ប្រាក់
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '1.4mm',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: '9pt',
                fontWeight: 400,
                color: '#000000',
                letterSpacing: '-0.02em',
              }}
            >
              ឱ្យបានរួសរាន់តាមការអញ្ជើញរបស់សាលា។
            </span>
            <span
              data-print-section="penalty-date"
              title="ចុចដើម្បីកែថ្ងៃចេញលិខិត និងផាកពិន័យ"
              style={{ fontSize: '8.8pt', fontWeight: 800, color: '#b91c1c' }}
            >
              {issueDateText}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Larger, Readable Normal-Weight Notes/Contact/Address + បេឡា Signature */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.6mm',
          marginTop: '1mm',
          visibility: hideFooter ? 'hidden' : 'visible',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '6.85pt',
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: '-0.015em',
            color: '#000000',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1mm' }}>
            <span
              style={{
                fontWeight: 400,
                fontSize: '7.15pt',
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

          <div style={{ marginTop: '0.5mm' }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 400, fontSize: '7.1pt', textDecoration: 'underline' }}>
                ទំនាក់ទំនង
              </span>
              <span> : TEL/តេលេក្រាម {phoneText}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6mm' }}>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: '7.1pt',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                អាសយដ្ឋាន
              </span>
              <span>:</span>
              <span style={{ whiteSpace: 'pre-line' }}>{addressText}</span>
            </div>
          </div>
        </div>

        <div
          data-print-section="cashier-signature"
          title="ចុចដើម្បីកែឈ្មោះបេឡា និងហត្ថលេខា"
          style={{
            width: '2.15cm',
            flexShrink: 0,
            textAlign: 'center',
            lineHeight: 1.18,
          }}
        >
          <div style={{ fontSize: '8.2pt', fontWeight: 400, color: '#000000', whiteSpace: 'nowrap' }}>
            បេឡា
          </div>
          <div
            style={{
              height: '9mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0.3mm 0',
            }}
          >
            {showSignature && (
              <ReceiptSignature
                signatureUrl={noticeSignatureUrl}
                height="8.4mm"
                color="#000000"
              />
            )}
          </div>
          <div style={{ fontSize: '8pt', fontWeight: 400, color: '#000000', whiteSpace: 'nowrap' }}>
            {cashierText}
          </div>
        </div>
      </div>
    </div>
  );
}
