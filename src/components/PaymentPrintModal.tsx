"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  formatDMYSlash,
  formatKhmerFullDate,
  formatKhmerValidityPeriod,
} from '@/utils/paymentBilling';

export type PrintDocPayload =
  | {
      type: 'receipt';
      payment: any;
      student: any;
      roomAndTeacher: string;
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
  paymentNote?: string;
  onClose: () => void;
}

export default function PaymentPrintModal({
  doc,
  schoolName,
  schoolPhone,
  schoolAddress,
  paymentNote,
  onClose,
}: PaymentPrintModalProps) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  if (!doc || typeof window === 'undefined') return null;

  const handlePrint = () => {
    document.body.classList.add('printing-payment-doc');
    const cleanup = () => document.body.classList.remove('printing-payment-doc');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1500);
    }, 60);
  };

  const renderReceipt = () => {
    if (doc.type !== 'receipt') return null;
    const { payment, student, roomAndTeacher } = doc;
    const validity =
      payment.validityPeriod ||
      formatKhmerValidityPeriod(payment.validFrom || payment.paymentDate, payment.validUntil);
    const monthsCount = Number(payment.monthsPaid || 1);
    const unitFee = Number(payment.unitFee ?? student?.fee ?? 0);
    const discount = Number(payment.discount || 0);
    const totalPaid = Number(payment.amount ?? Math.max(0, unitFee * monthsCount - discount));

    return (
      <div
        id="printable-payment-doc"
        style={{
          background: '#ffffff',
          color: '#111827',
          borderRadius: '14px',
          padding: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
          fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #1e3a8a',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a' }}>
              {schoolName}
            </h2>
            {schoolAddress && (
              <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
                {schoolAddress}
              </div>
            )}
            {schoolPhone && (
              <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                ទូរស័ព្ទ៖ {schoolPhone}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '0.35rem 0.9rem',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 800,
                fontSize: '1rem',
                border: '1px solid #bfdbfe',
              }}
            >
              វិក្កយបត្របង់ប្រាក់ / RECEIPT
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '0.88rem', color: '#374151' }}>
              លេខវិក្កយបត្រ៖ <strong>{payment.receiptNo || '-'}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              កាលបរិច្ឆេទបង់៖ {formatDMYSlash(payment.paymentDate)}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.6rem 1.25rem',
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
            <strong>{student?.studentId || payment.studentIdCode || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ឈ្មោះសិស្ស៖ </span>
            <strong>{student?.fullName || payment.studentName || '-'}</strong>
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
          <div>
            <span style={{ color: '#64748b' }}>ថ្ងៃខួបចូលរៀន៖ </span>
            <strong>{formatDMYSlash(student?.enrollDate) || '-'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>វិធីបង់ប្រាក់៖ </span>
            <strong>{payment.method || 'Cash'}</strong>
          </div>
        </div>

        {/* Line Items */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1.25rem',
            fontSize: '0.92rem',
          }}
        >
          <thead>
            <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', border: '1px solid #1e3a8a' }}>
                បរិយាយ (Description)
              </th>
              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #1e3a8a' }}>
                សុពលភាពនៃការរៀន
              </th>
              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #1e3a8a' }}>
                ថ្ងៃបង់ប្រាក់បន្ទាប់
              </th>
              <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', border: '1px solid #1e3a8a' }}>
                ចំនួនទឹកប្រាក់
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>
                ថ្លៃសិក្សា ({monthsCount} ខែ{unitFee > 0 ? ` × $${unitFee}` : ''})
                {payment.note && (
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
                    សម្គាល់៖ {payment.note}
                  </div>
                )}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                {validity || '-'}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                {formatDMYSlash(payment.validUntil) || '-'}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                ${(totalPaid + discount).toFixed(2)}
              </td>
            </tr>
            {discount > 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '0.55rem 0.75rem', textAlign: 'right', border: '1px solid #cbd5e1', color: '#475569' }}>
                  បញ្ចុះតម្លៃ (Discount)
                </td>
                <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', border: '1px solid #cbd5e1', color: '#dc2626' }}>
                  -${discount.toFixed(2)}
                </td>
              </tr>
            )}
            <tr style={{ background: '#f1f5f9' }}>
              <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 800 }}>
                ទឹកប្រាក់សរុបបានបង់ (TOTAL PAID)
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.05rem', color: '#059669' }}>
                ${totalPaid.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {paymentNote && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              fontSize: '0.84rem',
              color: '#713f12',
              marginBottom: '1.5rem',
            }}
          >
            {paymentNote}
          </div>
        )}

        {/* Signatures */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            marginTop: '1.75rem',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: '3.2rem' }}>ហត្ថលេខាអ្នកបង់ប្រាក់ / Payer</div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.35rem', color: '#64748b' }}>
              {student?.fullName || ''}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '3.2rem' }}>ហត្ថលេខាអ្នកទទួលប្រាក់ / Cashier</div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.35rem', color: '#64748b' }}>
              {payment.recordedBy || schoolName}
            </div>
          </div>
        </div>
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
                {monthsDue} ខែ {monthlyFee > 0 ? `($${monthlyFee}/ខែ)` : ''}
              </td>
            </tr>
            <tr style={{ background: '#fef2f2' }}>
              <td style={{ padding: '0.75rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 800 }}>
                ចំនួនប្រាក់ត្រូវបង់សរុប
              </td>
              <td style={{ padding: '0.75rem 0.85rem', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1.08rem', color: '#dc2626' }}>
                ${amountDue.toFixed(2)}
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
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        zIndex: 25000,
      }}
    >
      <div
        className="no-print"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '720px',
          marginBottom: '0.85rem',
          gap: '0.75rem',
        }}
      >
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
          {doc.type === 'receipt' ? 'វិក្កយបត្របង់ប្រាក់' : 'លិខិតជូនដំណឹងដល់ថ្ងៃបង់ប្រាក់'}
        </span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            បោះពុម្ព / Print
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            បិទ
          </button>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '720px' }}>
        {doc.type === 'receipt' ? renderReceipt() : renderDueNotice()}
      </div>
    </div>,
    document.body
  );
}
