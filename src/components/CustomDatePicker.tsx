"use client";

import React, { forwardRef, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  selected: string | null | undefined;
  onChange: (date: string) => void;
  placeholderText?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
}

function parseSafeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Check if it's DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Check if it's YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to standard new Date()
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  return null;
}

const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, placeholder, className, style, required }, ref) => (
  <input
    value={value}
    onClick={onClick}
    onChange={onChange}
    ref={ref}
    placeholder={placeholder}
    className={className || "input-field"}
    required={required}
    style={{
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-secondary, var(--main-bg))',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      ...style
    }}
    readOnly
  />
));
CustomInput.displayName = "CustomInput";

export default function CustomDatePicker({ selected, onChange, placeholderText = "ជ្រើសរើសកាលបរិច្ឆេទ", className, style, required }: CustomDatePickerProps) {
  const datePickerRef = useRef<any>(null);
  const selectedDate = parseSafeDate(selected);
  
  const handleChange = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) {
      onChange('');
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
  };

  const handleConfirm = () => {
    if (datePickerRef.current) {
      datePickerRef.current.setOpen(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <DatePicker
        disabled={disabled}
        ref={datePickerRef}
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholderText}
        customInput={<CustomInput className={className} style={style} required={required} />}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        isClearable
        shouldCloseOnSelect={false}
        portalId="date-picker-portal"
      >
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color, #eee)', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--modal-bg, #fff)' }}>
          <button 
            type="button" 
            onClick={handleConfirm} 
            style={{ 
              background: 'var(--accent-primary, #0ea5e9)', 
              color: '#fff', 
              border: 'none', 
              padding: '0.5rem 2rem', 
              borderRadius: '8px', 
              fontWeight: 600, 
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem'
            }}
          >
            បញ្ជាក់
          </button>
        </div>
      </DatePicker>
      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 999999 !important;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker {
          font-family: inherit;
          border: none;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
          background-color: var(--modal-bg, #fff) !important;
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: var(--modal-bg, #fff) !important;
          border-bottom: 1px solid var(--border-color, #eee) !important;
          padding-top: 1rem;
        }
        .react-datepicker__header select {
          background-color: var(--modal-bg, #fff);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 0.2rem;
          margin: 0 0.2rem;
          cursor: pointer;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: var(--text-primary, #333) !important;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: var(--text-primary, #333) !important;
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0.166rem;
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range,
        .react-datepicker__month-text--selected, .react-datepicker__month-text--in-selecting-range, .react-datepicker__month-text--in-range,
        .react-datepicker__quarter-text--selected, .react-datepicker__quarter-text--in-selecting-range, .react-datepicker__quarter-text--in-range,
        .react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range {
          background-color: var(--accent-primary, #0ea5e9) !important;
          color: #fff !important;
          border-radius: 50%;
        }
        .react-datepicker__day--keyboard-selected, .react-datepicker__month-text--keyboard-selected, .react-datepicker__quarter-text--keyboard-selected, .react-datepicker__year-text--keyboard-selected {
          background-color: var(--accent-primary, #0ea5e9) !important;
          border-radius: 50%;
        }
        .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
          background-color: var(--bg-hover, #f3f4f6) !important;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
