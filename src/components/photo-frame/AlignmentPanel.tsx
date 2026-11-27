"use client";

import React, { useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import {
  AlignAction,
  AlignScope,
  OverlayLayer,
  OverlaySnapPreset,
} from './frameModel';

export interface AlignmentPanelProps {
  hasPhoto: boolean;
  alignPhotoSelected: boolean;
  onSelectPhotoForAlign: () => void;
  overlays: OverlayLayer[];
  selectedOverlayIds: string[];
  onToggleOverlaySelect: (id: string) => void;
  onSelectAllOverlays: () => void;
  onSelectSingleOverlay: (id: string) => void;
  alignScope: AlignScope;
  onAlignScopeChange: (scope: AlignScope) => void;
  canvasMarginPct: number;
  onCanvasMarginPctChange: (pct: number) => void;
  onAlignAction: (action: AlignAction) => void;
  onQuickSnap: (preset: OverlaySnapPreset) => void;
  onNudgeSelected: (dxNorm: number, dyNorm: number) => void;
  onApplyOverlaysToAllPhotos?: () => void;
  photoCount: number;
}

function AlignIcon({ type }: { type: AlignAction }) {
  const s = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'left':
      return (
        <svg {...s}>
          <line x1="4" y1="3" x2="4" y2="21" />
          <rect x="8" y="5" width="12" height="5" rx="1" />
          <rect x="8" y="14" width="7" height="5" rx="1" />
        </svg>
      );
    case 'center-x':
      return (
        <svg {...s}>
          <line x1="12" y1="3" x2="12" y2="21" />
          <rect x="5" y="5" width="14" height="5" rx="1" />
          <rect x="8" y="14" width="8" height="5" rx="1" />
        </svg>
      );
    case 'right':
      return (
        <svg {...s}>
          <line x1="20" y1="3" x2="20" y2="21" />
          <rect x="4" y="5" width="12" height="5" rx="1" />
          <rect x="9" y="14" width="7" height="5" rx="1" />
        </svg>
      );
    case 'top':
      return (
        <svg {...s}>
          <line x1="3" y1="4" x2="21" y2="4" />
          <rect x="5" y="8" width="5" height="12" rx="1" />
          <rect x="14" y="8" width="5" height="7" rx="1" />
        </svg>
      );
    case 'center-y':
      return (
        <svg {...s}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <rect x="5" y="5" width="5" height="14" rx="1" />
          <rect x="14" y="8" width="5" height="8" rx="1" />
        </svg>
      );
    case 'bottom':
      return (
        <svg {...s}>
          <line x1="3" y1="20" x2="21" y2="20" />
          <rect x="5" y="4" width="5" height="12" rx="1" />
          <rect x="14" y="9" width="5" height="7" rx="1" />
        </svg>
      );
    case 'distribute-x':
      return (
        <svg {...s}>
          <line x1="4" y1="4" x2="4" y2="20" />
          <line x1="20" y1="4" x2="20" y2="20" />
          <rect x="9.5" y="6" width="5" height="12" rx="1" />
        </svg>
      );
    case 'distribute-y':
      return (
        <svg {...s}>
          <line x1="4" y1="4" x2="20" y2="4" />
          <line x1="4" y1="20" x2="20" y2="20" />
          <rect x="6" y="9.5" width="12" height="5" rx="1" />
        </svg>
      );
    case 'match-width':
      return (
        <svg {...s}>
          <path d="M4 12h16" />
          <polyline points="8 8 4 12 8 16" />
          <polyline points="16 8 20 12 16 16" />
        </svg>
      );
    case 'match-height':
      return (
        <svg {...s}>
          <path d="M12 4v16" />
          <polyline points="8 8 12 4 16 8" />
          <polyline points="8 16 12 20 16 16" />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      );
  }
}

