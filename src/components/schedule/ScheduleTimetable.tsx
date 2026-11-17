"use client";
import React, { useMemo, useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import { CLASS_COLORS } from '@/constants/classAppearance';
import {
  ROW_CATEGORY_META,
  SHIFT_PRESETS,
  ScheduleCellContent,
  ScheduleRecord,
  ScheduleTimeRow,
  WEEK_DAYS,
  WeekDayKey,
  exportScheduleExcel,
  getCellColorStyle,
} from './scheduleModel';

interface ScheduleTimetableProps {
  schedule: ScheduleRecord;
  classMap: Map<string, any>;
  canEdit: boolean;
  canDelete: boolean;
  onCellClick: (row: ScheduleTimeRow, dayKey: WeekDayKey, currentCell?: ScheduleCellContent) => void;
  onEditInfoAndClasses: () => void;
  onEditRows: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ScheduleTimetable({
  schedule,
  classMap,
  canEdit,
  canDelete,
  onCellClick,
  onEditInfoAndClasses,
  onEditRows,
  onDuplicate,
  onDelete,
}: ScheduleTimetableProps) {
  const [mobileDayView, setMobileDayView] = useState(false);
  const todayJsDay = useMemo(() => new Date().getDay(), []);
  const defaultActiveDay: WeekDayKey = useMemo(() => {
    const matched = WEEK_DAYS.find((d) => d.jsDay === todayJsDay);
    return matched ? matched.key : 'mon';
  }, [todayJsDay]);
  const [selectedDayKey, setSelectedDayKey] = useState<WeekDayKey>(defaultActiveDay);

  const shiftMeta = SHIFT_PRESETS[schedule.shiftType] || SHIFT_PRESETS.morning;

  const assignedClasses = useMemo(
    () =>
      schedule.assignedClassIds
        .map((cid) => ({ id: cid, cls: classMap.get(cid) }))
        .filter((item) => Boolean(item.cls)),
    [schedule.assignedClassIds, classMap]
  );

  const missingClassCount = Math.max(0, schedule.assignedClassIds.length - assignedClasses.length);

  const getDefaultEmptyLabel = (row: ScheduleTimeRow): string => {
    if (row.category === 'break') return 'ចេញលេង / សម្រាក';
    if (row.category === 'arrival') return 'គ្រូមកដល់ & ចូលថ្នាក់';
    if (row.category === 'dismissal') return row.subtitle || 'ចេញទៅផ្ទះ';
    return 'មិនទាន់កំណត់';
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const renderCellBox = (row: ScheduleTimeRow, dayKey: WeekDayKey) => {
    const cell = schedule.cells?.[row.id]?.[dayKey];
    const hasContent = Boolean(cell && (cell.subject.trim() || cell.teacherNote?.trim()));
    const rowCat = ROW_CATEGORY_META[row.category];
    const palette = getCellColorStyle(cell?.color);
    const isToday = WEEK_DAYS.find((d) => d.key === dayKey)?.jsDay === todayJsDay;

    if (hasContent && cell) {
      return (
        <button
          type="button"
          onClick={() => canEdit && onCellClick(row, dayKey, cell)}
          className={canEdit ? 'schedule-cell-card' : undefined}
          style={{
            width: '100%',
            minHeight: row.category === 'lesson' ? '68px' : '46px',
            textAlign: 'left',
            padding: '0.52rem 0.65rem',
            borderRadius: '10px',
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            borderLeft: `4px solid ${palette.color}`,
            color: 'var(--text-primary)',
            cursor: canEdit ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '0.2rem',
            transition: 'all 0.16s ease',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.84rem',
              lineHeight: 1.35,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
            }}
          >
            {cell.subject || '—'}
          </div>
          {cell.teacherNote && (
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.35,
                wordBreak: 'break-word',
              }}
            >
              {cell.teacherNote}
            </div>
          )}
        </button>
      );
    }

    // Empty cell presentation styled by row category
    if (row.category === 'break') {
      return (
        <button
          type="button"
          onClick={() => canEdit && onCellClick(row, dayKey)}
          style={{
            width: '100%',
            minHeight: '42px',
            padding: '0.4rem 0.55rem',
            borderRadius: '9px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px dashed rgba(245, 158, 11, 0.28)',
            color: '#b45309',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: canEdit ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
          }}
        >
          <AppIcon name="coffee" size={13} />
          <span>ចេញលេង</span>
        </button>
      );
    }

    if (row.category === 'arrival' || row.category === 'dismissal') {
      return (
        <button
          type="button"
          onClick={() => canEdit && onCellClick(row, dayKey)}
          className={canEdit ? 'schedule-cell-card' : undefined}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '0.4rem 0.55rem',
            borderRadius: '9px',
            background: isToday ? 'rgba(59, 130, 246, 0.05)' : rowCat.bg,
            border: `1px dashed ${canEdit ? 'var(--border-color)' : 'transparent'}`,
            color: rowCat.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: canEdit ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            textAlign: 'center',
          }}
        >
          <AppIcon name={rowCat.iconName} size={13} />
          <span>
            {row.category === 'arrival' ? 'គ្រូមកដល់ / ចូលថ្នាក់' : 'ចេញទៅផ្ទះ / ប្រជុំជួរ'}
          </span>
        </button>
      );
    }

    // Lesson slot empty
    return (
      <button
        type="button"
        onClick={() => canEdit && onCellClick(row, dayKey)}
        className={canEdit ? 'schedule-cell-card' : undefined}
        style={{
          width: '100%',
          minHeight: '64px',
          padding: '0.5rem',
          borderRadius: '10px',
          background: isToday ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-secondary)',
          border: canEdit ? '1.5px dashed var(--border-color)' : '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          fontSize: '0.76rem',
          fontWeight: 600,
          cursor: canEdit ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3rem',
          opacity: canEdit ? 0.85 : 0.55,
          transition: 'all 0.16s ease',
        }}
      >
        {canEdit ? (
          <>
            <AppIcon name="plus" size={14} />
            <span>បន្ថែមខ្លឹមសារ</span>
          </>
        ) : (
          <span>{getDefaultEmptyLabel(row)}</span>
        )}
      </button>
    );
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        borderRadius: '20px',
        border: `1.5px solid ${shiftMeta.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.85rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.26rem 0.7rem',
                borderRadius: '999px',
                background: shiftMeta.bg,
                border: `1px solid ${shiftMeta.border}`,
                color: shiftMeta.color,
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              <AppIcon name={shiftMeta.iconName} size={13} />
              <span>{shiftMeta.label}</span>
              <span style={{ opacity: 0.75 }}>•</span>
              <span>{shiftMeta.timeSpan}</span>
            </span>

            {schedule.createdByName && (
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  padding: '0.22rem 0.6rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-color)',
                }}
              >
                បង្កើតដោយ៖ {schedule.createdByName}
              </span>
            )}
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: '1.28rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
            }}
          >
            {schedule.title}
          </h2>

          {schedule.description && (
            <p
              style={{
                margin: '0.3rem 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {schedule.description}
            </p>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={onEditInfoAndClasses}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.46rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="edit" size={14} />
                <span>កែព័ត៌មាន &amp; Assign ថ្នាក់</span>
              </button>

              <button
                type="button"
                onClick={onEditRows}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.46rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="sliders" size={14} />
                <span>កែជួរម៉ោង</span>
              </button>

              <button
                type="button"
                onClick={onDuplicate}
                title="ចម្លងកាលវិភាគនេះជាគំរូថ្មី"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.46rem 0.72rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="copy" size={14} />
                <span>ចម្លង</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => exportScheduleExcel(schedule, classMap)}
            title="ទាញយកជាឯកសារ Excel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.46rem 0.72rem',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="download" size={14} />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="បោះពុម្ពតារាងកាលវិភាគ"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.46rem 0.72rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="printer" size={14} />
            <span>Print</span>
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="លុបកាលវិភាគនេះ"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.46rem 0.72rem',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="trash" size={14} />
              <span>លុប</span>
            </button>
          )}
        </div>
      </div>

      {/* Assigned Classes Chips Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.65rem 0.85rem',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginRight: '0.25rem',
          }}
        >
          <AppIcon name="graduation-cap" size={15} />
          <span>ថ្នាក់រៀនដែលប្រើកាលវិភាគនេះ ({schedule.assignedClassIds.length})៖</span>
        </span>

        {assignedClasses.length === 0 && missingClassCount === 0 ? (
          <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>
            មិនទាន់ Assign ថ្នាក់រៀននៅឡើយទេ
          </span>
        ) : (
          assignedClasses.map(({ id, cls }) => {
            const cHex = CLASS_COLORS.find((co) => co.id === cls.color)?.value || '#3b82f6';
            const code = cls.classCode ? `${cls.classCode}` : '';
            const name = cls.className || '';
            const label = code && name && code !== name ? `${code} • ${name}` : name || code || id;
            return (
              <span
                key={id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.24rem 0.65rem',
                  borderRadius: '999px',
                  background: `${cHex}18`,
                  border: `1px solid ${cHex}45`,
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cHex,
                    flexShrink: 0,
                  }}
                />
                <span>{label}</span>
                {cls.teacherName && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    ({cls.teacherName})
                  </span>
                )}
              </span>
            );
          })
        )}

        {canEdit && (
          <button
            type="button"
            className="no-print"
            onClick={onEditInfoAndClasses}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.24rem 0.65rem',
              borderRadius: '999px',
              border: '1px dashed var(--accent-primary)',
              background: 'transparent',
              color: 'var(--accent-primary)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <AppIcon name="plus" size={12} />
            <span>Assign ថ្នាក់</span>
          </button>
        )}
      </div>

      {/* Mobile View Switcher + Edit Instruction */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AppIcon name={canEdit ? 'edit' : 'eye'} size={14} />
          <span>
            {canEdit
              ? 'ចុចលើប្រអប់ថ្ងៃច័ន្ទ – ថ្ងៃសុក្រ ដើម្បីបញ្ចូល ឬកែប្រែខ្លឹមសារកាលវិភាគ (អាចអនុវត្តច្រើនថ្ងៃព្រមគ្នាបាន)'
              : 'កាលវិភាគប្រចាំសប្តាហ៍ (ថ្ងៃច័ន្ទ – ថ្ងៃសុក្រ)'}
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-secondary)',
            padding: '0.2rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            gap: '0.2rem',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileDayView(false)}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: !mobileDayView ? 'var(--accent-primary)' : 'transparent',
              color: !mobileDayView ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <AppIcon name="layers" size={13} />
            <span>តារាង ច័ន្ទ–សុក្រ</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileDayView(true)}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: mobileDayView ? 'var(--accent-primary)' : 'transparent',
              color: mobileDayView ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <AppIcon name="calendar" size={13} />
            <span>មើលតាមថ្ងៃ</span>
          </button>
        </div>
      </div>

      {/* Main Timetable View: Full Monday-Friday Table OR Single-Day Mobile Cards */}
      {!mobileDayView ? (
        <div
          className="table-responsive"
          style={{
            overflowX: 'auto',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: '860px',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-secondary)',
                  borderBottom: '2px solid var(--border-color)',
                }}
              >
                <th
                  style={{
                    width: '215px',
                    padding: '0.78rem 0.85rem',
                    textAlign: 'left',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    borderRight: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}>
                    <AppIcon name="clock" size={15} />
                    <span>ម៉ោង &amp; វគ្គសិក្សា</span>
                  </span>
                </th>
                {WEEK_DAYS.map((day) => {
                  const isToday = day.jsDay === todayJsDay;
                  return (
                    <th
                      key={day.key}
                      style={{
                        padding: '0.78rem 0.6rem',
                        textAlign: 'center',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: isToday ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        borderRight: day.key !== 'fri' ? '1px solid var(--border-color)' : 'none',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                        <span>{day.label}</span>
                        {isToday && (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              padding: '0.1rem 0.42rem',
                              borderRadius: '999px',
                              background: 'var(--accent-primary)',
                              color: '#ffffff',
                              fontWeight: 800,
                            }}
                          >
                            ថ្ងៃនេះ
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {schedule.rows.map((row, rIdx) => {
                const cat = ROW_CATEGORY_META[row.category] || ROW_CATEGORY_META.lesson;
                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        rIdx < schedule.rows.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background:
                        row.category === 'break'
                          ? 'rgba(245, 158, 11, 0.03)'
                          : 'transparent',
                    }}
                  >
                    {/* Time & Slot Header Cell */}
                    <td
                      style={{
                        padding: '0.65rem 0.85rem',
                        verticalAlign: 'middle',
                        borderRight: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.18rem 0.52rem',
                              borderRadius: '7px',
                              background: cat.bg,
                              color: cat.color,
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            <AppIcon name={cat.iconName} size={12} />
                            <span>{row.timeLabel}</span>
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.35,
                          }}
                        >
                          {row.slotLabel}
                        </div>
                        {row.subtitle && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.35,
                            }}
                          >
                            {row.subtitle}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Monday to Friday Cells */}
                    {WEEK_DAYS.map((day) => {
                      const isToday = day.jsDay === todayJsDay;
                      return (
                        <td
                          key={day.key}
                          style={{
                            padding: '0.45rem',
                            verticalAlign: 'stretch',
                            borderRight: day.key !== 'fri' ? '1px solid var(--border-color)' : 'none',
                            background: isToday ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                          }}
                        >
                          {renderCellBox(row, day.key)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Day-by-Day Interactive View (Great on Mobile Phones) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.35rem' }}>
            {WEEK_DAYS.map((day) => {
              const active = selectedDayKey === day.key;
              const isToday = day.jsDay === todayJsDay;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDayKey(day.key)}
                  style={{
                    padding: '0.52rem 0.3rem',
                    borderRadius: '10px',
                    border: active
                      ? '1.5px solid var(--accent-primary)'
                      : '1px solid var(--border-color)',
                    background: active ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: active ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <span>{day.shortLabel}</span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        opacity: active ? 0.95 : 0.75,
                        fontWeight: 700,
                      }}
                    >
                      ថ្ងៃនេះ
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {schedule.rows.map((row) => {
              const cat = ROW_CATEGORY_META[row.category] || ROW_CATEGORY_META.lesson;
              return (
                <div
                  key={row.id}
                  style={{
                    padding: '0.7rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.18rem 0.52rem',
                        borderRadius: '7px',
                        background: cat.bg,
                        color: cat.color,
                        fontWeight: 800,
                        fontSize: '0.78rem',
                      }}
                    >
                      <AppIcon name={cat.iconName} size={12} />
                      <span>{row.timeLabel}</span>
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {row.slotLabel}
                    </span>
                  </div>
                  {renderCellBox(row, selectedDayKey)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
