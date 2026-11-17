"use client";
import { convertDriveImageLink } from '../../utils/driveLink';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { teacherService } from '@/services/db';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  NAV_CATEGORY_LABELS,
  NAV_LINKS,
  NavCategoryKey,
  THEME_COLOR_OPTIONS,
  isNavPathActive,
} from '@/components/DashboardNavData';

const CATEGORY_ORDER: NavCategoryKey[] = ['core', 'management', 'resources', 'system'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [themeColor, setThemeColor] = useState<string>('ocean');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedName = localStorage.getItem('userName');

    if (!storedRole) {
      router.push('/');
    } else {
      setRole(storedRole);
      setUserName(storedName);
    }

    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }

    const storedSchool = localStorage.getItem('schoolName');
    if (storedSchool) {
      setSchoolName(storedSchool);
    }

    const savedColor = localStorage.getItem('theme-color') || 'ocean';
    setThemeColor(savedColor);
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add('theme-' + savedColor);

    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(savedCollapsed);

    // Fetch user profile from teachers collection if applicable
    const userId = localStorage.getItem('userId');
    const currentRole = localStorage.getItem('userRole');
    if (currentRole === 'teacher' || currentRole === 'admin') {
      const unsubscribe = teacherService.subscribeAll((teachers) => {
        let foundProfile = null;
        teachers.forEach((data: any) => {
          if (data.linkedUserId === userId || data.fullName === storedName) {
            foundProfile = data;
          }
        });
        if (foundProfile) {
          setUserPhoto((foundProfile as any).photo || null);
          localStorage.setItem('teacherProfileId', (foundProfile as any).id);
        } else {
          setUserPhoto(null);
          localStorage.removeItem('teacherProfileId');
        }
      });
      return () => unsubscribe();
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeColorChange = (newTheme: string) => {
    setThemeColor(newTheme);
    localStorage.setItem('theme-color', newTheme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add('theme-' + newTheme);
  };

  const toggleSidebarCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('teacherProfileId');
    router.push('/');
  };

  if (!role) return null;

  const roleKhmer = role === 'admin' ? 'អ្នកគ្រប់គ្រង' : role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស';
  const allowedLinks = NAV_LINKS.filter((link) => link.roles.includes(role));
  const currentNavItem = allowedLinks.find((item) => isNavPathActive(pathname, item.path));

  return (
    <ConfirmProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {/* Compact Responsive Mobile Header */}
        <header className="mobile-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            <button
              type="button"
              className="mobile-header-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="បើកម៉ឺនុយ"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="17" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mobile-header-title">
                {currentNavItem?.name || schoolName}
              </div>
              <div className="mobile-header-subtitle">{schoolName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="mobile-header-icon-btn"
              title="ប្តូរពន្លឺ (Theme)"
              aria-label="ប្តូរពន្លឺ"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {role === 'student' ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="mobile-header-avatar-btn"
                aria-label="គណនី និងម៉ឺនុយ"
              >
                {userPhoto ? (
                  <img src={convertDriveImageLink(userPhoto)} alt={userName || ''} className="mobile-header-avatar-img" />
                ) : (
                  <span className="mobile-header-avatar-fallback">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/dashboard/teachers"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-header-avatar-btn"
                aria-label="ព័ត៌មានគ្រូ និងប្រវត្តិរូប"
              >
                {userPhoto ? (
                  <img src={convertDriveImageLink(userPhoto)} alt={userName || ''} className="mobile-header-avatar-img" />
                ) : (
                  <span className="mobile-header-avatar-fallback">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Categorized Collapsible Desktop Sidebar */}
          <aside className={`desktop-sidebar no-print ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div className="sidebar-brand-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                {!sidebarCollapsed && (
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {schoolName}
                    </h2>
                    <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.78 }}>ប្រព័ន្ធគ្រប់គ្រង</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="sidebar-collapse-btn"
                title={sidebarCollapsed ? 'ពង្រីក Sidebar' : 'បង្រួម Sidebar'}
                aria-label={sidebarCollapsed ? 'ពង្រីក Sidebar' : 'បង្រួម Sidebar'}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <div className="user-profile">
              <Link
                href={role === 'student' ? '/dashboard' : '/dashboard/teachers'}
                title={userName || ''}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                {userPhoto ? (
                  <img
                    src={convertDriveImageLink(userPhoto)}
                    alt={userName || ''}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}>
                    {userName?.charAt(0).toUpperCase()}
                  </div>
                )}
                {!sidebarCollapsed && (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.96rem', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.78 }}>{roleKhmer}</div>
                  </div>
                )}
              </Link>
            </div>

            <nav className="nav-menu">
              {CATEGORY_ORDER.map((cat) => {
                const items = allowedLinks.filter((item) => item.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="nav-group">
                    {!sidebarCollapsed && (
                      <div className="nav-group-label">{NAV_CATEGORY_LABELS[cat]}</div>
                    )}
                    {items.map((link) => {
                      const isActive = isNavPathActive(pathname, link.path);
                      return (
                        <Link
                          key={link.path}
                          href={link.path}
                          title={link.name}
                          className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                          {link.icon}
                          {!sidebarCollapsed && <span className="nav-link-text">{link.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="sidebar-footer">
              <button
                type="button"
                className="nav-link"
                style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
                title="ចាកចេញ"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {!sidebarCollapsed && <span>ចាកចេញ</span>}
              </button>
            </div>
          </aside>

          <main className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="top-header no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CustomSelectDropdown
                  value={themeColor}
                  onChange={handleThemeColorChange}
                  searchable={false}
                  menuMinWidth={150}
                  style={{ width: 'auto', minWidth: '115px', padding: '0.4rem 0.75rem', background: 'var(--bg-secondary)' }}
                  options={THEME_COLOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
                <button onClick={toggleTheme} className="theme-toggle-btn" title="ប្តូរពណ៌ (Theme)">
                  {theme === 'dark' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="dashboard-content">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar + Slide-Up App Grid Sheet */}
        <MobileBottomNav
          role={role}
          roleKhmer={roleKhmer}
          userName={userName}
          userPhoto={userPhoto}
          pathname={pathname}
          allowedLinks={allowedLinks}
          isMenuOpen={mobileMenuOpen}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onCloseMenu={() => setMobileMenuOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          themeColor={themeColor}
          onChangeThemeColor={handleThemeColorChange}
          onLogout={handleLogout}
        />
      </div>
    </ConfirmProvider>
  );
}
