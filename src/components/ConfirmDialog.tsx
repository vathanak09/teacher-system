"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

type ConfirmFn = (options: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const [mounted, setMounted] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  const closeWith = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    const normalized: ConfirmOptions =
      typeof options === 'string' ? { message: options } : options;
    setDialog({ ...normalized, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!dialog?.open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeWith(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        closeWith(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog?.open, closeWith]);

  const variant = dialog?.variant || 'danger';
  const accentColor =
    variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#f59e0b' : 'var(--primary-color)';
  const accentBg =
    variant === 'danger'
      ? 'rgba(239, 68, 68, 0.12)'
      : variant === 'warning'
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(59, 130, 246, 0.12)';
  const confirmButtonBg =
    variant === 'danger'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : variant === 'warning'
      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
      : 'var(--primary-color)';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {mounted &&
        dialog?.open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => closeWith(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 30000,
            }}
          >
            <div
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: accentBg,
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {variant === 'info' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: '0 0 0.4rem 0',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {dialog.title || 'បញ្ជាក់សកម្មភាព'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      lineHeight: 1.55,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {dialog.message}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.35rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => closeWith(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  {dialog.cancelText || 'បោះបង់'}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeWith(true)}
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: confirmButtonBg,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow:
                      variant === 'danger'
                        ? '0 4px 12px rgba(239, 68, 68, 0.25)'
                        : '0 4px 12px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  {dialog.confirmText || 'យល់ព្រម'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}
