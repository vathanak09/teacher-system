"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '@/components/AppIcons';
import { CLASS_COLORS } from '@/constants/classAppearance';
import {
  CELL_COLOR_OPTIONS,
  ROW_CATEGORY_META,
  RowCategory,
  SHIFT_ORDER,
  SHIFT_PRESETS,
  SUBJECT_SUGGESTIONS,
  ScheduleCellContent,
  ScheduleRecord,
  ScheduleTimeRow,
  ShiftType,
  WEEK_DAYS,
  WeekDayKey,
  clonePresetRows,
  inferShiftTypeFromClass,
} from './scheduleModel';

interface ScheduleFormModalProps {
  isOpen: boolean;
  editingSchedule: ScheduleRecord | null;
  defaultShiftType?: ShiftType;
  assignableClasses: any[];
  allClasses: any[];
  isAdmin: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    shiftType: ShiftType;
    description: string;
    assignedClassIds: string[];
    resetRowsToShiftPreset: boolean;
  }) => Promise<void> | void;
}

export function ScheduleFormModal({
  isOpen,
  editingSchedule,
  defaultShiftType = 'morning',
  assignableClasses,
  allClasses,
  isAdmin,
  onClose,
  onSave,
}: ScheduleFormModalProps) {
  const [shiftType, setShiftType] = useState<ShiftType>(defaultShiftType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState('');
  const [onlyMatchingShift, setOnlyMatchingShift] = useState(false);
  const [resetRowsOnSave, setResetRowsOnSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSchedule) {
      setShiftType(editingSchedule.shiftType);
      setTitle(editingSchedule.title);
      setDescription(editingSchedule.description || '');
      setSelectedClassIds(editingSchedule.assignedClassIds || []);
      setResetRowsOnSave(false);
    } else {
      const preset = SHIFT_PRESETS[defaultShiftType];
      setShiftType(defaultShiftType);
      setTitle(preset.defaultTitle);
      setDescription(preset.defaultDescription);
      setSelectedClassIds([]);
      setResetRowsOnSave(true);
    }
    setClassSearch('');
    setOnlyMatchingShift(false);
  }, [isOpen, editingSchedule, defaultShiftType]);

  const assignableIdSet = useMemo(
    () => new Set(assignableClasses.map((c) => c.id)),
    [assignableClasses]
  );

  // If teacher opens a schedule shared by admin that also has other teachers' classes, show them locked at top
  const lockedExternalClassIds = useMemo(
    () =>
      isAdmin
        ? []
        : selectedClassIds.filter((cid) => !assignableIdSet.has(cid)),
    [isAdmin, selectedClassIds, assignableIdSet]
  );

  const visibleClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    return assignableClasses.filter((cls) => {
      if (onlyMatchingShift && inferShiftTypeFromClass(cls) !== shiftType) {
        return false;
      }
      if (!q) return true;
      const hay = `${cls.classCode || ''} ${cls.className || ''} ${cls.teacherName || ''} ${cls.shift || ''} ${cls.level || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assignableClasses, onlyMatchingShift, shiftType, classSearch]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleShiftSelect = (nextShift: ShiftType) => {
    const prevPreset = SHIFT_PRESETS[shiftType];
    const nextPreset = SHIFT_PRESETS[nextShift];
    setShiftType(nextShift);
    if (!editingSchedule) {
      if (!title.trim() || title === prevPreset.defaultTitle) {
        setTitle(nextPreset.defaultTitle);
      }
      if (!description.trim() || description === prevPreset.defaultDescription) {
        setDescription(nextPreset.defaultDescription);
      }
    }
  };

  const toggleClass = (cid: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = visibleClasses.map((c) => c.id);
    setSelectedClassIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const clearVisible = () => {
    const visibleSet = new Set(visibleClasses.map((c) => c.id));
    setSelectedClassIds((prev) => prev.filter((id) => !visibleSet.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('សូមបំពេញឈ្មោះកាលវិភាគ!');
      return;
    }
    try {
      setIsSaving(true);
      await onSave({
        title: title.trim(),
        shiftType,
        description: description.trim(),
        assignedClassIds: Array.from(new Set([...lockedExternalClassIds, ...selectedClassIds])),
        resetRowsToShiftPreset: editingSchedule ? resetRowsOnSave : true,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const allClassMap = new Map(allClasses.map((c) => [c.id, c]));

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--modal-bg, var(--main-bg))',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 55px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            padding: '1.15rem 1.35rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'var(--modal-bg, var(--main-bg))',
            zIndex: 5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.14)',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="calendar" size={18} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {editingSchedule ? 'កែប្រែព័ត៌មាន & Assign ថ្នាក់រៀន' : 'បង្កើតកាលវិភាគថ្មី'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="x" size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Shift Selection Cards */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              ជ្រើសរើសប្រភេទវេនសិក្សា *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.55rem' }}>
              {SHIFT_ORDER.map((sKey) => {
                const meta = SHIFT_PRESETS[sKey];
                const active = shiftType === sKey;
                return (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => handleShiftSelect(sKey)}
                    style={{
                      textAlign: 'left',
                      padding: '0.7rem 0.8rem',
                      borderRadius: '12px',
                      border: active ? `2px solid ${meta.color}` : '1px solid var(--border-color)',
                      background: active ? meta.bg : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.22rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.85rem', color: active ? meta.color : 'var(--text-primary)' }}>
                        <AppIcon name={meta.iconName} size={14} />
                        <span>{meta.shortLabel}</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.42rem', borderRadius: '999px', background: active ? meta.color : 'var(--modal-bg)', color: active ? '#fff' : 'var(--text-secondary)' }}>
                        {meta.modeTag}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {meta.timeSpan}
                    </div>
                  </button>
                );
              })}
            </div>
            {editingSchedule && editingSchedule.shiftType !== shiftType && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.55rem', fontSize: '0.82rem', fontWeight: 600, color: '#d97706', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={resetRowsOnSave}
                  onChange={(e) => setResetRowsOnSave(e.target.checked)}
                />
                <span>ប្តូរជួរម៉ោងក្នុងតារាងឱ្យត្រូវតាមម៉ោងស្តង់ដារនៃ {SHIFT_PRESETS[shiftType].shortLabel} ដែរ</span>
              </label>
            )}
          </div>

          {/* Title & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                ឈ្មោះកាលវិភាគ *
              </label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="ឧ. កាលវិភាគ Level 1 & 2 - វេនព្រឹក"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                កំណត់សម្គាល់ / ការពណ៌នា (ស្រេចចិត្ត)
              </label>
              <input
                type="text"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ឧ. ម៉ោងមកដល់ • ម៉ោងសិក្សា • ម៉ោងប្រជុំជួរ..."
              />
            </div>
          </div>

          {/* Multi-Class Assigner */}
          <div
            style={{
              padding: '0.9rem',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AppIcon name="graduation-cap" size={16} />
                  <span>Assign កាលវិភាគទៅថ្នាក់រៀន (ជ្រើសបានច្រើនថ្នាក់)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  បានជ្រើសរើសសរុប <strong style={{ color: 'var(--accent-primary)' }}>{selectedClassIds.length}</strong> ថ្នាក់
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setOnlyMatchingShift((v) => !v)}
                  style={{
                    padding: '0.28rem 0.6rem',
                    borderRadius: '8px',
                    border: onlyMatchingShift ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: onlyMatchingShift ? 'rgba(59, 130, 246, 0.12)' : 'var(--modal-bg)',
                    color: onlyMatchingShift ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {onlyMatchingShift ? 'កំពុងត្រងតាមវេននេះ' : 'ត្រងតាមវេន'}
                </button>
                <button
                  type="button"
                  onClick={selectAllVisible}
                  style={{
                    padding: '0.28rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ជ្រើសទាំងអស់
                </button>
                <button
                  type="button"
                  onClick={clearVisible}
                  style={{
                    padding: '0.28rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  សម្អាត
                </button>
              </div>
            </div>

            {lockedExternalClassIds.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                <span>ថ្នាក់គ្រូផ្សេងដែលបានភ្ជាប់ស្រាប់៖</span>
                {lockedExternalClassIds.map((cid) => {
                  const c = allClassMap.get(cid);
                  return (
                    <span
                      key={cid}
                      style={{
                        padding: '0.15rem 0.48rem',
                        borderRadius: '999px',
                        background: 'var(--modal-bg)',
                        border: '1px solid var(--border-color)',
                        fontWeight: 600,
                      }}
                    >
                      {c?.classCode || c?.className || cid}
                    </span>
                  );
                })}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                <AppIcon name="search" size={14} />
              </span>
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="ស្វែងរកកូដថ្នាក់ ឈ្មោះថ្នាក់ ឬឈ្មោះគ្រូ..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                  borderRadius: '9px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--modal-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {visibleClasses.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                មិនមានថ្នាក់រៀនសម្រាប់ជ្រើសរើសទេ។
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '0.45rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '0.2rem',
                }}
              >
                {visibleClasses.map((cls) => {
                  const checked = selectedClassIds.includes(cls.id);
                  const cHex = CLASS_COLORS.find((co) => co.id === cls.color)?.value || '#3b82f6';
                  return (
                    <label
                      key={cls.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '10px',
                        border: checked ? `1.5px solid ${cHex}` : '1px solid var(--border-color)',
                        background: checked ? `${cHex}12` : 'var(--modal-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClass(cls.id)}
                        style={{ width: '16px', height: '16px', accentColor: cHex, flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.classCode ? `${cls.classCode}` : ''}
                          {cls.classCode && cls.className && cls.classCode !== cls.className ? ` • ${cls.className}` : cls.classCode ? '' : cls.className}
                        </div>
                        <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.shift || 'គ្មានវេន'}{cls.teacherName ? ` • ${cls.teacherName}` : ''}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <AppIcon name="check" size={16} />
              <span>{isSaving ? 'កំពុងរក្សាទុក...' : editingSchedule ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតកាលវិភាគ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface CellEditorModalProps {
  isOpen: boolean;
  row: ScheduleTimeRow | null;
  initialDayKey: WeekDayKey;
  initialCell?: ScheduleCellContent;
  onClose: () => void;
  onSaveDays: (
    rowId: string,
    targetDays: WeekDayKey[],
    content: ScheduleCellContent | null
  ) => Promise<void> | void;
}

export function CellEditorModal({
  isOpen,
  row,
  initialDayKey,
  initialCell,
  onClose,
  onSaveDays,
}: CellEditorModalProps) {
  const [subject, setSubject] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [color, setColor] = useState('blue');
  const [targetDays, setTargetDays] = useState<WeekDayKey[]>([initialDayKey]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubject(initialCell?.subject || '');
    setTeacherNote(initialCell?.teacherNote || '');
    setColor(initialCell?.color || (row?.category === 'break' ? 'amber' : row?.category === 'dismissal' ? 'emerald' : 'blue'));
    setTargetDays([initialDayKey]);
  }, [isOpen, initialDayKey, initialCell, row]);

  if (!isOpen || !row || typeof document === 'undefined') return null;

  const toggleDay = (dKey: WeekDayKey) => {
    setTargetDays((prev) =>
      prev.includes(dKey) ? prev.filter((k) => k !== dKey) : [...prev, dKey]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDays.length === 0) {
      alert('សូមជ្រើសរើសយ៉ាងហោចណាស់មួយថ្ងៃ!');
      return;
    }
    const cleanSubject = subject.trim();
    const cleanNote = teacherNote.trim();
    try {
      setIsSaving(true);
      await onSaveDays(
        row.id,
        targetDays,
        cleanSubject || cleanNote
          ? { subject: cleanSubject, teacherNote: cleanNote, color }
          : null
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (targetDays.length === 0) return;
    try {
      setIsSaving(true);
      await onSaveDays(row.id, targetDays, null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10060,
        background: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--modal-bg, var(--main-bg))',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 55px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              កែប្រែខ្លឹមសារកាលវិភាគ
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {row.timeLabel} • {row.slotLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Subject Input + Quick Suggestions */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              មុខវិជ្ជា / ខ្លឹមសារមេរៀន / សកម្មភាព
            </label>
            <input
              type="text"
              className="input-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ឧ. Phonics & Vocabulary, Grammar, ប្រជុំជួរ..."
              autoFocus
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem', marginTop: '0.45rem' }}>
              {SUBJECT_SUGGESTIONS.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    background: subject === s ? 'rgba(59, 130, 246, 0.14)' : 'var(--bg-secondary)',
                    color: subject === s ? '#2563eb' : 'var(--text-secondary)',
                    fontSize: '0.71rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Teacher / Book */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              កំណត់ចំណាំ (គ្រូបង្រៀន / សៀវភៅ / បន្ទប់)
            </label>
            <input
              type="text"
              className="input-field"
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="ឧ. Let's Go Book 1 (Unit 3) ឬ ឈ្មោះគ្រូ..."
            />
          </div>

          {/* Accent Color */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.38rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              ពណ៌សម្គាល់
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {CELL_COLOR_OPTIONS.map((cOpt) => {
                const selected = color === cOpt.id;
                return (
                  <button
                    key={cOpt.id}
                    type="button"
                    onClick={() => setColor(cOpt.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.32rem',
                      padding: '0.28rem 0.6rem',
                      borderRadius: '999px',
                      border: selected ? `2px solid ${cOpt.color}` : '1px solid var(--border-color)',
                      background: selected ? cOpt.bg : 'var(--bg-secondary)',
                      color: selected ? cOpt.color : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: cOpt.color,
                      }}
                    />
                    <span>{cOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Day Apply Checkboxes */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                អនុវត្តសម្រាប់ថ្ងៃណាខ្លះ?
              </span>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTargetDays(WEEK_DAYS.map((d) => d.key))}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ទាំង ៥ ថ្ងៃ (ច័ន្ទ–សុក្រ)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDays(['mon', 'wed', 'fri'])}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.71rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ច័ន្ទ-ពុធ-សុក្រ
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.35rem' }}>
              {WEEK_DAYS.map((d) => {
                const checked = targetDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    style={{
                      padding: '0.42rem 0.25rem',
                      borderRadius: '8px',
                      border: checked ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: checked ? 'rgba(59, 130, 246, 0.14)' : 'var(--modal-bg)',
                      color: checked ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {d.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="trash" size={14} />
              <span>សម្អាតកោសិកា</span>
            </button>

            <div style={{ display: 'flex', gap: '0.55rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn"
                style={{ padding: '0.55rem 1.05rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                បោះបង់
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <AppIcon name="check" size={15} />
                <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface RowsEditorModalProps {
  isOpen: boolean;
  shiftType: ShiftType;
  initialRows: ScheduleTimeRow[];
  onClose: () => void;
  onSaveRows: (nextRows: ScheduleTimeRow[]) => Promise<void> | void;
}

export function RowsEditorModal({
  isOpen,
  shiftType,
  initialRows,
  onClose,
  onSaveRows,
}: RowsEditorModalProps) {
  const [rows, setRows] = useState<ScheduleTimeRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRows(initialRows.map((r) => ({ ...r })));
  }, [isOpen, initialRows]);

  if (!isOpen || typeof document === 'undefined') return null;

  const updateRow = (idx: number, patch: Partial<ScheduleTimeRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const moveRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const deleteRow = (idx: number) => {
    if (rows.length <= 1) {
      alert('ត្រូវតែមានយ៉ាងហោចណាស់ ១ ជួរម៉ោង!');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}`,
        timeLabel: '',
        slotLabel: 'ម៉ោងសិក្សាបន្ថែម',
        category: 'lesson',
        subtitle: '',
      },
    ]);
  };

  const restorePreset = () => {
    setRows(clonePresetRows(shiftType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rows
      .map((r, idx) => ({
        ...r,
        id: r.id || `row_${idx + 1}`,
        timeLabel: r.timeLabel.trim() || `ម៉ោងទី ${idx + 1}`,
        slotLabel: r.slotLabel.trim() || 'ម៉ោងសិក្សា',
        subtitle: (r.subtitle || '').trim(),
      }));
    try {
      setIsSaving(true);
      await onSaveRows(cleaned);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const categories: RowCategory[] = ['arrival', 'lesson', 'break', 'dismissal'];

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10060,
        background: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--modal-bg, var(--main-bg))',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 55px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            padding: '1.05rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'var(--modal-bg, var(--main-bg))',
            zIndex: 5,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              កែប្រែជួរម៉ោងក្នុងតារាង
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              កែម៉ោង បន្ថែមម៉ោងថ្មី ឬរៀបលំដាប់ម៉ោងសិក្សាសម្រាប់ {SHIFT_PRESETS[shiftType].shortLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={addRow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '9px',
                border: '1px solid var(--accent-primary)',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="plus" size={15} />
              <span>បន្ថែមជួរម៉ោងថ្មី</span>
            </button>

            <button
              type="button"
              onClick={restorePreset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '9px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="clock" size={14} />
              <span>ស្តារម៉ោងស្តង់ដារ ({SHIFT_PRESETS[shiftType].timeSpan})</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {rows.map((row, idx) => (
              <div
                key={row.id || idx}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      ម៉ោង (Time)
                    </label>
                    <input
                      type="text"
                      value={row.timeLabel}
                      onChange={(e) => updateRow(idx, { timeLabel: e.target.value })}
                      placeholder="ឧ. 7:30 - 8:30"
                      className="input-field"
                      style={{ padding: '0.42rem 0.6rem', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      ឈ្មោះវគ្គសិក្សា
                    </label>
                    <input
                      type="text"
                      value={row.slotLabel}
                      onChange={(e) => updateRow(idx, { slotLabel: e.target.value })}
                      placeholder="ឧ. មេរៀនទី ១"
                      className="input-field"
                      style={{ padding: '0.42rem 0.6rem', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      ប្រភេទជួរ
                    </label>
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(idx, { category: e.target.value as RowCategory })}
                      className="input-field"
                      style={{ padding: '0.42rem 0.55rem', fontSize: '0.82rem' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {ROW_CATEGORY_META[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={row.subtitle || ''}
                    onChange={(e) => updateRow(idx, { subtitle: e.target.value })}
                    placeholder="ការពណ៌នាខ្លី (ស្រេចចិត្ត) ឧ. សម្រាក ២០ នាទី ឬ ប្រជុំជួរ..."
                    className="input-field"
                    style={{ flex: 1, padding: '0.38rem 0.6rem', fontSize: '0.78rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => moveRow(idx, -1)}
                    disabled={idx === 0}
                    title="រំកិលឡើង"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--modal-bg)',
                      color: 'var(--text-primary)',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      opacity: idx === 0 ? 0.4 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="arrow-up" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(idx, 1)}
                    disabled={idx === rows.length - 1}
                    title="រំកិលចុះ"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--modal-bg)',
                      color: 'var(--text-primary)',
                      cursor: idx === rows.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: idx === rows.length - 1 ? 0.4 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="arrow-down" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRow(idx)}
                    title="លុបជួរនេះ"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ padding: '0.55rem 1.1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <AppIcon name="check" size={15} />
              <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកជួរម៉ោង'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