export default function AlignmentPanel({
  hasPhoto,
  alignPhotoSelected,
  onSelectPhotoForAlign,
  overlays,
  selectedOverlayIds,
  onToggleOverlaySelect,
  onSelectAllOverlays,
  onSelectSingleOverlay,
  alignScope,
  onAlignScopeChange,
  canvasMarginPct,
  onCanvasMarginPctChange,
  onAlignAction,
  onQuickSnap,
  onNudgeSelected,
  onApplyOverlaysToAllPhotos,
  photoCount,
}: AlignmentPanelProps) {
  const [nudgeStepPct, setNudgeStepPct] = useState<number>(1);

  const selectedCount = selectedOverlayIds.length;
  const effectiveTargetReady = alignPhotoSelected ? hasPhoto : selectedCount > 0;
  const canUseSelectionScope = !alignPhotoSelected && selectedCount >= 2;
  const canDistribute =
    !alignPhotoSelected &&
    (alignScope === 'canvas' ? selectedCount >= 2 : selectedCount >= 3);
  const canMatchSize = !alignPhotoSelected && selectedCount >= 2;

  const stepNorm = nudgeStepPct / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.82rem' }}>
      {/* Scope Switcher: Align to Canvas vs Align Selected Layers */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.32rem',
          }}
        >
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            តម្រឹមធៀបនឹង (Align To)
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#0284c7',
              background: 'rgba(14, 165, 233, 0.12)',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
            }}
          >
            {alignPhotoSelected
              ? 'រូបថត (Photo)'
              : selectedCount > 0
                ? `បានជ្រើស ${selectedCount} Layer`
                : 'មិនទាន់ជ្រើស'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
          <button
            type="button"
            onClick={() => onAlignScopeChange('canvas')}
            style={{
              padding: '0.42rem 0.5rem',
              borderRadius: '9px',
              border: `1.5px solid ${alignScope === 'canvas' ? '#0ea5e9' : 'var(--border-color)'}`,
              background:
                alignScope === 'canvas' ? 'rgba(14, 165, 233, 0.13)' : 'var(--main-bg)',
              color: alignScope === 'canvas' ? '#0284c7' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.32rem',
            }}
          >
            <AppIcon name="maximize" size={13} />
            ធៀបនឹង Canvas
          </button>

          <button
            type="button"
            disabled={!canUseSelectionScope}
            onClick={() => onAlignScopeChange('selection')}
            style={{
              padding: '0.42rem 0.5rem',
              borderRadius: '9px',
              border: `1.5px solid ${
                alignScope === 'selection' && canUseSelectionScope
                  ? '#8b5cf6'
                  : 'var(--border-color)'
              }`,
              background:
                alignScope === 'selection' && canUseSelectionScope
                  ? 'rgba(139, 92, 246, 0.14)'
                  : 'var(--main-bg)',
              color:
                alignScope === 'selection' && canUseSelectionScope
                  ? '#7c3aed'
                  : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: canUseSelectionScope ? 'pointer' : 'not-allowed',
              opacity: canUseSelectionScope ? 1 : 0.5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.32rem',
            }}
            title={
              canUseSelectionScope
                ? 'តម្រឹម Layer ដែលបានជ្រើសធៀបគ្នាទៅវិញទៅមក'
                : 'សូមធីកជ្រើសយ៉ាងតិច ២ Layer ខាងក្រោមដើម្បីតម្រឹមធៀបគ្នា'
            }
          >
            <AppIcon name="layers" size={13} />
            ធៀប Layer រួម ({selectedCount})
          </button>
        </div>
      </div>

      {/* Multi-Layer Checklist Selector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.34rem',
          padding: '0.62rem',
          borderRadius: '12px',
          background: 'var(--main-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ជ្រើស Layer ច្រើន (Multi-Select)
          </span>
          {overlays.length > 1 && (
            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={onSelectAllOverlays}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#0284c7',
                  fontSize: '0.71rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.1rem 0.25rem',
                }}
              >
                ជ្រើសទាំងអស់
              </button>
              {selectedCount > 1 && overlays[overlays.length - 1] && (
                <button
                  type="button"
                  onClick={() => onSelectSingleOverlay(selectedOverlayIds[selectedOverlayIds.length - 1] || overlays[overlays.length - 1].id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.71rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.1rem 0.25rem',
                  }}
                >
                  តែ ១
                </button>
              )}
            </div>
          )}
        </div>

        {/* Base Photo Row */}
        {hasPhoto && (
          <div
            onClick={onSelectPhotoForAlign}
            style={{
              padding: '0.36rem 0.5rem',
              borderRadius: '8px',
              border: `1.5px solid ${alignPhotoSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background: alignPhotoSelected
                ? 'color-mix(in srgb, var(--accent-primary) 11%, var(--card-bg))'
                : 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              checked={alignPhotoSelected}
              onChange={onSelectPhotoForAlign}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '0.1rem 0.36rem',
                borderRadius: '5px',
                background: 'rgba(14, 165, 233, 0.14)',
                color: '#0284c7',
                flexShrink: 0,
              }}
            >
              Photo
            </span>
            <span style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              រូបថតផ្ទៃខាងក្រោម (Base Photo)
            </span>
          </div>
        )}

        {/* Overlay Checkboxes */}
        {overlays.length === 0 ? (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', padding: '0.2rem 0.1rem' }}>
            មិនទាន់មាន Frame / Element Layer ទេ — អ្នកអាចតម្រឹមរូបថត ឬបន្ថែម Template ជាមុន។
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem', maxHeight: '165px', overflowY: 'auto' }}>
            {overlays.map((ov) => {
              const checked = !alignPhotoSelected && selectedOverlayIds.includes(ov.id);
              return (
                <label
                  key={ov.id}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${checked ? '#8b5cf6' : 'var(--border-color)'}`,
                    background: checked ? 'rgba(139, 92, 246, 0.11)' : 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    opacity: ov.visible ? 1 : 0.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleOverlaySelect(ov.id)}
                    style={{
                      width: '15px',
                      height: '15px',
                      accentColor: '#8b5cf6',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.63rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.36rem',
                      borderRadius: '5px',
                      background:
                        ov.category === 'frame'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(139, 92, 246, 0.15)',
                      color: ov.category === 'frame' ? '#2563eb' : '#7c3aed',
                      flexShrink: 0,
                    }}
                  >
                    {ov.category === 'frame' ? 'Frame' : 'Element'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.77rem',
                      fontWeight: checked ? 700 : 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {ov.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Canvas Edge Margin (when Aligning to Canvas) */}
      {alignScope === 'canvas' && !alignPhotoSelected && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.28rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              គម្លាតពីគែម Canvas (Margin)
            </span>
            <div style={{ display: 'inline-flex', gap: '0.24rem' }}>
              {[0, 2, 4, 8].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onCanvasMarginPctChange(pct)}
                  style={{
                    padding: '0.12rem 0.38rem',
                    borderRadius: '6px',
                    border: `1px solid ${canvasMarginPct === pct ? '#0ea5e9' : 'var(--border-color)'}`,
                    background: canvasMarginPct === pct ? 'rgba(14, 165, 233, 0.14)' : 'var(--main-bg)',
                    color: canvasMarginPct === pct ? '#0284c7' : 'var(--text-secondary)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={0.5}
            value={canvasMarginPct}
            onChange={(e) => onCanvasMarginPctChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0ea5e9' }}
          />
        </div>
      )}

      {/* 6 Primary Align Buttons + Center Both */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.34rem' }}>
          តម្រឹមជួរដេក & ជួរឈរ ({alignScope === 'selection' && canUseSelectionScope ? 'ធៀប Layer រួម' : 'ធៀប Canvas'})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.34rem' }}>
          {(
            [
              { id: 'left', label: 'ឆ្វេង' },
              { id: 'center-x', label: 'កណ្តាលផ្តេក' },
              { id: 'right', label: 'ស្តាំ' },
              { id: 'top', label: 'លើ' },
              { id: 'center-y', label: 'កណ្តាលឈរ' },
              { id: 'bottom', label: 'ក្រោម' },
            ] as Array<{ id: AlignAction; label: string }>
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onAlignAction(btn.id)}
              style={{
                padding: '0.45rem 0.3rem',
                borderRadius: '9px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              <AlignIcon type={btn.id} />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!effectiveTargetReady}
          onClick={() => onAlignAction('center-both')}
          style={{
            marginTop: '0.35rem',
            width: '100%',
            padding: '0.45rem 0.6rem',
            borderRadius: '9px',
            border: '1px solid rgba(14, 165, 233, 0.35)',
            background: 'rgba(14, 165, 233, 0.1)',
            color: '#0284c7',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
            opacity: effectiveTargetReady ? 1 : 0.45,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.36rem',
          }}
        >
          <AlignIcon type="center-both" />
          <span>កណ្តាលទាំងផ្តេក និងបញ្ឈរ (Center)</span>
        </button>
      </div>

      {/* Distribute Evenly & Match Size (Multi-Layer) */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.34rem' }}>
          ចែកគម្លាតស្មើ & ទំហំស្មើគ្នា (Multi-Layer)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.34rem' }}>
          <button
            type="button"
            disabled={!canDistribute}
            onClick={() => onAlignAction('distribute-x')}
            style={{
              padding: '0.42rem 0.35rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: canDistribute ? 'pointer' : 'not-allowed',
              opacity: canDistribute ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
            title={
              alignScope === 'canvas'
                ? 'ចែកគម្លាតផ្តេកស្មើគ្នាលើ Canvas (ត្រូវការ ២+ Layer)'
                : 'ចែកគម្លាតផ្តេកស្មើគ្នារវាង Layer ដែលជ្រើស (ត្រូវការ ៣+ Layer)'
            }
          >
            <AlignIcon type="distribute-x" />
            <span>ចែកគម្លាតផ្តេក</span>
          </button>

          <button
            type="button"
            disabled={!canDistribute}
            onClick={() => onAlignAction('distribute-y')}
            style={{
              padding: '0.42rem 0.35rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: canDistribute ? 'pointer' : 'not-allowed',
              opacity: canDistribute ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
            title={
              alignScope === 'canvas'
                ? 'ចែកគម្លាតបញ្ឈរស្មើគ្នាលើ Canvas (ត្រូវការ ២+ Layer)'
                : 'ចែកគម្លាតបញ្ឈរស្មើគ្នារវាង Layer ដែលជ្រើស (ត្រូវការ ៣+ Layer)'
            }
          >
            <AlignIcon type="distribute-y" />
            <span>ចែកគម្លាតឈរ</span>
          </button>

          <button
            type="button"
            disabled={!canMatchSize}
            onClick={() => onAlignAction('match-width')}
            style={{
              padding: '0.42rem 0.35rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: canMatchSize ? 'pointer' : 'not-allowed',
              opacity: canMatchSize ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
            title="កំណត់ទទឹង Layer ដែលជ្រើសទាំងអស់ឱ្យស្មើគ្នា (ត្រូវការ ២+ Layer)"
          >
            <AlignIcon type="match-width" />
            <span>ទទឹងស្មើគ្នា</span>
          </button>

          <button
            type="button"
            disabled={!canMatchSize}
            onClick={() => onAlignAction('match-height')}
            style={{
              padding: '0.42rem 0.35rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: canMatchSize ? 'pointer' : 'not-allowed',
              opacity: canMatchSize ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
            title="កំណត់កម្ពស់ Layer ដែលជ្រើសទាំងអស់ឱ្យស្មើគ្នា (ត្រូវការ ២+ Layer)"
          >
            <AlignIcon type="match-height" />
            <span>កម្ពស់ស្មើគ្នា</span>
          </button>
        </div>
      </div>

      {/* Quick 9-Point Canvas Snap + Precision Nudge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.55rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
            ទីតាំងជ្រុង Canvas (Snap 9 ជ្រុង)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.24rem' }}>
            {(
              [
                { kind: 'snap', id: 'top-left', label: '↖', tip: 'លើឆ្វេង' },
                { kind: 'snap', id: 'top-center', label: '↑', tip: 'លើកណ្តាល' },
                { kind: 'snap', id: 'top-right', label: '↗', tip: 'លើស្តាំ' },
                { kind: 'align', id: 'left', label: '←', tip: 'ឆ្វេង' },
                { kind: 'snap', id: 'center', label: '●', tip: 'កណ្តាល' },
                { kind: 'align', id: 'right', label: '→', tip: 'ស្តាំ' },
                { kind: 'snap', id: 'bottom-left', label: '↙', tip: 'ក្រោមឆ្វេង' },
                { kind: 'snap', id: 'bottom-center', label: '↓', tip: 'ក្រោមកណ្តាល' },
                { kind: 'snap', id: 'bottom-right', label: '↘', tip: 'ក្រោមស្តាំ' },
              ] as const
            ).map((btn) => (
              <button
                key={`${btn.kind}-${btn.id}`}
                type="button"
                disabled={!effectiveTargetReady}
                onClick={() =>
                  btn.kind === 'snap'
                    ? onQuickSnap(btn.id)
                    : onAlignAction(btn.id)
                }
                style={{
                  padding: '0.3rem 0.2rem',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--main-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                  opacity: effectiveTargetReady ? 1 : 0.45,
                }}
                title={btn.tip}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!effectiveTargetReady}
            onClick={() => onQuickSnap('full')}
            style={{
              marginTop: '0.26rem',
              width: '100%',
              padding: '0.3rem 0.4rem',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.71rem',
              fontWeight: 700,
              cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
              opacity: effectiveTargetReady ? 1 : 0.45,
            }}
          >
            ពេញ Canvas (100%)
          </button>
        </div>

        {/* Fine Nudge Pad */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.25rem',
              marginBottom: '0.3rem',
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              រំកិលល្អិត
            </span>
            <button
              type="button"
              onClick={() => setNudgeStepPct((s) => (s === 0.25 ? 1 : s === 1 ? 3 : 0.25))}
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: '#0284c7',
                borderRadius: '6px',
                padding: '0.06rem 0.3rem',
                fontSize: '0.66rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="ចុចប្តូរចម្ងាយរំកិល (0.25% / 1% / 3%)"
            >
              {nudgeStepPct}%
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 28px)',
              gap: '0.22rem',
              justifyContent: 'center',
            }}
          >
            <div />
            <button
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onNudgeSelected(0, -stepNorm)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
              }}
              title="រំកិលឡើងលើ"
            >
              <AppIcon name="arrow-up" size={13} />
            </button>
            <div />

            <button
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onNudgeSelected(-stepNorm, 0)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
              }}
              title="រំកិលទៅឆ្វេង"
            >
              <AppIcon name="chevron-left" size={14} />
            </button>
            <button
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onAlignAction('center-both')}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                background: 'rgba(14, 165, 233, 0.1)',
                color: '#0284c7',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
              }}
              title="ដាក់កណ្តាល"
            >
              ●
            </button>
            <button
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onNudgeSelected(stepNorm, 0)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
              }}
              title="រំកិលទៅស្តាំ"
            >
              <AppIcon name="chevron-right" size={14} />
            </button>

            <div />
            <button
              type="button"
              disabled={!effectiveTargetReady}
              onClick={() => onNudgeSelected(0, stepNorm)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: effectiveTargetReady ? 'pointer' : 'not-allowed',
                opacity: effectiveTargetReady ? 1 : 0.45,
              }}
              title="រំកិលចុះក្រោម"
            >
              <AppIcon name="arrow-down" size={13} />
            </button>
            <div />
          </div>
        </div>
      </div>

      {/* Apply Aligned Layers to All Photos */}
      {photoCount > 1 && !alignPhotoSelected && onApplyOverlaysToAllPhotos && (
        <button
          type="button"
          onClick={onApplyOverlaysToAllPhotos}
          style={{
            padding: '0.48rem 0.75rem',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#7c3aed',
            fontSize: '0.77rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.38rem',
          }}
        >
          <AppIcon name="copy" size={14} />
          អនុវត្តទីតាំង Layer នេះទៅគ្រប់ {photoCount} រូប
        </button>
      )}
    </div>
  );
}
