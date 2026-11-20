"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import {
  IntStepper,
  SpecialTaskCell,
  StatusCountNoteCell,
} from '@/components/teacher-tracking/TrackingControls';
import {
  CompletionDropdownStatus,
  HOMEWORK_STATUS_LABELS,
  MonthlyTrackingDoc,
  TeacherWeekEntry,
  VIDEO_STATUS_LABELS,
  WEEK_META,
  WeekKey,
  applyDropdownStatusChange,
  applyStatusCountChange,
  countExamStages,
  hasExamConfigActive,
  isExamWeek,
  normalizeEntry,
} from '@/components/teacher-tracking/trackingModel';
import { updateTeacherTrackingWeekEntry } from '@/services/db';

interface TeacherWeeklyTrackingCardProps {
  teacherId: string;
  trackingMonth: string;
  trackingMonthKh: string;
  trackingDoc: MonthlyTrackingDoc | null;
  isAdminInspecting?: boolean;
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const getCurrentCalendarMonth = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const getDefaultWeekForMonth = (monthKey: string, hasWeek5: boolean): WeekKey => {
  if (monthKey !== getCurrentCalendarMonth()) return 'w1';
  const day = new Date().getDate();
  const weekNum = Math.min(Math.floor((day - 1) / 7) + 1, hasWeek5 ? 5 : 4);
  return `w${weekNum}` as WeekKey;
};

/** Extracts only Teacher-owned fields so Admin-owned attendance/exam fields in RTDB are untouched. */
const extractTeacherEditableFields = (entry: TeacherWeekEntry): Record<string, unknown> => ({
  topicDone: entry.topicDone,
  topicCount: entry.topicCount,
  topicTitle: entry.topicTitle,
  homeworkDone: entry.homeworkDone,
  homeworkStatus: entry.homeworkStatus,
  homeworkCount: entry.homeworkCount,
  homeworkNote: entry.homeworkNote,
  videoDone: entry.videoDone,
  videoStatus: entry.videoStatus,
  videoCount: entry.videoCount,
  videoUrl: entry.videoUrl,
  videoNote: entry.videoNote,
  taskDone: entry.taskDone,
  taskCount: entry.taskCount,
  taskDescription: entry.taskDescription,
});

const hasWeekEntryActivity = (entry: TeacherWeekEntry): boolean =>
  entry.topicDone ||
  entry.topicCount > 0 ||
  Boolean(entry.topicTitle.trim()) ||
  entry.homeworkCount > 0 ||
  entry.homeworkStatus !== 'none' ||
  Boolean(entry.homeworkNote.trim()) ||
  entry.videoCount > 0 ||
  entry.videoStatus !== 'none' ||
  Boolean(entry.videoUrl.trim()) ||
  Boolean(entry.videoNote.trim()) ||
  entry.taskDone ||
  entry.taskCount > 0 ||
  Boolean(entry.taskDescription.trim());

export default function TeacherWeeklyTrackingCard({
  teacherId,
  trackingMonth,
  trackingMonthKh,
  trackingDoc,
  isAdminInspecting = false,
}: TeacherWeeklyTrackingCardProps) {
  const enableWeek5 = useMemo(() => {
    const [y, m] = trackingMonth.split('-').map(Number);
    const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 30;
    const defaultHasWeek5 = daysInMonth > 28;
    const hasAnyW5Data =
      Boolean(trackingDoc?.examSchedules?.w5 && hasExamConfigActive(trackingDoc.examSchedules.w5)) ||
      Object.values(trackingDoc?.records || {}).some((teacherRec) => Boolean(teacherRec?.w5));
    return trackingDoc?.enableWeek5 !== undefined
      ? Boolean(trackingDoc.enableWeek5) || hasAnyW5Data
      : defaultHasWeek5 || hasAnyW5Data;
  }, [trackingMonth, trackingDoc]);

  const activeWeeks = useMemo(
    () => (enableWeek5 ? WEEK_META : WEEK_META.slice(0, 4)),
    [enableWeek5]
  );

  const [selectedWeek, setSelectedWeek] = useState<WeekKey>(() =>
    getDefaultWeekForMonth(trackingMonth, enableWeek5)
  );

  const serverEntry = useMemo(
    () => normalizeEntry(trackingDoc?.records?.[teacherId]?.[selectedWeek]),
    [trackingDoc, teacherId, selectedWeek]
  );

  const [draftEntry, setDraftEntry] = useState<TeacherWeekEntry>(serverEntry);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const latestDraftRef = useRef<TeacherWeekEntry>(serverEntry);
  const isDirtyRef = useRef(false);
  const editSeqRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<{
    month: string;
    teacherId: string;
    week: WeekKey;
    entry: TeacherWeekEntry;
    seq: number;
  } | null>(null);

  const persistEntry = useCallback(
    async (
      monthKey: string,
      targetTeacherId: string,
      weekKey: WeekKey,
      entryToSave: TeacherWeekEntry,
      seq: number
    ) => {
      if (!monthKey || !targetTeacherId || targetTeacherId === 'me') return;
      setSaveStatus('saving');
      try {
        await updateTeacherTrackingWeekEntry(
          monthKey,
          targetTeacherId,
          weekKey,
          extractTeacherEditableFields(entryToSave)
        );
        if (editSeqRef.current === seq) {
          isDirtyRef.current = false;
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Failed saving teacher self-tracking entry:', err);
        setSaveStatus('error');
      }
    },
    []
  );

  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingPayloadRef.current;
    if (pending) {
      pendingPayloadRef.current = null;
      void persistEntry(
        pending.month,
        pending.teacherId,
        pending.week,
        pending.entry,
        pending.seq
      );
    }
  }, [persistEntry]);

