"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  classService,
  paymentService,
  settingsService,
  studentService,
  teacherService,
} from '@/services/db';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import MultiSortDropdown, { MultiSortOption, SortRule } from '@/components/MultiSortDropdown';
import { useConfirm } from '@/components/ConfirmDialog';
import PaymentPrintModal, { PrintDocPayload } from '@/components/PaymentPrintModal';
import DueNoticePrintModal, { DueNoticeSettingsPatch } from '@/components/DueNoticePrintModal';
import { OfficialReceiptItem } from '@/components/OfficialReceiptCard';
import {
  DEFAULT_NOTICE_CASHIER,
  DEFAULT_PENALTY_PERCENT_PER_DAY,
  DueNoticeItem,
} from '@/components/receipts/DueNoticeCard';
import { AppIcon } from '@/components/AppIcons';
import { isStudentActive } from '@/components/dashboard/dashboardMetrics';
import {
  addMonthsWithAnniversary,
  computeStudentBillingInfo,
  DEFAULT_RECEIPT_ADDRESS,
  DEFAULT_RECEIPT_CASHIER,
  DEFAULT_RECEIPT_HEADER_DRIVE_URL,
  DEFAULT_RECEIPT_PHONE,
  feeToRiels,
  formatDMYSlash,
  formatKhmerValidityPeriod,
  formatReceiptNo6Digit,
  formatRiels,
  getStudentClassInfo,
  normalizePaymentRiels,
  parseLocalDate,
  resolveStudentCourseName,
  resolveTeacherShortCode,
  StudentBillingInfo,
  toISODateString,
} from '@/utils/paymentBilling';

type ActiveTab = 'due_overdue' | 'print_queue' | 'printed_archive' | 'all_students';

