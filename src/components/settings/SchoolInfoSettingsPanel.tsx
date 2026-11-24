"use client";

import React, { useState } from 'react';
import { convertDriveImageLink } from '@/utils/driveLink';
import { AppIcon } from '../AppIcons';

export interface SchoolExtraLink {
  id: string;
  label: string;
  value: string;
}

export interface SchoolProfileInfo {
  schoolName: string;
  schoolFullNameKh: string;
  schoolFullNameEn: string;
  schoolShortName: string;
  schoolSlogan: string;
  schoolLogoUrl: string;
  schoolWebsite: string;
  schoolQrUrl: string;
  schoolPaymentQrUrl: string;
  schoolPhone: string;
  schoolPhoneSecondary: string;
  schoolTelegram: string;
  schoolEmail: string;
  schoolEmailSecondary: string;
  schoolFacebook: string;
  schoolAddress: string;
  schoolMapUrl: string;
  schoolExtraLinks: SchoolExtraLink[];
}

export const DEFAULT_SCHOOL_PROFILE: SchoolProfileInfo = {
  schoolName: 'សាលាអន្តរជាតិប្រេនស្តម',
  schoolFullNameKh: 'សាលាអន្តរជាតិ ប្រេនស្តម',
  schoolFullNameEn: 'BRAINSTORM INTERNATIONAL SCHOOL',
  schoolShortName: 'BSIS',
  schoolSlogan: '',
  schoolLogoUrl: '',
  schoolWebsite: '',
  schoolQrUrl: '',
  schoolPaymentQrUrl: '',
  schoolPhone: '077 30 85 40',
  schoolPhoneSecondary: '011 59 59 71',
  schoolTelegram: '',
  schoolEmail: '',
  schoolEmailSecondary: '',
  schoolFacebook: '',
  schoolAddress: 'ផ្លូវជាតិលេខ២១ ស្ពានលេខ៧០ ភូមិកំពង់ថ្កុល សង្កាត់សំពៅពូន ក្រុងសំពៅពូន ខេត្តកណ្តាល',
  schoolMapUrl: '',
  schoolExtraLinks: [],
};

export interface SchoolInfoSettingsPanelProps {
  profile: SchoolProfileInfo;
  onChange: (next: SchoolProfileInfo) => void;
  onSave: () => Promise<void> | void;
  isSaving?: boolean;
  onNotify?: (msg: string) => void;
}

function isDirectImageOrDriveUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return false;
  if (u.includes('drive.google.com') || u.includes('lh3.googleusercontent.com')) return true;
  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(u)) return true;
  return false;
}

function resolveQrPreviewSrc(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (isDirectImageOrDriveUrl(trimmed)) {
    return convertDriveImageLink(trimmed);
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(
    trimmed
  )}`;
}

function normalizeHref(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes('@') && !t.includes('/')) return `mailto:${t}`;
  return `https://${t}`;
}

