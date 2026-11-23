"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  formatDMYSlash,
  formatKhmerFullDate,
  formatRiels,
} from '@/utils/paymentBilling';
import OfficialReceiptCard, {
  OfficialReceiptItem,
  ReceiptCardSharedProps,
  ReceiptOrientation,
  ReceiptTemplateId,
} from './OfficialReceiptCard';
import {
  ModernNavyReceiptCard,
  ModernRoyalReceiptCard,
  ModernTealReceiptCard,
  RECEIPT_TEMPLATE_OPTIONS,
} from './receipts/ModernReceiptCards';
import { AppIcon } from './AppIcons';

export type ReceiptPrintLayout =
  | 'a4_4up_landscape'
  | 'a4_4up_portrait'
  | 'a6_landscape'
  | 'a6_portrait';

const LAYOUT_SPECS: Record<
  ReceiptPrintLayout,
  {
    label: string;
    shortLabel: string;
    orientation: ReceiptOrientation;
    perPage: 1 | 4;
    sheetW: string;
    sheetH: string;
    sheetWPx: number;
    sheetHPx: number;
    pageCss: string;
    hint: string;
  }
> = {
  a4_4up_landscape: {
    label: 'A4 ផ្ដេក (4/ទំព័រ)',
    shortLabel: 'A4 ផ្ដេក 4/ទំព័រ',
    orientation: 'landscape',
    perPage: 4,
    sheetW: '29.7cm',
    sheetH: '21cm',
    sheetWPx: 1122.52,
    sheetHPx: 793.7,
    pageCss: '@page { size: A4 landscape; margin: 0; }',
    hint: 'A4 Landscape • 4 វិក្កយបត្រ/ទំព័រ (10.5cm × 14.85cm)',
  },
  a4_4up_portrait: {
    label: 'A4 បញ្ឈរ (4/ទំព័រ)',
    shortLabel: 'A4 បញ្ឈរ 4/ទំព័រ',
    orientation: 'portrait',
    perPage: 4,
    sheetW: '21cm',
    sheetH: '29.7cm',
    sheetWPx: 793.7,
    sheetHPx: 1122.52,
    pageCss: '@page { size: A4 portrait; margin: 0; }',
    hint: 'A4 Portrait • 4 វិក្កយបត្រ/ទំព័រ (10.5cm × 14.85cm)',
  },
  a6_landscape: {
    label: 'A6 ផ្ដេក (1/ទំព័រ)',
    shortLabel: 'A6 ផ្ដេក',
    orientation: 'landscape',
    perPage: 1,
    sheetW: '14.85cm',
    sheetH: '10.5cm',
    sheetWPx: 561.26,
    sheetHPx: 396.85,
    pageCss: '@page { size: 148.5mm 105mm; margin: 0; }',
    hint: 'ក្រដាស A6 ផ្ដេក • 1 វិក្កយបត្រ/ទំព័រ (14.85cm × 10.5cm)',
  },
  a6_portrait: {
    label: 'A6 បញ្ឈរ (1/ទំព័រ)',
    shortLabel: 'A6 បញ្ឈរ',
    orientation: 'portrait',
    perPage: 1,
    sheetW: '10.5cm',
    sheetH: '14.85cm',
    sheetWPx: 396.85,
    sheetHPx: 561.26,
    pageCss: '@page { size: 105mm 148.5mm; margin: 0; }',
    hint: 'ក្រដាស A6 បញ្ឈរ • 1 វិក្កយបត្រ/ទំព័រ (10.5cm × 14.85cm)',
  },
};

export type PrintDocPayload =
  | {
      type: 'receipt';
      payment: any;
      student: any;
      roomAndTeacher: string;
      classCode?: string;
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
  cashierSignatureUrl?: string;
  headerLogoUrl?: string;
  paymentNote?: string;
  onMarkAsPrinted?: (paymentIds: string[]) => Promise<void> | void;
  onSaveSignatureUrl?: (signatureUrl: string) => Promise<void> | void;
  onClose: () => void;
}

function renderReceiptCardByTemplate(
  templateId: ReceiptTemplateId,
  cardProps: ReceiptCardSharedProps
) {
  switch (templateId) {
    case 'modern_navy':
      return <ModernNavyReceiptCard {...cardProps} />;
    case 'modern_teal':
      return <ModernTealReceiptCard {...cardProps} />;
    case 'modern_royal':
      return <ModernRoyalReceiptCard {...cardProps} />;
    case 'classic':
    default:
      return <OfficialReceiptCard {...cardProps} />;
  }
}

