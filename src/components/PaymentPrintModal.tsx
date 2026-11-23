"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  formatDMYSlash,
  formatKhmerFullDate,
  formatRiels,
} from '@/utils/paymentBilling';
import OfficialReceiptCard, { OfficialReceiptItem } from './OfficialReceiptCard';
import { AppIcon } from './AppIcons';

export type PrintDocPayload =
  | {
      type: 'receipt';
      payment: any;
      student: any;
      roomAndTeacher: string;
      courseName?: string;
      teacherShortCode?: string;
    }
  | {
      type: 'receipt_batch';
      items: OfficialReceiptItem[];
      title?: string;
    }
  | {
      type: 'due_notice';
      billing: {
        student: any;
        roomAndTeacher: string;
        monthlyFee: number;
        enrollDateStr: string;
        dueDateStr: string;
        monthsDue: number;
        overdueDays: number;
        amountDue: number;
      };
    };

interface PaymentPrintModalProps {
  doc: PrintDocPayload | null;
  schoolName: string;
  schoolPhone?: string;
  schoolAddress?: string;
  cashierName?: string;
  headerLogoUrl?: string;
  paymentNote?: string;
  onMarkAsPrinted?: (paymentIds: string[]) => Promise<void> | void;
  onClose: () => void;
}

const A4_WIDTH_PX = 1122.52; // 29.7cm @ 96dpi
const A4_HEIGHT_PX = 793.7; // 21.0cm @ 96dpi

