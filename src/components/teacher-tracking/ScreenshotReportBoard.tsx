"use client";
import React from 'react';
import {
  EXAM_STAGES,
  EXAM_WEEK_KEY,
  ExamScheduleConfig,
  HOMEWORK_STATUS_LABELS,
  ScreenshotScope,
  TeacherMonthlySummary,
  TeacherWeekEntry,
  VIDEO_STATUS_LABELS,
  WEEK_META,
  WeekKey,
  evaluateWeekEntry,
  formatIsoDateKh,
  getStatusBadgePalette,
  hasExamConfigActive,
  isExamWeek,
  normalizeEntry,
} from './trackingModel';
import { TeacherAvatar } from './TrackingControls';

export default function ScreenshotReportBoard({
  isFullModal = false,
  lightMode = true,
  showDetails = true,
  scope,
  monthDisplayKh,
  activeWeeks,
  weekLabels,
  examSchedules,
  teachers,
  records,
  monthlySummaries,
}: {
  isFullModal?: boolean;
  lightMode?: boolean;
  showDetails?: boolean;
  scope: ScreenshotScope;
  monthDisplayKh: string;
  activeWeeks: { key: WeekKey; label: string; shortLabel: string }[];
  weekLabels: Partial<Record<WeekKey, string>>;
  examSchedules: Partial<Record<WeekKey, ExamScheduleConfig>>;
  teachers: any[];
  records: Record<string, Partial<Record<WeekKey, Partial<TeacherWeekEntry>>>>;
  monthlySummaries: TeacherMonthlySummary[];
}) {
  const light = lightMode;
  const cardBg = light ? '#ffffff' : '#0f172a';
  const rowAltBg = light ? '#f8fafc' : 'rgba(30, 41, 59, 0.55)';
  const borderCol = light ? '#e2e8f0' : 'rgba(148, 163, 184, 0.2)';
  const textMain = light ? '#0f172a' : '#f8fafc';
  const textSub = light ? '#64748b' : '#94a3b8';
  const headerGrad = light
    ? 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)'
    : 'linear-gradient(135deg, #115e59 0%, #1e3a8a 100%)';

  const isMonthlyScope = scope === 'monthly';
  const showExamColumn = isMonthlyScope || isExamWeek(scope);
  const currentWeekMeta = !isMonthlyScope
    ? WEEK_META.find((w) => w.key === scope)!
    : null;
  const currentWeekDateStr =
    !isMonthlyScope && weekLabels[scope] ? ` (${weekLabels[scope]})` : '';
  const currentExamCfg = !isMonthlyScope && isExamWeek(scope) ? examSchedules?.[scope] : undefined;

  // Exam schedule summary ribbon (Week 4 once-a-month exam only)
  const w4ExamCfg = examSchedules?.[EXAM_WEEK_KEY];
  const activeExamRibbons =
    showExamColumn && hasExamConfigActive(w4ExamCfg)
      ? [{ label: 'សប្តាហ៍ទី ៤', cfg: w4ExamCfg! }]
      : [];

  // Scope header KPI metrics
  let scopeCompleteCount = 0;
  let scopeTopicsTotal = 0;
  let scopeAbsenceTotal = 0;
  let scopeLateCountTotal = 0;
  let scopeLateMinTotal = 0;

  if (isMonthlyScope) {
    for (const s of monthlySummaries) {
      if (s.completionPct === 100) scopeCompleteCount += 1;
      scopeTopicsTotal += s.totalTopics;
      scopeAbsenceTotal += s.totalAbsenceDays;
      scopeLateCountTotal += s.lateCount;
      scopeLateMinTotal += s.lateMinutes;
    }
  } else {
    for (const t of teachers) {
      const e = normalizeEntry(records?.[t.id]?.[scope]);
      const ev = evaluateWeekEntry(e, currentExamCfg, scope);
      if (ev.isComplete) scopeCompleteCount += 1;
      scopeTopicsTotal += e.topicCount;
      scopeAbsenceTotal += e.permissionDays + e.absentDays;
      scopeLateCountTotal += e.lateCount;
      scopeLateMinTotal += e.lateMinutes;
    }
  }

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <div
      style={{
        background: cardBg,
        color: textMain,
        borderRadius: '18px',
        border: `1.5px solid ${borderCol}`,
        boxShadow: isFullModal
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        maxWidth: isFullModal ? '1380px' : '100%',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: headerGrad,
          color: '#ffffff',
          padding: '1.05rem 1.4rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.9rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              letterSpacing: '0.03em',
              opacity: 0.9,
              marginBottom: '0.18rem',
            }}
          >
            សាលាអន្តរជាតិប្រេនស្គម • ប្រព័ន្ធតាមដានគុណភាពបង្រៀន
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.35 }}>
            {isMonthlyScope
              ? `របាយការណ៍បូកសរុបការងារគ្រូបង្រៀន — ${monthDisplayKh}`
              : `របាយការណ៍តាមដានការងារគ្រូបង្រៀន — ${currentWeekMeta?.label}${currentWeekDateStr} • ${monthDisplayKh}`}
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.16)',
              padding: '0.32rem 0.7rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            គ្រូសរុប៖ {teachers.length} នាក់
          </div>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.28)',
              border: '1px solid rgba(167, 243, 208, 0.45)',
              padding: '0.32rem 0.7rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            គ្រប់លក្ខខណ្ឌ៖ {scopeCompleteCount}/{teachers.length}
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.16)',
              padding: '0.32rem 0.7rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            Topic សរុប៖ {scopeTopicsTotal}
          </div>
          <div
            style={{
              background:
                scopeAbsenceTotal > 0 ? 'rgba(244, 63, 94, 0.34)' : 'rgba(255,255,255,0.16)',
              padding: '0.32rem 0.7rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            អវត្តមាន៖ {scopeAbsenceTotal} ថ្ងៃ
          </div>
          <div
            style={{
              background:
                scopeLateCountTotal > 0 ? 'rgba(245, 158, 11, 0.34)' : 'rgba(255,255,255,0.16)',
              padding: '0.32rem 0.7rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            មកយឺត៖ {scopeLateCountTotal} ដង ({scopeLateMinTotal} នាទី)
          </div>
        </div>
      </div>

      {/* Optional Exam Schedule Strip when exam dates are set */}
      {activeExamRibbons.length > 0 && (
        <div
          style={{
            background: light ? '#f5f3ff' : 'rgba(109, 40, 217, 0.16)',
            borderBottom: `1px solid ${borderCol}`,
            padding: '0.52rem 1.35rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.85rem',
            alignItems: 'center',
            fontSize: '0.77rem',
            color: light ? '#5b21b6' : '#ddd6fe',
            fontWeight: 700,
          }}
        >
          <span>📝 កាលវិភាគវិញ្ញាសាប្រឡង៖</span>
          {activeExamRibbons.map((item) => (
            <span key={item.label} style={{ display: 'inline-flex', gap: '0.55rem', flexWrap: 'wrap' }}>
              {isMonthlyScope && <strong>[{item.label}]</strong>}
              <span>ប្រមូលវិញ្ញាសា៖ {formatIsoDateKh(item.cfg.collectDate)}</span>
              <span>• ថ្ងៃប្រឡង៖ {formatIsoDateKh(item.cfg.examDate)}</span>
              <span>• ចេញលទ្ធផល៖ {formatIsoDateKh(item.cfg.resultDate)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Dense, Clean All-Teachers Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
          <thead>
            <tr
              style={{
                background: light ? '#f1f5f9' : '#1e293b',
                borderBottom: `2px solid ${borderCol}`,
                color: light ? '#334155' : '#cbd5e1',
              }}
            >
              <th style={{ padding: '0.6rem 0.45rem', textAlign: 'center', width: '36px' }}>ល.រ</th>
              <th style={{ padding: '0.6rem 0.65rem', textAlign: 'left' }}>គ្រូបង្រៀន</th>
              {isMonthlyScope && (
                <th style={{ padding: '0.6rem 0.45rem', textAlign: 'center' }}>សប្តាហ៍</th>
              )}
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>រៀន Topic</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>កិច្ចការផ្ទះ</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>ថតវីដេអូ</th>
              {showExamColumn && (
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                  {isMonthlyScope ? 'វិញ្ញាសា (S4)' : 'វិញ្ញាសាប្រឡង'}
                </th>
              )}
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Task ពិសេស</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>អវត្តមាន</th>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>មកយឺត</th>
              <th style={{ padding: '0.6rem 0.65rem', textAlign: 'center' }}>លទ្ធផល</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td
                  colSpan={isMonthlyScope ? 11 : showExamColumn ? 10 : 9}
                  style={{ padding: '2rem', textAlign: 'center', color: textSub }}
                >
                  មិនមានទិន្នន័យគ្រូបង្រៀនទេ
                </td>
              </tr>
            ) : isMonthlyScope ? (
              monthlySummaries.map((s, idx) => {
                const pct = s.completionPct;
                const statusBg =
                  pct === 100
                    ? 'rgba(16, 185, 129, 0.15)'
                    : pct >= 70
                      ? 'rgba(245, 158, 11, 0.16)'
                      : 'rgba(239, 68, 68, 0.15)';
                const statusColor =
                  pct === 100 ? '#059669' : pct >= 70 ? '#d97706' : '#dc2626';

                return (
                  <tr
                    key={s.teacher.id}
                    style={{
                      background: idx % 2 === 1 ? rowAltBg : 'transparent',
                      borderBottom: `1px solid ${borderCol}`,
                    }}
                  >
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center', fontWeight: 700, color: textSub }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.52rem 0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <TeacherAvatar teacher={s.teacher} size={30} forceLight={light} />
                        <div>
                          <div style={{ fontWeight: 700, color: textMain, lineHeight: 1.25 }}>
                            {s.teacher.fullName}
                          </div>
                          {s.teacher.subject && (
                            <div style={{ fontSize: '0.7rem', color: textSub }}>{s.teacher.subject}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
                        {activeWeeks.map((w) => {
                          const done = s.perWeek[w.key]?.complete;
                          return (
                            <span
                              key={w.key}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '20px',
                                borderRadius: '5px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                background: done
                                  ? 'rgba(16, 185, 129, 0.16)'
                                  : 'rgba(239, 68, 68, 0.12)',
                                color: done ? '#059669' : '#dc2626',
                              }}
                            >
                              {w.shortLabel}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.18rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          background:
                            s.topicWeeksDone >= s.weeksCount
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color: s.topicWeeksDone >= s.weeksCount ? '#059669' : '#d97706',
                        }}
                      >
                        {s.totalTopics} ({s.topicWeeksDone}/{s.weeksCount})
                      </span>
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center', fontWeight: 700 }}>
                      <div style={{ color: s.homeworkFullWeeks >= s.weeksCount ? '#059669' : '#d97706' }}>
                        {s.totalHomeworkCount} ដង
                      </div>
                      <div style={{ fontSize: '0.68rem', color: textSub }}>
                        {s.homeworkFullWeeks}ពេញ{s.homeworkPartialWeeks > 0 ? ` • ${s.homeworkPartialWeeks}តិចតួច` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center', fontWeight: 700 }}>
                      <div style={{ color: s.videoFullWeeks >= s.weeksCount ? '#059669' : '#d97706' }}>
                        {s.totalVideoCount} វីដេអូ
                      </div>
                      <div style={{ fontSize: '0.68rem', color: textSub }}>
                        {s.videoFullWeeks}ពេញ{s.videoPartialWeeks > 0 ? ` • ${s.videoPartialWeeks}តិចតួច` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {s.examActiveWeeks === 0 ? (
                        <span style={{ color: textSub, fontSize: '0.74rem' }}>—</span>
                      ) : (
                        <span
                          style={{
                            padding: '0.18rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.73rem',
                            background:
                              s.examTotalStagesDone >= s.examTotalStagesTarget
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(139, 92, 246, 0.15)',
                            color:
                              s.examTotalStagesDone >= s.examTotalStagesTarget
                                ? '#059669'
                                : '#7c3aed',
                          }}
                        >
                          {s.examTotalStagesDone}/{s.examTotalStagesTarget} ដំណាក់កាល
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {s.assignedTaskWeeks === 0 ? (
                        <span style={{ color: textSub, fontSize: '0.74rem' }}>—</span>
                      ) : (
                        <span
                          style={{
                            padding: '0.18rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.73rem',
                            background:
                              s.completedTaskWeeks >= s.assignedTaskWeeks
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(2, 132, 199, 0.14)',
                            color:
                              s.completedTaskWeeks >= s.assignedTaskWeeks ? '#059669' : '#0284c7',
                          }}
                        >
                          {s.totalTaskCount} ({s.completedTaskWeeks}/{s.assignedTaskWeeks})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {s.totalAbsenceDays === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.74rem' }}>0</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {s.permissionDays > 0 && (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#d97706',
                                padding: '0.14rem 0.4rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              ច្បាប់:{s.permissionDays}
                            </span>
                          )}
                          {s.absentDays > 0 && (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#dc2626',
                                padding: '0.14rem 0.4rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              ឥតច្បាប់:{s.absentDays}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {s.lateCount === 0 && s.lateMinutes === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.74rem' }}>0</span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(249, 115, 22, 0.14)',
                            color: '#ea580c',
                            padding: '0.16rem 0.45rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.73rem',
                          }}
                        >
                          {s.lateCount}ដង • {s.lateMinutes}ន
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.52rem 0.65rem', textAlign: 'center' }}>
                      <span
                        style={{
                          background: statusBg,
                          color: statusColor,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pct}% {pct === 100 ? '✓ ល្អប្រសើរ' : pct >= 70 ? 'ល្អបង្គួរ' : 'ត្រូវពង្រឹង'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              teachers.map((teacher, idx) => {
                const e = normalizeEntry(records?.[teacher.id]?.[scope]);
                const ev = evaluateWeekEntry(e, currentExamCfg, scope);
                const hwPal = getStatusBadgePalette(e.homeworkStatus);
                const vPal = getStatusBadgePalette(e.videoStatus);

                return (
                  <tr
                    key={teacher.id}
                    style={{
                      background: idx % 2 === 1 ? rowAltBg : 'transparent',
                      borderBottom: `1px solid ${borderCol}`,
                    }}
                  >
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center', fontWeight: 700, color: textSub }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.52rem 0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <TeacherAvatar teacher={teacher} size={30} forceLight={light} />
                        <div>
                          <div style={{ fontWeight: 700, color: textMain, lineHeight: 1.25 }}>
                            {teacher.fullName}
                          </div>
                          {teacher.subject && (
                            <div style={{ fontSize: '0.7rem', color: textSub }}>{teacher.subject}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Topic */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {e.topicDone && e.topicCount >= 1 ? (
                        <div>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#059669',
                              padding: '0.18rem 0.5rem',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '0.73rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✓ បានរៀន ({e.topicCount})
                          </span>
                          {showDetails && e.topicTitle && (
                            <div
                              style={{
                                fontSize: '0.69rem',
                                color: textSub,
                                marginTop: '2px',
                                maxWidth: '140px',
                                marginInline: 'auto',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.topicTitle}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.13)',
                            color: '#dc2626',
                            padding: '0.18rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.73rem',
                          }}
                        >
                          ✕ មិនទាន់
                        </span>
                      )}
                    </td>

                    {/* Homework */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      <span
                        style={{
                          background: hwPal.bg,
                          color: hwPal.color,
                          padding: '0.18rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.73rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hwPal.icon} {HOMEWORK_STATUS_LABELS[e.homeworkStatus]}
                        {e.homeworkCount > 0 ? ` (${e.homeworkCount})` : ''}
                      </span>
                      {showDetails && e.homeworkNote && (
                        <div
                          style={{
                            fontSize: '0.69rem',
                            color: textSub,
                            marginTop: '2px',
                            maxWidth: '130px',
                            marginInline: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.homeworkNote}
                        </div>
                      )}
                    </td>

                    {/* Video */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      <span
                        style={{
                          background: vPal.bg,
                          color: vPal.color,
                          padding: '0.18rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.73rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {vPal.icon} {VIDEO_STATUS_LABELS[e.videoStatus]}
                        {e.videoCount > 0 ? ` (${e.videoCount})` : ''}
                      </span>
                      {showDetails && e.videoNote && (
                        <div
                          style={{
                            fontSize: '0.69rem',
                            color: textSub,
                            marginTop: '2px',
                            maxWidth: '130px',
                            marginInline: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.videoNote}
                        </div>
                      )}
                    </td>

                    {/* Exam Papers (3 stages - Week 4 only) */}
                    {showExamColumn && (
                      <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                        {!ev.examActive ? (
                          <span style={{ color: textSub, fontSize: '0.74rem' }}>—</span>
                        ) : (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '3px' }}>
                              {EXAM_STAGES.map((st) => {
                                const ok = Boolean(e[st.key]);
                                return (
                                  <span
                                    key={st.key}
                                    style={{
                                      padding: '0.12rem 0.36rem',
                                      borderRadius: '5px',
                                      fontSize: '0.67rem',
                                      fontWeight: 700,
                                      background: ok
                                        ? 'rgba(16, 185, 129, 0.16)'
                                        : 'rgba(148, 163, 184, 0.16)',
                                      color: ok ? '#059669' : textSub,
                                    }}
                                  >
                                    {ok ? '✓' : st.step} {st.shortLabel}
                                  </span>
                                );
                              })}
                            </div>
                            {showDetails && e.examNote && (
                              <div style={{ fontSize: '0.68rem', color: textSub }}>{e.examNote}</div>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Special Task */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {!ev.taskAssigned ? (
                        <span style={{ color: textSub, fontSize: '0.74rem' }}>—</span>
                      ) : (
                        <div>
                          <span
                            style={{
                              padding: '0.18rem 0.5rem',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '0.73rem',
                              background: e.taskDone
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(2, 132, 199, 0.14)',
                              color: e.taskDone ? '#059669' : '#0284c7',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {e.taskDone ? '✓ រួចរាល់' : '⏳ កំពុងធ្វើ'}
                            {e.taskCount > 0 ? ` (${e.taskCount})` : ''}
                          </span>
                          {showDetails && e.taskDescription && (
                            <div
                              style={{
                                fontSize: '0.69rem',
                                color: textSub,
                                marginTop: '2px',
                                maxWidth: '140px',
                                marginInline: 'auto',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.taskDescription}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Absences */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {e.permissionDays === 0 && e.absentDays === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.74rem' }}>0</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {e.permissionDays > 0 && (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#d97706',
                                padding: '0.14rem 0.4rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              ច្បាប់:{e.permissionDays}
                            </span>
                          )}
                          {e.absentDays > 0 && (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#dc2626',
                                padding: '0.14rem 0.4rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              ឥតច្បាប់:{e.absentDays}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Late */}
                    <td style={{ padding: '0.52rem 0.45rem', textAlign: 'center' }}>
                      {e.lateCount === 0 && e.lateMinutes === 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.74rem' }}>0</span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(249, 115, 22, 0.14)',
                            color: '#ea580c',
                            padding: '0.16rem 0.45rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.73rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.lateCount}ដង • {e.lateMinutes}ន
                        </span>
                      )}
                    </td>

                    {/* Overall Result */}
                    <td style={{ padding: '0.52rem 0.65rem', textAlign: 'center' }}>
                      <span
                        style={{
                          background: ev.isComplete
                            ? 'rgba(16, 185, 129, 0.16)'
                            : 'rgba(245, 158, 11, 0.16)',
                          color: ev.isComplete ? '#059669' : '#d97706',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.73rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.isComplete
                          ? '🌟 គ្រប់លក្ខខណ្ឌ'
                          : `⚠️ ខ្វះ ${ev.missingLabels.length}`}
                      </span>
                      {showDetails && e.note && (
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: textSub,
                            marginTop: '2px',
                            maxWidth: '130px',
                            marginInline: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.note}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          background: light ? '#f8fafc' : '#0b1120',
          borderTop: `1px solid ${borderCol}`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.72rem',
          color: textSub,
        }}
      >
        <span>
          គោលការណ៍៖ រៀន ≥១ Topic • កិច្ចការផ្ទះ • វីដេអូ Topic
          {showExamColumn ? ' • វិញ្ញាសាប្រឡង (ប្រគល់→ពិន្ទុ→លទ្ធផល)' : ''} • Task ពិសេស
        </span>
        <span style={{ fontWeight: 600 }}>កាលបរិច្ឆេទបូកសរុប៖ {todayStr}</span>
      </div>
    </div>
  );
}
