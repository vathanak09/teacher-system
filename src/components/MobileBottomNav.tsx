"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { convertDriveImageLink } from '@/utils/driveLink';
import {
  NAV_CATEGORY_LABELS,
  NavCategoryKey,
  NavItem,
  STYLE_THEME_OPTIONS,
  StyleThemeKey,
  THEME_COLOR_OPTIONS,
  getPrimaryMobilePaths,
  isNavPathActive,
} from './DashboardNavData';

interface MobileBottomNavProps {
  role: string;
  roleKhmer: string;
  userName: string | null;
  userPhoto: string | null;
  pathname: string;
  allowedLinks: NavItem[];
  isMenuOpen: boolean;
  barsHidden: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  themeColor: string;
  onChangeThemeColor: (color: string) => void;
  styleTheme: StyleThemeKey;
  onChangeStyleTheme: (style: StyleThemeKey) => void;
  onLogout: () => void;
}

const CATEGORY_ORDER: NavCategoryKey[] = ['core', 'management', 'resources', 'system'];

export default function MobileBottomNav({
  role,
  roleKhmer,
  userName,
  userPhoto,
  pathname,
  allowedLinks,
  isMenuOpen,
  barsHidden,
  onOpenMenu,
  onCloseMenu,
  theme,
  onToggleTheme,
  themeColor,
  onChangeThemeColor,
  styleTheme,
  onChangeStyleTheme,
  onLogout,
}: MobileBottomNavProps) {
  const primaryPaths = getPrimaryMobilePaths(role);
  const primaryItems = primaryPaths
    .map((path) => allowedLinks.find((item) => item.path === path))
    .filter((item): item is NavItem => Boolean(item));

  const isActiveInPrimary = primaryItems.some((item) => isNavPathActive(pathname, item.path));
  const isMoreHighlighted = isMenuOpen || !isActiveInPrimary;

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMenu();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen, onCloseMenu]);

  return (
    <>
      {/* Floating Colorful Thumb-Friendly Bottom Bar with Auto-Hide */}
      <nav
        className={`mobile-bottom-nav no-print ${barsHidden && !isMenuOpen ? 'bars-hidden' : ''}`}
        aria-label="Mobile Navigation"
        style={{ gridTemplateColumns: `repeat(${primaryItems.length + 1}, minmax(0, 1fr))` }}
      >
        {primaryItems.map((item) => {
          const active = isNavPathActive(pathname, item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onCloseMenu}
              className={`mobile-bottom-tab ${active ? 'active' : ''}`}
            >
              <span
                className="mobile-bottom-tab-icon"
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, ${item.tint}, ${item.tint}cc)`,
                        color: '#ffffff',
                        boxShadow: `0 4px 12px ${item.tint}55`,
                      }
                    : {
                        color: item.tint,
                        backgroundColor: `${item.tint}12`,
                      }
                }
              >
                {item.icon}
              </span>
              <span
                className="mobile-bottom-tab-label"
                style={active ? { color: item.tint, fontWeight: 700 } : undefined}
              >
                {item.shortName}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => (isMenuOpen ? onCloseMenu() : onOpenMenu())}
          className={`mobile-bottom-tab ${isMoreHighlighted ? 'active' : ''}`}
          aria-expanded={isMenuOpen}
          aria-label="ម៉ឺនុយទាំងអស់"
        >
          <span
            className="mobile-bottom-tab-icon"
            style={
              isMoreHighlighted
                ? {
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.45)',
                  }
                : {
                    color: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  }
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
            </svg>
          </span>
          <span
            className="mobile-bottom-tab-label"
            style={isMoreHighlighted ? { color: '#8b5cf6', fontWeight: 700 } : undefined}
          >
            ម៉ឺនុយ
          </span>
        </button>
      </nav>

      {/* Slide-Up App Grid Bottom Sheet */}
      {isMenuOpen && (
        <div
          className="mobile-sheet-backdrop no-print"
          onClick={onCloseMenu}
          role="dialog"
          aria-modal="true"
          aria-label="ម៉ឺនុយទាំងអស់"
        >
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-handle" />

            {/* Profile & Close Header */}
            <div className="mobile-sheet-header">
              <Link
                href={role === 'student' ? '/dashboard' : '/dashboard/teachers'}
                onClick={onCloseMenu}
                className="mobile-sheet-profile"
              >
                {userPhoto ? (
                  <img
                    src={convertDriveImageLink(userPhoto)}
                    alt={userName || ''}
                    className="mobile-sheet-avatar-img"
                  />
                ) : (
                  <div className="mobile-sheet-avatar-fallback">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="mobile-sheet-username">{userName || 'អ្នកប្រើប្រាស់'}</div>
                  <div className="mobile-sheet-role">{roleKhmer}</div>
                </div>
              </Link>

              <button
                type="button"
                onClick={onCloseMenu}
                className="mobile-sheet-close-btn"
                aria-label="បិទម៉ឺនុយ"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="mobile-sheet-body">
              {/* Categorized Large App Grid Tiles */}
              {CATEGORY_ORDER.map((cat) => {
                const items = allowedLinks.filter((item) => item.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="mobile-sheet-section">
                    <div className="mobile-sheet-section-title">
                      {NAV_CATEGORY_LABELS[cat]}
                    </div>
                    <div className="mobile-sheet-grid">
                      {items.map((item) => {
                        const active = isNavPathActive(pathname, item.path);
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={onCloseMenu}
                            className={`mobile-grid-tile ${active ? 'active' : ''}`}
                            style={
                              active
                                ? {
                                    borderColor: item.tint,
                                    background: `${item.tint}14`,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className="mobile-grid-tile-icon"
                              style={{
                                backgroundColor: active ? item.tint : `${item.tint}1c`,
                                color: active ? '#ffffff' : item.tint,
                                boxShadow: active ? `0 4px 12px ${item.tint}45` : undefined,
                              }}
                            >
                              {item.icon}
                            </span>
                            <span className="mobile-grid-tile-label">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Color Accent Swatches + Dark/Light Mode */}
              <div className="mobile-theme-bar">
                <div className="mobile-theme-swatches">
                  {THEME_COLOR_OPTIONS.map((opt) => {
                    const selected = themeColor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChangeThemeColor(opt.value)}
                        className={`mobile-swatch-btn ${selected ? 'selected' : ''}`}
                        style={{ backgroundColor: opt.swatch }}
                        title={opt.label}
                        aria-label={`ពណ៌ ${opt.label}`}
                      >
                        {selected && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="mobile-mode-pill"
                >
                  {theme === 'dark' ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                      <span>ភ្លឺ</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <span>ងងឹត</span>
                    </>
                  )}
                </button>
              </div>

              {/* UI Style Theme Selector (At the bottom) */}
              <div>
                <div className="mobile-sheet-section-title">រចនាបថ Theme កម្មវិធី</div>
                <div className="mobile-style-theme-grid">
                  {STYLE_THEME_OPTIONS.map((st) => {
                    const selected = styleTheme === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => onChangeStyleTheme(st.value)}
                        className={`mobile-style-card ${selected ? 'selected' : ''}`}
                      >
                        <span
                          className="mobile-style-preview"
                          style={{ background: st.preview }}
                        />
                        <span className="mobile-style-label">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Logout Footer */}
            <div className="mobile-sheet-footer">
              <button
                type="button"
                onClick={() => {
                  onCloseMenu();
                  onLogout();
                }}
                className="mobile-logout-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>ចាកចេញពីគណនី</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
