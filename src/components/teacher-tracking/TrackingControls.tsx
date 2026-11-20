"use client";
import React from 'react';
import CustomDatePicker from '@/components/CustomDatePicker';
import { AppIcon } from '@/components/AppIcons';
import { convertDriveImageLink } from '@/utils/driveLink';
import {
  CompletionDropdownStatus,
  EXAM_STAGES,
  ExamScheduleConfig,
  TeacherWeekEntry,
  countExamStages,
  getStatusBadgePalette,
  hasTeacherSpecialTask,
  isExamEnabledInWeek4,
  normalizeExternalUrl,
  toNonNegInt,
} from './trackingModel';

export function TeacherAvatar({
  teacher,
  size = 34,
  forceLight = false,
}: {
  teacher: any;
  size?: number;
  forceLight?: boolean;
}) {
  const photoUrl = teacher?.photo ? convertDriveImageLink(teacher.photo) : '';
  const initial = String(teacher?.fullName || 'គ').trim().charAt(0);
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={teacher.fullName}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: forceLight ? '2px solid #e2e8f0' : '2px solid var(--border-color)',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d9488, #0284c7)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.max(12, Math.round(size * 0.42)),
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

/** Integer-only stepper (no decimals). */
export function IntStepper({
  value,
  onChange,
  accentColor = '#0f172a',
  highlightWhenPositive = false,
  badgeBg = 'rgba(239, 68, 68, 0.1)',
}: {
  value: number;
  onChange: (nextVal: number, immediate: boolean) => void;
  accentColor?: string;
  highlightWhenPositive?: boolean;
  badgeBg?: string;
}) {
  const active = highlightWhenPositive && value > 0;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '8px',
        border: active ? `1px solid ${accentColor}` : '1px solid var(--border-color)',
        background: active ? badgeBg : 'var(--main-bg)',
        overflow: 'hidden',
        height: '30px',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1), true)}
        style={{
          width: '23px',
          height: '100%',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.9rem',
          lineHeight: 1,
        }}
        title="ដក ១"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(toNonNegInt(e.target.value), false)}
        style={{
          width: '32px',
          height: '100%',
          border: 'none',
          background: 'transparent',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.82rem',
          color: active ? accentColor : 'var(--text-primary)',
          outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1, true)}
        style={{
          width: '23px',
          height: '100%',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.9rem',
          lineHeight: 1,
        }}
        title="បូក ១"
      >
        +
      </button>
    </div>
  );
}

/**
 * Shared parameterized cell for Homework & Video columns:
 * 3-state dropdown + numeric stepper + optional Video URL + admin comment note box.
 */
export function StatusCountNoteCell({
  status,
  count,
  note,
  labels,
  notePlaceholder,
  urlValue,
  urlPlaceholder,
  onStatusChange,
  onCountChange,
  onNoteChange,
  onUrlChange,
}: {
  status: CompletionDropdownStatus;
  count: number;
  note: string;
  labels: Record<CompletionDropdownStatus, string>;
  notePlaceholder: string;
  urlValue?: string;
  urlPlaceholder?: string;
  onStatusChange: (next: CompletionDropdownStatus) => void;
  onCountChange: (nextCount: number, immediate: boolean) => void;
  onNoteChange: (nextNote: string) => void;
  onUrlChange?: (nextUrl: string) => void;
}) {
  const palette = getStatusBadgePalette(status);
  const cleanHref = urlValue ? normalizeExternalUrl(urlValue) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as CompletionDropdownStatus)}
          style={{
            flex: 1,
            minWidth: '115px',
            height: '30px',
            padding: '0 0.45rem',
            borderRadius: '8px',
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            color: palette.color,
            fontWeight: 700,
            fontSize: '0.76rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="none" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>
            {labels.none}
          </option>
          <option value="partial" style={{ background: 'var(--modal-bg)', color: '#d97706' }}>
            {labels.partial}
          </option>
          <option value="done" style={{ background: 'var(--modal-bg)', color: '#059669' }}>
            {labels.done}
          </option>
        </select>

        <IntStepper
          value={count}
          onChange={onCountChange}
          accentColor={status === 'partial' ? '#d97706' : '#059669'}
          highlightWhenPositive={true}
          badgeBg={
            status === 'partial' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(16, 185, 129, 0.12)'
          }
        />
      </div>

      {onUrlChange !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
          <input
            type="url"
            value={urlValue || ''}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlPlaceholder || 'Link វីដេអូ...'}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.28rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
          {cleanHref && (
            <a
              href={cleanHref}
              target="_blank"
              rel="noopener noreferrer"
              title="បើកមើលវីដេអូ"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.26rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.14)',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.72rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <AppIcon name="external-link" size={12} />
              <span>មើល</span>
            </a>
          )}
        </div>
      )}

      <input
        type="text"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder={notePlaceholder}
        style={{
          width: '100%',
          padding: '0.28rem 0.5rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          background: 'var(--main-bg)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          outline: 'none',
        }}
      />
    </div>
  );
}

