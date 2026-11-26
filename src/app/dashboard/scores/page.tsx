"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classService, studentService, scoreService, scoreCoefficientService, settingsService, teacherService } from '@/services/db';
import SortDropdown from '@/components/SortDropdown';
import { usePortalMenuPosition } from '@/utils/usePortalMenuPosition';
import { useConfirm } from '@/components/ConfirmDialog';
import ScoresGuideModal from '@/components/ScoresGuideModal';
import MonthlyResultPrintModal, { MonthlyResultBrandingConfig } from '@/components/scores/MonthlyResultPrintModal';
import CertificatePrintModal, { CertificateBrandingConfig } from '@/components/scores/CertificatePrintModal';
import HonorRollPrintModal from '@/components/scores/HonorRollPrintModal';
import AssignScoreLevelModal, { AssignableScoreStudent } from '@/components/scores/AssignScoreLevelModal';
import ScoreEvalDropdown from '@/components/scores/ScoreEvalDropdown';
import AdminDefaultColumnsModal from '@/components/scores/AdminDefaultColumnsModal';
import { AppIcon } from '@/components/AppIcons';
import {
  ActiveScoreSubjectColumn,
  ClassScoreColumnsConfig,
  LOCKED_SUBJECT_KEY_SET,
  ScoreColumnInputMode,
  TRAIT_EVALUATION_COLUMNS,
  TraitFieldKey,
  buildStudentTraitLookup,
  computeNumericTotalForColumns,
  findStudentTraitSnapshot,
  getActiveSubjectColumns,
  getAllAvailableSubjectColumns,
  getCheckboxSubjectColumns,
  getColumnEvalValue,
  getColumnNumericValue,
  getPreviousMonthCandidates,
  isStandardYearMonth,
  makeCustomColumnKey,
  normalizeEvaluationValue,
  resolveClassColumnsConfig,
  sanitizeGlobalDefaultColumnsConfig,
  shiftYearMonth,
} from '@/components/scores/scoreColumns';

type LevelCoeffEntry = {
  coefficientType: 'auto' | 'custom';
  customMaxScore: number;
};

type ClassCoeffConfig = {
  coefficientType: 'auto' | 'custom';
  customMaxScore: number;
  isCustomSavedForMonth?: boolean;
  splitByLevel?: boolean;
  levelCoefficients?: Record<string, LevelCoeffEntry>;
};

const UNASSIGNED_LEVEL_LABEL = 'មិនទាន់កំណត់វគ្គ';

interface FinalExamSession {
  id: string;
  title: string;
  classId?: string;
  courseNameKh?: string;
  courseNameEn?: string;
  levelName?: string;
  examDate?: string;
  createdByUid?: string;
  createdByName?: string;
  createdAt?: string;
}

function getClassMonthCoeffConfig(
  classId: string | null | undefined,
  monthCoeffs: Record<string, any>,
  fallbackSettings: any
): ClassCoeffConfig {
  const saved = classId ? monthCoeffs?.[classId] : null;
  const splitByLevel = Boolean(saved?.splitByLevel);
  const levelCoefficients: Record<string, LevelCoeffEntry> =
    saved?.levelCoefficients && typeof saved.levelCoefficients === 'object'
      ? saved.levelCoefficients
      : {};

  if (saved && (saved.coefficientType === 'custom' || saved.coefficientType === 'auto')) {
    return {
      coefficientType: saved.coefficientType,
      customMaxScore: Number(saved.customMaxScore) > 0 ? Number(saved.customMaxScore) : 250,
      isCustomSavedForMonth: true,
      splitByLevel,
      levelCoefficients,
    };
  }
  return {
    coefficientType: fallbackSettings?.coefficientType === 'custom' ? 'custom' : 'auto',
    customMaxScore: Number(fallbackSettings?.customMaxScore) > 0 ? Number(fallbackSettings.customMaxScore) : 250,
    isCustomSavedForMonth: false,
    splitByLevel,
    levelCoefficients,
  };
}

function getLevelCoeffConfig(
  classCfg: ClassCoeffConfig,
  levelKey: string
): ClassCoeffConfig {
  const saved = classCfg.levelCoefficients?.[levelKey];
  if (saved && (saved.coefficientType === 'custom' || saved.coefficientType === 'auto')) {
    return {
      coefficientType: saved.coefficientType,
      customMaxScore: Number(saved.customMaxScore) > 0 ? Number(saved.customMaxScore) : 250,
      isCustomSavedForMonth: true,
    };
  }
  return {
    coefficientType: classCfg.coefficientType,
    customMaxScore: classCfg.customMaxScore,
    isCustomSavedForMonth: false,
  };
}

function computeClassCoeffValue(
  scoreRows: any[],
  cfg: ClassCoeffConfig
): { currentCoeff: number; maxTotalScore: number } {
  if (cfg.coefficientType === 'custom') {
    const coeff = (Number(cfg.customMaxScore) || 250) / 50;
    return { currentCoeff: coeff > 0 ? coeff : 1, maxTotalScore: 0 };
  }
  const validTotals = scoreRows
    .map((s) => parseFloat(s?.totalScore))
    .filter((n) => !isNaN(n) && isFinite(n));
  let maxTotalScore = validTotals.length > 0 ? Math.max(...validTotals) : 0;
  if (maxTotalScore <= 0) maxTotalScore = 50;
  const coeff = (maxTotalScore + 5) / 50;
  return { currentCoeff: coeff > 0 ? coeff : 1, maxTotalScore };
}



const COLORS = [
    { id: 'blue', value: '#3b82f6', label: 'ខៀវ' },
    { id: 'indigo', value: '#6366f1', label: 'ខៀវចាស់' },
    { id: 'purple', value: '#8b5cf6', label: 'ស្វាយ' },
    { id: 'pink', value: '#ec4899', label: 'ផ្កាឈូក' },
    { id: 'red', value: '#ef4444', label: 'ក្រហម' },
    { id: 'orange', value: '#f97316', label: 'ទឹកក្រូច' },
    { id: 'yellow', value: '#eab308', label: 'លឿង' },
    { id: 'green', value: '#22c55e', label: 'បៃតង' },
    { id: 'teal', value: '#14b8a6', label: 'ខៀវបៃតង' },
    { id: 'slate', value: '#64748b', label: 'ប្រផេះ' }
];

const ICONS = [
    { id: 'book', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, label: 'សៀវភៅ' },
    { id: 'monitor', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'កុំព្យូទ័រ' },
    { id: 'music', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>, label: 'តន្ត្រី' },
    { id: 'science', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>, label: 'វិទ្យាសាស្រ្ត' },
    { id: 'globe', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'សកលលោក' },
    { id: 'pen-tool', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>, label: 'គំនូរ' },
    { id: 'activity', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>, label: 'សកម្មភាព' },
    { id: 'language', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'ភាសា' },
    { id: 'calculator', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>, label: 'គណិតវិទ្យា' },
    { id: 'cpu', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>, label: 'បច្ចេកវិទ្យា' },
    { id: 'mic', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>, label: 'និយាយ' },
    { id: 'star', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, label: 'ពូកែ' },
    { id: 'award', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>, label: 'រង្វាន់' },
    { id: 'users', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, label: 'ក្រុម' },
    { id: 'sun', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, label: 'ព្រឹក' }
];


