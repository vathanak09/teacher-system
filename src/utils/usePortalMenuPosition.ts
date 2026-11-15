"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

interface UsePortalMenuPositionOptions {
  isOpen: boolean;
  onClose: () => void;
  minWidth?: number;
  maxPreferredHeight?: number;
  preferAlignRight?: boolean;
}

export function usePortalMenuPosition({
  isOpen,
  onClose,
  minWidth = 220,
  maxPreferredHeight = 320,
  preferAlignRight = false,
}: UsePortalMenuPositionOptions) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [maxListHeight, setMaxListHeight] = useState<number>(maxPreferredHeight);

  const computePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    const vvTop = vv ? vv.offsetTop : 0;

    const menuWidth = Math.min(Math.max(rect.width, minWidth), Math.max(180, vw - 16));
    const maxLeft = Math.max(8, vw - menuWidth - 8);
    const desiredLeft = preferAlignRight ? rect.right - menuWidth : rect.left;
    const left = Math.min(Math.max(8, desiredLeft), maxLeft);

    const spaceBelow = Math.max(0, (vvTop + vh) - rect.bottom - 10);
    const spaceAbove = Math.max(0, rect.top - vvTop - 10);
    const openUpward = spaceBelow < Math.min(200, maxPreferredHeight) && spaceAbove > spaceBelow;
    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    const clampedHeight = Math.max(140, Math.min(maxPreferredHeight, availableSpace));

    setMaxListHeight(clampedHeight);
    setMenuStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${menuWidth}px`,
      maxWidth: 'calc(100vw - 16px)',
      ...(openUpward
        ? { bottom: `${window.innerHeight - rect.top + 6}px`, top: 'auto' }
        : { top: `${rect.bottom + 6}px`, bottom: 'auto' }),
      zIndex: 20000,
    });
  }, [minWidth, maxPreferredHeight, preferAlignRight]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    computePosition();

    const handleReposition = (e: Event) => {
      if (e.target && menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      computePosition();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    window.visualViewport?.addEventListener('resize', handleReposition);
    window.visualViewport?.addEventListener('scroll', handleReposition);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      window.visualViewport?.removeEventListener('resize', handleReposition);
      window.visualViewport?.removeEventListener('scroll', handleReposition);
    };
  }, [isOpen, computePosition]);

  return {
    containerRef,
    triggerRef,
    menuRef,
    menuStyle,
    maxListHeight,
    computePosition,
  };
}
