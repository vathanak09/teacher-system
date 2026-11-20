"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from '@/components/AppIcons';
import ExamNoticeLetterCard from '@/components/teacher-tracking/ExamNoticeLetterCard';
import {
  ActiveExamNotice,
  EXAM_STAGES,
  TeacherWeekEntry,
} from '@/components/teacher-tracking/trackingModel';

interface ExamNoticePopupModalProps {
  isOpen: boolean;
  notice: ActiveExamNotice | null;
  schoolName: string;
  teacherExamEntry?: TeacherWeekEntry | null;
  isAdminPreview?: boolean;
  onDismissTemporary: () => void;
  onAcknowledge: () => void;
}

export default function ExamNoticePopupModal({
  isOpen,
  notice,
  schoolName,
  teacherExamEntry,
  isAdminPreview = false,
  onDismissTemporary,
  onAcknowledge,
}: ExamNoticePopupModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismissTemporary();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onDismissTemporary]);

  if (!mounted || !isOpen || !notice) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10055,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.85rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismissTemporary();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '660px',
          maxHeight: '92dvh',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 26px 64px rgba(0, 0, 0, 0.34)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.08))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="bell" size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  សេចក្តីជូនដំណឹងកាលបរិច្ឆេទប្រឡង
                </h2>
                <span
                  style={{
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.5rem',
                    borderRadius: '999px',
                    background: 'rgba(124, 58, 237, 0.14)',
                    color: '#7c3aed',
                  }}
                >
                  {notice.monthDisplayKh}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissTemporary}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="បិទ"
          >
            <AppIcon name="x" size={17} />
          </button>
        </div>

        {/* Scrollable Notice Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <ExamNoticeLetterCard
            schoolName={schoolName}
            monthDisplayKh={notice.monthDisplayKh}
            config={notice.config}
            styleVariant="official"
            compact={true}
            showCountdowns={true}
          />

          {teacherExamEntry && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'var(--main-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                វឌ្ឍនភាពវិញ្ញាសារបស់អ្នក៖
              </span>
              {EXAM_STAGES.map((st) => {
                const done = Boolean(teacherExamEntry[st.key]);
                return (
                  <span
                    key={st.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.28rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      background: done ? 'rgba(16, 185, 129, 0.14)' : 'var(--card-bg)',
                      border: `1px solid ${done ? '#10b981' : 'var(--border-color)'}`,
                      color: done ? '#059669' : 'var(--text-secondary)',
                    }}
                  >
                    <AppIcon name={done ? 'check-circle' : 'clock'} size={12} />
                    <span>{st.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div
          style={{
            padding: '0.78rem 1.15rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--modal-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.55rem',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {isAdminPreview ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDismissTemporary}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}
            >
              <AppIcon name="check" size={16} />
              បិទផ្ទាំងគំរូ
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn"
                onClick={onDismissTemporary}
                style={{
                  background: 'var(--main-bg)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                រំលឹកពេលក្រោយ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAcknowledge}
                style={{
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                }}
              >
                <AppIcon name="check-circle" size={16} />
                ខ្ញុំបានទទួលជ្រាប (យល់ព្រម)
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
