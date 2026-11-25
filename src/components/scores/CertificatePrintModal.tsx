"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ENGLISH_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { photoFrameTemplateService, scoreCoefficientService, scoreService, settingsService } from '@/services/db';
import { uploadCertificateFrame } from '@/services/db/StorageService';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import {
  A4_PORTRAIT_SPEC,
  MonthlyResultClassPacket,
  computeMonthlyResultPacketsForClass,
  resolveSheetAssetSrc,
} from './MonthlyResultSheet';
import {
  A4_LANDSCAPE_SPEC,
  A5_LANDSCAPE_SPEC,
  CERTIFICATE_FRAME_PRESETS,
  CertificateDesignConfig,
  CertificateDocType,
  CertificatePairA4Page,
  CertificatePrintPaperMode,
  CertificateRecipient,
  CertificateSingleA4LandscapePage,
  CertificateSingleA5Page,
  DEFAULT_CERTIFICATE_DESIGN,
  DEFAULT_CERTIFICATE_MARGINS_CM,
  DEFAULT_COURSE_CERTIFICATE_DESIGN,
  FrameMarginsCm,
  formatCertPlaceDateDefault,
  formatConductedDateDefault,
  formatExamLabelsFromMonthStr,
  formatIssuedDateDefault,
  normalizeCertificateDesign,
} from './CertificateSheet';
import CertificateDesignEditor, {
  SavedCertificateDesignTemplate,
} from './CertificateDesignEditor';
import { AppIcon } from '../AppIcons';

export interface SavedCustomFrameLink {
  id: string;
  label: string;
  url: string;
}

export interface FinalExamSessionSummary {
  id: string;
  title: string;
  classId?: string;
  courseNameKh?: string;
  courseNameEn?: string;
  levelName?: string;
  examDate?: string;
}

export interface CertificateBrandingConfig {
  certDocType?: CertificateDocType;
  certFramePresetId?: string;
  certFrameUrl?: string;
  certCustomFrames?: SavedCustomFrameLink[];
  certTopLogoUrl?: string;
  certSavedTopLogos?: SavedCustomFrameLink[];
  certFrameMarginsCm?: FrameMarginsCm;
  certDesignConfig?: CertificateDesignConfig;
  certCertificateFramePresetId?: string;
  certCertificateFrameUrl?: string;
  certCertificateFrameMarginsCm?: FrameMarginsCm;
  certCertificateDesignConfig?: CertificateDesignConfig;
  certCertificateDesignTemplates?: SavedCertificateDesignTemplate[];
  certCertificateActiveDesignId?: string | null;
  certCertificateShowStudentPhoto?: boolean;
  certCertificatePrincipalTitle?: string;
  certCertificateStampUrl?: string;
  certCertificateSignatureUrl?: string;
  certCertificateSignatoryName?: string;
  certMinistryLogoUrl?: string;
  certSavedMinistryLogos?: SavedCustomFrameLink[];
  certProvinceKh?: string;
  certDeptKh?: string;
  certCourseNameKh?: string;
  certCourseNameEn?: string;
  certPlaceDateText?: string;
  certStartNumber?: number;
  certDesignTemplates?: SavedCertificateDesignTemplate[];
  certActiveDesignId?: string | null;
  certShowStudentPhoto?: boolean;
  certPrincipalTitle?: string;
  resultStampUrl?: string;
  resultSignatureUrl?: string;
  resultSignatoryName?: string;
}

export type RankRangeMode = 'top3' | 'top5' | 'passed' | 'manual';

export interface CertificatePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  allStudents: any[];
  allTeachers: any[];
  allScores: any[];
  monthCoeffMap: Record<string, any>;
  scoreSettings: any;
  selectedMonth: string;
  monthlyMonth?: string;
  finalExamSessions?: FinalExamSessionSummary[];
  onMonthChange: (newMonth: string) => void;
  onCreateFinalExam?: () => void;
  monthExtraData?: {
    monthKhmer?: string;
    monthEnglish?: string;
    issueDateEnglish?: string;
  };
  initialClassId?: string | null;
  initialDocType?: CertificateDocType;
  finalExamTitle?: string;
  finalExamCourseKh?: string;
  finalExamCourseEn?: string;
  finalExamDate?: string;
  onSaveSettings?: (patch: CertificateBrandingConfig) => Promise<void>;
}

function isoDateToConductedFormat(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [yyyy, mm, dd] = iso.split('-');
  const monShort = (ENGLISH_MONTH_NAMES[Number(mm) - 1] || 'Jan').slice(0, 3);
  return `${dd}/${monShort}/${yyyy}`;
}

function isoDateToIssuedFormat(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [yyyy, mm, dd] = iso.split('-');
  const monFull = ENGLISH_MONTH_NAMES[Number(mm) - 1] || 'January';
  return `${dd}-${monFull}-${yyyy}`;
}

