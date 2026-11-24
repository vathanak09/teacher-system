"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { studentService } from '@/services/db';
import { convertDriveImageLink } from '@/utils/driveLink';
import { AppIcon } from './AppIcons';

export interface StudentQuickEditModalProps {
  student: any | null;
  roomAndTeacher?: string;
  onSaved?: (studentName: string) => void;
  onError?: (message: string) => void;
  onOpenStudentsPage?: () => void;
  onClose: () => void;
}

export default function StudentQuickEditModal({
  student,
  roomAndTeacher,
  onSaved,
  onError,
  onOpenStudentsPage,
  onClose,
}: StudentQuickEditModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setForm({
      studentId: String(student.studentId || ''),
      fullName: String(student.fullName || ''),
      englishName: String(student.englishName || ''),
      gender: String(student.gender || ''),
      dob: String(student.dob || ''),
      level: String(student.level || ''),
      shift: String(student.shift || ''),
      fee: String(student.fee ?? ''),
      enrollDate: String(student.enrollDate || ''),
      nextPaymentDate: String(student.nextPaymentDate || ''),
      status: String(student.status || 'កំពុងសិក្សា'),
      phoneNum: String(student.phoneNum || student.contact || ''),
      father: String(student.father || ''),
      mother: String(student.mother || ''),
      address: String(student.address || ''),
      transport: String(student.transport || ''),
      note: String(student.note || ''),
    });
  }, [student]);

  if (!student || typeof document === 'undefined') return null;

  const setField = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName?.trim()) {
      onError?.('សូមបំពេញឈ្មោះសិស្ស!');
      return;
    }
    setIsSaving(true);
    try {
      const patch: Record<string, any> = {
        studentId: form.studentId.trim(),
        fullName: form.fullName.trim(),
        englishName: form.englishName.trim(),
        gender: form.gender.trim(),
        dob: form.dob.trim(),
        level: form.level.trim(),
        shift: form.shift.trim(),
        fee: form.fee.trim(),
        enrollDate: form.enrollDate.trim(),
        nextPaymentDate: form.nextPaymentDate.trim(),
        status: form.status.trim() || 'កំពុងសិក្សា',
        phoneNum: form.phoneNum.trim(),
        father: form.father.trim(),
        mother: form.mother.trim(),
        address: form.address.trim(),
        transport: form.transport.trim(),
        note: form.note.trim(),
      };
      await studentService.update(student.id, patch);
      onSaved?.(patch.fullName);
      onClose();
    } catch (err) {
      console.error('Failed updating student from payments page:', err);
      onError?.('មានបញ្ហាក្នុងការរក្សាទុកព័ត៌មានសិស្ស!');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.48rem 0.72rem',
    borderRadius: '9px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '0.28rem',
  };

  const photoSrc =
    student.photo && String(student.photo).trim() !== ''
      ? convertDriveImageLink(String(student.photo))
      : '';

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 25000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 50px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.35rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={student.fullName || 'Student'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <AppIcon name="users" size={22} style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                មើល & កែប្រែព័ត៌មានសិស្ស
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.12rem' }}>
                {student.studentId ? `អត្តលេខ ${student.studentId}` : ''}
                {roomAndTeacher ? ` • ${roomAndTeacher}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {onOpenStudentsPage && (
              <button
                type="button"
                onClick={onOpenStudentsPage}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.36rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <AppIcon name="external-link" size={14} />
                <span>ទំព័រសិស្ស</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '0.25rem',
                display: 'inline-flex',
              }}
            >
              <AppIcon name="x" size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div
          style={{
            padding: '1.15rem 1.35rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: '0.8rem',
          }}
        >
          <div>
            <label style={labelStyle}>អត្តលេខសិស្ស</label>
            <input
              type="text"
              value={form.studentId || ''}
              onChange={(e) => setField('studentId', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ឈ្មោះសិស្ស (ខ្មែរ) *</label>
            <input
              type="text"
              required
              value={form.fullName || ''}
              onChange={(e) => setField('fullName', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ឈ្មោះអង់គ្លេស</label>
            <input
              type="text"
              value={form.englishName || ''}
              onChange={(e) => setField('englishName', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ភេទ</label>
            <select
              value={form.gender || ''}
              onChange={(e) => setField('gender', e.target.value)}
              style={inputStyle}
            >
              <option value="">-- ជ្រើសរើស --</option>
              <option value="ប្រុស">ប្រុស</option>
              <option value="ស្រី">ស្រី</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>ថ្ងៃខែឆ្នាំកំណើត</label>
            <input
              type="date"
              value={form.dob || ''}
              onChange={(e) => setField('dob', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ស្ថានភាពសិក្សា</label>
            <select
              value={form.status || 'កំពុងសិក្សា'}
              onChange={(e) => setField('status', e.target.value)}
              style={inputStyle}
            >
              <option value="កំពុងសិក្សា">កំពុងសិក្សា</option>
              <option value="ឈប់រៀន">ឈប់រៀន</option>
              <option value="ផ្អាកការសិក្សា">ផ្អាកការសិក្សា</option>
              <option value="បញ្ចប់ការសិក្សា">បញ្ចប់ការសិក្សា</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>វគ្គ / កម្រិតសិក្សា</label>
            <input
              type="text"
              value={form.level || ''}
              onChange={(e) => setField('level', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>វេនសិក្សា</label>
            <input
              type="text"
              value={form.shift || ''}
              onChange={(e) => setField('shift', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ថ្លៃសិក្សាប្រចាំខែ (រៀល)</label>
            <input
              type="text"
              value={form.fee || ''}
              onChange={(e) => setField('fee', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ថ្ងៃចូលរៀន</label>
            <input
              type="date"
              value={form.enrollDate || ''}
              onChange={(e) => setField('enrollDate', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ថ្ងៃត្រូវបង់ប្រាក់បន្ទាប់</label>
            <input
              type="date"
              value={form.nextPaymentDate || ''}
              onChange={(e) => setField('nextPaymentDate', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>លេខទូរស័ព្ទទំនាក់ទំនង</label>
            <input
              type="text"
              value={form.phoneNum || ''}
              onChange={(e) => setField('phoneNum', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ឈ្មោះឪពុក</label>
            <input
              type="text"
              value={form.father || ''}
              onChange={(e) => setField('father', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ឈ្មោះម្តាយ</label>
            <input
              type="text"
              value={form.mother || ''}
              onChange={(e) => setField('mother', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>មធ្យោបាយធ្វើដំណើរ</label>
            <input
              type="text"
              value={form.transport || ''}
              onChange={(e) => setField('transport', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>អាសយដ្ឋាន</label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setField('address', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>កំណត់សម្គាល់</label>
            <textarea
              rows={2}
              value={form.note || ''}
              onChange={(e) => setField('note', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.9rem 1.35rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.48rem 1rem', fontSize: '0.86rem' }}
          >
            បិទ
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ padding: '0.48rem 1.2rem', fontSize: '0.86rem', fontWeight: 700 }}
          >
            {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកែប្រែ'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
