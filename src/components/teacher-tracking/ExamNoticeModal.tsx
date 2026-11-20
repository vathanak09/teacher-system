"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CustomDatePicker from '@/components/CustomDatePicker';
import { AppIcon } from '@/components/AppIcons';
import ExamNoticeLetterCard, { ExamNoticeStyleVariant } from './ExamNoticeLetterCard';
import {
  DEFAULT_EXAM_NOTICE_NOTE,
  ExamScheduleConfig,
  buildExamNoticeGroupChatText,
  formatKhmerDateWithWeekday,
  getAutoExamPrepareDate,
  hasAnyExamScheduleDate,
} from './trackingModel';

interface ExamNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  monthDisplayKh: string;
  schoolName: string;
  adminName: string;
  config: ExamScheduleConfig;
  onChangeConfig: (next: ExamScheduleConfig) => void;
}

export default function ExamNoticeModal({
  isOpen,
  onClose,
  monthKey,
  monthDisplayKh,
  schoolName,
  adminName,
  config,
  onChangeConfig,
}: ExamNoticeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreenShotMode, setFullscreenShotMode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [notifyToast, setNotifyToast] = useState(false);

  const styleVariant: ExamNoticeStyleVariant =
    config?.popupStyle === 'modern' ? 'modern' : 'official';
  const autoPrepareFmt = formatKhmerDateWithWeekday(getAutoExamPrepareDate(monthKey));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFullscreenShotMode(false);
    setNotifyToast(false);
    setCopiedText(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenShotMode) setFullscreenShotMode(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, fullscreenShotMode, onClose]);

  if (!mounted || !isOpen) return null;

  const updateField = (patch: Partial<ExamScheduleConfig>) => {
    const resolvedIssuer =
      patch.issuerName !== undefined
        ? patch.issuerName
        : config.issuerName !== undefined
          ? config.issuerName
          : adminName;

    const updated: ExamScheduleConfig = {
      ...config,
      ...patch,
      issuerName: resolvedIssuer,
      noticeUpdatedAt: Date.now(),
    };
    const anyDate = hasAnyExamScheduleDate(updated);
    onChangeConfig({
      ...updated,
      enabled: anyDate ? true : updated.enabled,
      popupEnabled: updated.popupEnabled !== false,
    });
  };

  const handleStyleChange = (nextStyle: ExamNoticeStyleVariant) => {
    updateField({ popupStyle: nextStyle });
  };

  const handleCopyGroupChat = async () => {
    const text = buildExamNoticeGroupChatText({
      schoolName,
      monthKey,
      monthDisplayKh,
      config,
      adminName,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2400);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-exam-notice');
    const cleanup = () => document.body.classList.remove('printing-exam-notice');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1500);
    }, 60);
  };

  const handleSendReNotify = () => {
    onChangeConfig({
      ...config,
      issuerName: config.issuerName?.trim() ? config.issuerName : adminName,
      enabled: true,
      popupEnabled: true,
      popupStyle: styleVariant,
      noticeUpdatedAt: Date.now(),
    });
    setNotifyToast(true);
    setTimeout(() => setNotifyToast(false), 3200);
  };

  return createPortal(
    <div
      id="exam-notice-print-portal-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: fullscreenShotMode ? '#e2e8f0' : 'rgba(15, 23, 42, 0.72)',
        backdropFilter: fullscreenShotMode ? 'none' : 'blur(6px)',
        WebkitBackdropFilter: fullscreenShotMode ? 'none' : 'blur(6px)',
        overflowY: 'auto',
        padding: fullscreenShotMode ? '1.25rem 0.75rem' : '0 0.75rem 2rem',
      }}
    >
      {/* Top Sticky Action Toolbar */}
      {!fullscreenShotMode ? (
        <div
          className="no-print"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            maxWidth: '1160px',
            margin: '0 auto 1rem',
            padding: '0.72rem 1rem',
            borderRadius: '0 0 16px 16px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.28)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.92rem' }}>
              <AppIcon name="bell" size={17} style={{ color: '#a78bfa' }} />
              <span>លិខិតជូនដំណឹងប្រឡង ({monthDisplayKh})</span>
            </span>

            <div style={{ display: 'inline-flex', gap: '0.28rem', marginLeft: '0.25rem' }}>
              {[
                { key: 'official' as const, label: 'លិខិតផ្លូវការ' },
                { key: 'modern' as const, label: 'កាតទំនើប' },
              ].map((st) => {
                const active = styleVariant === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => handleStyleChange(st.key)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: active ? '#7c3aed' : 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFullscreenShotMode(true)}
              style={{
                padding: '0.38rem 0.78rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0d9488, #0284c7)',
                color: '#ffffff',
                fontSize: '0.77rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="បង្ហាញតែលិខិតពេញអេក្រង់ស្អាត ១០០% ដើម្បីថតអេក្រង់ (Screenshot) ចូល Group Chat"
            >
              <AppIcon name="camera" size={14} />
              <span>របៀប Screenshot ពេញអេក្រង់</span>
            </button>

            <button
              type="button"
              onClick={handleCopyGroupChat}
              style={{
                padding: '0.38rem 0.72rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: copiedText ? '#10b981' : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name={copiedText ? 'check' : 'copy'} size={13} />
              <span>{copiedText ? 'បានចម្លង!' : 'ចម្លងអត្ថបទ Group Chat'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '0.38rem 0.72rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.32rem',
              }}
            >
              <AppIcon name="printer" size={13} />
              <span>បោះពុម្ព / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.38rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.77rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.28rem',
              }}
            >
              <AppIcon name="x" size={14} strokeWidth={2.5} />
              <span>បិទ</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="no-print"
          onClick={() => setFullscreenShotMode(false)}
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 20,
            padding: '0.42rem 0.85rem',
            borderRadius: '999px',
            border: 'none',
            background: 'rgba(15, 23, 42, 0.72)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
          }}
        >
          ត្រឡប់ទៅផ្ទាំងកែប្រែ (ESC)
        </button>
      )}

      {/* Content Grid */}
      {fullscreenShotMode ? (
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <ExamNoticeLetterCard
            id="printable-exam-notice"
            schoolName={schoolName}
            monthKey={monthKey}
            monthDisplayKh={monthDisplayKh}
            adminName={adminName}
            config={config}
            styleVariant={styleVariant}
            showCountdowns={false}
          />
        </div>
      ) : (
        <div className="exam-notice-modal-grid" style={{ maxWidth: '1160px', margin: '0 auto' }}>
          {/* LEFT PANEL: Editor & Teacher Dashboard Pop-up Control */}
          <div
            className="no-print"
            style={{
              background: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              borderRadius: '18px',
              padding: '1.05rem',
              border: '1px solid var(--border-color)',
              boxShadow: '0 14px 32px rgba(0, 0, 0, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <AppIcon name="sliders" size={16} style={{ color: '#7c3aed' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                កំណត់កាលបរិច្ឆេទ & លិខិតជូនដំណឹង
              </h3>
            </div>

            {/* Automatic 20th-of-month Exam Preparation Info */}
            <div
              style={{
                padding: '0.52rem 0.7rem',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.09)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                color: '#0369a1',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AppIcon name="calendar" size={14} style={{ flexShrink: 0 }} />
              <span>
                ថ្ងៃធ្វើវិញ្ញាសា៖ រៀងរាល់ថ្ងៃទី ២០ ({autoPrepareFmt.dmy}) ដោយស្វ័យប្រវត្តិ
              </span>
            </div>

            {/* 3 Configurable Exam Schedule Dates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'collectDate' as const, label: '២. ថ្ងៃប្រមូលវិញ្ញាសាប្រឡង' },
                { key: 'examDate' as const, label: '៣. ថ្ងៃប្រឡង' },
                { key: 'resultDate' as const, label: '៤. ថ្ងៃចេញលទ្ធផល' },
              ].map((df) => (
                <div key={df.key}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                    {df.label}
                  </label>
                  <CustomDatePicker
                    selected={config?.[df.key] || ''}
                    onChange={(iso) => updateField({ [df.key]: iso })}
                    placeholderText="dd/mm/yyyy"
                  />
                </div>
              ))}
            </div>

            {/* Custom Notice Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.22rem', color: 'var(--text-secondary)' }}>
                ចំណងជើងលិខិត (ទុកទទេដើម្បីប្រើលំនាំដើម)
              </label>
              <input
                type="text"
                className="input-field"
                value={config?.noticeTitle || ''}
                onChange={(e) => updateField({ noticeTitle: e.target.value })}
                placeholder={`ស្តីពីកាលបរិច្ឆេទធ្វើវិញ្ញាសា ប្រមូលវិញ្ញាសា...`}
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
            </div>

            {/* Note / Instructions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.22rem', color: 'var(--text-secondary)' }}>
                សេចក្តីណែនាំ / កំណត់សម្គាល់បន្ថែម
              </label>
              <textarea
                rows={3}
                className="input-field"
                value={config?.noticeNote ?? ''}
                onChange={(e) => updateField({ noticeNote: e.target.value })}
                placeholder={DEFAULT_EXAM_NOTICE_NOTE}
                style={{ width: '100%', fontSize: '0.79rem', lineHeight: 1.45, resize: 'vertical' }}
              />
            </div>

            {/* Issuer / Admin Name under Issue Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.22rem', color: 'var(--text-secondary)' }}>
                ឈ្មោះ Admin អ្នកចេញលិខិត (ក្រោមកាលបរិច្ឆេទ)
              </label>
              <input
                type="text"
                className="input-field"
                value={config?.issuerName ?? adminName}
                onChange={(e) => updateField({ issuerName: e.target.value })}
                placeholder={adminName || 'ឈ្មោះ Admin'}
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
            </div>

            {/* Teacher Dashboard Pop-up Controls & Style Selector */}
            <div
              style={{
                padding: '0.68rem 0.75rem',
                borderRadius: '12px',
                background: 'color-mix(in srgb, #7c3aed 8%, var(--main-bg))',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={config?.popupEnabled !== false}
                  onChange={(e) => updateField({ popupEnabled: e.target.checked })}
                  style={{ accentColor: '#7c3aed', width: '15px', height: '15px' }}
                />
                <span>បង្ហាញ Pop-up ជូនដំណឹងលើ Dashboard គ្រូម្នាក់ៗ</span>
              </label>

              <div>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.32rem' }}>
                  ទម្រង់ Pop-up លើ Dashboard គ្រូ៖
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                  {[
                    { key: 'official' as const, label: 'លិខិតផ្លូវការ' },
                    { key: 'modern' as const, label: 'កាតទំនើប' },
                  ].map((st) => {
                    const active = styleVariant === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => handleStyleChange(st.key)}
                        style={{
                          padding: '0.36rem 0.5rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${active ? '#7c3aed' : 'var(--border-color)'}`,
                          background: active ? '#7c3aed' : 'var(--modal-bg)',
                          color: active ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={!hasAnyExamScheduleDate(config)}
                onClick={handleSendReNotify}
                style={{
                  padding: '0.48rem 0.7rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: hasAnyExamScheduleDate(config) ? '#7c3aed' : 'var(--border-color)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: hasAnyExamScheduleDate(config) ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.38rem',
                }}
              >
                <AppIcon name="bell" size={14} />
                <span>ផ្ញើ Pop-up ជូនដំណឹងឡើងវិញ</span>
              </button>

              {notifyToast && (
                <div
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <AppIcon name="check-circle" size={13} />
                  <span>បានផ្ញើការជូនដំណឹងទៅ Dashboard គ្រូទាំងអស់រួចរាល់!</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Live Screenshot-Ready Letter Preview */}
          <div>
            <ExamNoticeLetterCard
              id="printable-exam-notice"
              schoolName={schoolName}
              monthKey={monthKey}
              monthDisplayKh={monthDisplayKh}
              adminName={adminName}
              config={config}
              styleVariant={styleVariant}
              showCountdowns={false}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