function getItemClassCodes(item: OfficialReceiptItem): string[] {
  const raw =
    item.classCode ||
    item.payment?.className ||
    (item.roomAndTeacher ? item.roomAndTeacher.split('(')[0] : '') ||
    '';
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PaymentPrintModal({
  doc,
  schoolName,
  schoolPhone,
  schoolAddress,
  cashierName,
  cashierSignatureUrl,
  headerLogoUrl,
  paymentNote,
  onMarkAsPrinted,
  onSaveSignatureUrl,
  onClose,
}: PaymentPrintModalProps) {
  const [templateId, setTemplateId] = useState<ReceiptTemplateId>('classic');
  const [printLayout, setPrintLayout] = useState<ReceiptPrintLayout>('a4_4up_landscape');
  const [showCutLines, setShowCutLines] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [prePrintedOnly, setPrePrintedOnly] = useState(false);
  const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);
  const [isMarkingPrinted, setIsMarkingPrinted] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  // Print Modal In-Place Filters & Class Sorting
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterShift, setFilterShift] = useState('all');
  const [sortByClass, setSortByClass] = useState(true);

  // Inline Google Drive Signature Link Editor
  const [isSigEditorOpen, setIsSigEditorOpen] = useState(false);
  const [draftSignatureUrl, setDraftSignatureUrl] = useState(cashierSignatureUrl || '');
  const [isSavingSignature, setIsSavingSignature] = useState(false);

  useEffect(() => {
    setDraftSignatureUrl(cashierSignatureUrl || '');
  }, [cashierSignatureUrl]);

  // Restore saved template & layout preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedTpl = localStorage.getItem('bsis_receipt_template') as ReceiptTemplateId | null;
      if (savedTpl && ['classic', 'modern_navy', 'modern_teal', 'modern_royal'].includes(savedTpl)) {
        setTemplateId(savedTpl);
      }
      const savedLayout = localStorage.getItem('bsis_receipt_layout') as ReceiptPrintLayout | null;
      if (savedLayout && savedLayout in LAYOUT_SPECS) {
        setPrintLayout(savedLayout);
      }
      const savedPrePrinted = localStorage.getItem('bsis_receipt_preprinted_only');
      if (savedPrePrinted === '1') {
        setPrePrintedOnly(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleTogglePrePrintedOnly = (checked: boolean) => {
    setPrePrintedOnly(checked);
    try {
      localStorage.setItem('bsis_receipt_preprinted_only', checked ? '1' : '0');
    } catch {
      // ignore
    }
  };

  const handleSelectTemplate = (next: ReceiptTemplateId) => {
    setTemplateId(next);
    try {
      localStorage.setItem('bsis_receipt_template', next);
    } catch {
      // ignore
    }
  };

  const handleSelectLayout = (next: ReceiptPrintLayout) => {
    setPrintLayout(next);
    try {
      localStorage.setItem('bsis_receipt_layout', next);
    } catch {
      // ignore
    }
  };

  // Reset modal-local filters whenever a new doc/batch opens
  useEffect(() => {
    setHasTriggeredPrint(false);
    setFilterClass('all');
    setFilterDate('all');
    setFilterShift('all');
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  const activeSpec = LAYOUT_SPECS[printLayout];

  useEffect(() => {
    if (!doc || doc.type === 'due_notice') return;
    const updateScale = () => {
      const availWidth = Math.max(300, window.innerWidth - 48);
      const nextScale = Math.min(1, availWidth / activeSpec.sheetWPx);
      setPreviewScale(nextScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [doc, activeSpec.sheetWPx]);

  const rawReceiptItems: OfficialReceiptItem[] = useMemo(() => {
    if (!doc) return [];
    if (doc.type === 'receipt') {
      return [
        {
          payment: doc.payment,
          student: doc.student,
          roomAndTeacher: doc.roomAndTeacher,
          classCode: doc.classCode,
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

  // Distinct Class / Date / Shift Filter Options inside the Print Preview
  const modalClassOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rawReceiptItems.forEach((item) => {
      const codes = getItemClassCodes(item);
      if (codes.length === 0) {
        counts.set('គ្មានថ្នាក់', (counts.get('គ្មានថ្នាក់') || 0) + 1);
      } else {
        codes.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
      }
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rawReceiptItems]);

  const modalDateOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rawReceiptItems.forEach((item) => {
      const d = String(item.payment?.paymentDate || '').trim();
      if (d) counts.set(d, (counts.get(d) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rawReceiptItems]);

  const modalShiftOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rawReceiptItems.forEach((item) => {
      const s = String(item.payment?.shift || item.student?.shift || '').trim();
      if (s) counts.set(s, (counts.get(s) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rawReceiptItems]);

  const filteredReceiptItems = useMemo(() => {
    const filtered = rawReceiptItems.filter((item) => {
      if (filterClass !== 'all') {
        const codes = getItemClassCodes(item);
        if (filterClass === 'គ្មានថ្នាក់') {
          if (codes.length > 0) return false;
        } else if (!codes.includes(filterClass)) {
          return false;
        }
      }
      if (filterDate !== 'all') {
        const d = String(item.payment?.paymentDate || '').trim();
        if (d !== filterDate) return false;
      }
      if (filterShift !== 'all') {
        const s = String(item.payment?.shift || item.student?.shift || '').trim();
        if (s !== filterShift) return false;
      }
      return true;
    });

    if (!sortByClass) return filtered;
    return [...filtered].sort((a, b) => {
      const ca = getItemClassCodes(a)[0] || 'ZZZ';
      const cb = getItemClassCodes(b)[0] || 'ZZZ';
      if (ca !== cb) return ca.localeCompare(cb);
      const na = String(a.student?.fullName || a.payment?.studentName || '');
      const nb = String(b.student?.fullName || b.payment?.studentName || '');
      return na.localeCompare(nb);
    });
  }, [rawReceiptItems, filterClass, filterDate, filterShift, sortByClass]);

  const receiptPages = useMemo(() => {
    const pages: OfficialReceiptItem[][] = [];
    const step = activeSpec.perPage;
    for (let i = 0; i < filteredReceiptItems.length; i += step) {
      pages.push(filteredReceiptItems.slice(i, i + step));
    }
    return pages;
  }, [filteredReceiptItems, activeSpec.perPage]);

  const unprintedPaymentIds = useMemo(
    () =>
      filteredReceiptItems
        .filter((it) => it.payment?.id && it.payment?.printStatus !== 'printed')
        .map((it) => String(it.payment.id)),
    [filteredReceiptItems]
  );

  if (!doc || typeof window === 'undefined') return null;

  const isReceiptMode = doc.type === 'receipt' || doc.type === 'receipt_batch';
  const effectiveSignatureUrl = draftSignatureUrl.trim();
  const hasActiveModalFilter =
    filterClass !== 'all' || filterDate !== 'all' || filterShift !== 'all';

  const handlePrint = () => {
    if (isReceiptMode) {
      if (filteredReceiptItems.length === 0) return;
      setHasTriggeredPrint(true);
      document.body.classList.add('printing-receipt-a4');

      let styleEl = document.getElementById('bsis-a4-landscape-page-rule');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'bsis-a4-landscape-page-rule';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = activeSpec.pageCss;

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
      if (!hasActiveModalFilter || unprintedPaymentIds.length >= rawReceiptItems.length) {
        onClose();
      }
    } finally {
      setIsMarkingPrinted(false);
    }
  };

  const handleSaveSignatureClick = async (nextUrl?: string) => {
    if (!onSaveSignatureUrl) return;
    const urlToSave = (nextUrl !== undefined ? nextUrl : draftSignatureUrl).trim();
    setIsSavingSignature(true);
    try {
      setDraftSignatureUrl(urlToSave);
      await onSaveSignatureUrl(urlToSave);
    } finally {
      setIsSavingSignature(false);
    }
  };

  const renderReceiptSheets = () => {
    if (filteredReceiptItems.length === 0) {
      return (
        <div
          className="no-print"
          style={{
            padding: '2.5rem 1.5rem',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#cbd5e1',
            textAlign: 'center',
            fontSize: '0.92rem',
          }}
        >
          មិនមានវិក្កយបត្រត្រូវតាមលក្ខខណ្ឌច្រោះនេះទេ។ សូមប្តូរ ឬចុច «សម្អាតច្រោះ»។
        </div>
      );
    }

    const slotW = activeSpec.orientation === 'portrait' ? '10.5cm' : '14.85cm';
    const slotH = activeSpec.orientation === 'portrait' ? '14.85cm' : '10.5cm';

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
              ទំព័រទី {pageIdx + 1} / {receiptPages.length} ({activeSpec.shortLabel} • {pageItems.length} វិក្កយបត្រ)
            </div>

            <div
              className="receipt-a4-preview-scale"
              style={{
                width: `${activeSpec.sheetWPx * previewScale}px`,
                height: `${activeSpec.sheetHPx * previewScale}px`,
                overflow: 'visible',
              }}
            >
              <div
                className="receipt-a4-sheet"
                style={{
                  width: activeSpec.sheetW,
                  height: activeSpec.sheetH,
                  background: '#ffffff',
                  display: activeSpec.perPage === 4 ? 'grid' : 'block',
                  gridTemplateColumns:
                    activeSpec.perPage === 4 ? `${slotW} ${slotW}` : undefined,
                  gridTemplateRows:
                    activeSpec.perPage === 4 ? `${slotH} ${slotH}` : undefined,
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  transformOrigin: 'top left',
                  transform: previewScale < 1 ? `scale(${previewScale})` : 'none',
                }}
              >
                {activeSpec.perPage === 4
                  ? [0, 1, 2, 3].map((slotIdx) => {
                      const slotItem = pageItems[slotIdx];
                      const isLeftCol = slotIdx % 2 === 0;
                      const isTopRow = slotIdx < 2;

                      if (!slotItem) {
                        return (
                          <div
                            key={`empty-${pageIdx}-${slotIdx}`}
                            style={{
                              width: slotW,
                              height: slotH,
                              boxSizing: 'border-box',
                              background: '#ffffff',
                              borderRight:
                                showCutLines && isLeftCol ? '0.45pt dashed #e2e8f0' : 'none',
                              borderBottom:
                                showCutLines && isTopRow ? '0.45pt dashed #e2e8f0' : 'none',
                            }}
                          />
                        );
                      }

                      return (
                        <React.Fragment key={slotItem.payment?.id || `slot-${pageIdx}-${slotIdx}`}>
                          {renderReceiptCardByTemplate(templateId, {
                            item: slotItem,
                            orientation: activeSpec.orientation,
                            schoolPhone,
                            schoolAddress,
                            cashierName,
                            cashierSignatureUrl: effectiveSignatureUrl,
                            headerLogoUrl,
                            showAmount,
                            showSignature,
                            prePrintedOnly: templateId === 'classic' ? prePrintedOnly : false,
                            showCutRight: showCutLines && isLeftCol,
                            showCutBottom: showCutLines && isTopRow,
                          })}
                        </React.Fragment>
                      );
                    })
                  : pageItems[0]
                    ? renderReceiptCardByTemplate(templateId, {
                        item: pageItems[0],
                        orientation: activeSpec.orientation,
                        schoolPhone,
                        schoolAddress,
                        cashierName,
                        cashierSignatureUrl: effectiveSignatureUrl,
                        headerLogoUrl,
                        showAmount,
                        showSignature,
                        prePrintedOnly: templateId === 'classic' ? prePrintedOnly : false,
                        showCutRight: false,
                        showCutBottom: false,
                      })
                    : null}
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

        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.96rem' }}>
          <strong>គោរពជូន៖</strong> មាតាបិតា ឬ អាណាព្យាបាលរបស់សិស្ស{' '}
          <strong style={{ color: '#1e3a8a' }}>{student?.fullName}</strong>
        </p>
        <p style={{ margin: '0 0 1.15rem 0', fontSize: '0.94rem', color: '#374151', textAlign: 'justify' }}>
          សាលារៀនសូមជូនដំណឹងដោយក្តីគោរពដល់មាតាបិតា ឬអាណាព្យាបាលសិស្សឱ្យបានជ្រាបថា
          កាលបរិច្ឆេទបង់ថ្លៃសិក្សារបស់សិស្សដូចមានព័ត៌មានខាងក្រោមបានដល់ពេលកំណត់ហើយ៖
        </p>

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

  const selectStyle: React.CSSProperties = {
    padding: '0.34rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.22)',
    background: '#1e293b',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  };

  return createPortal(
    <div
      id="payment-print-portal-root"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.84)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: '1rem 1rem 2rem',
        zIndex: 25000,
      }}
    >
      {/* Top Action Toolbar (Hidden when printing) */}
      <div
        className="no-print"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: isReceiptMode ? '1124px' : '720px',
          marginBottom: '0.85rem',
          gap: '0.6rem',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '0.8rem 1rem',
          borderRadius: '14px',
        }}
      >
        {/* Row 1: Title + Primary Print / Archive / Close buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.96rem' }}>
              {doc.type === 'receipt_batch'
                ? doc.title || `បោះពុម្ពវិក្កយបត្រជាក្រុម (${filteredReceiptItems.length}/${rawReceiptItems.length} វិក្កយបត្រ)`
                : doc.type === 'receipt'
                  ? 'វិក្កយបត្របង់ប្រាក់'
                  : 'លិខិតជូនដំណឹងដល់ថ្ងៃបង់ប្រាក់'}
            </span>
            {isReceiptMode && (
              <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                {activeSpec.hint} • បង្ហាញ {filteredReceiptItems.length} វិក្កយបត្រ ({receiptPages.length} ទំព័រ)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={isReceiptMode && filteredReceiptItems.length === 0}
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              <AppIcon name="printer" size={16} />
              {isReceiptMode
                ? `Print (${filteredReceiptItems.length}) • ${activeSpec.shortLabel}`
                : 'បោះពុម្ព / Print'}
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
                  padding: '0.5rem 0.95rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: hasTriggeredPrint ? '#10b981' : '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
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
                padding: '0.5rem 0.85rem',
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

        {/* Row 2: Style Picker + Paper/Orientation Picker + Toggles */}
        {isReceiptMode && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              paddingTop: '0.55rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* 4 Template Styles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700, marginRight: '0.15rem' }}>
                ស្តាយ៍៖
              </span>
              {RECEIPT_TEMPLATE_OPTIONS.map((tpl) => {
                const active = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      border: active
                        ? '1px solid #60a5fa'
                        : '1px solid rgba(255,255,255,0.18)',
                      background: active ? tpl.accent : 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: active ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tpl.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* 4 Paper & Orientation Modes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700, marginRight: '0.15rem' }}>
                ក្រដាស៖
              </span>
              {(Object.keys(LAYOUT_SPECS) as ReceiptPrintLayout[]).map((layoutKey) => {
                const active = printLayout === layoutKey;
                return (
                  <button
                    key={layoutKey}
                    type="button"
                    onClick={() => handleSelectLayout(layoutKey)}
                    style={{
                      padding: '0.3rem 0.62rem',
                      borderRadius: '8px',
                      border: active
                        ? '1px solid #34d399'
                        : '1px solid rgba(255,255,255,0.18)',
                      background: active ? '#059669' : 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: active ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {LAYOUT_SPECS[layoutKey].label}
                  </button>
                );
              })}
            </div>

            {/* Quick Toggles + Classic Pre-Printed Overlay Mode + Signature Link */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}>
              {templateId === 'classic' && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.32rem',
                    padding: '0.24rem 0.6rem',
                    borderRadius: '8px',
                    border: prePrintedOnly
                      ? '1px solid #f59e0b'
                      : '1px solid rgba(255,255,255,0.22)',
                    background: prePrintedOnly
                      ? 'rgba(245, 158, 11, 0.22)'
                      : 'rgba(255,255,255,0.06)',
                    color: prePrintedOnly ? '#fde68a' : '#e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: prePrintedOnly ? 700 : 500,
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  title="ព្រីនតែផ្នែកកណ្ដាលដែលគូសរង្វង់ (លាក់ Header, Watermark, ស៊ុមក្រៅ និងផ្នែកខាងក្រោម)"
                >
                  <input
                    type="checkbox"
                    checked={prePrintedOnly}
                    onChange={(e) => handleTogglePrePrintedOnly(e.target.checked)}
                  />
                  ព្រីនតែផ្នែករង្វង់ (គំរូស្រាប់)
                </label>
              )}

              {activeSpec.perPage === 4 && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#e2e8f0',
                    fontSize: '0.78rem',
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
              )}

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: '#e2e8f0',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={showAmount}
                  onChange={(e) => setShowAmount(e.target.checked)}
                />
                ទឹកប្រាក់
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: '#e2e8f0',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                />
                ហត្ថលេខា
              </label>

              <button
                type="button"
                onClick={() => setIsSigEditorOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.28rem 0.62rem',
                  borderRadius: '8px',
                  border: isSigEditorOpen
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255,255,255,0.22)',
                  background: isSigEditorOpen
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(255,255,255,0.08)',
                  color: '#e0f2fe',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <AppIcon name="edit" size={13} />
                Link ហត្ថលេខា
              </button>
            </div>
          </div>
        )}

        {/* Row 3: Print-Page Filters (Class, Date, Shift, Group-by-Class) */}
        {isReceiptMode && rawReceiptItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.55rem',
              paddingTop: '0.55rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700 }}>
                ច្រោះទិន្នន័យ Print៖
              </span>

              <select
                aria-label="ច្រោះតាមថ្នាក់"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={selectStyle}
              >
                <option value="all">គ្រប់ថ្នាក់ ({rawReceiptItems.length})</option>
                {modalClassOptions.map(([code, count]) => (
                  <option key={code} value={code}>
                    ថ្នាក់ {code} ({count})
                  </option>
                ))}
              </select>

              <select
                aria-label="ច្រោះតាមថ្ងៃបង់ប្រាក់"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={selectStyle}
              >
                <option value="all">គ្រប់ថ្ងៃបង់</option>
                {modalDateOptions.map(([dateStr, count]) => (
                  <option key={dateStr} value={dateStr}>
                    ថ្ងៃ {formatDMYSlash(dateStr)} ({count})
                  </option>
                ))}
              </select>

              {modalShiftOptions.length > 1 && (
                <select
                  aria-label="ច្រោះតាមវេន"
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">គ្រប់វេន</option>
                  {modalShiftOptions.map(([sh, count]) => (
                    <option key={sh} value={sh}>
                      វេន {sh} ({count})
                    </option>
                  ))}
                </select>
              )}

              {hasActiveModalFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterClass('all');
                    setFilterDate('all');
                    setFilterShift('all');
                  }}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(248, 113, 113, 0.45)',
                    background: 'rgba(239, 68, 68, 0.16)',
                    color: '#fecaca',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  សម្អាតច្រោះ
                </button>
              )}
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={sortByClass}
                onChange={(e) => setSortByClass(e.target.checked)}
              />
              តម្រៀបជាក្រុមតាមថ្នាក់ (ងាយចែកសិស្ស)
            </label>
          </div>
        )}

        {/* Row 4 (Expandable): Google Drive Signature Link Input & Save to DB */}
        {isReceiptMode && isSigEditorOpen && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
            }}
          >
            <span style={{ color: '#7dd3fc', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Link ហត្ថលេខា (Google Drive PNG)៖
            </span>
            <input
              type="text"
              value={draftSignatureUrl}
              onChange={(e) => setDraftSignatureUrl(e.target.value)}
              placeholder="បិទភ្ជាប់ Link ពី Google Drive (https://drive.google.com/file/d/.../view)"
              style={{
                flex: '1 1 280px',
                minWidth: '220px',
                padding: '0.42rem 0.7rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            {onSaveSignatureUrl && (
              <>
                <button
                  type="button"
                  disabled={isSavingSignature}
                  onClick={() => handleSaveSignatureClick()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.42rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isSavingSignature ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <AppIcon name="check" size={14} />
                  {isSavingSignature ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកហត្ថលេខា'}
                </button>
                {draftSignatureUrl.trim() && (
                  <button
                    type="button"
                    disabled={isSavingSignature}
                    onClick={() => handleSaveSignatureClick('')}
                    style={{
                      padding: '0.42rem 0.7rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ប្រើហត្ថលេខាដើម
                  </button>
                )}
              </>
            )}
          </div>
        )}
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
            fontSize: '0.84rem',
          }}
        >
          ប្រសិនបើ Print ចេញរួចរាល់ហើយ សូមចុចប៊ូតុង <strong>«Print រួច → ផ្ទេរទុកដោយឡែក ({unprintedPaymentIds.length})»</strong> ដើម្បីកុំឱ្យលាយឡំជាមួយសិស្សបង់ប្រាក់ថ្មីនៅថ្ងៃស្អែក។
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