  // Flush unsaved edits before resetting when month or teacher changes
  useEffect(() => {
    flushPendingSave();
    isDirtyRef.current = false;
    setSelectedWeek(getDefaultWeekForMonth(trackingMonth, enableWeek5));
    setSaveStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingMonth, teacherId]);

  // Keep selectedWeek valid if Week 5 gets toggled off
  useEffect(() => {
    if (!enableWeek5 && selectedWeek === 'w5') {
      flushPendingSave();
      isDirtyRef.current = false;
      setSelectedWeek('w4');
    }
  }, [enableWeek5, selectedWeek, flushPendingSave]);

  // Hydrate draft from RTDB when user does not have unsaved local edits
  useEffect(() => {
    if (!isDirtyRef.current) {
      setDraftEntry(serverEntry);
      latestDraftRef.current = serverEntry;
    }
  }, [serverEntry]);

  // Flush any debounced text edit on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const pending = pendingPayloadRef.current;
      if (pending && pending.teacherId && pending.teacherId !== 'me') {
        pendingPayloadRef.current = null;
        void updateTeacherTrackingWeekEntry(
          pending.month,
          pending.teacherId,
          pending.week,
          extractTeacherEditableFields(pending.entry)
        );
      }
    };
  }, []);

  const handleSelectWeek = (nextWeek: WeekKey) => {
    if (nextWeek === selectedWeek) return;
    flushPendingSave();
    isDirtyRef.current = false;
    const nextServerEntry = normalizeEntry(trackingDoc?.records?.[teacherId]?.[nextWeek]);
    latestDraftRef.current = nextServerEntry;
    setDraftEntry(nextServerEntry);
    setSelectedWeek(nextWeek);
    setSaveStatus('idle');
  };

  const applyMutation = useCallback(
    (updater: (prev: TeacherWeekEntry) => TeacherWeekEntry, immediate = false) => {
      const nextEntry = updater(latestDraftRef.current);
      latestDraftRef.current = nextEntry;
      setDraftEntry(nextEntry);
      isDirtyRef.current = true;
      const nextSeq = ++editSeqRef.current;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (immediate) {
        pendingPayloadRef.current = null;
        void persistEntry(trackingMonth, teacherId, selectedWeek, nextEntry, nextSeq);
      } else {
        pendingPayloadRef.current = {
          month: trackingMonth,
          teacherId,
          week: selectedWeek,
          entry: nextEntry,
          seq: nextSeq,
        };
        setSaveStatus('pending');
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          const pending = pendingPayloadRef.current;
          pendingPayloadRef.current = null;
          if (pending) {
            void persistEntry(
              pending.month,
              pending.teacherId,
              pending.week,
              pending.entry,
              pending.seq
            );
          }
        }, 650);
      }
    },
    [trackingMonth, teacherId, selectedWeek, persistEntry]
  );

  // Live monthly totals (uses local draftEntry for selectedWeek so KPIs respond instantly)
  const monthlyStats = useMemo(() => {
    let topics = 0;
    let homework = 0;
    let videos = 0;
    let tasks = 0;
    let tasksDone = 0;
    let permissionDays = 0;
    let absentDays = 0;
    let lateCount = 0;
    let lateMinutes = 0;

    for (const wkMeta of activeWeeks) {
      const wkEntry =
        wkMeta.key === selectedWeek
          ? draftEntry
          : normalizeEntry(trackingDoc?.records?.[teacherId]?.[wkMeta.key]);
      topics += wkEntry.topicCount > 0 ? wkEntry.topicCount : wkEntry.topicDone ? 1 : 0;
      homework += wkEntry.homeworkCount;
      videos += wkEntry.videoCount;
      tasks += wkEntry.taskCount;
      if (wkEntry.taskDone) tasksDone += 1;
      permissionDays += wkEntry.permissionDays;
      absentDays += wkEntry.absentDays;
      lateCount += wkEntry.lateCount;
      lateMinutes += wkEntry.lateMinutes;
    }

    const w4Entry =
      selectedWeek === 'w4'
        ? draftEntry
        : normalizeEntry(trackingDoc?.records?.[teacherId]?.w4);
    const examStagesDone = countExamStages(w4Entry);

    return {
      topics,
      homework,
      videos,
      tasks,
      tasksDone,
      permissionDays,
      absentDays,
      lateCount,
      lateMinutes,
      examStagesDone,
      w4ExamNote: w4Entry.examNote,
    };
  }, [activeWeeks, selectedWeek, draftEntry, trackingDoc, teacherId]);

  const weekLabels = trackingDoc?.weekLabels || {};
  const examSchedules = trackingDoc?.examSchedules || {};
  const currentWeekMeta = activeWeeks.find((w) => w.key === selectedWeek) || activeWeeks[0];

  return (
    <div
      className="surface-card"
      style={{
        padding: '1.1rem 1.15rem',
        borderRadius: '18px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.95rem',
      }}
    >
      <style>{`
        .teacher-weekly-entry-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.85rem;
        }
        @media (min-width: 768px) {
          .teacher-weekly-entry-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* Card Header + Live Save State */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '11px',
              background: 'rgba(13, 148, 136, 0.12)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="clipboard-check" size={18} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                តាមដាន និងកត់ត្រាការងារប្រចាំសប្តាហ៍
              </h3>
              <span
                style={{
                  padding: '0.12rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: '#4f46e5',
                }}
              >
                ខែ {trackingMonthKh}
              </span>
              {isAdminInspecting && (
                <span
                  style={{
                    padding: '0.12rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'rgba(245, 158, 11, 0.14)',
                    color: '#d97706',
                  }}
                >
                  Admin View
                </span>
              )}
            </div>
            <p
              style={{
                margin: '0.2rem 0 0',
                fontSize: '0.77rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              បញ្ចូលចំនួន Topic, កិច្ចការផ្ទះ, ថតវីដេអូ និងកិច្ចការពិសេស / ថ្នាក់ពិសេសដោយខ្លួនឯង (ភ្ជាប់ផ្ទាល់ជាមួយប្រព័ន្ធ Admin)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {saveStatus === 'pending' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#d97706',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '0.28rem 0.6rem',
                borderRadius: '999px',
              }}
            >
              <AppIcon name="clock" size={13} />
              កំពុងរង់ចាំរក្សាទុក...
            </span>
          )}
          {saveStatus === 'saving' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.12)',
                padding: '0.28rem 0.6rem',
                borderRadius: '999px',
              }}
            >
              <AppIcon name="refresh-cw" size={13} />
              កំពុងរក្សាទុក...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#059669',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.28rem 0.6rem',
                borderRadius: '999px',
              }}
            >
              <AppIcon name="check-circle" size={13} />
              រក្សាទុករួចរាល់
            </span>
          )}
          {saveStatus === 'error' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#dc2626',
                background: 'rgba(220, 38, 38, 0.12)',
                padding: '0.28rem 0.6rem',
                borderRadius: '999px',
              }}
            >
              <AppIcon name="alert-triangle" size={13} />
              មានបញ្ហារក្សាទុក
            </span>
          )}

          {(saveStatus === 'pending' || saveStatus === 'error') && (
            <button
              type="button"
              onClick={() => {
                if (saveStatus === 'error') {
                  const seq = ++editSeqRef.current;
                  void persistEntry(
                    trackingMonth,
                    teacherId,
                    selectedWeek,
                    latestDraftRef.current,
                    seq
                  );
                } else {
                  flushPendingSave();
                }
              }}
              style={{
                padding: '0.32rem 0.72rem',
                borderRadius: '8px',
                border: '1px solid #0d9488',
                background: '#0d9488',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <AppIcon name="check" size={13} strokeWidth={2.6} />
              រក្សាទុកឥឡូវ
            </button>
          )}
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexWrap: 'wrap',
          padding: '0.35rem',
          borderRadius: '12px',
          background: 'var(--main-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        {activeWeeks.map((wkMeta) => {
          const isSelected = wkMeta.key === selectedWeek;
          const wkEntry =
            wkMeta.key === selectedWeek
              ? draftEntry
              : normalizeEntry(trackingDoc?.records?.[teacherId]?.[wkMeta.key]);
          const hasActivity = hasWeekEntryActivity(wkEntry);
          const customLabel = weekLabels[wkMeta.key]?.trim();
          const hasExam =
            isExamWeek(wkMeta.key) || hasExamConfigActive(examSchedules[wkMeta.key]);

          return (
            <button
              key={wkMeta.key}
              type="button"
              onClick={() => handleSelectWeek(wkMeta.key)}
              style={{
                flex: '1 1 auto',
                minWidth: '108px',
                padding: '0.45rem 0.65rem',
                borderRadius: '9px',
                border: isSelected
                  ? '1px solid #0d9488'
                  : '1px solid transparent',
                background: isSelected ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
                color: isSelected ? '#0f766e' : 'var(--text-secondary)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.12rem',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.3rem',
                }}
              >
                <span>{wkMeta.label}</span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: hasActivity ? '#10b981' : 'rgba(148, 163, 184, 0.45)',
                    flexShrink: 0,
                  }}
                />
              </div>
              {(customLabel || hasExam) && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: hasExam ? '#7c3aed' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {customLabel || (hasExam ? 'សប្តាហ៍ប្រឡង' : '')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Week Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <AppIcon name="calendar" size={14} style={{ color: '#0d9488' }} />
          <span>
            កំពុងបញ្ចូលទិន្នន័យ៖{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {currentWeekMeta?.label}
              {weekLabels[selectedWeek]?.trim() ? ` (${weekLabels[selectedWeek]?.trim()})` : ''}
            </strong>
          </span>
        </div>
        {(draftEntry.note.trim() ||
          draftEntry.permissionDays > 0 ||
          draftEntry.absentDays > 0 ||
          draftEntry.lateCount > 0) && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {draftEntry.permissionDays > 0 && (
              <span style={{ color: '#0284c7', fontWeight: 700 }}>
                ច្បាប់: {draftEntry.permissionDays}
              </span>
            )}
            {draftEntry.absentDays > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                អត់ច្បាប់: {draftEntry.absentDays}
              </span>
            )}
            {draftEntry.lateCount > 0 && (
              <span style={{ color: '#d97706', fontWeight: 700 }}>
                យឺត: {draftEntry.lateCount} ({draftEntry.lateMinutes} នាទី)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4 Interactive Panels (Topic, Homework, Video, Special Task / Class) */}
      <div className="teacher-weekly-entry-grid">
        {/* 1. Topic */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '14px',
            background: 'var(--main-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.83rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              <AppIcon name="book-open" size={15} style={{ color: '#059669' }} />
              រៀន Topic (ចំនួន & ចំណងជើង)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() =>
                applyMutation((prev) => {
                  const nextDone = !prev.topicDone;
                  return {
                    ...prev,
                    topicDone: nextDone,
                    topicCount: nextDone ? Math.max(1, prev.topicCount) : 0,
                  };
                }, true)
              }
              style={{
                flex: 1,
                height: '32px',
                padding: '0 0.65rem',
                borderRadius: '8px',
                border: draftEntry.topicDone
                  ? '1px solid #10b981'
                  : '1px solid var(--border-color)',
                background: draftEntry.topicDone
                  ? 'rgba(16, 185, 129, 0.14)'
                  : 'var(--surface-bg)',
                color: draftEntry.topicDone ? '#059669' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              {draftEntry.topicDone && <AppIcon name="check" size={13} strokeWidth={2.8} />}
              <span>{draftEntry.topicDone ? 'បានរៀន Topic' : 'មិនទាន់រៀន'}</span>
            </button>

            <IntStepper
              value={draftEntry.topicCount}
              onChange={(val, imm) =>
                applyMutation(
                  (prev) => ({
                    ...prev,
                    topicCount: val,
                    topicDone: val >= 1,
                  }),
                  imm
                )
              }
              accentColor="#059669"
              highlightWhenPositive={true}
              badgeBg="rgba(16, 185, 129, 0.1)"
            />
          </div>

          <textarea
            value={draftEntry.topicTitle}
            rows={2}
            onChange={(e) =>
              applyMutation((prev) => ({ ...prev, topicTitle: e.target.value }), false)
            }
            placeholder="ចំណងជើង ឬ ការបរិយាយ Topic ដែលបានបង្រៀន..."
            style={{
              width: '100%',
              padding: '0.38rem 0.55rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.77rem',
              lineHeight: 1.4,
              resize: 'vertical',
              minHeight: '48px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        {/* 2. Homework */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '14px',
            background: 'var(--main-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.83rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            <AppIcon name="file-text" size={15} style={{ color: '#4f46e5' }} />
            កិច្ចការផ្ទះ (Homework)
          </span>

          <StatusCountNoteCell
            status={draftEntry.homeworkStatus}
            count={draftEntry.homeworkCount}
            note={draftEntry.homeworkNote}
            labels={HOMEWORK_STATUS_LABELS}
            notePlaceholder="ការបរិយាយ / មតិបន្ថែមលើកិច្ចការផ្ទះ..."
            onStatusChange={(nextStatus: CompletionDropdownStatus) =>
              applyMutation(
                (prev) => applyDropdownStatusChange(prev, 'homework', nextStatus),
                true
              )
            }
            onCountChange={(val, imm) =>
              applyMutation((prev) => applyStatusCountChange(prev, 'homework', val), imm)
            }
            onNoteChange={(text) =>
              applyMutation((prev) => ({ ...prev, homeworkNote: text }), false)
            }
          />
        </div>

        {/* 3. Video Recording */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '14px',
            background: 'var(--main-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.83rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            <AppIcon name="camera" size={15} style={{ color: '#0284c7' }} />
            ថតវីដេអូមេរៀន (Video)
          </span>

          <StatusCountNoteCell
            status={draftEntry.videoStatus}
            count={draftEntry.videoCount}
            note={draftEntry.videoNote}
            labels={VIDEO_STATUS_LABELS}
            urlValue={draftEntry.videoUrl}
            urlPlaceholder="Link វីដេអូ (Telegram / Google Drive)..."
            notePlaceholder="ការបរិយាយ / មតិបន្ថែមលើការថតវីដេអូ..."
            onStatusChange={(nextStatus: CompletionDropdownStatus) =>
              applyMutation((prev) => applyDropdownStatusChange(prev, 'video', nextStatus), true)
            }
            onCountChange={(val, imm) =>
              applyMutation((prev) => applyStatusCountChange(prev, 'video', val), imm)
            }
            onUrlChange={(urlVal) =>
              applyMutation(
                (prev) => ({
                  ...prev,
                  videoUrl: urlVal,
                  videoStatus:
                    urlVal.trim() && prev.videoStatus === 'none' ? 'done' : prev.videoStatus,
                  videoDone:
                    urlVal.trim() && prev.videoStatus === 'none' ? true : prev.videoDone,
                  videoCount:
                    urlVal.trim() && prev.videoCount === 0 ? 1 : prev.videoCount,
                }),
                false
              )
            }
            onNoteChange={(text) =>
              applyMutation((prev) => ({ ...prev, videoNote: text }), false)
            }
          />
        </div>

        {/* 4. Special Task / Special Class */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '14px',
            background: 'var(--main-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.83rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            <AppIcon name="star" size={15} style={{ color: '#d97706' }} />
            កិច្ចការពិសេស / ថ្នាក់ពិសេស (Task)
          </span>

          <SpecialTaskCell
            entry={draftEntry}
            onCountChange={(val, imm) =>
              applyMutation((prev) => ({ ...prev, taskCount: val }), imm)
            }
            onToggleDone={() =>
              applyMutation((prev) => {
                const nextDone = !prev.taskDone;
                return {
                  ...prev,
                  taskDone: nextDone,
                  taskCount:
                    nextDone && prev.taskCount === 0 && !prev.taskDescription.trim()
                      ? 1
                      : prev.taskCount,
                };
              }, true)
            }
            onDescriptionChange={(desc) =>
              applyMutation((prev) => ({ ...prev, taskDescription: desc }), false)
            }
          />
        </div>
      </div>

      {/* Admin Note banner for current week if Admin added any note */}
      {draftEntry.note.trim() && (
        <div
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '0.77rem',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <strong style={{ color: '#b45309' }}>កំណត់សម្គាល់ពី Admin ({currentWeekMeta?.label}): </strong>
          {draftEntry.note}
        </div>
      )}

      {/* Monthly Total Summary Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap',
          paddingTop: '0.65rem',
          borderTop: '1px dashed var(--border-color)',
          fontSize: '0.76rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
            សរុបប្រចាំខែ {trackingMonthKh}:
          </span>
          <span
            style={{
              padding: '0.18rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontWeight: 700,
            }}
          >
            Topic: {monthlyStats.topics}
          </span>
          <span
            style={{
              padding: '0.18rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(79, 70, 229, 0.1)',
              color: '#4f46e5',
              fontWeight: 700,
            }}
          >
            កិច្ចការផ្ទះ: {monthlyStats.homework}
          </span>
          <span
            style={{
              padding: '0.18rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              fontWeight: 700,
            }}
          >
            ថតវីដេអូ: {monthlyStats.videos}
          </span>
          <span
            style={{
              padding: '0.18rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(217, 119, 6, 0.12)',
              color: '#b45309',
              fontWeight: 700,
            }}
          >
            កិច្ចការ/ថ្នាក់ពិសេស: {monthlyStats.tasks}
            {monthlyStats.tasksDone > 0 ? ` (${monthlyStats.tasksDone} រួចរាល់)` : ''}
          </span>
        </div>

        {(monthlyStats.examStagesDone > 0 ||
          monthlyStats.permissionDays > 0 ||
          monthlyStats.absentDays > 0 ||
          monthlyStats.lateCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {monthlyStats.examStagesDone > 0 && (
              <span
                style={{
                  padding: '0.18rem 0.55rem',
                  borderRadius: '999px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  fontWeight: 700,
                }}
              >
                វិញ្ញាសា W4: {monthlyStats.examStagesDone}/3
              </span>
            )}
            {monthlyStats.permissionDays > 0 && (
              <span style={{ color: '#0284c7', fontWeight: 700 }}>
                ច្បាប់: {monthlyStats.permissionDays}
              </span>
            )}
            {monthlyStats.absentDays > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                អវត្តមាន: {monthlyStats.absentDays}
              </span>
            )}
            {monthlyStats.lateCount > 0 && (
              <span style={{ color: '#d97706', fontWeight: 700 }}>
                យឺត: {monthlyStats.lateCount} ដង ({monthlyStats.lateMinutes} នាទី)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
