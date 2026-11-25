"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SchoolProfileInfo } from '@/components/settings/SchoolInfoSettingsPanel';
import {
  A5_LANDSCAPE_SPEC,
  CERT_ELEMENT_LABELS,
  CertElementKey,
  CertificateCardA5,
  CertificateDesignConfig,
  CertificateDocType,
  CertificateFramePreset,
  CertificateRecipient,
  DEFAULT_CERTIFICATE_DESIGN,
  FrameMarginsCm,
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
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('element');
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(true);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [editorScale, setEditorScale] = useState<number>(0.9);
  const stageWrapperRef = useRef<HTMLDivElement>(null);

  const dragStateRef = useRef<{
    key: CertElementKey;
    startClientX: number;
    startClientY: number;
    startDxMm: number;
    startDyMm: number;
  } | null>(null);

  const normalizedDesign = useMemo(
    () => normalizeCertificateDesign(designConfig),
    [designConfig]
  );

  const metrics = useMemo(
    () => computeCertificateContentMetrics(frameMarginsCm),
    [frameMarginsCm]
  );

  // Measure available stage width to fit crisp interactive A5 card
  useEffect(() => {
    const updateZoom = () => {
      const containerW = stageWrapperRef.current?.clientWidth || window.innerWidth - 400;
      const usableW = Math.max(280, containerW - 24);
      setEditorScale(Math.min(1.08, usableW / A5_LANDSCAPE_SPEC.sheetWPx));
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  // Pointer drag loop mapped accurately in natural mm units
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st) return;
      const denom = Math.max(0.15, editorScale * metrics.contentScale * PX_PER_MM);
      const dxMm = Number((st.startDxMm + (e.clientX - st.startClientX) / denom).toFixed(2));
      const dyMm = Number((st.startDyMm + (e.clientY - st.startClientY) / denom).toFixed(2));
      const prevEl = normalizedDesign.elements[st.key];
      onChangeDesign({
        ...normalizedDesign,
        elements: {
          ...normalizedDesign.elements,
          [st.key]: {
            ...prevEl,
            dxMm,
            dyMm,
          },
        },
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [editorScale, metrics.contentScale, normalizedDesign, onChangeDesign]);

  const handleElementPointerDown = (key: CertElementKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedKey(key);
    const el = normalizedDesign.elements[key];
    dragStateRef.current = {
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startDxMm: el.dxMm,
      startDyMm: el.dyMm,
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
          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
            ចុច និងអូស (Drag) ធាតុនីមួយៗលើប័ណ្ណដើម្បីរំកិលទីតាំង — ធាតុជ្រើស៖{' '}
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>{CERT_ELEMENT_LABELS[selectedKey]}</span>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#93c5fd', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showMarginGuide}
              onChange={(e) => setShowMarginGuide(e.target.checked)}
            />
            <span>បង្ហាញបន្ទាត់ព្រំដែន Margin</span>
          </label>
        </div>

        {/* Live A5 Stage */}
        <div
          style={{
            width: `${A5_LANDSCAPE_SPEC.sheetWPx * editorScale}px`,
            height: `${A5_LANDSCAPE_SPEC.sheetHPx * editorScale}px`,
            position: 'relative',
            borderRadius: '6px',
            boxShadow: '0 20px 55px rgba(0, 0, 0, 0.55)',
            overflow: 'hidden',
            background: '#ffffff',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: A5_LANDSCAPE_SPEC.sheetW,
              height: A5_LANDSCAPE_SPEC.sheetH,
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
              showStudentPhoto={showStudentPhoto}
              stampUrl={stampUrl}
              signatureUrl={signatureUrl}
              signatoryName={signatoryName}
              principalTitle={principalTitle}
              schoolProfile={schoolProfile}
              editorSelectedKey={selectedKey}
              showMarginGuide={showMarginGuide}
              onElementPointerDown={handleElementPointerDown}
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
              onClick={() => onChangeDesign(DEFAULT_CERTIFICATE_DESIGN)}
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
            { id: 'typography' as InspectorTab, label: 'ទំហំអក្សរ & ពណ៌' },
            { id: 'images' as InspectorTab, label: 'ប្រអប់រូបភាព' },
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
                {(Object.keys(CERT_ELEMENT_LABELS) as CertElementKey[]).map((key) => {
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    <span>រំកិល X (ឆ្វេង/ស្តាំ mm)</span>
                    <strong style={{ color: '#e2e8f0' }}>{selectedEl.dxMm}</strong>
                  </label>
                  <input
                    type="range"
                    min="-80"
                    max="80"
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
                    min="-55"
                    max="55"
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
                  max="1.75"
                  step="0.05"
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

        {/* Tab 2: Typography & Colors */}
        {inspectorTab === 'typography' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {[
              { key: 'titleFontPt' as const, label: 'ចំណងជើងខ្មែរ (Title)', min: 11, max: 24, step: 0.5, unit: 'pt' },
              { key: 'subtitleFontPt' as const, label: 'ចំណងជើងអង់គ្លេស (Sub)', min: 6, max: 13, step: 0.5, unit: 'pt' },
              { key: 'studentNameKhPt' as const, label: 'ឈ្មោះសិស្ស (ខ្មែរ)', min: 9, max: 20, step: 0.5, unit: 'pt' },
              { key: 'studentNameEnPt' as const, label: 'ឈ្មោះសិស្ស (English)', min: 8.5, max: 18, step: 0.5, unit: 'pt' },
              { key: 'khmerBodyFontPt' as const, label: 'អក្សរខ្លឹមសារខ្មែរ', min: 7, max: 13.5, step: 0.5, unit: 'pt' },
              { key: 'englishBodyFontPt' as const, label: 'អក្សរខ្លឹមសារអង់គ្លេស', min: 7, max: 13.5, step: 0.5, unit: 'pt' },
              { key: 'rowGapMm' as const, label: 'គម្លាតបន្ទាត់', min: 0.6, max: 4.5, step: 0.1, unit: 'mm' },
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌តម្លៃ (ឈ្មោះ)</span>
                  <input
                    type="color"
                    value={normalizedDesign.valueColor}
                    onChange={(e) => updateDesignField('valueColor', e.target.value)}
                    style={{ width: '100%', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌និទ្ទេស/លេខ</span>
                  <input
                    type="color"
                    value={normalizedDesign.accentColor}
                    onChange={(e) => updateDesignField('accentColor', e.target.value)}
                    style={{ width: '100%', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.68rem', color: '#cbd5e1', gap: '0.2rem' }}>
                  <span>ពណ៌អក្សរទូទៅ</span>
                  <input
                    type="color"
                    value={normalizedDesign.bodyColor}
                    onChange={(e) => updateDesignField('bodyColor', e.target.value)}
                    style={{ width: '100%', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
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

        {/* Tab 3: Image Box Sizes (School Logo, Student Photo, Stamp & Signature) */}
        {inspectorTab === 'images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {/* School Logo Box Size */}
            <div style={{ background: '#0f172a', padding: '0.55rem', borderRadius: '8px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700, marginBottom: '0.2rem' }}>
                <span>ទំហំឡូហ្គោសាលា</span>
                <strong>{normalizedDesign.schoolLogoSizeMm} mm</strong>
              </label>
              <input
                type="range"
                min="6"
                max="28"
                step="0.5"
                value={normalizedDesign.schoolLogoSizeMm}
                onChange={(e) => updateDesignField('schoolLogoSizeMm', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
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
                  min="12"
                  max="48"
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
                  min="14"
                  max="56"
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
                  max="38"
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
                  max="18"
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
