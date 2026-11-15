"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  classService,
  paymentService,
  settingsService,
  studentService,
} from '@/services/db';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import { useConfirm } from '@/components/ConfirmDialog';
import PaymentPrintModal, { PrintDocPayload } from '@/components/PaymentPrintModal';
import {
  addMonthsWithAnniversary,
  computeStudentBillingInfo,
  formatDMYSlash,
  formatKhmerValidityPeriod,
  getStudentClassInfo,
  parseLocalDate,
  StudentBillingInfo,
  toISODateString,
} from '@/utils/paymentBilling';

type ActiveTab = 'due_overdue' | 'paid' | 'all_students';

export default function PaymentsPage() {
  const router = useRouter();
  const confirmDialog = useConfirm();

  const [role, setRole] = useState('');
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [currentUserName, setCurrentUserName] = useState('');

  // Firestore Collections
  const [students, setStudents] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Settings
  const [syncSettings, setSyncSettings] = useState({
    googleSheetUrl: '',
    dueSheetName: 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
    paidSheetName: 'សិស្សបង់រួច',
    upcomingDays: 5,
    schoolPhone: '',
    schoolAddress: '',
    paymentNote: '',
  });
  const [fallbackStudentSheetUrl, setFallbackStudentSheetUrl] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('due_overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dueSubFilter, setDueSubFilter] = useState<'all' | 'due_only' | 'overdue_only' | 'include_upcoming'>('all');
  const [paidViewMode, setPaidViewMode] = useState<'latest_per_student' | 'all_receipts'>('all_receipts');
  const [paidMonthFilter, setPaidMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);

  // Sync & Toast State
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [payStudentDocId, setPayStudentDocId] = useState('');
  const [payReceiptNo, setPayReceiptNo] = useState('');
  const [payDate, setPayDate] = useState(toISODateString(new Date()));
  const [payValidFrom, setPayValidFrom] = useState('');
  const [payMonths, setPayMonths] = useState('1');
  const [payValidUntil, setPayValidUntil] = useState('');
  const [payUnitFee, setPayUnitFee] = useState('0');
  const [payDiscount, setPayDiscount] = useState('0');
  const [payAmount, setPayAmount] = useState('0');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  // Print Modal & Student History Modal
  const [printDoc, setPrintDoc] = useState<PrintDocPayload | null>(null);
  const [historyStudentBilling, setHistoryStudentBilling] = useState<StudentBillingInfo | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setSchoolName(localStorage.getItem('schoolName') || 'សាលាអន្តរជាតិប្រេនស្តម');
    setCurrentUserName(localStorage.getItem('userName') || 'Admin');

    const unsubStudents = studentService.subscribeAll(setStudents);
    const unsubClasses = classService.subscribeAll(setClassesData);
    const unsubPayments = paymentService.subscribeAll(setPayments);
    const unsubPaymentSettings = settingsService.subscribeOne('paymentSyncSettings', (docData) => {
      if (docData) {
        setSyncSettings((prev) => ({
          ...prev,
          googleSheetUrl: docData.googleSheetUrl || '',
          dueSheetName: docData.dueSheetName || 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
          paidSheetName: docData.paidSheetName || 'សិស្សបង់រួច',
          upcomingDays: Number(docData.upcomingDays ?? 5),
          schoolPhone: docData.schoolPhone || '',
          schoolAddress: docData.schoolAddress || '',
          paymentNote: docData.paymentNote || '',
        }));
      }
    });
    const unsubStudentSettings = settingsService.subscribeOne('studentSettings', (docData) => {
      if (docData?.googleSheetUrl) {
        setFallbackStudentSheetUrl(docData.googleSheetUrl);
      }
    });

    return () => {
      unsubStudents();
      unsubClasses();
      unsubPayments();
      unsubPaymentSettings();
      unsubStudentSettings();
    };
  }, [router]);

  const activeStudents = useMemo(() => {
    return students.filter((s) => {
      if (showInactiveStudents) return true;
      const st = (s.status || '').trim();
      return st !== 'ឈប់រៀន' && st !== 'ផ្អាក' && st !== 'បញ្ចប់ការសិក្សា';
    });
  }, [students, showInactiveStudents]);

  const billingList = useMemo(() => {
    return activeStudents.map((student) =>
      computeStudentBillingInfo(student, payments, classesData)
    );
  }, [activeStudents, payments, classesData]);

  // Unique class options for filter dropdown
  const classFilterOptions = useMemo(() => {
    const names = new Set<string>();
    classesData.forEach((c) => {
      const code = c.classCode || c.className;
      if (code) names.add(code);
    });
    billingList.forEach((b) => {
      if (b.classCode) names.add(b.classCode);
    });
    return Array.from(names)
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [classesData, billingList]);

  const matchesSearchAndClass = (student: any, classCode: string, roomAndTeacher: string) => {
    if (classFilter !== 'all') {
      const codes = classCode.split(',').map((s) => s.trim());
      if (!codes.includes(classFilter)) return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (student?.studentId || '').toLowerCase().includes(q) ||
      (student?.fullName || '').toLowerCase().includes(q) ||
      (student?.englishName || '').toLowerCase().includes(q) ||
      (student?.phoneNum || '').toLowerCase().includes(q) ||
      (roomAndTeacher || '').toLowerCase().includes(q)
    );
  };

  // Due & Overdue List (គិតតាមថ្ងៃខួបចូលរៀន)
  const dueOverdueList = useMemo(() => {
    const upcomingLimit = Math.max(1, Number(syncSettings.upcomingDays || 5));
    return billingList
      .filter((b) => {
        if (!matchesSearchAndClass(b.student, b.classCode, b.roomAndTeacher)) return false;
        if (dueSubFilter === 'due_only') return b.statusKey === 'due';
        if (dueSubFilter === 'overdue_only') return b.statusKey === 'overdue';
        if (dueSubFilter === 'include_upcoming') {
          return (
            b.statusKey === 'due' ||
            b.statusKey === 'overdue' ||
            (b.statusKey === 'paid' && b.daysRemaining <= upcomingLimit)
          );
        }
        return b.statusKey === 'due' || b.statusKey === 'overdue';
      })
      .sort((a, b) => {
        if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
        return (a.student.studentId || '').localeCompare(b.student.studentId || '');
      });
  }, [billingList, dueSubFilter, searchQuery, classFilter, syncSettings.upcomingDays]);

  // All Due/Overdue rows for Sync (ignores temporary UI sub-filter except class/search if desired — let's sync full active due/overdue cleanly!)
  const dueRowsForSync = useMemo(() => {
    return billingList
      .filter((b) => b.statusKey === 'due' || b.statusKey === 'overdue')
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [billingList]);

  // Paid Student Records List (សិស្សដែលបង់រួច)
  const paidMonthOptions = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (typeof p.paymentDate === 'string' && p.paymentDate.length >= 7) {
        set.add(p.paymentDate.slice(0, 7));
      }
    });
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((ym) => ({ value: ym, label: ym }));
  }, [payments]);

  const paidEntries = useMemo(() => {
    const studentMap = new Map<string, any>();
    students.forEach((s) => studentMap.set(s.id, s));

    const enriched = payments
      .map((p) => {
        const studentDocId = p.studentDocId || p.studentId;
        const student = studentMap.get(studentDocId);
        const classInfo = student
          ? getStudentClassInfo(student, classesData)
          : {
              classCode: p.className || '',
              teacherName: p.teacherName || '',
              roomAndTeacher: p.roomAndTeacher || p.className || '',
            };
        const enrollDateStr = student?.enrollDate || p.enrollDate || '';
        const validUntil = p.validUntil || student?.nextPaymentDate || '';
        const validFrom = p.validFrom || p.paymentDate || '';
        const validityPeriod =
          p.validityPeriod || formatKhmerValidityPeriod(validFrom, validUntil);

        return {
          payment: p,
          studentDocId,
          student,
          receiptNo: p.receiptNo || `INV-${String(p.id || '').slice(0, 6).toUpperCase()}`,
          studentIdCode: student?.studentId || p.studentIdCode || '',
          studentName: student?.fullName || p.studentName || '',
          gender: student?.gender || p.gender || '',
          shift: student?.shift || p.shift || '',
          level: student?.level || p.level || '',
          enrollDateStr,
          validFrom,
          validUntil,
          validityPeriod,
          roomAndTeacher: classInfo.roomAndTeacher || p.roomAndTeacher || '',
          classCode: classInfo.classCode,
          paymentDate: p.paymentDate || '',
          amount: Number(p.amount || 0),
        };
      })
      .sort((a, b) => {
        const da = parseLocalDate(a.paymentDate)?.getTime() || 0;
        const db = parseLocalDate(b.paymentDate)?.getTime() || 0;
        if (db !== da) return db - da;
        return (b.receiptNo || '').localeCompare(a.receiptNo || '');
      });

    let list = enriched;
    if (paidViewMode === 'latest_per_student') {
      const seen = new Set<string>();
      list = enriched.filter((item) => {
        const key = item.studentDocId || item.studentIdCode;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return list.filter((item) => {
      if (paidMonthFilter !== 'all' && !item.paymentDate.startsWith(paidMonthFilter)) {
        return false;
      }
      return matchesSearchAndClass(
        item.student || {
          studentId: item.studentIdCode,
          fullName: item.studentName,
        },
        item.classCode,
        item.roomAndTeacher
      );
    });
  }, [payments, students, classesData, paidViewMode, paidMonthFilter, searchQuery, classFilter]);

  const filteredAllStudents = useMemo(() => {
    return billingList
      .filter((b) => matchesSearchAndClass(b.student, b.classCode, b.roomAndTeacher))
      .sort((a, b) => (a.student.studentId || '').localeCompare(b.student.studentId || ''));
  }, [billingList, searchQuery, classFilter]);

  // Dashboard Statistics
  const stats = useMemo(() => {
    const overdueCount = billingList.filter((b) => b.statusKey === 'overdue').length;
    const dueTodayCount = billingList.filter((b) => b.statusKey === 'due').length;
    const dueAndOverdueList = billingList.filter(
      (b) => b.statusKey === 'due' || b.statusKey === 'overdue'
    );
    const totalDueAmount = dueAndOverdueList.reduce((sum, b) => sum + b.amountDue, 0);
    const paidValidCount = billingList.filter((b) => b.statusKey === 'paid').length;
    const upcomingCount = billingList.filter(
      (b) => b.statusKey === 'paid' && b.daysRemaining <= Number(syncSettings.upcomingDays || 5)
    ).length;

    const currentYM = toISODateString(new Date()).slice(0, 7);
    const currentMonthRevenue = payments
      .filter((p) => typeof p.paymentDate === 'string' && p.paymentDate.startsWith(currentYM))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      overdueCount,
      dueTodayCount,
      dueOverdueTotalCount: dueAndOverdueList.length,
      totalDueAmount,
      paidValidCount,
      upcomingCount,
      currentMonthRevenue,
    };
  }, [billingList, payments, syncSettings.upcomingDays]);

  const generateNextReceiptNo = () => {
    let maxNum = 0;
    payments.forEach((p) => {
      if (typeof p.receiptNo === 'string') {
        const match = p.receiptNo.match(/(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    });
    return `INV-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const applyPaymentStudentDefaults = (
    studentDocId: string,
    monthsOverride?: number,
    paymentDateOverride?: string
  ) => {
    const student = students.find((s) => s.id === studentDocId);
    if (!student) return;

    const billing = computeStudentBillingInfo(student, payments, classesData);
    const todayStr = paymentDateOverride || toISODateString(new Date());
    const startFrom = billing.dueDateStr || billing.enrollDateStr || todayStr;
    const defaultMonths = monthsOverride ?? Math.max(1, billing.monthsDue || 1);
    const unitFee = Number(student.fee || 0);
    const nextUntil = addMonthsWithAnniversary(
      startFrom,
      defaultMonths,
      student.enrollDate || startFrom
    );

    setPayStudentDocId(studentDocId);
    setPayValidFrom(startFrom);
    setPayMonths(String(defaultMonths));
    setPayValidUntil(nextUntil);
    setPayUnitFee(String(unitFee));
    setPayDiscount('0');
    setPayAmount(String(Math.max(0, unitFee * defaultMonths)));
  };

  const openRecordPaymentModal = (billing?: StudentBillingInfo) => {
    const todayStr = toISODateString(new Date());
    setPayReceiptNo(generateNextReceiptNo());
    setPayDate(todayStr);
    setPayMethod('Cash');
    setPayNote('');

    if (billing) {
      applyPaymentStudentDefaults(billing.student.id, Math.max(1, billing.monthsDue || 1), todayStr);
    } else {
      setPayStudentDocId('');
      setPayValidFrom(todayStr);
      setPayMonths('1');
      setPayValidUntil(addMonthsWithAnniversary(todayStr, 1, todayStr));
      setPayUnitFee('0');
      setPayDiscount('0');
      setPayAmount('0');
    }
    setIsPaymentModalOpen(true);
  };

  const handleRecalcFromFields = (
    nextFrom: string,
    nextMonthsStr: string,
    nextUnitFeeStr: string,
    nextDiscountStr: string
  ) => {
    const student = students.find((s) => s.id === payStudentDocId);
    const m = Math.max(1, parseInt(nextMonthsStr, 10) || 1);
    const unit = Math.max(0, parseFloat(nextUnitFeeStr) || 0);
    const disc = Math.max(0, parseFloat(nextDiscountStr) || 0);

    if (nextFrom) {
      setPayValidUntil(
        addMonthsWithAnniversary(nextFrom, m, student?.enrollDate || nextFrom)
      );
    }
    setPayAmount(String(Math.max(0, unit * m - disc)));
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === payStudentDocId);
    if (!student) {
      showToast('សូមជ្រើសរើសសិស្សជាមុនសិន!', 'error');
      return;
    }
    if (!payValidUntil) {
      showToast('សូមកំណត់ថ្ងៃខែឆ្នាំបង់ប្រាក់បន្ទាប់!', 'error');
      return;
    }

    setIsSavingPayment(true);
    try {
      const classInfo = getStudentClassInfo(student, classesData);
      const monthsPaid = Math.max(1, parseInt(payMonths, 10) || 1);
      const unitFee = Math.max(0, parseFloat(payUnitFee) || 0);
      const discount = Math.max(0, parseFloat(payDiscount) || 0);
      const amount = Math.max(0, parseFloat(payAmount) || 0);
      const validityPeriod = formatKhmerValidityPeriod(payValidFrom || payDate, payValidUntil);
      const receiptNo = payReceiptNo.trim() || generateNextReceiptNo();

      const payload = {
        receiptNo,
        studentDocId: student.id,
        studentId: student.id, // backwards-compatible field
        studentIdCode: student.studentId || '',
        studentName: student.fullName || '',
        gender: student.gender || '',
        shift: student.shift || '',
        level: student.level || '',
        enrollDate: student.enrollDate || '',
        className: classInfo.classCode,
        teacherName: classInfo.teacherName,
        roomAndTeacher: classInfo.roomAndTeacher,
        paymentDate: payDate,
        validFrom: payValidFrom || payDate,
        validUntil: payValidUntil,
        validityPeriod,
        monthsPaid,
        unitFee,
        discount,
        amount,
        method: payMethod,
        note: payNote.trim(),
        recordedBy: currentUserName,
      };

      const savedId = await paymentService.add(payload);
      await studentService.update(student.id, {
        nextPaymentDate: payValidUntil,
      });

      setIsPaymentModalOpen(false);
      showToast(`បានកត់ត្រាវិក្កយបត្រ ${receiptNo} រួចរាល់!`);

      // Open printable receipt immediately
      setPrintDoc({
        type: 'receipt',
        payment: { ...payload, id: savedId },
        student,
        roomAndTeacher: classInfo.roomAndTeacher,
      });
    } catch (error) {
      console.error('Error saving payment:', error);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកការបង់ប្រាក់!', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentRecord: any) => {
    const ok = await confirmDialog({
      title: 'បញ្ជាក់ការលុបវិក្កយបត្រ',
      message: `តើអ្នកពិតជាចង់លុបវិក្កយបត្រ "${paymentRecord.receiptNo || ''}" មែនទេ? ថ្ងៃបង់ប្រាក់បន្ទាប់របស់សិស្សនឹងត្រូវគណនាត្រឡប់វិញដោយស្វ័យប្រវត្តិ។`,
      confirmText: 'លុបវិក្កយបត្រ',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await paymentService.delete(paymentRecord.id);
      const studentDocId = paymentRecord.studentDocId || paymentRecord.studentId;
      const student = students.find((s) => s.id === studentDocId);
      if (student) {
        const remaining = payments
          .filter(
            (p) =>
              p.id !== paymentRecord.id &&
              (p.studentDocId === studentDocId || p.studentId === studentDocId)
          )
          .sort((a, b) => {
            const da = parseLocalDate(a.paymentDate)?.getTime() || 0;
            const db = parseLocalDate(b.paymentDate)?.getTime() || 0;
            return db - da;
          });
        const fallbackNext =
          remaining.length > 0 ? remaining[0].validUntil || '' : student.enrollDate || '';
        await studentService.update(student.id, {
          nextPaymentDate: fallbackNext,
        });
      }
      showToast('បានលុបវិក្កយបត្រដោយជោគជ័យ!');
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('បរាជ័យក្នុងការលុបវិក្កយបត្រ!', 'error');
    }
  };

  const extractSpreadsheetId = (rawUrl: string): string => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return '';
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match?.[1]) return match[1];
    if (trimmed.length > 20 && !trimmed.includes('/')) return trimmed;
    return '';
  };

  const effectiveSheetUrl = syncSettings.googleSheetUrl || fallbackStudentSheetUrl;

  const handleSyncToGoogleSheets = async () => {
    const spreadsheetId = extractSpreadsheetId(effectiveSheetUrl);
    if (!spreadsheetId) {
      showToast('សូមចូលកំណត់ Link Google Sheets ជាមុនសិន!', 'error');
      setIsSyncSettingsOpen(true);
      return;
    }

    const dueRows = dueRowsForSync.map((item, idx) => [
      idx + 1,
      item.student.studentId || '',
      item.student.fullName || '',
      item.student.gender || '',
      item.student.shift || '',
      item.student.level || '',
      item.monthsDue,
      formatDMYSlash(item.dueDateStr),
      item.amountDue,
      item.overdueDays,
      item.roomAndTeacher || '',
    ]);

    const paidRows = paidEntries.map((row) => [
      row.receiptNo,
      row.studentIdCode,
      row.studentName,
      row.gender,
      row.shift,
      row.level,
      formatDMYSlash(row.enrollDateStr),
      formatDMYSlash(row.validUntil),
      row.validityPeriod,
      row.roomAndTeacher || '',
    ]);

    setIsSyncingSheets(true);
    try {
      const res = await fetch('/api/sync-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          dueSheetName: syncSettings.dueSheetName || 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
          paidSheetName: syncSettings.paidSheetName || 'សិស្សបង់រួច',
          dueRows,
          paidRows,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Sync ទៅ Google Sheets បរាជ័យ!', 'error');
        return;
      }
      showToast(
        `Sync រួចរាល់! (ដល់ថ្ងៃ/លើសថ្ងៃ៖ ${result.dueCount} នាក់, បង់រួច៖ ${result.paidCount} ជួរ)`
      );
    } catch (error: any) {
      showToast(`មានបញ្ហា៖ ${error.message}`, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.add(
        { ...syncSettings, id: 'paymentSyncSettings' },
        'paymentSyncSettings'
      );
      setIsSyncSettingsOpen(false);
      showToast('បានរក្សាទុកការកំណត់ដោយជោគជ័យ!');
    } catch (error) {
      console.error('Failed saving payment settings', error);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកការកំណត់!', 'error');
    }
  };

  if (role !== 'admin') return null;

  const liveModalValidity = formatKhmerValidityPeriod(payValidFrom || payDate, payValidUntil);

  return (
    <div style={{ maxWidth: '1480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 35000,
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: toastMsg.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            fontWeight: 600,
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            maxWidth: '90vw',
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>ការបង់ប្រាក់សិស្ស</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            គណនាស្វ័យប្រវត្តិតាមថ្ងៃខួបចូលរៀនរបស់សិស្សម្នាក់ៗ ព្រមទាំងបញ្ជូនទៅ Google Sheets និង Print ក្នុងកម្មវិធី
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => openRecordPaymentModal()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            កត់ត្រាបង់ប្រាក់
          </button>

          <button
            type="button"
            onClick={handleSyncToGoogleSheets}
            disabled={isSyncingSheets}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderColor: '#10b981',
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              <polyline points="17 2 22 7 17 12" />
              <line x1="22" y1="7" x2="9" y2="7" />
            </svg>
            {isSyncingSheets ? 'កំពុង Sync...' : 'Sync ទៅ Google Sheets'}
          </button>

          {effectiveSheetUrl && (
            <a
              href={effectiveSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                textDecoration: 'none',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              បើក Sheet
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsSyncSettingsOpen(true)}
            className="btn btn-outline"
            style={{ padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center' }}
            title="ការកំណត់ Google Sheets & វិក្កយបត្រ"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          onClick={() => {
            setActiveTab('due_overdue');
            setDueSubFilter('all');
          }}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.06)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700 }}>
            ដល់ថ្ងៃបង់ & លើសថ្ងៃ
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {stats.dueOverdueTotalCount} នាក់
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            ដល់ថ្ងៃ៖ {stats.dueTodayCount} | លើសថ្ងៃ៖ {stats.overdueCount} (${stats.totalDueAmount.toFixed(0)})
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('due_overdue');
            setDueSubFilter('include_upcoming');
          }}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'rgba(245, 158, 11, 0.06)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700 }}>
            ជិតដល់ថ្ងៃ (ក្នុង {syncSettings.upcomingDays} ថ្ងៃ)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {stats.upcomingCount} នាក់
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            ចុចដើម្បីមើលសិស្សជិតដល់ថ្ងៃបង់
          </div>
        </div>

        <div
          onClick={() => setActiveTab('paid')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'rgba(16, 185, 129, 0.06)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
            សិស្សបានបង់រួច (មានសុពលភាព)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {stats.paidValidCount} នាក់
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            វិក្កយបត្រសរុប៖ {payments.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('paid')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            background: 'rgba(59, 130, 246, 0.06)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700 }}>
            ចំណូលបង់ប្រាក់ខែនេះ
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            ${stats.currentMonthRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            គិតពីវិក្កយបត្រក្នុងខែបច្ចុប្បន្ន
          </div>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            {
              id: 'due_overdue' as ActiveTab,
              label: `ដល់ថ្ងៃបង់ និងលើសថ្ងៃ (${dueOverdueList.length})`,
              color: '#ef4444',
            },
            {
              id: 'paid' as ActiveTab,
              label: `សិស្សដែលបង់រួច (${paidEntries.length})`,
              color: '#10b981',
            },
            {
              id: 'all_students' as ActiveTab,
              label: `សិស្សទាំងអស់ (${filteredAllStudents.length})`,
              color: 'var(--primary-color)',
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  border: active ? `1px solid ${tab.color}` : '1px solid var(--border-color)',
                  background: active ? tab.color : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរក អត្តលេខ, ឈ្មោះសិស្ស, បន្ទប់, គ្រូ..."
            style={{
              flex: '1 1 240px',
              minWidth: '200px',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />

          <div style={{ minWidth: '170px' }}>
            <CustomSelectDropdown
              value={classFilter}
              onChange={setClassFilter}
              placeholder="គ្រប់ថ្នាក់"
              emptyOptionLabel="គ្រប់ថ្នាក់"
              options={[{ value: 'all', label: 'គ្រប់ថ្នាក់' }, ...classFilterOptions]}
              searchable
              menuMinWidth={190}
            />
          </div>

          {activeTab === 'due_overdue' && (
            <div style={{ minWidth: '210px' }}>
              <CustomSelectDropdown
                value={dueSubFilter}
                onChange={(v) => setDueSubFilter(v as any)}
                searchable={false}
                menuMinWidth={220}
                options={[
                  { value: 'all', label: 'ដល់ថ្ងៃ & លើសថ្ងៃ (ទាំងអស់)' },
                  { value: 'due_only', label: 'តែសិស្សដល់ថ្ងៃថ្ងៃនេះ' },
                  { value: 'overdue_only', label: 'តែសិស្សលើសថ្ងៃ' },
                  {
                    value: 'include_upcoming',
                    label: `រួមទាំងជិតដល់ថ្ងៃ (${syncSettings.upcomingDays}ថ្ងៃ)`,
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'paid' && (
            <>
              <div style={{ minWidth: '200px' }}>
                <CustomSelectDropdown
                  value={paidViewMode}
                  onChange={(v) => setPaidViewMode(v as any)}
                  searchable={false}
                  menuMinWidth={220}
                  options={[
                    { value: 'all_receipts', label: 'វិក្កយបត្របង់រួចទាំងអស់' },
                    { value: 'latest_per_student', label: 'ចុងក្រោយតាមសិស្សម្នាក់ៗ' },
                  ]}
                />
              </div>
              <div style={{ minWidth: '150px' }}>
                <CustomSelectDropdown
                  value={paidMonthFilter}
                  onChange={setPaidMonthFilter}
                  searchable={false}
                  menuMinWidth={160}
                  options={[{ value: 'all', label: 'គ្រប់ខែ' }, ...paidMonthOptions]}
                />
              </div>
            </>
          )}

          {activeTab === 'all_students' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.88rem',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={showInactiveStudents}
                onChange={(e) => setShowInactiveStudents(e.target.checked)}
              />
              បង្ហាញសិស្សឈប់/ផ្អាកផង
            </label>
          )}
        </div>
      </div>

      {/* TAB 1: Due & Overdue Table */}
      {activeTab === 'due_overdue' && (
        <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(239, 68, 68, 0.06)', borderBottom: '1px solid var(--border-color)' }}>
                  <th>លេខរៀង</th>
                  <th>អត្តលេខសិស្ស</th>
                  <th>ឈ្មោះសិស្ស</th>
                  <th>ភេទ</th>
                  <th>វេនសិក្សា</th>
                  <th>វគ្គ</th>
                  <th>ចំនួនខែដែលត្រូវបង់ឬលើស</th>
                  <th>ថ្ងៃខែឆ្នាំត្រូវបង់ប្រាក់</th>
                  <th>ចំនួនប្រាក់ត្រូវបង់</th>
                  <th>ចំនួនថ្ងៃដែលលើស</th>
                  <th>លេខបន្ទប់និងឈ្មោះគ្រូបង្រៀន</th>
                  <th style={{ textAlign: 'right' }}>ជម្រើស</th>
                </tr>
              </thead>
              <tbody>
                {dueOverdueList.map((item, idx) => (
                  <tr
                    key={item.student.id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <code>{item.student.studentId || '-'}</code>
                    </td>
                    <td style={{ fontWeight: 700 }}>{item.student.fullName}</td>
                    <td>{item.student.gender || '-'}</td>
                    <td>{item.student.shift || '-'}</td>
                    <td>{item.student.level || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {item.monthsDue} ខែ
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatDMYSlash(item.dueDateStr) || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#ef4444' }}>
                      ${item.amountDue.toFixed(2)}
                    </td>
                    <td>
                      {item.statusKey === 'overdue' ? (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          លើស {item.overdueDays} ថ្ងៃ
                        </span>
                      ) : item.statusKey === 'due' ? (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#d97706',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          ដល់ថ្ងៃបង់ (0 ថ្ងៃ)
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          សល់ {item.daysRemaining} ថ្ងៃ
                        </span>
                      )}
                    </td>
                    <td>{item.roomAndTeacher || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => openRecordPaymentModal(item)}
                          className="btn btn-primary"
                          style={{ padding: '0.32rem 0.7rem', fontSize: '0.82rem' }}
                        >
                          បង់ប្រាក់
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrintDoc({
                              type: 'due_notice',
                              billing: {
                                student: item.student,
                                roomAndTeacher: item.roomAndTeacher,
                                monthlyFee: item.monthlyFee,
                                enrollDateStr: item.enrollDateStr,
                                dueDateStr: item.dueDateStr,
                                monthsDue: Math.max(1, item.monthsDue),
                                overdueDays: item.overdueDays,
                                amountDue: Math.max(item.amountDue, item.monthlyFee),
                              },
                            })
                          }
                          className="btn btn-outline"
                          style={{
                            padding: '0.32rem 0.65rem',
                            fontSize: '0.82rem',
                            borderColor: '#f59e0b',
                            color: '#d97706',
                          }}
                          title="បង្កើត/បោះពុម្ព លិខិតដល់ថ្ងៃបង់"
                        >
                          លិខិតដល់ថ្ងៃបង់
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dueOverdueList.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      មិនមានសិស្សដល់ថ្ងៃ ឬលើសថ្ងៃបង់ប្រាក់ទេ។
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Paid Records Table */}
      {activeTab === 'paid' && (
        <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(16, 185, 129, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                  <th>លេខវិក្កយបត្រ</th>
                  <th>អត្តលេខសិស្ស</th>
                  <th>ឈ្មោះសិស្ស</th>
                  <th>ភេទ</th>
                  <th>វេនសិក្សា</th>
                  <th>វគ្គសិក្សា</th>
                  <th>ថ្ងៃខួបចូលរៀន</th>
                  <th>ថ្ងៃខែ ឆ្នាំ បង់ប្រាក់ បន្ទាប់</th>
                  <th>សុពលភាពនៃការរៀន</th>
                  <th>លេខបន្ទប់និងឈ្មោះគ្រូបង្រៀន</th>
                  <th style={{ textAlign: 'right' }}>ជម្រើស</th>
                </tr>
              </thead>
              <tbody>
                {paidEntries.map((row) => (
                  <tr
                    key={row.payment.id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td>
                      <strong style={{ color: '#10b981' }}>{row.receiptNo}</strong>
                    </td>
                    <td>
                      <code>{row.studentIdCode || '-'}</code>
                    </td>
                    <td style={{ fontWeight: 700 }}>{row.studentName || '-'}</td>
                    <td>{row.gender || '-'}</td>
                    <td>{row.shift || '-'}</td>
                    <td>{row.level || '-'}</td>
                    <td>{formatDMYSlash(row.enrollDateStr) || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatDMYSlash(row.validUntil) || '-'}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                        }}
                      >
                        {row.validityPeriod || '-'}
                      </span>
                    </td>
                    <td>{row.roomAndTeacher || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setPrintDoc({
                              type: 'receipt',
                              payment: row.payment,
                              student: row.student || {
                                studentId: row.studentIdCode,
                                fullName: row.studentName,
                                gender: row.gender,
                                shift: row.shift,
                                level: row.level,
                                enrollDate: row.enrollDateStr,
                              },
                              roomAndTeacher: row.roomAndTeacher,
                            })
                          }
                          className="btn btn-outline"
                          style={{
                            padding: '0.32rem 0.65rem',
                            fontSize: '0.82rem',
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                          }}
                          title="មើល & បោះពុម្ពវិក្កយបត្រ"
                        >
                          វិក្កយបត្រ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(row.payment)}
                          className="btn"
                          style={{
                            padding: '0.32rem 0.6rem',
                            fontSize: '0.82rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                          }}
                        >
                          លុប
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paidEntries.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      មិនទាន់មានទិន្នន័យការបង់ប្រាក់ទេ។
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All Students Overview */}
      {activeTab === 'all_students' && (
        <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th>លេខរៀង</th>
                  <th>អត្តលេខសិស្ស</th>
                  <th>ឈ្មោះសិស្ស</th>
                  <th>វគ្គ & វេន</th>
                  <th>លេខបន្ទប់និងគ្រូ</th>
                  <th>ថ្លៃសិក្សា</th>
                  <th>ថ្ងៃខួបចូលរៀន</th>
                  <th>ថ្ងៃត្រូវបង់បន្ទាប់</th>
                  <th>ស្ថានភាព</th>
                  <th style={{ textAlign: 'right' }}>ជម្រើស</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllStudents.map((b, idx) => (
                  <tr key={b.student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td>{idx + 1}</td>
                    <td>
                      <code>{b.student.studentId || '-'}</code>
                    </td>
                    <td style={{ fontWeight: 700 }}>{b.student.fullName}</td>
                    <td>
                      {[b.student.level, b.student.shift].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td>{b.roomAndTeacher || '-'}</td>
                    <td style={{ fontWeight: 600 }}>${b.monthlyFee.toFixed(2)}</td>
                    <td>{formatDMYSlash(b.enrollDateStr) || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatDMYSlash(b.dueDateStr) || '-'}</td>
                    <td>
                      {b.statusKey === 'overdue' ? (
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                          {b.statusLabel}
                        </span>
                      ) : b.statusKey === 'due' ? (
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.14)', color: '#d97706', fontWeight: 700, fontSize: '0.82rem' }}>
                          {b.statusLabel}
                        </span>
                      ) : b.statusKey === 'paid' ? (
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>
                          {b.statusLabel}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {b.statusLabel}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => openRecordPaymentModal(b)}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                        >
                          បង់ប្រាក់
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryStudentBilling(b)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                        >
                          ប្រវត្តិ ({b.studentPayments.length})
                        </button>
                        {(b.statusKey === 'due' || b.statusKey === 'overdue') && (
                          <button
                            type="button"
                            onClick={() =>
                              setPrintDoc({
                                type: 'due_notice',
                                billing: {
                                  student: b.student,
                                  roomAndTeacher: b.roomAndTeacher,
                                  monthlyFee: b.monthlyFee,
                                  enrollDateStr: b.enrollDateStr,
                                  dueDateStr: b.dueDateStr,
                                  monthsDue: Math.max(1, b.monthsDue),
                                  overdueDays: b.overdueDays,
                                  amountDue: Math.max(b.amountDue, b.monthlyFee),
                                },
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', borderColor: '#f59e0b', color: '#d97706' }}
                          >
                            លិខិត
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAllStudents.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      មិនមានទិន្នន័យសិស្សទេ។
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {isPaymentModalOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsPaymentModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 20000,
            }}
          >
            <form
              onSubmit={handleSavePayment}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '580px',
                maxHeight: '92vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>កត់ត្រាការបង់ប្រាក់</h3>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  សិស្ស *
                </label>
                <CustomSelectDropdown
                  value={payStudentDocId}
                  onChange={(val) => applyPaymentStudentDefaults(val)}
                  placeholder="-- ជ្រើសរើសសិស្ស --"
                  searchPlaceholder="ស្វែងរកតាមអត្តលេខ ឬ ឈ្មោះ..."
                  options={students.map((s) => {
                    const c = getStudentClassInfo(s, classesData);
                    return {
                      value: s.id,
                      label: `${s.studentId || 'គ្មានកូដ'} - ${s.fullName}`,
                      sublabel: `${c.roomAndTeacher || 'មិនទាន់កំណត់ថ្នាក់'} | $${Number(s.fee || 0)}/ខែ`,
                    };
                  })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    លេខវិក្កយបត្រ
                  </label>
                  <input
                    type="text"
                    required
                    value={payReceiptNo}
                    onChange={(e) => setPayReceiptNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    ថ្ងៃបង់ប្រាក់ជាក់ស្តែង
                  </label>
                  <CustomDatePicker
                    selected={payDate}
                    onChange={(d) => setPayDate(d)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    គិតចាប់ពីថ្ងៃ (ថ្ងៃខួប)
                  </label>
                  <CustomDatePicker
                    selected={payValidFrom}
                    onChange={(d) => {
                      setPayValidFrom(d);
                      handleRecalcFromFields(d, payMonths, payUnitFee, payDiscount);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    ចំនួនខែបង់ប្រាក់
                  </label>
                  <CustomSelectDropdown
                    value={payMonths}
                    searchable={false}
                    onChange={(v) => {
                      setPayMonths(v);
                      handleRecalcFromFields(payValidFrom, v, payUnitFee, payDiscount);
                    }}
                    options={[1, 2, 3, 4, 5, 6, 9, 12].map((m) => ({
                      value: String(m),
                      label: `${m} ខែ`,
                    }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    ថ្ងៃខែឆ្នាំបង់ប្រាក់បន្ទាប់ *
                  </label>
                  <CustomDatePicker
                    selected={payValidUntil}
                    onChange={(d) => setPayValidUntil(d)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    សុពលភាពនៃការរៀន (Preview)
                  </label>
                  <div
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: '#059669',
                      fontWeight: 700,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {liveModalValidity || '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    ថ្លៃសិក្សា/ខែ ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={payUnitFee}
                    onChange={(e) => {
                      setPayUnitFee(e.target.value);
                      handleRecalcFromFields(payValidFrom, payMonths, e.target.value, payDiscount);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    បញ្ចុះតម្លៃ ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={payDiscount}
                    onChange={(e) => {
                      setPayDiscount(e.target.value);
                      handleRecalcFromFields(payValidFrom, payMonths, payUnitFee, e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    ប្រាក់សរុប ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--primary-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    វិធីបង់ប្រាក់
                  </label>
                  <CustomSelectDropdown
                    value={payMethod}
                    searchable={false}
                    onChange={setPayMethod}
                    options={[
                      { value: 'Cash', label: 'សាច់ប្រាក់ (Cash)' },
                      { value: 'ABA', label: 'ABA Bank' },
                      { value: 'ACLEDA', label: 'ACLEDA Bank' },
                      { value: 'Wing', label: 'Wing' },
                      { value: 'KHQR', label: 'KHQR' },
                      { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    សម្គាល់ (Note)
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="ឧ. បង់តាម ABA..."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1.15rem' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.35rem' }}
                >
                  {isSavingPayment ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក និងបើកវិក្កយបត្រ'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Modal: Student Payment History */}
      {historyStudentBilling &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setHistoryStudentBilling(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 20000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    ប្រវត្តិបង់ប្រាក់៖ {historyStudentBilling.student.fullName}
                  </h3>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    អត្តលេខ៖ {historyStudentBilling.student.studentId || '-'} | ថ្ងៃខួបចូលរៀន៖{' '}
                    {formatDMYSlash(historyStudentBilling.enrollDateStr) || '-'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryStudentBilling(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              {historyStudentBilling.studentPayments.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  សិស្សនេះមិនទាន់មានប្រវត្តិបង់ប្រាក់ទេ។
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {historyStudentBilling.studentPayments.map((p) => {
                    const validity =
                      p.validityPeriod ||
                      formatKhmerValidityPeriod(p.validFrom || p.paymentDate, p.validUntil);
                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {p.receiptNo || 'INV'} — ${Number(p.amount || 0).toFixed(2)} ({p.monthsPaid || 1} ខែ)
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            បង់ថ្ងៃ {formatDMYSlash(p.paymentDate)} | សុពលភាព៖ {validity || '-'} | ថ្ងៃបន្ទាប់៖{' '}
                            {formatDMYSlash(p.validUntil)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setPrintDoc({
                                type: 'receipt',
                                payment: p,
                                student: historyStudentBilling.student,
                                roomAndTeacher: historyStudentBilling.roomAndTeacher,
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                          >
                            វិក្កយបត្រ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p)}
                            className="btn"
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.82rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: 'none',
                            }}
                          >
                            លុប
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Google Sheets & Print Settings */}
      {isSyncSettingsOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsSyncSettingsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 20000,
            }}
          >
            <form
              onSubmit={handleSaveSettings}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>ការកំណត់ Google Sheets & វិក្កយបត្រ</h3>
                <button
                  type="button"
                  onClick={() => setIsSyncSettingsOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.88rem' }}>
                  Link ឯកសារ Google Sheets (ដែលមាន Template Print របស់អ្នក)
                </label>
                <input
                  type="text"
                  value={syncSettings.googleSheetUrl}
                  onChange={(e) =>
                    setSyncSettings((s) => ({ ...s, googleSheetUrl: e.target.value }))
                  }
                  placeholder={fallbackStudentSheetUrl || 'https://docs.google.com/spreadsheets/d/...'}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    ឈ្មោះ Tab ដល់ថ្ងៃ & លើសថ្ងៃ
                  </label>
                  <input
                    type="text"
                    required
                    value={syncSettings.dueSheetName}
                    onChange={(e) =>
                      setSyncSettings((s) => ({ ...s, dueSheetName: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    ឈ្មោះ Tab សិស្សបង់រួច
                  </label>
                  <input
                    type="text"
                    required
                    value={syncSettings.paidSheetName}
                    onChange={(e) =>
                      setSyncSettings((s) => ({ ...s, paidSheetName: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    ដាស់តឿនជិតដល់ថ្ងៃ (ថ្ងៃមុន)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={syncSettings.upcomingDays}
                    onChange={(e) =>
                      setSyncSettings((s) => ({
                        ...s,
                        upcomingDays: parseInt(e.target.value, 10) || 5,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    លេខទូរស័ព្ទសាលា (លើវិក្កយបត្រ)
                  </label>
                  <input
                    type="text"
                    value={syncSettings.schoolPhone}
                    onChange={(e) =>
                      setSyncSettings((s) => ({ ...s, schoolPhone: e.target.value }))
                    }
                    placeholder="012 345 678"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  អាសយដ្ឋានសាលា (លើវិក្កយបត្រ & លិខិតជូនដំណឹង)
                </label>
                <input
                  type="text"
                  value={syncSettings.schoolAddress}
                  onChange={(e) =>
                    setSyncSettings((s) => ({ ...s, schoolAddress: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  កំណត់សម្គាល់បន្ថែម / ព័ត៌មានគណនីធនាគារ (លើវិក្កយបត្រ & លិខិត)
                </label>
                <textarea
                  rows={2}
                  value={syncSettings.paymentNote}
                  onChange={(e) =>
                    setSyncSettings((s) => ({ ...s, paymentNote: e.target.value }))
                  }
                  placeholder="ឧ. ABA: 001 234 567 (School Name)"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSyncSettingsOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  បិទ
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Printable Receipt & Due Notice Modal */}
      <PaymentPrintModal
        doc={printDoc}
        schoolName={schoolName}
        schoolPhone={syncSettings.schoolPhone}
        schoolAddress={syncSettings.schoolAddress}
        paymentNote={syncSettings.paymentNote}
        onClose={() => setPrintDoc(null)}
      />
    </div>
  );
}