export default function SchoolInfoSettingsPanel({
  profile,
  onChange,
  onSave,
  isSaving = false,
  onNotify,
}: SchoolInfoSettingsPanelProps) {
  const [newExtraLabel, setNewExtraLabel] = useState('');
  const [newExtraValue, setNewExtraValue] = useState('');

  const setField = <K extends keyof SchoolProfileInfo>(key: K, value: SchoolProfileInfo[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const handleAddExtraLink = () => {
    const label = newExtraLabel.trim();
    const value = newExtraValue.trim();
    if (!label || !value) {
      onNotify?.('សូមបំពេញឈ្មោះ និងតំណភ្ជាប់/អ៊ីមែលបន្ថែម!');
      return;
    }
    const nextItem: SchoolExtraLink = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      value,
    };
    setField('schoolExtraLinks', [...(profile.schoolExtraLinks || []), nextItem]);
    setNewExtraLabel('');
    setNewExtraValue('');
  };

  const handleRemoveExtraLink = (id: string) => {
    setField(
      'schoolExtraLinks',
      (profile.schoolExtraLinks || []).filter((item) => item.id !== id)
    );
  };

  const handleCopyText = async (text: string, label: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      onNotify?.(`បានចម្លង ${label} រួចរាល់!`);
    } catch {
      // ignore clipboard errors
    }
  };

  const qrSourceTarget = profile.schoolQrUrl.trim() || profile.schoolWebsite.trim();
  const qrPreviewSrc = resolveQrPreviewSrc(qrSourceTarget);
  const paymentQrPreviewSrc = profile.schoolPaymentQrUrl.trim()
    ? resolveQrPreviewSrc(profile.schoolPaymentQrUrl)
    : '';
  const logoPreviewSrc = profile.schoolLogoUrl.trim()
    ? convertDriveImageLink(profile.schoolLogoUrl.trim())
    : '/logo.png';

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.38rem',
    fontWeight: 600,
    fontSize: '0.86rem',
    color: 'var(--text-primary)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--main-bg)',
    padding: '0.68rem 0.85rem',
    width: '100%',
    borderRadius: '9px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  };

  const sectionCardStyle: React.CSSProperties = {
    padding: '1.35rem 1.5rem',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Left/Main Form Column */}
      <div style={{ flex: '2 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Section 1: School Identity */}
        <div className="glass-panel" style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2
              style={{
                fontSize: '1.08rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-primary)',
              }}
            >
              <AppIcon name="graduation-cap" size={19} style={{ color: 'var(--primary-color)' }} />
              <span>១. អត្តសញ្ញាណ និងឈ្មោះសាលារៀន</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              ព័ត៌មានគោលសម្រាប់ប្រព័ន្ធ &amp; ឯកសារផ្លូវការ
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.95rem' }}>
            <div>
              <label style={labelStyle}>ឈ្មោះសាលារៀន (បង្ហាញលើប្រព័ន្ធ) *</label>
              <input
                type="text"
                value={profile.schoolName}
                onChange={(e) => setField('schoolName', e.target.value)}
                placeholder="ឧ. សាលាអន្តរជាតិប្រេនស្តម"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>អក្សរកាត់ / កូដសាលា (Short Code)</label>
              <input
                type="text"
                value={profile.schoolShortName}
                onChange={(e) => setField('schoolShortName', e.target.value)}
                placeholder="ឧ. BSIS"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>ឈ្មោះសាលារៀនពេញ (ភាសាខ្មែរ)</label>
              <input
                type="text"
                value={profile.schoolFullNameKh}
                onChange={(e) => setField('schoolFullNameKh', e.target.value)}
                placeholder="ឧ. សាលាអន្តរជាតិ ប្រេនស្តម"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>ឈ្មោះសាលារៀនពេញ (English Full Name)</label>
              <input
                type="text"
                value={profile.schoolFullNameEn}
                onChange={(e) => setField('schoolFullNameEn', e.target.value)}
                placeholder="ឧ. BRAINSTORM INTERNATIONAL SCHOOL"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>បាវចនា / ពាក្យស្លោកសាលា (Slogan)</label>
              <input
                type="text"
                value={profile.schoolSlogan}
                onChange={(e) => setField('schoolSlogan', e.target.value)}
                placeholder="ឧ. ចំណេះដឹង គុណធម៌ និងភាពជាអ្នកដឹកនាំ"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>តំណភ្ជាប់ Logo សាលា (URL ឬ Google Drive)</label>
              <input
                type="text"
                value={profile.schoolLogoUrl}
                onChange={(e) => setField('schoolLogoUrl', e.target.value)}
                placeholder="ទុកទទេដើម្បីប្រើ Logo លំនាំដើម (/logo.png)"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Phones, Emails & Address */}
        <div className="glass-panel" style={sectionCardStyle}>
          <h2
            style={{
              fontSize: '1.08rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
            }}
          >
            <AppIcon name="map-pin" size={19} style={{ color: '#10b981' }} />
            <span>២. លេខទូរស័ព្ទ អ៊ីមែល និងអាសយដ្ឋាន</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.95rem' }}>
            <div>
              <label style={labelStyle}>លេខទូរស័ព្ទចម្បង (Primary Phone)</label>
              <input
                type="text"
                value={profile.schoolPhone}
                onChange={(e) => setField('schoolPhone', e.target.value)}
                placeholder="ឧ. 077 30 85 40"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>លេខទូរស័ព្ទទី២ / បន្ថែម (Secondary Phone)</label>
              <input
                type="text"
                value={profile.schoolPhoneSecondary}
                onChange={(e) => setField('schoolPhoneSecondary', e.target.value)}
                placeholder="ឧ. 011 59 59 71"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Telegram (លេខ ឬ Link)</label>
              <input
                type="text"
                value={profile.schoolTelegram}
                onChange={(e) => setField('schoolTelegram', e.target.value)}
                placeholder="ឧ. https://t.me/bsisschool ឬ 077 30 85 40"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>អ៊ីមែលចម្បង (Primary Email)</label>
              <input
                type="email"
                value={profile.schoolEmail}
                onChange={(e) => setField('schoolEmail', e.target.value)}
                placeholder="ឧ. info@school.edu.kh"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>អ៊ីមែលបន្ថែម / ការិយាល័យ (Secondary Email)</label>
              <input
                type="email"
                value={profile.schoolEmailSecondary}
                onChange={(e) => setField('schoolEmailSecondary', e.target.value)}
                placeholder="ឧ. admin@school.edu.kh"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>តំណភ្ជាប់ផែនទី (Google Maps Link)</label>
              <input
                type="text"
                value={profile.schoolMapUrl}
                onChange={(e) => setField('schoolMapUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>អាសយដ្ឋានសាលារៀនពេញ (Full Address)</label>
            <textarea
              rows={2}
              value={profile.schoolAddress}
              onChange={(e) => setField('schoolAddress', e.target.value)}
              placeholder="បញ្ចូលអាសយដ្ឋានពេញរបស់សាលារៀន..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 3: Website, Social Media, QR Codes & Extra Links/Emails */}
        <div className="glass-panel" style={sectionCardStyle}>
          <h2
            style={{
              fontSize: '1.08rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
            }}
          >
            <AppIcon name="external-link" size={19} style={{ color: '#6366f1' }} />
            <span>៣. គេហទំព័រ បណ្តាញសង្គម និងតំណភ្ជាប់ QR Code</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.95rem' }}>
            <div>
              <label style={labelStyle}>គេហទំព័រសាលា (Website URL)</label>
              <input
                type="text"
                value={profile.schoolWebsite}
                onChange={(e) => setField('schoolWebsite', e.target.value)}
                placeholder="https://www.yourschool.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>ទំព័រ Facebook (Facebook Page URL)</label>
              <input
                type="text"
                value={profile.schoolFacebook}
                onChange={(e) => setField('schoolFacebook', e.target.value)}
                placeholder="https://facebook.com/yourschool"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>
                តំណភ្ជាប់ QR Code សាលា (Link គេហទំព័រ/ចុះឈ្មោះ ឬ Link រូបភាព QR ពី Google Drive)
              </label>
              <input
                type="text"
                value={profile.schoolQrUrl}
                onChange={(e) => setField('schoolQrUrl', e.target.value)}
                placeholder="បិទភ្ជាប់ Link គេហទំព័រ ឬ Link រូបភាព QR Code (ប្រព័ន្ធនឹងបង្ហាញ QR Code ស្វ័យប្រវត្តិ)"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>
                តំណភ្ជាប់ QR Code បង់ប្រាក់ (KHQR / ABA / ACLEDA — URL ឬ Google Drive)
              </label>
              <input
                type="text"
                value={profile.schoolPaymentQrUrl}
                onChange={(e) => setField('schoolPaymentQrUrl', e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Dynamic Extra Emails / QR Links / Social Channels */}
          <div
            style={{
              marginTop: '0.35rem',
              paddingTop: '0.95rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              អ៊ីមែល / តំណភ្ជាប់ / QR Code បន្ថែមផ្សេងៗ ({(profile.schoolExtraLinks || []).length})
            </div>

            {(profile.schoolExtraLinks || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {(profile.schoolExtraLinks || []).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '9px',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--accent-primary)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.value, item.label)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}
                        title="ចម្លង"
                      >
                        <AppIcon name="copy" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraLink(item.id)}
                        className="btn"
                        style={{
                          padding: '0.3rem 0.5rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: 'none',
                        }}
                        title="លុប"
                      >
                        <AppIcon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={newExtraLabel}
                onChange={(e) => setNewExtraLabel(e.target.value)}
                placeholder="ឈ្មោះ (ឧ. អ៊ីមែលគណនេយ្យ, TikTok, QR ចុះឈ្មោះ)"
                style={{ ...inputStyle, flex: '1 1 180px' }}
              />
              <input
                type="text"
                value={newExtraValue}
                onChange={(e) => setNewExtraValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExtraLink();
                  }
                }}
                placeholder="អ៊ីមែល ឬ Link (https://...)"
                style={{ ...inputStyle, flex: '2 1 240px' }}
              />
              <button
                type="button"
                onClick={handleAddExtraLink}
                className="btn btn-outline"
                style={{
                  padding: '0.66rem 0.95rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AppIcon name="plus" size={15} />
                <span>បន្ថែម</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onSave()}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.9rem 1.25rem',
            fontSize: '0.96rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <AppIcon name="check-circle" size={18} style={{ color: '#ffffff' }} />
          <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកព័ត៌មានសាលារៀនទាំងអស់'}</span>
        </button>
      </div>

      {/* Right Column: Live School Card & QR Code Preview */}
      <div
        className="glass-panel"
        style={{
          flex: '1 1 310px',
          maxWidth: '410px',
          padding: '1.35rem',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'sticky',
          top: '1.25rem',
        }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          ការបង្ហាញជាក់ស្តែង (Live Preview)
        </div>

        {/* School Identity Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            paddingBottom: '0.9rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'var(--main-bg)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '4px',
            }}
          >
            <img
              src={logoPreviewSrc}
              alt="School Logo"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = '/logo.png';
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {profile.schoolFullNameKh || profile.schoolName || 'ឈ្មោះសាលារៀន'}
            </div>
            {profile.schoolFullNameEn && (
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.12rem' }}>
                {profile.schoolFullNameEn}
                {profile.schoolShortName ? ` (${profile.schoolShortName})` : ''}
              </div>
            )}
            {profile.schoolSlogan && (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                {profile.schoolSlogan}
              </div>
            )}
          </div>
        </div>

        {/* Contact Details Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.83rem' }}>
          {(profile.schoolPhone || profile.schoolPhoneSecondary) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>ទូរស័ព្ទ៖</span>
              <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                {[profile.schoolPhone, profile.schoolPhoneSecondary].filter(Boolean).join(' / ')}
              </strong>
            </div>
          )}

          {profile.schoolEmail && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>អ៊ីមែល៖</span>
              <a
                href={`mailto:${profile.schoolEmail}`}
                style={{ color: 'var(--primary-color)', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}
              >
                {profile.schoolEmail}
              </a>
            </div>
          )}

          {profile.schoolEmailSecondary && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>អ៊ីមែលទី២៖</span>
              <a
                href={`mailto:${profile.schoolEmailSecondary}`}
                style={{ color: 'var(--primary-color)', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}
              >
                {profile.schoolEmailSecondary}
              </a>
            </div>
          )}

          {profile.schoolWebsite && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>គេហទំព័រ៖</span>
              <a
                href={normalizeHref(profile.schoolWebsite)}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}
              >
                {profile.schoolWebsite}
              </a>
            </div>
          )}

          {profile.schoolTelegram && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Telegram៖</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>
                {profile.schoolTelegram}
              </span>
            </div>
          )}

          {profile.schoolFacebook && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Facebook៖</span>
              <a
                href={normalizeHref(profile.schoolFacebook)}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}
              >
                បើកទំព័រ Facebook
              </a>
            </div>
          )}

          {profile.schoolAddress && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.15rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>អាសយដ្ឋាន៖</span>
              <span style={{ color: 'var(--text-primary)', lineHeight: 1.45 }}>{profile.schoolAddress}</span>
            </div>
          )}

          {profile.schoolMapUrl && (
            <a
              href={normalizeHref(profile.schoolMapUrl)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.82rem',
                marginTop: '0.15rem',
              }}
            >
              <AppIcon name="map-pin" size={14} />
              <span>មើលទីតាំងលើ Google Maps</span>
            </a>
          )}
        </div>

        {/* Live QR Code Preview Box */}
        <div
          style={{
            padding: '0.9rem',
            borderRadius: '12px',
            background: 'var(--main-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.55rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            QR Code សាលារៀន
          </div>
          {qrPreviewSrc ? (
            <>
              <div
                style={{
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={qrPreviewSrc}
                  alt="School QR Code"
                  style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {qrSourceTarget}
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(qrSourceTarget, 'តំណភ្ជាប់ QR Code')}
                className="btn btn-outline"
                style={{
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AppIcon name="copy" size={13} />
                <span>ចម្លងតំណភ្ជាប់ QR</span>
              </button>
            </>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '1rem 0.5rem' }}>
              បញ្ចូលតំណភ្ជាប់គេហទំព័រ ឬ QR Code ដើម្បីបង្ហាញ QR ស្វ័យប្រវត្តិនៅទីនេះ
            </div>
          )}
        </div>

        {/* Payment QR Preview (when provided) */}
        {paymentQrPreviewSrc && (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'var(--main-bg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.45rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              QR Code បង់ប្រាក់ (KHQR / ធនាគារ)
            </div>
            <div
              style={{
                background: '#ffffff',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <img
                src={paymentQrPreviewSrc}
                alt="Payment QR Code"
                style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