export default function ScoresPage() {
  const confirmDialog = useConfirm();
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [teacherProfileId, setTeacherProfileId] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [classMainSearchFilter, setClassMainSearchFilter] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]); // Global live students
  const [allTeachers, setAllTeachers] = useState<any[]>([]); // Global teachers
  const [scores, setScores] = useState<any[]>([]); // Snapshot score records for the selected month/class
  const [allScores, setAllScores] = useState<any[]>([]); // Global scores for computing progress
  const scoreTableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedClassIdsFilter, setSelectedClassIdsFilter] = useState<string[] | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scoreSelectedClassIdsFilter');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [classSearchFilter, setClassSearchFilter] = useState('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  useEffect(() => {
    if (selectedClassIdsFilter !== null) {
      localStorage.setItem('scoreSelectedClassIdsFilter', JSON.stringify(selectedClassIdsFilter));
    }
  }, [selectedClassIdsFilter]);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scoreSortConfig');
      if (saved) return JSON.parse(saved);
    }
    return { key: 'fullName', direction: 'asc' };
  });
  
  const [monthlyMonthDraft, setMonthlyMonthDraft] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedScoreMonth');
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    }
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedScoreMonth');
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    }
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  const [examMode, setExamMode] = useState<'monthly' | 'final'>('monthly');
  const [finalExamSessions, setFinalExamSessions] = useState<FinalExamSession[]>([]);
  const [selectedFinalExamId, setSelectedFinalExamId] = useState<string>('');
  const [isCreateFinalExamOpen, setIsCreateFinalExamOpen] = useState<boolean>(false);
  const [newFinalTitle, setNewFinalTitle] = useState<string>('');
  const [newFinalClassId, setNewFinalClassId] = useState<string>('');
  const [newFinalCourseKh, setNewFinalCourseKh] = useState<string>('ភាសាអង់គ្លេស');
  const [newFinalCourseEn, setNewFinalCourseEn] = useState<string>('English Course');
  const [newFinalLevel, setNewFinalLevel] = useState<string>('');
  const [newFinalDate, setNewFinalDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [newFinalAutoImport, setNewFinalAutoImport] = useState<boolean>(true);
  const [isCreatingFinalExam, setIsCreatingFinalExam] = useState<boolean>(false);

  useEffect(() => {
    if (scoreSortConfig) localStorage.setItem('scoreSortConfig', JSON.stringify(scoreSortConfig));
  }, [scoreSortConfig]);

  useEffect(() => {
    if (selectedMonth && !selectedMonth.startsWith('FINAL_')) {
      setMonthlyMonthDraft(selectedMonth);
      localStorage.setItem('selectedScoreMonth', selectedMonth);
    }
  }, [selectedMonth]);
  
  // Settings
  const [settings, setSettings] = useState<any>({
    maxSubjects: 1,
    gradeA: 90,
    gradeB: 80,
    gradeC: 70,
    gradeD: 60,
    gradeE: 50,
    coefficientType: 'auto',
    customMaxScore: 250
  });
  const [monthCoeffMap, setMonthCoeffMap] = useState<Record<string, any>>({});
  const [loadedCoeffMonth, setLoadedCoeffMonth] = useState<string>('');
  const [loadedScoresMonth, setLoadedScoresMonth] = useState<string>('');
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [newCustomColLabel, setNewCustomColLabel] = useState('');
  const [newCustomColMode, setNewCustomColMode] = useState<ScoreColumnInputMode>('number');
  const [isSavingColumns, setIsSavingColumns] = useState(false);
  const autoHydratedTraitsRef = useRef<Set<string>>(new Set());
  const [isSavingCoeff, setIsSavingCoeff] = useState(false);
  const [coeffTypeDraft, setCoeffTypeDraft] = useState<'auto' | 'custom'>('auto');
  const [customMaxDraft, setCustomMaxDraft] = useState<string>('250');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAdminDefaultColsOpen, setIsAdminDefaultColsOpen] = useState(false);
  const [isExtraDataModalOpen, setIsExtraDataModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMonthlyResultOpen, setIsMonthlyResultOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isHonorRollOpen, setIsHonorRollOpen] = useState(false);

  const handleSaveScorePrintSettings = async (
    patch: MonthlyResultBrandingConfig | CertificateBrandingConfig
  ) => {
    const nextSettings = { ...settings, ...patch };
    setSettings(nextSettings);
    await settingsService.add(nextSettings, 'scoreSettings');
  };

  const monthlyResultButton = (
    <button
      type="button"
      onClick={() => setIsMonthlyResultOpen(true)}
      style={{
        padding: '0.5rem 0.95rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
      }}
      title="ព្រីនលទ្ធផលប្រចាំខែ (ក្រដាស A4)"
    >
      <AppIcon name="printer" size={16} strokeWidth={2.2} />
      <span>លទ្ធផលប្រចាំខែ</span>
    </button>
  );

  const certificateButton = (
    <button
      type="button"
      onClick={() => setIsCertificateModalOpen(true)}
      style={{
        padding: '0.5rem 0.95rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'linear-gradient(135deg, #d97706, #b45309)',
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.28)',
      }}
      title="ព្រីនប័ណ្ណសរសើរ និងវិញ្ញាបនបត្រ (ខ្នាត A5 ក្នុង A4 បញ្ឈរ)"
    >
      <AppIcon name="award" size={16} strokeWidth={2.2} />
      <span>ប័ណ្ណសរសើរ &amp; វិញ្ញាបនបត្រ</span>
    </button>
  );

  const honorRollButton = (
    <button
      type="button"
      onClick={() => setIsHonorRollOpen(true)}
      style={{
        padding: '0.5rem 0.95rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
        border: '1px solid rgba(250, 204, 21, 0.55)',
        borderRadius: '8px',
        color: '#fef9c3',
        cursor: 'pointer',
        fontWeight: 700,
        boxShadow: '0 2px 10px rgba(30, 58, 138, 0.32)',
      }}
      title="ព្រីនតារាងកិត្តិយសប្រចាំខែ (Honor Roll A4)"
    >
      <AppIcon name="star" size={16} strokeWidth={2.2} />
      <span>តារាងកិត្តិយស</span>
    </button>
  );

  const guideButton = (
    <button
      type="button"
      onClick={() => setIsGuideOpen(true)}
      style={{
        padding: '0.5rem 0.95rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'rgba(245, 158, 11, 0.14)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '8px',
        color: '#d97706',
        cursor: 'pointer',
        fontWeight: 600,
      }}
      title="ការណែនាំអំពីការប្រើប្រាស់ផ្ទាំងបញ្ជីពិន្ទុ"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>ការណែនាំ</span>
    </button>
  );
  const [isSavingExtraData, setIsSavingExtraData] = useState(false);
  const [monthExtraData, setMonthExtraData] = useState<{
    monthKhmer: string;
    monthEnglish: string;
    issueDateKhmer: string;
    issueDateEnglish: string;
  }>({
    monthKhmer: '',
    monthEnglish: '',
    issueDateKhmer: '',
    issueDateEnglish: ''
  });

  const khmerMonthNames = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const englishMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const toKhmerNum = (num: number | string) => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)]);
  };

  const getDefaultMonthExtra = (monthStr: string) => {
    if (!monthStr) return { monthKhmer: '', monthEnglish: '', issueDateKhmer: '', issueDateEnglish: '' };
    const [yearStr, mStr] = monthStr.split('-');
    const mIndex = parseInt(mStr, 10) - 1;
    const yearNum = parseInt(yearStr, 10);
    
    const kmMonthName = khmerMonthNames[mIndex] || '';
    const engMonthName = englishMonthNames[mIndex] || '';
    
    const now = new Date();
    const day = now.getDate();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      monthKhmer: `ខែ${kmMonthName} ឆ្នាំ${toKhmerNum(yearNum)}`,
      monthEnglish: `${engMonthName} ${yearNum}`,
      issueDateKhmer: `ថ្ងៃទី${toKhmerNum(day)} ខែ${khmerMonthNames[currentMonthIndex]} ឆ្នាំ${toKhmerNum(currentYear)}`,
      issueDateEnglish: `${englishMonthNames[currentMonthIndex]} ${day}, ${currentYear}`
    };
  };

  useEffect(() => {
    if (!selectedMonth) return;
    const docId = `monthExtra_${selectedMonth}`;
    const unsub = settingsService.subscribeOne(docId, (data: any) => {
      if (data) {
        setMonthExtraData({
          monthKhmer: data.monthKhmer || '',
          monthEnglish: data.monthEnglish || '',
          issueDateKhmer: data.issueDateKhmer || '',
          issueDateEnglish: data.issueDateEnglish || ''
        });
      } else {
        setMonthExtraData(getDefaultMonthExtra(selectedMonth));
      }
    });
    return () => unsub();
  }, [selectedMonth]);

  const handleSaveExtraData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth) return;
    setIsSavingExtraData(true);
    try {
      const docId = `monthExtra_${selectedMonth}`;
      await settingsService.add(monthExtraData, docId);
      setIsExtraDataModalOpen(false);
      alert('បានរក្សាទុកទិន្នន័យបន្ថែមដោយជោគជ័យ!');
    } catch (err: any) {
      alert('Error saving extra data: ' + err.message);
    } finally {
      setIsSavingExtraData(false);
    }
  };
  const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);
  const closeClearDropdown = useCallback(() => setIsClearDropdownOpen(false), []);
  const closeClassFilter = useCallback(() => setIsClassFilterOpen(false), []);
  const closeColumnsDropdown = useCallback(() => setIsColumnsDropdownOpen(false), []);
  const clearPortal = usePortalMenuPosition({
    isOpen: isClearDropdownOpen,
    onClose: closeClearDropdown,
    minWidth: 230,
    maxPreferredHeight: 360,
    preferAlignRight: true,
  });
  const classFilterPortal = usePortalMenuPosition({
    isOpen: isClassFilterOpen,
    onClose: closeClassFilter,
    minWidth: 260,
    maxPreferredHeight: 380,
    preferAlignRight: true,
  });
  const columnsPortal = usePortalMenuPosition({
    isOpen: isColumnsDropdownOpen,
    onClose: closeColumnsDropdown,
    minWidth: 320,
    maxPreferredHeight: 470,
    preferAlignRight: true,
  });

  const activeClassCoeff = useMemo(
    () => getClassMonthCoeffConfig(selectedClassId, monthCoeffMap, settings),
    [selectedClassId, monthCoeffMap, settings]
  );

  const globalDefaultColumnsConfig: ClassScoreColumnsConfig = useMemo(
    () => sanitizeGlobalDefaultColumnsConfig(settings?.defaultColumnsConfig),
    [settings?.defaultColumnsConfig]
  );

  const activeColumnsConfig: ClassScoreColumnsConfig = useMemo(
    () =>
      resolveClassColumnsConfig(
        selectedClassId ? monthCoeffMap?.[selectedClassId] : null,
        globalDefaultColumnsConfig
      ),
    [selectedClassId, monthCoeffMap, globalDefaultColumnsConfig]
  );

  const checkboxSubjectColumns: ActiveScoreSubjectColumn[] = useMemo(
    () => getCheckboxSubjectColumns(activeColumnsConfig),
    [activeColumnsConfig]
  );

  const allAvailableSubjectColumns: ActiveScoreSubjectColumn[] = useMemo(
    () => getAllAvailableSubjectColumns(activeColumnsConfig),
    [activeColumnsConfig]
  );

  const activeSubjectColumns: ActiveScoreSubjectColumn[] = useMemo(
    () => getActiveSubjectColumns(activeColumnsConfig),
    [activeColumnsConfig]
  );

  const studentMasterMaps = useMemo(() => {
    const byId = new Map<string, any>();
    const byCode = new Map<string, any>();
    allStudents.forEach((st: any) => {
      if (st?.id) byId.set(String(st.id).trim(), st);
      if (st?.studentId) byCode.set(String(st.studentId).trim(), st);
    });
    return { byId, byCode };
  }, [allStudents]);

  const resolveScoreStudentMeta = useCallback(
    (s: any) => {
      const sid = String(s?.studentId || '').trim();
      const sCode = String(s?.studentIdCode || '').trim();
      const master =
        (sid && studentMasterMaps.byId.get(sid)) ||
        (sCode && studentMasterMaps.byCode.get(sCode)) ||
        (sid && studentMasterMaps.byCode.get(sid)) ||
        null;
      const masterLevel = String(master?.level || '').trim();
      const scoreLevel = String(s?.level || '').trim();
      const effectiveLevel = scoreLevel || masterLevel;
      const isLevelOverridden = Boolean(scoreLevel && scoreLevel !== masterLevel);
      const displayFullName = String(master?.fullName || s?.fullName || '').trim();
      const displayGender = String(master?.gender || s?.gender || '').trim();
      const displayStudentCode = String(master?.studentId || s?.studentIdCode || '').trim();
      return {
        master,
        masterLevel,
        scoreLevel,
        effectiveLevel,
        isLevelOverridden,
        displayFullName,
        displayGender,
        displayStudentCode,
      };
    },
    [studentMasterMaps]
  );

  const computedScores = useMemo(() => {
    const computeGroup = (groupRows: any[], coeffCfg: ClassCoeffConfig) => {
      const { currentCoeff, maxTotalScore } = computeClassCoeffValue(groupRows, coeffCfg);

      const mapped = groupRows.map((s) => {
        const total = parseFloat(s.totalScore) || 0;
        const avg = total / currentCoeff;

        const avgPercentage = (avg / 50) * 100;
        let grade = 'F';
        if (avgPercentage >= (settings.gradeA || 90)) grade = 'A';
        else if (avgPercentage >= (settings.gradeB || 80)) grade = 'B';
        else if (avgPercentage >= (settings.gradeC || 70)) grade = 'C';
        else if (avgPercentage >= (settings.gradeD || 60)) grade = 'D';
        else if (avgPercentage >= (settings.gradeE || 50)) grade = 'E';

        return {
          ...s,
          dynAverage: s.totalScore === '' || s.totalScore === undefined || s.totalScore === null ? '' : avg.toFixed(2),
          dynGrade: s.totalScore === '' || s.totalScore === undefined || s.totalScore === null ? '' : grade,
          dynRemarks: s.totalScore === '' || s.totalScore === undefined || s.totalScore === null ? '' : calculateRemarks(grade),
          avgNum: s.totalScore === '' || s.totalScore === undefined || s.totalScore === null ? -1 : avg,
        };
      });

      const scored = [...mapped].filter((s) => s.avgNum !== -1);
      scored.sort((a, b) => b.avgNum - a.avgNum);

      let currentRank = 1;
      let currentAvg = -1;
      const ranks: Record<string, number> = {};
      for (let i = 0; i < scored.length; i++) {
        const s = scored[i];
        const avgKey = Number(s.avgNum.toFixed(6));
        if (avgKey !== currentAvg) {
          currentRank = i + 1;
          currentAvg = avgKey;
        }
        ranks[s.id as string] = currentRank;
      }

      return {
        currentCoeff,
        maxTotalScore,
        rows: mapped.map((s) => ({
          ...s,
          dynRank: ranks[s.id] || '',
        })),
      };
    };

    const enriched = scores.map((s) => {
      const meta = resolveScoreStudentMeta(s);
      return {
        ...s,
        effectiveLevel: meta.effectiveLevel,
        masterLevel: meta.masterLevel,
        isLevelOverridden: meta.isLevelOverridden,
        displayFullName: meta.displayFullName,
        displayGender: meta.displayGender,
        displayStudentCode: meta.displayStudentCode,
      };
    });

    const uniqueLevels = Array.from(
      new Set(enriched.map((r) => r.effectiveLevel).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

    const isSplitByLevel = Boolean(activeClassCoeff.splitByLevel);

    if (!isSplitByLevel) {
      const single = computeGroup(enriched, activeClassCoeff);
      return {
        currentCoeff: single.currentCoeff,
        maxTotalScore: single.maxTotalScore,
        isSplitByLevel: false,
        uniqueLevels,
        groups: [
          {
            levelKey: '__ALL__',
            levelLabel: 'ទាំងអស់',
            currentCoeff: single.currentCoeff,
            maxTotalScore: single.maxTotalScore,
            isCustomCoeff: Boolean(activeClassCoeff.isCustomSavedForMonth),
            rows: single.rows,
          },
        ],
        rows: single.rows,
      };
    }

    // Split mode: group rows by effectiveLevel (unassigned placed last) and compute independently
    const groupedMap = new Map<string, any[]>();
    enriched.forEach((row) => {
      const key = row.effectiveLevel || UNASSIGNED_LEVEL_LABEL;
      const bucket = groupedMap.get(key) || [];
      bucket.push(row);
      groupedMap.set(key, bucket);
    });

    const sortedKeys = Array.from(groupedMap.keys()).sort((a, b) => {
      if (a === UNASSIGNED_LEVEL_LABEL) return 1;
      if (b === UNASSIGNED_LEVEL_LABEL) return -1;
      return a.localeCompare(b, 'en', { numeric: true });
    });

    const groups = sortedKeys.map((levelKey) => {
      const groupRows = groupedMap.get(levelKey) || [];
      const levelCoeffCfg = getLevelCoeffConfig(activeClassCoeff, levelKey);
      const res = computeGroup(groupRows, levelCoeffCfg);
      return {
        levelKey,
        levelLabel: levelKey,
        currentCoeff: res.currentCoeff,
        maxTotalScore: res.maxTotalScore,
        isCustomCoeff: Boolean(levelCoeffCfg.isCustomSavedForMonth),
        rows: res.rows,
      };
    });

    const allRows = groups.flatMap((g) => g.rows);
    const wholeClassSummary = computeClassCoeffValue(enriched, activeClassCoeff);
    const safeGroups =
      groups.length > 0
        ? groups
        : [
            {
              levelKey: '__ALL__',
              levelLabel: 'ទាំងអស់',
              currentCoeff: wholeClassSummary.currentCoeff,
              maxTotalScore: wholeClassSummary.maxTotalScore,
              isCustomCoeff: Boolean(activeClassCoeff.isCustomSavedForMonth),
              rows: [],
            },
          ];

    return {
      currentCoeff: wholeClassSummary.currentCoeff,
      maxTotalScore: wholeClassSummary.maxTotalScore,
      isSplitByLevel: true,
      uniqueLevels,
      groups: safeGroups,
      rows: allRows,
    };
  }, [scores, activeClassCoeff, settings, resolveScoreStudentMeta]);

  const [isCoeffModalOpen, setIsCoeffModalOpen] = useState(false);
  const [coeffTargetLevel, setCoeffTargetLevel] = useState<string | null>(null);
  const [isTogglingSplit, setIsTogglingSplit] = useState(false);
  const [isAssignLevelOpen, setIsAssignLevelOpen] = useState(false);
  const [assignInitialLevel, setAssignInitialLevel] = useState<string>('');
  const [assignInitialScoreIds, setAssignInitialScoreIds] = useState<string[]>([]);

  const suggestedLevelsForModal = useMemo(() => {
    const set = new Set<string>();
    computedScores.uniqueLevels.forEach((l) => set.add(l));
    const cls = classes.find((c) => c.id === selectedClassId);
    if (cls && Array.isArray(cls.books)) {
      cls.books.forEach((b: any) => {
        const lvl = String(b?.level || b?.levelId || '').trim();
        if (lvl) set.add(lvl);
      });
    }
    allStudents.forEach((st: any) => {
      const lvl = String(st?.level || '').trim();
      if (lvl) set.add(lvl);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }, [computedScores.uniqueLevels, classes, selectedClassId, allStudents]);

  const assignableStudents: AssignableScoreStudent[] = useMemo(() => {
    return computedScores.rows.map((r: any) => ({
      scoreId: r.id,
      studentIdCode: r.displayStudentCode || r.studentIdCode || '',
      fullName: r.displayFullName || r.fullName || '',
      gender: r.displayGender || r.gender || '',
      effectiveLevel: r.effectiveLevel || '',
      masterLevel: r.masterLevel || '',
      isLevelOverridden: Boolean(r.isLevelOverridden),
    }));
  }, [computedScores.rows]);

  useEffect(() => {
    if (
      !selectedClassId ||
      scores.length === 0 ||
      loadedCoeffMonth !== selectedMonth ||
      loadedScoresMonth !== selectedMonth
    ) {
      return;
    }
    const timer = setTimeout(() => {
      const updates: Promise<void>[] = [];
      scores.forEach(s => {
        const computed = computedScores.rows.find(r => r.id === s.id);
        if (computed) {
          let needsUpdate = false;
          const toUpdate: any = {};
          if (s.average !== computed.dynAverage) { toUpdate.average = computed.dynAverage; needsUpdate = true; }
          if (s.grade !== computed.dynGrade) { toUpdate.grade = computed.dynGrade; needsUpdate = true; }
          if (s.remarks !== computed.dynRemarks) { toUpdate.remarks = computed.dynRemarks; needsUpdate = true; }
          if (s.rank !== computed.dynRank?.toString()) { toUpdate.rank = computed.dynRank?.toString(); needsUpdate = true; }
          
          if (needsUpdate && s.id) {
            updates.push(scoreService.update(s.id, toUpdate));
          }
        }
      });
      if (updates.length > 0) Promise.all(updates);
    }, 2000);
    return () => clearTimeout(timer);
  }, [computedScores, scores, selectedClassId, loadedCoeffMonth, loadedScoresMonth, selectedMonth]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const parseCSVLine = (str: string) => {
        let ret = [], keep = false, col = "";
        for(let i=0; i<str.length; i++) {
          if(str[i] === '"') keep = !keep;
          else if(str[i] === ',' && !keep) { ret.push(col.trim()); col = ""; }
          else col += str[i];
        }
        ret.push(col.trim());
        return ret;
      };

      const rows = text.split('\n').map(parseCSVLine);
      if (rows.length < 2) return;

      const headers = rows[0];
      const idIndex = headers.findIndex(h => h.includes('អត្តលេខ'));
      if (idIndex === -1) {
        alert('រកមិនឃើញជួរឈរ អត្តលេខ នៅក្នុងឯកសារ Excel ទេ!');
        return;
      }

      const subjectHeaderIndexes = activeSubjectColumns.map((col) => {
        const keyLower = col.key.toLowerCase();
        const labelLower = col.label.toLowerCase();
        const idx = headers.findIndex((h) => {
          const hl = h.trim().toLowerCase();
          return hl === labelLower || hl === keyLower || hl.includes(labelLower);
        });
        return { col, idx };
      });

      const traitHeaderIndexes = TRAIT_EVALUATION_COLUMNS.map((t) => {
        const idx = headers.findIndex((h) => {
          const hl = h.trim().toLowerCase();
          return hl.includes(t.labelEn.toLowerCase()) || h.includes(t.labelKh) || hl === t.key;
        });
        return { trait: t, idx };
      });

      let updatedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const studentId = row[idIndex];
        if (!studentId) continue;

        const existingScore = scores.find(s => s.studentIdCode === studentId);
        if (existingScore) {
          const updatedScore: any = {
            ...existingScore,
            evalValues: { ...(existingScore.evalValues || {}) },
            traitsEdited: { ...(existingScore.traitsEdited || {}) },
          };

          subjectHeaderIndexes.forEach(({ col, idx }) => {
            if (idx === -1 || row[idx] === undefined) return;
            const rawVal = row[idx];
            if (col.inputMode === 'evaluation') {
              updatedScore.evalValues[col.key] = normalizeEvaluationValue(rawVal);
            } else {
              updatedScore[col.key] = rawVal;
            }
          });

          traitHeaderIndexes.forEach(({ trait, idx }) => {
            if (idx === -1 || row[idx] === undefined) return;
            const norm = normalizeEvaluationValue(row[idx]);
            if (norm) {
              updatedScore[trait.key] = norm;
              updatedScore.traitsEdited[trait.key] = true;
            }
          });

          const { totalScore } = computeNumericTotalForColumns(updatedScore, activeSubjectColumns);
          updatedScore.totalScore = totalScore;

          await scoreService.update(updatedScore.id, updatedScore);
          updatedCount++;
        }
      }
      
      alert(`បានបញ្ចូលពិន្ទុជោគជ័យចំនួន ${updatedCount} នាក់!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };



  const handleClearColumn = async (
    columnKey: string,
    columnName: string,
    columnKind: 'number' | 'evaluation' | 'trait' = 'number'
  ) => {
    if (!(await confirmDialog(`តើអ្នកពិតជាចង់លុបទិន្នន័យ ${columnName} ទាំងអស់មែនទេ?`))) return;
    setIsClearDropdownOpen(false);

    if (columnKind === 'trait') {
      const traitKey = columnKey as TraitFieldKey;
      const updatedScores = scores.map((s) => ({
        ...s,
        [traitKey]: '',
        traitsEdited: { ...(s.traitsEdited || {}), [traitKey]: true },
      }));
      setScores(updatedScores);
      await Promise.all(
        updatedScores.map((s) =>
          scoreService.update(s.id, {
            [traitKey]: '',
            traitsEdited: s.traitsEdited,
          })
        )
      );
      return;
    }

    if (columnKind === 'evaluation') {
      const updatedScores = scores.map((s) => ({
        ...s,
        evalValues: { ...(s.evalValues || {}), [columnKey]: '' },
      }));
      setScores(updatedScores);
      await Promise.all(
        updatedScores.map((s) =>
          scoreService.update(s.id, { evalValues: s.evalValues })
        )
      );
      return;
    }

    const draftRows = scores.map((s) => {
      const currentRec = { ...s, [columnKey]: '' };
      const { totalScore } = computeNumericTotalForColumns(currentRec, activeSubjectColumns);
      currentRec.totalScore = totalScore;
      return currentRec;
    });

    const { currentCoeff } = computeClassCoeffValue(draftRows, activeClassCoeff);
    const updatedScores = draftRows.map(currentRec => {
      if (currentRec.totalScore !== '') {
        const avgNum = parseFloat(currentRec.totalScore) / currentCoeff;
        currentRec.average = avgNum.toFixed(2).replace(/\.00$/, '');
        const g = calculateAutoGrade(avgNum);
        currentRec.grade = g;
        currentRec.remarks = calculateRemarks(g);
      } else {
        currentRec.totalScore = '';
        currentRec.average = '';
        currentRec.grade = '';
        currentRec.remarks = '';
      }
      return currentRec;
    });

    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.update(s.id, s)));
  };

  const handleClearAllScores = async () => {
    if (!(await confirmDialog(`តើអ្នកពិតជាចង់លុបពិន្ទុគ្រប់ជួរឈរទាំងអស់មែនទេ? (ឈ្មោះសិស្ស និងជួរឈរវាយតម្លៃសីលធម៌ ៣ នឹងត្រូវរក្សាទុក)`))) return;
    setIsClearDropdownOpen(false);

    const updatedScores = scores.map(s => {
      const next: any = {
        ...s,
        quiz: '',
        exercise: '',
        speaking: '',
        homework: '',
        test: '',
        evalValues: {},
        totalScore: '',
        average: '',
        grade: '',
        remarks: '',
        rank: ''
      };
      allAvailableSubjectColumns.forEach((col) => {
        next[col.key] = '';
      });
      return next;
    });

    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.update(s.id, s)));
  };

  const handleClearAll = async () => {
    if (!(await confirmDialog(`តើអ្នកពិតជាចង់លុបទិន្នន័យបញ្ជីឈ្មោះទាំងអស់ក្នុងខែនេះមែនទេ?`))) return;
    setIsClearDropdownOpen(false);
    await Promise.all(scores.map(s => scoreService.delete(s.id)));
    setScores([]);
  };

  useEffect(() => { 
    setRole(localStorage.getItem('userRole') || ''); 
    setUserId(localStorage.getItem('userId') || '');
    setUserName(localStorage.getItem('userName') || '');
    setTeacherProfileId(localStorage.getItem('teacherProfileId') || '');
    
    // Fetch Settings
    const unsubSettings = settingsService.subscribeOne('scoreSettings', (data) => {
      if (data) {
        setSettings(data);
      }
    });

    const unsubClasses = classService.subscribeAll((data: any[]) => {
      const activeClasses = data.filter((c: any) => c.status !== 'បានបញ្ចប់');
      setClasses(activeClasses);
    });

    const unsubTeachers = teacherService.subscribeAll((data: any[]) => { setAllTeachers(data); });
    const unsubStudents = studentService.subscribeAll((data: any[]) => {
      setAllStudents(data);
    });
    const unsubFinalCatalog = scoreCoefficientService.subscribeOne('__finalExamCatalog', (doc: any) => {
      const rawSessions = doc?.sessions && typeof doc.sessions === 'object' ? doc.sessions : {};
      const parsed: FinalExamSession[] = Object.entries(rawSessions)
        .map(([k, v]: [string, any]) => ({
          id: String(v?.id || k),
          title: String(v?.title || 'ការប្រឡងបញ្ចប់វគ្គសិក្សា'),
          classId: v?.classId ? String(v.classId) : '',
          courseNameKh: v?.courseNameKh ? String(v.courseNameKh) : '',
          courseNameEn: v?.courseNameEn ? String(v.courseNameEn) : '',
          levelName: v?.levelName ? String(v.levelName) : '',
          examDate: v?.examDate ? String(v.examDate) : '',
          createdByUid: v?.createdByUid ? String(v.createdByUid) : '',
          createdByName: v?.createdByName ? String(v.createdByName) : '',
          createdAt: v?.createdAt ? String(v.createdAt) : '',
        }))
        .sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
      setFinalExamSessions(parsed);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubStudents();
      unsubTeachers();
      unsubFinalCatalog();
    };
  }, []);

  // Subscribe to selected month's Scores & Per-Class Coefficients on RTDB
  useEffect(() => {
    if (!selectedMonth) {
      setAllScores([]);
      setMonthCoeffMap({});
      setLoadedScoresMonth('');
      setLoadedCoeffMonth('');
      return;
    }
    const activeMonth = selectedMonth;
    const unsubMonthScores = scoreService.subscribeByQuery('month', '==', activeMonth, (data: any[]) => {
      setAllScores(data);
      setLoadedScoresMonth(activeMonth);
    });
    const unsubMonthCoeffs = scoreCoefficientService.subscribeOne(activeMonth, (doc: any) => {
      setMonthCoeffMap(doc?.classes && typeof doc.classes === 'object' ? doc.classes : {});
      setLoadedCoeffMonth(activeMonth);
    });

    return () => {
      unsubMonthScores();
      unsubMonthCoeffs();
    };
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedClassId) {
      const filteredScores = allScores.filter((s: any) => s.classId === selectedClassId && s.month === selectedMonth);
      setScores(filteredScores);
    } else {
      setScores([]);
    }
  }, [selectedClassId, selectedMonth, allScores]);

  // Derived filtered classes
  const displayClasses = role === 'admin' 
    ? classes 
    : classes.filter(c => c.teacherId === teacherProfileId || c.teacherId === userId || c.teacherName === userName);

  const visibleFinalExamSessions = useMemo(() => {
    if (role === 'admin') return finalExamSessions;
    const myClassIds = new Set(displayClasses.map((c) => c.id));
    return finalExamSessions.filter(
      (s) =>
        !s.classId ||
        myClassIds.has(s.classId) ||
        (userId && s.createdByUid === userId) ||
        (teacherProfileId && s.createdByUid === teacherProfileId)
    );
  }, [finalExamSessions, role, displayClasses, userId, teacherProfileId]);

  const activeFinalExam = useMemo(() => {
    const targetId = selectedMonth.startsWith('FINAL_') ? selectedMonth : selectedFinalExamId;
    return finalExamSessions.find((s) => s.id === targetId) || null;
  }, [finalExamSessions, selectedMonth, selectedFinalExamId]);

  const fetchLatestPriorTraitsForClass = useCallback(
    async (classId: string, targetMonth: string) => {
      const candidates = isStandardYearMonth(targetMonth)
        ? getPreviousMonthCandidates(targetMonth, 6)
        : [
            ...(isStandardYearMonth(monthlyMonthDraft) ? [monthlyMonthDraft] : []),
            ...getPreviousMonthCandidates(monthlyMonthDraft, 4),
          ];

      const mergedByStudentId = new Map<string, Partial<Record<TraitFieldKey, string>>>();
      const mergedByStudentCode = new Map<string, Partial<Record<TraitFieldKey, string>>>();
      let primarySourceMonth = '';

      for (const candMonth of candidates) {
        try {
          const monthRows = await scoreService.getByQuery('month', '==', candMonth);
          const classRows = monthRows.filter((r: any) => r?.classId === classId);
          if (classRows.length === 0) continue;

          const lookup = buildStudentTraitLookup(classRows);
          if (lookup.byStudentId.size === 0 && lookup.byStudentCode.size === 0) continue;

          if (!primarySourceMonth) primarySourceMonth = candMonth;

          lookup.byStudentId.forEach((snap, sid) => {
            const cur = mergedByStudentId.get(sid) || {};
            mergedByStudentId.set(sid, {
              morality: cur.morality || snap.morality,
              punctuality: cur.punctuality || snap.punctuality,
              hygiene: cur.hygiene || snap.hygiene,
            });
          });
          lookup.byStudentCode.forEach((snap, code) => {
            const cur = mergedByStudentCode.get(code) || {};
            mergedByStudentCode.set(code, {
              morality: cur.morality || snap.morality,
              punctuality: cur.punctuality || snap.punctuality,
              hygiene: cur.hygiene || snap.hygiene,
            });
          });

          if (mergedByStudentId.size > 0 || mergedByStudentCode.size > 0) {
            break;
          }
        } catch (err) {
          console.warn('Could not query previous month traits for', candMonth, err);
        }
      }

      return {
        lookup: { byStudentId: mergedByStudentId, byStudentCode: mergedByStudentCode },
        sourceMonth: primarySourceMonth,
      };
    },
    [monthlyMonthDraft]
  );

  const openCreateFinalExamModal = () => {
    const defaultCls = selectedClassId
      ? classes.find((c) => c.id === selectedClassId)
      : displayClasses[0];
    const firstBookLevel =
      defaultCls && Array.isArray(defaultCls.books) && defaultCls.books[0]?.level
        ? String(defaultCls.books[0].level)
        : '';
    setNewFinalClassId(defaultCls?.id || '');
    setNewFinalLevel(firstBookLevel);
    setNewFinalCourseKh('ភាសាអង់គ្លេស');
    setNewFinalCourseEn('English Course');
    setNewFinalTitle(
      defaultCls
        ? `ប្រឡងបញ្ចប់វគ្គ (${defaultCls.classCode || defaultCls.className})`
        : 'ការប្រឡងបញ្ចប់វគ្គសិក្សា'
    );
    setNewFinalDate(new Date().toISOString().slice(0, 10));
    setNewFinalAutoImport(true);
    setIsCreateFinalExamOpen(true);
  };

  const handleCreateFinalExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newFinalTitle.trim();
    if (!cleanTitle) return;
    setIsCreatingFinalExam(true);
    try {
      const sessionId = `FINAL_${Date.now()}`;
      const newSession: FinalExamSession = {
        id: sessionId,
        title: cleanTitle,
        classId: newFinalClassId || '',
        courseNameKh: newFinalCourseKh.trim() || 'ភាសាអង់គ្លេស',
        courseNameEn: newFinalCourseEn.trim() || 'English Course',
        levelName: newFinalLevel.trim(),
        examDate: newFinalDate || new Date().toISOString().slice(0, 10),
        createdByUid: teacherProfileId || userId || '',
        createdByName: userName || role || '',
        createdAt: new Date().toISOString(),
      };

      await scoreCoefficientService.update('__finalExamCatalog', {
        [`sessions/${sessionId}`]: newSession,
        updatedAt: new Date().toISOString(),
      });

      setExamMode('final');
      setSelectedFinalExamId(sessionId);
      setSelectedMonth(sessionId);

      if (newFinalClassId) {
        const targetCls = classes.find((c) => c.id === newFinalClassId);
        if (targetCls && newFinalAutoImport) {
          const classStudentIds =
            targetCls.studentIds ||
            (targetCls.studentsData ? targetCls.studentsData.map((s: any) => s.id) : []);
          const classStudents = allStudents.filter(
            (s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន'
          );
          const { lookup: prevTraitLookup, sourceMonth: prevTraitMonth } =
            await fetchLatestPriorTraitsForClass(targetCls.id, sessionId);
          await Promise.all(
            classStudents.map((student: any) => {
              const prevSnap = findStudentTraitSnapshot(prevTraitLookup, student.id, student.studentId);
              return scoreService.add({
                classId: targetCls.id,
                studentId: student.id,
                month: sessionId,
                studentIdCode: student.studentId || '',
                fullName: student.fullName || '',
                gender: student.gender || '',
                level: newFinalLevel.trim() || student.level || '',
                morality: prevSnap?.morality || '',
                punctuality: prevSnap?.punctuality || '',
                hygiene: prevSnap?.hygiene || '',
                ...(prevSnap && prevTraitMonth ? { traitsCopiedFrom: prevTraitMonth } : {}),
                quiz: '',
                exercise: '',
                speaking: '',
                homework: '',
                test: '',
                totalScore: '',
                average: '',
                rank: '',
                grade: '',
                remarks: '',
              });
            })
          );
        }
        setSelectedClassId(newFinalClassId);
      }

      setIsCreateFinalExamOpen(false);
    } catch (err: any) {
      console.error('Failed creating final exam session:', err);
      alert('មានបញ្ហាក្នុងការបង្កើតការប្រឡងបញ្ចប់វគ្គ៖ ' + (err?.message || ''));
    } finally {
      setIsCreatingFinalExam(false);
    }
  };

  const handleSwitchExamMode = (nextMode: 'monthly' | 'final') => {
    setExamMode(nextMode);
    if (nextMode === 'monthly') {
      setSelectedMonth(monthlyMonthDraft);
      return;
    }
    const targetSession =
      visibleFinalExamSessions.find((s) => s.id === selectedFinalExamId) ||
      visibleFinalExamSessions.find((s) => selectedClassId && s.classId === selectedClassId) ||
      visibleFinalExamSessions[0];
    if (targetSession) {
      setSelectedFinalExamId(targetSession.id);
      setSelectedMonth(targetSession.id);
    } else {
      openCreateFinalExamModal();
    }
  };

  const examSessionSelectorBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.16rem',
          gap: '0.16rem',
        }}
      >
        <button
          type="button"
          onClick={() => handleSwitchExamMode('monthly')}
          style={{
            padding: '0.34rem 0.65rem',
            borderRadius: '6px',
            border: 'none',
            background: examMode === 'monthly' ? 'var(--primary-color, #2563eb)' : 'transparent',
            color: examMode === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ប្រឡងប្រចាំខែ
        </button>
        <button
          type="button"
          onClick={() => handleSwitchExamMode('final')}
          style={{
            padding: '0.34rem 0.65rem',
            borderRadius: '6px',
            border: 'none',
            background: examMode === 'final' ? '#7c3aed' : 'transparent',
            color: examMode === 'final' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ប្រឡងបញ្ចប់វគ្គ
        </button>
      </div>

      {examMode === 'monthly' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--card-bg)', padding: '0.45rem 0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
          <input
            type="month"
            value={selectedMonth.startsWith('FINAL_') ? monthlyMonthDraft : selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '0.96rem' }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <select
            value={selectedMonth.startsWith('FINAL_') ? selectedMonth : selectedFinalExamId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedFinalExamId(id);
              setSelectedMonth(id);
              const found = finalExamSessions.find((s) => s.id === id);
              if (found?.classId && !selectedClassId) {
                setSelectedClassId(found.classId);
              }
            }}
            style={{
              padding: '0.46rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid rgba(124, 58, 237, 0.45)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              outline: 'none',
              maxWidth: '280px',
            }}
          >
            {visibleFinalExamSessions.length === 0 ? (
              <option value="">មិនទាន់មានវគ្គប្រឡងបញ្ចប់ទេ</option>
            ) : (
              visibleFinalExamSessions.map((sess) => {
                const clsObj = classes.find((c) => c.id === sess.classId);
                const clsTag = clsObj ? `${clsObj.classCode || clsObj.className} • ` : '';
                return (
                  <option key={sess.id} value={sess.id}>
                    {clsTag}{sess.title}{sess.examDate ? ` (${sess.examDate})` : ''}
                  </option>
                );
              })
            )}
          </select>
          <button
            type="button"
            onClick={openCreateFinalExamModal}
            style={{
              padding: '0.46rem 0.78rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.32rem',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.28)',
              whiteSpace: 'nowrap',
            }}
            title="បង្កើតការបញ្ចូលពិន្ទុដោយឡែកសម្រាប់ប្រឡងបញ្ចប់វគ្គសិក្សា"
          >
            <AppIcon name="plus" size={15} strokeWidth={2.4} />
            <span>បង្កើតប្រឡងបញ្ចប់វគ្គ</span>
          </button>
        </div>
      )}
    </div>
  );

    const calculateAutoGrade = (average: number) => {
    const avgPercentage = (average / 50) * 100;
    if (avgPercentage >= (settings.gradeA || 90)) return 'A';
    if (avgPercentage >= (settings.gradeB || 80)) return 'B';
    if (avgPercentage >= (settings.gradeC || 70)) return 'C';
    if (avgPercentage >= (settings.gradeD || 60)) return 'D';
    if (avgPercentage >= (settings.gradeE || 50)) return 'E';
    return 'F';
  };

    function calculateRemarks(grade: string) {
    switch (grade) {
      case 'A': return 'ល្អប្រសើរ';
      case 'B': return 'ល្អ';
      case 'C': return 'ល្អបង្គួរ';
      case 'D': return 'មធ្យម';
      case 'E': return 'មធ្យម';
      case 'F': return 'ខ្សោយ';
      default: return '';
    }
  };
const handleScoreChange = async (scoreRec: any, field: string, value: string) => {
    const baseRecord = scores.find((s) => s.id === scoreRec.id) || scoreRec;
    const updatedScore = { ...baseRecord, [field]: value };

    // Resolve the cohort (either this student's level group when split-by-level is ON, or full class)
    const getCohortForCalc = (nextAllRows: any[]) => {
      if (!activeClassCoeff.splitByLevel) {
        return { cohortRows: nextAllRows, coeffCfg: activeClassCoeff };
      }
      const targetLevelKey = resolveScoreStudentMeta(updatedScore).effectiveLevel || UNASSIGNED_LEVEL_LABEL;
      const cohortRows = nextAllRows.filter(
        (r) => (resolveScoreStudentMeta(r).effectiveLevel || UNASSIGNED_LEVEL_LABEL) === targetLevelKey
      );
      return { cohortRows, coeffCfg: getLevelCoeffConfig(activeClassCoeff, targetLevelKey) };
    };
    
    // Auto calculate if an active numeric subject column changes
    const activeNumericKeys = activeSubjectColumns
      .filter((col) => col.inputMode === 'number')
      .map((col) => col.key);

    if (activeNumericKeys.includes(field)) {
      const { totalScore, hasNumericValue } = computeNumericTotalForColumns(
        updatedScore,
        activeSubjectColumns
      );

      if (hasNumericValue) {
        updatedScore.totalScore = totalScore;
        const nextRows = scores.map((s) => (s.id === updatedScore.id ? updatedScore : s));
        const { cohortRows, coeffCfg } = getCohortForCalc(nextRows);
        const { currentCoeff } = computeClassCoeffValue(cohortRows, coeffCfg);
        const avgNum = parseFloat(totalScore) / currentCoeff;
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.totalScore = '';
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    // Auto Calculate Average & Grade if totalScore changes manually
    if (field === 'totalScore') {
      const totalNum = parseFloat(value);
      if (!isNaN(totalNum)) {
        const nextRows = scores.map((s) => (s.id === updatedScore.id ? updatedScore : s));
        const { cohortRows, coeffCfg } = getCohortForCalc(nextRows);
        const { currentCoeff } = computeClassCoeffValue(cohortRows, coeffCfg);
        const avgNum = totalNum / currentCoeff;
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    if (updatedScore.id) {
      await scoreService.update(updatedScore.id, updatedScore);
    }
  };

  const handleSubjectEvalChange = async (scoreRec: any, colKey: string, value: string) => {
    const baseRecord = scores.find((s) => s.id === scoreRec.id) || scoreRec;
    if (!baseRecord?.id) return;
    const normVal = normalizeEvaluationValue(value);
    const nextEvalValues = { ...(baseRecord.evalValues || {}), [colKey]: normVal };
    setScores((prev) =>
      prev.map((s) => (s.id === baseRecord.id ? { ...s, evalValues: nextEvalValues } : s))
    );
    await scoreService.update(baseRecord.id, { evalValues: nextEvalValues });
  };

  const handleTraitChange = async (scoreRec: any, traitKey: TraitFieldKey, value: string) => {
    const baseRecord = scores.find((s) => s.id === scoreRec.id) || scoreRec;
    if (!baseRecord?.id) return;
    const normVal = normalizeEvaluationValue(value);
    const nextTraitsEdited = { ...(baseRecord.traitsEdited || {}), [traitKey]: true };

    setScores((prev) =>
      prev.map((s) =>
        s.id === baseRecord.id
          ? { ...s, [traitKey]: normVal, traitsEdited: nextTraitsEdited }
          : s
      )
    );

    await scoreService.update(baseRecord.id, {
      [traitKey]: normVal,
      traitsEdited: nextTraitsEdited,
    });

    // Forward-copy immediately to next month if next month's row already exists & hasn't been manually edited
    if (isStandardYearMonth(selectedMonth) && selectedClassId) {
      const nextMonth = shiftYearMonth(selectedMonth, 1);
      if (nextMonth) {
        try {
          const nextRows = await scoreService.getByQuery('month', '==', nextMonth);
          const sid = String(baseRecord.studentId || '').trim().toLowerCase();
          const code = String(baseRecord.studentIdCode || '').trim().toLowerCase();
          const nextMatch = nextRows.find((r: any) => {
            if (r?.classId !== selectedClassId) return false;
            const rSid = String(r?.studentId || '').trim().toLowerCase();
            const rCode = String(r?.studentIdCode || '').trim().toLowerCase();
            return (sid && rSid === sid) || (code && rCode === code);
          });
          if (nextMatch?.id && !nextMatch?.traitsEdited?.[traitKey]) {
            await scoreService.update(nextMatch.id, {
              [traitKey]: normVal,
              traitsCopiedFrom: selectedMonth,
            });
          }
        } catch (err) {
          console.warn('Could not forward-copy trait to next month:', err);
        }
      }
    }
  };

  // Clear hydration cache whenever class or month switches so updates made in a prior month always sync forward automatically
  useEffect(() => {
    autoHydratedTraitsRef.current.clear();
  }, [selectedClassId, selectedMonth]);

  // Auto-copy Morality, Punctuality, Hygiene from previous month into any unedited blank cells for the active month
  useEffect(() => {
    if (
      !selectedClassId ||
      !isStandardYearMonth(selectedMonth) ||
      loadedScoresMonth !== selectedMonth ||
      scores.length === 0
    ) {
      return;
    }

    const hydrateKey = `${selectedClassId}::${selectedMonth}::${scores.length}`;
    if (autoHydratedTraitsRef.current.has(hydrateKey)) return;

    const rowsNeedingTraits = scores.filter((row) =>
      TRAIT_EVALUATION_COLUMNS.some(
        (t) => !normalizeEvaluationValue(row?.[t.key]) && !row?.traitsEdited?.[t.key]
      )
    );
    if (rowsNeedingTraits.length === 0) {
      autoHydratedTraitsRef.current.add(hydrateKey);
      return;
    }

    let cancelled = false;
    autoHydratedTraitsRef.current.add(hydrateKey);

    (async () => {
      const { lookup, sourceMonth } = await fetchLatestPriorTraitsForClass(
        selectedClassId,
        selectedMonth
      );
      if (cancelled || !sourceMonth) return;

      const patches: Array<{ id: string; patch: Record<string, any> }> = [];
      for (const row of rowsNeedingTraits) {
        if (!row?.id) continue;
        const prevSnap = findStudentTraitSnapshot(lookup, row.studentId, row.studentIdCode);
        if (!prevSnap) continue;
        const patch: Record<string, any> = {};
        for (const t of TRAIT_EVALUATION_COLUMNS) {
          if (
            !normalizeEvaluationValue(row?.[t.key]) &&
            !row?.traitsEdited?.[t.key] &&
            prevSnap[t.key]
          ) {
            patch[t.key] = prevSnap[t.key];
          }
        }
        if (Object.keys(patch).length > 0) {
          patch.traitsCopiedFrom = sourceMonth;
          patches.push({ id: row.id, patch });
        }
      }

      if (cancelled || patches.length === 0) return;

      const patchMap = new Map(patches.map((p) => [p.id, p.patch]));
      setScores((prev) =>
        prev.map((row) =>
          patchMap.has(row.id) ? { ...row, ...patchMap.get(row.id) } : row
        )
      );
      await Promise.all(patches.map((p) => scoreService.update(p.id, p.patch)));
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedMonth, loadedScoresMonth, scores, fetchLatestPriorTraitsForClass]);

  const persistClassColumnsConfig = async (
    nextConfig: ClassScoreColumnsConfig,
    shouldRecalcTotals = true
  ) => {
    if (!selectedClassId || !selectedMonth) return;
    const payload = {
      enabledKeys: nextConfig.enabledKeys,
      columnModes: nextConfig.columnModes,
      customColumns: nextConfig.customColumns,
      hasExplicitEmptyEnabled: nextConfig.enabledKeys.length === 0,
    };

    const existingClassEntry = monthCoeffMap?.[selectedClassId] || {};
    const nextClassEntry = {
      ...existingClassEntry,
      coefficientType: existingClassEntry.coefficientType || activeClassCoeff.coefficientType,
      customMaxScore: existingClassEntry.customMaxScore || activeClassCoeff.customMaxScore,
      splitByLevel: Boolean(existingClassEntry.splitByLevel ?? activeClassCoeff.splitByLevel),
      levelCoefficients: existingClassEntry.levelCoefficients || {},
      columnsConfig: payload,
      updatedByName: userName || role || '',
      updatedAt: new Date().toISOString(),
    };

    setIsSavingColumns(true);
    try {
      setMonthCoeffMap((prev) => ({
        ...prev,
        [selectedClassId]: nextClassEntry,
      }));

      await scoreCoefficientService.update(selectedMonth, {
        [`classes/${selectedClassId}`]: nextClassEntry,
        month: selectedMonth,
      });

      if (shouldRecalcTotals && scores.length > 0) {
        const nextActiveCols = getActiveSubjectColumns(nextConfig);
        const draftRows = scores.map((row) => {
          const { totalScore } = computeNumericTotalForColumns(row, nextActiveCols);
          return { ...row, totalScore };
        });

        const updatedRows = draftRows.map((row) => {
          const targetLevelKey =
            resolveScoreStudentMeta(row).effectiveLevel || UNASSIGNED_LEVEL_LABEL;
          const cohortRows = activeClassCoeff.splitByLevel
            ? draftRows.filter(
                (r) =>
                  (resolveScoreStudentMeta(r).effectiveLevel || UNASSIGNED_LEVEL_LABEL) ===
                  targetLevelKey
              )
            : draftRows;
          const coeffCfg = activeClassCoeff.splitByLevel
            ? getLevelCoeffConfig(activeClassCoeff, targetLevelKey)
            : activeClassCoeff;
          const { currentCoeff } = computeClassCoeffValue(cohortRows, coeffCfg);

          if (row.totalScore !== '') {
            const avgNum = parseFloat(row.totalScore) / currentCoeff;
            const g = calculateAutoGrade(avgNum);
            return {
              ...row,
              average: avgNum.toFixed(2).replace(/\.00$/, ''),
              grade: g,
              remarks: calculateRemarks(g),
            };
          }
          return {
            ...row,
            average: '',
            grade: '',
            remarks: '',
            rank: '',
          };
        });

        const changedPatches: Array<{ id: string; patch: Record<string, any> }> = [];
        updatedRows.forEach((nextRow, idx) => {
          const prevRow = scores[idx];
          if (
            nextRow.id &&
            (prevRow.totalScore !== nextRow.totalScore ||
              prevRow.average !== nextRow.average ||
              prevRow.grade !== nextRow.grade ||
              prevRow.remarks !== nextRow.remarks)
          ) {
            changedPatches.push({
              id: nextRow.id,
              patch: {
                totalScore: nextRow.totalScore,
                average: nextRow.average,
                grade: nextRow.grade,
                remarks: nextRow.remarks,
                ...(nextRow.totalScore === '' ? { rank: '' } : {}),
              },
            });
          }
        });

        if (changedPatches.length > 0) {
          setScores(updatedRows);
          await Promise.all(changedPatches.map((p) => scoreService.update(p.id, p.patch)));
        }
      }
    } catch (err: any) {
      console.error('Failed saving class score columns config:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកការកំណត់ជួរឈរ៖ ' + (err?.message || ''));
    } finally {
      setIsSavingColumns(false);
    }
  };

  const handleToggleSubjectColumn = async (colKey: string) => {
    if (LOCKED_SUBJECT_KEY_SET.has(colKey)) return;
    const exists = activeColumnsConfig.enabledKeys.includes(colKey);
    const nextEnabled = exists
      ? activeColumnsConfig.enabledKeys.filter((k) => k !== colKey)
      : [...activeColumnsConfig.enabledKeys, colKey];
    await persistClassColumnsConfig(
      {
        ...activeColumnsConfig,
        enabledKeys: nextEnabled,
      },
      true
    );
  };

  const handleToggleColumnInputMode = async (colKey: string) => {
    const curMode: ScoreColumnInputMode =
      activeColumnsConfig.columnModes[colKey] === 'evaluation' ? 'evaluation' : 'number';
    const nextMode: ScoreColumnInputMode = curMode === 'number' ? 'evaluation' : 'number';
    await persistClassColumnsConfig(
      {
        ...activeColumnsConfig,
        columnModes: {
          ...activeColumnsConfig.columnModes,
          [colKey]: nextMode,
        },
      },
      true
    );
  };

  const handleAddCustomColumn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanLabel = newCustomColLabel.trim();
    if (!cleanLabel) return;

    const existingMatch = allAvailableSubjectColumns.find(
      (c) => c.label.trim().toLowerCase() === cleanLabel.toLowerCase()
    );
    if (existingMatch) {
      const nextEnabled = existingMatch.isLocked
        ? activeColumnsConfig.enabledKeys
        : activeColumnsConfig.enabledKeys.includes(existingMatch.key)
          ? activeColumnsConfig.enabledKeys
          : [...activeColumnsConfig.enabledKeys, existingMatch.key];
      setNewCustomColLabel('');
      await persistClassColumnsConfig(
        {
          ...activeColumnsConfig,
          enabledKeys: nextEnabled,
          columnModes: {
            ...activeColumnsConfig.columnModes,
            [existingMatch.key]: newCustomColMode,
          },
        },
        true
      );
      return;
    }

    const newKey = makeCustomColumnKey(
      cleanLabel,
      allAvailableSubjectColumns.map((c) => c.key)
    );
    setNewCustomColLabel('');
    await persistClassColumnsConfig(
      {
        enabledKeys: [...activeColumnsConfig.enabledKeys, newKey],
        columnModes: {
          ...activeColumnsConfig.columnModes,
          [newKey]: newCustomColMode,
        },
        customColumns: [
          ...activeColumnsConfig.customColumns,
          { key: newKey, label: cleanLabel },
        ],
      },
      false
    );
  };

  const handleDeleteCustomColumn = async (colKey: string, label: string) => {
    if (!(await confirmDialog(`តើអ្នកពិតជាចង់លុបជួរឈរថ្មី "${label}" ចេញពីបញ្ជីជួរឈរមែនទេ?`))) {
      return;
    }
    const nextModes = { ...activeColumnsConfig.columnModes };
    delete nextModes[colKey];
    await persistClassColumnsConfig(
      {
        enabledKeys: activeColumnsConfig.enabledKeys.filter((k) => k !== colKey),
        columnModes: nextModes,
        customColumns: activeColumnsConfig.customColumns.filter((c) => c.key !== colKey),
      },
      true
    );
  };

  const handleResetDefaultColumns = async () => {
    const globalCustomKeys = new Set(globalDefaultColumnsConfig.customColumns.map((c) => c.key));
    const classOnlyCustom = activeColumnsConfig.customColumns.filter(
      (c) => !globalCustomKeys.has(c.key)
    );
    await persistClassColumnsConfig(
      {
        enabledKeys: [...globalDefaultColumnsConfig.enabledKeys],
        columnModes: { ...globalDefaultColumnsConfig.columnModes },
        customColumns: [...globalDefaultColumnsConfig.customColumns, ...classOnlyCustom],
        columnOrder: globalDefaultColumnsConfig.columnOrder,
      },
      true
    );
  };

  const handleSaveAdminDefaultColumns = async (nextConfig: ClassScoreColumnsConfig) => {
    const payload = {
      enabledKeys: nextConfig.enabledKeys,
      columnModes: nextConfig.columnModes,
      customColumns: nextConfig.customColumns,
      columnOrder: nextConfig.columnOrder || [],
      hasExplicitEmptyEnabled: nextConfig.enabledKeys.length === 0,
    };
    const nextSettings = {
      ...settings,
      defaultColumnsConfig: payload,
    };
    setSettings(nextSettings);
    await settingsService.add(nextSettings, 'scoreSettings');
  };

  const handlePaste = async (
    e: React.ClipboardEvent,
    startStudentIndex: number,
    field: string,
    visibleRows?: any[]
  ) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const rows = pasteText.split(/\r?\n/);
    const targetList = Array.isArray(visibleRows) && visibleRows.length > 0 ? visibleRows : scores;
    
    for (let i = 0; i < rows.length; i++) {
      const val = rows[i].trim();
      const studentIndex = startStudentIndex + i;
      if (studentIndex < targetList.length && val !== '') {
        await handleScoreChange(targetList[studentIndex], field, val);
      }
    }
  };

  /**
   * Excel-like keyboard cell navigation (ArrowLeft/Right/Up/Down, Enter/Shift+Enter)
   * across visible student rows and subject columns (including split-by-level groups).
   */
  const handleScoreCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    colIndex: number
  ) => {
    const key = e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
      return;
    }

    const input = e.currentTarget;
    const val = input.value || '';
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const isAllSelected = val.length === 0 || (selStart === 0 && selEnd === val.length);

    if (key === 'ArrowLeft' && !isAllSelected && selStart > 0) return;
    if (key === 'ArrowRight' && !isAllSelected && selEnd < val.length) return;

    const currentTr = input.closest('tr');
    const container = scoreTableContainerRef.current;
    if (!currentTr || !container) return;

    let targetInput: HTMLInputElement | null = null;

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const rowInputs = Array.from(
        currentTr.querySelectorAll<HTMLInputElement>('input[data-score-col]')
      );
      const curIdx = rowInputs.indexOf(input);
      if (curIdx !== -1) {
        targetInput = rowInputs[curIdx + (key === 'ArrowRight' ? 1 : -1)] || null;
      }
    } else {
      const allRows = Array.from(
        container.querySelectorAll<HTMLTableRowElement>('tr[data-score-row="1"]')
      );
      const currentRowIdx = allRows.indexOf(currentTr);
      if (currentRowIdx !== -1) {
        const goUp = key === 'ArrowUp' || (key === 'Enter' && e.shiftKey);
        const targetTr = allRows[currentRowIdx + (goUp ? -1 : 1)];
        if (targetTr) {
          targetInput = targetTr.querySelector<HTMLInputElement>(
            `input[data-score-col="${colIndex}"]`
          );
        }
      }
    }

    if (targetInput) {
      e.preventDefault();
      targetInput.focus();
      targetInput.select();
    } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter') {
      e.preventDefault();
    }
  };

  const openCoeffModal = (levelKey?: string | null) => {
    const cleanLevel = levelKey ? String(levelKey).trim() : null;
    setCoeffTargetLevel(cleanLevel);
    const targetCfg = cleanLevel
      ? getLevelCoeffConfig(activeClassCoeff, cleanLevel)
      : activeClassCoeff;
    setCoeffTypeDraft(targetCfg.coefficientType);
    setCustomMaxDraft(String(targetCfg.customMaxScore || 250));
    setIsCoeffModalOpen(true);
  };

  const handleSaveClassMonthCoeff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedMonth) return;
    const parsedMax = parseFloat(customMaxDraft);
    if (coeffTypeDraft === 'custom' && (!isFinite(parsedMax) || parsedMax <= 0)) {
      alert('សូមបញ្ចូលពិន្ទុអតិបរមាឱ្យបានត្រឹមត្រូវ (ធំជាង ០)!');
      return;
    }
    const cleanMax = isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 250;
    const existingClassEntry = monthCoeffMap?.[selectedClassId] || {};
    const existingLevelCoeffs =
      existingClassEntry?.levelCoefficients && typeof existingClassEntry.levelCoefficients === 'object'
        ? { ...existingClassEntry.levelCoefficients }
        : {};

    let nextClassEntry: any;
    if (coeffTargetLevel) {
      existingLevelCoeffs[coeffTargetLevel] = {
        coefficientType: coeffTypeDraft,
        customMaxScore: cleanMax,
      };
      nextClassEntry = {
        ...existingClassEntry,
        coefficientType: existingClassEntry.coefficientType || activeClassCoeff.coefficientType,
        customMaxScore: existingClassEntry.customMaxScore || activeClassCoeff.customMaxScore,
        splitByLevel: Boolean(existingClassEntry.splitByLevel ?? activeClassCoeff.splitByLevel),
        levelCoefficients: existingLevelCoeffs,
        updatedByName: userName || role || '',
        updatedAt: new Date().toISOString(),
      };
    } else {
      nextClassEntry = {
        ...existingClassEntry,
        coefficientType: coeffTypeDraft,
        customMaxScore: cleanMax,
        splitByLevel: Boolean(existingClassEntry.splitByLevel ?? activeClassCoeff.splitByLevel),
        levelCoefficients: existingLevelCoeffs,
        updatedByName: userName || role || '',
        updatedAt: new Date().toISOString(),
      };
    }

    setIsSavingCoeff(true);
    try {
      setMonthCoeffMap((prev) => ({
        ...prev,
        [selectedClassId]: nextClassEntry,
      }));
      await scoreCoefficientService.update(selectedMonth, {
        [`classes/${selectedClassId}`]: nextClassEntry,
        month: selectedMonth,
      });
      setIsCoeffModalOpen(false);
      setCoeffTargetLevel(null);
    } catch (err: any) {
      console.error('Failed to save class month coefficient:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកមេគុណ៖ ' + (err?.message || ''));
    } finally {
      setIsSavingCoeff(false);
    }
  };

  const handleToggleSplitByLevel = async () => {
    if (!selectedClassId || !selectedMonth) return;
    const existingClassEntry = monthCoeffMap?.[selectedClassId] || {};
    const nextSplit = !Boolean(existingClassEntry.splitByLevel);
    const nextClassEntry = {
      ...existingClassEntry,
      coefficientType: existingClassEntry.coefficientType || activeClassCoeff.coefficientType,
      customMaxScore: existingClassEntry.customMaxScore || activeClassCoeff.customMaxScore,
      splitByLevel: nextSplit,
      levelCoefficients: existingClassEntry.levelCoefficients || {},
      updatedByName: userName || role || '',
      updatedAt: new Date().toISOString(),
    };
    setIsTogglingSplit(true);
    try {
      setMonthCoeffMap((prev) => ({
        ...prev,
        [selectedClassId]: nextClassEntry,
      }));
      await scoreCoefficientService.update(selectedMonth, {
        [`classes/${selectedClassId}`]: nextClassEntry,
        month: selectedMonth,
      });
    } catch (err: any) {
      console.error('Failed to toggle split by level:', err);
      alert('មានបញ្ហាក្នុងការបំបែកតារាងតាមវគ្គ៖ ' + (err?.message || ''));
    } finally {
      setIsTogglingSplit(false);
    }
  };

  const openAssignLevelModal = (initialLevel = '', initialScoreIds: string[] = []) => {
    setAssignInitialLevel(initialLevel === UNASSIGNED_LEVEL_LABEL ? '' : initialLevel);
    setAssignInitialScoreIds(initialScoreIds);
    setIsAssignLevelOpen(true);
  };

  const handleAssignStudentsToLevel = async (scoreIds: string[], targetLevel: string) => {
    const idSet = new Set(scoreIds);
    setScores((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, level: targetLevel } : s))
    );
    await Promise.all(scoreIds.map((id) => scoreService.update(id, { level: targetLevel })));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.add(settings, 'scoreSettings');
    setIsSettingsModalOpen(false);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  useEffect(() => {
    if (!selectedMonth || selectedMonth.startsWith('FINAL_')) return;
    if (selectedClassId && scores.length > 0 && selectedClass) {
      const timer = setTimeout(async () => {
        const totalStudents = scores.length;
        if (totalStudents === 0) return;
        
        const studentsWithScore = scores.filter(s => s.totalScore && s.totalScore !== '').length;
        const completionRate = studentsWithScore / totalStudents;
        const isCompleted = completionRate >= 0.8;
        
        let currentCompletedMonths = selectedClass.completedMonths || [];
        const hasMonth = currentCompletedMonths.includes(selectedMonth);
        
        if (isCompleted && !hasMonth) {
          await classService.update(selectedClassId, { completedMonths: [...currentCompletedMonths, selectedMonth] });
        } else if (!isCompleted && hasMonth) {
          const newCompleted = currentCompletedMonths.filter((m: string) => m !== selectedMonth);
          await classService.update(selectedClassId, { completedMonths: newCompleted });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scores, selectedClassId, selectedClass, selectedMonth]);

  const importStudentsFromClass = async () => {
    if (!selectedClass) return;
    
    // Find all live students that belong to this class
    const classStudentIds = selectedClass.studentIds || (selectedClass.studentsData ? selectedClass.studentsData.map((s: any) => s.id) : []);
    const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');

    // Fetch previous month's Morality, Punctuality, Hygiene evaluations to auto-copy forward
    const { lookup: prevTraitLookup, sourceMonth: prevTraitMonth } =
      await fetchLatestPriorTraitsForClass(selectedClass.id, selectedMonth);

    let importedCount = 0;
    let copiedTraitsCount = 0;
    
    for (const student of classStudents) {
      // Check if they already exist in this month's score snapshot
      const exists = scores.some(scoreRec => scoreRec.studentId === student.id);
      
      if (!exists) {
        const prevSnap = findStudentTraitSnapshot(prevTraitLookup, student.id, student.studentId);
        if (prevSnap && (prevSnap.morality || prevSnap.punctuality || prevSnap.hygiene)) {
          copiedTraitsCount++;
        }

        await scoreService.add({
          classId: selectedClass.id,
          studentId: student.id, // Reference to original student
          month: selectedMonth,
          
          // Snapshot info
          studentIdCode: student.studentId || '',
          fullName: student.fullName || '',
          gender: student.gender || '',

          // 3 Conduct Evaluation Columns (auto-copied from previous month)
          morality: prevSnap?.morality || '',
          punctuality: prevSnap?.punctuality || '',
          hygiene: prevSnap?.hygiene || '',
          ...(prevSnap && prevTraitMonth ? { traitsCopiedFrom: prevTraitMonth } : {}),
          
          // Subject Scores
          quiz: '',
          exercise: '',
          speaking: '',
          homework: '',
          test: '',

          // Summary Score fields (always empty by default)
          totalScore: '',
          average: '',
          rank: '',
          grade: '',
          remarks: ''
        });
        importedCount++;
      }
    }
    
    if (importedCount > 0) {
      const traitNote =
        copiedTraitsCount > 0 && prevTraitMonth
          ? ` (បានចម្លងការវាយតម្លៃសីលធម៌ ៣ ជួរឈរពីខែ ${prevTraitMonth} សម្រាប់ ${copiedTraitsCount} នាក់)`
          : '';
      alert(`បានទាញយកសិស្សចំនួន ${importedCount} នាក់ដោយជោគជ័យ!${traitNote}`);
    } else {
      alert('មិនមានសិស្សថ្មីសម្រាប់ទាញយកទេ!');
    }
  };

  const removeScoreRecord = async (scoreId: string) => {
    if (await confirmDialog('តើអ្នកពិតជាចង់លុបសិស្សនេះចេញពីបញ្ជីពិន្ទុខែនេះមែនទេ? (វាមិនប៉ះពាល់ដល់បញ្ជីសិស្សក្នុងថ្នាក់ទេ)')) {
      await scoreService.delete(scoreId);
    }
  };

  const exportToCSV = () => {
    if (computedScores.rows.length === 0) return;
    const headers = [
      'អត្តលេខ',
      'ឈ្មោះសិស្ស',
      'ភេទ',
      'វគ្គ',
      ...TRAIT_EVALUATION_COLUMNS.map((t) => `${t.labelKh} (${t.labelEn})`),
      ...activeSubjectColumns.map((col) => col.label),
      'ពិន្ទុសរុប',
      'មធ្យមភាគ',
      'និទ្ទេស',
      'ចំណាត់ថ្នាក់',
      'មូលវិចារណ៍',
    ];
    const csvContent = [
      headers.join(','),
      ...computedScores.rows.map((s: any) =>
        [
          `"${s.displayStudentCode || s.studentIdCode || ''}"`,
          `"${s.displayFullName || s.fullName || ''}"`,
          `"${s.displayGender || s.gender || ''}"`,
          `"${s.effectiveLevel || ''}"`,
          ...TRAIT_EVALUATION_COLUMNS.map((t) => `"${normalizeEvaluationValue(s[t.key]) || ''}"`),
          ...activeSubjectColumns.map((col) =>
            col.inputMode === 'evaluation'
              ? `"${getColumnEvalValue(s, col.key)}"`
              : `"${getColumnNumericValue(s, col.key)}"`
          ),
          `"${s.totalScore || ''}"`,
          `"${s.dynAverage || s.average || ''}"`,
          `"${s.dynGrade || s.grade || ''}"`,
          `"${s.dynRank || s.rank || ''}"`,
          `"${s.dynRemarks || s.remarks || ''}"`,
        ].join(',')
      ),
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scores_${selectedClass?.className}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFilterIds = selectedClassIdsFilter !== null ? selectedClassIdsFilter : displayClasses.map(c => c.id);
  const filteredDisplayClasses = displayClasses.filter(c => activeFilterIds.includes(c.id));

  const monthlyResultModal = isMonthlyResultOpen ? (
    <MonthlyResultPrintModal
      isOpen={isMonthlyResultOpen}
      onClose={() => setIsMonthlyResultOpen(false)}
      classes={displayClasses}
      allStudents={allStudents}
      allTeachers={allTeachers}
      allScores={allScores}
      monthCoeffMap={monthCoeffMap}
      scoreSettings={settings}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      monthExtraData={monthExtraData}
      initialClassId={selectedClassId}
      onSaveBrandingSettings={handleSaveScorePrintSettings}
    />
  ) : null;

  const certificateModal = isCertificateModalOpen ? (
    <CertificatePrintModal
      isOpen={isCertificateModalOpen}
      onClose={() => setIsCertificateModalOpen(false)}
      classes={displayClasses}
      allStudents={allStudents}
      allTeachers={allTeachers}
      allScores={allScores}
      monthCoeffMap={monthCoeffMap}
      scoreSettings={settings}
      selectedMonth={selectedMonth}
      monthlyMonth={monthlyMonthDraft}
      finalExamSessions={visibleFinalExamSessions}
      onMonthChange={(m) => {
        setSelectedMonth(m);
        if (m.startsWith('FINAL_')) {
          setExamMode('final');
          setSelectedFinalExamId(m);
        } else {
          setExamMode('monthly');
          setMonthlyMonthDraft(m);
        }
      }}
      onCreateFinalExam={() => {
        setIsCertificateModalOpen(false);
        openCreateFinalExamModal();
      }}
      monthExtraData={monthExtraData}
      initialClassId={selectedClassId}
      initialDocType={examMode === 'final' || selectedMonth.startsWith('FINAL_') ? 'certificate' : undefined}
      finalExamTitle={activeFinalExam?.title}
      finalExamCourseKh={activeFinalExam?.courseNameKh}
      finalExamCourseEn={activeFinalExam?.courseNameEn}
      finalExamDate={activeFinalExam?.examDate}
      onSaveSettings={handleSaveScorePrintSettings}
    />
  ) : null;

  const honorRollModal = isHonorRollOpen ? (
    <HonorRollPrintModal
      isOpen={isHonorRollOpen}
      onClose={() => setIsHonorRollOpen(false)}
      classes={displayClasses}
      allStudents={allStudents}
      allTeachers={allTeachers}
      allScores={allScores}
      monthCoeffMap={monthCoeffMap}
      scoreSettings={settings}
      selectedMonth={selectedMonth.startsWith('FINAL_') ? monthlyMonthDraft : selectedMonth}
      onMonthChange={(m) => {
        setExamMode('monthly');
        setMonthlyMonthDraft(m);
        setSelectedMonth(m);
      }}
      initialClassId={selectedClassId}
    />
  ) : null;

  const adminDefaultColsModal =
    role === 'admin' && isAdminDefaultColsOpen ? (
      <AdminDefaultColumnsModal
        isOpen={isAdminDefaultColsOpen}
        onClose={() => setIsAdminDefaultColsOpen(false)}
        initialConfig={globalDefaultColumnsConfig}
        onSave={handleSaveAdminDefaultColumns}
      />
    ) : null;

  if (!selectedClassId) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          
          <div style={{ flex: 1, maxWidth: '300px', minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="ស្វែងរកឈ្មោះថ្នាក់រៀន..." 
              value={classMainSearchFilter}
              onChange={e => setClassMainSearchFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          
          
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {role === 'admin' && (
              <>
                <button 
                  onClick={async () => {
                    if (isSyncingSheets) return;
                    
                    const data = filteredDisplayClasses.map(c => {
                      const classScores = allScores.filter((sc: any) => sc.classId === c.id && sc.month === selectedMonth);
                      const classCoeffCfg = getClassMonthCoeffConfig(c.id, monthCoeffMap, settings);
                      const { currentCoeff } = computeClassCoeffValue(classScores, classCoeffCfg);

                      const mappedClassScores = classScores.map((s:any) => {
                        const total = parseFloat(s.totalScore) || 0;
                        let avg = total / currentCoeff;
                        
                        const avgPercentage = (avg / 50) * 100;
                        let grade = 'F';
                        if (avgPercentage >= (settings.gradeA || 90)) grade = 'A';
                        else if (avgPercentage >= (settings.gradeB || 80)) grade = 'B';
                        else if (avgPercentage >= (settings.gradeC || 70)) grade = 'C';
                        else if (avgPercentage >= (settings.gradeD || 60)) grade = 'D';
                        else if (avgPercentage >= (settings.gradeE || 50)) grade = 'E';
                        
                        let remarks = '';
                        let engRemarks = '';
                        switch(grade) {
                          case 'A': remarks = 'ល្អប្រសើរ'; engRemarks = 'Excellent'; break;
                          case 'B': remarks = 'ល្អ'; engRemarks = 'Good'; break;
                          case 'C': remarks = 'ល្អបង្គួរ'; engRemarks = 'Fair'; break;
                          case 'D': remarks = 'មធ្យម'; engRemarks = 'Medium'; break;
                          case 'E': remarks = 'មធ្យម'; engRemarks = 'Medium'; break;
                          case 'F': remarks = 'ខ្សោយ'; engRemarks = 'Poor'; break;
                        }

                        // Helper to normalize strings for strict comparison
                        const cleanStr = (val: any) => (val || '').toString().trim().toLowerCase().replace(/\s+/g, '');

                        const scoreCode = cleanStr(s.studentIdCode);
                        const scoreDocId = cleanStr(s.studentId);

                        // Strict ID Lookup (VLOOKUP by ID):
                        let student: any = null;

                        // 1. Match by Student ID Code (e.g. BS0673)
                        if (scoreCode) {
                          student = allStudents.find((st: any) => cleanStr(st.studentId) === scoreCode || cleanStr(st.id) === scoreCode);
                        }

                        // 2. If not found, match by Firebase Document ID
                        if (!student && scoreDocId) {
                          student = allStudents.find((st: any) => cleanStr(st.id) === scoreDocId || cleanStr(st.studentId) === scoreDocId);
                        }

                        // 3. ONLY if neither ID is provided, fall back to class student list + Name match
                        if (!student && !scoreCode && !scoreDocId && s.fullName) {
                          const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((ms: any) => ms.id) : []) || [];
                          student = allStudents.find((st: any) => classStudentIds.includes(st.id) && cleanStr(st.fullName) === cleanStr(s.fullName));
                          
                          if (!student) {
                            student = allStudents.find((st: any) => cleanStr(st.fullName) === cleanStr(s.fullName));
                          }
                        }

                        const teacherId = cleanStr(c.teacherId);
                        const teacherName = cleanStr(c.teacherName);
                        let teacher: any = null;
                        if (teacherId) {
                          teacher = allTeachers.find((t: any) => cleanStr(t.id) === teacherId || cleanStr(t.teacherId) === teacherId);
                        }
                        if (!teacher && teacherName) {
                          teacher = allTeachers.find((t: any) => cleanStr(t.fullName) === teacherName);
                        }

                        const studentShift = student?.shift || c.shift || '';
                        const shiftUpper = (studentShift || '').toUpperCase().trim();
                        let shiftFull = '';
                        let engShiftFull = '';
                        if (shiftUpper.includes('E')) {
                          shiftFull = 'ក្រៅម៉ោង';
                          engShiftFull = 'Part-time';
                        } else if (shiftUpper.includes('FA') || shiftUpper.includes('FM') || shiftUpper.includes('F')) {
                          shiftFull = 'ពេញម៉ោង';
                          engShiftFull = 'Full-time';
                        } else if (shiftUpper) {
                          shiftFull = studentShift;
                          engShiftFull = studentShift;
                        }

                        const rawGender = student?.gender || s.gender || '';
                        let engGender = '';
                        if (rawGender === 'ប្រុស' || rawGender.toLowerCase() === 'male' || rawGender.toLowerCase() === 'm') {
                          engGender = 'M';
                        } else if (rawGender === 'ស្រី' || rawGender.toLowerCase() === 'female' || rawGender.toLowerCase() === 'f') {
                          engGender = 'F';
                        } else {
                          engGender = rawGender;
                        }

                        const englishName = student?.englishName || '';
                        // Lookup Level directly from student record
                        const studentLevel = student?.level || s.level || '';

                        const matchLevel = (bookLevelStr: any, studentLevelStr: any) => {
                          const bL = cleanStr(bookLevelStr);
                          const sL = cleanStr(studentLevelStr);
                          if (!bL || !sL) return false;
                          if (bL === sL) return true;
                          const bNum = bL.match(/\d+/)?.[0];
                          const sNum = sL.match(/\d+/)?.[0];
                          if (bNum && sNum && bNum === sNum) return true;
                          return bL.includes(sL) || sL.includes(bL);
                        };

                        let bookName = '';
                        // 1. Match book in current class books by student level
                        if (c.books && Array.isArray(c.books) && c.books.length > 0 && studentLevel) {
                          const matchedBook = c.books.find((b: any) => matchLevel(b.level || b.levelId || '', studentLevel));
                          if (matchedBook) {
                            bookName = typeof matchedBook === 'string' ? matchedBook : (matchedBook.name || matchedBook.title || '');
                          }
                        }

                        // 2. If not found, search across all classes for this level
                        if (!bookName && studentLevel && classes && Array.isArray(classes)) {
                          for (const otherClass of classes) {
                            if (otherClass.books && Array.isArray(otherClass.books)) {
                              const matchedBook = otherClass.books.find((b: any) => matchLevel(b.level || b.levelId || '', studentLevel));
                              if (matchedBook && (matchedBook.name || matchedBook.title)) {
                                bookName = typeof matchedBook === 'string' ? matchedBook : (matchedBook.name || matchedBook.title || '');
                                break;
                              }
                            }
                          }
                        }

                        // 3. Fallbacks
                        if (!bookName) {
                          if (c.books && Array.isArray(c.books) && c.books.length > 0) {
                            if (c.books.length === 1) {
                              const b = c.books[0];
                              bookName = typeof b === 'string' ? b : (b.name || b.title || '');
                            } else {
                              bookName = c.books
                                .map((b: any) => typeof b === 'string' ? b : (b.name || b.title || ''))
                                .filter(Boolean)
                                .join(', ');
                            }
                          } else if (typeof c.books === 'string') {
                            bookName = c.books;
                          } else if (c.book) {
                            bookName = typeof c.book === 'string' ? c.book : (c.book.name || '');
                          }
                        }

                        if (!bookName && c.className) {
                          bookName = c.className;
                        }
                        const engTeacherName = teacher?.englishName || c.teacherName || '';
                        const studentPhoto = student?.photo || student?.photoLink || '';

                        return {
                          ...s,
                          shift: studentShift,
                          shiftFull,
                          engShiftFull,
                          bookName,
                          englishName,
                          level: studentLevel,
                          engGender,
                          engRemarks: (s.totalScore === '' || s.totalScore == null) ? '' : engRemarks,
                          engTeacherName,
                          photo: studentPhoto,
                          average: (s.totalScore === '' || s.totalScore == null) ? '' : avg.toFixed(2),
                          grade: (s.totalScore === '' || s.totalScore == null) ? '' : grade,
                          remarks: (s.totalScore === '' || s.totalScore == null) ? '' : remarks,
                          avgNum: (s.totalScore === '' || s.totalScore == null) ? -1 : avg
                        };
                      });

                      const scored = [...mappedClassScores].filter((s:any) => s.avgNum !== -1);
                      scored.sort((a, b) => b.avgNum - a.avgNum);
                      
                      let currentRank = 1;
                      let currentAvg = -1;
                      const ranks: Record<string, number> = {};
                      for (let i = 0; i < scored.length; i++) {
                        const s = scored[i];
                        if (s.avgNum !== currentAvg) {
                          currentRank = i + 1;
                          currentAvg = s.avgNum;
                        }
                        ranks[s.id] = currentRank;
                      }

                      const finalScores = mappedClassScores.map((s:any) => ({
                        ...s,
                        rank: ranks[s.id] !== undefined ? ranks[s.id].toString() : ''
                      }));

                      return {
                        classInfo: c,
                        scores: finalScores,
                      };
                    });
                    
                    if (data.length === 0) {
                      alert('សូមជ្រើសរើសថ្នាក់យ៉ាងហោចណាស់មួយសិន!');
                      return;
                    }

                    let sheetUrl = settings.googleSheetUrl || localStorage.getItem('googleSheetId');
                    if (!sheetUrl) {
                      alert('សូមជួយចូលទៅកាន់ប៉ូតុង "ការកំណត់" (Settings) នៅខាងលើ ដើម្បីបញ្ចូល Link ឯកសារ Google Sheets របស់អ្នកជាមុនសិន!');
                      return;
                    }

                    // Extract ID from URL if it's a URL
                    let sheetId = sheetUrl;
                    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                    if (match && match[1]) {
                      sheetId = match[1];
                    }

                    setIsSyncingSheets(true);
                    try {
                      const response = await fetch('/api/sync-sheets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          spreadsheetId: sheetId,
                          classesData: data,
                          selectedMonth,
                          monthExtra: monthExtraData
                        })
                      });
                      const resData = await response.json();
                      if (resData.url || resData.success) {
                        alert('ទិន្នន័យត្រូវបានបញ្ជូនទៅកាន់ Google Sheets រួចរាល់ហើយ!');
                      } else {
                        alert(resData.error || 'Failed to sync to Google Sheets');
                      }
                    } catch (err: any) {
                      alert('Error: ' + err.message);
                    } finally {
                      setIsSyncingSheets(false);
                    }
                  }}
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: isSyncingSheets ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: isSyncingSheets ? 0.7 : 1 }}
                >
                  {isSyncingSheets ? (
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  )}
                  {isSyncingSheets ? 'កំពុងភ្ជាប់...' : 'Sync Selected to Sheets'}
                </button>
                <button 
                  onClick={() => setIsExtraDataModalOpen(true)}
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                  title="ទិន្នន័យបន្ថែមសម្រាប់របាយការណ៍ (ឈ្មោះខែ និងថ្ងៃចេញ Sync ចូល AA1...)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M12 14v4"></path><path d="M10 16h4"></path></svg>
                  ទិន្នន័យបន្ថែម
                </button>
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                  title="កំណត់ Link Google Sheets និងការគណនាពិន្ទុ"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  ការកំណត់
                </button>
              </>
            )}
            {/* Filter Dropdown to tick class names */}
            <div style={{ position: 'relative' }} ref={classFilterPortal.containerRef}>
              <button 
                ref={classFilterPortal.triggerRef}
                type="button"
                onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
                className="btn"
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                <span>ជ្រើសរើសថ្នាក់ ({activeFilterIds.length}/{displayClasses.length})</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isClassFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              {isClassFilterOpen && typeof document !== 'undefined' && createPortal(
                <div ref={classFilterPortal.menuRef} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} style={{
                  ...classFilterPortal.menuStyle,
                  background: 'var(--modal-bg, var(--main-bg))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  maxHeight: `${classFilterPortal.maxListHeight}px`,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>តម្រងថ្នាក់រៀន</span>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setSelectedClassIdsFilter(displayClasses.map(c => c.id))}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                      >
                        ជ្រើសរើសទាំងអស់
                      </button>
                      <span style={{ color: 'var(--text-secondary)' }}>|</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedClassIdsFilter([])}
                        style={{ background: 'none', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                      >
                        បោះបង់
                      </button>
                    </div>
                  </div>

                  <input 
                    type="text" 
                    placeholder="ស្វែងរកឈ្មោះថ្នាក់..." 
                    value={classSearchFilter}
                    onChange={e => setClassSearchFilter(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  />

                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {displayClasses
                      .filter(c => (c.className || '').toLowerCase().includes(classSearchFilter.toLowerCase()))
                      .map(c => {
                        const isChecked = activeFilterIds.includes(c.id);
                        return (
                          <label 
                            key={c.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              padding: '0.4rem 0.5rem', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              background: isChecked ? 'var(--bg-secondary)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                let currentSelected = [...activeFilterIds];
                                if (e.target.checked) {
                                  if (!currentSelected.includes(c.id)) currentSelected.push(c.id);
                                } else {
                                  currentSelected = currentSelected.filter(id => id !== c.id);
                                }
                                setSelectedClassIdsFilter(currentSelected);
                              }}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: isChecked ? 600 : 400, flex: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.className}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Exam Mode & Month / Final Exam Session Selector */}
            {examSessionSelectorBar}

            {monthlyResultButton}
            {honorRollButton}
            {certificateButton}
            {guideButton}
          </div>
        </div>
        
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredDisplayClasses.filter(c => (c.className || '').toLowerCase().includes(classSearch.toLowerCase()) || (c.classCode || '').toLowerCase().includes(classSearch.toLowerCase())).map(c => {
            const IconComp = ICONS.find(i => i.id === c.icon)?.icon || ICONS[0].icon;
            const colorHex = COLORS.find(co => co.id === c.color)?.value || COLORS[0].value;
            
            // Count live students for this class
            const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((s: any) => s.id) : []);
            const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
              
              // Calculate score entry progress for selected month
              const classScores = allScores.filter((sc: any) => sc.classId === c.id && sc.month === selectedMonth);
              const totalStudents = classScores.length;
              const scoredStudentsCount = classScores.filter((sc: any) => {
                return sc.totalScore !== undefined && sc.totalScore !== null && sc.totalScore !== '';
              }).length;
            
            const progressPercent = totalStudents > 0 ? Math.min(100, Math.round((scoredStudentsCount / totalStudents) * 100)) : 0;
            const isCompleted = totalStudents > 0 && progressPercent >= 80;

            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedClassId(c.id)} 
                className="glass-panel glass-panel-hoverable animate-scale-in" 
                style={{ 
                  padding: '1.25rem', 
                  cursor: 'pointer', 
                  borderStyle: 'solid',
                  borderWidth: '2px 2px 2px 6px',
                  borderColor: `transparent transparent transparent ${colorHex}`,
                  transition: 'all 0.2s ease', 
                  position: 'relative', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: 'var(--card-bg)'
                }}
              >
                {/* Background Icon Watermark */}
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, transform: 'scale(4)', pointerEvents: 'none' }}>
                  {IconComp}
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${colorHex}15`, color: colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {IconComp}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.className}</h3>
                        {c.classCode && <span style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>{c.classCode}</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{c.academicYear || '2026-2027'} • {c.shift || 'N/A'}</p>
                      {c.time && <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>ម៉ោង៖ {c.time}</p>}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.teacherName || 'មិនទាន់កំណត់'}</span>
                        <span style={{ margin: '0 0.2rem', color: 'var(--text-secondary)' }}>•</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>សិស្ស {totalStudents} នាក់</span>
                        {(() => {
                          const cCoeffCfg = getClassMonthCoeffConfig(c.id, monthCoeffMap, settings);
                          const { currentCoeff: cardCoeff } = computeClassCoeffValue(classScores, cCoeffCfg);
                          return (
                            <span
                              style={{
                                marginLeft: 'auto',
                                padding: '0.12rem 0.48rem',
                                borderRadius: '999px',
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                background: cCoeffCfg.isCustomSavedForMonth
                                  ? 'rgba(139, 92, 246, 0.14)'
                                  : 'var(--bg-secondary)',
                                color: cCoeffCfg.isCustomSavedForMonth
                                  ? '#7c3aed'
                                  : 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              មេគុណ៖ {Number(cardCoeff.toFixed(2))}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Entry Status & Progress Bar */}
                <div style={{ position: 'relative', zIndex: 1, paddingTop: '0.6rem', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: 700, 
                      color: isCompleted ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      {isCompleted ? (
                        <>
                          <AppIcon name="check-circle" size={16} />
                          <span>បញ្ចូលរួចរាល់</span>
                        </>
                      ) : (
                        <>
                          <AppIcon name="x-circle" size={16} />
                          <span>មិនទាន់បញ្ចូល</span>
                        </>
                      )}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {scoredStudentsCount}/{totalStudents} ({progressPercent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, background: isCompleted ? '#10b981' : '#ef4444', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredDisplayClasses.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px', gridColumn: '1 / -1' }}>
              មិនមានថ្នាក់រៀនទេ
            </div>
          )}
        </div>

        {isSettingsModalOpen && typeof document !== 'undefined' && createPortal(
          <div onClick={() => setIsSettingsModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20030, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.58)', backdropFilter: 'blur(5px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '1.5rem', background: 'var(--modal-bg)', width: '100%', maxWidth: '500px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '18px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0' }}>ការកំណត់ (Settings)</h2>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>តភ្ជាប់ឯកសារ Google Sheets (Link ឬ ID)</label>
                  <input type="text" className="input-field" value={settings.googleSheetUrl || ''} onChange={e => setSettings({...settings, googleSheetUrl: e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/..." />
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#ec4899' }}>*សូមអញ្ជើញ Share ឯកសាររបស់អ្នកមកអ៊ីមែល <b>bsis-936@high-magpie-503702-t0.iam.gserviceaccount.com</b> ជាមុនសិន</p>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.06)', border: '1px solid rgba(79, 70, 229, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    ជួរឈរពិន្ទុលំនាំដើម និងលេខរៀង Col ទាំងអស់
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    កំណត់ជួរឈរលំនាំដើម របៀបបញ្ចូល (លេខ/វាយតម្លៃ) និងរៀបលេខរៀង Col ទាំងអស់សម្រាប់ថ្នាក់ និងខែទាំងអស់។
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      setIsAdminDefaultColsOpen(true);
                    }}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.48rem 0.9rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <AppIcon name="sliders" size={14} />
                    <span>កំណត់ Default & លេខរៀង Col</span>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn" onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>បោះបង់</button>
                  <button type="submit" className="btn btn-primary">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {isExtraDataModalOpen && typeof document !== 'undefined' && createPortal(
          <div onClick={() => setIsExtraDataModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20030, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.58)', backdropFilter: 'blur(5px)', padding: '1rem' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '1.5rem', background: 'var(--modal-bg)', width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '18px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>ទិន្នន័យបន្ថែម (Extra Data)</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ខែ៖ <b style={{ color: 'var(--accent-primary, #0ea5e9)' }}>{selectedMonth}</b> (Sync ចូល Cell AA1...)</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsExtraDataModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveExtraData} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Month Names */}
                <div style={{ background: 'var(--bg-secondary, rgba(0,0,0,0.02))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    ១. ឈ្មោះខែ (Month Name)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>ឈ្មោះខែ (ភាសាខ្មែរ)</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={monthExtraData.monthKhmer} 
                        onChange={e => setMonthExtraData({ ...monthExtraData, monthKhmer: e.target.value })} 
                        placeholder="ឧទាហរណ៍៖ ខែសីហា ឆ្នាំ២០២៦" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Month Name (English)</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={monthExtraData.monthEnglish} 
                        onChange={e => setMonthExtraData({ ...monthExtraData, monthEnglish: e.target.value })} 
                        placeholder="Example: August 2026" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Issue Dates */}
                <div style={{ background: 'var(--bg-secondary, rgba(0,0,0,0.02))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    ២. ថ្ងៃចេញរបាយការណ៍ (Issue Date)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>ថ្ងៃចេញ (ភាសាខ្មែរ)</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={monthExtraData.issueDateKhmer} 
                        onChange={e => setMonthExtraData({ ...monthExtraData, issueDateKhmer: e.target.value })} 
                        placeholder="ឧទាហរណ៍៖ ថ្ងៃទី២១ ខែសីហា ឆ្នាំ២០២៦" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Issue Date (English)</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={monthExtraData.issueDateEnglish} 
                        onChange={e => setMonthExtraData({ ...monthExtraData, issueDateEnglish: e.target.value })} 
                        placeholder="Example: August 21, 2026" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setIsExtraDataModalOpen(false)} 
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    បោះបង់
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingExtraData}
                    className="btn btn-primary" 
                    style={{ background: 'var(--accent-primary, #0ea5e9)', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: isSavingExtraData ? 'not-allowed' : 'pointer', opacity: isSavingExtraData ? 0.7 : 1 }}
                  >
                    {isSavingExtraData ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
        <ScoresGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        {monthlyResultModal}
        {honorRollModal}
        {certificateModal}
        {adminDefaultColsModal}
      </div>
    );
  }

  const snapshotTotal = scores.length;
  const snapshotFemale = scores.filter(s => s.gender === 'ស្រី').length;
  const snapshotMale = snapshotTotal - snapshotFemale;

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem', maxWidth: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn" onClick={() => setSelectedClassId(null)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem' }}>
             &larr; ថយក្រោយ
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ថ្នាក់៖ {selectedClass?.className}</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {examSessionSelectorBar}
          {monthlyResultButton}
          {honorRollButton}
          {certificateButton}
          {guideButton}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>បញ្ជីសិស្សក្នុងថ្នាក់</h3>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>សរុប {snapshotTotal} នាក់</span>
            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ស្រី {snapshotFemale} នាក់</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ប្រុស {snapshotMale} នាក់</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={importStudentsFromClass}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            title="ទាញយកបញ្ជីឈ្មោះសិស្សពីថ្នាក់ចូលក្នុងខែនេះ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>

          <button 
            onClick={() => openCoeffModal(null)}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeClassCoeff.isCustomSavedForMonth ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-secondary)', border: activeClassCoeff.isCustomSavedForMonth ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
            title="កំណត់មេគុណសម្រាប់មធ្យមភាគនៃថ្នាក់ និងខែនេះ"
          >
            <AppIcon name="hash" size={16} style={{ color: activeClassCoeff.isCustomSavedForMonth ? '#7c3aed' : 'var(--primary-color, #3b82f6)' }} />
            <span>
              {computedScores.isSplitByLevel
                ? `មេគុណលំនាំដើម (${selectedMonth})`
                : `មេគុណ (${selectedMonth}): ${Number(computedScores.currentCoeff.toFixed(2))}`}
            </span>
          </button>

          <button
            type="button"
            disabled={isTogglingSplit}
            onClick={handleToggleSplitByLevel}
            style={{
              padding: '0.5rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: computedScores.isSplitByLevel
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : 'var(--bg-secondary)',
              border: computedScores.isSplitByLevel
                ? '1px solid #6366f1'
                : '1px solid var(--border-color)',
              borderRadius: '8px',
              color: computedScores.isSplitByLevel ? '#ffffff' : 'var(--text-primary)',
              cursor: isTogglingSplit ? 'wait' : 'pointer',
              fontWeight: 600,
              boxShadow: computedScores.isSplitByLevel ? '0 3px 10px rgba(99, 102, 241, 0.28)' : 'none',
            }}
            title="បំបែកតារាងបញ្ជីពិន្ទុតាមវគ្គនីមួយៗក្នុងថ្នាក់តែមួយ ដើម្បីគណនាមេគុណ មធ្យមភាគ និងចំណាត់ថ្នាក់ដាច់ដោយឡែក"
          >
            <AppIcon name="layers" size={16} />
            <span>
              {computedScores.isSplitByLevel ? 'កំពុងបំបែកតាមវគ្គ' : 'បំបែកតារាងតាមវគ្គ'}
            </span>
            {computedScores.uniqueLevels.length > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.08rem 0.42rem',
                  borderRadius: '999px',
                  background: computedScores.isSplitByLevel
                    ? 'rgba(255, 255, 255, 0.22)'
                    : computedScores.uniqueLevels.length > 1
                      ? 'rgba(79, 70, 229, 0.14)'
                      : 'rgba(148, 163, 184, 0.2)',
                  color: computedScores.isSplitByLevel
                    ? '#ffffff'
                    : computedScores.uniqueLevels.length > 1
                      ? '#4f46e5'
                      : 'var(--text-secondary)',
                }}
              >
                {computedScores.uniqueLevels.length} វគ្គ
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => openAssignLevelModal('', [])}
            disabled={scores.length === 0}
            style={{
              padding: '0.5rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(14, 165, 233, 0.35)',
              borderRadius: '8px',
              color: '#0284c7',
              cursor: scores.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: scores.length === 0 ? 0.55 : 1,
            }}
            title="ជ្រើសឈ្មោះសិស្សបញ្ចូលវគ្គណាមួយក្នុងថ្នាក់សម្រាប់ចេញលទ្ធផលខែនេះ ដោយមិនប៉ះពាល់ទិន្នន័យដើម"
          >
            <AppIcon name="users" size={16} />
            <span>ជ្រើសសិស្សចូលវគ្គ</span>
          </button>

          {/* Subject Columns Checkbox Dropdown + Add Custom Column */}
          <div style={{ position: 'relative' }} ref={columnsPortal.containerRef}>
            <button
              ref={columnsPortal.triggerRef}
              type="button"
              onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
              className="btn"
              style={{
                padding: '0.5rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isColumnsDropdownOpen ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.09)',
                border: '1px solid rgba(16, 185, 129, 0.38)',
                borderRadius: '8px',
                color: '#047857',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="ជ្រើសរើស ឬបន្ថែមជួរឈរពិន្ទុ / វាយតម្លៃ (Reading, Writing, Speaking, Listening, Spelling, Dictation, Presentation, Homework...)"
            >
              <AppIcon name="sliders" size={16} />
              <span>ជួរឈរពិន្ទុ ({activeColumnsConfig.enabledKeys.length})</span>
              <AppIcon
                name="chevron-down"
                size={14}
                style={{
                  transform: isColumnsDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.18s',
                }}
              />
            </button>

            {isColumnsDropdownOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={columnsPortal.menuRef}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    ...columnsPortal.menuStyle,
                    background: 'var(--modal-bg, var(--main-bg))',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.25)',
                    maxHeight: `${columnsPortal.maxListHeight}px`,
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '0.45rem',
                      borderBottom: '1px solid var(--border-color)',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        ជ្រើសរើស និងបន្ថែម Col ពិន្ទុ
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        រក្សាទុកដាច់ដោយឡែកសម្រាប់ខែ <b>{selectedMonth}</b>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingColumns}
                      onClick={handleResetDefaultColumns}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-color, #2563eb)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0.15rem 0.25rem',
                        whiteSpace: 'nowrap',
                      }}
                      title="ត្រឡប់ទៅជួរឈរលំនាំដើម (Homework, Reading, Dictation, Presentation)"
                    >
                      លំនាំដើម
                    </button>
                  </div>

                  {/* Checkbox List (Optional + Custom columns only; Quiz, Exercise, Test are locked at far right) */}
                  <div
                    style={{
                      overflowY: 'auto',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.24rem',
                      paddingRight: '0.15rem',
                    }}
                  >
                    {checkboxSubjectColumns.map((col) => {
                      const isChecked = activeColumnsConfig.enabledKeys.includes(col.key);
                      const isEval = col.inputMode === 'evaluation';
                      return (
                        <div
                          key={col.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.32rem 0.45rem',
                            borderRadius: '8px',
                            background: isChecked ? 'var(--bg-secondary)' : 'transparent',
                            border: isChecked
                              ? '1px solid var(--border-color)'
                              : '1px solid transparent',
                          }}
                        >
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              flex: 1,
                              minWidth: 0,
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              fontWeight: isChecked ? 600 : 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSavingColumns}
                              onChange={() => handleToggleSubjectColumn(col.key)}
                              style={{
                                width: '15px',
                                height: '15px',
                                accentColor: '#10b981',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {col.label}
                            </span>
                            {col.isCustom && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  padding: '0.06rem 0.34rem',
                                  borderRadius: '999px',
                                  background: 'rgba(139, 92, 246, 0.14)',
                                  color: '#7c3aed',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                ថ្មី
                              </span>
                            )}
                          </label>

                          {isChecked && (
                            <button
                              type="button"
                              disabled={isSavingColumns}
                              onClick={() => handleToggleColumnInputMode(col.key)}
                              style={{
                                padding: '0.14rem 0.42rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: isEval
                                  ? '1px solid rgba(16, 185, 129, 0.42)'
                                  : '1px solid rgba(59, 130, 246, 0.36)',
                                background: isEval
                                  ? 'rgba(16, 185, 129, 0.14)'
                                  : 'rgba(59, 130, 246, 0.12)',
                                color: isEval ? '#047857' : '#2563eb',
                                whiteSpace: 'nowrap',
                              }}
                              title="ចុចដើម្បីប្តូររវាង ការវាយលេខពិន្ទុ ↔ ការវាយតម្លៃ"
                            >
                              {isEval ? 'វាយតម្លៃ' : 'លេខ'}
                            </button>
                          )}

                          {col.isCustom &&
                            !globalDefaultColumnsConfig.customColumns.some(
                              (gc) => gc.key === col.key
                            ) && (
                            <button
                              type="button"
                              disabled={isSavingColumns}
                              onClick={() => handleDeleteCustomColumn(col.key, col.label)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger, #ef4444)',
                                cursor: 'pointer',
                                padding: '0.15rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.78,
                              }}
                              title={`លុបជួរឈរ "${col.label}"`}
                            >
                              <AppIcon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Column Form */}
                  <form
                    onSubmit={handleAddCustomColumn}
                    style={{
                      paddingTop: '0.55rem',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      + បន្ថែមជួរឈរថ្មី (Add New Column)
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        type="text"
                        value={newCustomColLabel}
                        onChange={(e) => setNewCustomColLabel(e.target.value)}
                        placeholder="ឧ. Grammar, Project..."
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '0.38rem 0.55rem',
                          borderRadius: '7px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      />
                      <div
                        style={{
                          display: 'inline-flex',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '7px',
                          padding: '2px',
                          gap: '2px',
                          flexShrink: 0,
                        }}
                        title="ប្រភេទការបញ្ចូលដំបូង"
                      >
                        <button
                          type="button"
                          onClick={() => setNewCustomColMode('number')}
                          style={{
                            padding: '0.26rem 0.42rem',
                            borderRadius: '5px',
                            border: 'none',
                            background:
                              newCustomColMode === 'number'
                                ? 'var(--primary-color, #2563eb)'
                                : 'transparent',
                            color:
                              newCustomColMode === 'number'
                                ? '#ffffff'
                                : 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          លេខ
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCustomColMode('evaluation')}
                          style={{
                            padding: '0.26rem 0.42rem',
                            borderRadius: '5px',
                            border: 'none',
                            background:
                              newCustomColMode === 'evaluation' ? '#10b981' : 'transparent',
                            color:
                              newCustomColMode === 'evaluation'
                                ? '#ffffff'
                                : 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          វាយតម្លៃ
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingColumns || !newCustomColLabel.trim()}
                        style={{
                          padding: '0.38rem 0.65rem',
                          borderRadius: '7px',
                          border: 'none',
                          background: !newCustomColLabel.trim() ? '#94a3b8' : '#10b981',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: !newCustomColLabel.trim() ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        បន្ថែម
                      </button>
                    </div>
                  </form>

                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsColumnsDropdownOpen(false);
                        setIsAdminDefaultColsOpen(true);
                      }}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(79, 70, 229, 0.35)',
                        background: 'rgba(79, 70, 229, 0.08)',
                        color: '#4338ca',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.38rem',
                      }}
                      title="Admin កំណត់ Default និងលេខរៀង Col ទាំងអស់"
                    >
                      <AppIcon name="sliders" size={14} />
                      <span>កំណត់ Default & លេខរៀង Col (Admin)</span>
                    </button>
                  )}
                </div>,
                document.body
              )}
          </div>

          <SortDropdown 
            options={[
              { value: 'studentIdCode', label: 'អត្តលេខ' },
              { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
              { value: 'gender', label: 'ភេទ' },
              { value: 'effectiveLevel', label: 'វគ្គ' },
              { value: 'totalScore', label: 'ពិន្ទុសរុប' },
              { value: 'average', label: 'មធ្យមភាគ' },
              { value: 'rank', label: 'ចំណាត់ថ្នាក់' }
            ]}
            sortBy={scoreSortConfig?.key || 'fullName'}
            sortOrder={scoreSortConfig?.direction || 'asc'}
            onSortChange={(by, order) => {
              setScoreSortConfig({ key: by, direction: order });
            }}
          />

          <div style={{ position: 'relative' }} ref={clearPortal.containerRef}>
            <button 
              ref={clearPortal.triggerRef}
              type="button"
              onClick={() => setIsClearDropdownOpen(!isClearDropdownOpen)} 
              className="btn" 
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
              title="លុបទិន្នន័យតាមជួរឈរ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              លុបទិន្នន័យ
            </button>
            
            {isClearDropdownOpen && typeof document !== 'undefined' && createPortal(
              <div ref={clearPortal.menuRef} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} style={{
                ...clearPortal.menuStyle,
                background: 'var(--modal-bg, var(--main-bg))', border: '1px solid var(--border-color)', borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.22)', maxHeight: `${clearPortal.maxListHeight}px`, overflowY: 'auto', padding: '0.5rem 0',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ជ្រើសរើសជួរឈរត្រូវលុប</div>
                {activeSubjectColumns.map(col => (
                  <div 
                    key={col.key}
                    onClick={() => handleClearColumn(col.key, col.label, col.inputMode)}
                    style={{
                      padding: '0.45rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                      color: 'var(--danger)', transition: 'background 0.2s', fontSize: '0.86rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                      លុប {col.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                      {col.inputMode === 'evaluation' ? 'វាយតម្លៃ' : 'លេខ'}
                    </span>
                  </div>
                ))}

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.4rem 0' }}></div>
                <div style={{ padding: '0.3rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ជួរឈរវាយតម្លៃ ៣ (ខែនេះ)</div>
                {TRAIT_EVALUATION_COLUMNS.map(trait => (
                  <div
                    key={trait.key}
                    onClick={() => handleClearColumn(trait.key, `${trait.labelKh} (${trait.labelEn})`, 'trait')}
                    style={{
                      padding: '0.42rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem',
                      color: '#d97706', transition: 'background 0.2s', fontSize: '0.83rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    លុប {trait.labelKh}
                  </div>
                ))}

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                
                <div 
                  onClick={handleClearAllScores}
                  style={{
                    padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--danger)', transition: 'background 0.2s', fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  លុបពិន្ទុទាំងអស់ (Clear All Scores)
                </div>

                <div 
                  onClick={handleClearAll}
                  style={{
                    padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-secondary)', transition: 'background 0.2s', fontSize: '0.85rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="12"></line></svg>
                  លុបបញ្ជីឈ្មោះទាំងអស់ (Delete List)
                </div>
              </div>,
              document.body
            )}
          </div>

          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            បញ្ចូល (Import)
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />

          <button onClick={exportToCSV} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            ទាញយក Excel
          </button>
        </div>
      </div>

      {(() => {
        const sortGroupRows = (groupRows: any[]) =>
          [...groupRows].sort((a: any, b: any) => {
            if (!scoreSortConfig) {
              if (a.displayGender === 'ស្រី' && b.displayGender !== 'ស្រី') return -1;
              if (a.displayGender !== 'ស្រី' && b.displayGender === 'ស្រី') return 1;
              return (a.displayFullName || '').localeCompare(b.displayFullName || '', 'km');
            }
            const { key, direction } = scoreSortConfig;
            const resolveSortVal = (row: any) => {
              if (key === 'average') return row.dynAverage ?? row.average ?? '';
              if (key === 'rank') return row.dynRank ?? row.rank ?? '';
              if (key === 'fullName') return row.displayFullName ?? row.fullName ?? '';
              if (key === 'gender') return row.displayGender ?? row.gender ?? '';
              if (key === 'studentIdCode') return row.displayStudentCode ?? row.studentIdCode ?? '';
              return row[key] ?? '';
            };
            const aVal = resolveSortVal(a).toString();
            const bVal = resolveSortVal(b).toString();

            let comparison = 0;
            if (!isNaN(Number(aVal)) && !isNaN(Number(bVal)) && aVal !== '' && bVal !== '') {
              comparison = Number(aVal) - Number(bVal);
            } else {
              comparison = aVal.localeCompare(bVal, 'km', { numeric: true });
            }
            return direction === 'asc' ? comparison : -comparison;
          });

        const renderScoreTable = (group: {
          levelKey: string;
          levelLabel: string;
          currentCoeff: number;
          maxTotalScore: number;
          isCustomCoeff: boolean;
          rows: any[];
        }) => {
          const sortedScores = sortGroupRows(group.rows);
          const groupTotal = sortedScores.length;
          const groupFemale = sortedScores.filter((r: any) => (r.displayGender || r.gender) === 'ស្រី').length;
          const groupMale = groupTotal - groupFemale;
          const groupScored = sortedScores.filter((r: any) => r.totalScore !== '' && r.totalScore !== undefined && r.totalScore !== null);
          const groupPass = groupScored.filter((r: any) => r.dynGrade && r.dynGrade !== 'F').length;
          const groupFail = groupScored.length - groupPass;

          return (
            <div
              key={group.levelKey}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                border: computedScores.isSplitByLevel
                  ? '1.5px solid rgba(99, 102, 241, 0.35)'
                  : '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                marginBottom: computedScores.isSplitByLevel ? '1.35rem' : 0,
              }}
            >
              {computedScores.isSplitByLevel && group.levelKey !== '__ALL__' && (
                <div
                  style={{
                    padding: '0.8rem 1.1rem',
                    background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.1), rgba(59, 130, 246, 0.05))',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        background: group.levelKey === UNASSIGNED_LEVEL_LABEL ? '#64748b' : '#4f46e5',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      វគ្គ៖ {group.levelLabel}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      សរុប {groupTotal} នាក់
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 600 }}>
                      ស្រី {groupFemale}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                      ប្រុស {groupMale}
                    </span>
                    {groupScored.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        • លើមធ្យមភាគ {groupPass} | ក្រោម {groupFail}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openCoeffModal(group.levelKey)}
                      style={{
                        padding: '0.35rem 0.72rem',
                        borderRadius: '8px',
                        border: group.isCustomCoeff
                          ? '1px solid rgba(139, 92, 246, 0.45)'
                          : '1px solid var(--border-color)',
                        background: group.isCustomCoeff ? 'rgba(139, 92, 246, 0.14)' : 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      title={`កំណត់មេគុណដាច់ដោយឡែកសម្រាប់វគ្គ ${group.levelLabel}`}
                    >
                      <AppIcon name="hash" size={14} style={{ color: '#7c3aed' }} />
                      <span>មេគុណវគ្គនេះ: {Number(group.currentCoeff.toFixed(2))}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openAssignLevelModal(group.levelKey, [])}
                      style={{
                        padding: '0.35rem 0.72rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(14, 165, 233, 0.35)',
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0284c7',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <AppIcon name="users" size={14} />
                      <span>បញ្ចូលសិស្សមកវគ្គនេះ</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ល.រ</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>អត្តលេខ</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-secondary)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>ឈ្មោះសិស្ស</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ភេទ</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', minWidth: '72px' }}>វគ្គ</th>

                      {/* 3 Monthly Trait Evaluation Columns (Vertical upward Khmer-only header, same width as numeric score columns) */}
                      {TRAIT_EVALUATION_COLUMNS.map((trait) => (
                        <th
                          key={trait.key}
                          style={{
                            padding: '0.2rem 0.16rem',
                            textAlign: 'center',
                            color: '#0369a1',
                            background: 'rgba(14, 165, 233, 0.08)',
                            verticalAlign: 'bottom',
                            height: '118px',
                            width: '54px',
                            minWidth: '54px',
                            border: '1px solid var(--border-color)',
                          }}
                          title={`${trait.labelKh} • ចម្លងស្វ័យប្រវត្តិទៅខែបន្ទាប់ និងអាចកែប្រែតាមខែនីមួយៗ`}
                        >
                          <div
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              margin: '0 auto',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {trait.labelKh}
                          </div>
                        </th>
                      ))}

                      {/* Dynamic Subject Columns with Per-Header Mode Toggle (Optional/Custom first, locked Quiz/Exercise/Test at far right) */}
                      {activeSubjectColumns.map((col, idx) => {
                        const isEval = col.inputMode === 'evaluation';
                        const isFirstLocked =
                          col.isLocked && (idx === 0 || !activeSubjectColumns[idx - 1]?.isLocked);
                        return (
                          <th
                            key={col.key}
                            style={{
                              padding: '0.22rem 0.14rem',
                              textAlign: 'center',
                              color: isEval
                                ? '#047857'
                                : col.isLocked
                                  ? '#4338ca'
                                  : 'var(--text-secondary)',
                              background: isEval
                                ? 'rgba(16, 185, 129, 0.07)'
                                : col.isLocked
                                  ? 'rgba(99, 102, 241, 0.06)'
                                  : undefined,
                              verticalAlign: 'bottom',
                              height: '118px',
                              width: '54px',
                              minWidth: '54px',
                              border: '1px solid var(--border-color)',
                              borderLeft: isFirstLocked
                                ? '2px solid rgba(99, 102, 241, 0.35)'
                                : '1px solid var(--border-color)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: '100%',
                                gap: '0.26rem',
                              }}
                            >
                              <button
                                type="button"
                                disabled={isSavingColumns}
                                onClick={() => handleToggleColumnInputMode(col.key)}
                                className={`score-col-mode-btn${isEval ? ' is-eval' : ' is-num'}`}
                                title={
                                  isEval
                                    ? `${col.label}: កំពុងប្រើ ការវាយតម្លៃ — ចុចដើម្បីប្តូរទៅវាយលេខពិន្ទុ`
                                    : `${col.label}: កំពុងប្រើ ការវាយលេខពិន្ទុ — ចុចដើម្បីប្តូរទៅការវាយតម្លៃ`
                                }
                              >
                                {isEval ? 'វាយតម្លៃ' : '123'}
                              </button>

                              <div
                                style={{
                                  writingMode: 'vertical-rl',
                                  transform: 'rotate(180deg)',
                                  margin: '0 auto',
                                  fontSize: '0.8rem',
                                  fontWeight: isEval ? 700 : 600,
                                  maxHeight: '82px',
                                  overflow: 'hidden',
                                }}
                              >
                                {col.label}
                              </div>
                            </div>
                          </th>
                        );
                      })}

                      <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontWeight: 'bold' }}>ពិន្ទុសរុប</div>
                      </th>
                      <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0 auto" }}>មធ្យមភាគ</div>
                      </th>
                      <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>និទ្ទេស</div>
                      </th>
                      <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>ចំណាត់ថ្នាក់</div>
                      </th>
                      <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '80px', border: '1px solid var(--border-color)' }}>
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>មូលវិចារណ៍</div>
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ផ្សេងៗ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((scoreRec, index) => {
                      const displayFullName = scoreRec.displayFullName || scoreRec.fullName;
                      const displayGender = scoreRec.displayGender || scoreRec.gender;
                      const displayCode = scoreRec.displayStudentCode || scoreRec.studentIdCode || 'N/A';
                      const effectiveLevel = scoreRec.effectiveLevel || '';
                      return (
                        <tr key={scoreRec.id} data-score-row="1" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{index + 1}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{displayCode}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 9, background: 'var(--main-bg)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>{displayFullName}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', color: displayGender === 'ស្រី' ? '#ec4899' : 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{displayGender}</td>
                          <td style={{ padding: '0.35rem 0.45rem', textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>
                            <button
                              type="button"
                              onClick={() => openAssignLevelModal(effectiveLevel, [scoreRec.id])}
                              title={
                                scoreRec.isLevelOverridden
                                  ? `វគ្គបណ្តោះអាសន្នខែនេះ (វគ្គដើម៖ ${scoreRec.masterLevel || 'គ្មាន'}) — ចុចដើម្បីប្តូរ`
                                  : 'ចុចដើម្បីកំណត់ ឬប្តូរវគ្គបណ្តោះអាសន្នសម្រាប់ខែនេះ'
                              }
                              style={{
                                padding: '0.16rem 0.52rem',
                                borderRadius: '999px',
                                border: scoreRec.isLevelOverridden
                                  ? '1px solid rgba(124, 58, 237, 0.45)'
                                  : '1px solid rgba(59, 130, 246, 0.28)',
                                background: scoreRec.isLevelOverridden
                                  ? 'rgba(139, 92, 246, 0.14)'
                                  : effectiveLevel
                                    ? 'rgba(59, 130, 246, 0.1)'
                                    : 'rgba(148, 163, 184, 0.14)',
                                color: scoreRec.isLevelOverridden
                                  ? '#7c3aed'
                                  : effectiveLevel
                                    ? '#2563eb'
                                    : 'var(--text-secondary)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {effectiveLevel || '-'}
                            </button>
                          </td>
                          
                          {/* 3 Trait Evaluation Columns (Morality, Punctuality, Hygiene) */}
                          {TRAIT_EVALUATION_COLUMNS.map((trait) => {
                            const traitVal = normalizeEvaluationValue(scoreRec[trait.key]);
                            return (
                              <td
                                key={trait.key}
                                style={{
                                  padding: '0.2rem',
                                  textAlign: 'center',
                                  border: '1px solid var(--border-color)',
                                  background: 'rgba(14, 165, 233, 0.025)',
                                }}
                              >
                                <ScoreEvalDropdown
                                  value={traitVal}
                                  onChange={(nextVal) =>
                                    handleTraitChange(scoreRec, trait.key, nextVal)
                                  }
                                  title={
                                    scoreRec.traitsCopiedFrom && !scoreRec.traitsEdited?.[trait.key]
                                      ? `${trait.labelKh}${traitVal ? `: ${traitVal}` : ''} • ចម្លងស្វ័យប្រវត្តិពីខែ ${scoreRec.traitsCopiedFrom}`
                                      : `${trait.labelKh}${traitVal ? `: ${traitVal}` : ''}`
                                  }
                                />
                              </td>
                            );
                          })}

                          {/* Dynamic Subject Columns (Numeric Input OR System Evaluation Dropdown - Uniform Compact Width) */}
                          {activeSubjectColumns.map((col, colIndex) => {
                            const isFirstLocked =
                              col.isLocked &&
                              (colIndex === 0 || !activeSubjectColumns[colIndex - 1]?.isLocked);
                            const cellBorderLeft = isFirstLocked
                              ? '2px solid rgba(99, 102, 241, 0.3)'
                              : '1px solid var(--border-color)';

                            if (col.inputMode === 'evaluation') {
                              const evalVal = getColumnEvalValue(scoreRec, col.key);
                              return (
                                <td
                                  key={col.key}
                                  style={{
                                    padding: '0.2rem',
                                    textAlign: 'center',
                                    border: '1px solid var(--border-color)',
                                    borderLeft: cellBorderLeft,
                                    background: 'rgba(16, 185, 129, 0.025)',
                                  }}
                                >
                                  <ScoreEvalDropdown
                                    value={evalVal}
                                    onChange={(nextVal) =>
                                      handleSubjectEvalChange(scoreRec, col.key, nextVal)
                                    }
                                    title={`${col.label}${evalVal ? `: ${evalVal}` : ''}`}
                                  />
                                </td>
                              );
                            }

                            return (
                              <td
                                key={col.key}
                                style={{
                                  padding: '0.2rem',
                                  textAlign: 'center',
                                  border: '1px solid var(--border-color)',
                                  borderLeft: cellBorderLeft,
                                  background: col.isLocked
                                    ? 'rgba(99, 102, 241, 0.02)'
                                    : undefined,
                                }}
                              >
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  data-score-col={colIndex}
                                  value={getColumnNumericValue(scoreRec, col.key)}
                                  onChange={(e) => handleScoreChange(scoreRec, col.key, e.target.value)}
                                  onPaste={(e) => handlePaste(e, index, col.key, sortedScores)}
                                  onKeyDown={(e) => handleScoreCellKeyDown(e, colIndex)}
                                  onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.22)';
                                    e.currentTarget.select();
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  style={{
                                    width: '50px',
                                    padding: '0.25rem 0',
                                    textAlign: 'center',
                                    borderRadius: '4px',
                                    border: '1.5px solid transparent',
                                    background: 'var(--main-bg)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.12s, box-shadow 0.12s',
                                  }}
                                  placeholder=""
                                />
                              </td>
                            );
                          })}

                          {/* Total Score */}
                          <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)', width: '70px', minWidth: '70px' }}>
                            {scoreRec.totalScore || '-'}
                          </td>
                          
                          {/* Average */}
                          <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
                            {scoreRec.dynAverage || '-'}
                          </td>

                          {/* Grade */}
                          <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', border: '1px solid var(--border-color)' }}>
                            {scoreRec.dynGrade || "-"}
                          </td>

                          {/* Rank */}
                          <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b', border: '1px solid var(--border-color)' }}>
                            {scoreRec.dynRank || "-"}
                          </td>

                          {/* Remarks */}
                          <td style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', minWidth: '80px' }}>
                            {scoreRec.dynRemarks || '-'}
                          </td>

                          <td style={{ padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                            <button 
                              onClick={() => removeScoreRecord(scoreRec.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'transform 0.2s', opacity: 0.8 }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.opacity = '1'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.8'; }}
                              title="លុបចេញពីខែនេះ"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" x2="10" y1="11" y2="17"/>
                                <line x1="14" x2="14" y1="11" y2="17"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedScores.length === 0 && (
                      <tr>
                        <td colSpan={14 + activeSubjectColumns.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          មិនមានសិស្សក្នុងខែនេះទេ។ <br/><br/>
                          សូមចុចប៊ូតុង <b>"+"</b> នៅខាងលើដើម្បីទាញយកបញ្ជីឈ្មោះពីថ្នាក់រៀន។
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        if (computedScores.isSplitByLevel && computedScores.groups.length > 0) {
          return <div ref={scoreTableContainerRef}>{computedScores.groups.map((grp) => renderScoreTable(grp))}</div>;
        }
        if (!computedScores.groups[0]) return null;
        return <div ref={scoreTableContainerRef}>{renderScoreTable(computedScores.groups[0])}</div>;
      })()}

      {scores.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>សរុបស្ថិតិ</h3>
          {(() => {
            const rows = computedScores.rows;
            const totalStudents = rows.length;
            const femaleCount = rows.filter((s:any) => s.gender === 'ស្រី').length;
            
            const gradeStats = ['A', 'B', 'C', 'D', 'E', 'F'].map(g => {
              const studentsInGrade = rows.filter((s:any) => s.dynGrade === g && s.totalScore !== '');
              const count = studentsInGrade.length;
              const percent = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2).replace(/\.00$/, '') : '0';
              const fCount = studentsInGrade.filter((s:any) => s.gender === 'ស្រី').length;
              const fPercent = totalStudents > 0 ? ((fCount / totalStudents) * 100).toFixed(2).replace(/\.00$/, '') : '0';
              return { grade: g, count, percent, femaleCount: fCount, femalePercent: fPercent };
            });

            const absentStudents = rows.filter((s:any) => !s.totalScore || s.totalScore === '');
            const absentCount = absentStudents.length;
            const absentPercent = totalStudents > 0 ? ((absentCount / totalStudents) * 100).toFixed(2).replace(/\.00$/, '') : '0';
            const absentFemaleCount = absentStudents.filter((s:any) => s.gender === 'ស្រី').length;
            const absentFemalePercent = totalStudents > 0 ? ((absentFemaleCount / totalStudents) * 100).toFixed(2).replace(/\.00$/, '') : '0';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                <div style={{ marginBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                  ~ បញ្ឈប់បញ្ជីត្រឹមចំនួន <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{totalStudents}</span> នាក់ ក្នុងនោះ ស្រីចំនួន <span style={{ fontWeight: 'bold', color: '#ec4899' }}>{femaleCount}</span> នាក់
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                  {gradeStats.map(stat => {
                    let gradeColor = 'black';
                    if (stat.grade === 'A' || stat.grade === 'B') gradeColor = '#ef4444'; // Red
                    if (stat.grade === 'C') gradeColor = '#c026d3'; // Purple
                    if (stat.grade === 'D' || stat.grade === 'E') gradeColor = '#16a34a'; // Green
                    if (stat.grade === 'F') gradeColor = '#475569'; // Slate

                    return (
                      <div key={stat.grade}>
                        ~ និទ្ទេស<span style={{ fontWeight: 'bold', color: gradeColor, fontSize: '1.1rem' }}>{stat.grade}</span>: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{stat.count}</span>នាក់ <span style={{ fontWeight: 'bold', color: '#10b981' }}>{stat.percent}%</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                  ~ អវត្តមាន: <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{absentCount}</span> នាក់ <span style={{ fontWeight: 'bold', color: '#10b981' }}>{absentPercent}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        * គន្លឹះ៖ លោកអ្នកអាច Copy (Ctrl+C) ទិន្នន័យពី Excel រួច Paste (Ctrl+V) ចូលក្នុងប្រអប់ណាមួយ វាអានជាជួរស្វ័យប្រវត្តិ។ រាល់ការវាយបញ្ចូលនឹង Save ចូលប្រព័ន្ធដោយស្វ័យប្រវត្តិ។
      </p>
      {isCoeffModalOpen && typeof document !== 'undefined' && createPortal(
          <div onClick={() => { setIsCoeffModalOpen(false); setCoeffTargetLevel(null); }} style={{ position: 'fixed', inset: 0, zIndex: 20030, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.58)', backdropFilter: 'blur(5px)' }}>
            <form onSubmit={handleSaveClassMonthCoeff} onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '1.5rem', background: 'var(--modal-bg)', width: '100%', maxWidth: '450px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>កំណត់មេគុណ (Coefficient)</h2>
                  <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span style={{ padding: '0.18rem 0.55rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.14)', color: '#2563eb', fontSize: '0.76rem', fontWeight: 700 }}>
                      ថ្នាក់៖ {selectedClass?.className || 'N/A'}
                    </span>
                    {coeffTargetLevel && (
                      <span style={{ padding: '0.18rem 0.55rem', borderRadius: '999px', background: 'rgba(79, 70, 229, 0.16)', color: '#4f46e5', fontSize: '0.76rem', fontWeight: 700 }}>
                        វគ្គ៖ {coeffTargetLevel}
                      </span>
                    )}
                    <span style={{ padding: '0.18rem 0.55rem', borderRadius: '999px', background: 'rgba(139, 92, 246, 0.14)', color: '#7c3aed', fontSize: '0.76rem', fontWeight: 700 }}>
                      ខែ៖ {selectedMonth}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => { setIsCoeffModalOpen(false); setCoeffTargetLevel(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
                  <AppIcon name="x" size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {coeffTargetLevel
                  ? <>មេគុណនេះត្រូវបានរក្សាទុកដាច់ដោយឡែកសម្រាប់ <b>វគ្គ {coeffTargetLevel}</b> ក្នុងថ្នាក់ និងខែនេះប៉ុណ្ណោះ។</>
                  : <>មេគុណនេះត្រូវបានរក្សាទុកដាច់ដោយឡែកសម្រាប់ <b>ថ្នាក់ និងខែនេះ</b> ប៉ុណ្ណោះ ដោយមិនប៉ះពាល់ដល់ថ្នាក់ផ្សេង ឬខែផ្សេងឡើយ។</>}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer', padding: '0.75rem', borderRadius: '12px', border: coeffTypeDraft !== 'custom' ? '1.5px solid var(--primary-color, #3b82f6)' : '1px solid var(--border-color)', background: coeffTypeDraft !== 'custom' ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-secondary)' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={coeffTypeDraft !== 'custom'}
                    style={{ marginTop: '0.2rem' }}
                    onChange={() => setCoeffTypeDraft('auto')} 
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>1. ផ្អែកតាមពិន្ទុអតិបរមាក្នុងបញ្ជី (ស្វ័យប្រវត្តិ)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      មេគុណ = (ពិន្ទុសរុបអតិបរមា + 5) ចែកនឹង ៥០ → <b>{Number(computeClassCoeffValue(
                        coeffTargetLevel
                          ? computedScores.groups.find((g) => g.levelKey === coeffTargetLevel)?.rows || scores
                          : scores,
                        { coefficientType: 'auto', customMaxScore: 250 }
                      ).currentCoeff.toFixed(2))}</b>
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer', padding: '0.75rem', borderRadius: '12px', border: coeffTypeDraft === 'custom' ? '1.5px solid #7c3aed' : '1px solid var(--border-color)', background: coeffTypeDraft === 'custom' ? 'rgba(139, 92, 246, 0.07)' : 'var(--bg-secondary)' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={coeffTypeDraft === 'custom'}
                    style={{ marginTop: '0.2rem' }}
                    onChange={() => setCoeffTypeDraft('custom')} 
                  />
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>2. កំណត់ពិន្ទុអតិបរមាផ្ទាល់សម្រាប់{coeffTargetLevel ? `វគ្គ ${coeffTargetLevel}` : 'ថ្នាក់/ខែនេះ'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      មេគុណ = ពិន្ទុអតិបរមា ÷ ៥០ →{' '}
                      <b>{Number(((parseFloat(customMaxDraft) > 0 ? parseFloat(customMaxDraft) : 250) / 50).toFixed(2))}</b>
                    </div>
                    {coeffTypeDraft === 'custom' && (
                      <input 
                        type="number"
                        step="any"
                        min="1"
                        value={customMaxDraft} 
                        onChange={e => setCustomMaxDraft(e.target.value)}
                        placeholder="ឧ. 250 ឬ 300"
                        style={{ marginTop: '0.6rem', width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)', fontWeight: 700, boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { setIsCoeffModalOpen(false); setCoeffTargetLevel(null); }} style={{ padding: '0.6rem 1.1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>បោះបង់</button>
                  <button type="submit" disabled={isSavingCoeff} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary-color, #3b82f6)', color: 'white', border: 'none', borderRadius: '10px', cursor: isSavingCoeff ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                    {isSavingCoeff ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </div>
            </form>
          </div>,
          document.body
        )}
      <AssignScoreLevelModal
        isOpen={isAssignLevelOpen}
        onClose={() => setIsAssignLevelOpen(false)}
        classNameLabel={selectedClass?.className || selectedClass?.classCode || ''}
        selectedMonth={selectedMonth}
        students={assignableStudents}
        suggestedLevels={suggestedLevelsForModal}
        initialTargetLevel={assignInitialLevel}
        initialSelectedScoreIds={assignInitialScoreIds}
        onAssignLevel={handleAssignStudentsToLevel}
      />
      {isCreateFinalExamOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <form
              onSubmit={handleCreateFinalExamSubmit}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.35rem',
                width: '100%',
                maxWidth: '470px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(124, 58, 237, 0.14)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon name="award" size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      បង្កើតការប្រឡងបញ្ចប់វគ្គសិក្សា
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      បញ្ចូលពិន្ទុដោយឡែកសម្រាប់ចេញវិញ្ញាបនបត្រ ១ ថ្នាក់
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFinalExamOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <AppIcon name="x" size={18} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                  ឈ្មោះការប្រឡង / វគ្គ *
                </label>
                <input
                  type="text"
                  required
                  value={newFinalTitle}
                  onChange={(e) => setNewFinalTitle(e.target.value)}
                  placeholder="ឧ. ប្រឡងបញ្ចប់វគ្គ Team Together 03"
                  style={{ width: '100%', padding: '0.55rem 0.72rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                    សម្រាប់ថ្នាក់រៀន
                  </label>
                  <select
                    value={newFinalClassId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setNewFinalClassId(cid);
                      const cls = classes.find((c) => c.id === cid);
                      if (cls) {
                        setNewFinalTitle(`ប្រឡងបញ្ចប់វគ្គ (${cls.classCode || cls.className})`);
                        const bLvl = Array.isArray(cls.books) && cls.books[0]?.level ? String(cls.books[0].level) : '';
                        if (bLvl) setNewFinalLevel(bLvl);
                      }
                    }}
                    style={{ width: '100%', padding: '0.52rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">-- គ្រប់ថ្នាក់ --</option>
                    {displayClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.classCode ? `${c.classCode} - ` : ''}{c.className}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                    កាលបរិច្ឆេទប្រឡង / ចេញប័ណ្ណ
                  </label>
                  <input
                    type="date"
                    value={newFinalDate}
                    onChange={(e) => setNewFinalDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                    វគ្គសិក្សា (ខ្មែរ)
                  </label>
                  <input
                    type="text"
                    value={newFinalCourseKh}
                    onChange={(e) => setNewFinalCourseKh(e.target.value)}
                    placeholder="ភាសាអង់គ្លេស"
                    style={{ width: '100%', padding: '0.52rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                    Course Name (English)
                  </label>
                  <input
                    type="text"
                    value={newFinalCourseEn}
                    onChange={(e) => setNewFinalCourseEn(e.target.value)}
                    placeholder="English Course"
                    style={{ width: '100%', padding: '0.52rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.28rem' }}>
                  កម្រិត / សៀវភៅ (Level - ស្រេចចិត្ត)
                </label>
                <input
                  type="text"
                  value={newFinalLevel}
                  onChange={(e) => setNewFinalLevel(e.target.value)}
                  placeholder="ឧ. Team Together 03"
                  style={{ width: '100%', padding: '0.52rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              {newFinalClassId && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.08)', padding: '0.55rem 0.7rem', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    checked={newFinalAutoImport}
                    onChange={(e) => setNewFinalAutoImport(e.target.checked)}
                  />
                  <span>ទាញយកឈ្មោះសិស្សទាំងអស់ក្នុងថ្នាក់នេះចូលដោយស្វ័យប្រវត្តិ</span>
                </label>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateFinalExamOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '9px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFinalExam || !newFinalTitle.trim()}
                  style={{ padding: '0.55rem 1.2rem', borderRadius: '9px', border: 'none', background: isCreatingFinalExam ? '#64748b' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#ffffff', fontWeight: 700, cursor: isCreatingFinalExam ? 'wait' : 'pointer' }}
                >
                  {isCreatingFinalExam ? 'កំពុងបង្កើត...' : 'បង្កើត & បញ្ចូលពិន្ទុ'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
      <ScoresGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      {monthlyResultModal}
      {honorRollModal}
      {certificateModal}
      {adminDefaultColsModal}
    </div>
  );
}
