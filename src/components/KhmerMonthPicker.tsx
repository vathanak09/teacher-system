"use client";
import React from 'react';
import { AppIcon } from './AppIcons';
import { KHMER_MONTHS } from '@/utils/paymentBilling';

export default function KhmerMonthPicker({
  value,
  onChange,
  label = 'ខែពិន្ទុ៖',
}: {
  value: string; // YYYY-MM
  onChange: (nextYm: string) => void;
  label?: string;
}) {
  const parts = value.split('-');
  const year = Number(parts[0]) || new Date().getFullYear();
  const month = Number(parts[1]) || new Date().getMonth() + 1;

  const stepMonth = (delta: number) => {
    let nextM = month + delta;
    let nextY = year;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    } else if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    onChange(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.28rem 0.4rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        background: 'var(--modal-bg)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <button
        type="button"
        onClick={() => stepMonth(-1)}
        title="ខែមុន"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          border: 'none',
          background: 'var(--main-bg)',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <AppIcon name="chevron-left" size={14} />
      </button>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.32rem',
          padding: '0 0.25rem',
        }}
      >
        <AppIcon
          name="calendar"
          size={14}
          style={{ color: 'var(--primary-color, #3b82f6)' }}
        />
        {label && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )}
        <select
          value={month}
          onChange={(e) =>
            onChange(`${year}-${String(Number(e.target.value)).padStart(2, '0')}`)
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 800,
            fontSize: '0.79rem',
            outline: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {KHMER_MONTHS.map((mName, idx) => (
            <option
              key={mName}
              value={idx + 1}
              style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}
            >
              ខែ{mName}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) =>
            onChange(`${Number(e.target.value)}-${String(month).padStart(2, '0')}`)
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 800,
            fontSize: '0.79rem',
            outline: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
            <option
              key={yr}
              value={yr}
              style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}
            >
              {yr}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => stepMonth(1)}
        title="ខែបន្ទាប់"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          border: 'none',
          background: 'var(--main-bg)',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <AppIcon name="chevron-right" size={14} />
      </button>
    </div>
  );
}