export default function PaymentPrintModal({
  doc,
  schoolName,
  schoolPhone,
  schoolAddress,
  cashierName,
  headerLogoUrl,
  paymentNote,
  onMarkAsPrinted,
  onClose,
}: PaymentPrintModalProps) {
  const [showCutLines, setShowCutLines] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);
  const [isMarkingPrinted, setIsMarkingPrinted] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    setHasTriggeredPrint(false);
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  useEffect(() => {
    if (!doc || doc.type === 'due_notice') return;
    const updateScale = () => {
      const availWidth = Math.max(300, window.innerWidth - 48);
      const nextScale = Math.min(1, availWidth / A4_WIDTH_PX);
      setPreviewScale(nextScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [doc]);

  const receiptItems: OfficialReceiptItem[] = useMemo(() => {
    if (!doc) return [];
    if (doc.type === 'receipt') {
      return [
        {
          payment: doc.payment,
          student: doc.student,
          roomAndTeacher: doc.roomAndTeacher,
          courseName: doc.courseName,
          teacherShortCode: doc.teacherShortCode,
        },
      ];
    }
    if (doc.type === 'receipt_batch') {
      return doc.items;
    }
    return [];
  }, [doc]);

  const receiptPages = useMemo(() => {
    const pages: OfficialReceiptItem[][] = [];
    for (let i = 0; i < receiptItems.length; i += 4) {
      pages.push(receiptItems.slice(i, i + 4));
    }
    return pages;
  }, [receiptItems]);

  const unprintedPaymentIds = useMemo(
    () =>
      receiptItems
        .filter((it) => it.payment?.id && it.payment?.printStatus !== 'printed')
        .map((it) => String(it.payment.id)),
    [receiptItems]
  );

  if (!doc || typeof window === 'undefined') return null;

  const isReceiptMode = doc.type === 'receipt' || doc.type === 'receipt_batch';

  const handlePrint = () => {
    if (isReceiptMode) {
      setHasTriggeredPrint(true);
      document.body.classList.add('printing-receipt-a4');

      let styleEl = document.getElementById('bsis-a4-landscape-page-rule');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'bsis-a4-landscape-page-rule';
        styleEl.textContent = '@page { size: A4 landscape; margin: 0; }';
        document.head.appendChild(styleEl);
      }

      const cleanup = () => {
        document.body.classList.remove('printing-receipt-a4');
        const el = document.getElementById('bsis-a4-landscape-page-rule');
        if (el) el.remove();
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(() => {
        window.print();
        setTimeout(cleanup, 2000);
      }, 80);
      return;
    }

    document.body.classList.add('printing-payment-doc');
    const cleanup = () => document.body.classList.remove('printing-payment-doc');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1500);
    }, 60);
  };

  const handleMarkBatchPrinted = async () => {
    if (!onMarkAsPrinted || unprintedPaymentIds.length === 0) return;
    setIsMarkingPrinted(true);
    try {
      await onMarkAsPrinted(unprintedPaymentIds);
      onClose();
    } finally {
      setIsMarkingPrinted(false);
    }
  };

  const renderReceiptSheets = () => {
    return (
      <div
        className="receipt-a4-sheets-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {receiptPages.map((pageItems, pageIdx) => (
          <div
            key={`sheet-${pageIdx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <div
              className="no-print"
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
              }}
            >
              ទំព័រ A4 ផ្ដេក ទី {pageIdx + 1} / {receiptPages.length} ({pageItems.length} វិក្កយបត្រ • ទំហំ 10.5cm × 14.85cm)
            </div>

            <div
              className="receipt-a4-preview-scale"
              style={{
                width: `${A4_WIDTH_PX * previewScale}px`,
                height: `${A4_HEIGHT_PX * previewScale}px`,
                overflow: 'visible',
              }}
            >
              <div
                className="receipt-a4-sheet"
                style={{
                  width: '29.7cm',
                  height: '21cm',
                  background: '#ffffff',
                  display: 'grid',
                  gridTemplateColumns: '14.85cm 14.85cm',
                  gridTemplateRows: '10.5cm 10.5cm',
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  transformOrigin: 'top left',
                  transform: previewScale < 1 ? `scale(${previewScale})` : 'none',
                }}
              >
                {[0, 1, 2, 3].map((slotIdx) => {
                  const slotItem = pageItems[slotIdx];
                  const isLeftCol = slotIdx % 2 === 0;
                  const isTopRow = slotIdx < 2;

                  if (!slotItem) {
                    return (
                      <div
                        key={`empty-${pageIdx}-${slotIdx}`}
                        style={{
                          width: '14.85cm',
                          height: '10.5cm',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                          borderRight:
                            showCutLines && isLeftCol ? '0.5pt dashed #e2e8f0' : 'none',
                          borderBottom:
                            showCutLines && isTopRow ? '0.5pt dashed #e2e8f0' : 'none',
                        }}
                      />
                    );
                  }

                  return (
                    <OfficialReceiptCard
                      key={slotItem.payment?.id || `slot-${pageIdx}-${slotIdx}`}
                      item={slotItem}
                      schoolPhone={schoolPhone}
                      schoolAddress={schoolAddress}
                      cashierName={cashierName}
                      headerLogoUrl={headerLogoUrl}
                      showAmount={showAmount}
                      showCutRight={showCutLines && isLeftCol}
                      showCutBottom={showCutLines && isTopRow}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDueNotice = () => {
    if (doc.type !== 'due_notice') return null;
    const { billing } = doc;
    const {
      student,
      roomAndTeacher,
      monthlyFee,
      enrollDateStr,
      dueDateStr,
      monthsDue,
      overdueDays,
      amountDue,
    } = billing;

    return (
      <div
        id="printable-payment-doc"
        style={{
          background: '#ffffff',
          color: '#111827',
          borderRadius: '14px',
          padding: '2.25rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
          fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
          lineHeight: 1.7,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid #dc2626',
            paddingBottom: '1rem',
            marginBottom: '1.35rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a' }}>
            {schoolName}
          </h2>
          {(schoolAddress || schoolPhone) && (
            <div style={{ fontSize: '0.86rem', color: '#4b5563', marginTop: '0.2rem' }}>
              {[schoolAddress, schoolPhone ? `ទូរស័ព្ទ៖ ${schoolPhone}` : ''].filter(Boolean).join(' | ')}
            </div>
          )}
          <div
            style={{
              marginTop: '0.75rem',
              display: 'inline-block',
              padding: '0.35rem 1.25rem',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontWeight: 800,
              fontSize: '1.05rem',
              border: '1px solid #fecaca',
            }}
          >
            លិខិតជូនដំណឹងដល់ថ្ងៃបង់ប្រាក់
          </div>
          <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.4rem' }}>
            {formatKhmerFullDate(new Date())}
          </div>
        </div>

        {/* Salutation */}
        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.96rem' }}>
          <strong>គោរពជូន៖</strong> មាតាបិតា ឬ អាណាព្យាបាលរបស់សិស្ស{' '}
          <strong style={{ color: '#1e3a8a' }}>{student?.fullName}</strong>
        </p>
        <p style={{ margin: '0 0 1.15rem 0', fontSize: '0.94rem', color: '#374151', textAlign: 'justify' }}>
          សាលារៀនសូមជូនដំណឹងដោយក្តីគោរពដល់មាតាបិតា ឬអាណាព្យាបាលសិស្សឱ្យបានជ្រាបថា
          កាលបរិច្ឆេទបង់ថ្លៃសិក្សារបស់សិស្សដូចមានព័ត៌មានខាងក្រោមបានដល់ពេលកំណត់ហើយ៖
        </p>

        {/* Student Details Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.5rem 1.25rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.92rem',
          }}
        >
          <div>
            <span style={{ color: '#64748b' }}>អត្តលេខសិស្ស៖ </span>
            <strong>{student?.studentId || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ឈ្មោះសិស្ស៖ </span>
            <strong>{student?.fullName || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ភេទ៖ </span>
            <strong>{student?.gender || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>វេនសិក្សា៖ </span>
            <strong>{student?.shift || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>វគ្គសិក្សា៖ </span>
            <strong>{student?.level || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>បន្ទប់ & គ្រូ៖ </span>
            <strong>{roomAndTeacher || '-'}</strong>
          </div>
        </div>

        {/* Summary Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1.25rem',
            fontSize: '0.92rem',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', background: '#f8fafc', width: '48%' }}>
                ថ្ងៃខួបចូលរៀន
              </td>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                {formatDMYSlash(enrollDateStr) || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                ថ្ងៃខែឆ្នាំត្រូវបង់ប្រាក់
              </td>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>
                {formatDMYSlash(dueDateStr) || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                ចំនួនថ្ងៃដែលលើស
              </td>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                {overdueDays > 0 ? `${overdueDays} ថ្ងៃ` : 'ដល់ថ្ងៃបង់ប្រាក់ថ្ងៃនេះ (0 ថ្ងៃ)'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                ចំនួនខែដែលត្រូវបង់ ឬលើស
              </td>
              <td style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                {monthsDue} ខែ {monthlyFee > 0 ? `(${formatRiels(monthlyFee)}/ខែ)` : ''}
              </td>
            </tr>
            <tr style={{ background: '#fef2f2' }}>
              <td style={{ padding: '0.75rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>
                ចំនួនប្រាក់ត្រូវបង់សរុប
              </td>
              <td style={{ padding: '0.75rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.08rem', color: '#dc2626' }}>
                {formatRiels(amountDue)}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', color: '#374151' }}>
          អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូមមាតាបិតា ឬអាណាព្យាបាលមេត្តាអញ្ជើញមកបង់ថ្លៃសិក្សា ឬបង់តាមគណនីរបស់សាលារៀនឱ្យបានទាន់ពេលវេលា។
          ប្រសិនបើបានបង់ប្រាក់រួចរាល់ហើយ សូមមេត្តាអធ្យាស្រ័យ និងបង្ហាញវិក្កយបត្រមកកាន់ការិយាល័យសាលា។
        </p>

        {paymentNote && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.86rem',
              color: '#334155',
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
            }}
          >
            {paymentNote}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
          <div style={{ textAlign: 'center', minWidth: '210px', fontSize: '0.92rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '3.2rem' }}>ការិយាល័យហិរញ្ញវត្ថុ / សាលារៀន</div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.35rem', color: '#64748b' }}>
              {schoolName}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      id="payment-print-portal-root"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: '1.15rem 1rem 2rem',
        zIndex: 25000,
      }}
    >
      {/* Top Action Toolbar (Hidden when printing) */}
      <div
        className="no-print"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: isReceiptMode ? '1124px' : '720px',
          marginBottom: '0.85rem',
          gap: '0.65rem',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.96rem' }}>
            {doc.type === 'receipt_batch'
              ? doc.title || `បោះពុម្ពវិក្កយបត្រជាក្រុម (${receiptItems.length} វិក្កយបត្រ)`
              : doc.type === 'receipt'
                ? 'វិក្កយបត្របង់ប្រាក់ (10.5cm × 14.85cm)'
                : 'លិខិតជូនដំណឹងដល់ថ្ងៃបង់ប្រាក់'}
          </span>
          {isReceiptMode && (
            <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
              ទម្រង់ A4 ផ្ដេក • 4 វិក្កយបត្រ/ទំព័រ • សរុប {receiptPages.length} ទំព័រ (សូមជ្រើស Margins: None ពេល Print)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
          {isReceiptMode && (
            <>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                />
                បន្ទាត់កាត់
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={showAmount}
                  onChange={(e) => setShowAmount(e.target.checked)}
                />
                បង្ហាញទឹកប្រាក់
              </label>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.52rem 1.05rem',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            <AppIcon name="printer" size={16} />
            {isReceiptMode ? 'Print A4 ផ្ដេក' : 'បោះពុម្ព / Print'}
          </button>

          {isReceiptMode && unprintedPaymentIds.length > 0 && onMarkAsPrinted && (
            <button
              type="button"
              disabled={isMarkingPrinted}
              onClick={handleMarkBatchPrinted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.52rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: hasTriggeredPrint ? '#10b981' : '#059669',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: isMarkingPrinted ? 'wait' : 'pointer',
                boxShadow: hasTriggeredPrint ? '0 0 0 3px rgba(16, 185, 129, 0.45)' : 'none',
              }}
            >
              <AppIcon name="check-circle" size={15} />
              {isMarkingPrinted
                ? 'កំពុងផ្ទេរ...'
                : `Print រួច → ផ្ទេរទុកដោយឡែក (${unprintedPaymentIds.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.52rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(30, 41, 59, 0.9)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            បិទ
          </button>
        </div>
      </div>

      {/* Post-Print Reminder Banner */}
      {isReceiptMode && hasTriggeredPrint && unprintedPaymentIds.length > 0 && onMarkAsPrinted && (
        <div
          className="no-print"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '1124px',
            marginBottom: '0.85rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.16)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#d1fae5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            ប្រសិនបើ Print ចេញរួចរាល់ហើយ សូមចុចប៊ូតុង <strong>«Print រួច → ផ្ទេរទុកដោយឡែក»</strong> ដើម្បីកុំឱ្យលាយឡំជាមួយសិស្សបង់ប្រាក់ថ្មីនៅថ្ងៃស្អែក។
          </span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isReceiptMode ? '1124px' : '720px',
        }}
      >
        {isReceiptMode ? renderReceiptSheets() : renderDueNotice()}
      </div>
    </div>,
    document.body
  );
}
