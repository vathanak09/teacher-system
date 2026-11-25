"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ENGLISH_MONTH_NAMES } from '@/utils/cambodiaHolidays';
import { photoFrameTemplateService, settingsService } from '@/services/db';
import { uploadCertificateFrame } from '@/services/db/StorageService';
import { SchoolProfileInfo, DEFAULT_SCHOOL_PROFILE } from '@/components/settings/SchoolInfoSettingsPanel';
import {
  A4_PORTRAIT_SPEC,
  MonthlyResultClassPacket,
  computeMonthlyResultPacketsForClass,
  resolveSheetAssetSrc,
} from './MonthlyResultSheet';
import {
  A5_LANDSCAPE_SPEC,
  CERTIFICATE_FRAME_PRESETS,
  CertificateDesignConfig,
  CertificateDocType,
  CertificatePairA4Page,
  CertificatePrintPaperMode,
  CertificateRecipient,
  CertificateSingleA5Page,
  DEFAULT_CERTIFICATE_DESIGN,
  DEFAULT_CERTIFICATE_MARGINS_CM,
  FrameMarginsCm,
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

export interface CertificateBrandingConfig {
  certDocType?: CertificateDocType;
  certFramePresetId?: string;
  certFrameUrl?: string;
  certCustomFrames?: SavedCustomFrameLink[];
  certTopLogoUrl?: string;
  certSavedTopLogos?: SavedCustomFrameLink[];
  certFrameMarginsCm?: FrameMarginsCm;
  certDesignConfig?: CertificateDesignConfig;
  certDesignTemplates?: SavedCertificateDesignTemplate[];
  certActiveDesignId?: string | null;
  certShowStudentPhoto?: boolean;
  certPrincipalTitle?: string;
  resultStampUrl?: string;
  resultSignatureUrl?: string;
  resultSignatoryName?: string;
}

export type RankRangeMode = 'top3' | 'top5' | 'manual';

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
  onMonthChange: (newMonth: string) => void;
  monthExtraData?: {
    monthKhmer?: string;
    monthEnglish?: string;
    issueDateEnglish?: string;
  };
  initialClassId?: string | null;
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
  onMonthChange,
  monthExtraData,
  initialClassId,
  onSaveSettings,
}: CertificatePrintModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [docType, setDocType] = useState<CertificateDocType>('praise');
  const [rankMode, setRankMode] = useState<RankRangeMode>('top3');
  const [splitBehavior, setSplitBehavior] = useState<'auto' | 'always' | 'never'>('auto');
  const [paperMode, setPaperMode] = useState<CertificatePrintPaperMode>('a4_two_up');
  const [showStudentPhoto, setShowStudentPhoto] = useState<boolean>(false);
  const [showCutGuide, setShowCutGuide] = useState<boolean>(true);

  // Manual student inclusion/exclusion overrides
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [excludedUids, setExcludedUids] = useState<string[]>([]);
  const [manualPickedUids, setManualPickedUids] = useState<string[]>([]);

  // Frame template & links
  const [framePresetId, setFramePresetId] = useState<string>(CERTIFICATE_FRAME_PRESETS[0].id);
  const [customFrameUrl, setCustomFrameUrl] = useState<string>('');
  const [savedCustomFrames, setSavedCustomFrames] = useState<SavedCustomFrameLink[]>([]);
  const [newFrameLabel, setNewFrameLabel] = useState<string>('');
  const [savedTopLogos, setSavedTopLogos] = useState<SavedCustomFrameLink[]>([]);
  const [newTopLogoLabel, setNewTopLogoLabel] = useState<string>('');
  const [isUploadingTopLogo, setIsUploadingTopLogo] = useState<boolean>(false);
  const topLogoUploadInputRef = useRef<HTMLInputElement>(null);
  const [studioFrameTemplates, setStudioFrameTemplates] = useState<SavedCustomFrameLink[]>([]);
  const [frameMarginsCm, setFrameMarginsCm] = useState<FrameMarginsCm>(DEFAULT_CERTIFICATE_MARGINS_CM);
  const [uniformMargins, setUniformMargins] = useState<boolean>(true);
  const [isUploadingFrames, setIsUploadingFrames] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const frameUploadInputRef = useRef<HTMLInputElement>(null);

  // Bilingual text & dates & signing
  const defaultExam = useMemo(
    () => formatExamLabelsFromMonthStr(selectedMonth, monthExtraData?.monthKhmer),
    [selectedMonth, monthExtraData?.monthKhmer]
  );
  const [examKhmer, setExamKhmer] = useState<string>(defaultExam.examKhmer);
  const [examEnglish, setExamEnglish] = useState<string>(defaultExam.examEnglish);
  const [conductedDate, setConductedDate] = useState<string>(formatConductedDateDefault());
  const [issuedDate, setIssuedDate] = useState<string>(
    String(monthExtraData?.issueDateEnglish || '').trim() || formatIssuedDateDefault()
  );
  const [stampUrl, setStampUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatoryName, setSignatoryName] = useState<string>('សំរិត វឌ្ឍនៈ');
  const [principalTitle, setPrincipalTitle] = useState<string>('The Principal of BSIS');

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'preview' | 'design'>('preview');
  const [designConfig, setDesignConfig] = useState<CertificateDesignConfig>(DEFAULT_CERTIFICATE_DESIGN);
  const [savedDesignTemplates, setSavedDesignTemplates] = useState<SavedCertificateDesignTemplate[]>([]);
  const [activeDesignTemplateId, setActiveDesignTemplateId] = useState<string | null>(null);
  const [isSavingDesignTemplate, setIsSavingDesignTemplate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileInfo>(DEFAULT_SCHOOL_PROFILE);

  // Sync defaults from scoreSettings & monthExtraData when opened
  useEffect(() => {
    if (!isOpen) return;
    setDocType(scoreSettings?.certDocType === 'certificate' ? 'certificate' : 'praise');
    setFramePresetId(scoreSettings?.certFramePresetId || CERTIFICATE_FRAME_PRESETS[0].id);
    setCustomFrameUrl(scoreSettings?.certFrameUrl || '');
    setSavedCustomFrames(Array.isArray(scoreSettings?.certCustomFrames) ? scoreSettings.certCustomFrames : []);
    setSavedTopLogos(Array.isArray(scoreSettings?.certSavedTopLogos) ? scoreSettings.certSavedTopLogos : []);
    const restoredDesign = normalizeCertificateDesign(scoreSettings?.certDesignConfig);
    if (!restoredDesign.topLogoUrl && scoreSettings?.certTopLogoUrl) {
      restoredDesign.topLogoUrl = String(scoreSettings.certTopLogoUrl);
    }
    setDesignConfig(restoredDesign);
    setSavedDesignTemplates(
      Array.isArray(scoreSettings?.certDesignTemplates) ? scoreSettings.certDesignTemplates : []
    );
    setActiveDesignTemplateId(scoreSettings?.certActiveDesignId || null);
    const savedMargins = scoreSettings?.certFrameMarginsCm;
    if (savedMargins && typeof savedMargins === 'object') {
      const m: FrameMarginsCm = {
        top: Number(savedMargins.top) > 0 ? Number(savedMargins.top) : DEFAULT_CERTIFICATE_MARGINS_CM.top,
        right: Number(savedMargins.right) > 0 ? Number(savedMargins.right) : DEFAULT_CERTIFICATE_MARGINS_CM.right,
        bottom: Number(savedMargins.bottom) > 0 ? Number(savedMargins.bottom) : DEFAULT_CERTIFICATE_MARGINS_CM.bottom,
        left: Number(savedMargins.left) > 0 ? Number(savedMargins.left) : DEFAULT_CERTIFICATE_MARGINS_CM.left,
      };
      setFrameMarginsCm(m);
      setUniformMargins(m.top === m.right && m.top === m.bottom && m.top === m.left);
    } else {
      setFrameMarginsCm(DEFAULT_CERTIFICATE_MARGINS_CM);
      setUniformMargins(true);
    }
    setShowStudentPhoto(Boolean(scoreSettings?.certShowStudentPhoto));
    setPrincipalTitle(scoreSettings?.certPrincipalTitle || 'The Principal of BSIS');
    setStampUrl(scoreSettings?.resultStampUrl || '');
    setSignatureUrl(scoreSettings?.resultSignatureUrl || '');
    setSignatoryName(scoreSettings?.resultSignatoryName || 'សំរិត វឌ្ឍនៈ');
    const examLabels = formatExamLabelsFromMonthStr(selectedMonth, monthExtraData?.monthKhmer);
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
  }, [isOpen, scoreSettings, selectedMonth, monthExtraData]);

  // Update exam labels when month changes inside modal
  useEffect(() => {
    if (!isOpen) return;
    const examLabels = formatExamLabelsFromMonthStr(selectedMonth, monthExtraData?.monthKhmer);
    setExamKhmer(examLabels.examKhmer);
    setExamEnglish(examLabels.examEnglish);
  }, [selectedMonth, isOpen, monthExtraData?.monthKhmer]);

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
    allScores.forEach((s: any) => {
      if (s?.month !== selectedMonth) return;
      const cid = String(s?.classId || '').trim();
      if (!cid) return;
      const hasVal = s?.totalScore !== '' && s?.totalScore !== undefined && s?.totalScore !== null && !isNaN(Number(s?.totalScore));
      if (hasVal) map.set(cid, (map.get(cid) || 0) + 1);
    });
    return map;
  }, [allScores, selectedMonth]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, initialClassId, classes, sortedClasses]);

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

  const sheetSpec = paperMode === 'a4_two_up' ? A4_PORTRAIT_SPEC : A5_LANDSCAPE_SPEC;

  // Responsive preview zoom
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const calcScale = () => {
      const availW = Math.max(320, window.innerWidth - 48);
      setPreviewScale(Math.min(1, availW / sheetSpec.sheetWPx));
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [isOpen, sheetSpec.sheetWPx]);

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

  // Compute ranked students across selected classes (and split levels if active)
  const classPackets: MonthlyResultClassPacket[] = useMemo(() => {
    const selectedSet = new Set(selectedClassIds);
    return sortedClasses
      .filter((c) => selectedSet.has(c.id))
      .flatMap((classObj) => {
        const classScoreRows = allScores.filter(
          (s: any) => s?.classId === classObj.id && s?.month === selectedMonth
        );
        return computeMonthlyResultPacketsForClass(
          {
            classObj,
            allStudents,
            allTeachers,
            allClasses: classes,
            classScoreRows,
            monthCoeffMap,
            scoreSettings,
            sortMode: 'rank_asc',
            includeUnscored: false,
          },
          splitBehavior
        );
      });
  }, [
    sortedClasses,
    selectedClassIds,
    allScores,
    selectedMonth,
    allStudents,
    allTeachers,
    classes,
    monthCoeffMap,
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
          level: r.level || packet.splitLevelLabel || '',
          bookName: packet.bookName || '',
          rank: r.rank,
          grade: r.grade,
          averageDisplay: r.averageDisplay,
          photo: r.photo || '',
        });
      });
    });
    return list;
  }, [classPackets]);

  // Keep manual list initialized with Top 3 whenever switching into manual mode if empty
  useEffect(() => {
    if (rankMode === 'manual' && manualPickedUids.length === 0 && allCandidateRecipients.length > 0) {
      setManualPickedUids(
        allCandidateRecipients.filter((c) => c.rank >= 1 && c.rank <= 3).map((c) => c.uid)
      );
    }
  }, [rankMode, allCandidateRecipients, manualPickedUids.length]);

  const selectedRecipients: CertificateRecipient[] = useMemo(() => {
    if (rankMode === 'manual') {
      const picked = new Set(manualPickedUids);
      return allCandidateRecipients.filter((c) => picked.has(c.uid));
    }
    const maxRank = rankMode === 'top3' ? 3 : 5;
    const excluded = new Set(excludedUids);
    return allCandidateRecipients.filter(
      (c) => c.rank >= 1 && c.rank <= maxRank && !excluded.has(c.uid)
    );
  }, [allCandidateRecipients, rankMode, excludedUids, manualPickedUids]);

  const activeFramePreset = useMemo(
    () => CERTIFICATE_FRAME_PRESETS.find((f) => f.id === framePresetId) || CERTIFICATE_FRAME_PRESETS[0],
    [framePresetId]
  );

  // Build printable pages (either 2x A5 per A4 Portrait, or 1x A5 Landscape per page)
  const renderedPrintPages = useMemo(() => {
    if (paperMode === 'a5_single') {
      return selectedRecipients.map((rec, idx) => ({
        key: `a5-${rec.uid}`,
        label: `ប័ណ្ណទី ${idx + 1}: ${rec.fullName} (លេខ ${rec.rank})`,
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
  }, [selectedRecipients, paperMode]);

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
      await onSaveSettings({
        certCustomFrames: nextList,
        ...(nextActiveUrl !== undefined ? { certFrameUrl: nextActiveUrl } : {}),
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

  const handleUploadTopLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTopLogo(true);
    setUploadStatusText('កំពុង Upload Logo បញ្ឈរ...');
    try {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const cleanId = `cert_top_logo_${Date.now()}`;
      const url = await uploadCertificateFrame(file, cleanId);
      const nextDesign = normalizeCertificateDesign({
        ...designConfig,
        topLogoUrl: url,
        logoLayoutMode: 'vertical',
      });
      setDesignConfig(nextDesign);
      const entry: SavedCustomFrameLink = {
        id: String(Date.now()),
        label: newTopLogoLabel.trim() || baseName.slice(0, 22) || `Logo ${savedTopLogos.length + 1}`,
        url,
      };
      const nextLogos = [...savedTopLogos, entry];
      setSavedTopLogos(nextLogos);
      setNewTopLogoLabel('');
      if (onSaveSettings) {
        await onSaveSettings({
          certTopLogoUrl: url,
          certSavedTopLogos: nextLogos,
          certDesignConfig: nextDesign,
        });
      }
      setUploadStatusText('Upload Logo បញ្ឈរបានជោគជ័យ!');
      setTimeout(() => setUploadStatusText(''), 3000);
    } catch (err: any) {
      console.error('Top logo upload failed:', err);
      alert('មានបញ្ហាក្នុងការ Upload Logo៖ ' + (err?.message || 'Unknown error'));
      setUploadStatusText('');
    } finally {
      setIsUploadingTopLogo(false);
      if (topLogoUploadInputRef.current) topLogoUploadInputRef.current.value = '';
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
    if (onSaveSettings) {
      await onSaveSettings({
        certTopLogoUrl: cleanUrl,
        certSavedTopLogos: nextLogos,
        certDesignConfig: normalizeCertificateDesign(designConfig),
      });
    }
  };

  const handleRemoveSavedTopLogo = async (id: string) => {
    const target = savedTopLogos.find((l) => l.id === id);
    const nextLogos = savedTopLogos.filter((l) => l.id !== id);
    setSavedTopLogos(nextLogos);
    let nextDesign = designConfig;
    if (target && String(designConfig.topLogoUrl || '').trim() === target.url) {
      nextDesign = normalizeCertificateDesign({ ...designConfig, topLogoUrl: '' });
      setDesignConfig(nextDesign);
    }
    if (onSaveSettings) {
      await onSaveSettings({
        certTopLogoUrl: nextDesign.topLogoUrl,
        certSavedTopLogos: nextLogos,
        certDesignConfig: nextDesign,
      });
    }
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
    setDocType(tpl.docType || 'praise');
    setFramePresetId(tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[0].id);
    setCustomFrameUrl(tpl.customFrameUrl || '');
    if (tpl.frameMarginsCm) {
      setFrameMarginsCm(tpl.frameMarginsCm);
      setUniformMargins(
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.right &&
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.bottom &&
        tpl.frameMarginsCm.top === tpl.frameMarginsCm.left
      );
    }
    setShowStudentPhoto(Boolean(tpl.showStudentPhoto));
    const norm = normalizeCertificateDesign(tpl.designConfig);
    setDesignConfig(norm);
    setActiveDesignTemplateId(tpl.id);
    if (onSaveSettings) {
      try {
        await onSaveSettings({
          certDocType: tpl.docType || 'praise',
          certFramePresetId: tpl.framePresetId || CERTIFICATE_FRAME_PRESETS[0].id,
          certFrameUrl: tpl.customFrameUrl || '',
          certTopLogoUrl: norm.topLogoUrl || '',
          certFrameMarginsCm: tpl.frameMarginsCm,
          certShowStudentPhoto: Boolean(tpl.showStudentPhoto),
          certDesignConfig: norm,
          certActiveDesignId: tpl.id,
        });
      } catch (err) {
        console.error('Failed persisting applied template:', err);
      }
    }
  };

  const handleSaveNewDesignTemplate = async (name: string) => {
    if (!onSaveSettings) return;
    setIsSavingDesignTemplate(true);
    try {
      const nextTpl: SavedCertificateDesignTemplate = {
        id: String(Date.now()),
        name,
        docType,
        framePresetId,
        customFrameUrl: customFrameUrl.trim(),
        frameMarginsCm,
        showStudentPhoto,
        designConfig: normalizeCertificateDesign(designConfig),
        updatedAt: new Date().toISOString(),
      };
      const nextTemplates = [...savedDesignTemplates, nextTpl];
      setSavedDesignTemplates(nextTemplates);
      setActiveDesignTemplateId(nextTpl.id);
      await onSaveSettings({
        certDesignTemplates: nextTemplates,
        certActiveDesignId: nextTpl.id,
        certDesignConfig: nextTpl.designConfig,
        certTopLogoUrl: nextTpl.designConfig.topLogoUrl || '',
        certDocType: docType,
        certFramePresetId: framePresetId,
        certFrameUrl: customFrameUrl.trim(),
        certFrameMarginsCm: frameMarginsCm,
        certShowStudentPhoto: showStudentPhoto,
      });
    } finally {
      setIsSavingDesignTemplate(false);
    }
  };

  const handleUpdateCurrentDesignTemplate = async () => {
    if (!onSaveSettings || !activeDesignTemplateId) return;
    setIsSavingDesignTemplate(true);
    try {
      const norm = normalizeCertificateDesign(designConfig);
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
      await onSaveSettings({
        certDesignTemplates: nextTemplates,
        certActiveDesignId: activeDesignTemplateId,
        certDesignConfig: norm,
        certTopLogoUrl: norm.topLogoUrl || '',
        certDocType: docType,
        certFramePresetId: framePresetId,
        certFrameUrl: customFrameUrl.trim(),
        certFrameMarginsCm: frameMarginsCm,
        certShowStudentPhoto: showStudentPhoto,
      });
    } finally {
      setIsSavingDesignTemplate(false);
    }
  };

  const handleDeleteDesignTemplate = async (id: string) => {
    const nextTemplates = savedDesignTemplates.filter((t) => t.id !== id);
    const nextActive = activeDesignTemplateId === id ? null : activeDesignTemplateId;
    setSavedDesignTemplates(nextTemplates);
    setActiveDesignTemplateId(nextActive);
    if (onSaveSettings) {
      await onSaveSettings({
        certDesignTemplates: nextTemplates,
        certActiveDesignId: nextActive,
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!onSaveSettings) return;
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const normDesign = normalizeCertificateDesign(designConfig);
      await onSaveSettings({
        certDocType: docType,
        certFramePresetId: framePresetId,
        certFrameUrl: customFrameUrl.trim(),
        certCustomFrames: savedCustomFrames,
        certTopLogoUrl: String(normDesign.topLogoUrl || '').trim(),
        certSavedTopLogos: savedTopLogos,
        certFrameMarginsCm: frameMarginsCm,
        certDesignConfig: normDesign,
        certDesignTemplates: savedDesignTemplates,
        certActiveDesignId: activeDesignTemplateId,
        certShowStudentPhoto: showStudentPhoto,
        certPrincipalTitle: principalTitle.trim() || 'The Principal of BSIS',
        resultStampUrl: stampUrl.trim(),
        resultSignatureUrl: signatureUrl.trim(),
        resultSignatoryName: signatoryName.trim() || 'សំរិត វឌ្ឍនៈ',
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
                onClick={() => setDocType('praise')}
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
                onClick={() => setDocType('certificate')}
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

            {/* Month Picker */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
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

            {/* Rank Range Selector: លេខ 1-3 | លេខ 1-5 | ជ្រើសផ្ទាល់ */}
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
              {[
                { id: 'top3' as RankRangeMode, label: 'លេខ ១ - ៣' },
                { id: 'top5' as RankRangeMode, label: 'លេខ ១ - ៥' },
                { id: 'manual' as RankRangeMode, label: 'ជ្រើសផ្ទាល់' },
              ].map((opt) => (
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

            {/* Paper Layout Mode: 2x A5 inside A4 Portrait vs Single A5 */}
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

            {/* Frame Link Input + Dates + Bilingual Exam Names + Signing */}
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
                  Link គំរូស៊ុមផ្សេងៗ (Google Drive / PNG URL)
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

              {/* Exam Names (Khmer & English) */}
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

              {/* Conducted Date + Issued/Signing Date */}
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
                    ថ្ងៃចុះហត្ថលេខា (Issued Date)
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

              {/* Stamp Link + Signature Link + Signatory Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#fda4af', marginBottom: '0.2rem' }}>
                    Link ត្រា (Stamp URL)
                  </label>
                  <input
                    type="text"
                    value={stampUrl}
                    onChange={(e) => setStampUrl(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
                    ឈ្មោះចុះហត្ថលេខា
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
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
                  onChange={handleUploadTopLogoFile}
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
                          onClick={() => handleRemoveSavedTopLogo(logoItem.id)}
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

            {/* Bottom toggles: Show/Hide Student Photo, Cut Guide, Signature Link & Save */}
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

                {paperMode === 'a4_two_up' && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', fontSize: '0.76rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showCutGuide}
                      onChange={(e) => setShowCutGuide(e.target.checked)}
                    />
                    <span>បន្ទាត់កាត់កណ្តាល (A5)</span>
                  </label>
                )}

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Link ហត្ថលេខា៖</span>
                  <input
                    type="text"
                    value={signatureUrl}
                    onChange={(e) => setSignatureUrl(e.target.value)}
                    placeholder="ទុកទំនេរ = ហត្ថលេខាប៊ិកខៀវ"
                    style={{
                      width: '155px',
                      padding: '0.25rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      background: '#0f172a',
                      color: '#f8fafc',
                      fontSize: '0.74rem',
                      outline: 'none',
                    }}
                  />
                </div>
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
      </div>

      {/* Main Workspace: Interactive Design Studio OR A4/A5 Print Preview */}
      {viewMode === 'design' ? (
        <div style={{ flex: 1, padding: '1rem' }}>
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
                level: 'L1',
                bookName: 'Family & Friend 2',
                rank: 1,
                grade: 'A',
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
              maxWidth: '460px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.45rem' }}>
              មិនមានទិន្នន័យសិស្សជាប់ចំណាត់ថ្នាក់សម្រាប់ចេញប័ណ្ណ
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              សូមជ្រើសរើសថ្នាក់រៀនដែលមានពិន្ទុ និងចំណាត់ថ្នាក់រួចរាល់ ឬចុច &quot;សិស្ស&quot; ដើម្បីជ្រើសរើសសិស្ស។
            </div>
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
                  {paperMode === 'a4_two_up' ? (
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
    </div>,
    document.body
  );
}
