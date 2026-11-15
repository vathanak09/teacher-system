"use client";

import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onConfirm?: (isoDate: string) => void;
}

function isValidYMD(year: number, monthIndex: number, day: number): Date | null {
  if (year < 1900 || year > 2100 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return null;
  }
  const d = new Date(year, monthIndex, day);
  if (
    isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== monthIndex ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function parseSafeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return isValidYMD(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
  }

  // 8 digits DDMMYYYY
  const compactMatch = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compactMatch) {
    return isValidYMD(parseInt(compactMatch[3], 10), parseInt(compactMatch[2], 10) - 1, parseInt(compactMatch[1], 10));
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return isValidYMD(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function formatDateToDisplay(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToISO(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DateInputWrapperProps {
  textValue: string;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextBlur: () => void;
  onTextFocus: () => void;
  onTextKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onToggleCalendar: () => void;
  toggleBtnRef: React.RefObject<HTMLButtonElement | null>;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

const DateInputWrapper = forwardRef<HTMLDivElement, DateInputWrapperProps>(
  (
    {
      textValue,
      onTextChange,
      onTextBlur,
      onTextFocus,
      onTextKeyDown,
      onClear,
      onToggleCalendar,
      toggleBtnRef,
      placeholder,
      className,
      style,
      required,
      disabled,
      autoFocus,
    },
    ref
  ) => (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={textValue}
        onChange={onTextChange}
        onBlur={onTextBlur}
        onFocus={onTextFocus}
        onKeyDown={onTextKeyDown}
        placeholder={placeholder || 'dd/mm/yyyy'}
        className={className || 'input-field'}
        required={required}
        disabled={disabled}
        maxLength={10}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary, var(--main-bg))',
          color: 'var(--text-primary)',
          ...style,
          paddingRight: textValue && !disabled ? '4.25rem' : '2.75rem',
        }}
      />

      {textValue && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          title="សម្អាតកាលបរិច្ឆេទ"
          aria-label="សម្អាតកាលបរិច្ឆេទ"
          style={{
            position: 'absolute',
            right: '2.3rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      <button
        ref={toggleBtnRef}
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) onToggleCalendar();
        }}
        title="ជ្រើសរើសតាមប្រតិទិន"
        aria-label="ជ្រើសរើសតាមប្រតិទិន"
        style={{
          position: 'absolute',
          right: '0.4rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          touchAction: 'manipulation',
          background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)',
          border: '1px solid var(--border-color)',
          color: 'var(--primary-color, var(--accent-primary, #0ea5e9))',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.35rem 0.45rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.15s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
    </div>
  )
);
DateInputWrapper.displayName = "DateInputWrapper";

export default function CustomDatePicker({
  selected,
  onChange,
  placeholderText = "dd/mm/yyyy",
  className,
  style,
  required,
  disabled,
  autoFocus = false,
  onKeyDown,
  onConfirm,
}: CustomDatePickerProps) {
  const datePickerRef = useRef<any>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const isEditingRef = useRef(false);
  const prevRawLengthRef = useRef(0);

  const selectedDate = parseSafeDate(selected);
  const [textValue, setTextValue] = useState<string>(() => formatDateToDisplay(selectedDate));
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isEditingRef.current) {
      const formatted = formatDateToDisplay(parseSafeDate(selected));
      setTextValue(formatted);
      prevRawLengthRef.current = formatted.length;
    }
  }, [selected]);

  const handleCalendarChange = (date: Date | null) => {
    isEditingRef.current = false;
    if (!date || isNaN(date.getTime())) {
      setTextValue('');
      prevRawLengthRef.current = 0;
      onChange('');
      return;
    }
    const display = formatDateToDisplay(date);
    setTextValue(display);
    prevRawLengthRef.current = display.length;
    onChange(formatDateToISO(date));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/\-]/g, '');
    const isAdding = val.length > prevRawLengthRef.current;

    if (isAdding) {
      // Auto-insert '/' while typing DDMMYYYY forward
      if (val.length === 2 && !val.includes('/')) {
        val = val + '/';
      } else if (val.length === 5 && /^\d{2}\/\d{2}$/.test(val)) {
        val = val + '/';
      }
    }

    prevRawLengthRef.current = val.length;
    setTextValue(val);

    if (val.trim() === '') {
      onChange('');
      return;
    }

    const parsed = parseSafeDate(val);
    if (parsed) {
      onChange(formatDateToISO(parsed));
    }
  };

  const handleTextFocus = () => {
    isEditingRef.current = true;
    prevRawLengthRef.current = textValue.length;
  };

  const handleTextBlur = () => {
    isEditingRef.current = false;
    const trimmed = textValue.trim();
    if (!trimmed) {
      setTextValue('');
      onChange('');
      return;
    }
    const parsed = parseSafeDate(trimmed);
    if (parsed) {
      const normalized = formatDateToDisplay(parsed);
      setTextValue(normalized);
      prevRawLengthRef.current = normalized.length;
      onChange(formatDateToISO(parsed));
    } else {
      // Revert to last valid selected date if input was incomplete/invalid
      const fallback = formatDateToDisplay(parseSafeDate(selected));
      setTextValue(fallback);
      prevRawLengthRef.current = fallback.length;
    }
  };

  const handleClear = () => {
    isEditingRef.current = false;
    setTextValue('');
    prevRawLengthRef.current = 0;
    onChange('');
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = textValue.trim();
      if (!trimmed) {
        onChange('');
      } else {
        const parsed = parseSafeDate(trimmed);
        if (parsed) {
          const normalized = formatDateToDisplay(parsed);
          setTextValue(normalized);
          prevRawLengthRef.current = normalized.length;
          const iso = formatDateToISO(parsed);
          onChange(iso);
        }
      }
    }
    onKeyDown?.(e);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    const iso = selectedDate ? formatDateToISO(selectedDate) : '';
    onConfirm?.(iso);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const inputElement = (
    <DateInputWrapper
      textValue={textValue}
      onTextChange={handleTextChange}
      onTextBlur={handleTextBlur}
      onTextFocus={handleTextFocus}
      onTextKeyDown={handleTextKeyDown}
      onClear={handleClear}
      onToggleCalendar={() => {
        if (disabled) return;
        setIsOpen((prev) => !prev);
      }}
      toggleBtnRef={toggleBtnRef}
      placeholder={placeholderText}
      className={className}
      style={style}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
    />
  );

  const calendarConfirmFooter = (
    <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color, #eee)', display: 'flex', gap: '0.5rem', justifyContent: 'center', backgroundColor: 'var(--modal-bg, #fff)' }}>
      {isMobile && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            background: 'var(--bg-secondary, #f1f5f9)',
            color: 'var(--text-primary, #334155)',
            border: '1px solid var(--border-color, #cbd5e1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          បិទ
        </button>
      )}
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
          flex: 1,
          fontSize: '1rem',
        }}
      >
        បញ្ជាក់
      </button>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {isMobile ? (
        <>
          {inputElement}
          {isOpen && typeof document !== 'undefined' && createPortal(
            <div
              id="date-picker-portal"
              onClick={() => setIsOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem',
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%' }}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleCalendarChange}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                >
                  {calendarConfirmFooter}
                </DatePicker>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <DatePicker
          disabled={disabled}
          ref={datePickerRef}
          selected={selectedDate}
          onChange={handleCalendarChange}
          open={isOpen}
          preventOpenOnFocus={true}
          onClickOutside={(e: MouseEvent) => {
            if (toggleBtnRef.current && toggleBtnRef.current.contains(e.target as Node)) {
              return;
            }
            setIsOpen(false);
          }}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholderText}
          customInput={inputElement}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          shouldCloseOnSelect={false}
          portalId="date-picker-portal"
        >
          {calendarConfirmFooter}
        </DatePicker>
      )}
      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 999999 !important;
        }
        .react-datepicker__portal {
          z-index: 999999 !important;
          background-color: rgba(0, 0, 0, 0.55) !important;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker {
          font-family: inherit;
          border: 1px solid var(--border-color, #e2e8f0) !important;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.25) !important;
          background-color: var(--modal-bg, #fff) !important;
          overflow: hidden;
          max-width: calc(100vw - 16px);
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
          width: 2.35rem;
          line-height: 2.35rem;
          margin: 0.12rem;
        }
        @media (max-width: 400px) {
          .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
            width: 2rem;
            line-height: 2rem;
            margin: 0.1rem;
          }
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
