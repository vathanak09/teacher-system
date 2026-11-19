"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { photoFrameConfigService } from '@/services/db';
import { AppIcon } from '@/components/AppIcons';
import { DriveUploadConfig, extractDriveFolderId } from './frameModel';

interface DriveUploadSetupModalProps {
  isOpen: boolean;
  config: DriveUploadConfig | null;
  currentUserName: string;
  onClose: () => void;
  onSaved?: (next: DriveUploadConfig) => void;
}

function generateSecretToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = 'BSIS_';
  for (let i = 0; i < 20; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function buildAppsScriptSnippet(secretToken: string, folderId: string): string {
  const safeToken = (secretToken || 'CHANGE_ME_SECRET').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const safeFolder = (folderId || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `const SECRET_TOKEN = '${safeToken}';
const DEFAULT_FOLDER_ID = '${safeFolder}'; // ទុកទទេ ដើម្បីបង្កើត Folder "BSIS_Photo_Frames" ដោយស្វ័យប្រវត្តិ
const DEFAULT_FOLDER_NAME = 'BSIS_Photo_Frames';
const MAX_BYTES = 15 * 1024 * 1024; // អនុញ្ញាតអតិបរមា 15MB តែ PNG ប៉ុណ្ណោះ

function getTargetFolder_(requestedFolderId) {
  const fid = (requestedFolderId || DEFAULT_FOLDER_ID || '').trim();
  if (fid) {
    return DriveApp.getFolderById(fid);
  }
  const iter = DriveApp.getFoldersByName(DEFAULT_FOLDER_NAME);
  if (iter.hasNext()) {
    return iter.next();
  }
  return DriveApp.createFolder(DEFAULT_FOLDER_NAME);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // 1. ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ (Secret Token)
    if (!SECRET_TOKEN || body.token !== SECRET_TOKEN) {
      return jsonOut_({ ok: false, error: 'ពាក្យសម្ងាត់ (Secret Token) មិនត្រឹមត្រូវ!' });
    }

    const folder = getTargetFolder_(body.folderId);

    // 2. សាកល្បងការតភ្ជាប់ (មិនបង្កើតឯកសារទេ)
    if (body.action === 'ping') {
      return jsonOut_({
        ok: true,
        folderName: folder.getName(),
        folderId: folder.getId(),
      });
    }

    // 3. ពិនិត្យប្រភេទ PNG និងទំហំឯកសារ
    if (body.mimeType !== 'image/png' || !body.base64) {
      return jsonOut_({ ok: false, error: 'អនុញ្ញាត Upload តែឯកសារ PNG ប៉ុណ្ណោះ!' });
    }

    const bytes = Utilities.base64Decode(body.base64);
    if (!bytes || bytes.length === 0 || bytes.length > MAX_BYTES) {
      return jsonOut_({ ok: false, error: 'ទំហំឯកសារ PNG មិនត្រឹមត្រូវ ឬលើស 15MB!' });
    }

    const rawName = String(body.fileName || ('frame_' + Date.now() + '.png')).replace(/[\\\\/:*?"<>|]/g, '_');
    const fileName = rawName.toLowerCase().endsWith('.png') ? rawName : (rawName + '.png');
    const blob = Utilities.newBlob(bytes, 'image/png', fileName);

    // 4. បង្កើតឯកសារថ្មីក្នុង Folder តែមួយនោះ និងបើកសិទ្ធិ Anyone with the link (View only)
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonOut_({
      ok: true,
      fileId: file.getId(),
      fileName: file.getName(),
      viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing',
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}`;
}

export default function DriveUploadSetupModal({
  isOpen,
  config,
  currentUserName,
  onClose,
  onSaved,
}: DriveUploadSetupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [allowTeachersUpload, setAllowTeachersUpload] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setScriptUrl(config?.scriptUrl || '');
    setSecretToken(config?.secretToken || generateSecretToken());
    setFolderInput(config?.folderId || '');
    setAllowTeachersUpload(Boolean(config?.allowTeachersUpload));
    setTestResult(null);
    setErrorMsg('');
    setCopiedCode(false);
  }, [isOpen, config]);

  const cleanFolderId = useMemo(() => extractDriveFolderId(folderInput), [folderInput]);

  const scriptSnippet = useMemo(
    () => buildAppsScriptSnippet(secretToken, cleanFolderId),
    [secretToken, cleanFolderId]
  );

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch {
      setErrorMsg('មិនអាចចម្លងដោយស្វ័យប្រវត្តិបានទេ — សូមជ្រើសកូដខាងក្រោមរួចចុច Ctrl+C');
    }
  };

  const handleTestConnection = async () => {
    setErrorMsg('');
    setTestResult(null);
    if (!scriptUrl.trim()) {
      setErrorMsg('សូម Paste តំណភ្ជាប់ Web App URL ពី Google Apps Script ជាមុនសិន!');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/upload-drive-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ping',
          scriptUrl: scriptUrl.trim(),
          secretToken: secretToken.trim(),
          folderId: cleanFolderId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setTestResult({ ok: false, msg: data?.error || 'តភ្ជាប់មិនបានសម្រេច!' });
      } else {
        setTestResult({
          ok: true,
          msg: `តភ្ជាប់ Google Drive ជោគជ័យ! Folder គោលដៅ៖ "${data.folderName}"`,
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message || 'មានបញ្ហាក្នុងការសាកល្បងការតភ្ជាប់' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUrl = scriptUrl.trim();
    if (cleanUrl && !cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      setErrorMsg('Web App URL ត្រូវតែផ្តើមដោយ https://script.google.com/macros/s/...');
      return;
    }

    setSaving(true);
    try {
      const payload: DriveUploadConfig = {
        scriptUrl: cleanUrl,
        secretToken: secretToken.trim(),
        folderId: cleanFolderId,
        allowTeachersUpload,
        updatedAt: Date.now(),
        updatedByName: currentUserName,
      };
      await photoFrameConfigService.add(payload, 'driveUpload');
      onSaved?.(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'មិនអាចរក្សាទុកការកំណត់បានទេ');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10065,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
          padding: '1.3rem 1.45rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingBottom: '0.85rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="folder" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                កំណត់ការ Upload Frame ទៅ Google Drive (Apps Script)
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
                ប្រើទំហំ Google Drive ផ្ទាល់ខ្លួនរបស់អ្នក ឥតគិតថ្លៃ 100% ជាមួយប្រព័ន្ធការពារ Secret Token
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Permission Toggle (Answers who can upload to user's Drive!) */}
          <div
            style={{
              padding: '0.8rem 0.9rem',
              borderRadius: '14px',
              background: 'var(--main-bg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <AppIcon name="lock" size={15} style={{ color: 'var(--accent-primary)' }} />
              សិទ្ធិអ្នកអាច Upload ចូល Google Drive របស់អ្នក
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                {
                  val: false,
                  title: 'មានតែ Admin (ផ្ទាល់ខ្លួន)',
                  desc: 'សុវត្ថិភាពបំផុត៖ មានតែគណនី Admin អ្នកប៉ុណ្ណោះដែល Upload ចូល Drive អ្នកបាន',
                },
                {
                  val: true,
                  title: 'Admin + គ្រូបង្រៀនទាំងអស់',
                  desc: 'គ្រូទាំងអស់អាច Upload ស៊ុម PNG (≤15MB) ចូល Folder តែមួយនេះ ដើម្បីចែករំលែកគ្នា',
                },
              ].map((opt) => {
                const active = allowTeachersUpload === opt.val;
                return (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => setAllowTeachersUpload(opt.val)}
                    style={{
                      textAlign: 'left',
                      padding: '0.62rem 0.72rem',
                      borderRadius: '11px',
                      border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active
                        ? 'color-mix(in srgb, var(--accent-primary) 11%, var(--card-bg))'
                        : 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.18rem',
                    }}
                  >
                    <strong style={{ fontSize: '0.8rem' }}>{opt.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Secret Token & Optional Folder ID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.32rem', color: 'var(--text-primary)' }}>
                ១. ពាក្យសម្ងាត់ការពារ (Secret Token)
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="text"
                  className="input-field"
                  value={secretToken}
                  onChange={(e) => setSecretToken(e.target.value)}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setSecretToken(generateSecretToken())}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '9px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--main-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                  title="បង្កើតពាក្យសម្ងាត់ថ្មី"
                >
                  <AppIcon name="refresh-cw" size={13} />
                  បង្កើតថ្មី
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.32rem', color: 'var(--text-primary)' }}>
                ២. Google Drive Folder Link ឬ ID (ស្រេចចិត្ត)
              </label>
              <input
                type="text"
                className="input-field"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="ទុកទទេ ដើម្បីបង្កើត Folder BSIS_Photo_Frames ស្វ័យប្រវត្តិ"
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
              {cleanFolderId && (
                <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.22rem' }}>
                  Folder ID: <code>{cleanFolderId}</code>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Copyable Pre-filled Google Apps Script Code */}
          <div
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '14px',
              background: 'color-mix(in srgb, var(--accent-primary) 6%, var(--main-bg))',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 22%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem' }}>
              <strong style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                ៣. ចម្លងកូដ Google Apps Script ទៅដាក់ក្នុងគណនី Google អ្នក (ម្តងគត់)
              </strong>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCode((s) => !s)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showCode ? 'លាក់កូដ' : 'បង្ហាញកូដ'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  style={{
                    padding: '0.32rem 0.72rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: copiedCode ? '#10b981' : 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <AppIcon name={copiedCode ? 'check' : 'copy'} size={13} />
                  {copiedCode ? 'បានចម្លងកូដរួច!' : 'ចម្លងកូដ Apps Script'}
                </button>
              </div>
            </div>

            <ol style={{ margin: '0.1rem 0', paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <li>
                ចូលទៅកាន់{' '}
                <a
                  href="https://script.google.com/home/projects/create"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-primary)', fontWeight: 700 }}
                >
                  script.google.com (បង្កើត Project ថ្មី)
                </a>{' '}
                រួចលុបកូដចាស់ ហើយ Paste កូដខាងក្រោមចូល (មាន Secret Token រួចជាស្រេច)។
              </li>
              <li>
                ចុច <strong>Deploy → New deployment → Select type: Web app</strong>។
              </li>
              <li>
                ជ្រើស <strong>Execute as: Me</strong> និង <strong>Who has access: Anyone</strong> រួចចុច <strong>Deploy</strong> និងអនុញ្ញាតសិទ្ធិ Google Drive របស់អ្នក។
              </li>
              <li>
                ចម្លង <strong>Web app URL</strong> (<code>https://script.google.com/macros/s/.../exec</code>) មក Paste ក្នុងប្រអប់ទី ៤ ខាងក្រោម!
              </li>
            </ol>

            {showCode && (
              <pre
                style={{
                  margin: 0,
                  padding: '0.7rem 0.8rem',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: '0.71rem',
                  lineHeight: 1.45,
                  maxHeight: '190px',
                  overflow: 'auto',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                <code>{scriptSnippet}</code>
              </pre>
            )}
          </div>

          {/* Step 3: Paste Deployed Web App URL + Test Connection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              ៤. Paste តំណភ្ជាប់ Google Apps Script Web App URL
            </label>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                className="input-field"
                value={scriptUrl}
                onChange={(e) => {
                  setScriptUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                style={{ flex: 1, minWidth: '240px', fontSize: '0.81rem' }}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !scriptUrl.trim()}
                style={{
                  padding: '0.48rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)',
                  background: 'color-mix(in srgb, var(--accent-primary) 11%, var(--main-bg))',
                  color: 'var(--accent-primary)',
                  fontSize: '0.79rem',
                  fontWeight: 700,
                  cursor: testing || !scriptUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: !scriptUrl.trim() ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AppIcon name={testing ? 'refresh-cw' : 'zap'} size={15} />
                {testing ? 'កំពុងសាកល្បង...' : 'សាកល្បងការតភ្ជាប់'}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              style={{
                padding: '0.62rem 0.82rem',
                borderRadius: '10px',
                background: testResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.ok ? '#059669' : '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AppIcon name={testResult.ok ? 'check-circle' : 'alert-triangle'} size={16} />
              <span>{testResult.msg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '0.62rem 0.82rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <AppIcon name="alert-triangle" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', paddingTop: '0.35rem' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              បិទ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <AppIcon name={saving ? 'refresh-cw' : 'check'} size={16} />
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់ Google Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
