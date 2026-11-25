"use client";

import React, { useMemo, useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import {
  BUILTIN_RICH_FONT_CHOICES,
  formatLocalFontFamilyCss,
} from '@/components/scores/certificateRichText';
import {
  PrintDocumentStyleConfig,
  SavedPrintDocumentPreset,
  hasCustomPrintStyle,
} from './printStylePresets';

export interface PrintStyleSidebarProps {
  /** Header title for this document sidebar */
  title: string;
  /** Document-specific settings rendered inside the first tab */
  children: React.ReactNode;
  /** Current shared print typography / spacing / table style */
  styleConfig: PrintDocumentStyleConfig;
  onChangeStyle: (
    updater:
      | PrintDocumentStyleConfig
      | ((prev: PrintDocumentStyleConfig) => PrintDocumentStyleConfig)
  ) => void;
  onResetStyle: () => void;

  /** Whether to show the Table Settings tab */
  showTableSettings?: boolean;
  /** Saved Presets API */
  presets: SavedPrintDocumentPreset[];
  activePresetId: string;
  isSavingPreset: boolean;
  presetFeedback: string;
  onSaveNewPreset: (name: string) => void | Promise<any>;
  onUpdateActivePreset: () => void | Promise<any>;
  onDeletePreset: (id: string) => void | Promise<any>;
  onApplyPreset: (preset: SavedPrintDocumentPreset) => void;
  /** Optional wider sidebar width */
  wide?: boolean;
  /** Optional default active tab */
  defaultTab?: 'doc' | 'typography' | 'table';
}

type SidebarTabId = 'doc' | 'typography' | 'table';

const TEXT_COLOR_PRESETS = [
  { label: 'លំនាំដើម', value: '' },
  { label: 'ខ្មៅ', value: '#000000' },
  { label: 'ប្រផេះចាស់', value: '#1e293b' },
  { label: 'ខៀវចាស់', value: '#1e3a8a' },
  { label: 'បៃតងចាស់', value: '#065f46' },
  { label: 'ក្រហមចាស់', value: '#991b1b' },
];

const HEADER_BG_PRESETS = [
  { label: 'លំនាំដើម', value: '' },
  { label: 'លឿងមាស', value: '#f9df94' },
  { label: 'ខៀវទឹកប៊ិក', value: '#1e40af' },
  { label: 'បៃតង', value: '#059669' },
  { label: 'បៃតងខ្ចី', value: '#d9ead3' },
  { label: 'ប្រផេះស្រាល', value: '#e2e8f0' },
  { label: 'ស', value: '#ffffff' },
];

const STRIPE_BG_PRESETS = [
  { label: 'លំនាំដើម', value: '' },
  { label: 'ប្រផេះស្រាល', value: '#f1f5f9' },
  { label: 'ខៀវស្រាល', value: '#eff6ff' },
  { label: 'លឿងស្រាល', value: '#fffbeb' },
  { label: 'បៃតងស្រាល', value: '#ecfdf5' },
  { label: 'ស', value: '#ffffff' },
];

const BORDER_COLOR_PRESETS = [
  { label: 'លំនាំដើម', value: '' },
  { label: 'ខ្មៅ', value: '#000000' },
  { label: 'ប្រផេះចាស់', value: '#334155' },
  { label: 'ប្រផេះ', value: '#94a3b8' },
  { label: 'ខៀវ', value: '#1d4ed8' },
  { label: 'បៃតង', value: '#047857' },
];

export default function PrintStyleSidebar({
  title,
  children,
  styleConfig,
  onChangeStyle,
  onResetStyle,
  showTableSettings = true,
  presets,
  activePresetId,
  isSavingPreset,
  presetFeedback,
  onSaveNewPreset,
  onUpdateActivePreset,
  onDeletePreset,
  onApplyPreset,
  wide = false,
  defaultTab = 'doc',
}: PrintStyleSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTabId>(defaultTab);
  const [newPresetName, setNewPresetName] = useState('');
  const [localPcFonts, setLocalPcFonts] = useState<string[]>([]);
  const [isLoadingPcFonts, setIsLoadingPcFonts] = useState(false);
  const [pcFontStatus, setPcFontStatus] = useState('');
  const [customFontInput, setCustomFontInput] = useState('');

  const isCustomized = useMemo(() => hasCustomPrintStyle(styleConfig), [styleConfig]);

  const patchStyle = (partial: Partial<PrintDocumentStyleConfig>) => {
    onChangeStyle((prev) => ({ ...prev, ...partial }));
  };

  const handleLoadLocalPcFonts = async () => {
    if (typeof window === 'undefined') return;
    const queryFn = (window as any).queryLocalFonts;
    if (typeof queryFn !== 'function') {
      setPcFontStatus('កម្មវិធី Browser មិនគាំទ្រទាញស្វ័យប្រវត្តិទេ — សូមវាយឈ្មោះ Font ខាងក្រោម');
      return;
    }
    setIsLoadingPcFonts(true);
    setPcFontStatus('');
    try {
      const list = await queryFn();
      const set = new Set<string>();
      for (const f of list || []) {
        if (f && typeof f.family === 'string' && f.family.trim()) {
          set.add(f.family.trim());
        }
      }
      const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
      setLocalPcFonts(sorted);
      setPcFontStatus(`ទាញបាន ${sorted.length} ពុម្ពអក្សរពីកុំព្យូទ័រ!`);
    } catch {
      setPcFontStatus('ត្រូវការអនុញ្ញាត Local Fonts ឬវាយឈ្មោះ Font ផ្ទាល់ខាងក្រោម');
    } finally {
      setIsLoadingPcFonts(false);
    }
  };

  const handleApplyCustomPcFont = (target: 'body' | 'heading') => {
    const clean = customFontInput.trim();
    if (!clean) return;
    const css = formatLocalFontFamilyCss(clean);
    if (target === 'heading') {
      patchStyle({ headingFontFamily: css });
    } else {
      patchStyle({ fontFamily: css });
    }
  };

  const handleSavePresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    await onSaveNewPreset(newPresetName.trim());
    setNewPresetName('');
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.73rem',
    fontWeight: 700,
    color: '#cbd5e1',
    marginBottom: '0.24rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.34rem 0.52rem',
    borderRadius: '7px',
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#f8fafc',
    fontSize: '0.77rem',
    outline: 'none',
  };

  const sectionCardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    padding: '0.62rem 0.7rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.52rem',
  };

  const khmerWebFonts = BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'khmer_web');
  const khmerPcFonts = BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'khmer_pc');
  const engWebFonts = BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'english_web');
  const engPcFonts = BUILTIN_RICH_FONT_CHOICES.filter((f) => f.group === 'english_pc');

  const renderFontOptions = () => (
    <>
      <option value="">លំនាំដើមរបស់គំរូ (Default)</option>
      <optgroup label="ពុម្ពអក្សរខ្មែរ Web (Khmer Web)">
        {khmerWebFonts.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="ពុម្ពអក្សរខ្មែរក្នុងកុំព្យូទ័រ (Khmer OS / PC)">
        {khmerPcFonts.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="ពុម្ពអក្សរអង់គ្លេស Web">
        {engWebFonts.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="ពុម្ពអក្សរអង់គ្លេស PC (Office)">
        {engPcFonts.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </optgroup>
      {localPcFonts.length > 0 && (
        <optgroup label={`Font ក្នុងកុំព្យូទ័រ (${localPcFonts.length})`}>
          {localPcFonts.map((fam) => (
            <option key={fam} value={formatLocalFontFamilyCss(fam)}>
              {fam} (PC)
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  return (
    <aside
      className={`no-print print-left-sidebar${wide ? ' print-sidebar-wide' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sidebar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          paddingBottom: '0.45rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', minWidth: 0 }}>
          <AppIcon name="sliders" size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.84rem',
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
        </div>
        {isCustomized && (
          <button
            type="button"
            onClick={onResetStyle}
            title="កំណត់ពុម្ពអក្សរ គម្លាត និងតារាងទៅលំនាំដើមវិញ"
            style={{
              padding: '0.2rem 0.48rem',
              borderRadius: '6px',
              border: '1px solid rgba(248, 113, 113, 0.45)',
              background: 'rgba(239, 68, 68, 0.14)',
              color: '#fca5a5',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            កំណត់ដើម
          </button>
        )}
      </div>

      {/* Saved Presets Manager */}
      <div style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24' }}>
            Preset ដែលបានរក្សាទុក ({presets.length})
          </span>
          {activePresetId && (
            <button
              type="button"
              disabled={isSavingPreset}
              onClick={() => onUpdateActivePreset()}
              style={{
                padding: '0.18rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#6ee7b7',
                fontSize: '0.69rem',
                fontWeight: 700,
                cursor: isSavingPreset ? 'wait' : 'pointer',
              }}
            >
              Update Preset នេះ
            </button>
          )}
        </div>

        {/* Preset Chips */}
        {presets.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
            {presets.map((p) => {
              const active = p.id === activePresetId;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '7px',
                    border: active
                      ? '1.5px solid #fbbf24'
                      : '1px solid rgba(148, 163, 184, 0.3)',
                    background: active ? 'rgba(251, 191, 36, 0.18)' : '#0f172a',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onApplyPreset(p)}
                    style={{
                      padding: '0.22rem 0.5rem',
                      border: 'none',
                      background: 'transparent',
                      color: active ? '#fde68a' : '#e2e8f0',
                      fontSize: '0.72rem',
                      fontWeight: active ? 700 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(p.id)}
                    title="លុប Preset នេះ"
                    style={{
                      padding: '0.2rem 0.34rem',
                      border: 'none',
                      borderLeft: '1px solid rgba(148, 163, 184, 0.22)',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <AppIcon name="x" size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.71rem', color: '#94a3b8' }}>
            មិនទាន់មាន Preset ទេ — រចនា Font/គម្លាត/តារាង រួច Save ទុកប្រើលើកក្រោយ។
          </div>
        )}

        {/* Save New Preset Form */}
        <form onSubmit={handleSavePresetSubmit} style={{ display: 'flex', gap: '0.32rem' }}>
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="ឈ្មោះ Preset ថ្មី (ឧ. Font ធំច្បាស់)..."
            style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          />
          <button
            type="submit"
            disabled={isSavingPreset || !newPresetName.trim()}
            style={{
              padding: '0.32rem 0.62rem',
              borderRadius: '7px',
              border: 'none',
              background:
                !newPresetName.trim() || isSavingPreset
                  ? '#334155'
                  : 'linear-gradient(135deg, #d97706, #b45309)',
              color: '#ffffff',
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: !newPresetName.trim() || isSavingPreset ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Save Preset
          </button>
        </form>

        {presetFeedback && (
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6ee7b7' }}>
            {presetFeedback}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showTableSettings ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: '0.26rem',
          background: '#1e293b',
          padding: '0.22rem',
          borderRadius: '9px',
          border: '1px solid rgba(148, 163, 184, 0.22)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('doc')}
          style={{
            padding: '0.38rem 0.35rem',
            borderRadius: '7px',
            border: 'none',
            background: activeTab === 'doc' ? '#2563eb' : 'transparent',
            color: activeTab === 'doc' ? '#ffffff' : '#cbd5e1',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ទូទៅ &amp; ច្រោះ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          style={{
            padding: '0.38rem 0.35rem',
            borderRadius: '7px',
            border: 'none',
            background: activeTab === 'typography' ? '#7c3aed' : 'transparent',
            color: activeTab === 'typography' ? '#ffffff' : '#cbd5e1',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Font &amp; គម្លាត
        </button>
        {showTableSettings && (
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            style={{
              padding: '0.38rem 0.35rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'table' ? '#059669' : 'transparent',
              color: activeTab === 'table' ? '#ffffff' : '#cbd5e1',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            តារាង (Table)
          </button>
        )}
      </div>

      {/* Tab 1: Document-Specific Settings */}
      {activeTab === 'doc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
          {children}
        </div>
      )}

      {/* Tab 2: Font, Size, Spacing, Line Height & Page Margins */}
      {activeTab === 'typography' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
          {/* Font Family Section */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#93c5fd' }}>
              ពុម្ពអក្សរ (Web &amp; កុំព្យូទ័រ PC)
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពុម្ពអក្សរទូទៅ (Body Font)</span>
                {styleConfig.fontFamily && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ fontFamily: '' })}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#fca5a5',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    លំនាំដើម
                  </button>
                )}
              </label>
              <select
                value={styleConfig.fontFamily}
                onChange={(e) => patchStyle({ fontFamily: e.target.value })}
                style={inputStyle}
              >
                {styleConfig.fontFamily &&
                  !BUILTIN_RICH_FONT_CHOICES.some((f) => f.value === styleConfig.fontFamily) &&
                  !localPcFonts.some(
                    (fam) => formatLocalFontFamilyCss(fam) === styleConfig.fontFamily
                  ) && (
                    <option value={styleConfig.fontFamily}>
                      ផ្ទាល់ខ្លួន៖ {styleConfig.fontFamily}
                    </option>
                  )}
                {renderFontOptions()}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពុម្ពអក្សរចំណងជើង (Title / Heading Font)</span>
                {styleConfig.headingFontFamily && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ headingFontFamily: '' })}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#fca5a5',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    លំនាំដើម
                  </button>
                )}
              </label>
              <select
                value={styleConfig.headingFontFamily}
                onChange={(e) => patchStyle({ headingFontFamily: e.target.value })}
                style={inputStyle}
              >
                {styleConfig.headingFontFamily &&
                  !BUILTIN_RICH_FONT_CHOICES.some(
                    (f) => f.value === styleConfig.headingFontFamily
                  ) &&
                  !localPcFonts.some(
                    (fam) => formatLocalFontFamilyCss(fam) === styleConfig.headingFontFamily
                  ) && (
                    <option value={styleConfig.headingFontFamily}>
                      ផ្ទាល់ខ្លួន៖ {styleConfig.headingFontFamily}
                    </option>
                  )}
                {renderFontOptions()}
              </select>
            </div>

            {/* Load Local PC Fonts & Manual PC Font Name */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                paddingTop: '0.35rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.16)',
              }}
            >
              <button
                type="button"
                onClick={handleLoadLocalPcFonts}
                disabled={isLoadingPcFonts}
                style={{
                  padding: '0.34rem 0.6rem',
                  borderRadius: '7px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  background: 'rgba(14, 165, 233, 0.16)',
                  color: '#bae6fd',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: isLoadingPcFonts ? 'wait' : 'pointer',
                }}
              >
                {isLoadingPcFonts
                  ? 'កំពុងទាញ Font ពីកុំព្យូទ័រ...'
                  : 'ទាញ Font ក្នុងកុំព្យូទ័រ (Local PC Fonts)'}
              </button>
              {pcFontStatus && (
                <div style={{ fontSize: '0.69rem', color: '#7dd3fc' }}>{pcFontStatus}</div>
              )}

              <div style={{ display: 'flex', gap: '0.28rem' }}>
                <input
                  type="text"
                  value={customFontInput}
                  onChange={(e) => setCustomFontInput(e.target.value)}
                  placeholder="វាយឈ្មោះ Font PC (ឧ. Khmer OS Siemreap)"
                  style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: '0.73rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomPcFont('body')}
                  disabled={!customFontInput.trim()}
                  style={{
                    padding: '0.25rem 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: '0.69rem',
                    fontWeight: 700,
                    cursor: customFontInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Body
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCustomPcFont('heading')}
                  disabled={!customFontInput.trim()}
                  style={{
                    padding: '0.25rem 0.45rem',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    background: '#1e293b',
                    color: '#fcd34d',
                    fontSize: '0.69rem',
                    fontWeight: 700,
                    cursor: customFontInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Title
                </button>
              </div>
            </div>
          </div>

          {/* Font Size & Weight */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#c4b5fd' }}>
              ទំហំអក្សរ &amp; កម្រាស់ (Size &amp; Weight)
            </div>

            <div>
              <label style={labelStyle}>
                <span>ទំហំអក្សរចំណងជើង (Title)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.titleFontSizePt !== null
                    ? `${styleConfig.titleFontSizePt} pt`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={0.5}
                  value={styleConfig.titleFontSizePt ?? 12}
                  onChange={(e) => patchStyle({ titleFontSizePt: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.titleFontSizePt !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ titleFontSizePt: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ទំហំអក្សរទូទៅ (Body Text)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.bodyFontSizePt !== null
                    ? `${styleConfig.bodyFontSizePt} pt`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={6}
                  max={16}
                  step={0.5}
                  value={styleConfig.bodyFontSizePt ?? 9.5}
                  onChange={(e) => patchStyle({ bodyFontSizePt: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.bodyFontSizePt !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ bodyFontSizePt: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>កម្រាស់អក្សរ (Font Weight)</span>
              </label>
              <select
                value={styleConfig.fontWeight}
                onChange={(e) =>
                  patchStyle({
                    fontWeight: e.target.value as PrintDocumentStyleConfig['fontWeight'],
                  })
                }
                style={inputStyle}
              >
                <option value="default">លំនាំដើម (Auto)</option>
                <option value="400">ធម្មតា (Regular 400)</option>
                <option value="500">មធ្យម (Medium 500)</option>
                <option value="600">ក្រាស់បន្តិច (SemiBold 600)</option>
                <option value="700">ដិតក្រាស់ (Bold 700)</option>
              </select>
            </div>
          </div>

          {/* Spacing: Line Height, Letter Spacing, Word Spacing */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6ee7b7' }}>
              គម្លាតជួរ &amp; គម្លាតអក្សរ (Spacing)
            </div>

            <div>
              <label style={labelStyle}>
                <span>គម្លាតជួរអក្សរ (Line Height)</span>
                <span style={{ color: '#6ee7b7' }}>
                  {styleConfig.lineHeight !== null ? `${styleConfig.lineHeight}x` : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={0.9}
                  max={2.2}
                  step={0.05}
                  value={styleConfig.lineHeight ?? 1.25}
                  onChange={(e) => patchStyle({ lineHeight: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.lineHeight !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ lineHeight: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>គម្លាតតួអក្សរ (Letter Spacing)</span>
                <span style={{ color: '#6ee7b7' }}>
                  {styleConfig.letterSpacingPx !== null
                    ? `${styleConfig.letterSpacingPx} px`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={-0.5}
                  max={4}
                  step={0.1}
                  value={styleConfig.letterSpacingPx ?? 0}
                  onChange={(e) => patchStyle({ letterSpacingPx: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.letterSpacingPx !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ letterSpacingPx: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>គម្លាតដកឃ្លា / ពាក្យ (Word Spacing)</span>
                <span style={{ color: '#6ee7b7' }}>
                  {styleConfig.wordSpacingPx !== null
                    ? `${styleConfig.wordSpacingPx} px`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={-2}
                  max={14}
                  step={0.5}
                  value={styleConfig.wordSpacingPx ?? 0}
                  onChange={(e) => patchStyle({ wordSpacingPx: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.wordSpacingPx !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ wordSpacingPx: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color, Page Margins & Monochrome Print */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>
              ពណ៌អក្សរ រឹមក្រដាស &amp; របៀបព្រីន
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពណ៌អក្សរទូទៅ (Text Color)</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {styleConfig.textColor || 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', alignItems: 'center' }}>
                {TEXT_COLOR_PRESETS.map((c) => {
                  const active = styleConfig.textColor === c.value;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => patchStyle({ textColor: c.value })}
                      style={{
                        padding: '0.18rem 0.42rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '0.69rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {c.value && (
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '2px',
                            background: c.value,
                            border: '1px solid rgba(255,255,255,0.4)',
                          }}
                        />
                      )}
                      {c.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={styleConfig.textColor || '#000000'}
                  onChange={(e) => patchStyle({ textColor: e.target.value })}
                  title="ជ្រើសពណ៌អក្សរផ្ទាល់"
                  style={{
                    width: '26px',
                    height: '24px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '5px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>រឹមក្រដាសជុំវិញ (Page Padding)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.pagePaddingMm !== null
                    ? `${styleConfig.pagePaddingMm} mm`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={0}
                  max={22}
                  step={0.5}
                  value={styleConfig.pagePaddingMm ?? 6}
                  onChange={(e) => patchStyle({ pagePaddingMm: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.pagePaddingMm !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ pagePaddingMm: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#e2e8f0',
                cursor: 'pointer',
                paddingTop: '0.2rem',
              }}
            >
              <input
                type="checkbox"
                checked={styleConfig.grayscalePrint}
                onChange={(e) => patchStyle({ grayscalePrint: e.target.checked })}
              />
              <span>ព្រីនពណ៌ស-ខ្មៅ (Black &amp; White / Laser)</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Table Settings */}
      {showTableSettings && activeTab === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
          {/* Table Font Sizes & Row Geometry */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6ee7b7' }}>
              ទំហំអក្សរ &amp; កម្ពស់ជួរតារាង
            </div>

            <div>
              <label style={labelStyle}>
                <span>ទំហំអក្សរក្នុងតារាង (Table Body)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.tableFontSizePt !== null
                    ? `${styleConfig.tableFontSizePt} pt`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={5.5}
                  max={14}
                  step={0.25}
                  value={styleConfig.tableFontSizePt ?? 8.5}
                  onChange={(e) => patchStyle({ tableFontSizePt: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.tableFontSizePt !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ tableFontSizePt: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ទំហំអក្សរក្បាលតារាង (Table Header)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.tableHeaderFontSizePt !== null
                    ? `${styleConfig.tableHeaderFontSizePt} pt`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={5.5}
                  max={15}
                  step={0.25}
                  value={styleConfig.tableHeaderFontSizePt ?? 9}
                  onChange={(e) =>
                    patchStyle({ tableHeaderFontSizePt: Number(e.target.value) })
                  }
                  style={{ flex: 1 }}
                />
                {styleConfig.tableHeaderFontSizePt !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ tableHeaderFontSizePt: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>កម្ពស់ជួរតារាង (Row Height)</span>
                <span style={{ color: '#6ee7b7' }}>
                  {styleConfig.tableRowHeightMm !== null
                    ? `${styleConfig.tableRowHeightMm} mm`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={3.5}
                  max={14}
                  step={0.25}
                  value={styleConfig.tableRowHeightMm ?? 6}
                  onChange={(e) => patchStyle({ tableRowHeightMm: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                {styleConfig.tableRowHeightMm !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ tableRowHeightMm: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              <div>
                <label style={labelStyle}>
                  <span>Padding លើ-ក្រោម</span>
                  <span style={{ color: '#93c5fd' }}>
                    {styleConfig.tableCellPadYPx !== null
                      ? `${styleConfig.tableCellPadYPx}px`
                      : 'Auto'}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={0.5}
                  value={styleConfig.tableCellPadYPx ?? 2}
                  onChange={(e) => patchStyle({ tableCellPadYPx: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <span>Padding ឆ្វេង-ស្ដាំ</span>
                  <span style={{ color: '#93c5fd' }}>
                    {styleConfig.tableCellPadXPx !== null
                      ? `${styleConfig.tableCellPadXPx}px`
                      : 'Auto'}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={16}
                  step={0.5}
                  value={styleConfig.tableCellPadXPx ?? 4}
                  onChange={(e) => patchStyle({ tableCellPadXPx: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            {(styleConfig.tableCellPadYPx !== null ||
              styleConfig.tableCellPadXPx !== null) && (
              <button
                type="button"
                onClick={() =>
                  patchStyle({ tableCellPadYPx: null, tableCellPadXPx: null })
                }
                style={{
                  alignSelf: 'flex-end',
                  padding: '0.15rem 0.48rem',
                  borderRadius: '5px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#cbd5e1',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                សម្អាត Padding តារាង
              </button>
            )}

            <div>
              <label style={labelStyle}>
                <span>ការតម្រឹមអក្សរក្នុងប្រអប់ (Cell Align)</span>
              </label>
              <select
                value={styleConfig.tableCellAlign}
                onChange={(e) =>
                  patchStyle({
                    tableCellAlign: e.target.value as PrintDocumentStyleConfig['tableCellAlign'],
                  })
                }
                style={inputStyle}
              >
                <option value="default">លំនាំដើម (Auto)</option>
                <option value="left">តម្រឹមឆ្វេង (Left)</option>
                <option value="center">តម្រឹមកណ្ដាល (Center)</option>
                <option value="right">តម្រឹមស្ដាំ (Right)</option>
              </select>
            </div>
          </div>

          {/* Table Borders & Colors */}
          <div style={sectionCardStyle}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#93c5fd' }}>
              បន្ទាត់ស៊ុម &amp; ពណ៌តារាង
            </div>

            <div>
              <label style={labelStyle}>
                <span>កម្រាស់បន្ទាត់តារាង (Border Width)</span>
                <span style={{ color: '#fbbf24' }}>
                  {styleConfig.tableBorderWidthPx !== null
                    ? `${styleConfig.tableBorderWidthPx} px`
                    : 'លំនាំដើម'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.25}
                  value={styleConfig.tableBorderWidthPx ?? 1}
                  onChange={(e) =>
                    patchStyle({ tableBorderWidthPx: Number(e.target.value) })
                  }
                  style={{ flex: 1 }}
                />
                {styleConfig.tableBorderWidthPx !== null && (
                  <button
                    type="button"
                    onClick={() => patchStyle({ tableBorderWidthPx: null })}
                    style={{
                      padding: '0.12rem 0.38rem',
                      borderRadius: '5px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#cbd5e1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពណ៌បន្ទាត់តារាង (Border Color)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.26rem', alignItems: 'center' }}>
                {BORDER_COLOR_PRESETS.map((c) => {
                  const active = styleConfig.tableBorderColor === c.value;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => patchStyle({ tableBorderColor: c.value })}
                      style={{
                        padding: '0.18rem 0.42rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                      }}
                    >
                      {c.value && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: c.value,
                            border: '1px solid rgba(255,255,255,0.4)',
                          }}
                        />
                      )}
                      {c.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={styleConfig.tableBorderColor || '#000000'}
                  onChange={(e) => patchStyle({ tableBorderColor: e.target.value })}
                  style={{
                    width: '24px',
                    height: '22px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពណ៌ផ្ទៃក្បាលតារាង (Header BG)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.26rem', alignItems: 'center' }}>
                {HEADER_BG_PRESETS.map((c) => {
                  const active = styleConfig.tableHeaderBg === c.value;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => patchStyle({ tableHeaderBg: c.value })}
                      style={{
                        padding: '0.18rem 0.42rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                      }}
                    >
                      {c.value && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: c.value,
                            border: '1px solid rgba(255,255,255,0.4)',
                          }}
                        />
                      )}
                      {c.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={styleConfig.tableHeaderBg || '#f9df94'}
                  onChange={(e) => patchStyle({ tableHeaderBg: e.target.value })}
                  style={{
                    width: '24px',
                    height: '22px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពណ៌អក្សរក្បាលតារាង (Header Text)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.26rem', alignItems: 'center' }}>
                {[
                  { label: 'លំនាំដើម', value: '' },
                  { label: 'ខ្មៅ', value: '#000000' },
                  { label: 'ស', value: '#ffffff' },
                  { label: 'ខៀវ', value: '#1d4ed8' },
                  { label: 'ក្រហម', value: '#b91c1c' },
                ].map((c) => {
                  const active = styleConfig.tableHeaderColor === c.value;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => patchStyle({ tableHeaderColor: c.value })}
                      style={{
                        padding: '0.18rem 0.42rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                      }}
                    >
                      {c.value && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: c.value,
                            border: '1px solid rgba(148,163,184,0.6)',
                          }}
                        />
                      )}
                      {c.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={styleConfig.tableHeaderColor || '#000000'}
                  onChange={(e) => patchStyle({ tableHeaderColor: e.target.value })}
                  style={{
                    width: '24px',
                    height: '22px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <span>ពណ៌ឆ្នូតជួរឆ្លាស់ (Zebra Stripe)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.26rem', alignItems: 'center' }}>
                {STRIPE_BG_PRESETS.map((c) => {
                  const active = styleConfig.tableStripeBg === c.value;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => patchStyle({ tableStripeBg: c.value })}
                      style={{
                        padding: '0.18rem 0.42rem',
                        borderRadius: '6px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                        color: '#e2e8f0',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                      }}
                    >
                      {c.value && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: c.value,
                            border: '1px solid rgba(148,163,184,0.6)',
                          }}
                        />
                      )}
                      {c.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={styleConfig.tableStripeBg || '#f1f5f9'}
                  onChange={(e) => patchStyle({ tableStripeBg: e.target.value })}
                  style={{
                    width: '24px',
                    height: '22px',
                    padding: 0,
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
