"use client";
import React from 'react';
import { AppIcon, AppIconName } from '@/components/AppIcons';
import {
  DEFAULT_EXAM_ISSUER_NAME,
  DEFAULT_EXAM_NOTICE_NOTE,
  ExamScheduleConfig,
  formatKhmerDateWithWeekday,
} from './trackingModel';

export type ExamNoticeStyleVariant = 'official' | 'modern';

interface MilestoneDef {
  key: 'prepareDate' | 'collectDate' | 'examDate' | 'resultDate';
  khNum: string;
  label: string;
  sublabel: string;
  icon: AppIconName;
  color: string;
  softBg: string;
  iso?: string;
}

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCountdownBadge(daysDiff: number | null): {
  text: string;
  bg: string;
  color: string;
  border: string;
} | null {
  if (daysDiff === null) return null;
  if (daysDiff === 0) {
    return {
      text: 'ថ្ងៃនេះ',
      bg: 'rgba(239, 68, 68, 0.14)',
      color: '#dc2626',
      border: 'rgba(239, 68, 68, 0.35)',
    };
  }
  if (daysDiff > 0 && daysDiff <= 3) {
    return {
      text: `នៅសល់ ${daysDiff} ថ្ងៃ`,
      bg: 'rgba(245, 158, 11, 0.16)',
      color: '#b45309',
      border: 'rgba(245, 158, 11, 0.4)',
    };
  }
  if (daysDiff > 3) {
    return {
      text: `នៅសល់ ${daysDiff} ថ្ងៃ`,
      bg: 'rgba(16, 185, 129, 0.13)',
      color: '#047857',
      border: 'rgba(16, 185, 129, 0.32)',
    };
  }
  return {
    text: `កន្លងផុត ${Math.abs(daysDiff)} ថ្ងៃ`,
    bg: 'rgba(100, 116, 139, 0.12)',
    color: '#64748b',
    border: 'rgba(100, 116, 139, 0.25)',
  };
}

