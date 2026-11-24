"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '../AppIcons';

export interface AssignableScoreStudent {
  scoreId: string;
  studentIdCode: string;
  fullName: string;
  gender: string;
  effectiveLevel: string;
  masterLevel: string;
  isLevelOverridden: boolean;
}

export interface AssignScoreLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameLabel: string;
  selectedMonth: string;
  students: AssignableScoreStudent[];
  suggestedLevels: string[];
  initialTargetLevel?: string;
  initialSelectedScoreIds?: string[];
  onAssignLevel: (scoreIds: string[], targetLevel: string) => Promise<void>;
}

const UNASSIGNED_FILTER = '__UNASSIGNED__';

export default function AssignScoreLevelModal({
  isOpen,
  onClose,
  classNameLabel,
  selectedMonth,
  students,
  suggestedLevels,
  initialTargetLevel = '',
  initialSelectedScoreIds = [],
  onAssignLevel,
}: AssignScoreLevelModalProps) {
  const [targetLevel, setTargetLevel] = useState<string>(initialTargetLevel);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedScoreIds);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setTargetLevel(initialTargetLevel || '');
    setSelectedIds(initialSelectedScoreIds || []);
    setSearchQuery('');
    setFilterLevel('ALL');
    setIsSaving(false);
  }, [isOpen, initialTargetLevel, initialSelectedScoreIds]);

  const currentLevelsInClass = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.effectiveLevel) set.add(s.effectiveLevel);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }, [students]);

  const allQuickLevels = useMemo(() => {
    const set = new Set<string>();
    currentLevelsInClass.forEach((l) => set.add(l));
    suggestedLevels.forEach((l) => {
      const clean = String(l || '').trim();
      if (clean) set.add(clean);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }, [currentLevelsInClass, suggestedLevels]);

  const hasUnassigned = useMemo(
    () => students.some((s) => !s.effectiveLevel),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (filterLevel === UNASSIGNED_FILTER && s.effectiveLevel) return false;
      if (filterLevel !== 'ALL' && filterLevel !== UNASSIGNED_FILTER && s.effectiveLevel !== filterLevel) {
        return false;
      }
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentIdCode.toLowerCase().includes(q) ||
        s.effectiveLevel.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery, filterLevel]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredStudents.map((s) => s.scoreId);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const clearAllSelected = () => {
    setSelectedIds([]);
  };

  const handleSubmit = async (levelToSave: string) => {
    if (selectedIds.length === 0) {
      alert('សូមជ្រើសរើសឈ្មោះសិស្សយ៉ាងតិច ១ នាក់!');
      return;
    }
    setIsSaving(true);
    try {
      await onAssignLevel(selectedIds, levelToSave.trim());
      onClose();
    } catch (err: any) {
      console.error('Failed assigning student levels:', err);
      alert('មានបញ្ហាក្នុងការកំណត់វគ្គ៖ ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const trimmedTarget = targetLevel.trim();

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AppIcon name="layers" size={18} style={{ color: '#4f46e5' }} />
              <span>ជ្រើសសិស្សបញ្ចូលវគ្គ — ថ្នាក់ {classNameLabel}</span>
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              កំណត់វគ្គបណ្តោះអាសន្នសម្រាប់ខែ {selectedMonth} ដើម្បីគណនា និងចេញលទ្ធផលដោយមិនផ្លាស់ប្តូរទិន្នន័យដើមសិស្ស។
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <AppIcon name="x" size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Step 1: Target Level Input & Quick Picks */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.45rem' }}>
              ១. ជ្រើសរើស ឬវាយឈ្មោះវគ្គគោលដៅ
            </label>
            <input
              type="text"
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              placeholder="ឧទាហរណ៍៖ K0, K1, L1, SPK1..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {allQuickLevels.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.55rem' }}>
                {allQuickLevels.map((lvl) => {
                  const active = trimmedTarget === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTargetLevel(lvl)}
                      style={{
                        padding: '0.24rem 0.65rem',
                        borderRadius: '999px',
                        border: active ? '1px solid #4f46e5' : '1px solid var(--border-color)',
                        background: active ? '#4f46e5' : 'var(--card-bg)',
                        color: active ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Students */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                ២. ជ្រើសរើសឈ្មោះសិស្ស ({selectedIds.length} / {students.length} នាក់)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={selectAllVisible}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ជ្រើសទាំងអស់ ({filteredStudents.length})
                </button>
                <button
                  type="button"
                  onClick={clearAllSelected}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ដកចេញទាំងអស់
                </button>
              </div>
            </div>

            {/* Search & Level Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះសិស្ស ឬអត្តលេខ..."
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '0.45rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilterLevel('ALL')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    border: filterLevel === 'ALL' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: filterLevel === 'ALL' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: filterLevel === 'ALL' ? '#2563eb' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ទាំងអស់
                </button>
                {currentLevelsInClass.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilterLevel(lvl)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      border: filterLevel === lvl ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      background: filterLevel === lvl ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                      color: filterLevel === lvl ? '#2563eb' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
                {hasUnassigned && (
                  <button
                    type="button"
                    onClick={() => setFilterLevel(UNASSIGNED_FILTER)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      border: filterLevel === UNASSIGNED_FILTER ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                      background: filterLevel === UNASSIGNED_FILTER ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: filterLevel === UNASSIGNED_FILTER ? '#b45309' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    គ្មានវគ្គ
                  </button>
                )}
              </div>
            </div>

            {/* Checkbox Student List */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                maxHeight: '280px',
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
              }}
            >
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  រកមិនឃើញសិស្សដែលត្រូវនឹងការស្វែងរកទេ។
                </div>
              ) : (
                filteredStudents.map((st, idx) => {
                  const checked = selectedIds.includes(st.scoreId);
                  return (
                    <label
                      key={st.scoreId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem',
                        padding: '0.52rem 0.75rem',
                        borderBottom: idx === filteredStudents.length - 1 ? 'none' : '1px solid var(--border-color)',
                        background: checked ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(st.scoreId)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '58px', fontWeight: 500 }}>
                          {st.studentIdCode || '-'}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {st.fullName}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: st.gender === 'ស្រី' ? '#ec4899' : 'var(--text-secondary)' }}>
                          ({st.gender || '-'})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        {st.isLevelOverridden && (
                          <span
                            title={`វគ្គដើមក្នុងទិន្នន័យសិស្ស៖ ${st.masterLevel || 'គ្មាន'}`}
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '999px',
                              background: 'rgba(139, 92, 246, 0.14)',
                              color: '#7c3aed',
                              fontWeight: 600,
                            }}
                          >
                            ខែនេះ
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.14rem 0.55rem',
                            borderRadius: '999px',
                            background: st.effectiveLevel
                              ? 'rgba(59, 130, 246, 0.14)'
                              : 'rgba(148, 163, 184, 0.18)',
                            color: st.effectiveLevel ? '#2563eb' : 'var(--text-secondary)',
                          }}
                        >
                          {st.effectiveLevel || 'គ្មានវគ្គ'}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <button
            type="button"
            disabled={isSaving || selectedIds.length === 0}
            onClick={() => handleSubmit('')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: selectedIds.length === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isSaving || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedIds.length === 0 ? 0.55 : 1,
            }}
            title="លុបការកែបណ្តោះអាសន្ន ហើយប្រើវគ្គដើមពីទិន្នន័យសិស្សវិញ"
          >
            ត្រឡប់ទៅវគ្គដើម
          </button>

          <div style={{ display: 'flex', gap: '0.55rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={isSaving || selectedIds.length === 0 || !trimmedTarget}
              onClick={() => handleSubmit(trimmedTarget)}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                background:
                  isSaving || selectedIds.length === 0 || !trimmedTarget
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #4f46e5, #2563eb)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor:
                  isSaving || selectedIds.length === 0 || !trimmedTarget ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AppIcon name="check" size={15} strokeWidth={2.4} />
              <span>
                {isSaving
                  ? 'កំពុងរក្សាទុក...'
                  : trimmedTarget
                    ? `បញ្ចូលទៅវគ្គ ${trimmedTarget} (${selectedIds.length} នាក់)`
                    : 'សូមបញ្ចូលឈ្មោះវគ្គ'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
