"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SchoolProfileInfo } from '@/components/settings/SchoolInfoSettingsPanel';
import {
  A4_LANDSCAPE_SPEC,
  A5_LANDSCAPE_SPEC,
  CERT_ELEMENT_LABELS,
  CertElementKey,
  CertResizeHandleMode,
  CertificateCardA5,
  CertificateDesignConfig,
  CertificateDocType,
  CertificateFramePreset,
  CertificateRecipient,
  DEFAULT_CERTIFICATE_DESIGN,
  DEFAULT_COURSE_CERTIFICATE_DESIGN,
  ENGLISH_FONT_OPTIONS,
  FrameMarginsCm,
  KHMER_BODY_FONT_OPTIONS,
  KHMER_DISPLAY_FONT_OPTIONS,
  RIBBON_COLOR_SWATCHES,
  computeCertificateContentMetrics,
  normalizeCertificateDesign,
} from './CertificateSheet';
import { AppIcon } from '../AppIcons';

export interface SavedCertificateDesignTemplate {
  id: string;
  name: string;
  docType: CertificateDocType;
  framePresetId: string;
  customFrameUrl: string;
  frameMarginsCm: FrameMarginsCm;
  showStudentPhoto: boolean;
  designConfig: CertificateDesignConfig;
  updatedAt: string;
}

export interface CertificateDesignEditorProps {
  recipient: CertificateRecipient;
  docType: CertificateDocType;
  framePreset: CertificateFramePreset;
  customFrameUrl?: string;
  frameMarginsCm: FrameMarginsCm;
  designConfig: CertificateDesignConfig;
  onChangeDesign: (next: CertificateDesignConfig) => void;
  showStudentPhoto: boolean;
  onToggleShowStudentPhoto: (next: boolean) => void;
  examKhmer: string;
  examEnglish: string;
  conductedDate: string;
  issuedDate: string;
  courseNameKh?: string;
  courseNameEn?: string;
  certPlaceDateText?: string;
  provinceKh?: string;
  deptKh?: string;
  stampUrl?: string;
  signatureUrl?: string;
  signatoryName?: string;
  principalTitle?: string;
  schoolProfile?: SchoolProfileInfo;
  savedDesignTemplates: SavedCertificateDesignTemplate[];
  activeDesignTemplateId: string | null;
  onApplyDesignTemplate: (tpl: SavedCertificateDesignTemplate) => void;
  onSaveNewDesignTemplate: (name: string) => Promise<void>;
  onUpdateCurrentDesignTemplate: () => Promise<void>;
  onDeleteDesignTemplate: (id: string) => Promise<void>;
  isSavingTemplate: boolean;
}

type InspectorTab = 'element' | 'typography' | 'images';

const PX_PER_MM = 96 / 25.4;