const PAYMENT_SORT_OPTIONS: MultiSortOption[] = [
  { value: 'classCode', label: 'ថ្នាក់រៀន / បន្ទប់' },
  { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
  { value: 'studentId', label: 'អត្តលេខសិស្ស' },
  { value: 'dueDate', label: 'ថ្ងៃត្រូវបង់បន្ទាប់' },
  { value: 'enrollDay', label: 'ថ្ងៃខួបចូលរៀន (១-៣១)' },
  { value: 'enrollDate', label: 'ថ្ងៃខែឆ្នាំចូលរៀន' },
  { value: 'overdueDays', label: 'ចំនួនថ្ងៃលើស' },
  { value: 'level', label: 'វគ្គ / កម្រិតសិក្សា' },
  { value: 'shift', label: 'វេនសិក្សា' },
  { value: 'fee', label: 'ថ្លៃសិក្សា / ទឹកប្រាក់' },
  { value: 'teacherName', label: 'គ្រូបង្រៀន' },
  { value: 'status', label: 'ស្ថានភាពបង់ប្រាក់' },
];

const STATUS_SORT_RANK: Record<string, number> = {
  overdue: 1,
  due: 2,
  paid: 3,
  no_date: 4,
};

function compareSortValues(valA: string | number, valB: string | number): number {
  if (typeof valA === 'number' && typeof valB === 'number') {
    return valA - valB;
  }
  return String(valA || '').localeCompare(String(valB || ''), 'km', { numeric: true });
}

export default function PaymentsPage() {
  const router = useRouter();
  const confirmDialog = useConfirm();

  const [role, setRole] = useState('');
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [currentUserName, setCurrentUserName] = useState('');

  // Firestore Collections
  const [students, setStudents] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [teachersData, setTeachersData] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Settings
  const [syncSettings, setSyncSettings] = useState({
    googleSheetUrl: '',
    dueSheetName: 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
    paidSheetName: 'សិស្សបង់រួច',
    upcomingDays: 5,
    schoolPhone: DEFAULT_RECEIPT_PHONE,
    schoolAddress: DEFAULT_RECEIPT_ADDRESS,
    cashierName: DEFAULT_RECEIPT_CASHIER,
    cashierSignatureUrl: '',
    noticeCashierName: DEFAULT_NOTICE_CASHIER,
    noticeSignatureUrl: '',
    noticePenaltyPercent: DEFAULT_PENALTY_PERCENT_PER_DAY,
    headerLogoUrl: DEFAULT_RECEIPT_HEADER_DRIVE_URL,
    paymentNote: '',
  });
  const [fallbackStudentSheetUrl, setFallbackStudentSheetUrl] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('due_overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [dueSubFilter, setDueSubFilter] = useState<'all' | 'due_only' | 'overdue_only' | 'include_upcoming'>('all');
  const [paidViewMode, setPaidViewMode] = useState<'latest_per_student' | 'all_receipts'>('all_receipts');
  const [paidMonthFilter, setPaidMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
  const [queueDateFilter, setQueueDateFilter] = useState('all'); // 'all' or 'YYYY-MM-DD'
  const [printedDateFilter, setPrintedDateFilter] = useState('all'); // 'all' or 'YYYY-MM-DD'
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);

  // Batch Print Queue Selection
  const [selectedDueIds, setSelectedDueIds] = useState<string[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [selectedPrintedIds, setSelectedPrintedIds] = useState<string[]>([]);
  const [isUpdatingPrintStatus, setIsUpdatingPrintStatus] = useState(false);

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
  const [payCourseName, setPayCourseName] = useState('');
  const [payTeacherCode, setPayTeacherCode] = useState('');
  const [payNote, setPayNote] = useState('');

  // Print Modal & Student History Modal
  const [printDoc, setPrintDoc] = useState<PrintDocPayload | null>(null);
  const [dueNoticeModalState, setDueNoticeModalState] = useState<{
    items: DueNoticeItem[];
    title?: string;
  } | null>(null);
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
    const unsubTeachers = teacherService.subscribeAll(setTeachersData);
    const unsubPayments = paymentService.subscribeAll(setPayments);
    const unsubPaymentSettings = settingsService.subscribeOne('paymentSyncSettings', (docData) => {
      if (docData) {
        setSyncSettings((prev) => ({
          ...prev,
          googleSheetUrl: docData.googleSheetUrl || '',
          dueSheetName: docData.dueSheetName || 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
          paidSheetName: docData.paidSheetName || 'សិស្សបង់រួច',
          upcomingDays: Number(docData.upcomingDays ?? 5),
          schoolPhone: docData.schoolPhone || DEFAULT_RECEIPT_PHONE,
          schoolAddress: docData.schoolAddress || DEFAULT_RECEIPT_ADDRESS,
          cashierName: docData.cashierName || DEFAULT_RECEIPT_CASHIER,
          cashierSignatureUrl: docData.cashierSignatureUrl || '',
          noticeCashierName: docData.noticeCashierName || DEFAULT_NOTICE_CASHIER,
          noticeSignatureUrl: docData.noticeSignatureUrl || '',
          noticePenaltyPercent: Number(
            docData.noticePenaltyPercent ?? DEFAULT_PENALTY_PERCENT_PER_DAY
          ),
          headerLogoUrl: docData.headerLogoUrl || DEFAULT_RECEIPT_HEADER_DRIVE_URL,
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
      unsubTeachers();
      unsubPayments();
      unsubPaymentSettings();
      unsubStudentSettings();
    };
  }, [router]);

  const activeStudents = useMemo(() => {
    return students.filter((s) => {
      if (showInactiveStudents) return true;
      return isStudentActive(s.status);
    });
  }, [students, showInactiveStudents]);

  const billingList = useMemo(() => {
    return activeStudents.map((student) =>
      computeStudentBillingInfo(student, payments, classesData)
    );
  }, [activeStudents, payments, classesData]);

  // Unique class options for multi-select filter dropdown
  const classFilterOptions = useMemo(() => {
    const names = new Set<string>();
    classesData.forEach((c) => {
      const code = String(c.classCode || c.className || '').trim();
      if (code) names.add(code);
    });
    billingList.forEach((b) => {
      if (b.classCode) {
        b.classCode
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((c) => names.add(c));
      }
    });
    return Array.from(names)
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [classesData, billingList]);

  const matchesSearchAndClass = (student: any, classCode: string, roomAndTeacher: string) => {
    if (selectedClasses.length > 0) {
      const codes = String(classCode || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!codes.some((c) => selectedClasses.includes(c))) return false;
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

  const getBillingSortValue = (b: StudentBillingInfo, field: string): string | number => {
    switch (field) {
      case 'classCode':
        return b.classCode || '';
      case 'fullName':
        return b.student?.fullName || '';
      case 'studentId':
        return b.student?.studentId || '';
      case 'dueDate':
        return parseLocalDate(b.dueDateStr)?.getTime() || 0;
      case 'enrollDay':
        return parseLocalDate(b.enrollDateStr)?.getDate() || 99;
      case 'enrollDate':
        return parseLocalDate(b.enrollDateStr)?.getTime() || 0;
      case 'overdueDays':
        return b.overdueDays || 0;
      case 'level':
        return b.student?.level || '';
      case 'shift':
        return b.student?.shift || '';
      case 'fee':
        return b.amountDue > 0 ? b.amountDue : b.monthlyFee || 0;
      case 'teacherName':
        return b.teacherName || '';
      case 'status':
        return STATUS_SORT_RANK[b.statusKey] ?? 9;
      default:
        return b.student?.studentId || '';
    }
  };

  const compareBillingByRules = (
    a: StudentBillingInfo,
    b: StudentBillingInfo,
    fallback: (x: StudentBillingInfo, y: StudentBillingInfo) => number
  ): number => {
    for (const rule of sortRules) {
      const cmp = compareSortValues(
        getBillingSortValue(a, rule.field),
        getBillingSortValue(b, rule.field)
      );
      if (cmp !== 0) return rule.order === 'asc' ? cmp : -cmp;
    }
    return fallback(a, b);
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
      .sort((a, b) =>
        compareBillingByRules(a, b, (x, y) => {
          if (y.overdueDays !== x.overdueDays) return y.overdueDays - x.overdueDays;
          return (x.student.studentId || '').localeCompare(y.student.studentId || '');
        })
      );
  }, [billingList, dueSubFilter, searchQuery, selectedClasses, sortRules, syncSettings.upcomingDays]);

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

  const allEnrichedPaidEntries = useMemo(() => {
    const studentMap = new Map<string, any>();
    students.forEach((s) => studentMap.set(s.id, s));

    return payments
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
        const courseName =
          p.courseName ||
          (student ? resolveStudentCourseName(student, classesData) : '') ||
          p.level ||
          '';
        const teacherShortCode =
          p.teacherShortCode ||
          resolveTeacherShortCode(
            classInfo.teacherName || p.teacherName,
            teachersData,
            classInfo.classCode
          );
        const printStatus: 'pending' | 'printed' =
          p.printStatus === 'printed' ? 'printed' : 'pending';
        const printedAt = typeof p.printedAt === 'string' ? p.printedAt : '';
        const printedDateKey = printedAt ? printedAt.slice(0, 10) : '';

        return {
          payment: p,
          studentDocId,
          student,
          receiptNo: formatReceiptNo6Digit(p.receiptNo || p.id),
          studentIdCode: student?.studentId || p.studentIdCode || '',
          studentName: student?.fullName || p.studentName || '',
          gender: student?.gender || p.gender || '',
          shift: student?.shift || p.shift || '',
          level: student?.level || p.level || '',
          enrollDateStr,
          validFrom,
          validUntil,
          validityPeriod,
          courseName,
          teacherShortCode,
          roomAndTeacher: classInfo.roomAndTeacher || p.roomAndTeacher || '',
          classCode: classInfo.classCode,
          paymentDate: p.paymentDate || '',
          amount: normalizePaymentRiels(p.amount, p),
          printStatus,
          printedAt,
          printedDateKey,
        };
      })
      .sort((a, b) => {
        const da = parseLocalDate(a.paymentDate)?.getTime() || 0;
        const db = parseLocalDate(b.paymentDate)?.getTime() || 0;
        if (db !== da) return db - da;
        return (b.receiptNo || '').localeCompare(a.receiptNo || '');
      });
  }, [payments, students, classesData, teachersData]);

  // Separate Queue: Receipts waiting to be printed (today's / newly recorded)
  const pendingQueueTotalCount = useMemo(
    () => allEnrichedPaidEntries.filter((e) => e.printStatus !== 'printed').length,
    [allEnrichedPaidEntries]
  );

  const printedArchiveTotalCount = useMemo(
    () => allEnrichedPaidEntries.filter((e) => e.printStatus === 'printed').length,
    [allEnrichedPaidEntries]
  );

  const queueDateOptions = useMemo(() => {
    const set = new Set<string>();
    allEnrichedPaidEntries.forEach((item) => {
      if (item.printStatus !== 'printed' && item.paymentDate) {
        set.add(item.paymentDate);
      }
    });
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: formatDMYSlash(d) || d }));
  }, [allEnrichedPaidEntries]);

  const getPaidEntrySortValue = (
    item: (typeof allEnrichedPaidEntries)[number],
    field: string
  ): string | number => {
    switch (field) {
      case 'classCode':
        return item.classCode || '';
      case 'fullName':
        return item.studentName || '';
      case 'studentId':
        return item.studentIdCode || '';
      case 'dueDate':
        return parseLocalDate(item.validUntil)?.getTime() || 0;
      case 'enrollDay':
        return parseLocalDate(item.enrollDateStr)?.getDate() || 99;
      case 'enrollDate':
        return parseLocalDate(item.enrollDateStr)?.getTime() || 0;
      case 'overdueDays':
        return parseLocalDate(item.paymentDate)?.getTime() || 0;
      case 'level':
        return item.level || '';
      case 'shift':
        return item.shift || '';
      case 'fee':
        return item.amount || 0;
      case 'teacherName':
        return item.roomAndTeacher || '';
      case 'status':
        return item.printStatus === 'printed' ? 2 : 1;
      default:
        return item.receiptNo || '';
    }
  };

  const sortPaidEntriesByRules = (
    list: typeof allEnrichedPaidEntries
  ): typeof allEnrichedPaidEntries => {
    if (sortRules.length === 0) return list;
    return [...list].sort((a, b) => {
      for (const rule of sortRules) {
        const cmp = compareSortValues(
          getPaidEntrySortValue(a, rule.field),
          getPaidEntrySortValue(b, rule.field)
        );
        if (cmp !== 0) return rule.order === 'asc' ? cmp : -cmp;
      }
      return (b.receiptNo || '').localeCompare(a.receiptNo || '');
    });
  };

  const printQueueEntries = useMemo(() => {
    const filtered = allEnrichedPaidEntries.filter((item) => {
      if (item.printStatus === 'printed') return false;
      if (queueDateFilter !== 'all' && item.paymentDate !== queueDateFilter) {
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
    return sortPaidEntriesByRules(filtered);
  }, [allEnrichedPaidEntries, queueDateFilter, searchQuery, selectedClasses, sortRules]);

  const printedDateOptions = useMemo(() => {
    const set = new Set<string>();
    allEnrichedPaidEntries.forEach((item) => {
      if (item.printStatus === 'printed' && item.printedDateKey) {
        set.add(item.printedDateKey);
      }
    });
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: formatDMYSlash(d) || d }));
  }, [allEnrichedPaidEntries]);

  // Separate Archive: Receipts already printed (kept isolated from new pending payments)
  const printedArchiveEntries = useMemo(() => {
    let list = allEnrichedPaidEntries.filter((item) => item.printStatus === 'printed');
    if (paidViewMode === 'latest_per_student') {
      const seen = new Set<string>();
      list = list.filter((item) => {
        const key = item.studentDocId || item.studentIdCode;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const filtered = list.filter((item) => {
      if (paidMonthFilter !== 'all' && !item.paymentDate.startsWith(paidMonthFilter)) {
        return false;
      }
      if (printedDateFilter !== 'all' && item.printedDateKey !== printedDateFilter) {
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
    return sortPaidEntriesByRules(filtered);
  }, [
    allEnrichedPaidEntries,
    paidViewMode,
    paidMonthFilter,
    printedDateFilter,
    searchQuery,
    selectedClasses,
    sortRules,
  ]);

  // Combined paid entries for Google Sheets Sync
  const paidEntries = allEnrichedPaidEntries;

  // Keep selections clean when due/queue/archive items change
  useEffect(() => {
    const validDueSet = new Set(dueOverdueList.map((r) => String(r.student.id)));
    setSelectedDueIds((prev) => prev.filter((id) => validDueSet.has(id)));
  }, [dueOverdueList]);

  useEffect(() => {
    const validQueueSet = new Set(printQueueEntries.map((r) => String(r.payment.id)));
    setSelectedQueueIds((prev) => prev.filter((id) => validQueueSet.has(id)));
  }, [printQueueEntries]);

  useEffect(() => {
    const validPrintedSet = new Set(printedArchiveEntries.map((r) => String(r.payment.id)));
    setSelectedPrintedIds((prev) => prev.filter((id) => validPrintedSet.has(id)));
  }, [printedArchiveEntries]);

  const buildDueNoticeItem = (b: StudentBillingInfo): DueNoticeItem => ({
    student: b.student,
    classCode: b.classCode,
    teacherName: b.teacherName,
    teacherShortCode: resolveTeacherShortCode(b.teacherName, teachersData, b.classCode),
    roomAndTeacher: b.roomAndTeacher,
    monthlyFee: b.monthlyFee,
    enrollDateStr: b.enrollDateStr,
    dueDateStr: b.dueDateStr,
    statusKey: b.statusKey,
    monthsDue: Math.max(1, b.monthsDue || 1),
    overdueDays: Math.max(0, b.overdueDays || 0),
    daysRemaining: b.daysRemaining,
    amountDue: Math.max(b.amountDue, b.monthlyFee),
  });

  const handleBatchPrintDueNotices = () => {
    const targets =
      selectedDueIds.length > 0
        ? dueOverdueList.filter((item) => selectedDueIds.includes(String(item.student.id)))
        : dueOverdueList;
    if (targets.length === 0) {
      showToast('មិនមានសិស្សដល់ថ្ងៃ ឬលើសថ្ងៃសម្រាប់ Print ទេ!', 'error');
      return;
    }
    setDueNoticeModalState({
      items: targets.map(buildDueNoticeItem),
      title:
        selectedDueIds.length > 0
          ? `Print លិខិតជូនដំណឹងដែលបានជ្រើស (${targets.length} នាក់ • 6 លិខិត/ទំព័រ A4 បញ្ឈរ)`
          : `Print លិខិតជូនដំណឹងសិស្សដល់ថ្ងៃ & លើសថ្ងៃ (${targets.length} នាក់ • 6 លិខិត/ទំព័រ A4 បញ្ឈរ)`,
    });
  };

  const handleSaveNoticeSettings = async (patch: DueNoticeSettingsPatch) => {
    const nextSettings = {
      ...syncSettings,
      ...(patch.noticeCashierName !== undefined
        ? { noticeCashierName: patch.noticeCashierName }
        : {}),
      ...(patch.noticeSignatureUrl !== undefined
        ? { noticeSignatureUrl: patch.noticeSignatureUrl }
        : {}),
      ...(patch.noticePenaltyPercent !== undefined
        ? { noticePenaltyPercent: patch.noticePenaltyPercent }
        : {}),
      id: 'paymentSyncSettings',
    };
    setSyncSettings((prev) => ({
      ...prev,
      ...(patch.noticeCashierName !== undefined
        ? { noticeCashierName: patch.noticeCashierName }
        : {}),
      ...(patch.noticeSignatureUrl !== undefined
        ? { noticeSignatureUrl: patch.noticeSignatureUrl }
        : {}),
      ...(patch.noticePenaltyPercent !== undefined
        ? { noticePenaltyPercent: patch.noticePenaltyPercent }
        : {}),
    }));
    try {
      await settingsService.add(nextSettings, 'paymentSyncSettings');
      showToast('បានរក្សាទុកព័ត៌មានបេឡា ហត្ថលេខា និងភាគរយផាកពិន័យរួចរាល់!');
    } catch (error) {
      console.error('Failed saving due notice settings:', error);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកការកំណត់លិខិតជូនដំណឹង!', 'error');
    }
  };

  const buildReceiptItem = (row: (typeof allEnrichedPaidEntries)[number]): OfficialReceiptItem => ({
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
    classCode: row.classCode,
    courseName: row.courseName,
    teacherShortCode: row.teacherShortCode,
  });

  const handleSaveSignatureUrl = async (nextUrl: string) => {
    const cleaned = nextUrl.trim();
    const updatedSettings = {
      ...syncSettings,
      cashierSignatureUrl: cleaned,
      id: 'paymentSyncSettings',
    };
    setSyncSettings((prev) => ({ ...prev, cashierSignatureUrl: cleaned }));
    try {
      await settingsService.add(updatedSettings, 'paymentSyncSettings');
      showToast(
        cleaned
          ? 'បានរក្សាទុក Link ហត្ថលេខាទៅក្នុងប្រព័ន្ធរួចរាល់!'
          : 'បានប្តូរត្រឡប់ទៅប្រើហត្ថលេខាលំនាំដើមវិញ!'
      );
    } catch (error) {
      console.error('Failed saving signature URL:', error);
      showToast('មានបញ្ហាក្នុងការរក្សាទុក Link ហត្ថលេខា!', 'error');
    }
  };

  const handleMarkPaymentsPrinted = async (paymentIds: string[]) => {
    if (!paymentIds.length) return;
    setIsUpdatingPrintStatus(true);
    try {
      const nowIso = new Date().toISOString();
      const batchId = `BATCH-${nowIso.slice(0, 16).replace(/[-:T]/g, '')}`;
      await Promise.all(
        paymentIds.map((id) =>
          paymentService.update(id, {
            printStatus: 'printed',
            printedAt: nowIso,
            printBatchId: batchId,
          })
        )
      );
      setSelectedQueueIds((prev) => prev.filter((id) => !paymentIds.includes(id)));
      showToast(
        `បានផ្ទេរវិក្កយបត្រ ${paymentIds.length} ទៅបញ្ជី «Print រួច» ដោយឡែករួចរាល់!`
      );
    } catch (error) {
      console.error('Failed marking payments as printed:', error);
      showToast('មានបញ្ហាក្នុងការប្តូរស្ថានភាព Print!', 'error');
    } finally {
      setIsUpdatingPrintStatus(false);
    }
  };

  const handleMovePaymentsToQueue = async (paymentIds: string[]) => {
    if (!paymentIds.length) return;
    setIsUpdatingPrintStatus(true);
    try {
      await Promise.all(
        paymentIds.map((id) =>
          paymentService.update(id, {
            printStatus: 'pending',
            printedAt: '',
            printBatchId: '',
          })
        )
      );
      setSelectedPrintedIds((prev) => prev.filter((id) => !paymentIds.includes(id)));
      showToast(`បានផ្ទេរវិក្កយបត្រ ${paymentIds.length} ត្រឡប់ទៅ «ត្រូវ Print» វិញ!`);
    } catch (error) {
      console.error('Failed moving payments back to print queue:', error);
      showToast('មានបញ្ហាក្នុងការផ្ទេរវិក្កយបត្រ!', 'error');
    } finally {
      setIsUpdatingPrintStatus(false);
    }
  };

  const handleBatchPrintQueue = () => {
    const targets =
      selectedQueueIds.length > 0
        ? printQueueEntries.filter((r) => selectedQueueIds.includes(String(r.payment.id)))
        : printQueueEntries;
    if (targets.length === 0) {
      showToast('មិនមានវិក្កយបត្រក្នុងបញ្ជីត្រូវ Print ទេ!', 'error');
      return;
    }
    setPrintDoc({
      type: 'receipt_batch',
      items: targets.map(buildReceiptItem),
      title: `បោះពុម្ពបញ្ជីត្រូវ Print (${targets.length} វិក្កយបត្រ)`,
    });
  };

  const handleBatchPrintArchive = () => {
    const targets =
      selectedPrintedIds.length > 0
        ? printedArchiveEntries.filter((r) => selectedPrintedIds.includes(String(r.payment.id)))
        : printedArchiveEntries;
    if (targets.length === 0) {
      showToast('សូមជ្រើសរើសវិក្កយបត្រដែលចង់ Print ម្តងទៀត!', 'error');
      return;
    }
    setPrintDoc({
      type: 'receipt_batch',
      items: targets.map(buildReceiptItem),
      title: `បោះពុម្ពឡើងវិញ (${targets.length} វិក្កយបត្រ)`,
    });
  };

  const filteredAllStudents = useMemo(() => {
    return billingList
      .filter((b) => matchesSearchAndClass(b.student, b.classCode, b.roomAndTeacher))
      .sort((a, b) =>
        compareBillingByRules(a, b, (x, y) =>
          (x.student.studentId || '').localeCompare(y.student.studentId || '')
        )
      );
  }, [billingList, searchQuery, selectedClasses, sortRules]);

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
      .reduce((sum, p) => sum + normalizePaymentRiels(p.amount, p), 0);

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
    return String(maxNum + 1).padStart(6, '0');
  };

  const applyPaymentStudentDefaults = (
    studentDocId: string,
    monthsOverride?: number,
    paymentDateOverride?: string
  ) => {
    const student = students.find((s) => s.id === studentDocId);
    if (!student) return;

    const billing = computeStudentBillingInfo(student, payments, classesData);
    const classInfo = getStudentClassInfo(student, classesData);
    const todayStr = paymentDateOverride || toISODateString(new Date());
    const startFrom = billing.dueDateStr || billing.enrollDateStr || todayStr;
    const defaultMonths = monthsOverride ?? Math.max(1, billing.monthsDue || 1);
    const unitFee = feeToRiels(student.fee);
    const anchorDate = student.billingStartDate || student.enrollDate || startFrom;
    const nextUntil = addMonthsWithAnniversary(
      startFrom,
      defaultMonths,
      anchorDate
    );

    setPayStudentDocId(studentDocId);
    setPayValidFrom(startFrom);
    setPayMonths(String(defaultMonths));
    setPayValidUntil(nextUntil);
    setPayUnitFee(String(unitFee));
    setPayDiscount('0');
    setPayAmount(String(Math.max(0, unitFee * defaultMonths)));
    setPayCourseName(resolveStudentCourseName(student, classesData));
    setPayTeacherCode(
      resolveTeacherShortCode(classInfo.teacherName, teachersData, classInfo.classCode)
    );
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
      setPayCourseName('');
      setPayTeacherCode('');
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
      const anchorDate = student?.billingStartDate || student?.enrollDate || nextFrom;
      setPayValidUntil(
        addMonthsWithAnniversary(nextFrom, m, anchorDate)
      );
    }
    setPayAmount(String(Math.max(0, unit * m - disc)));
  };

  const savePaymentRecord = async (openPreviewNow: boolean) => {
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
      const receiptNo = formatReceiptNo6Digit(payReceiptNo.trim() || generateNextReceiptNo());
      const resolvedCourse =
        payCourseName.trim() || resolveStudentCourseName(student, classesData) || student.level || '';
      const resolvedTeacherCode =
        payTeacherCode.trim() ||
        resolveTeacherShortCode(classInfo.teacherName, teachersData, classInfo.classCode);

      const payload = {
        receiptNo,
        studentDocId: student.id,
        studentId: student.id, // backwards-compatible field
        studentIdCode: student.studentId || '',
        studentName: student.fullName || '',
        gender: student.gender || '',
        shift: student.shift || '',
        level: student.level || '',
        courseName: resolvedCourse,
        teacherShortCode: resolvedTeacherCode,
        enrollDate: student.enrollDate || '',
        className: classInfo.classCode,
        teacherName: classInfo.teacherName,
        roomAndTeacher: classInfo.roomAndTeacher,
        paymentDate: payDate,
        validFrom: payValidFrom || payDate,
        validUntil: payValidUntil,
        validityPeriod,
        monthsPaid,
        unitFee: Math.round(unitFee),
        discount: Math.round(discount),
        amount: Math.round(amount),
        currency: 'KHR',
        method: payMethod,
        note: payNote.trim(),
        recordedBy: currentUserName,
        printStatus: 'pending',
        printedAt: '',
        printBatchId: '',
      };

      const savedId = await paymentService.add(payload);
      await studentService.update(student.id, {
        nextPaymentDate: payValidUntil,
      });

      setIsPaymentModalOpen(false);
      showToast(`បានកត់ត្រាវិក្កយបត្រ ${receiptNo} និងដាក់ចូលបញ្ជី «ត្រូវ Print» រួចរាល់!`);

      if (openPreviewNow) {
        setPrintDoc({
          type: 'receipt',
          payment: { ...payload, id: savedId },
          student,
          roomAndTeacher: classInfo.roomAndTeacher,
          courseName: resolvedCourse,
          teacherShortCode: resolvedTeacherCode,
        });
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកការបង់ប្រាក់!', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePaymentRecord(false);
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
          remaining.length > 0
            ? remaining[0].validUntil || ''
            : student.billingStartDate || student.enrollDate || '';
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
            onClick={() => {
              setActiveTab('print_queue');
              if (pendingQueueTotalCount > 0) {
                handleBatchPrintQueue();
              }
            }}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderColor: '#4f46e5',
              color: '#4f46e5',
              background: pendingQueueTotalCount > 0 ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              fontWeight: 700,
            }}
          >
            <AppIcon name="printer" size={16} />
            Print A4 ({pendingQueueTotalCount})
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
            ដល់ថ្ងៃ៖ {stats.dueTodayCount} | លើសថ្ងៃ៖ {stats.overdueCount} ({formatRiels(stats.totalDueAmount)})
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
          onClick={() => setActiveTab(pendingQueueTotalCount > 0 ? 'print_queue' : 'printed_archive')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            background: 'rgba(79, 70, 229, 0.06)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: 700 }}>
            វិក្កយបត្រត្រូវ Print / Print រួច
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {pendingQueueTotalCount} ត្រូវ Print
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Print រួច៖ {printedArchiveTotalCount} | បង់មានសុពលភាព៖ {stats.paidValidCount} នាក់
          </div>
        </div>

        <div
          onClick={() => setActiveTab('printed_archive')}
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
            {formatRiels(stats.currentMonthRevenue)}
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
              id: 'print_queue' as ActiveTab,
              label: `ត្រូវ Print (${printQueueEntries.length})`,
              color: '#4f46e5',
            },
            {
              id: 'printed_archive' as ActiveTab,
              label: `Print រួច (${printedArchiveEntries.length})`,
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

          <MultiSelectDropdown
            options={classFilterOptions}
            selectedValues={selectedClasses}
            onChange={setSelectedClasses}
            allLabel="គ្រប់ថ្នាក់"
            title="ជ្រើសរើសថ្នាក់រៀន (អាច Tick ច្រើន)"
            multiLabel="ថ្នាក់"
            searchable
            searchPlaceholder="ស្វែងរកថ្នាក់..."
          />

          <MultiSortDropdown
            options={PAYMENT_SORT_OPTIONS}
            rules={sortRules}
            onChange={setSortRules}
          />

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

          {activeTab === 'print_queue' && (
            <div style={{ minWidth: '170px' }}>
              <CustomSelectDropdown
                value={queueDateFilter}
                onChange={setQueueDateFilter}
                searchable={false}
                menuMinWidth={185}
                options={[{ value: 'all', label: 'គ្រប់ថ្ងៃបង់ប្រាក់' }, ...queueDateOptions]}
              />
            </div>
          )}

          {activeTab === 'printed_archive' && (
            <>
              <div style={{ minWidth: '170px' }}>
                <CustomSelectDropdown
                  value={printedDateFilter}
                  onChange={setPrintedDateFilter}
                  searchable={false}
                  menuMinWidth={180}
                  options={[{ value: 'all', label: 'គ្រប់ថ្ងៃ Print' }, ...printedDateOptions]}
                />
              </div>
              <div style={{ minWidth: '150px' }}>
                <CustomSelectDropdown
                  value={paidMonthFilter}
                  onChange={setPaidMonthFilter}
                  searchable={false}
                  menuMinWidth={160}
                  options={[{ value: 'all', label: 'គ្រប់ខែបង់' }, ...paidMonthOptions]}
                />
              </div>
              <div style={{ minWidth: '200px' }}>
                <CustomSelectDropdown
                  value={paidViewMode}
                  onChange={(v) => setPaidViewMode(v as any)}
                  searchable={false}
                  menuMinWidth={220}
                  options={[
                    { value: 'all_receipts', label: 'វិក្កយបត្រទាំងអស់' },
                    { value: 'latest_per_student', label: 'ចុងក្រោយតាមសិស្សម្នាក់ៗ' },
                  ]}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Batch Print Bar for Due & Overdue Notices (6-Up A4 Portrait 10.5cm × 9.9cm) */}
          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.07)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                បញ្ជីលិខិតជូនដំណឹងសិស្សដល់ថ្ងៃ & លើសថ្ងៃ ({dueOverdueList.length} នាក់ •{' '}
                {Math.ceil(
                  (selectedDueIds.length > 0 ? selectedDueIds.length : dueOverdueList.length) / 6
                )}{' '}
                ទំព័រ A4 បញ្ឈរ)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ទំហំ 10.5cm × 9.9cm • តម្រៀប 6 លិខិត/ទំព័រ A4 បញ្ឈរ • អាចកំណត់ % ផាកពិន័យ និងលាក់ Header / Footer / ទឹកប្រាក់ / ផាកពិន័យ
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.55rem' }}>
              {selectedDueIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDueIds([])}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                >
                  លុបការជ្រើស ({selectedDueIds.length})
                </button>
              )}
              <button
                type="button"
                disabled={dueOverdueList.length === 0}
                onClick={handleBatchPrintDueNotices}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.52rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  background:
                    dueOverdueList.length === 0
                      ? undefined
                      : 'linear-gradient(135deg, #d97706, #dc2626)',
                  border: 'none',
                }}
              >
                <AppIcon name="printer" size={16} style={{ color: '#ffffff' }} />
                <span>
                  Print លិខិតជូនដំណឹង A4 បញ្ឈរ 6/ទំព័រ (
                  {selectedDueIds.length > 0 ? selectedDueIds.length : dueOverdueList.length})
                </span>
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1180px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.06)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          dueOverdueList.length > 0 &&
                          selectedDueIds.length === dueOverdueList.length
                        }
                        onChange={(e) =>
                          setSelectedDueIds(
                            e.target.checked
                              ? dueOverdueList.map((r) => String(r.student.id))
                              : []
                          )
                        }
                        title="ជ្រើសរើសទាំងអស់"
                      />
                    </th>
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
                  {dueOverdueList.map((item, idx) => {
                    const idStr = String(item.student.id);
                    const isChecked = selectedDueIds.includes(idStr);
                    return (
                    <tr
                      key={item.student.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isChecked ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedDueIds((prev) =>
                              e.target.checked
                                ? [...prev, idStr]
                                : prev.filter((x) => x !== idStr)
                            )
                          }
                        />
                      </td>
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
                        {formatRiels(item.amountDue)}
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
                              setDueNoticeModalState({
                                items: [buildDueNoticeItem(item)],
                                title: `លិខិតជូនដំណឹង — ${item.student.fullName}`,
                              })
                            }
                            className="btn btn-outline"
                            style={{
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.82rem',
                              borderColor: '#f59e0b',
                              color: '#d97706',
                            }}
                            title="បង្កើត/បោះពុម្ព លិខិតដល់ថ្ងៃបង់ (10.5cm × 9.9cm)"
                          >
                            លិខិតដល់ថ្ងៃបង់
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {dueOverdueList.length === 0 && (
                    <tr>
                      <td colSpan={13} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        មិនមានសិស្សដល់ថ្ងៃ ឬលើសថ្ងៃបង់ប្រាក់ទេ។
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Print Queue (បញ្ជីត្រូវ Print — ដាច់ដោយឡែកពី Print រួច) */}
      {activeTab === 'print_queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Batch Action Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(79, 70, 229, 0.28)',
              background: 'rgba(79, 70, 229, 0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#4338ca' }}>
                បញ្ជីវិក្កយបត្រត្រូវ Print ({printQueueEntries.length} វិក្កយបត្រ •{' '}
                {Math.max(1, Math.ceil((selectedQueueIds.length || printQueueEntries.length || 1) / 4))}{' '}
                ទំព័រ A4 ផ្ដេក)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                សិស្សបង់ប្រាក់ថ្មីនឹងចូលមកទីនេះដោយស្វ័យប្រវត្តិ។ ពេល Print រួច សូមចុច «សម្គាល់ថា Print រួច» ដើម្បីផ្ទេរទុកដោយឡែកកុំឱ្យលាយឡំជាមួយថ្ងៃបន្ទាប់។
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={printQueueEntries.length === 0}
                onClick={handleBatchPrintQueue}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.52rem 1.05rem',
                  background: '#4f46e5',
                  borderColor: '#4f46e5',
                  fontWeight: 700,
                }}
              >
                <AppIcon name="printer" size={16} />
                Print A4 ផ្ដេក 4/ទំព័រ ({selectedQueueIds.length > 0 ? selectedQueueIds.length : printQueueEntries.length})
              </button>

              <button
                type="button"
                disabled={printQueueEntries.length === 0 || isUpdatingPrintStatus}
                onClick={async () => {
                  const targetIds =
                    selectedQueueIds.length > 0
                      ? selectedQueueIds
                      : printQueueEntries.map((r) => String(r.payment.id));
                  if (targetIds.length === 0) return;
                  const ok = await confirmDialog({
                    title: 'បញ្ជាក់ថា Print រួចរាល់',
                    message: `តើអ្នកចង់សម្គាល់វិក្កយបត្រចំនួន ${targetIds.length} ថា «Print រួច» ហើយផ្ទេរចេញពីបញ្ជីត្រូវ Print ទុកដោយឡែកមែនទេ?`,
                    confirmText: 'ផ្ទេរទៅ Print រួច',
                    variant: 'info',
                  });
                  if (ok) await handleMarkPaymentsPrinted(targetIds);
                }}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.52rem 0.95rem',
                  borderColor: '#10b981',
                  color: '#059669',
                  fontWeight: 700,
                }}
              >
                <AppIcon name="check-circle" size={15} />
                សម្គាល់ថា Print រួច ({selectedQueueIds.length > 0 ? selectedQueueIds.length : printQueueEntries.length})
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(79, 70, 229, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '42px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          printQueueEntries.length > 0 &&
                          selectedQueueIds.length === printQueueEntries.length
                        }
                        onChange={(e) =>
                          setSelectedQueueIds(
                            e.target.checked
                              ? printQueueEntries.map((r) => String(r.payment.id))
                              : []
                          )
                        }
                      />
                    </th>
                    <th>លេខវិក្កយបត្រ</th>
                    <th>ថ្ងៃបង់ប្រាក់</th>
                    <th>អត្តលេខ & ឈ្មោះសិស្ស</th>
                    <th>ភេទ</th>
                    <th>វគ្គ & វេន</th>
                    <th>សុពលភាព</th>
                    <th>ថ្ងៃបង់បន្ទាប់</th>
                    <th>ទឹកប្រាក់</th>
                    <th>បន្ទប់ & គ្រូ</th>
                    <th style={{ textAlign: 'right' }}>ជម្រើស</th>
                  </tr>
                </thead>
                <tbody>
                  {printQueueEntries.map((row) => {
                    const idStr = String(row.payment.id);
                    const isChecked = selectedQueueIds.includes(idStr);
                    return (
                      <tr
                        key={idStr}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedQueueIds((prev) =>
                                e.target.checked
                                  ? [...prev, idStr]
                                  : prev.filter((x) => x !== idStr)
                              )
                            }
                          />
                        </td>
                        <td>
                          <strong style={{ color: '#b91c1c' }}>{row.receiptNo}</strong>
                        </td>
                        <td>{formatDMYSlash(row.paymentDate) || '-'}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{row.studentName || '-'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            <code>{row.studentIdCode || '-'}</code>
                          </div>
                        </td>
                        <td>{row.gender || '-'}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{row.courseName || row.level || '-'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            {[row.level, row.shift].filter(Boolean).join(' • ') || '-'}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              background: 'rgba(79, 70, 229, 0.1)',
                              color: '#4338ca',
                              fontWeight: 600,
                              fontSize: '0.84rem',
                            }}
                          >
                            {row.validityPeriod || '-'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatDMYSlash(row.validUntil) || '-'}</td>
                        <td style={{ fontWeight: 700 }}>{formatRiels(row.amount)}</td>
                        <td>{row.roomAndTeacher || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setPrintDoc({
                                  type: 'receipt',
                                  ...buildReceiptItem(row),
                                  roomAndTeacher: row.roomAndTeacher,
                                })
                              }
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                borderColor: '#4f46e5',
                                color: '#4f46e5',
                              }}
                              title="មើល & Print វិក្កយបត្រ"
                            >
                              មើល
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingPrintStatus}
                              onClick={() => handleMarkPaymentsPrinted([idStr])}
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                borderColor: '#10b981',
                                color: '#059669',
                              }}
                              title="ផ្ទេរទៅ Print រួច"
                            >
                              Print រួច
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(row.payment)}
                              className="btn"
                              style={{
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.8rem',
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
                    );
                  })}
                  {printQueueEntries.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: '2.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        គ្មានវិក្កយបត្ររង់ចាំ Print ទេ។ នៅពេលកត់ត្រាសិស្សបង់ប្រាក់ថ្មី វិក្កយបត្រនឹងបង្ហាញនៅទីនេះសម្រាប់ប្រមូល Print ជាក្រុម (A4 4/ទំព័រ)។
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Printed Archive (បញ្ជី Print រួច — ទុកដោយឡែកមិនលាយឡំជាមួយសិស្សបង់ថ្មី) */}
      {activeTab === 'printed_archive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              background: 'rgba(16, 185, 129, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#059669' }}>
                បញ្ជីវិក្កយបត្រដែលបាន Print រួច ({printedArchiveEntries.length} វិក្កយបត្រ)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ទិន្នន័យ Print រួចត្រូវបានរក្សាទុកដាច់ដោយឡែកពីបញ្ជីត្រូវ Print ថ្មី។ អ្នកអាច Print ម្តងទៀត ឬផ្ទេរត្រឡប់ទៅ «ត្រូវ Print» វិញបានគ្រប់ពេល។
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={printedArchiveEntries.length === 0}
                onClick={handleBatchPrintArchive}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.95rem',
                  borderColor: '#10b981',
                  color: '#059669',
                  fontWeight: 700,
                }}
              >
                <AppIcon name="printer" size={15} />
                Print ម្តងទៀត A4 ({selectedPrintedIds.length > 0 ? selectedPrintedIds.length : printedArchiveEntries.length})
              </button>

              {selectedPrintedIds.length > 0 && (
                <button
                  type="button"
                  disabled={isUpdatingPrintStatus}
                  onClick={() => handleMovePaymentsToQueue(selectedPrintedIds)}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.9rem',
                    borderColor: '#f59e0b',
                    color: '#d97706',
                    fontWeight: 700,
                  }}
                >
                  <AppIcon name="rotate-cw" size={14} />
                  ផ្ទេរទៅត្រូវ Print វិញ ({selectedPrintedIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(16, 185, 129, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '42px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          printedArchiveEntries.length > 0 &&
                          selectedPrintedIds.length === printedArchiveEntries.length
                        }
                        onChange={(e) =>
                          setSelectedPrintedIds(
                            e.target.checked
                              ? printedArchiveEntries.map((r) => String(r.payment.id))
                              : []
                          )
                        }
                      />
                    </th>
                    <th>លេខវិក្កយបត្រ</th>
                    <th>ថ្ងៃ Print រួច</th>
                    <th>អត្តលេខ & ឈ្មោះសិស្ស</th>
                    <th>ភេទ</th>
                    <th>វគ្គ & វេន</th>
                    <th>សុពលភាព</th>
                    <th>ថ្ងៃបង់បន្ទាប់</th>
                    <th>ទឹកប្រាក់</th>
                    <th>បន្ទប់ & គ្រូ</th>
                    <th style={{ textAlign: 'right' }}>ជម្រើស</th>
                  </tr>
                </thead>
                <tbody>
                  {printedArchiveEntries.map((row) => {
                    const idStr = String(row.payment.id);
                    const isChecked = selectedPrintedIds.includes(idStr);
                    return (
                      <tr
                        key={idStr}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedPrintedIds((prev) =>
                                e.target.checked
                                  ? [...prev, idStr]
                                  : prev.filter((x) => x !== idStr)
                              )
                            }
                          />
                        </td>
                        <td>
                          <strong style={{ color: '#059669' }}>{row.receiptNo}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '0.18rem 0.5rem',
                              borderRadius: '999px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.printedDateKey ? formatDMYSlash(row.printedDateKey) : 'Print រួច'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{row.studentName || '-'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            <code>{row.studentIdCode || '-'}</code>
                          </div>
                        </td>
                        <td>{row.gender || '-'}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{row.courseName || row.level || '-'}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            {[row.level, row.shift].filter(Boolean).join(' • ') || '-'}
                          </div>
                        </td>
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
                        <td style={{ fontWeight: 600 }}>{formatDMYSlash(row.validUntil) || '-'}</td>
                        <td style={{ fontWeight: 700 }}>{formatRiels(row.amount)}</td>
                        <td>{row.roomAndTeacher || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setPrintDoc({
                                  type: 'receipt',
                                  ...buildReceiptItem(row),
                                  roomAndTeacher: row.roomAndTeacher,
                                })
                              }
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                              }}
                              title="Print វិក្កយបត្រម្តងទៀត"
                            >
                              Print ម្តងទៀត
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingPrintStatus}
                              onClick={() => handleMovePaymentsToQueue([idStr])}
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.8rem',
                                borderColor: '#f59e0b',
                                color: '#d97706',
                              }}
                              title="ផ្ទេរត្រឡប់ទៅត្រូវ Print វិញ"
                            >
                              ផ្ទេរវិញ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(row.payment)}
                              className="btn"
                              style={{
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.8rem',
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
                    );
                  })}
                  {printedArchiveEntries.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: '2.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        មិនទាន់មានវិក្កយបត្រដែលបាន Print រួចនៅឡើយទេ។
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    <td style={{ fontWeight: 600 }}>{formatRiels(b.monthlyFee)}</td>
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
                              setDueNoticeModalState({
                                items: [buildDueNoticeItem(b)],
                                title: `លិខិតជូនដំណឹង — ${b.student.fullName}`,
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                >
                  <AppIcon name="x" size={20} />
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
                      sublabel: `${c.roomAndTeacher || 'មិនទាន់កំណត់ថ្នាក់'} | ${formatRiels(feeToRiels(s.fee))}/ខែ`,
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
                    ថ្លៃសិក្សា/ខែ (រៀល)
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
                    បញ្ចុះតម្លៃ (រៀល)
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
                    ប្រាក់សរុប (រៀល)
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    វគ្គសិក្សា (បង្ហាញលើវិក្កយបត្រ)
                  </label>
                  <input
                    type="text"
                    value={payCourseName}
                    onChange={(e) => setPayCourseName(e.target.value)}
                    placeholder="ឧ. Smart English Alphabet"
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
                    កូដគ្រូ (ជ្រុងលើស្តាំ)
                  </label>
                  <input
                    type="text"
                    value={payTeacherCode}
                    onChange={(e) => setPayTeacherCode(e.target.value)}
                    placeholder="ឧ. NIN"
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

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  disabled={isSavingPayment}
                  onClick={() => savePaymentRecord(true)}
                  className="btn btn-outline"
                  style={{
                    padding: '0.55rem 1rem',
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    fontWeight: 700,
                  }}
                >
                  រក្សាទុក & មើលវិក្កយបត្រ
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontWeight: 700 }}
                >
                  {isSavingPayment ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកចូលបញ្ជីត្រូវ Print'}
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                >
                  <AppIcon name="x" size={20} />
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
                            {p.receiptNo || 'INV'} — {formatRiels(normalizePaymentRiels(p.amount, p))} ({p.monthsPaid || 1} ខែ)
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
                                courseName:
                                  p.courseName ||
                                  resolveStudentCourseName(
                                    historyStudentBilling.student,
                                    classesData
                                  ),
                                teacherShortCode:
                                  p.teacherShortCode ||
                                  resolveTeacherShortCode(
                                    historyStudentBilling.teacherName,
                                    teachersData,
                                    historyStudentBilling.classCode
                                  ),
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                >
                  <AppIcon name="x" size={20} />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    ឈ្មោះអ្នកទទួលប្រាក់ (លើវិក្កយបត្រ)
                  </label>
                  <input
                    type="text"
                    value={syncSettings.cashierName}
                    onChange={(e) =>
                      setSyncSettings((s) => ({ ...s, cashierName: e.target.value }))
                    }
                    placeholder={DEFAULT_RECEIPT_CASHIER}
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
                    Link Logo & ផ្លាកសាលា (Google Drive)
                  </label>
                  <input
                    type="text"
                    value={syncSettings.headerLogoUrl}
                    onChange={(e) =>
                      setSyncSettings((s) => ({ ...s, headerLogoUrl: e.target.value }))
                    }
                    placeholder={DEFAULT_RECEIPT_HEADER_DRIVE_URL}
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
                  Link រូបភាពហត្ថលេខាអ្នកទទួលប្រាក់ (PNG ពី Google Drive — ទុកទទេដើម្បីប្រើហត្ថលេខាលំនាំដើម)
                </label>
                <input
                  type="text"
                  value={syncSettings.cashierSignatureUrl}
                  onChange={(e) =>
                    setSyncSettings((s) => ({ ...s, cashierSignatureUrl: e.target.value }))
                  }
                  placeholder="https://drive.google.com/file/d/... (ជាជម្រើស)"
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
                  អាសយដ្ឋានសាលា (លើវិក្កយបត្រ & លិខិតជូនដំណឹង)
                </label>
                <textarea
                  rows={2}
                  value={syncSettings.schoolAddress}
                  onChange={(e) =>
                    setSyncSettings((s) => ({ ...s, schoolAddress: e.target.value }))
                  }
                  placeholder={DEFAULT_RECEIPT_ADDRESS}
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

      {/* Printable Receipt Modal */}
      <PaymentPrintModal
        doc={printDoc}
        schoolName={schoolName}
        schoolPhone={syncSettings.schoolPhone}
        schoolAddress={syncSettings.schoolAddress}
        cashierName={syncSettings.cashierName}
        cashierSignatureUrl={syncSettings.cashierSignatureUrl}
        headerLogoUrl={syncSettings.headerLogoUrl}
        paymentNote={syncSettings.paymentNote}
        onMarkAsPrinted={handleMarkPaymentsPrinted}
        onSaveSignatureUrl={handleSaveSignatureUrl}
        onClose={() => setPrintDoc(null)}
      />

      {/* Printable 6-Up A4 Portrait Due & Overdue Notice Modal (10.5cm × 9.9cm) */}
      <DueNoticePrintModal
        isOpen={Boolean(dueNoticeModalState)}
        items={dueNoticeModalState?.items || []}
        title={dueNoticeModalState?.title}
        schoolPhone={syncSettings.schoolPhone}
        schoolAddress={syncSettings.schoolAddress}
        headerLogoUrl={syncSettings.headerLogoUrl}
        noticeCashierName={syncSettings.noticeCashierName}
        noticeSignatureUrl={syncSettings.noticeSignatureUrl}
        initialPenaltyPercent={syncSettings.noticePenaltyPercent}
        onSaveNoticeSettings={handleSaveNoticeSettings}
        onClose={() => setDueNoticeModalState(null)}
      />
    </div>
  );
}
