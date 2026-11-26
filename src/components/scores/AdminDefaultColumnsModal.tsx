"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '@/components/AppIcons';
import {
  ActiveScoreSubjectColumn,
  ClassScoreColumnsConfig,
  DEFAULT_COLUMN_ORDER,
  LOCKED_SUBJECT_KEY_SET,
  ScoreColumnInputMode,
  getAllAvailableSubjectColumns,
  getDefaultClassColumnsConfig,
  makeCustomColumnKey,
  sanitizeGlobalDefaultColumnsConfig,
} from './scoreColumns';

export interface AdminDefaultColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: ClassScoreColumnsConfig;
  onSave: (nextConfig: ClassScoreColumnsConfig) => Promise<void>;
}

export default function AdminDefaultColumnsModal({
  isOpen,
  onClose,
  initialConfig,
  onSave,
}: AdminDefaultColumnsModalProps) {
  const [draft, setDraft] = useState<ClassScoreColumnsConfig>(() =>
    sanitizeGlobalDefaultColumnsConfig(initialConfig)
  );
  const [newColLabel, setNewColLabel] = useState('');
  const [newColMode, setNewColMode] = useState<ScoreColumnInputMode>('number');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(sanitizeGlobalDefaultColumnsConfig(initialConfig));
      setNewColLabel('');
      setNewColMode('number');
      setDraggedKey(null);
      setDragOverKey(null);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen || typeof document === 'undefined') return null;

  const orderedColumns: ActiveScoreSubjectColumn[] = getAllAvailableSubjectColumns(draft);
  const currentOrder = orderedColumns.map((c) => c.key);

  const moveColumnByIndex = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= currentOrder.length ||
      toIndex >= currentOrder.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, moved);
    setDraft((prev) => ({
      ...prev,
      columnOrder: nextOrder,
    }));
  };

  const handleToggleDefaultEnabled = (colKey: string) => {
    if (LOCKED_SUBJECT_KEY_SET.has(colKey)) return;
    setDraft((prev) => {
      const exists = prev.enabledKeys.includes(colKey);
      return {
        ...prev,
        enabledKeys: exists
          ? prev.enabledKeys.filter((k) => k !== colKey)
          : [...prev.enabledKeys, colKey],
      };
    });
  };

  const handleToggleDefaultMode = (colKey: string) => {
    setDraft((prev) => {
      const curMode: ScoreColumnInputMode =
        prev.columnModes[colKey] === 'evaluation' ? 'evaluation' : 'number';
      const nextMode: ScoreColumnInputMode = curMode === 'number' ? 'evaluation' : 'number';
      return {
        ...prev,
        columnModes: {
          ...prev.columnModes,
          [colKey]: nextMode,
        },
      };
    });
  };

  const handleAddGlobalCustomCol = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newColLabel.trim();
    if (!cleanLabel) return;

    const existing = orderedColumns.find(
      (c) => c.label.trim().toLowerCase() === cleanLabel.toLowerCase()
    );
    if (existing) {
      setDraft((prev) => ({
        ...prev,
        enabledKeys: existing.isLocked
          ? prev.enabledKeys
          : prev.enabledKeys.includes(existing.key)
            ? prev.enabledKeys
            : [...prev.enabledKeys, existing.key],
        columnModes: {
          ...prev.columnModes,
          [existing.key]: newColMode,
        },
      }));
      setNewColLabel('');
      return;
    }

    const newKey = makeCustomColumnKey(cleanLabel, currentOrder);
    // Insert newly added default custom column right before the first locked column (or at end)
    const nextOrder = [...currentOrder];
    const firstLockedIdx = nextOrder.findIndex((k) => LOCKED_SUBJECT_KEY_SET.has(k));
    if (firstLockedIdx >= 0) {
      nextOrder.splice(firstLockedIdx, 0, newKey);
    } else {
      nextOrder.push(newKey);
    }

    setDraft((prev) => ({
      enabledKeys: [...prev.enabledKeys, newKey],
      columnModes: {
        ...prev.columnModes,
        [newKey]: newColMode,
      },
      customColumns: [...prev.customColumns, { key: newKey, label: cleanLabel }],
      columnOrder: nextOrder,
    }));
    setNewColLabel('');
  };

  const handleDeleteCustomCol = (colKey: string) => {
    setDraft((prev) => {
      const nextModes = { ...prev.columnModes };
      delete nextModes[colKey];
      return {
        enabledKeys: prev.enabledKeys.filter((k) => k !== colKey),
        columnModes: nextModes,
        customColumns: prev.customColumns.filter((c) => c.key !== colKey),
        columnOrder: (prev.columnOrder || DEFAULT_COLUMN_ORDER).filter((k) => k !== colKey),
      };
    });
  };

  const handleResetBuiltIn = () => {
    setDraft(getDefaultClassColumnsConfig());
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const normalized: ClassScoreColumnsConfig = {
        enabledKeys: draft.enabledKeys.filter((k) => !LOCKED_SUBJECT_KEY_SET.has(k)),
        columnModes: draft.columnModes,
        customColumns: draft.customColumns,
        columnOrder: currentOrder,
      };
      await onSave(normalized);
      onClose();
    } catch (err: any) {
      console.error('Failed saving admin default columns:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុក Default Columns៖ ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20045,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90dvh',
          background: 'var(--modal-bg, var(--main-bg))',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          boxShadow: '0 24px 54px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem 1.35rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'rgba(79, 70, 229, 0.14)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="sliders" size={19} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.08rem', color: 'var(--text-primary)' }}>
                កំណត់ Default និងលេខរៀង Col ទាំងអស់ (Admin)
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                អូស ឬចុចព្រួញ ↑/↓ ដើម្បីរៀបលេខរៀងជួរឈរទាំងអស់ • ធីកបើក/បិទ Default និងប្តូរ លេខ ↔ វាយតម្លៃ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '8px',
            }}
            title="បិទ"
          >
            <AppIcon name="x" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '1rem 1.35rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
            {orderedColumns.map((col, idx) => {
              const isChecked = col.isLocked || draft.enabledKeys.includes(col.key);
              const isEval = col.inputMode === 'evaluation';
              const isDragging = draggedKey === col.key;
              const isDragTarget = dragOverKey === col.key && draggedKey !== col.key;

              return (
                <div
                  key={col.key}
                  draggable
                  onDragStart={(e) => {
                    setDraggedKey(col.key);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', col.key);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverKey !== col.key) setDragOverKey(col.key);
                  }}
                  onDragLeave={() => {
                    if (dragOverKey === col.key) setDragOverKey(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromKey = draggedKey || e.dataTransfer.getData('text/plain');
                    const fromIdx = currentOrder.indexOf(fromKey);
                    if (fromIdx !== -1 && fromIdx !== idx) {
                      moveColumnByIndex(fromIdx, idx);
                    }
                    setDraggedKey(null);
                    setDragOverKey(null);
                  }}
                  onDragEnd={() => {
                    setDraggedKey(null);
                    setDragOverKey(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.48rem 0.65rem',
                    borderRadius: '10px',
                    background: col.isLocked
                      ? 'rgba(99, 102, 241, 0.08)'
                      : isChecked
                        ? 'var(--bg-secondary)'
                        : 'transparent',
                    border: isDragTarget
                      ? '1.5px dashed #4f46e5'
                      : col.isLocked
                        ? '1px solid rgba(99, 102, 241, 0.3)'
                        : '1px solid var(--border-color)',
                    opacity: isDragging ? 0.45 : 1,
                    cursor: 'grab',
                    transition: 'border-color 0.14s ease, background 0.14s ease, opacity 0.14s ease',
                  }}
                >
                  {/* Order Index Badge */}
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '7px',
                      background: col.isLocked
                        ? 'rgba(79, 70, 229, 0.16)'
                        : 'rgba(148, 163, 184, 0.18)',
                      color: col.isLocked ? '#4338ca' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    title={`លេខរៀងទី ${idx + 1}`}
                  >
                    {idx + 1}
                  </span>

                  {/* Up / Down Reorder Buttons */}
                  <div style={{ display: 'inline-flex', gap: '0.18rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveColumnByIndex(idx, idx - 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--main-bg)',
                        color: idx === 0 ? 'var(--border-color)' : 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        padding: 0,
                      }}
                      title="រំកិលឡើងលើ"
                    >
                      <AppIcon name="arrow-up" size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedColumns.length - 1}
                      onClick={() => moveColumnByIndex(idx, idx + 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--main-bg)',
                        color:
                          idx === orderedColumns.length - 1
                            ? 'var(--border-color)'
                            : 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: idx === orderedColumns.length - 1 ? 'not-allowed' : 'pointer',
                        padding: 0,
                      }}
                      title="រំកិលចុះក្រោម"
                    >
                      <AppIcon name="arrow-down" size={12} />
                    </button>
                  </div>

                  {/* Checkbox & Column Name */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: 1,
                      minWidth: 0,
                      cursor: col.isLocked ? 'default' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={col.isLocked}
                      onChange={() => handleToggleDefaultEnabled(col.key)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: col.isLocked ? '#6366f1' : '#10b981',
                        cursor: col.isLocked ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: isChecked ? 700 : 500,
                        fontSize: '0.88rem',
                        color: col.isLocked ? '#4338ca' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.label}
                    </span>

                    {col.isLocked && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.42rem',
                          borderRadius: '999px',
                          background: 'rgba(99, 102, 241, 0.16)',
                          color: '#4338ca',
                          flexShrink: 0,
                        }}
                        title="ជួរឈរពិសេស — គ្រូមិនអាចដកចេញបានទេ ប៉ុន្តែ Admin អាចប្តូរលេខរៀងបាន"
                      >
                        <AppIcon name="lock" size={10} />
                        <span>ពិសេស</span>
                      </span>
                    )}

                    {col.isCustom && (
                      <span
                        style={{
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.4rem',
                          borderRadius: '999px',
                          background: 'rgba(139, 92, 246, 0.14)',
                          color: '#7c3aed',
                          flexShrink: 0,
                        }}
                      >
                        ថ្មី
                      </span>
                    )}
                  </label>

                  {/* Default Input Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleDefaultMode(col.key)}
                    style={{
                      padding: '0.18rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.73rem',
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
                      flexShrink: 0,
                    }}
                    title="កំណត់របៀបលំនាំដើម (លេខពិន្ទុ ↔ វាយតម្លៃ)"
                  >
                    {isEval ? 'វាយតម្លៃ' : '123 លេខ'}
                  </button>

                  {col.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCol(col.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger, #ef4444)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title={`លុបជួរឈរ "${col.label}"`}
                    >
                      <AppIcon name="trash" size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Global Default Column */}
          <form
            onSubmit={handleAddGlobalCustomCol}
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              + បន្ថែម Col លំនាំដើមថ្មីសម្រាប់ប្រព័ន្ធ
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                placeholder="ឧ. Grammar, Vocabulary, Project..."
                style={{
                  flex: 1,
                  minWidth: '160px',
                  padding: '0.44rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--main-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--main-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setNewColMode('number')}
                  style={{
                    padding: '0.32rem 0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    background:
                      newColMode === 'number' ? 'var(--primary-color, #2563eb)' : 'transparent',
                    color: newColMode === 'number' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  លេខ
                </button>
                <button
                  type="button"
                  onClick={() => setNewColMode('evaluation')}
                  style={{
                    padding: '0.32rem 0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: newColMode === 'evaluation' ? '#10b981' : 'transparent',
                    color: newColMode === 'evaluation' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  វាយតម្លៃ
                </button>
              </div>
              <button
                type="submit"
                disabled={!newColLabel.trim()}
                style={{
                  padding: '0.44rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: !newColLabel.trim() ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: !newColLabel.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                បន្ថែម
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.95rem 1.35rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleResetBuiltIn}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <AppIcon name="refresh-cw" size={14} />
            <span>លំនាំដើមប្រព័ន្ធ</span>
          </button>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '9px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveClick}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '9px',
                border: 'none',
                background: isSaving ? '#64748b' : 'linear-gradient(135deg, #4f46e5, #2563eb)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)',
              }}
            >
              {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក Default'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