/** Column header component for Col 4 (វិញ្ញាសាប្រឡង) with inline Admin schedule dates. */
export function ExamHeaderConfig({
  config,
  onChange,
  onOpenNotice,
}: {
  config?: ExamScheduleConfig;
  onChange: (next: ExamScheduleConfig) => void;
  onOpenNotice?: () => void;
}) {
  const cfg = config || {};
  const isActive = isExamEnabledInWeek4(cfg);

  const dateFields: {
    key: 'prepareDate' | 'collectDate' | 'examDate' | 'resultDate';
    label: string;
    placeholder: string;
  }[] = [
    { key: 'prepareDate', label: 'ធ្វើវិញ្ញាសា៖', placeholder: 'dd/mm/yyyy' },
    { key: 'collectDate', label: 'ប្រមូលវិញ្ញាសា៖', placeholder: 'dd/mm/yyyy' },
    { key: 'examDate', label: 'ថ្ងៃត្រូវប្រឡង៖', placeholder: 'dd/mm/yyyy' },
    { key: 'resultDate', label: 'ចេញលទ្ធផល៖', placeholder: 'dd/mm/yyyy' },
  ];

  const compactDateStyle: React.CSSProperties = {
    padding: '0.24rem 0.45rem',
    fontSize: '0.71rem',
    fontWeight: 600,
    borderRadius: '6px',
    height: '27px',
    background: 'var(--modal-bg)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.32rem', fontWeight: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
          ៤. វិញ្ញាសាប្រឡង (ប្រចាំខែ)
        </span>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.12rem 0.45rem',
            borderRadius: '999px',
            background: isActive ? 'rgba(139, 92, 246, 0.14)' : 'var(--card-bg)',
            color: isActive ? '#7c3aed' : 'var(--text-secondary)',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
          }}
          title="បើក/បិទ ការរាប់ពិន្ទុវិញ្ញាសាក្នុងសប្តាហ៍ទី ៤"
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                onChange({ ...cfg, enabled: true });
              } else {
                onChange({
                  ...cfg,
                  enabled: false,
                  prepareDate: '',
                  collectDate: '',
                  examDate: '',
                  resultDate: '',
                });
              }
            }}
            style={{ accentColor: '#7c3aed' }}
          />
          មានប្រឡង
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
        {dateFields.map((df) => (
          <div
            key={df.key}
            style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}
          >
            <span
              style={{
                width: '82px',
                flexShrink: 0,
                fontSize: '0.69rem',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                textAlign: 'left',
              }}
            >
              {df.label}
            </span>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <CustomDatePicker
                selected={cfg[df.key] || ''}
                onChange={(iso) => {
                  const updated: ExamScheduleConfig = {
                    ...cfg,
                    [df.key]: iso,
                  };
                  const anyDate = Boolean(
                    updated.prepareDate?.trim() ||
                      updated.collectDate?.trim() ||
                      updated.examDate?.trim() ||
                      updated.resultDate?.trim()
                  );
                  onChange({
                    ...updated,
                    enabled: anyDate ? true : cfg.enabled,
                    popupEnabled: cfg.popupEnabled !== false,
                    noticeUpdatedAt: Date.now(),
                  });
                }}
                placeholderText={df.placeholder}
                style={compactDateStyle}
              />
            </div>
          </div>
        ))}
      </div>

      {onOpenNotice && (
        <button
          type="button"
          onClick={onOpenNotice}
          style={{
            marginTop: '0.15rem',
            width: '100%',
            padding: '0.3rem 0.55rem',
            borderRadius: '7px',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            background: 'rgba(124, 58, 237, 0.1)',
            color: '#6d28d9',
            fontWeight: 700,
            fontSize: '0.71rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.32rem',
          }}
          title="បើកលិខិតជូនដំណឹងសម្រាប់ Screenshot ចូល Group Chat និងកំណត់ Pop-up លើ Dashboard គ្រូ"
        >
          <AppIcon name="bell" size={12} />
          <span>លិខិតជូនដំណឹង / Screenshot</span>
        </button>
      )}
    </div>
  );
}