export default function CertificatePrintModal({
  isOpen,
  onClose,
  classes,
  allStudents,
  allTeachers,
  allScores,
  monthCoeffMap,
  scoreSettings,
  selectedMonth,
  monthlyMonth,
  finalExamSessions = [],
  onMonthChange,
  onCreateFinalExam,
  monthExtraData,
  initialClassId,
  initialDocType,
  finalExamTitle,
  finalExamCourseKh,
  finalExamCourseEn,
  finalExamDate,
  onSaveSettings,
}: CertificatePrintModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [docType, setDocType] = useState<CertificateDocType>('praise');
  const [praiseMonth, setPraiseMonth] = useState<string>(() => {
    if (monthlyMonth && /^\d{4}-\d{2}$/.test(monthlyMonth)) return monthlyMonth;
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) return selectedMonth;
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  const [selectedFinalExamId, setSelectedFinalExamId] = useState<string>('');
  const [modalScores, setModalScores] = useState<any[]>([]);
  const [modalCoeffMap, setModalCoeffMap] = useState<Record<string, any>>({});
  const [isLoadingModalScores, setIsLoadingModalScores] = useState<boolean>(false);
  const lastAutoSelectedKeyRef = useRef<string>('');

  const [rankMode, setRankMode] = useState<RankRangeMode>('top3');
  const [splitBehavior, setSplitBehavior] = useState<'auto' | 'always' | 'never'>('auto');
  const [paperMode, setPaperMode] = useState<CertificatePrintPaperMode>('a4_two_up');
  const [praiseShowStudentPhoto, setPraiseShowStudentPhoto] = useState<boolean>(false);
  const [certShowStudentPhoto, setCertShowStudentPhoto] = useState<boolean>(true);
  const showStudentPhoto = docType === 'certificate' ? certShowStudentPhoto : praiseShowStudentPhoto;
  const setShowStudentPhoto = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      if (docType === 'certificate') {
        setCertShowStudentPhoto((prev) => (typeof next === 'function' ? next(prev) : next));
      } else {
        setPraiseShowStudentPhoto((prev) => (typeof next === 'function' ? next(prev) : next));
      }
    },
    [docType]
  );
  const [showCutGuide, setShowCutGuide] = useState<boolean>(true);

  // Manual student inclusion/exclusion overrides
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [excludedUids, setExcludedUids] = useState<string[]>([]);
  const [manualPickedUids, setManualPickedUids] = useState<string[]>([]);

  // Frame template & links (separate active preset/url/margins per docType; shared image bank)
  const [praiseFramePresetId, setPraiseFramePresetId] = useState<string>(CERTIFICATE_FRAME_PRESETS[0].id);
  const [certFramePresetId, setCertFramePresetId] = useState<string>(CERTIFICATE_FRAME_PRESETS[1].id);
  const framePresetId = docType === 'certificate' ? certFramePresetId : praiseFramePresetId;
  const setFramePresetId = useCallback(
    (next: string) => {
      if (docType === 'certificate') setCertFramePresetId(next);
      else setPraiseFramePresetId(next);
    },
    [docType]
  );

  const [praiseCustomFrameUrl, setPraiseCustomFrameUrl] = useState<string>('');
  const [certCustomFrameUrl, setCertCustomFrameUrl] = useState<string>('');
  const customFrameUrl = docType === 'certificate' ? certCustomFrameUrl : praiseCustomFrameUrl;
  const setCustomFrameUrl = useCallback(
    (next: string) => {
      if (docType === 'certificate') setCertCustomFrameUrl(next);
      else setPraiseCustomFrameUrl(next);
    },
    [docType]
  );

  const [savedCustomFrames, setSavedCustomFrames] = useState<SavedCustomFrameLink[]>([]);
  const [newFrameLabel, setNewFrameLabel] = useState<string>('');
  const [savedTopLogos, setSavedTopLogos] = useState<SavedCustomFrameLink[]>([]);
  const [newTopLogoLabel, setNewTopLogoLabel] = useState<string>('');
  const [isUploadingTopLogo, setIsUploadingTopLogo] = useState<boolean>(false);
  const topLogoUploadInputRef = useRef<HTMLInputElement>(null);
  const [savedMinistryLogos, setSavedMinistryLogos] = useState<SavedCustomFrameLink[]>([]);
  const [newMinistryLogoLabel, setNewMinistryLogoLabel] = useState<string>('');
  const [isUploadingMinistryLogo, setIsUploadingMinistryLogo] = useState<boolean>(false);
  const ministryLogoUploadInputRef = useRef<HTMLInputElement>(null);
  const [courseNameKh, setCourseNameKh] = useState<string>('ភាសាអង់គ្លេស');
  const [courseNameEn, setCourseNameEn] = useState<string>('English Course');
  const [provinceKh, setProvinceKh] = useState<string>('ខេត្តកណ្តាល');
  const [deptKh, setDeptKh] = useState<string>('មន្ទីរអប់រំ យុវជន និងកីឡា');
  const [certPlaceDateText, setCertPlaceDateText] = useState<string>(() => formatCertPlaceDateDefault('Kandal'));
  const [certStartNumber, setCertStartNumber] = useState<number>(1);
  const [studioFrameTemplates, setStudioFrameTemplates] = useState<SavedCustomFrameLink[]>([]);

  const [praiseMarginsCm, setPraiseMarginsCm] = useState<FrameMarginsCm>(DEFAULT_CERTIFICATE_MARGINS_CM);
  const [certMarginsCm, setCertMarginsCm] = useState<FrameMarginsCm>(DEFAULT_CERTIFICATE_MARGINS_CM);
  const frameMarginsCm = docType === 'certificate' ? certMarginsCm : praiseMarginsCm;
  const setFrameMarginsCm = useCallback(
    (next: FrameMarginsCm | ((prev: FrameMarginsCm) => FrameMarginsCm)) => {
      if (docType === 'certificate') {
        setCertMarginsCm((prev) => (typeof next === 'function' ? next(prev) : next));
      } else {
        setPraiseMarginsCm((prev) => (typeof next === 'function' ? next(prev) : next));
      }
    },
    [docType]
  );

  const [uniformMargins, setUniformMargins] = useState<boolean>(true);
  const [isUploadingFrames, setIsUploadingFrames] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const frameUploadInputRef = useRef<HTMLInputElement>(null);

  // Praise Monthly text & Praise Footer vs Certificate Footer (strictly separated)
  const defaultExam = useMemo(
    () => formatExamLabelsFromMonthStr(praiseMonth, monthExtraData?.monthKhmer),
    [praiseMonth, monthExtraData?.monthKhmer]
  );
  const [examKhmer, setExamKhmer] = useState<string>(defaultExam.examKhmer);
  const [examEnglish, setExamEnglish] = useState<string>(defaultExam.examEnglish);
  const [conductedDate, setConductedDate] = useState<string>(formatConductedDateDefault());
  const [issuedDate, setIssuedDate] = useState<string>(
    String(monthExtraData?.issueDateEnglish || '').trim() || formatIssuedDateDefault()
  );
  const [praiseStampUrl, setPraiseStampUrl] = useState<string>('');
  const [praiseSignatureUrl, setPraiseSignatureUrl] = useState<string>('');
  const [praiseSignatoryName, setPraiseSignatoryName] = useState<string>('សំរិត វឌ្ឍនៈ');
  const [praisePrincipalTitle, setPraisePrincipalTitle] = useState<string>('The Principal of BSIS');

  const [certStampUrl, setCertStampUrl] = useState<string>('');
  const [certSignatureUrl, setCertSignatureUrl] = useState<string>('');
  const [certSignatoryName, setCertSignatoryName] = useState<string>('សំរិត វឌ្ឍនៈ');
  const [certPrincipalTitle, setCertPrincipalTitle] = useState<string>('The principal of BSIS');

  const stampUrl = docType === 'certificate' ? certStampUrl : praiseStampUrl;
  const setStampUrl = useCallback(
    (v: string) => (docType === 'certificate' ? setCertStampUrl(v) : setPraiseStampUrl(v)),
    [docType]
  );
  const signatureUrl = docType === 'certificate' ? certSignatureUrl : praiseSignatureUrl;
  const setSignatureUrl = useCallback(
    (v: string) => (docType === 'certificate' ? setCertSignatureUrl(v) : setPraiseSignatureUrl(v)),
    [docType]
  );
  const signatoryName = docType === 'certificate' ? certSignatoryName : praiseSignatoryName;
  const setSignatoryName = useCallback(
    (v: string) => (docType === 'certificate' ? setCertSignatoryName(v) : setPraiseSignatoryName(v)),
    [docType]
  );
  const principalTitle = docType === 'certificate' ? certPrincipalTitle : praisePrincipalTitle;
  const setPrincipalTitle = useCallback(
    (v: string) => (docType === 'certificate' ? setCertPrincipalTitle(v) : setPraisePrincipalTitle(v)),
    [docType]
  );

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'preview' | 'design'>('preview');
  const [praiseDesignConfig, setPraiseDesignConfig] = useState<CertificateDesignConfig>(DEFAULT_CERTIFICATE_DESIGN);
  const [courseDesignConfig, setCourseDesignConfig] = useState<CertificateDesignConfig>(DEFAULT_COURSE_CERTIFICATE_DESIGN);
  const activeDefaultDesign =
    docType === 'certificate' ? DEFAULT_COURSE_CERTIFICATE_DESIGN : DEFAULT_CERTIFICATE_DESIGN;
  const designConfig = docType === 'certificate' ? courseDesignConfig : praiseDesignConfig;
  const setDesignConfig = useCallback(
    (nextOrFn: CertificateDesignConfig | ((prev: CertificateDesignConfig) => CertificateDesignConfig)) => {
      if (docType === 'certificate') {
        setCourseDesignConfig((prev) =>
          typeof nextOrFn === 'function' ? nextOrFn(prev) : nextOrFn
        );
      } else {
        setPraiseDesignConfig((prev) =>
          typeof nextOrFn === 'function' ? nextOrFn(prev) : nextOrFn
        );
      }
    },
    [docType]
  );
  const [praiseDesignTemplates, setPraiseDesignTemplates] = useState<SavedCertificateDesignTemplate[]>([]);
  const [certDesignTemplates, setCertDesignTemplates] = useState<SavedCertificateDesignTemplate[]>([]);
  const savedDesignTemplates = docType === 'certificate' ? certDesignTemplates : praiseDesignTemplates;
  const setSavedDesignTemplates = useCallback(
    (next: SavedCertificateDesignTemplate[] | ((prev: SavedCertificateDesignTemplate[]) => SavedCertificateDesignTemplate[])) => {
      if (docType === 'certificate') {
        setCertDesignTemplates((prev) => (typeof next === 'function' ? next(prev) : next));
      } else {
        setPraiseDesignTemplates((prev) => (typeof next === 'function' ? next(prev) : next));
      }
    },
    [docType]
  );
  const [praiseActiveDesignId, setPraiseActiveDesignId] = useState<string | null>(null);
  const [certActiveDesignId, setCertActiveDesignId] = useState<string | null>(null);
  const activeDesignTemplateId = docType === 'certificate' ? certActiveDesignId : praiseActiveDesignId;
  const setActiveDesignTemplateId = useCallback(
    (next: string | null) => {
      if (docType === 'certificate') setCertActiveDesignId(next);
      else setPraiseActiveDesignId(next);
    },
    [docType]
  );
  const [isSavingDesignTemplate, setIsSavingDesignTemplate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileInfo>(DEFAULT_SCHOOL_PROFILE);

  // Active exam session strictly separated: Praise = monthly (YYYY-MM), Certificate = final exam (FINAL_...)
  const activeExamDataKey = docType === 'certificate' ? selectedFinalExamId : praiseMonth;
  const activeFinalSession = useMemo(
    () => finalExamSessions.find((s) => s.id === selectedFinalExamId) || null,
    [finalExamSessions, selectedFinalExamId]
  );
  const effectiveScores = activeExamDataKey && activeExamDataKey === selectedMonth ? allScores : modalScores;
  const effectiveCoeffMap = activeExamDataKey && activeExamDataKey === selectedMonth ? monthCoeffMap : modalCoeffMap;

  // Sync defaults from scoreSettings & monthExtraData when opened
  useEffect(() => {
    if (!isOpen) return;
    const isFinalSessionActive = String(selectedMonth || '').startsWith('FINAL_');
    const resolvedDocType: CertificateDocType =
      initialDocType ||
      (isFinalSessionActive
        ? 'certificate'
        : scoreSettings?.certDocType === 'certificate'
          ? 'certificate'
          : 'praise');
    setDocType(resolvedDocType);
    setRankMode(resolvedDocType === 'certificate' ? 'passed' : 'top3');

    const resolvedPraiseMonth =
      monthlyMonth && /^\d{4}-\d{2}$/.test(monthlyMonth)
        ? monthlyMonth
        : selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)
          ? selectedMonth
          : praiseMonth;
    setPraiseMonth(resolvedPraiseMonth);

    const matchedInitialFinalId = isFinalSessionActive
      ? selectedMonth
      : (initialClassId && finalExamSessions.find((s) => s.classId === initialClassId)?.id) ||
        finalExamSessions[0]?.id ||
        '';
    setSelectedFinalExamId(matchedInitialFinalId);
    lastAutoSelectedKeyRef.current = '';

    setPraiseFramePresetId(scoreSettings?.certFramePresetId || CERTIFICATE_FRAME_PRESETS[0].id);
    setCertFramePresetId(scoreSettings?.certCertificateFramePresetId || CERTIFICATE_FRAME_PRESETS[1].id);
    setPraiseCustomFrameUrl(scoreSettings?.certFrameUrl || '');
    setCertCustomFrameUrl(scoreSettings?.certCertificateFrameUrl || '');
    setSavedCustomFrames(Array.isArray(scoreSettings?.certCustomFrames) ? scoreSettings.certCustomFrames : []);
    setSavedTopLogos(Array.isArray(scoreSettings?.certSavedTopLogos) ? scoreSettings.certSavedTopLogos : []);
    setSavedMinistryLogos(Array.isArray(scoreSettings?.certSavedMinistryLogos) ? scoreSettings.certSavedMinistryLogos : []);

    const restoredPraise = normalizeCertificateDesign(scoreSettings?.certDesignConfig, DEFAULT_CERTIFICATE_DESIGN);
    if (!restoredPraise.topLogoUrl && scoreSettings?.certTopLogoUrl) {
      restoredPraise.topLogoUrl = String(scoreSettings.certTopLogoUrl);
    }
    setPraiseDesignConfig(restoredPraise);

    const restoredCourse = normalizeCertificateDesign(
      scoreSettings?.certCertificateDesignConfig,
      DEFAULT_COURSE_CERTIFICATE_DESIGN
    );
    if (!restoredCourse.topLogoUrl && scoreSettings?.certTopLogoUrl) {
      restoredCourse.topLogoUrl = String(scoreSettings.certTopLogoUrl);
    }
    if (!restoredCourse.ministryLogoUrl && scoreSettings?.certMinistryLogoUrl) {
      restoredCourse.ministryLogoUrl = String(scoreSettings.certMinistryLogoUrl);
    }
    setCourseDesignConfig(restoredCourse);

    const activeFinalObj = finalExamSessions.find((s) => s.id === matchedInitialFinalId);
    setProvinceKh(scoreSettings?.certProvinceKh || restoredCourse.certProvinceKh || 'ខេត្តកណ្តាល');
    setDeptKh(scoreSettings?.certDeptKh || restoredCourse.certDeptKh || 'មន្ទីរអប់រំ យុវជន និងកីឡា');
    setCourseNameKh(activeFinalObj?.courseNameKh || finalExamCourseKh || scoreSettings?.certCourseNameKh || 'ភាសាអង់គ្លេស');
    setCourseNameEn(activeFinalObj?.courseNameEn || finalExamCourseEn || scoreSettings?.certCourseNameEn || 'English Course');

    const resolvedFinalDate = activeFinalObj?.examDate || finalExamDate;
    if (resolvedFinalDate && /^\d{4}-\d{2}-\d{2}$/.test(resolvedFinalDate)) {
      const [fy, fm, fd] = resolvedFinalDate.split('-').map(Number);
      setCertPlaceDateText(formatCertPlaceDateDefault('Kandal', new Date(fy, (fm || 1) - 1, fd || 1)));
    } else {
      setCertPlaceDateText(scoreSettings?.certPlaceDateText || formatCertPlaceDateDefault('Kandal'));
    }
    setCertStartNumber(
      Number(scoreSettings?.certStartNumber) >= 1 ? Math.floor(Number(scoreSettings.certStartNumber)) : 1
    );

    const legacyTemplates: SavedCertificateDesignTemplate[] = Array.isArray(scoreSettings?.certDesignTemplates)
      ? scoreSettings.certDesignTemplates
      : [];
    const separatedPraiseTemplates = legacyTemplates.filter((t) => (t?.docType || 'praise') !== 'certificate');
    const explicitCertTemplates: SavedCertificateDesignTemplate[] = Array.isArray(
      scoreSettings?.certCertificateDesignTemplates
    )
      ? scoreSettings.certCertificateDesignTemplates
      : [];
    const legacyCertTemplates = legacyTemplates.filter((t) => t?.docType === 'certificate');
    const mergedCertTemplatesMap = new Map<string, SavedCertificateDesignTemplate>();
    [...legacyCertTemplates, ...explicitCertTemplates].forEach((t) => {
      if (t?.id) mergedCertTemplatesMap.set(t.id, t);
    });
    setPraiseDesignTemplates(separatedPraiseTemplates);
    setCertDesignTemplates(Array.from(mergedCertTemplatesMap.values()));
    setPraiseActiveDesignId(scoreSettings?.certActiveDesignId || null);
    setCertActiveDesignId(scoreSettings?.certCertificateActiveDesignId || null);

    const parseMargins = (rawM: any): FrameMarginsCm => {
      if (rawM && typeof rawM === 'object') {
        return {
          top: Number(rawM.top) > 0 ? Number(rawM.top) : DEFAULT_CERTIFICATE_MARGINS_CM.top,
          right: Number(rawM.right) > 0 ? Number(rawM.right) : DEFAULT_CERTIFICATE_MARGINS_CM.right,
          bottom: Number(rawM.bottom) > 0 ? Number(rawM.bottom) : DEFAULT_CERTIFICATE_MARGINS_CM.bottom,
          left: Number(rawM.left) > 0 ? Number(rawM.left) : DEFAULT_CERTIFICATE_MARGINS_CM.left,
        };
      }
      return DEFAULT_CERTIFICATE_MARGINS_CM;
    };
    const pMargins = parseMargins(scoreSettings?.certFrameMarginsCm);
    const cMargins = parseMargins(scoreSettings?.certCertificateFrameMarginsCm || scoreSettings?.certFrameMarginsCm);
    setPraiseMarginsCm(pMargins);
    setCertMarginsCm(cMargins);
    const activeM = resolvedDocType === 'certificate' ? cMargins : pMargins;
    setUniformMargins(activeM.top === activeM.right && activeM.top === activeM.bottom && activeM.top === activeM.left);

    setPraiseShowStudentPhoto(Boolean(scoreSettings?.certShowStudentPhoto));
    setCertShowStudentPhoto(
      scoreSettings?.certCertificateShowStudentPhoto !== undefined
        ? Boolean(scoreSettings.certCertificateShowStudentPhoto)
        : true
    );

    // Separate footers for Praise Letter vs Course Certificate
    setPraisePrincipalTitle(scoreSettings?.certPrincipalTitle || 'The Principal of BSIS');
    setPraiseStampUrl(scoreSettings?.resultStampUrl || '');
    setPraiseSignatureUrl(scoreSettings?.resultSignatureUrl || '');
    setPraiseSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');

    setCertPrincipalTitle(
      scoreSettings?.certCertificatePrincipalTitle !== undefined
        ? String(scoreSettings.certCertificatePrincipalTitle)
        : scoreSettings?.certPrincipalTitle || 'The principal of BSIS'
    );
    setCertStampUrl(
      scoreSettings?.certCertificateStampUrl !== undefined
        ? String(scoreSettings.certCertificateStampUrl)
        : scoreSettings?.resultStampUrl || ''
    );
    setCertSignatureUrl(
      scoreSettings?.certCertificateSignatureUrl !== undefined
        ? String(scoreSettings.certCertificateSignatureUrl)
        : scoreSettings?.resultSignatureUrl || ''
    );
    setCertSignatoryName(
      scoreSettings?.certCertificateSignatoryName !== undefined
        ? String(scoreSettings.certCertificateSignatoryName)
        : scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ'
    );

    const examLabels = formatExamLabelsFromMonthStr(resolvedPraiseMonth, monthExtraData?.monthKhmer);
    setExamKhmer(examLabels.examKhmer);
    setExamEnglish(
      String(monthExtraData?.monthEnglish || '').trim()
        ? `The Monthly Exam of ${String(monthExtraData?.monthEnglish).trim().split(/\s+/)[0]}`
        : examLabels.examEnglish
    );
    setIssuedDate(
      String(monthExtraData?.issueDateEnglish || '').trim() || formatIssuedDateDefault()
    );
    setSaveFeedback('');
    setUploadStatusText('');
    setExcludedUids([]);
  }, [
    isOpen,
    scoreSettings,
    selectedMonth,
    monthlyMonth,
    finalExamSessions,
    initialClassId,
    monthExtraData,
    initialDocType,
    finalExamCourseKh,
    finalExamCourseEn,
    finalExamDate,
  ]);

  // Keep uniformMargins checkbox synced when toggling between Praise & Certificate
  useEffect(() => {
    setUniformMargins(
      frameMarginsCm.top === frameMarginsCm.right &&
      frameMarginsCm.top === frameMarginsCm.bottom &&
      frameMarginsCm.top === frameMarginsCm.left
    );
  }, [docType]);

  // Update Praise exam labels when praiseMonth changes inside modal
  useEffect(() => {
    if (!isOpen) return;
    const examLabels = formatExamLabelsFromMonthStr(praiseMonth, monthExtraData?.monthKhmer);
    setExamKhmer(examLabels.examKhmer);
    setExamEnglish(examLabels.examEnglish);
  }, [praiseMonth, isOpen, monthExtraData?.monthKhmer]);

  // Subscribe to RTDB scores & coefficients for active exam key (monthly for Praise, FINAL_ for Certificate)
  useEffect(() => {
    if (!isOpen) return;
    if (!activeExamDataKey) {
      setModalScores([]);
      setModalCoeffMap({});
      setIsLoadingModalScores(false);
      return;
    }
    if (activeExamDataKey === selectedMonth) {
      setIsLoadingModalScores(false);
      return;
    }
    setIsLoadingModalScores(true);
    let loadedScoresDone = false;
    const unsubScores = scoreService.subscribeByQuery('month', '==', activeExamDataKey, (data: any[]) => {
      setModalScores(data);
      loadedScoresDone = true;
      setIsLoadingModalScores(false);
    });
    const unsubCoeffs = scoreCoefficientService.subscribeOne(activeExamDataKey, (doc: any) => {
      setModalCoeffMap(doc?.classes && typeof doc.classes === 'object' ? doc.classes : {});
      if (loadedScoresDone) setIsLoadingModalScores(false);
    });
    return () => {
      unsubScores();
      unsubCoeffs();
    };
  }, [isOpen, activeExamDataKey, selectedMonth]);

  // Subscribe to schoolInfo & photoFrameTemplates while open
  useEffect(() => {
    if (!isOpen) return;
    const unsubSchool = settingsService.subscribeOne('schoolInfo', (data: any) => {
      if (data) setSchoolProfile({ ...DEFAULT_SCHOOL_PROFILE, ...data });
    });
    const unsubFrames = photoFrameTemplateService.subscribeAll((list: any[]) => {
      const frameUrls = (list || [])
        .filter((t) => t && t.imageUrl && (t.category === 'frame' || !t.category))
        .slice(0, 12)
        .map((t) => ({
          id: String(t.id),
          label: String(t.name || 'Frame'),
          url: String(t.imageUrl),
        }));
      setStudioFrameTemplates(frameUrls);
    });
    return () => {
      unsubSchool();
      unsubFrames();
    };
  }, [isOpen]);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) =>
      String(a?.classCode || a?.className || '').localeCompare(
        String(b?.classCode || b?.className || ''),
        'en',
        { numeric: true }
      )
    );
  }, [classes]);

  const scoreCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    if (!activeExamDataKey) return map;
    effectiveScores.forEach((s: any) => {
      if (s?.month !== activeExamDataKey) return;
      const cid = String(s?.classId || '').trim();
      if (!cid) return;
      const hasVal = s?.totalScore !== '' && s?.totalScore !== undefined && s?.totalScore !== null && !isNaN(Number(s?.totalScore));
      if (hasVal) map.set(cid, (map.get(cid) || 0) + 1);
    });
    return map;
  }, [effectiveScores, activeExamDataKey]);

  useEffect(() => {
    if (!isOpen) return;
    const autoKey = `${docType}:${activeExamDataKey}:${initialClassId || ''}`;
    if (lastAutoSelectedKeyRef.current === autoKey) return;
    lastAutoSelectedKeyRef.current = autoKey;
    if (docType === 'certificate' && activeFinalSession?.classId && classes.some((c) => c.id === activeFinalSession.classId)) {
      setSelectedClassIds([activeFinalSession.classId]);
      return;
    }
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassIds([initialClassId]);
      return;
    }
    const withScores = sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0);
    if (withScores.length > 0 && withScores.length <= 3) {
      setSelectedClassIds(withScores.map((c) => c.id));
    } else if (withScores.length > 0) {
      setSelectedClassIds([withScores[0].id]);
    } else if (sortedClasses.length > 0) {
      setSelectedClassIds([sortedClasses[0].id]);
    } else {
      setSelectedClassIds([]);
    }
  }, [isOpen, docType, activeExamDataKey, initialClassId, classes, sortedClasses, activeFinalSession, scoreCountByClass]);

  // Close menus on outside click
  useEffect(() => {
    if (!isClassMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (classMenuRef.current && !classMenuRef.current.contains(e.target as Node)) {
        setIsClassMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isClassMenuOpen]);

  const effectivePaperMode: CertificatePrintPaperMode =
    docType === 'certificate' ? 'a4_landscape' : paperMode;

  const sheetSpec =
    effectivePaperMode === 'a4_landscape'
      ? A4_LANDSCAPE_SPEC
      : effectivePaperMode === 'a4_two_up'
        ? A4_PORTRAIT_SPEC
        : A5_LANDSCAPE_SPEC;

  // Responsive preview zoom (accounts for open Left Settings Sidebar on desktop)
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const hasLeftSidebar =
        (isConfigOpen || isStudentPickerOpen) &&
        viewMode === 'preview' &&
        window.innerWidth >= 960;
      const sideOffset = hasLeftSidebar ? 436 : 48;
      const availW = Math.max(300, window.innerWidth - sideOffset);
      setPreviewScale(Math.min(1, availW / sheetSpec.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, sheetSpec.sheetWPx, isConfigOpen, isStudentPickerOpen, viewMode]);

  // Inject dynamic @page size
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = sheetSpec.pageCss;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.body.classList.remove('printing-receipt-a4');
    };
  }, [isOpen, sheetSpec.pageCss]);

  // Compute ranked students across selected classes (Praise = monthly only; Certificate = Final Exam only)
  const classPackets: MonthlyResultClassPacket[] = useMemo(() => {
    if (!activeExamDataKey) return [];
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses
      .filter((c) => selectedSet.has(c.id))
      .flatMap((classObj) => {
        const classScoreRows = effectiveScores.filter(
          (s: any) => s?.classId === classObj.id && s?.month === activeExamDataKey
        );
        return computeMonthlyResultPacketsForClass(
          {
            classObj,
            allStudents,
            allTeachers,
            allClasses: classes,
            classScoreRows,
            monthCoeffMap: effectiveCoeffMap,
            scoreSettings,
            sortMode: 'rank_asc',
            includeUnscored: false,
          },
          splitBehavior
        );
      });
  }, [
    activeExamDataKey,
    sortedClasses,
    selectedClassIds,
    effectiveScores,
    allStudents,
    allTeachers,
    classes,
    effectiveCoeffMap,
    scoreSettings,
    splitBehavior,
  ]);

  // Flatten all scored candidates into CertificateRecipient entries
  const allCandidateRecipients: CertificateRecipient[] = useMemo(() => {
    const list: CertificateRecipient[] = [];
    classPackets.forEach((packet) => {
      packet.rows.forEach((r) => {
        if (r.rank === null) return;
        list.push({
          uid: `${packet.packetKey}__${r.rowKey}`,
          classId: packet.classId,
          classCode: packet.classCode,
          className: packet.className,
          shiftLabel: packet.shiftLabel,
          teacherName: packet.teacherName,
          studentId: r.studentId,
          fullName: r.fullName,
          englishName: r.englishName || '',
          gender: r.gender,
          dob: r.dob || '',
          level: r.level || packet.splitLevelLabel || (docType === 'certificate' ? activeFinalSession?.levelName || '' : ''),
          bookName: packet.bookName || (docType === 'certificate' ? activeFinalSession?.levelName || '' : ''),
          rank: r.rank,
          grade: r.grade,
          isPassing: r.isPassing,
          averageDisplay: r.averageDisplay,
          photo: r.photo || '',
        });
      });
    });
    return list;
  }, [classPackets, docType, activeFinalSession?.levelName]);

  // Keep manual list initialized with Top 3 whenever switching into manual mode if empty
  useEffect(() => {
    if (rankMode === 'manual' && manualPickedUids.length === 0 && allCandidateRecipients.length > 0) {
      setManualPickedUids(
        allCandidateRecipients.filter((c) => c.rank >= 1 && c.rank <= 3).map((c) => c.uid)
      );
    }
  }, [rankMode, allCandidateRecipients, manualPickedUids.length]);

  const selectedRecipients: CertificateRecipient[] = useMemo(() => {
    let baseList: CertificateRecipient[];
    if (rankMode === 'manual') {
      const picked = new Set(manualPickedUids);
      baseList = allCandidateRecipients.filter((c) => picked.has(c.uid));
    } else if (rankMode === 'passed') {
      const excluded = new Set(excludedUids);
      baseList = allCandidateRecipients.filter(
        (c) => c.isPassing !== false && !excluded.has(c.uid)
      );
    } else {
      const maxRank = rankMode === 'top3' ? 3 : 5;
      const excluded = new Set(excludedUids);
      baseList = allCandidateRecipients.filter(
        (c) => c.rank >= 1 && c.rank <= maxRank && !excluded.has(c.uid)
      );
    }
    const startNo = Number.isFinite(certStartNumber) && certStartNumber >= 1 ? Math.floor(certStartNumber) : 1;
    return baseList.map((c, idx) => ({
      ...c,
      certNumber: String(startNo + idx),
    }));
  }, [allCandidateRecipients, rankMode, excludedUids, manualPickedUids, certStartNumber]);

  const activeFramePreset = useMemo(
    () => CERTIFICATE_FRAME_PRESETS.find((f) => f.id === framePresetId) || CERTIFICATE_FRAME_PRESETS[0],
    [framePresetId]
  );

  // Build printable pages (A4 Landscape for Certificate; 2x A5/A4 Portrait or 1x A5 for Praise)
  const renderedPrintPages = useMemo(() => {
    if (effectivePaperMode === 'a4_landscape' || effectivePaperMode === 'a5_single') {
      return selectedRecipients.map((rec, idx) => ({
        key: `${effectivePaperMode}-${rec.uid}`,
        label:
          docType === 'certificate'
            ? `A4 ផ្ដេក #${idx + 1}: ${rec.fullName} (${rec.certNumber ? `No. ${rec.certNumber} • ` : ''}និទ្ទេស ${rec.grade})`
            : `ប័ណ្ណទី ${idx + 1}: ${rec.fullName} (លេខ ${rec.rank})`,
        topRecipient: rec,
        bottomRecipient: null as CertificateRecipient | null,
      }));
    }

    const pairs: {
      key: string;
      label: string;
      topRecipient: CertificateRecipient;
      bottomRecipient: CertificateRecipient | null;
    }[] = [];

    for (let i = 0; i < selectedRecipients.length; i += 2) {
      const top = selectedRecipients[i];
      const bottom = selectedRecipients[i + 1] || null;
      pairs.push({
        key: `a4pair-${top.uid}-${bottom?.uid || 'empty'}`,
        label: bottom
          ? `A4 ទំព័រ ${Math.floor(i / 2) + 1}៖ ${top.fullName} (#${top.rank}) & ${bottom.fullName} (#${bottom.rank})`
          : `A4 ទំព័រ ${Math.floor(i / 2) + 1}៖ ${top.fullName} (#${top.rank})`,
        topRecipient: top,
        bottomRecipient: bottom,
      });
    }
    return pairs;
  }, [selectedRecipients, effectivePaperMode, docType]);

  const handlePrint = () => {
    if (typeof window === 'undefined' || renderedPrintPages.length === 0) return;
    if (viewMode !== 'preview') {
      setViewMode('preview');
    }
    const styleId = 'bsis-a4-landscape-page-rule';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = sheetSpec.pageCss;

    document.body.classList.add('printing-receipt-a4');

    const cleanup = () => {
      document.body.classList.remove('printing-receipt-a4');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt-a4');
      }, 1200);
    }, 120);
  };

  const persistSavedFramesImmediately = async (
    nextList: SavedCustomFrameLink[],
    nextActiveUrl?: string
  ) => {
    if (!onSaveSettings) return;
    try {
      const urlPatch =
        nextActiveUrl !== undefined
          ? docType === 'certificate'
            ? { certCertificateFrameUrl: nextActiveUrl }
            : { certFrameUrl: nextActiveUrl }
          : {};
      await onSaveSettings({
        certCustomFrames: nextList,
        ...urlPatch,
      });
    } catch (err) {
      console.error('Failed auto-saving uploaded frame templates:', err);
    }
  };

  const handleUploadFrameFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setIsUploadingFrames(true);
    setUploadStatusText(`កំពុង Upload 0 / ${files.length}...`);
    const uploadedEntries: SavedCustomFrameLink[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatusText(`កំពុង Upload ${i + 1} / ${files.length} (${file.name})...`);
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const cleanFileId = `cert_frame_${Date.now()}_${i}`;
        const url = await uploadCertificateFrame(file, cleanFileId);
        uploadedEntries.push({
          id: `${Date.now()}-${i}`,
          label:
            files.length === 1 && newFrameLabel.trim()
              ? newFrameLabel.trim()
              : baseName.slice(0, 24) || `ស៊ុម ${savedCustomFrames.length + uploadedEntries.length + 1}`,
          url,
        });
      }
      const nextList = [...savedCustomFrames, ...uploadedEntries];
      const latestUrl = uploadedEntries[uploadedEntries.length - 1]?.url || customFrameUrl;
      setSavedCustomFrames(nextList);
      setCustomFrameUrl(latestUrl);
      setNewFrameLabel('');
      await persistSavedFramesImmediately(nextList, latestUrl);
      setUploadStatusText(`Upload បានជោគជ័យ ${uploadedEntries.length} គំរូ!`);
      setTimeout(() => setUploadStatusText(''), 3500);
    } catch (err: any) {
      console.error('Frame upload failed:', err);
      alert('មានបញ្ហាក្នុងការ Upload រូបស៊ុម៖ ' + (err?.message || 'Unknown error'));
      setUploadStatusText('');
    } finally {
      setIsUploadingFrames(false);
      if (frameUploadInputRef.current) frameUploadInputRef.current.value = '';
    }
  };

  const handleAddCustomFrameLink = async () => {
    const cleanUrl = customFrameUrl.trim();
    if (!cleanUrl) return;
    const exists = savedCustomFrames.some((f) => f.url === cleanUrl);
    if (exists) return;
    const label = newFrameLabel.trim() || `គំរូស៊ុម ${savedCustomFrames.length + 1}`;
    const nextList = [...savedCustomFrames, { id: String(Date.now()), label, url: cleanUrl }];
    setSavedCustomFrames(nextList);
    setNewFrameLabel('');
    await persistSavedFramesImmediately(nextList, cleanUrl);
  };

  const handleRemoveSavedFrame = async (id: string) => {
    const target = savedCustomFrames.find((f) => f.id === id);
    const nextList = savedCustomFrames.filter((f) => f.id !== id);
    setSavedCustomFrames(nextList);
    const nextUrl = target && customFrameUrl.trim() === target.url ? '' : customFrameUrl;
    if (nextUrl !== customFrameUrl) setCustomFrameUrl(nextUrl);
    await persistSavedFramesImmediately(nextList, nextUrl);
  };

  const persistActiveLogoConfig = async (
    targetKind: 'top' | 'ministry',
    nextDesign: CertificateDesignConfig,
    nextList: SavedCustomFrameLink[]
  ) => {
    if (!onSaveSettings) return;
    const normDesign = normalizeCertificateDesign(nextDesign, activeDefaultDesign);
    const designPatch: CertificateBrandingConfig =
      docType === 'certificate'
        ? { certCertificateDesignConfig: normDesign }
        : { certDesignConfig: normDesign };
    if (targetKind === 'ministry') {
      await onSaveSettings({
        certMinistryLogoUrl: String(normDesign.ministryLogoUrl || '').trim(),
        certSavedMinistryLogos: nextList,
        certCertificateDesignConfig: normalizeCertificateDesign(nextDesign, DEFAULT_COURSE_CERTIFICATE_DESIGN),
      });
    } else {
      await onSaveSettings({
        certTopLogoUrl: String(normDesign.topLogoUrl || '').trim(),
        certSavedTopLogos: nextList,
        ...designPatch,
      });
    }
  };

  const handleUploadLogoAsset = async (
    targetKind: 'top' | 'ministry',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isMinistry = targetKind === 'ministry';
    if (isMinistry) {
      setIsUploadingMinistryLogo(true);
      setUploadStatusText('កំពុង Upload ឡូហ្គោក្រសួងអប់រំ...');
    } else {
      setIsUploadingTopLogo(true);
      setUploadStatusText('កំពុង Upload Logo បញ្ឈរ...');
    }
    try {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const cleanId = `cert_${targetKind}_logo_${Date.now()}`;
      const url = await uploadCertificateFrame(file, cleanId);
      const baseForKind = isMinistry ? courseDesignConfig : designConfig;
      const nextDesign = normalizeCertificateDesign(
        isMinistry
          ? { ...baseForKind, ministryLogoUrl: url }
          : { ...baseForKind, topLogoUrl: url, logoLayoutMode: 'vertical' },
        isMinistry ? DEFAULT_COURSE_CERTIFICATE_DESIGN : activeDefaultDesign
      );
      if (isMinistry) {
        setCourseDesignConfig(nextDesign);
        const entry: SavedCustomFrameLink = {
          id: String(Date.now()),
          label: newMinistryLogoLabel.trim() || baseName.slice(0, 22) || `MoEYS ${savedMinistryLogos.length + 1}`,
          url,
        };
        const nextList = [...savedMinistryLogos, entry];
        setSavedMinistryLogos(nextList);
        setNewMinistryLogoLabel('');
        await persistActiveLogoConfig('ministry', nextDesign, nextList);
        setUploadStatusText('Upload ឡូហ្គោក្រសួងអប់រំបានជោគជ័យ!');
      } else {
        setDesignConfig(nextDesign);
        const entry: SavedCustomFrameLink = {
          id: String(Date.now()),
          label: newTopLogoLabel.trim() || baseName.slice(0, 22) || `Logo ${savedTopLogos.length + 1}`,
          url,
        };
        const nextLogos = [...savedTopLogos, entry];
        setSavedTopLogos(nextLogos);
        setNewTopLogoLabel('');
        await persistActiveLogoConfig('top', nextDesign, nextLogos);
        setUploadStatusText('Upload Logo បញ្ឈរបានជោគជ័យ!');
      }
      setTimeout(() => setUploadStatusText(''), 3000);
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      alert('មានបញ្ហាក្នុងការ Upload Logo៖ ' + (err?.message || 'Unknown error'));
      setUploadStatusText('');
    } finally {
      if (isMinistry) {
        setIsUploadingMinistryLogo(false);
        if (ministryLogoUploadInputRef.current) ministryLogoUploadInputRef.current.value = '';
      } else {
        setIsUploadingTopLogo(false);
        if (topLogoUploadInputRef.current) topLogoUploadInputRef.current.value = '';
      }
    }
  };

  const handleAddTopLogoLink = async () => {
    const cleanUrl = String(designConfig.topLogoUrl || '').trim();
    if (!cleanUrl) return;
    const exists = savedTopLogos.some((l) => l.url === cleanUrl);
    const label = newTopLogoLabel.trim() || `Logo បញ្ឈរ ${savedTopLogos.length + 1}`;
    const nextLogos = exists
      ? savedTopLogos
      : [...savedTopLogos, { id: String(Date.now()), label, url: cleanUrl }];
    setSavedTopLogos(nextLogos);
    setNewTopLogoLabel('');
    await persistActiveLogoConfig('top', designConfig, nextLogos);
  };

  const handleAddMinistryLogoLink = async () => {
    const cleanUrl = String(courseDesignConfig.ministryLogoUrl || '').trim();
    if (!cleanUrl) return;
    const exists = savedMinistryLogos.some((l) => l.url === cleanUrl);
    const label = newMinistryLogoLabel.trim() || `ក្រសួងអប់រំ ${savedMinistryLogos.length + 1}`;
    const nextLogos = exists
      ? savedMinistryLogos
      : [...savedMinistryLogos, { id: String(Date.now()), label, url: cleanUrl }];
    setSavedMinistryLogos(nextLogos);
    setNewMinistryLogoLabel('');
    await persistActiveLogoConfig('ministry', courseDesignConfig, nextLogos);
  };

  const handleRemoveSavedLogo = async (targetKind: 'top' | 'ministry', id: string) => {
    if (targetKind === 'ministry') {
      const target = savedMinistryLogos.find((l) => l.id === id);
      const nextLogos = savedMinistryLogos.filter((l) => l.id !== id);
      setSavedMinistryLogos(nextLogos);
      let nextDesign = courseDesignConfig;
      if (target && String(courseDesignConfig.ministryLogoUrl || '').trim() === target.url) {
        nextDesign = normalizeCertificateDesign(
          { ...courseDesignConfig, ministryLogoUrl: '' },
          DEFAULT_COURSE_CERTIFICATE_DESIGN
        );
        setCourseDesignConfig(nextDesign);
      }
      await persistActiveLogoConfig('ministry', nextDesign, nextLogos);
      return;
    }
    const target = savedTopLogos.find((l) => l.id === id);
    const nextLogos = savedTopLogos.filter((l) => l.id !== id);
    setSavedTopLogos(nextLogos);
    let nextDesign = designConfig;
    if (target && String(designConfig.topLogoUrl || '').trim() === target.url) {
      nextDesign = normalizeCertificateDesign({ ...designConfig, topLogoUrl: '' }, activeDefaultDesign);
      setDesignConfig(nextDesign);
    }
    await persistActiveLogoConfig('top', nextDesign, nextLogos);
  };

  const handleUpdateMarginCm = (side: keyof FrameMarginsCm, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0.4, Math.min(5.5, parsed));
    if (uniformMargins) {
      setFrameMarginsCm({ top: clamped, right: clamped, bottom: clamped, left: clamped });
    } else {
      setFrameMarginsCm((prev) => ({ ...prev, [side]: clamped }));
    }
  };

  const handleApplyUniformCm = (valCm: number) => {
    setUniformMargins(true);
    setFrameMarginsCm({ top: valCm, right: valCm, bottom: valCm, left: valCm });
  };

  const handleApplyDesignTemplate = async (tpl: SavedCertificateDesignTemplate) => {
    const tplDocType: CertificateDocType = tpl.docType || 'praise';
    const tplDefault =
      tplDocType === 'certificate' ? DEFAULT_COURSE_CERTIFICATE_DESIGN : DEFAULT_CERTIFICATE_DESIGN;
    const norm = normalizeCertificateDesign(tpl.designConfig, tplDefault);
    setDocType(tplDocType);

    if (tplDocType === 'certificate') {
      setCertFramePresetId(tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[1].id);
      setCertCustomFrameUrl(tpl.customFrameUrl || '');
      if (tpl.frameMarginsCm) setCertMarginsCm(tpl.frameMarginsCm);
      setCertShowStudentPhoto(tpl.showStudentPhoto !== undefined ? Boolean(tpl.showStudentPhoto) : true);
      setCourseDesignConfig(norm);
      setCertActiveDesignId(tpl.id);
      setRankMode('passed');
    } else {
      setPraiseFramePresetId(tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[0].id);
      setPraiseCustomFrameUrl(tpl.customFrameUrl || '');
      if (tpl.frameMarginsCm) setPraiseMarginsCm(tpl.frameMarginsCm);
      setPraiseShowStudentPhoto(Boolean(tpl.showStudentPhoto));
      setPraiseDesignConfig(norm);
      setPraiseActiveDesignId(tpl.id);
      setRankMode((prev) => (prev === 'passed' ? 'top3' : prev));
    }

    if (tpl.frameMarginsCm) {
      setUniformMargins(
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.right &&
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.bottom &&
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.left
      );
    }

    if (onSaveSettings) {
      try {
        if (tplDocType === 'certificate') {
          await onSaveSettings({
            certDocType: 'certificate',
            certCertificateFramePresetId: tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[1].id,
            certCertificateFrameUrl: tpl.customFrameUrl || '',
            certCertificateFrameMarginsCm: tpl.frameMarginsCm,
            certCertificateShowStudentPhoto: Boolean(tpl.showStudentPhoto),
            certCertificateDesignConfig: norm,
            certCertificateActiveDesignId: tpl.id,
            certMinistryLogoUrl: norm.ministryLogoUrl || '',
            certTopLogoUrl: norm.topLogoUrl || '',
          });
        } else {
          await onSaveSettings({
            certDocType: 'praise',
            certFramePresetId: tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[0].id,
            certFrameUrl: tpl.customFrameUrl || '',
            certFrameMarginsCm: tpl.frameMarginsCm,
            certShowStudentPhoto: Boolean(tpl.showStudentPhoto),
            certDesignConfig: norm,
            certActiveDesignId: tpl.id,
            certTopLogoUrl: norm.topLogoUrl || '',
          });
        }
      } catch (err) {
        console.error('Failed persisting applied template:', err);
      }
    }
  };

  const persistTemplatesForDocType = async (
    nextTemplates: SavedCertificateDesignTemplate[],
    activeId: string | null,
    norm?: CertificateDesignConfig
  ) => {
    if (!onSaveSettings) return;
    if (docType === 'certificate') {
      await onSaveSettings({
        certDocType: 'certificate',
        certCertificateDesignTemplates: nextTemplates,
        certCertificateActiveDesignId: activeId,
        certCertificateFramePresetId: framePresetId,
        certCertificateFrameUrl: customFrameUrl.trim(),
        certCertificateFrameMarginsCm: frameMarginsCm,
        certCertificateShowStudentPhoto: showStudentPhoto,
        ...(norm
          ? {
              certCertificateDesignConfig: norm,
              certMinistryLogoUrl: norm.ministryLogoUrl || '',
              certTopLogoUrl: norm.topLogoUrl || '',
            }
          : {}),
      });
    } else {
      await onSaveSettings({
        certDocType: 'praise',
        certDesignTemplates: nextTemplates,
        certActiveDesignId: activeId,
        certFramePresetId: framePresetId,
        certFrameUrl: customFrameUrl.trim(),
        certFrameMarginsCm: frameMarginsCm,
        certShowStudentPhoto: showStudentPhoto,
        ...(norm
          ? {
              certDesignConfig: norm,
              certTopLogoUrl: norm.topLogoUrl || '',
            }
          : {}),
      });
    }
  };

  const handleSaveNewDesignTemplate = async (name: string) => {
    if (!onSaveSettings) return;
    setIsSavingDesignTemplate(true);
    try {
      const norm = normalizeCertificateDesign(designConfig, activeDefaultDesign);
      const nextTpl: SavedCertificateDesignTemplate = {
        id: String(Date.now()),
        name,
        docType,
        framePresetId,
        customFrameUrl: customFrameUrl.trim(),
        frameMarginsCm,
        showStudentPhoto,
        designConfig: norm,
        updatedAt: new Date().toISOString(),
      };
      const nextTemplates = [...savedDesignTemplates, nextTpl];
      setSavedDesignTemplates(nextTemplates);
      setActiveDesignTemplateId(nextTpl.id);
      await persistTemplatesForDocType(nextTemplates, nextTpl.id, norm);
    } finally {
      setIsSavingDesignTemplate(false);
    }
  };

  const handleUpdateCurrentDesignTemplate = async () => {
    if (!onSaveSettings || !activeDesignTemplateId) return;
    setIsSavingDesignTemplate(true);
    try {
      const norm = normalizeCertificateDesign(designConfig, activeDefaultDesign);
      const nextTemplates = savedDesignTemplates.map((t) =>
        t.id === activeDesignTemplateId
          ? {
              ...t,
              docType,
              framePresetId,
              customFrameUrl: customFrameUrl.trim(),
              frameMarginsCm,
              showStudentPhoto,
              designConfig: norm,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      setSavedDesignTemplates(nextTemplates);
      await persistTemplatesForDocType(nextTemplates, activeDesignTemplateId, norm);
    } finally {
      setIsSavingDesignTemplate(false);
    }
  };

  const handleDeleteDesignTemplate = async (id: string) => {
    const nextTemplates = savedDesignTemplates.filter((t) => t.id !== id);
    const nextActive = activeDesignTemplateId === id ? null : activeDesignTemplateId;
    setSavedDesignTemplates(nextTemplates);
    setActiveDesignTemplateId(nextActive);
    await persistTemplatesForDocType(nextTemplates, nextActive);
  };

  const handleSaveConfig = async () => {
    if (!onSaveSettings) return;
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const normPraise = normalizeCertificateDesign(praiseDesignConfig, DEFAULT_CERTIFICATE_DESIGN);
      const normCourse = normalizeCertificateDesign(
        {
          ...courseDesignConfig,
          certProvinceKh: provinceKh,
          certDeptKh: deptKh,
        },
        DEFAULT_COURSE_CERTIFICATE_DESIGN
      );
      await onSaveSettings({
        certDocType: docType,
        certCustomFrames: savedCustomFrames,
        certTopLogoUrl: String((docType === 'certificate' ? normCourse : normPraise).topLogoUrl || '').trim(),
        certSavedTopLogos: savedTopLogos,

        // Praise Letter separate settings & templates
        certFramePresetId: praiseFramePresetId,
        certFrameUrl: praiseCustomFrameUrl.trim(),
        certFrameMarginsCm: praiseMarginsCm,
        certDesignConfig: normPraise,
        certDesignTemplates: praiseDesignTemplates,
        certActiveDesignId: praiseActiveDesignId,
        certShowStudentPhoto: praiseShowStudentPhoto,
        certPrincipalTitle: praisePrincipalTitle.trim() || 'The Principal of BSIS',
        resultStampUrl: praiseStampUrl.trim(),
        resultSignatureUrl: praiseSignatureUrl.trim(),
        resultSignatoryName: praiseSignatoryName.trim() || 'សំរិត វឌ្ឍនៈ',

        // Course Certificate separate settings, templates & footers
        certCertificateFramePresetId: certFramePresetId,
        certCertificateFrameUrl: certCustomFrameUrl.trim(),
        certCertificateFrameMarginsCm: certMarginsCm,
        certCertificateDesignConfig: normCourse,
        certCertificateDesignTemplates: certDesignTemplates,
        certCertificateActiveDesignId: certActiveDesignId,
        certCertificateShowStudentPhoto: certShowStudentPhoto,
        certCertificatePrincipalTitle: certPrincipalTitle.trim() || 'The principal of BSIS',
        certCertificateStampUrl: certStampUrl.trim(),
        certCertificateSignatureUrl: certSignatureUrl.trim(),
        certCertificateSignatoryName: certSignatoryName.trim() || 'សំរិត វឌ្ឍនៈ',
        certMinistryLogoUrl: String(normCourse.ministryLogoUrl || '').trim(),
        certSavedMinistryLogos: savedMinistryLogos,
        certProvinceKh: provinceKh.trim() || 'ខេត្តកណ្តាល',
        certDeptKh: deptKh.trim() || 'មន្ទីរអប់រំ យុវជន និងកីឡា',
        certCourseNameKh: courseNameKh.trim() || 'ភាសាអង់គ្លេស',
        certCourseNameEn: courseNameEn.trim() || 'English Course',
        certPlaceDateText: certPlaceDateText.trim() || formatCertPlaceDateDefault('Kandal'),
        certStartNumber: Number.isFinite(certStartNumber) && certStartNumber >= 1 ? Math.floor(certStartNumber) : 1,
      });
      setSaveFeedback('បានរក្សាទុក!');
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch (err) {
      console.error('Failed saving certificate config:', err);
      setSaveFeedback('បរាជ័យ!');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleClassId = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleRecipientSelection = (uid: string) => {
    if (rankMode === 'manual') {
      setManualPickedUids((prev) =>
        prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
      );
    } else {
      setExcludedUids((prev) =>
        prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
      );
    }
  };

  const filteredClassOptions = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return sortedClasses;
    return sortedClasses.filter(
      (c) =>
        String(c.classCode || '').toLowerCase().includes(q) ||
        String(c.className || '').toLowerCase().includes(q) ||
        String(c.teacherName || '').toLowerCase().includes(q)
    );
  }, [sortedClasses, classSearch]);

  if (!isOpen || typeof document === 'undefined') return null;

  const classButtonLabel =
    selectedClassIds.length === 0
      ? 'ជ្រើសរើសថ្នាក់រៀន...'
      : selectedClassIds.length === sortedClasses.length && sortedClasses.length > 0
        ? `គ្រប់ថ្នាក់ (${sortedClasses.length})`
        : selectedClassIds.length === 1
          ? (() => {
              const found = sortedClasses.find((c) => c.id === selectedClassIds[0]);
              return found ? `ថ្នាក់ ${found.classCode || found.className}` : '1 ថ្នាក់';
            })()
          : `បានជ្រើស ${selectedClassIds.length} ថ្នាក់`;

  const sharedCardProps = {
    docType,
    framePreset: activeFramePreset,
    customFrameUrl,
    frameMarginsCm,
    designConfig,
    examKhmer,
    examEnglish,
    conductedDate,
    issuedDate,
    courseNameKh,
    courseNameEn,
    certPlaceDateText,
    provinceKh,
    deptKh,
    showStudentPhoto,
    stampUrl,
    signatureUrl,
    signatoryName,
    principalTitle,
    schoolProfile,
  };

  return createPortal(
    <div
      id="payment-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Top Action Toolbar (Hidden during Chrome Print) */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#0f172a',
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
          padding: '0.65rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Row 1: Mode, Class, Month, Top 1-3 / 1-5 / Manual, Paper Size, Print, Close */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            {/* Doc Type Toggle: ប័ណ្ណសរសើរ vs វិញ្ញាបនបត្រ */}
            <div
              style={{
                display: 'inline-flex',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '0.15rem',
                gap: '0.15rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setDocType('praise');
                  setRankMode((prev) => (prev === 'passed' ? 'top3' : prev));
                }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: docType === 'praise' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
                  color: docType === 'praise' ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ប័ណ្ណសរសើរ
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType('certificate');
                  setRankMode('passed');
                }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: docType === 'certificate' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  color: docType === 'certificate' ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                វិញ្ញាបនបត្រ
              </button>
            </div>

            {/* Class Picker */}
            <div ref={classMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((v) => !v)}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minWidth: '150px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '145px' }}>
                  {classButtonLabel}
                </span>
                <AppIcon name="chevron-down" size={13} />
              </button>

              {isClassMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '310px',
                    maxHeight: '350px',
                    background: '#1e293b',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    borderRadius: '10px',
                    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
                    padding: '0.55rem',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <input
                    type="text"
                    placeholder="ស្វែងរកថ្នាក់ ឬគ្រូ..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.38rem 0.6rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds(sortedClasses.map((c) => c.id))}
                      style={{
                        flex: 1,
                        padding: '0.28rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ទាំងអស់ ({sortedClasses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClassIds(
                          sortedClasses.filter((c) => (scoreCountByClass.get(c.id) || 0) > 0).map((c) => c.id)
                        )
                      }
                      style={{
                        flex: 1,
                        padding: '0.28rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.12)',
                        color: '#6ee7b7',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ថ្នាក់មានពិន្ទុ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds([])}
                      style={{
                        padding: '0.28rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#fca5a5',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      លុប
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {filteredClassOptions.map((c) => {
                      const checked = selectedClassIds.includes(c.id);
                      const cnt = scoreCountByClass.get(c.id) || 0;
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.32rem 0.45rem',
                            borderRadius: '6px',
                            background: checked ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
                            color: '#f1f5f9',
                            fontSize: '0.79rem',
                            cursor: 'pointer',
                            gap: '0.4rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleClassId(c.id)} />
                            <span style={{ fontWeight: 700 }}>{c.classCode || c.className}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.teacherName || ''}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', padding: '0.06rem 0.35rem', borderRadius: '999px', background: cnt > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.16)', color: cnt > 0 ? '#6ee7b7' : '#94a3b8' }}>
                            {cnt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Exam Session Picker: Final Exam ONLY for Certificate | Monthly ONLY for Praise */}
            {docType === 'certificate' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <select
                  value={selectedFinalExamId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedFinalExamId(nextId);
                    const sess = finalExamSessions.find((s) => s.id === nextId);
                    if (sess) {
                      if (sess.courseNameKh) setCourseNameKh(sess.courseNameKh);
                      if (sess.courseNameEn) setCourseNameEn(sess.courseNameEn);
                      if (sess.examDate && /^\d{4}-\d{2}-\d{2}$/.test(sess.examDate)) {
                        const [fy, fm, fd] = sess.examDate.split('-').map(Number);
                        setCertPlaceDateText(
                          formatCertPlaceDateDefault('Kandal', new Date(fy, (fm || 1) - 1, fd || 1))
                        );
                      }
                      if (sess.classId) setSelectedClassIds([sess.classId]);
                      onMonthChange(nextId);
                    }
                  }}
                  style={{
                    padding: '0.38rem 0.6rem',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(167, 139, 250, 0.5)',
                    color: '#ede9fe',
                    fontSize: '0.79rem',
                    fontWeight: 700,
                    outline: 'none',
                    maxWidth: '270px',
                    cursor: 'pointer',
                  }}
                  title="វិញ្ញាបនបត្រប្រើទិន្នន័យចេញពីការប្រឡងបញ្ចប់វគ្គប៉ុណ្ណោះ"
                >
                  {finalExamSessions.length === 0 ? (
                    <option value="">មិនទាន់មានការប្រឡងបញ្ចប់វគ្គទេ</option>
                  ) : (
                    finalExamSessions.map((sess) => {
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
                {onCreateFinalExam && (
                  <button
                    type="button"
                    onClick={onCreateFinalExam}
                    style={{
                      padding: '0.36rem 0.58rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(167, 139, 250, 0.45)',
                      background: 'rgba(124, 58, 237, 0.22)',
                      color: '#ddd6fe',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    title="បង្កើតការប្រឡងបញ្ចប់វគ្គថ្មី"
                  >
                    + បង្កើតថ្មី
                  </button>
                )}
              </div>
            ) : (
              <input
                type="month"
                value={praiseMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setPraiseMonth(val);
                  if (val) onMonthChange(val);
                }}
                style={{
                  padding: '0.36rem 0.55rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            )}

            {/* Rank / Passing Filter Selector */}
            <div
              style={{
                display: 'inline-flex',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '0.15rem',
                gap: '0.15rem',
              }}
            >
              {(docType === 'certificate'
                ? [
                    { id: 'passed' as RankRangeMode, label: 'សិស្សជាប់ ១ ថ្នាក់' },
                    { id: 'manual' as RankRangeMode, label: 'ជ្រើសផ្ទាល់' },
                  ]
                : [
                    { id: 'top3' as RankRangeMode, label: 'លេខ ១ - ៣' },
                    { id: 'top5' as RankRangeMode, label: 'លេខ ១ - ៥' },
                    { id: 'manual' as RankRangeMode, label: 'ជ្រើសផ្ទាល់' },
                  ]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setRankMode(opt.id);
                    if (opt.id === 'manual') setIsStudentPickerOpen(true);
                  }}
                  style={{
                    padding: '0.28rem 0.58rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: rankMode === opt.id ? '#059669' : 'transparent',
                    color: rankMode === opt.id ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Toggle Student List Drawer */}
            <button
              type="button"
              onClick={() => setIsStudentPickerOpen((v) => !v)}
              style={{
                padding: '0.38rem 0.62rem',
                borderRadius: '8px',
                background: isStudentPickerOpen ? 'rgba(16, 185, 129, 0.22)' : '#1e293b',
                border: isStudentPickerOpen ? '1px solid #34d399' : '1px solid rgba(148, 163, 184, 0.35)',
                color: '#d1fae5',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name="users" size={14} />
              <span>សិស្ស ({selectedRecipients.length})</span>
            </button>

            {/* Paper Layout Mode: Fixed A4 Landscape for Certificate | A5-2up / A5 for Praise */}
            {docType === 'certificate' ? (
              <div
                style={{
                  padding: '0.38rem 0.6rem',
                  borderRadius: '8px',
                  background: 'rgba(37, 99, 235, 0.18)',
                  border: '1px solid rgba(96, 165, 250, 0.45)',
                  color: '#bfdbfe',
                  fontSize: '0.77rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                ខ្នាត A4 ផ្ដេក (១ សន្លឹក/ទំព័រ)
              </div>
            ) : (
              <select
                value={paperMode}
                onChange={(e) => setPaperMode(e.target.value as CertificatePrintPaperMode)}
                style={{
                  padding: '0.39rem 0.55rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="a4_two_up">ខ្នាត A5 (២ ប័ណ្ណក្នុង ១ ទំព័រ A4 បញ្ឈរ)</option>
                <option value="a5_single">ខ្នាត A5 ផ្តេក (១ ប័ណ្ណ/ទំព័រ)</option>
              </select>
            )}

            {/* Split-by-level mode */}
            <select
              value={splitBehavior}
              onChange={(e) => setSplitBehavior(e.target.value as 'auto' | 'always' | 'never')}
              style={{
                padding: '0.39rem 0.55rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
              title="គណនាចំណាត់ថ្នាក់លេខ ១-៣ / ១-៥ តាមវគ្គនីមួយៗ ឬរួមមួយថ្នាក់"
            >
              <option value="auto">វគ្គ៖ តាមការកំណត់ថ្នាក់</option>
              <option value="always">វគ្គ៖ ចំណាត់ថ្នាក់តាមវគ្គនីមួយៗ</option>
              <option value="never">វគ្គ៖ រួមទាំងថ្នាក់</option>
            </select>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {/* Toggle between Print Preview and Interactive Design Studio */}
            <div
              style={{
                display: 'inline-flex',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                borderRadius: '8px',
                padding: '0.14rem',
                gap: '0.14rem',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                style={{
                  padding: '0.28rem 0.62rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'preview' ? '#2563eb' : 'transparent',
                  color: viewMode === 'preview' ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                មើលគំរូ A4
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('design');
                  setIsConfigOpen(false);
                }}
                style={{
                  padding: '0.28rem 0.62rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'design' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                  color: viewMode === 'design' ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <AppIcon name="layers" size={13} />
                <span>រចនា &amp; រំកិលធាតុ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsConfigOpen((v) => !v)}
              style={{
                padding: '0.42rem 0.72rem',
                borderRadius: '8px',
                background: isConfigOpen ? 'rgba(99, 102, 241, 0.25)' : '#1e293b',
                border: isConfigOpen ? '1px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.35)',
                color: '#e0e7ff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AppIcon name="sliders" size={14} />
              <span>ស៊ុម, រូបថត &amp; កាលបរិច្ឆេទ</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={renderedPrintPages.length === 0}
              style={{
                padding: '0.44rem 0.9rem',
                borderRadius: '8px',
                background: renderedPrintPages.length === 0 ? '#475569' : 'linear-gradient(135deg, #d97706, #b45309)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: renderedPrintPages.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.38rem',
              }}
            >
              <AppIcon name="printer" size={15} />
              <span>ព្រីន ({renderedPrintPages.length} ទំព័រ)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.42rem 0.72rem',
                borderRadius: '8px',
                background: '#334155',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name="x" size={14} />
              <span>បិទ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Print Studio Workspace: Left Scrollable Settings Sidebar + Right Live Preview */}
      <div className="print-workspace-body">
        {(isStudentPickerOpen || isConfigOpen) && (
          <aside className="no-print print-left-sidebar print-sidebar-wide">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                paddingBottom: '0.45rem',
                borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AppIcon name="sliders" size={15} style={{ color: '#fbbf24' }} />
                <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f8fafc' }}>
                  {docType === 'certificate'
                    ? 'ការកំណត់វិញ្ញាបនបត្រ'
                    : 'ការកំណត់ប័ណ្ណសរសើរ'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsConfigOpen(false);
                  setIsStudentPickerOpen(false);
                }}
                title="បិទផ្ទាំងការកំណត់ខាងឆ្វេង"
                style={{
                  padding: '0.22rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AppIcon name="x" size={12} />
                <span>លាក់ផ្ទាំង</span>
              </button>
            </div>

        {/* Optional Student Inclusion/Exclusion Checklist Drawer */}
        {isStudentPickerOpen && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7' }}>
                បញ្ជីសិស្សមានពិន្ទុ ({allCandidateRecipients.length} នាក់) — Tick ដើម្បីបង្ហាញ ឬលុបចេញពីការព្រីន៖
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRankMode('manual');
                    setManualPickedUids(allCandidateRecipients.filter((c) => c.rank <= 3).map((c) => c.uid));
                  }}
                  style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.35)', background: '#0f172a', color: '#e2e8f0', fontSize: '0.73rem', cursor: 'pointer' }}
                >
                  Tick លេខ ១-៣
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRankMode('manual');
                    setManualPickedUids(allCandidateRecipients.filter((c) => c.rank <= 5).map((c) => c.uid));
                  }}
                  style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.35)', background: '#0f172a', color: '#e2e8f0', fontSize: '0.73rem', cursor: 'pointer' }}
                >
                  Tick លេខ ១-៥
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRankMode('manual');
                    setManualPickedUids(allCandidateRecipients.filter((c) => c.isPassing !== false).map((c) => c.uid));
                  }}
                  style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', fontSize: '0.73rem', cursor: 'pointer' }}
                >
                  Tick ជាប់ទាំងអស់
                </button>
                <button
                  type="button"
                  onClick={() => setIsStudentPickerOpen(false)}
                  style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#ffffff', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  រួចរាល់
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
              {allCandidateRecipients.map((rec) => {
                const isIncluded =
                  rankMode === 'manual'
                    ? manualPickedUids.includes(rec.uid)
                    : rankMode === 'passed'
                      ? rec.isPassing !== false && !excludedUids.includes(rec.uid)
                      : rec.rank <= (rankMode === 'top3' ? 3 : 5) && !excludedUids.includes(rec.uid);
                return (
                  <label
                    key={rec.uid}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.26rem 0.55rem',
                      borderRadius: '999px',
                      border: isIncluded ? '1px solid #34d399' : '1px solid rgba(148,163,184,0.3)',
                      background: isIncluded ? 'rgba(16, 185, 129, 0.16)' : '#0f172a',
                      color: isIncluded ? '#ecfdf5' : '#94a3b8',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => toggleRecipientSelection(rec.uid)}
                    />
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>#{rec.rank}</span>
                    <span>{rec.fullName}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      ({rec.classCode}{rec.level ? `/${rec.level}` : ''} • {rec.grade})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Frame Presets, Custom Frame URL Bank, Photo Toggle & Dates Drawer */}
        {isConfigOpen && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            {/* Frame Presets + Upload Multi-Frame Button + Saved Frame Thumbnail Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.38rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                    ស៊ុមក្បាច់ជុំវិញ៖
                  </span>
                  {CERTIFICATE_FRAME_PRESETS.map((preset) => {
                    const active = !customFrameUrl.trim() && framePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFramePresetId(preset.id);
                          setCustomFrameUrl('');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.28rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: active ? '2px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: active ? 'rgba(251, 191, 36, 0.16)' : '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.74rem',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '3px',
                            background: `linear-gradient(135deg, ${preset.swatch[0]} 55%, ${preset.swatch[1]} 55%)`,
                          }}
                        />
                        <span>{preset.nameKh}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Multiple Frames Directly */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {uploadStatusText && (
                    <span style={{ fontSize: '0.74rem', color: '#7dd3fc', fontWeight: 600 }}>
                      {uploadStatusText}
                    </span>
                  )}
                  <input
                    ref={frameUploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadFrameFiles}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingFrames}
                    onClick={() => frameUploadInputRef.current?.click()}
                    style={{
                      padding: '0.28rem 0.72rem',
                      borderRadius: '7px',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(37, 99, 235, 0.25))',
                      color: '#bae6fd',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: isUploadingFrames ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title="Upload រូបស៊ុម (PNG/JPG) ១ ឬច្រើន ហើយ Save ទុកជាគំរូប្រើប្រាស់"
                  >
                    <AppIcon name="image" size={14} />
                    <span>{isUploadingFrames ? 'កំពុង Upload...' : 'Upload ស៊ុម (Save ជាគំរូច្រើន)'}</span>
                  </button>
                </div>
              </div>

              {/* Saved Custom Frame Cards (with Thumbnails) + Studio Templates */}
              {(savedCustomFrames.length > 0 || studioFrameTemplates.length > 0) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    overflowX: 'auto',
                    padding: '0.25rem 0.1rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    គំរូស៊ុម ({savedCustomFrames.length + studioFrameTemplates.length})៖
                  </span>
                  {savedCustomFrames.map((cf) => {
                    const active = customFrameUrl.trim() === cf.url;
                    const thumbSrc = resolveSheetAssetSrc(cf.url);
                    return (
                      <div
                        key={cf.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.32rem',
                          borderRadius: '7px',
                          border: active ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.35)',
                          background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                          padding: '0.16rem 0.24rem 0.16rem 0.2rem',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setCustomFrameUrl(cf.url)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#e0f2fe',
                            fontSize: '0.73rem',
                            fontWeight: active ? 700 : 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.32rem',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
                          {thumbSrc && (
                            <img
                              src={thumbSrc}
                              alt={cf.label}
                              style={{
                                width: '26px',
                                height: '19px',
                                objectFit: 'cover',
                                borderRadius: '3px',
                                background: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.2)',
                              }}
                            />
                          )}
                          <span style={{ maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cf.label}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSavedFrame(cf.id)}
                          title="លុបគំរូស៊ុមនេះ"
                          style={{
                            border: 'none',
                            borderRadius: '4px',
                            background: 'rgba(248, 113, 113, 0.18)',
                            color: '#fca5a5',
                            padding: '0.08rem 0.32rem',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            lineHeight: 1.2,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {studioFrameTemplates.map((stFrame) => {
                    const active = customFrameUrl.trim() === stFrame.url;
                    const thumbSrc = resolveSheetAssetSrc(stFrame.url);
                    return (
                      <button
                        key={stFrame.id}
                        type="button"
                        onClick={() => setCustomFrameUrl(stFrame.url)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.16rem 0.42rem',
                          borderRadius: '7px',
                          border: active ? '2px solid #a78bfa' : '1px solid rgba(167, 139, 250, 0.35)',
                          background: active ? 'rgba(167, 139, 250, 0.2)' : '#0f172a',
                          color: '#ddd6fe',
                          fontSize: '0.73rem',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {thumbSrc && (
                          <img
                            src={thumbSrc}
                            alt={stFrame.label}
                            style={{
                              width: '26px',
                              height: '19px',
                              objectFit: 'cover',
                              borderRadius: '3px',
                              background: '#ffffff',
                            }}
                          />
                        )}
                        <span>{stFrame.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4-Side Frame Safety Margin Controls (Default 4 cm Top / Bottom / Left / Right) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.45rem',
                  padding: '0.35rem 0.55rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a5b4fc' }}>
                  គន្លាត Margin ជុំវិញសម្រាប់ស៊ុម (cm)៖
                </span>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={uniformMargins}
                    onChange={(e) => setUniformMargins(e.target.checked)}
                  />
                  <span>៤ ជ្រុងស្មើគ្នា</span>
                </label>

                {[
                  { side: 'top' as const, label: 'លើ' },
                  { side: 'bottom' as const, label: 'ក្រោម' },
                  { side: 'left' as const, label: 'ឆ្វេង' },
                  { side: 'right' as const, label: 'ស្តាំ' },
                ].map((item) => (
                  <div key={item.side} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.22rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.label}:</span>
                    <input
                      type="number"
                      step="0.2"
                      min="0.4"
                      max="5.5"
                      value={frameMarginsCm[item.side]}
                      onChange={(e) => handleUpdateMarginCm(item.side, e.target.value)}
                      style={{
                        width: '50px',
                        padding: '0.18rem 0.3rem',
                        borderRadius: '5px',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.2rem' }}>
                  {[1.2, 2, 3, 4].map((presetCm) => {
                    const isMatch =
                      frameMarginsCm.top === presetCm &&
                      frameMarginsCm.bottom === presetCm &&
                      frameMarginsCm.left === presetCm &&
                      frameMarginsCm.right === presetCm;
                    return (
                      <button
                        key={presetCm}
                        type="button"
                        onClick={() => handleApplyUniformCm(presetCm)}
                        style={{
                          padding: '0.16rem 0.42rem',
                          borderRadius: '5px',
                          border: isMatch ? '1px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.25)',
                          background: isMatch ? 'rgba(99, 102, 241, 0.28)' : '#1e293b',
                          color: isMatch ? '#e0e7ff' : '#94a3b8',
                          fontSize: '0.71rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {presetCm} cm
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Frame Link Input (Common) + Separated Content/Footer per docType */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
                gap: '0.55rem',
              }}
            >
              {/* Custom Frame URL Input + Add preset button */}
              <div>
                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.2rem' }}>
                  Link គំរូស៊ុម ({docType === 'certificate' ? 'វិញ្ញាបនបត្រ A4 ផ្ដេក' : 'ប័ណ្ណសរសើរ A5'})
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={customFrameUrl}
                    onChange={(e) => setCustomFrameUrl(e.target.value)}
                    placeholder="បិទភ្ជាប់ Link ឬចុច Upload ស៊ុមខាងលើ..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.76rem',
                      outline: 'none',
                    }}
                  />
                  {customFrameUrl && (
                    <>
                      <input
                        type="text"
                        value={newFrameLabel}
                        onChange={(e) => setNewFrameLabel(e.target.value)}
                        placeholder="ឈ្មោះស៊ុម"
                        style={{
                          width: '74px',
                          padding: '0.35rem 0.4rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.73rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomFrameLink}
                        title="បន្ថែមស៊ុមនេះចូលបញ្ជីគំរូរហ័ស និងរក្សាទុក"
                        style={{
                          padding: '0 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          background: 'rgba(56, 189, 248, 0.16)',
                          color: '#7dd3fc',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        + រក្សាទុក
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomFrameUrl('')}
                        style={{
                          padding: '0 0.4rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(248, 113, 113, 0.35)',
                          background: 'rgba(248, 113, 113, 0.12)',
                          color: '#fca5a5',
                          cursor: 'pointer',
                        }}
                      >
                        <AppIcon name="x" size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {docType !== 'certificate' && (
                <>
                  {/* Praise Letter Exam Names (Khmer & English) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        ការប្រឡង (ខ្មែរ)
                      </label>
                      <input
                        type="text"
                        value={examKhmer}
                        onChange={(e) => setExamKhmer(e.target.value)}
                        placeholder="ប្រចាំខែកុម្ភៈ"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        Exam Name (English)
                      </label>
                      <input
                        type="text"
                        value={examEnglish}
                        onChange={(e) => setExamEnglish(e.target.value)}
                        placeholder="The Monthly Exam of February"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Praise Letter Dates (Conducted + Issued Date) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        ថ្ងៃប្រឡង (Conducted)
                      </label>
                      <div style={{ display: 'flex', gap: '0.22rem' }}>
                        <input
                          type="text"
                          value={conductedDate}
                          onChange={(e) => setConductedDate(e.target.value)}
                          placeholder="06/Mar/2025"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '0.35rem 0.45rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            background: '#0f172a',
                            color: '#f8fafc',
                            fontSize: '0.76rem',
                            outline: 'none',
                          }}
                        />
                        <input
                          type="date"
                          title="ជ្រើសថ្ងៃប្រឡងពីប្រតិទិន"
                          onChange={(e) => {
                            const formatted = isoDateToConductedFormat(e.target.value);
                            if (formatted) setConductedDate(formatted);
                          }}
                          style={{
                            width: '28px',
                            padding: '0.2rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            background: '#0f172a',
                            color: '#f8fafc',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#fde68a', marginBottom: '0.2rem' }}>
                        ថ្ងៃចុះហត្ថលេខា (Issued Date - ប័ណ្ណសរសើរ)
                      </label>
                      <div style={{ display: 'flex', gap: '0.22rem' }}>
                        <input
                          type="text"
                          value={issuedDate}
                          onChange={(e) => setIssuedDate(e.target.value)}
                          placeholder="25-November-2026"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '0.35rem 0.45rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            background: '#0f172a',
                            color: '#f8fafc',
                            fontSize: '0.76rem',
                            outline: 'none',
                          }}
                        />
                        <input
                          type="date"
                          title="ជ្រើសថ្ងៃចុះហត្ថលេខាពីប្រតិទិន"
                          onChange={(e) => {
                            const formatted = isoDateToIssuedFormat(e.target.value);
                            if (formatted) setIssuedDate(formatted);
                          }}
                          style={{
                            width: '28px',
                            padding: '0.2rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            background: '#0f172a',
                            color: '#f8fafc',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Praise Letter Separate Footer: Title, Signatory Name, Stamp URL, Signature URL */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        តួនាទីជើងប័ណ្ណសរសើរ (Principal Title)
                      </label>
                      <input
                        type="text"
                        value={praisePrincipalTitle}
                        onChange={(e) => setPraisePrincipalTitle(e.target.value)}
                        placeholder="The Principal of BSIS"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        ឈ្មោះចុះហត្ថលេខា (ប័ណ្ណសរសើរ)
                      </label>
                      <input
                        type="text"
                        value={praiseSignatoryName}
                        onChange={(e) => setPraiseSignatoryName(e.target.value)}
                        placeholder="សំរិត វឌ្ឍនៈ"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#fda4af', marginBottom: '0.2rem' }}>
                        Link ត្រា (ប័ណ្ណសរសើរ)
                      </label>
                      <input
                        type="text"
                        value={praiseStampUrl}
                        onChange={(e) => setPraiseStampUrl(e.target.value)}
                        placeholder="ទុកទំនេរ = ត្រា BSIS ក្រហម"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>
                        Link ហត្ថលេខា (ប័ណ្ណសរសើរ)
                      </label>
                      <input
                        type="text"
                        value={praiseSignatureUrl}
                        onChange={(e) => setPraiseSignatureUrl(e.target.value)}
                        placeholder="ទុកទំនេរ = ហត្ថលេខាប៊ិកខៀវ"
                        style={{
                          width: '100%',
                          padding: '0.35rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vertical Top School Logo URL + Upload & Saved Presets */}
            <div
              style={{
                background: '#0f172a',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '8px',
                padding: '0.45rem 0.6rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fde68a' }}>
                  Logo សាលាផ្នែកខាងលើ (Logo បញ្ឈរ - Link ឬ Upload)
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.72rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={designConfig.showLogoSchoolText}
                    onChange={(e) =>
                      setDesignConfig((prev) =>
                        normalizeCertificateDesign({ ...prev, showLogoSchoolText: e.target.checked })
                      )
                    }
                  />
                  <span>បង្ហាញឈ្មោះសាលាខាងក្រោម Logo</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  value={designConfig.topLogoUrl || ''}
                  onChange={(e) =>
                    setDesignConfig((prev) =>
                      normalizeCertificateDesign({
                        ...prev,
                        topLogoUrl: e.target.value,
                        logoLayoutMode: 'vertical',
                      })
                    )
                  }
                  placeholder="បិទភ្ជាប់ Link Logo បញ្ឈរ (Google Drive / URL) ឬ Upload..."
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '0.34rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                />

                {designConfig.topLogoUrl && (
                  <>
                    <input
                      type="text"
                      value={newTopLogoLabel}
                      onChange={(e) => setNewTopLogoLabel(e.target.value)}
                      placeholder="ឈ្មោះ Logo"
                      style={{
                        width: '82px',
                        padding: '0.34rem 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.73rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTopLogoLink}
                      style={{
                        padding: '0.32rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(52, 211, 153, 0.45)',
                        background: 'rgba(16, 185, 129, 0.16)',
                        color: '#6ee7b7',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + រក្សាទុក Logo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDesignConfig((prev) =>
                          normalizeCertificateDesign({ ...prev, topLogoUrl: '' })
                        )
                      }
                      title="ប្រើ Logo សាលាដើមវិញ"
                      style={{
                        padding: '0.32rem 0.45rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.12)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </>
                )}

                <input
                  ref={topLogoUploadInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadLogoAsset('top', e)}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  disabled={isUploadingTopLogo}
                  onClick={() => topLogoUploadInputRef.current?.click()}
                  style={{
                    padding: '0.32rem 0.62rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(251, 191, 36, 0.45)',
                    background: 'rgba(251, 191, 36, 0.14)',
                    color: '#fde68a',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: isUploadingTopLogo ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isUploadingTopLogo ? 'កំពុង Upload...' : 'Upload Logo បញ្ឈរ'}
                </button>
              </div>

              {savedTopLogos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.71rem', color: '#94a3b8' }}>Logo ដែលបាន Save៖</span>
                  {savedTopLogos.map((logoItem) => {
                    const isAct = String(designConfig.topLogoUrl || '').trim() === logoItem.url;
                    const thumb = resolveSheetAssetSrc(logoItem.url);
                    return (
                      <div
                        key={logoItem.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.28rem',
                          borderRadius: '6px',
                          border: isAct ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.28)',
                          background: isAct ? 'rgba(251, 191, 36, 0.18)' : '#1e293b',
                          padding: '0.14rem 0.25rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setDesignConfig((prev) =>
                              normalizeCertificateDesign({
                                ...prev,
                                topLogoUrl: logoItem.url,
                                logoLayoutMode: 'vertical',
                              })
                            )
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: isAct ? '#fde68a' : '#e2e8f0',
                            fontSize: '0.72rem',
                            fontWeight: isAct ? 700 : 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.26rem',
                            cursor: 'pointer',
                          }}
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              alt={logoItem.label}
                              style={{ width: '16px', height: '20px', objectFit: 'contain', background: '#fff', borderRadius: '2px' }}
                            />
                          )}
                          <span>{logoItem.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSavedLogo('top', logoItem.id)}
                          style={{
                            border: 'none',
                            background: 'rgba(248, 113, 113, 0.15)',
                            color: '#fca5a5',
                            borderRadius: '4px',
                            padding: '0.06rem 0.28rem',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course Completion Certificate Settings & MoEYS Logo Block */}
            {docType === 'certificate' && (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7dd3fc' }}>
                    ការកំណត់វិញ្ញាបនបត្របញ្ចប់វគ្គសិក្សា &amp; ឡូហ្គោក្រសួងអប់រំ (MoEYS)
                  </span>
                </div>

                {/* Ministry Logo Link + Upload + Save Preset */}
                <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={courseDesignConfig.ministryLogoUrl || ''}
                    onChange={(e) =>
                      setCourseDesignConfig((prev) =>
                        normalizeCertificateDesign(
                          { ...prev, ministryLogoUrl: e.target.value },
                          DEFAULT_COURSE_CERTIFICATE_DESIGN
                        )
                      )
                    }
                    placeholder="បិទភ្ជាប់ Link ឡូហ្គោក្រសួងអប់រំ (Google Drive / URL) ឬ Upload..."
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '0.34rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                  {courseDesignConfig.ministryLogoUrl && (
                    <>
                      <input
                        type="text"
                        value={newMinistryLogoLabel}
                        onChange={(e) => setNewMinistryLogoLabel(e.target.value)}
                        placeholder="ឈ្មោះ Logo"
                        style={{
                          width: '82px',
                          padding: '0.34rem 0.42rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: '#1e293b',
                          color: '#f8fafc',
                          fontSize: '0.73rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddMinistryLogoLink}
                        style={{
                          padding: '0.32rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(52, 211, 153, 0.45)',
                          background: 'rgba(16, 185, 129, 0.16)',
                          color: '#6ee7b7',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        + រក្សាទុក Logo ក្រសួង
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseDesignConfig((prev) =>
                            normalizeCertificateDesign(
                              { ...prev, ministryLogoUrl: '' },
                              DEFAULT_COURSE_CERTIFICATE_DESIGN
                            )
                          )
                        }
                        title="ប្រើឡូហ្គោក្រសួងដើមវិញ"
                        style={{
                          padding: '0.32rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(248, 113, 113, 0.35)',
                          background: 'rgba(248, 113, 113, 0.12)',
                          color: '#fca5a5',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </>
                  )}
                  <input
                    ref={ministryLogoUploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadLogoAsset('ministry', e)}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingMinistryLogo}
                    onClick={() => ministryLogoUploadInputRef.current?.click()}
                    style={{
                      padding: '0.32rem 0.62rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#bae6fd',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: isUploadingMinistryLogo ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isUploadingMinistryLogo ? 'កំពុង Upload...' : 'Upload Logo ក្រសួងអប់រំ'}
                  </button>
                </div>

                {savedMinistryLogos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.71rem', color: '#94a3b8' }}>Logo ក្រសួងដែលបាន Save៖</span>
                    {savedMinistryLogos.map((logoItem) => {
                      const isAct = String(courseDesignConfig.ministryLogoUrl || '').trim() === logoItem.url;
                      const thumb = resolveSheetAssetSrc(logoItem.url);
                      return (
                        <div
                          key={logoItem.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.28rem',
                            borderRadius: '6px',
                            border: isAct ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                            background: isAct ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
                            padding: '0.14rem 0.25rem',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCourseDesignConfig((prev) =>
                                normalizeCertificateDesign(
                                  { ...prev, ministryLogoUrl: logoItem.url },
                                  DEFAULT_COURSE_CERTIFICATE_DESIGN
                                )
                              )
                            }
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: isAct ? '#bae6fd' : '#e2e8f0',
                              fontSize: '0.72rem',
                              fontWeight: isAct ? 700 : 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.26rem',
                              cursor: 'pointer',
                            }}
                          >
                            {thumb && (
                              <img
                                src={thumb}
                                alt={logoItem.label}
                                style={{ width: '18px', height: '18px', objectFit: 'contain', background: '#fff', borderRadius: '2px' }}
                              />
                            )}
                            <span>{logoItem.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedLogo('ministry', logoItem.id)}
                            style={{
                              border: 'none',
                              background: 'rgba(248, 113, 113, 0.15)',
                              color: '#fca5a5',
                              borderRadius: '4px',
                              padding: '0.06rem 0.28rem',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Course, Province, Dept, Start No & Separated Certificate Footer inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      ខេត្ត / ក្រុង
                    </label>
                    <input
                      type="text"
                      value={provinceKh}
                      onChange={(e) => setProvinceKh(e.target.value)}
                      placeholder="ខេត្តកណ្តាល"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      មន្ទីរអប់រំ
                    </label>
                    <input
                      type="text"
                      value={deptKh}
                      onChange={(e) => setDeptKh(e.target.value)}
                      placeholder="មន្ទីរអប់រំ យុវជន និងកីឡា"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      វគ្គសិក្សា (ខ្មែរ)
                    </label>
                    <input
                      type="text"
                      value={courseNameKh}
                      onChange={(e) => setCourseNameKh(e.target.value)}
                      placeholder="ភាសាអង់គ្លេស"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      Course Name (English)
                    </label>
                    <input
                      type="text"
                      value={courseNameEn}
                      onChange={(e) => setCourseNameEn(e.target.value)}
                      placeholder="English Course"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      លេខរៀងចាប់ផ្តើម (No.)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={certStartNumber}
                      onChange={(e) => setCertStartNumber(Math.max(1, parseInt(e.target.value || '1', 10) || 1))}
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Separated Footer & Signature controls specifically for Course Certificate */}
                <div
                  style={{
                    borderTop: '1px dashed rgba(56, 189, 248, 0.25)',
                    paddingTop: '0.45rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.4rem',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#fde68a', marginBottom: '0.16rem' }}>
                      ទីកន្លែង &amp; ថ្ងៃចេញ (ជើងវិញ្ញាបនបត្រ)
                    </label>
                    <input
                      type="text"
                      value={certPlaceDateText}
                      onChange={(e) => setCertPlaceDateText(e.target.value)}
                      placeholder="Kandal, April 01st 2026"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                      តួនាទីជើងវិញ្ញាបនបត្រ (Title)
                    </label>
                    <input
                      type="text"
                      value={certPrincipalTitle}
                      onChange={(e) => setCertPrincipalTitle(e.target.value)}
                      placeholder="The principal of BSIS"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.16rem' }}>
                      ឈ្មោះចុះហត្ថលេខា (វិញ្ញាបនបត្រ)
                    </label>
                    <input
                      type="text"
                      value={certSignatoryName}
                      onChange={(e) => setCertSignatoryName(e.target.value)}
                      placeholder="សំរិត វឌ្ឍនៈ"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#fda4af', marginBottom: '0.16rem' }}>
                      Link ត្រា (វិញ្ញាបនបត្រ)
                    </label>
                    <input
                      type="text"
                      value={certStampUrl}
                      onChange={(e) => setCertStampUrl(e.target.value)}
                      placeholder="ទុកទំនេរ = ត្រា BSIS"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                      Link ហត្ថលេខា (វិញ្ញាបនបត្រ)
                    </label>
                    <input
                      type="text"
                      value={certSignatureUrl}
                      onChange={(e) => setCertSignatureUrl(e.target.value)}
                      placeholder="ទុកទំនេរ = ហត្ថលេខាប៊ិកខៀវ"
                      style={{ width: '100%', padding: '0.28rem 0.45rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#f8fafc', fontSize: '0.73rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom toggles: Show/Hide Student Photo, Cut Guide (A5-2up only) & Save */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                paddingTop: '0.25rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.14)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.24rem 0.65rem',
                    borderRadius: '999px',
                    border: showStudentPhoto ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                    background: showStudentPhoto ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                    color: showStudentPhoto ? '#7dd3fc' : '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showStudentPhoto}
                    onChange={(e) => setShowStudentPhoto(e.target.checked)}
                  />
                  <span>បង្ហាញរូបថតសិស្ស ({showStudentPhoto ? 'បើក' : 'លាក់'})</span>
                </label>

                {effectivePaperMode === 'a4_two_up' && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', fontSize: '0.76rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showCutGuide}
                      onChange={(e) => setShowCutGuide(e.target.checked)}
                    />
                    <span>បន្ទាត់កាត់កណ្តាល (A5)</span>
                  </label>
                )}
              </div>

              {onSaveSettings && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {saveFeedback && (
                    <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700 }}>
                      {saveFeedback}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    style={{
                      padding: '0.32rem 0.78rem',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.77rem',
                      fontWeight: 700,
                      cursor: isSaving ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                    }}
                  >
                    <AppIcon name="check" size={14} strokeWidth={2.4} />
                    <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Saved Design Template Selector Strip */}
            {savedDesignTemplates.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  paddingTop: '0.25rem',
                  borderTop: '1px solid rgba(148, 163, 184, 0.14)',
                }}
              >
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#fbbf24' }}>
                  គំរូរចនាដែលបាន Save៖
                </span>
                {savedDesignTemplates.map((tpl) => {
                  const active = tpl.id === activeDesignTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyDesignTemplate(tpl)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.28)',
                        background: active ? 'rgba(251, 191, 36, 0.18)' : '#0f172a',
                        color: active ? '#fde68a' : '#cbd5e1',
                        fontSize: '0.73rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {tpl.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
          </aside>
        )}

      {/* Main Workspace: Interactive Design Studio OR A4/A5 Print Preview */}
      <div className="print-preview-stage">
      {viewMode === 'design' ? (
        <div style={{ width: '100%', flex: 1, padding: '1rem' }}>
          <CertificateDesignEditor
            recipient={
              selectedRecipients[0] ||
              allCandidateRecipients[0] || {
                uid: 'sample',
                classId: 'sample',
                classCode: 'L1AF',
                className: 'Level 1',
                shiftLabel: 'ពេញម៉ោង',
                teacherName: 'ណាន សៀវអ៊ី',
                studentId: 'BS0001',
                fullName: 'ឡៃ ស្រីណាត',
                englishName: 'Lai Sreynat',
                gender: 'ស្រី',
                dob: '2011-07-03',
                certNumber: String(certStartNumber || 180),
                level: 'L1',
                bookName: 'Family & Friend 2',
                rank: 1,
                grade: 'A',
                isPassing: true,
                averageDisplay: '48.50',
                photo: '',
              }
            }
            docType={docType}
            framePreset={activeFramePreset}
            customFrameUrl={customFrameUrl}
            frameMarginsCm={frameMarginsCm}
            designConfig={designConfig}
            onChangeDesign={setDesignConfig}
            showStudentPhoto={showStudentPhoto}
            onToggleShowStudentPhoto={setShowStudentPhoto}
            examKhmer={examKhmer}
            examEnglish={examEnglish}
            conductedDate={conductedDate}
            issuedDate={issuedDate}
            courseNameKh={courseNameKh}
            courseNameEn={courseNameEn}
            certPlaceDateText={certPlaceDateText}
            provinceKh={provinceKh}
            deptKh={deptKh}
            stampUrl={stampUrl}
            signatureUrl={signatureUrl}
            signatoryName={signatoryName}
            principalTitle={principalTitle}
            schoolProfile={schoolProfile}
            savedDesignTemplates={savedDesignTemplates}
            activeDesignTemplateId={activeDesignTemplateId}
            onApplyDesignTemplate={handleApplyDesignTemplate}
            onSaveNewDesignTemplate={handleSaveNewDesignTemplate}
            onUpdateCurrentDesignTemplate={handleUpdateCurrentDesignTemplate}
            onDeleteDesignTemplate={handleDeleteDesignTemplate}
            isSavingTemplate={isSavingDesignTemplate}
          />
        </div>
      ) : (
      <div
        className="receipt-a4-sheets-container"
        style={{
          flex: 1,
          padding: '1.25rem 1rem 2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {renderedPrintPages.length === 0 ? (
          <div
            className="no-print"
            style={{
              marginTop: '3rem',
              padding: '2rem',
              borderRadius: '14px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#cbd5e1',
              textAlign: 'center',
              maxWidth: '500px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.45rem' }}>
              {docType === 'certificate' && !selectedFinalExamId
                ? 'មិនទាន់មានការប្រឡងបញ្ចប់វគ្គសម្រាប់ចេញវិញ្ញាបនបត្រ'
                : isLoadingModalScores
                  ? 'កំពុងទាញយកទិន្នន័យពិន្ទុ...'
                  : 'មិនមានទិន្នន័យសិស្សជាប់ចំណាត់ថ្នាក់សម្រាប់ចេញប័ណ្ណ'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: docType === 'certificate' && onCreateFinalExam && !selectedFinalExamId ? '1rem' : 0 }}>
              {docType === 'certificate'
                ? 'វិញ្ញាបនបត្រប្រើទិន្នន័យចេញពីការប្រឡងបញ្ចប់វគ្គប៉ុណ្ណោះ (មិនយកពិន្ទុប្រចាំខែទេ)។ សូមជ្រើសរើស ឬបង្កើតការប្រឡងបញ្ចប់វគ្គ។'
                : 'សូមជ្រើសរើសថ្នាក់រៀនដែលមានពិន្ទុ និងចំណាត់ថ្នាក់រួចរាល់ ឬចុច "សិស្ស" ដើម្បីជ្រើសរើសសិស្ស។'}
            </div>
            {docType === 'certificate' && onCreateFinalExam && !selectedFinalExamId && (
              <button
                type="button"
                onClick={onCreateFinalExam}
                style={{
                  padding: '0.52rem 1rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + បង្កើតការប្រឡងបញ្ចប់វគ្គសិក្សា
              </button>
            )}
          </div>
        ) : (
          renderedPrintPages.map((pg, idx) => (
            <div key={pg.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                className="no-print"
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                ទំព័រទី {idx + 1} / {renderedPrintPages.length} — {pg.label}
              </div>

              <div
                className="receipt-a4-page-wrapper"
                style={{
                  width: `${sheetSpec.sheetWPx * previewScale}px`,
                  height: `${sheetSpec.sheetHPx * previewScale}px`,
                  position: 'relative',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="receipt-a4-preview-scale"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: sheetSpec.sheetW,
                    height: sheetSpec.sheetH,
                  }}
                >
                  {effectivePaperMode === 'a4_landscape' ? (
                    <CertificateSingleA4LandscapePage
                      recipient={pg.topRecipient}
                      sharedCardProps={sharedCardProps}
                    />
                  ) : effectivePaperMode === 'a4_two_up' ? (
                    <CertificatePairA4Page
                      topRecipient={pg.topRecipient}
                      bottomRecipient={pg.bottomRecipient}
                      showCutGuide={showCutGuide}
                      sharedCardProps={sharedCardProps}
                    />
                  ) : (
                    <CertificateSingleA5Page
                      recipient={pg.topRecipient}
                      sharedCardProps={sharedCardProps}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}
      </div>
      </div>
    </div>,
    document.body
  );
}