export default function CertificateDesignEditor({
  recipient,
  docType,
  framePreset,
  customFrameUrl,
  frameMarginsCm,
  designConfig,
  onChangeDesign,
  showStudentPhoto,
  onToggleShowStudentPhoto,
  examKhmer,
  examEnglish,
  conductedDate,
  issuedDate,
  courseNameKh,
  courseNameEn,
  certPlaceDateText,
  provinceKh,
  deptKh,
  stampUrl,
  signatureUrl,
  signatoryName,
  principalTitle,
  schoolProfile,
  savedDesignTemplates,
  activeDesignTemplateId,
  onApplyDesignTemplate,
  onSaveNewDesignTemplate,
  onUpdateCurrentDesignTemplate,
  onDeleteDesignTemplate,
  isSavingTemplate,
}: CertificateDesignEditorProps) {
  const [selectedKey, setSelectedKey] = useState<CertElementKey>('titleBlock');
  const [draggingKey, setDraggingKey] = useState<CertElementKey | null>(null);
  const [frameDragEnabled, setFrameDragEnabled] = useState<boolean>(false);
  const [draggingFrame, setDraggingFrame] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('element');
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(true);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [editorScale, setEditorScale] = useState<number>(0.9);
  const stageWrapperRef = useRef<HTMLDivElement>(null);

  type DragInteraction =
    | {
        kind: 'move';
        key: CertElementKey;
        startClientX: number;
        startClientY: number;
        startDxMm: number;
        startDyMm: number;
      }
    | {
        kind: 'resize';
        key: CertElementKey;
        mode: CertResizeHandleMode;
        startClientX: number;
        startClientY: number;
        startScale: number;
        startPhotoW: number;
        startPhotoH: number;
        startLogoSize: number;
        startLogoW: number;
        startLogoH: number;
        startMinistryW: number;
        startMinistryH: number;
        startStampSize: number;
        startSigHeight: number;
        startRibbonSize: number;
      }
    | {
        kind: 'frameMove';
        startClientX: number;
        startClientY: number;
        startOffsetX: number;
        startOffsetY: number;
      }
    | {
        kind: 'frameResize';
        mode: 'frameSize' | 'frameWidth' | 'frameHeight';
        startClientX: number;
        startClientY: number;
        startScaleX: number;
        startScaleY: number;
      };

  const dragStateRef = useRef<DragInteraction | null>(null);

  const defaultDesignForDoc =
    docType === 'certificate' ? DEFAULT_COURSE_CERTIFICATE_DESIGN : DEFAULT_CERTIFICATE_DESIGN;

  const normalizedDesign = useMemo(
    () => normalizeCertificateDesign(designConfig, defaultDesignForDoc),
    [designConfig, defaultDesignForDoc]
  );

  useEffect(() => {
    setSelectedKey((prev) => {
      if (docType === 'certificate' && (prev === 'rankBadge' || prev === 'classMeta')) return 'titleBlock';
      if (docType !== 'certificate' && prev === 'ministryLogo') return 'titleBlock';
      return prev;
    });
  }, [docType]);

  const isA4Landscape = docType === 'certificate';
  const activeSheetSpec = isA4Landscape ? A4_LANDSCAPE_SPEC : A5_LANDSCAPE_SPEC;

  const metrics = useMemo(
    () => computeCertificateContentMetrics(frameMarginsCm, isA4Landscape ? 'a4_landscape' : 'a5'),
    [frameMarginsCm, isA4Landscape]
  );

  // Stable refs so mouse/pointer move listeners never tear down mid-drag
  const latestDesignRef = useRef(normalizedDesign);
  latestDesignRef.current = normalizedDesign;
  const onChangeDesignRef = useRef(onChangeDesign);
  onChangeDesignRef.current = onChangeDesign;
  const selectedKeyRef = useRef(selectedKey);
  selectedKeyRef.current = selectedKey;
  const isA4LandscapeRef = useRef(isA4Landscape);
  isA4LandscapeRef.current = isA4Landscape;
  const denomRef = useRef(1);
  denomRef.current = Math.max(0.15, editorScale * metrics.contentScale * PX_PER_MM);
  const frameDenomRef = useRef(1);
  frameDenomRef.current = Math.max(0.15, editorScale * PX_PER_MM);

  // Measure available stage width to fit crisp interactive A5 / A4 Landscape card
  useEffect(() => {
    const updateZoom = () => {
      const containerW = stageWrapperRef.current?.clientWidth || window.innerWidth - 400;
      const usableW = Math.max(280, containerW - 24);
      setEditorScale(Math.min(1.08, usableW / activeSheetSpec.sheetWPx));
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [activeSheetSpec.sheetWPx]);

  // Rock-solid window pointer move/resize loop attached once
  useEffect(() => {
    const clampVal = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const roundStep = (v: number, step: number) => Number((Math.round(v / step) * step).toFixed(2));

    const handlePointerMove = (e: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st) return;
      const curDesign = latestDesignRef.current;

      if (st.kind === 'frameMove') {
        const fDenom = frameDenomRef.current;
        const deltaXMm = (e.clientX - st.startClientX) / fDenom;
        const deltaYMm = (e.clientY - st.startClientY) / fDenom;
        const frameOffsetXMm = clampVal(Number((st.startOffsetX + deltaXMm).toFixed(2)), -35, 35);
        const frameOffsetYMm = clampVal(Number((st.startOffsetY + deltaYMm).toFixed(2)), -35, 35);
        onChangeDesignRef.current({ ...curDesign, frameOffsetXMm, frameOffsetYMm });
        return;
      }

      if (st.kind === 'frameResize') {
        const fDenom = frameDenomRef.current;
        const deltaXMm = (e.clientX - st.startClientX) / fDenom;
        const deltaYMm = (e.clientY - st.startClientY) / fDenom;
        const halfW = isA4LandscapeRef.current ? 148 : 104;
        const halfH = isA4LandscapeRef.current ? 105 : 74;
        if (st.mode === 'frameWidth') {
          const frameScaleX = clampVal(roundStep(st.startScaleX + deltaXMm / halfW, 0.01), 0.65, 1.35);
          onChangeDesignRef.current({ ...curDesign, frameScaleX });
        } else if (st.mode === 'frameHeight') {
          const frameScaleY = clampVal(roundStep(st.startScaleY + deltaYMm / halfH, 0.01), 0.65, 1.35);
          onChangeDesignRef.current({ ...curDesign, frameScaleY });
        } else {
          const deltaScale = ((deltaXMm / halfW) + (deltaYMm / halfH)) / 2;
          const frameScaleX = clampVal(roundStep(st.startScaleX + deltaScale, 0.01), 0.65, 1.35);
          const frameScaleY = clampVal(roundStep(st.startScaleY + deltaScale, 0.01), 0.65, 1.35);
          onChangeDesignRef.current({ ...curDesign, frameScaleX, frameScaleY });
        }
        return;
      }

      const denom = denomRef.current;
      const deltaXMm = (e.clientX - st.startClientX) / denom;
      const deltaYMm = (e.clientY - st.startClientY) / denom;

      if (st.kind === 'move') {
        const dxMm = clampVal(Number((st.startDxMm + deltaXMm).toFixed(2)), -180, 180);
        const dyMm = clampVal(Number((st.startDyMm + deltaYMm).toFixed(2)), -120, 120);
        const prevEl = curDesign.elements[st.key];
        onChangeDesignRef.current({
          ...curDesign,
          elements: {
            ...curDesign.elements,
            [st.key]: {
              ...prevEl,
              dxMm,
              dyMm,
            },
          },
        });
        return;
      }

      // Direct mouse-drag resize handling for image boxes & general elements
      const elScale = Math.max(0.45, st.startScale || 1);
      if (st.mode === 'elementScale') {
        const nextScale = clampVal(roundStep(st.startScale + (deltaXMm + deltaYMm) * 0.014, 0.02), 0.55, 1.85);
        const prevEl = curDesign.elements[st.key];
        onChangeDesignRef.current({
          ...curDesign,
          elements: {
            ...curDesign.elements,
            [st.key]: {
              ...prevEl,
              scale: nextScale,
            },
          },
        });
      } else if (st.mode === 'photoWidth') {
        const photoWidthMm = clampVal(roundStep(st.startPhotoW + deltaXMm / elScale, 0.5), 10, 55);
        onChangeDesignRef.current({ ...curDesign, photoWidthMm });
      } else if (st.mode === 'photoHeight') {
        const photoHeightMm = clampVal(roundStep(st.startPhotoH + deltaYMm / elScale, 0.5), 12, 65);
        onChangeDesignRef.current({ ...curDesign, photoHeightMm });
      } else if (st.mode === 'photoSize') {
        const photoWidthMm = clampVal(roundStep(st.startPhotoW + deltaXMm / elScale, 0.5), 10, 55);
        const photoHeightMm = clampVal(roundStep(st.startPhotoH + deltaYMm / elScale, 0.5), 12, 65);
        onChangeDesignRef.current({ ...curDesign, photoWidthMm, photoHeightMm });
      } else if (st.mode === 'logoWidth') {
        const logoWidthMm = clampVal(roundStep(st.startLogoW + deltaXMm / elScale, 0.5), 6, 55);
        onChangeDesignRef.current({ ...curDesign, logoWidthMm });
      } else if (st.mode === 'logoHeight') {
        const logoHeightMm = clampVal(roundStep(st.startLogoH + deltaYMm / elScale, 0.5), 6, 55);
        onChangeDesignRef.current({ ...curDesign, logoHeightMm });
      } else if (st.mode === 'logoSize') {
        const deltaAvg = (deltaXMm + deltaYMm) / 2;
        if (curDesign.logoLayoutMode !== 'horizontal') {
          const logoWidthMm = clampVal(roundStep(st.startLogoW + deltaXMm / elScale, 0.5), 6, 55);
          const logoHeightMm = clampVal(roundStep(st.startLogoH + deltaYMm / elScale, 0.5), 6, 55);
          onChangeDesignRef.current({ ...curDesign, logoWidthMm, logoHeightMm });
        } else {
          const schoolLogoSizeMm = clampVal(roundStep(st.startLogoSize + deltaAvg / elScale, 0.5), 6, 36);
          onChangeDesignRef.current({ ...curDesign, schoolLogoSizeMm });
        }
      } else if (st.mode === 'stampSize') {
        const deltaAvg = (deltaXMm + deltaYMm) / 2;
        const stampSizeMm = clampVal(roundStep(st.startStampSize + deltaAvg / elScale, 0.5), 12, 42);
        const ratio = st.startStampSize > 0 ? stampSizeMm / st.startStampSize : 1;
        const signatureHeightMm = clampVal(roundStep(st.startSigHeight * ratio, 0.5), 5, 20);
        onChangeDesignRef.current({ ...curDesign, stampSizeMm, signatureHeightMm });
      } else if (st.mode === 'ribbonSize') {
        const deltaAvg = (deltaXMm + deltaYMm) / 2;
        const rankRibbonSizeMm = clampVal(roundStep(st.startRibbonSize + deltaAvg / elScale, 0.5), 14, 38);
        onChangeDesignRef.current({ ...curDesign, rankRibbonSizeMm });
      } else if (st.mode === 'ministryLogoWidth') {
        const ministryLogoWidthMm = clampVal(roundStep(st.startMinistryW + deltaXMm / elScale, 0.5), 6, 45);
        onChangeDesignRef.current({ ...curDesign, ministryLogoWidthMm });
      } else if (st.mode === 'ministryLogoHeight') {
        const ministryLogoHeightMm = clampVal(roundStep(st.startMinistryH + deltaYMm / elScale, 0.5), 6, 45);
        onChangeDesignRef.current({ ...curDesign, ministryLogoHeightMm });
      } else if (st.mode === 'ministryLogoSize') {
        const ministryLogoWidthMm = clampVal(roundStep(st.startMinistryW + deltaXMm / elScale, 0.5), 6, 45);
        const ministryLogoHeightMm = clampVal(roundStep(st.startMinistryH + deltaYMm / elScale, 0.5), 6, 45);
        onChangeDesignRef.current({ ...curDesign, ministryLogoWidthMm, ministryLogoHeightMm });
      }
    };

    const endDrag = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      setDraggingKey(null);
      setDraggingFrame(false);
      document.body.style.cursor = '';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 2 : 0.5;
      const curDesign = latestDesignRef.current;
      const key = selectedKeyRef.current;
      const curEl = curDesign.elements[key];
      const dxMm =
        e.key === 'ArrowLeft'
          ? Number((curEl.dxMm - step).toFixed(2))
          : e.key === 'ArrowRight'
            ? Number((curEl.dxMm + step).toFixed(2))
            : curEl.dxMm;
      const dyMm =
        e.key === 'ArrowUp'
          ? Number((curEl.dyMm - step).toFixed(2))
          : e.key === 'ArrowDown'
            ? Number((curEl.dyMm + step).toFixed(2))
            : curEl.dyMm;
      onChangeDesignRef.current({
        ...curDesign,
        elements: {
          ...curDesign.elements,
          [key]: { ...curEl, dxMm, dyMm },
        },
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', endDrag);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, []);

  const handleElementPointerDown = (key: CertElementKey, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedKey(key);
    setDraggingKey(key);
    document.body.style.cursor = 'grabbing';
    const el = latestDesignRef.current.elements[key];
    dragStateRef.current = {
      kind: 'move',
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startDxMm: el.dxMm,
      startDyMm: el.dyMm,
    };
  };

  const handleResizeHandlePointerDown = (
    key: CertElementKey,
    mode: CertResizeHandleMode,
    e: React.PointerEvent
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedKey(key);
    setDraggingKey(key);
    document.body.style.cursor =
      mode === 'photoWidth' || mode === 'logoWidth' || mode === 'ministryLogoWidth'
        ? 'ew-resize'
        : mode === 'photoHeight' || mode === 'logoHeight' || mode === 'ministryLogoHeight'
          ? 'ns-resize'
          : 'nwse-resize';
    const cur = latestDesignRef.current;
    dragStateRef.current = {
      kind: 'resize',
      key,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startScale: cur.elements[key].scale,
      startPhotoW: cur.photoWidthMm,
      startPhotoH: cur.photoHeightMm,
      startLogoSize: cur.schoolLogoSizeMm,
      startLogoW: cur.logoWidthMm,
      startLogoH: cur.logoHeightMm,
      startMinistryW: cur.ministryLogoWidthMm,
      startMinistryH: cur.ministryLogoHeightMm,
      startStampSize: cur.stampSizeMm,
      startSigHeight: cur.signatureHeightMm,
      startRibbonSize: cur.rankRibbonSizeMm,
    };
  };

  const handleFramePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingFrame(true);
    document.body.style.cursor = 'grabbing';
    const cur = latestDesignRef.current;
    dragStateRef.current = {
      kind: 'frameMove',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: cur.frameOffsetXMm,
      startOffsetY: cur.frameOffsetYMm,
    };
  };

  const handleFrameResizePointerDown = (
    mode: 'frameSize' | 'frameWidth' | 'frameHeight',
    e: React.PointerEvent
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingFrame(true);
    document.body.style.cursor =
      mode === 'frameWidth' ? 'ew-resize' : mode === 'frameHeight' ? 'ns-resize' : 'nwse-resize';
    const cur = latestDesignRef.current;
    dragStateRef.current = {
      kind: 'frameResize',
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startScaleX: cur.frameScaleX,
      startScaleY: cur.frameScaleY,
    };
  };

  const updateSelectedElement = (patch: Partial<{ dxMm: number; dyMm: number; scale: number; visible: boolean }>) => {
    const cur = normalizedDesign.elements[selectedKey];
    onChangeDesign({
      ...normalizedDesign,
      elements: {
        ...normalizedDesign.elements,
        [selectedKey]: {
          ...cur,
          ...patch,
        },
      },
    });
  };

  const updateDesignField = <K extends keyof CertificateDesignConfig>(
    key: K,
    value: CertificateDesignConfig[K]
  ) => {
    onChangeDesign({
      ...normalizedDesign,
      [key]: value,
    });
  };

  const selectedEl = normalizedDesign.elements[selectedKey];
  const activeSavedTemplate = savedDesignTemplates.find((t) => t.id === activeDesignTemplateId) || null;

  return (
    <div
      className="no-print"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 365px',
        gap: '1rem',
        width: '100%',
        maxWidth: '1320px',
        margin: '0 auto',
        alignItems: 'start',
      }}
    >
      {/* Left Interactive WYSIWYG Canvas */}
      <div
        ref={stageWrapperRef}
        style={{
          background: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          borderRadius: '14px',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>
            {frameDragEnabled ? (
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                កំពុងបើកអូស &amp; ទាញទំហំស៊ុម (Frame Mode) — ដោះគ្រីសវិញដើម្បីអូសធាតុខាងក្នុង
              </span>
            ) : (
              <>
                អូសប្រអប់ដោយ Mouse ដើម្បីរំកិល • អូសចំណុចការ៉េជ្រុងដើម្បីប្តូរទំហំ —{' '}
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>{CERT_ELEMENT_LABELS[selectedKey]}</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
                fontSize: '0.75rem',
                color: frameDragEnabled ? '#fbbf24' : '#cbd5e1',
                fontWeight: frameDragEnabled ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={frameDragEnabled}
                onChange={(e) => setFrameDragEnabled(e.target.checked)}
              />
              <span>អូស/ប្តូរទំហំស៊ុម (Frame)</span>
            </label>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.76rem',
                color: showStudentPhoto ? '#6ee7b7' : '#cbd5e1',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showStudentPhoto}
                onChange={(e) => {
                  onToggleShowStudentPhoto(e.target.checked);
                  if (e.target.checked) setSelectedKey('studentPhoto');
                }}
              />
              <span>បង្ហាញប្រអប់រូបថតសិស្ស</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#93c5fd', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showMarginGuide}
                onChange={(e) => setShowMarginGuide(e.target.checked)}
              />
              <span>បង្ហាញបន្ទាត់ព្រំដែន Margin</span>
            </label>
          </div>
        </div>

        {/* Live A5 / A4 Landscape Stage */}
        <div
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: `${activeSheetSpec.sheetWPx * editorScale}px`,
            height: `${activeSheetSpec.sheetHPx * editorScale}px`,
            position: 'relative',
            borderRadius: '6px',
            boxShadow: '0 20px 55px rgba(0, 0, 0, 0.55)',
            overflow: 'hidden',
            background: '#ffffff',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <div
            style={{
              width: activeSheetSpec.sheetW,
              height: activeSheetSpec.sheetH,
              padding: '1mm 1.5mm',
              boxSizing: 'border-box',
              transform: `scale(${editorScale})`,
              transformOrigin: 'top left',
            }}
          >
            <CertificateCardA5
              recipient={recipient}
              docType={docType}
              framePreset={framePreset}
              customFrameUrl={customFrameUrl}
              frameMarginsCm={frameMarginsCm}
              designConfig={normalizedDesign}
              examKhmer={examKhmer}
              examEnglish={examEnglish}
              conductedDate={conductedDate}
              issuedDate={issuedDate}
              courseNameKh={courseNameKh}
              courseNameEn={courseNameEn}
              certPlaceDateText={certPlaceDateText}
              provinceKh={provinceKh}
              deptKh={deptKh}
              showStudentPhoto={showStudentPhoto}
              stampUrl={stampUrl}
              signatureUrl={signatureUrl}
              signatoryName={signatoryName}
              principalTitle={principalTitle}
              schoolProfile={schoolProfile}
              editorSelectedKey={selectedKey}
              editorDraggingKey={draggingKey}
              frameDragEnabled={frameDragEnabled}
              editorDraggingFrame={draggingFrame}
              showMarginGuide={showMarginGuide}
              onElementPointerDown={handleElementPointerDown}
              onResizeHandlePointerDown={handleResizeHandlePointerDown}
              onFramePointerDown={handleFramePointerDown}
              onFrameResizePointerDown={handleFrameResizePointerDown}
            />
          </div>
        </div>
      </div>

      {/* Right Design Inspector + Template Saver */}
      <div
        style={{
          background: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '14px',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          color: '#f8fafc',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      >
        {/* Saved Design Templates Manager */}
        <div
          style={{
            padding: '0.65rem',
            borderRadius: '10px',
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
              គំរូរចនាដែលបាន Save ({savedDesignTemplates.length})
            </span>
            <button
              type="button"
              onClick={() => onChangeDesign(defaultDesignForDoc)}
              style={{
                padding: '0.16rem 0.48rem',
                borderRadius: '5px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
            >
              ត្រឡប់ទម្រង់ដើម
            </button>
          </div>

          {savedDesignTemplates.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '95px', overflowY: 'auto' }}>
              {savedDesignTemplates.map((tpl) => {
                const active = tpl.id === activeDesignTemplateId;
                return (
                  <div
                    key={tpl.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '6px',
                      border: active ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                      background: active ? 'rgba(251, 191, 36, 0.18)' : '#1e293b',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onApplyDesignTemplate(tpl)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: active ? '#fde68a' : '#e2e8f0',
                        fontSize: '0.73rem',
                        fontWeight: active ? 700 : 500,
                        padding: '0.22rem 0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      {tpl.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDesignTemplate(tpl.id)}
                      title="លុបគំរូនេះ"
                      style={{
                        border: 'none',
                        background: 'rgba(248, 113, 113, 0.16)',
                        color: '#fca5a5',
                        padding: '0.22rem 0.38rem',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save New / Overwrite Template Controls */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="ឈ្មោះគំរូថ្មី (ឧ. ប័ណ្ណមានរូបថត)..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.35rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.32)',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '0.76rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              disabled={isSavingTemplate || !newTemplateName.trim()}
              onClick={async () => {
                if (!newTemplateName.trim()) return;
                await onSaveNewDesignTemplate(newTemplateName.trim());
                setNewTemplateName('');
              }}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: isSavingTemplate || !newTemplateName.trim() ? '#475569' : '#059669',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: isSavingTemplate || !newTemplateName.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Save ជាគំរូថ្មី
            </button>
          </div>

          {activeSavedTemplate && (
            <button
              type="button"
              disabled={isSavingTemplate}
              onClick={onUpdateCurrentDesignTemplate}
              style={{
                width: '100%',
                padding: '0.32rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                background: 'rgba(56, 189, 248, 0.14)',
                color: '#7dd3fc',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: isSavingTemplate ? 'wait' : 'pointer',
              }}
            >
              {isSavingTemplate ? 'កំពុង Save...' : `ធ្វើបច្ចុប្បន្នភាពគំរូ "${activeSavedTemplate.name}"`}
            </button>
          )}
        </div>

        {/* Inspector Mode Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.25rem',
            background: '#0f172a',
            padding: '0.22rem',
            borderRadius: '8px',
          }}
        >
          {[
            { id: 'element' as InspectorTab, label: 'ទីតាំងធាតុ' },
            { id: 'typography' as InspectorTab, label: 'ពុម្ពអក្សរ & ពណ៌' },
            { id: 'images' as InspectorTab, label: 'រូបភាព, បូរ & ផ្ទៃ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setInspectorTab(tab.id)}
              style={{
                padding: '0.34rem 0.4rem',
                borderRadius: '6px',
                border: 'none',
                background: inspectorTab === tab.id ? '#2563eb' : 'transparent',
                color: inspectorTab === tab.id ? '#ffffff' : '#94a3b8',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Element Position & Scale */}
        {inspectorTab === 'element' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.35rem' }}>
                ជ្រើសធាតុដើម្បីកែប្រែ៖
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {(Object.keys(CERT_ELEMENT_LABELS) as CertElementKey[])
                  .filter((key) =>
                    docType === 'certificate'
                      ? key !== 'rankBadge' && key !== 'classMeta'
                      : key !== 'ministryLogo'
                  )
                  .map((key) => {
                  const active = key === selectedKey;
                  const visible = normalizedDesign.elements[key].visible !== false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      style={{
                        padding: '0.22rem 0.48rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #60a5fa' : '1px solid rgba(148, 163, 184, 0.25)',
                        background: active ? 'rgba(37, 99, 235, 0.28)' : '#0f172a',
                        color: !visible ? '#64748b' : active ? '#ffffff' : '#cbd5e1',
                        fontSize: '0.72rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        textDecoration: !visible ? 'line-through' : 'none',
                      }}
                    >
                      {CERT_ELEMENT_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '10px',
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>
                  {CERT_ELEMENT_LABELS[selectedKey]}
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedEl.visible !== false}
                    onChange={(e) => updateSelectedElement({ visible: e.target.checked })}
                  />
                  <span>បង្ហាញ</span>
                </label>
              </div>

              {selectedKey === 'studentPhoto' && !showStudentPhoto && (
                <div
                  style={{
                    padding: '0.45rem 0.55rem',
                    borderRadius: '7px',
                    background: 'rgba(14, 165, 233, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#bae6fd' }}>
                    ប្រអប់រូបថតកំពុងលាក់
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleShowStudentPhoto(true)}
                    style={{
                      padding: '0.22rem 0.55rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    បង្ហាញលើប័ណ្ណឥឡូវនេះ
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    <span>រំកិល X (ឆ្វេង/ស្តាំ mm)</span>
                    <strong style={{ color: '#e2e8f0' }}>{selectedEl.dxMm}</strong>
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="0.5"
                    value={selectedEl.dxMm}
                    onChange={(e) => updateSelectedElement({ dxMm: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    <span>រំកិល Y (លើ/ក្រោម mm)</span>
                    <strong style={{ color: '#e2e8f0' }}>{selectedEl.dyMm}</strong>
                  </label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="0.5"
                    value={selectedEl.dyMm}
                    onChange={(e) => updateSelectedElement({ dyMm: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                  <span>ពង្រីក / បង្រួមធាតុនេះ (Scale)</span>
                  <strong style={{ color: '#60a5fa' }}>{Math.round(selectedEl.scale * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.55"
                  max="1.85"
                  step="0.02"
                  value={selectedEl.scale}
                  onChange={(e) => updateSelectedElement({ scale: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ dxMm: 0 })}
                  style={{
                    flex: 1,
                    padding: '0.28rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.28)',
                    background: '#1e293b',
                    color: '#cbd5e1',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  កណ្តាល X=0
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ dxMm: 0, dyMm: 0, scale: 1 })}
                  style={{
                    flex: 1,
                    padding: '0.28rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(248, 113, 113, 0.35)',
                    background: 'rgba(248, 113, 113, 0.12)',
                    color: '#fca5a5',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  កំណត់ទីតាំងដើម
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Font Families, Sizes, Line Height & Colors */}
        {inspectorTab === 'typography' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {/* Font Family Selectors */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>
                ជ្រើសរើសពុម្ពអក្សរ (Font Family)
              </div>

              {[
                {
                  key: 'khmerTitleFont' as const,
                  label: 'ចំណងជើង, បាវចនា & ឈ្មោះសាលា (ខ្មែរ)',
                  options: KHMER_DISPLAY_FONT_OPTIONS,
                },
                {
                  key: 'studentNameKhFont' as const,
                  label: 'ឈ្មោះសិស្ស & អ្នកចុះហត្ថលេខា (ខ្មែរ)',
                  options: KHMER_DISPLAY_FONT_OPTIONS,
                },
                {
                  key: 'khmerBodyFont' as const,
                  label: 'អក្សរខ្លឹមសារខ្មែរ',
                  options: KHMER_BODY_FONT_OPTIONS,
                },
                {
                  key: 'englishFont' as const,
                  label: 'ពុម្ពអក្សរអង់គ្លេស (English Text)',
                  options: ENGLISH_FONT_OPTIONS,
                },
              ].map((fontItem) => (
                <div key={fontItem.key}>
                  <label style={{ display: 'block', fontSize: '0.71rem', color: '#94a3b8', marginBottom: '0.18rem' }}>
                    {fontItem.label}
                  </label>
                  <select
                    value={normalizedDesign[fontItem.key]}
                    onChange={(e) => updateDesignField(fontItem.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.32rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.32)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.74rem',
                      fontFamily: normalizedDesign[fontItem.key],
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {fontItem.options.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{ fontFamily: opt.value, background: '#1e293b', color: '#f8fafc' }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {[
              { key: 'titleFontPt' as const, label: 'ចំណងជើងខ្មែរ (Title)', min: 10, max: 24, step: 0.5, unit: 'pt' },
              { key: 'subtitleFontPt' as const, label: 'ចំណងជើងអង់គ្លេស (Sub)', min: 5.5, max: 13, step: 0.5, unit: 'pt' },
              { key: 'mottoKhFontPt' as const, label: 'បាវចនាជាតិ (ខ្មែរ)', min: 5.5, max: 12, step: 0.5, unit: 'pt' },
              { key: 'mottoEnFontPt' as const, label: 'បាវចនាជាតិ (English)', min: 4.5, max: 9, step: 0.2, unit: 'pt' },
              { key: 'studentNameKhPt' as const, label: 'ឈ្មោះសិស្ស (ខ្មែរ)', min: 9, max: 20, step: 0.5, unit: 'pt' },
              { key: 'studentNameEnPt' as const, label: 'ឈ្មោះសិស្ស (English)', min: 8.5, max: 18, step: 0.5, unit: 'pt' },
              { key: 'khmerBodyFontPt' as const, label: 'អក្សរខ្លឹមសារខ្មែរ', min: 7, max: 13.5, step: 0.5, unit: 'pt' },
              { key: 'englishBodyFontPt' as const, label: 'អក្សរខ្លឹមសារអង់គ្លេស', min: 7, max: 13.5, step: 0.5, unit: 'pt' },
              { key: 'rowGapMm' as const, label: 'គម្លាតជួរដេក (Row Gap)', min: 0.4, max: 8.0, step: 0.1, unit: 'mm' },
              { key: 'bodyLineHeight' as const, label: 'គម្លាតជួរអក្សរ (Line Height)', min: 0.95, max: 2.4, step: 0.05, unit: 'x' },
              { key: 'mottoLineHeight' as const, label: 'គម្លាតជួរបាវចនា (Motto)', min: 0.9, max: 2.0, step: 0.05, unit: 'x' },
              { key: 'letterSpacingPx' as const, label: 'គម្លាតតួអក្សរ (Letter Spacing)', min: -0.5, max: 4.0, step: 0.1, unit: 'px' },
              { key: 'signatoryFontPt' as const, label: 'ឈ្មោះអ្នកចុះហត្ថលេខា', min: 7, max: 15, step: 0.5, unit: 'pt' },
            ].map((slider) => (
              <div key={slider.key} style={{ background: '#0f172a', padding: '0.42rem 0.55rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#cbd5e1', marginBottom: '0.15rem' }}>
                  <span>{slider.label}</span>
                  <strong style={{ color: '#93c5fd' }}>
                    {normalizedDesign[slider.key]} {slider.unit}
                  </strong>
                </label>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={normalizedDesign[slider.key]}
                  onChange={(e) => updateDesignField(slider.key, parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            {/* Colors & Dividers */}
            <div style={{ background: '#0f172a', padding: '0.5rem 0.6rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌បាវចនា</span>
                  <input
                    type="color"
                    value={normalizedDesign.mottoColor}
                    onChange={(e) => updateDesignField('mottoColor', e.target.value)}
                    style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌តម្លៃ (ឈ្មោះ)</span>
                  <input
                    type="color"
                    value={normalizedDesign.valueColor}
                    onChange={(e) => updateDesignField('valueColor', e.target.value)}
                    style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌និទ្ទេស/លេខ</span>
                  <input
                    type="color"
                    value={normalizedDesign.accentColor}
                    onChange={(e) => updateDesignField('accentColor', e.target.value)}
                    style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌អក្សរទូទៅ</span>
                  <input
                    type="color"
                    value={normalizedDesign.bodyColor}
                    onChange={(e) => updateDesignField('bodyColor', e.target.value)}
                    style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                {docType === 'certificate' && (
                  <>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#fca5a5', gap: '0.2rem' }}>
                      <span>ពណ៌ចំណងជើងវិញ្ញាបនបត្រ</span>
                      <input
                        type="color"
                        value={normalizedDesign.certTitleColor}
                        onChange={(e) => updateDesignField('certTitleColor', e.target.value)}
                        style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                      <span>ពណ៌បន្ទាត់ចុចៗ (....)</span>
                      <input
                        type="color"
                        value={normalizedDesign.dottedLineColor}
                        onChange={(e) => updateDesignField('dottedLineColor', e.target.value)}
                        style={{ width: '100%', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                    </label>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', fontSize: '0.73rem', color: '#cbd5e1' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={normalizedDesign.showHeaderDivider}
                    onChange={(e) => updateDesignField('showHeaderDivider', e.target.checked)}
                  />
                  <span>បន្ទាត់ក្រោមក្បាល</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={normalizedDesign.showCenterDivider}
                    onChange={(e) => updateDesignField('showCenterDivider', e.target.checked)}
                  />
                  <span>បន្ទាត់ខណ្ឌកណ្តាល</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Frame Size/Position, Rank Ribbon, Watermark & Image Boxes */}
        {inspectorTab === 'images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {/* Border Frame Size & Position */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: frameDragEnabled ? '1px solid rgba(251, 191, 36, 0.55)' : '1px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                  សារ៉េទំហំ និងទីតាំងស៊ុម (Frame)
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.71rem', color: frameDragEnabled ? '#fde68a' : '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={frameDragEnabled}
                    onChange={(e) => setFrameDragEnabled(e.target.checked)}
                  />
                  <span>អូសដោយ Mouse</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>ទទឹងស៊ុម X</span>
                    <strong>{Math.round(normalizedDesign.frameScaleX * 100)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.65"
                    max="1.35"
                    step="0.01"
                    value={normalizedDesign.frameScaleX}
                    onChange={(e) => updateDesignField('frameScaleX', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>កម្ពស់ស៊ុម Y</span>
                    <strong>{Math.round(normalizedDesign.frameScaleY * 100)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.65"
                    max="1.35"
                    step="0.01"
                    value={normalizedDesign.frameScaleY}
                    onChange={(e) => updateDesignField('frameScaleY', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                  <span>រួមគែមស៊ុមចូលក្នុង (Inset Margin)</span>
                  <strong>{normalizedDesign.frameInsetMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="-12"
                  max="25"
                  step="0.5"
                  value={normalizedDesign.frameInsetMm}
                  onChange={(e) => updateDesignField('frameInsetMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>ទីតាំង X</span>
                    <strong>{normalizedDesign.frameOffsetXMm} mm</strong>
                  </label>
                  <input
                    type="range"
                    min="-35"
                    max="35"
                    step="0.5"
                    value={normalizedDesign.frameOffsetXMm}
                    onChange={(e) => updateDesignField('frameOffsetXMm', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>ទីតាំង Y</span>
                    <strong>{normalizedDesign.frameOffsetYMm} mm</strong>
                  </label>
                  <input
                    type="range"
                    min="-35"
                    max="35"
                    step="0.5"
                    value={normalizedDesign.frameOffsetYMm}
                    onChange={(e) => updateDesignField('frameOffsetYMm', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChangeDesign({
                    ...normalizedDesign,
                    frameScaleX: 1,
                    frameScaleY: 1,
                    frameInsetMm: 0,
                    frameOffsetXMm: 0,
                    frameOffsetYMm: 0,
                  })
                }
                style={{
                  padding: '0.24rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  background: 'rgba(251, 191, 36, 0.1)',
                  color: '#fde68a',
                  fontSize: '0.71rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                កំណត់ទំហំ &amp; ទីតាំងស៊ុមដើម (100% / 0mm)
              </button>
            </div>

            {/* Rank Ribbon Medal Card (Praise Letter) OR MoEYS Ministry Logo & Dept (Certificate) */}
            {docType !== 'certificate' ? (
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#fb923c', fontWeight: 700 }}>
                  រូបបូរចំណាត់ថ្នាក់ (Rank Medal)
                </span>
                <div style={{ display: 'inline-flex', gap: '0.2rem', background: '#1e293b', padding: '0.12rem', borderRadius: '6px' }}>
                  {[
                    { id: 'ribbon' as const, label: 'រូបបូរ' },
                    { id: 'pill' as const, label: 'ផ្លាក' },
                  ].map((modeOpt) => (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() => updateDesignField('rankBadgeStyle', modeOpt.id)}
                      style={{
                        padding: '0.16rem 0.45rem',
                        borderRadius: '5px',
                        border: 'none',
                        background: normalizedDesign.rankBadgeStyle === modeOpt.id ? '#ea580c' : 'transparent',
                        color: normalizedDesign.rankBadgeStyle === modeOpt.id ? '#ffffff' : '#94a3b8',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {modeOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {normalizedDesign.rankBadgeStyle !== 'pill' && (
                <>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                      <span>ទំហំរូបបូរចំណាត់ថ្នាក់</span>
                      <strong>{normalizedDesign.rankRibbonSizeMm} mm</strong>
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="38"
                      step="0.5"
                      value={normalizedDesign.rankRibbonSizeMm}
                      onChange={(e) => updateDesignField('rankRibbonSizeMm', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.71rem', color: '#94a3b8' }}>ពណ៌បូរ៖</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {RIBBON_COLOR_SWATCHES.map((sw) => (
                        <button
                          key={sw.color}
                          type="button"
                          title={sw.label}
                          onClick={() => updateDesignField('rankRibbonColor', sw.color)}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: sw.color,
                            border: normalizedDesign.rankRibbonColor.toLowerCase() === sw.color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={normalizedDesign.rankRibbonColor}
                        onChange={(e) => updateDesignField('rankRibbonColor', e.target.value)}
                        style={{ width: '24px', height: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            ) : (
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div style={{ fontSize: '0.75rem', color: '#7dd3fc', fontWeight: 700 }}>
                ឡូហ្គោក្រសួងអប់រំ &amp; មន្ទីរ (MoEYS)
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.18rem' }}>
                  Link ឡូហ្គោក្រសួងអប់រំ (URL / Drive)
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={normalizedDesign.ministryLogoUrl || ''}
                    onChange={(e) => updateDesignField('ministryLogoUrl', e.target.value)}
                    placeholder="ទុកទំនេរ = ប្រើឡូហ្គោក្រសួងដើម..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.3rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.73rem',
                      outline: 'none',
                    }}
                  />
                  {normalizedDesign.ministryLogoUrl && (
                    <button
                      type="button"
                      onClick={() => updateDesignField('ministryLogoUrl', '')}
                      title="ប្រើឡូហ្គោក្រសួងដើមវិញ"
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.14)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>ទទឹងឡូហ្គោក្រសួង</span>
                    <strong>{normalizedDesign.ministryLogoWidthMm} mm</strong>
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="45"
                    step="0.5"
                    value={normalizedDesign.ministryLogoWidthMm}
                    onChange={(e) => updateDesignField('ministryLogoWidthMm', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                    <span>កម្ពស់ឡូហ្គោក្រសួង</span>
                    <strong>{normalizedDesign.ministryLogoHeightMm} mm</strong>
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="45"
                    step="0.5"
                    value={normalizedDesign.ministryLogoHeightMm}
                    onChange={(e) => updateDesignField('ministryLogoHeightMm', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                    ខេត្ត / ក្រុង
                  </label>
                  <input
                    type="text"
                    value={normalizedDesign.certProvinceKh || ''}
                    onChange={(e) => updateDesignField('certProvinceKh', e.target.value)}
                    placeholder="ខេត្តកណ្តាល"
                    style={{
                      width: '100%',
                      padding: '0.26rem 0.4rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.16rem' }}>
                    មន្ទីរអប់រំ
                  </label>
                  <input
                    type="text"
                    value={normalizedDesign.certDeptKh || ''}
                    onChange={(e) => updateDesignField('certDeptKh', e.target.value)}
                    placeholder="មន្ទីរអប់រំ យុវជន និងកីឡា"
                    style={{
                      width: '100%',
                      padding: '0.26rem 0.4rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Background Watermark Logo */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 700 }}>
                  Watermark ឡូហ្គោសាលា (ផ្ទៃក្រោយ)
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={normalizedDesign.showWatermark}
                    onChange={(e) => updateDesignField('showWatermark', e.target.checked)}
                  />
                  <span>បង្ហាញ</span>
                </label>
              </div>

              {normalizedDesign.showWatermark && (
                <>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                      <span>ទំហំ Watermark</span>
                      <strong>{normalizedDesign.watermarkSizeMm} mm</strong>
                    </label>
                    <input
                      type="range"
                      min="24"
                      max="110"
                      step="1"
                      value={normalizedDesign.watermarkSizeMm}
                      onChange={(e) => updateDesignField('watermarkSizeMm', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                      <span>កម្រិតស្រាល / ភាពថ្លា (Opacity)</span>
                      <strong>{Math.round(normalizedDesign.watermarkOpacity * 100)}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0.03"
                      max="0.35"
                      step="0.01"
                      value={normalizedDesign.watermarkOpacity}
                      onChange={(e) => updateDesignField('watermarkOpacity', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Top School Logo (Vertical / Horizontal, Custom URL Link & Box Sizes) */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700 }}>
                  Logo សាលាផ្នែកខាងលើ (បញ្ឈរ)
                </span>
                <div style={{ display: 'inline-flex', gap: '0.2rem', background: '#1e293b', padding: '0.12rem', borderRadius: '6px' }}>
                  {[
                    { id: 'vertical' as const, label: 'បញ្ឈរ' },
                    { id: 'horizontal' as const, label: 'ផ្តេក' },
                  ].map((modeOpt) => (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() => updateDesignField('logoLayoutMode', modeOpt.id)}
                      style={{
                        padding: '0.16rem 0.45rem',
                        borderRadius: '5px',
                        border: 'none',
                        background: normalizedDesign.logoLayoutMode !== 'horizontal' && modeOpt.id === 'vertical'
                          ? '#2563eb'
                          : normalizedDesign.logoLayoutMode === 'horizontal' && modeOpt.id === 'horizontal'
                            ? '#2563eb'
                            : 'transparent',
                        color: (normalizedDesign.logoLayoutMode === 'horizontal' ? modeOpt.id === 'horizontal' : modeOpt.id === 'vertical')
                          ? '#ffffff'
                          : '#94a3b8',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {modeOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.71rem', color: '#cbd5e1', marginBottom: '0.18rem' }}>
                  Link Logo បញ្ឈរ (Google Drive / URL)
                </label>
                <div style={{ display: 'flex', gap: '0.28rem' }}>
                  <input
                    type="text"
                    value={normalizedDesign.topLogoUrl || ''}
                    onChange={(e) => updateDesignField('topLogoUrl', e.target.value)}
                    placeholder="ទុកទំនេរ = ប្រើ Logo សាលាដើម..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0.3rem 0.45rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.73rem',
                      outline: 'none',
                    }}
                  />
                  {normalizedDesign.topLogoUrl && (
                    <button
                      type="button"
                      onClick={() => updateDesignField('topLogoUrl', '')}
                      title="ប្រើ Logo សាលាដើមវិញ"
                      style={{
                        padding: '0 0.42rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        background: 'rgba(248, 113, 113, 0.14)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={normalizedDesign.showLogoSchoolText}
                  onChange={(e) => updateDesignField('showLogoSchoolText', e.target.checked)}
                />
                <span>បង្ហាញឈ្មោះសាលា (ខាងក្រោម Logo)</span>
              </label>

              {normalizedDesign.logoLayoutMode !== 'horizontal' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                      <span>ទទឹង Logo</span>
                      <strong>{normalizedDesign.logoWidthMm} mm</strong>
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="55"
                      step="0.5"
                      value={normalizedDesign.logoWidthMm}
                      onChange={(e) => updateDesignField('logoWidthMm', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#cbd5e1' }}>
                      <span>កម្ពស់ Logo</span>
                      <strong>{normalizedDesign.logoHeightMm} mm</strong>
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="55"
                      step="0.5"
                      value={normalizedDesign.logoHeightMm}
                      onChange={(e) => updateDesignField('logoHeightMm', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                    <span>ទំហំឡូហ្គោផ្តេក</span>
                    <strong>{normalizedDesign.schoolLogoSizeMm} mm</strong>
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="36"
                    step="0.5"
                    value={normalizedDesign.schoolLogoSizeMm}
                    onChange={(e) => updateDesignField('schoolLogoSizeMm', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            {/* Student Photo Box Size & Toggle */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#7dd3fc', fontWeight: 700 }}>
                  ប្រអប់រូបថតសិស្ស
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showStudentPhoto}
                    onChange={(e) => onToggleShowStudentPhoto(e.target.checked)}
                  />
                  <span>បង្ហាញរូបថត</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>ទទឹងប្រអប់រូបថត</span>
                  <strong>{normalizedDesign.photoWidthMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="55"
                  step="0.5"
                  value={normalizedDesign.photoWidthMm}
                  onChange={(e) => updateDesignField('photoWidthMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>កម្ពស់ប្រអប់រូបថត</span>
                  <strong>{normalizedDesign.photoHeightMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="12"
                  max="65"
                  step="0.5"
                  value={normalizedDesign.photoHeightMm}
                  onChange={(e) => updateDesignField('photoHeightMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>កោងជ្រុងរូបថត (Radius)</span>
                  <strong>{normalizedDesign.photoRadiusMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={normalizedDesign.photoRadiusMm}
                  onChange={(e) => updateDesignField('photoRadiusMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Stamp & Signature Box Sizes */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#fda4af', fontWeight: 700 }}>
                ទំហំត្រា និងហត្ថលេខា
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>ទំហំត្រាសាលា</span>
                  <strong>{normalizedDesign.stampSizeMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="12"
                  max="42"
                  step="0.5"
                  value={normalizedDesign.stampSizeMm}
                  onChange={(e) => updateDesignField('stampSizeMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>កម្ពស់ហត្ថលេខា</span>
                  <strong>{normalizedDesign.signatureHeightMm} mm</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.5"
                  value={normalizedDesign.signatureHeightMm}
                  onChange={(e) => updateDesignField('signatureHeightMm', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