/** 3-stage interactive tracker cell for វិញ្ញាសាប្រឡង. */
export function ExamStagesCell({
  entry,
  onToggleStage,
  onNoteChange,
}: {
  entry: TeacherWeekEntry;
  onToggleStage: (field: 'examStage1Submitted' | 'examStage2Scored' | 'examStage3Result') => void;
  onNoteChange: (note: string) => void;
}) {
  const doneCount = countExamStages(entry);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
        {EXAM_STAGES.map((stage) => {
          const checked = Boolean(entry[stage.key]);
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onToggleStage(stage.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.35rem',
                width: '100%',
                padding: '0.24rem 0.5rem',
                borderRadius: '7px',
                border: checked ? '1px solid #10b981' : '1px solid var(--border-color)',
                background: checked ? 'rgba(16, 185, 129, 0.14)' : 'var(--main-bg)',
                color: checked ? '#059669' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.73rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{stage.label}</span>
              <span
                style={{
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  background: checked ? '#10b981' : 'var(--border-color)',
                  color: checked ? '#ffffff' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {checked ? <AppIcon name="check" size={10} strokeWidth={3} /> : stage.step}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <input
          type="text"
          value={entry.examNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="មតិវិញ្ញាសា..."
          style={{
            flex: 1,
            minWidth: 0,
            padding: '0.26rem 0.45rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--main-bg)',
            color: 'var(--text-primary)',
            fontSize: '0.73rem',
            outline: 'none',
          }}
        />
        <span
          style={{
            fontSize: '0.69rem',
            fontWeight: 800,
            color: doneCount === 3 ? '#059669' : doneCount > 0 ? '#7c3aed' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {doneCount}/3
        </span>
      </div>
    </div>
  );
}

/** Column 5 cell: Special Task assigned by Admin (numeric count + completion + description). */
export function SpecialTaskCell({
  entry,
  onCountChange,
  onToggleDone,
  onDescriptionChange,
}: {
  entry: TeacherWeekEntry;
  onCountChange: (count: number, immediate: boolean) => void;
  onToggleDone: () => void;
  onDescriptionChange: (desc: string) => void;
}) {
  const assigned = hasTeacherSpecialTask(entry);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.36rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <IntStepper
          value={entry.taskCount}
          onChange={onCountChange}
          accentColor="#0284c7"
          highlightWhenPositive={true}
          badgeBg="rgba(2, 132, 199, 0.12)"
        />
        <button
          type="button"
          onClick={onToggleDone}
          style={{
            flex: 1,
            height: '30px',
            padding: '0 0.45rem',
            borderRadius: '8px',
            border: entry.taskDone
              ? '1px solid #10b981'
              : assigned
                ? '1px solid #0284c7'
                : '1px solid var(--border-color)',
            background: entry.taskDone
              ? 'rgba(16, 185, 129, 0.14)'
              : assigned
                ? 'rgba(2, 132, 199, 0.1)'
                : 'var(--main-bg)',
            color: entry.taskDone
              ? '#059669'
              : assigned
                ? '#0284c7'
                : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.73rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          {entry.taskDone ? (
            <>
              <AppIcon name="check" size={12} />
              <span>រួចរាល់</span>
            </>
          ) : assigned ? (
            <>
              <AppIcon name="clock" size={12} />
              <span>កំពុងធ្វើ</span>
            </>
          ) : (
            <span>គ្មាន Task</span>
          )}
        </button>
      </div>

      <textarea
        rows={2}
        value={entry.taskDescription}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="សរសេររៀបរាប់កិច្ចការពិសេសប្រាប់គ្រូ..."
        style={{
          width: '100%',
          padding: '0.32rem 0.5rem',
          borderRadius: '7px',
          border: '1px solid var(--border-color)',
          background: 'var(--main-bg)',
          color: 'var(--text-primary)',
          fontSize: '0.74rem',
          lineHeight: 1.35,
          resize: 'vertical',
          outline: 'none',
          minHeight: '46px',
        }}
      />
    </div>
  );
}