export default function ExamNoticeLetterCard({
  id,
  schoolName,
  monthDisplayKh,
  config,
  styleVariant = 'official',
  compact = false,
  showCountdowns = false,
}: {
  id?: string;
  schoolName: string;
  monthDisplayKh: string;
  config: ExamScheduleConfig;
  styleVariant?: ExamNoticeStyleVariant;
  compact?: boolean;
  showCountdowns?: boolean;
}) {
  const safeSchool = (schoolName || '').trim() || 'សាលាអន្តរជាតិប្រេនស្តម';
  const titleText =
    config.noticeTitle?.trim() ||
    `ស្តីពីកាលបរិច្ឆេទធ្វើវិញ្ញាសា ប្រមូលវិញ្ញាសា ប្រឡង និងចេញលទ្ធផល ប្រចាំ${monthDisplayKh}`;
  const noteText = config.noticeNote?.trim() || DEFAULT_EXAM_NOTICE_NOTE;
  const issuerText = config.issuerName?.trim() || DEFAULT_EXAM_ISSUER_NAME;
  const todayFormatted = formatKhmerDateWithWeekday(getLocalTodayIso());

  const allMilestones: MilestoneDef[] = [
    {
      key: 'prepareDate',
      khNum: '១',
      label: 'កាលបរិច្ឆេទធ្វើវិញ្ញាសា',
      sublabel: 'រៀបចំ និងពិនិត្យខ្លឹមសារវិញ្ញាសាប្រឡង',
      icon: 'edit',
      color: '#0284c7',
      softBg: 'rgba(2, 132, 199, 0.1)',
      iso: config.prepareDate,
    },
    {
      key: 'collectDate',
      khNum: '២',
      label: 'កាលបរិច្ឆេទប្រមូលវិញ្ញាសាប្រឡង',
      sublabel: 'ប្រគល់វិញ្ញាសាជូនការិយាល័យសិក្សា',
      icon: 'clipboard-check',
      color: '#7c3aed',
      softBg: 'rgba(124, 58, 237, 0.1)',
      iso: config.collectDate,
    },
    {
      key: 'examDate',
      khNum: '៣',
      label: 'កាលបរិច្ឆេទប្រឡង',
      sublabel: 'ដំណើរការប្រឡងប្រចាំខែតាមថ្នាក់រៀន',
      icon: 'file-text',
      color: '#d97706',
      softBg: 'rgba(217, 119, 6, 0.1)',
      iso: config.examDate,
    },
    {
      key: 'resultDate',
      khNum: '៤',
      label: 'កាលបរិច្ឆេទចេញលទ្ធផល',
      sublabel: 'បញ្ចូលពិន្ទុ និងប្រកាសលទ្ធផលជូនសិស្ស',
      icon: 'award',
      color: '#059669',
      softBg: 'rgba(5, 150, 105, 0.1)',
      iso: config.resultDate,
    },
  ];

  const filledMilestones = allMilestones.filter((m) => Boolean(m.iso?.trim()));
  const displayMilestones = filledMilestones.length > 0 ? filledMilestones : allMilestones;

  const isOfficial = styleVariant === 'official';
  const logoSize = compact ? 44 : 56;
  const padOuter = compact ? '0.9rem' : '1.45rem';

  return (
    <div
      id={id}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: compact ? '14px' : '18px',
        overflow: 'hidden',
        border: isOfficial ? '2px solid #1e3a8a' : '1.5px solid #cbd5e1',
        boxShadow: compact
          ? '0 8px 22px rgba(15, 23, 42, 0.08)'
          : '0 20px 45px rgba(15, 23, 42, 0.14)',
        fontFamily: "'Kantumruy Pro', 'Battambang', 'Inter', sans-serif",
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: isOfficial ? '6px' : '5px',
          background: isOfficial
            ? 'linear-gradient(90deg, #1e3a8a 0%, #b45309 50%, #1e3a8a 100%)'
            : 'linear-gradient(90deg, #0d9488 0%, #2563eb 50%, #7c3aed 100%)',
        }}
      />

      {isOfficial ? (
        <div
          style={{
            margin: compact ? '6px' : '10px',
            border: '1px solid #d4af37',
            borderRadius: compact ? '10px' : '12px',
            padding: padOuter,
            background: '#ffffff',
          }}
        >
          {/* National Motto Header */}
          <div style={{ textAlign: 'center', marginBottom: compact ? '0.55rem' : '0.85rem' }}>
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: compact ? '0.88rem' : '1.02rem',
                color: '#1e3a8a',
                lineHeight: 1.5,
              }}
            >
              ព្រះរាជាណាចក្រកម្ពុជា
            </div>
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: compact ? '0.78rem' : '0.88rem',
                color: '#1e3a8a',
                lineHeight: 1.5,
              }}
            >
              ជាតិ សាសនា ព្រះមហាក្សត្រ
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.2rem' }}>
              <svg width="160" height="14" viewBox="0 0 160 14" fill="none">
                <line x1="6" y1="7" x2="62" y2="7" stroke="#b45309" strokeWidth="1.2" />
                <polygon points="80,2 86,7 80,12 74,7" fill="#b45309" />
                <circle cx="68" cy="7" r="2" fill="#1e3a8a" />
                <circle cx="92" cy="7" r="2" fill="#1e3a8a" />
                <line x1="98" y1="7" x2="154" y2="7" stroke="#b45309" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* School Identity Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              paddingBottom: compact ? '0.6rem' : '0.85rem',
              marginBottom: compact ? '0.65rem' : '0.9rem',
              borderBottom: '1.5px solid #e2e8f0',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src="/logo.png"
                alt={safeSchool}
                style={{
                  width: logoSize,
                  height: logoSize,
                  objectFit: 'contain',
                  borderRadius: '10px',
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: compact ? '0.95rem' : '1.08rem',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    lineHeight: 1.3,
                  }}
                >
                  {safeSchool}
                </div>
                <div style={{ fontSize: compact ? '0.72rem' : '0.78rem', color: '#475569', fontWeight: 600 }}>
                  ការិយាល័យសិក្សា និងគ្រប់គ្រងគុណភាពអប់រំ
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '0.28rem 0.7rem',
                borderRadius: '999px',
                background: 'rgba(30, 58, 138, 0.08)',
                border: '1px solid rgba(30, 58, 138, 0.22)',
                color: '#1e3a8a',
                fontSize: compact ? '0.72rem' : '0.77rem',
                fontWeight: 700,
              }}
            >
              {monthDisplayKh}
            </div>
          </div>

          {/* Title Banner */}
          <div style={{ textAlign: 'center', marginBottom: compact ? '0.7rem' : '1rem' }}>
            <div
              style={{
                fontFamily: "'Moul', 'Kantumruy Pro', serif",
                fontSize: compact ? '1.05rem' : '1.22rem',
                color: '#92400e',
                marginBottom: '0.32rem',
              }}
            >
              សេចក្តីជូនដំណឹង
            </div>
            <div
              style={{
                fontSize: compact ? '0.84rem' : '0.95rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.5,
                maxWidth: '580px',
                margin: '0 auto',
              }}
            >
              {titleText}
            </div>
          </div>

          {/* Formal Addressing & Body */}
          <div
            style={{
              fontSize: compact ? '0.8rem' : '0.88rem',
              color: '#1e293b',
              lineHeight: 1.65,
              marginBottom: compact ? '0.65rem' : '0.95rem',
            }}
          >
            <div>
              <strong>គោរពជម្រាបជូន៖</strong> លោកគ្រូ អ្នកគ្រូបង្រៀនទាំងអស់នៃ <strong>{safeSchool}</strong>
            </div>
            <div style={{ marginTop: '0.2rem', color: '#334155' }}>
              សូមលោកគ្រូ អ្នកគ្រូមេត្តាជ្រាបអំពីកាលវិភាគដំណើរការវិញ្ញាសាប្រឡងប្រចាំ{monthDisplayKh} តាមកាលបរិច្ឆេទដូចខាងក្រោម៖
            </div>
          </div>

          {/* Structured Milestone Schedule */}
          <MilestoneList
            milestones={displayMilestones}
            compact={compact}
            showCountdowns={showCountdowns}
          />

          {/* Reminder Callout Box */}
          <div
            style={{
              marginTop: compact ? '0.7rem' : '1rem',
              padding: compact ? '0.6rem 0.78rem' : '0.8rem 0.95rem',
              borderRadius: '11px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderLeft: '4px solid #d97706',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AppIcon
              name="pin"
              size={compact ? 15 : 17}
              style={{ color: '#b45309', marginTop: '2px', flexShrink: 0 }}
            />
            <div style={{ fontSize: compact ? '0.77rem' : '0.83rem', color: '#78350f', lineHeight: 1.58, fontWeight: 600 }}>
              {noteText}
            </div>
          </div>

          {/* Official Footer & Signature */}
          <div
            style={{
              marginTop: compact ? '0.85rem' : '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45 }}>
              <div>សូមគោរពអរគុណចំពោះកិច្ចសហការ!</div>
              <div style={{ fontWeight: 600 }}>{safeSchool}</div>
            </div>

            <div style={{ textAlign: 'center', minWidth: compact ? '190px' : '225px' }}>
              <div style={{ fontSize: compact ? '0.74rem' : '0.8rem', color: '#334155', marginBottom: '0.2rem' }}>
                {todayFormatted.fullKh}
              </div>
              <div
                style={{
                  fontSize: compact ? '0.85rem' : '0.94rem',
                  fontWeight: 800,
                  color: '#1e3a8a',
                }}
              >
                {issuerText}
              </div>
              <div style={{ fontSize: compact ? '0.72rem' : '0.77rem', color: '#475569', fontWeight: 700, marginTop: '0.1rem' }}>
                {safeSchool}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modern Gradient Header Style (for clean Telegram/Messenger post cards) */
        <div>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)',
              color: '#ffffff',
              padding: compact ? '0.95rem 1rem' : '1.25rem 1.45rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/logo.png"
                    alt={safeSchool}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
                    {safeSchool} • {issuerText}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Moul', 'Kantumruy Pro', serif",
                      fontSize: compact ? '1rem' : '1.18rem',
                      marginTop: '0.12rem',
                      lineHeight: 1.4,
                    }}
                  >
                    សេចក្តីជូនដំណឹងប្រឡង
                  </div>
                </div>
              </div>

              <span
                style={{
                  padding: '0.32rem 0.78rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.32)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {monthDisplayKh}
              </span>
            </div>

            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.7rem',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                fontSize: compact ? '0.82rem' : '0.9rem',
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {titleText}
            </div>
          </div>

          <div style={{ padding: padOuter, background: '#ffffff' }}>
            <div style={{ fontSize: compact ? '0.79rem' : '0.86rem', color: '#334155', marginBottom: '0.75rem', lineHeight: 1.55 }}>
              <strong>គោរពជម្រាបជូនលោកគ្រូ អ្នកគ្រូបង្រៀនទាំងអស់៖</strong> សូមពិនិត្យកាលបរិច្ឆេទសំខាន់ៗសម្រាប់ដំណើរការប្រឡងប្រចាំ{monthDisplayKh} ដូចខាងក្រោម៖
            </div>

            <MilestoneList
              milestones={displayMilestones}
              compact={compact}
              showCountdowns={showCountdowns}
            />

            <div
              style={{
                marginTop: compact ? '0.7rem' : '1rem',
                padding: compact ? '0.6rem 0.78rem' : '0.8rem 0.95rem',
                borderRadius: '11px',
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                borderLeft: '4px solid #0d9488',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <AppIcon
                name="pin"
                size={compact ? 15 : 17}
                style={{ color: '#0f766e', marginTop: '2px', flexShrink: 0 }}
              />
              <div style={{ fontSize: compact ? '0.77rem' : '0.83rem', color: '#115e59', lineHeight: 1.58, fontWeight: 600 }}>
                {noteText}
              </div>
            </div>

            <div
              style={{
                marginTop: '0.95rem',
                paddingTop: '0.65rem',
                borderTop: '1px dashed #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#475569',
              }}
            >
              <span>ចេញផ្សាយ៖ {todayFormatted.fullKh}</span>
              <strong style={{ color: '#0f172a' }}>{issuerText} • {safeSchool}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneList({
  milestones,
  compact,
  showCountdowns,
}: {
  milestones: MilestoneDef[];
  compact: boolean;
  showCountdowns: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.45rem' : '0.62rem' }}>
      {milestones.map((item, idx) => {
        const hasDate = Boolean(item.iso?.trim());
        const fmt = formatKhmerDateWithWeekday(item.iso);
        const countdown = showCountdowns ? getCountdownBadge(fmt.daysDiff) : null;

        return (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.55rem',
              padding: compact ? '0.55rem 0.72rem' : '0.72rem 0.92rem',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${item.color}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.62rem', minWidth: '185px', flex: 1 }}>
              <div
                style={{
                  width: compact ? '32px' : '36px',
                  height: compact ? '32px' : '36px',
                  borderRadius: '10px',
                  background: item.softBg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: compact ? '0.88rem' : '0.98rem',
                  flexShrink: 0,
                  border: `1px solid ${item.color}33`,
                }}
              >
                {['១', '២', '៣', '៤'][idx] || item.khNum}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: compact ? '0.82rem' : '0.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <AppIcon name={item.icon} size={14} style={{ color: item.color }} />
                  <span>{item.label}</span>
                </div>
                <div style={{ fontSize: compact ? '0.7rem' : '0.74rem', color: '#64748b', marginTop: '0.08rem' }}>
                  {item.sublabel}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
              <div
                style={{
                  fontSize: compact ? '0.82rem' : '0.9rem',
                  fontWeight: 800,
                  color: hasDate ? item.color : '#94a3b8',
                }}
              >
                {hasDate ? fmt.fullKh : 'មិនទាន់កំណត់'}
              </div>
              {hasDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.08rem 0.48rem',
                      borderRadius: '999px',
                      background: item.softBg,
                      color: item.color,
                    }}
                  >
                    {fmt.dmy}
                  </span>
                  {countdown && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.08rem 0.45rem',
                        borderRadius: '999px',
                        background: countdown.bg,
                        color: countdown.color,
                        border: `1px solid ${countdown.border}`,
                      }}
                    >
                      {countdown.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
