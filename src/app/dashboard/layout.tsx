"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot } from 'firebase/firestore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
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
    document.body.classList.add('theme-' + savedColor);
    
    // Fetch user profile from teachers collection if applicable
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (role === 'teacher' || role === 'admin') {
      const unsubscribe = onSnapshot(collection(db, 'teachers'), (snapshot) => {
        let foundProfile = null;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.linkedUserId === userId || data.fullName === storedName) {
            foundProfile = { id: doc.id, ...data };
          }
        });
        if (foundProfile) {
          setUserPhoto((foundProfile as any).photo || null);
          setProfileId((foundProfile as any).id);
        } else {
          setUserPhoto(null);
          setProfileId(null);
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

  if (!role) return null;

  const roleKhmer = role === 'admin' ? 'អ្នកគ្រប់គ្រង' : role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស';

  const navLinks = [
    { name: 'ទំព័រដើម', path: '/dashboard', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> },
    { name: 'សិស្ស', path: '/dashboard/students', roles: ['admin', 'teacher'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { name: 'ការបង់ប្រាក់', path: '/dashboard/payments', roles: ['admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> },
    { name: 'ព័ត៌មានគ្រូ', path: '/dashboard/teachers', roles: ['admin', 'teacher'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { name: 'ថ្នាក់រៀន', path: '/dashboard/classes', roles: ['teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> },
    { name: 'វគ្គសិក្សា', path: '/dashboard/courses', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
    { name: 'មេរៀន', path: '/dashboard/lessons', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
    { name: 'កាលវិភាគ', path: '/dashboard/schedule', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
    { name: 'វត្តមាន', path: '/dashboard/attendance', roles: ['teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { name: 'ពិន្ទុ', path: '/dashboard/scores', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
    { name: 'វិធីសាស្ត្រ', path: '/dashboard/methodologies', roles: ['teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    { name: 'ឧបករណ៍', path: '/dashboard/tools', roles: ['teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> },
    { name: 'សំណព្វចិត្ត', path: '/dashboard/favorites', roles: ['student', 'teacher', 'admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> },
    { name: 'សារ (Messages)', path: '/dashboard/messages', roles: ['admin', 'teacher'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> },
    { name: 'គ្រប់គ្រងផុស', path: '/dashboard/posts', roles: ['admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { name: 'ការកំណត់', path: '/dashboard/settings', roles: ['admin'], icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> }
  ];

  const allowedLinks = navLinks.filter(link => link.roles.includes(role));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setMobileMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h3 style={{ margin: 0, fontWeight: 600 }}>{schoolName}</h3>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn" style={{ width: '32px', height: '32px' }} title="ប្តូរពន្លឺ (Theme)">
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {mobileMenuOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside className={`desktop-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              <div>
                <h2 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>{schoolName}</h2>
                <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}>ប្រព័ន្ធគ្រប់គ្រង</p>
              </div>
            </div>
            {mobileMenuOpen && (
              <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setMobileMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>

          <div className="user-profile" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Link href="/dashboard/teachers" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
              {userPhoto ? (
                <img src={userPhoto} alt={userName || ''} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold' }}>{userName?.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }}>{userName}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{roleKhmer}</div>
              </div>
            </Link>
          </div>

          <nav className="nav-menu">
            {allowedLinks.map(link => {
              const isActive = pathname === link.path;
              return (
                <Link key={link.path} href={link.path} className={`nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  {link.icon}
                  {link.name}
                </Link>
              )
            })}
          </nav>

          <div className="sidebar-footer">
            <button className="nav-link" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }} onClick={() => {
              localStorage.removeItem('userRole');
              localStorage.removeItem('userName');
              router.push('/');
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              ចាកចេញ
            </button>
          </div>
        </aside>

        <main className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={typeof window !== 'undefined' ? localStorage.getItem('theme-color') || 'ocean' : 'ocean'}
                onChange={(e) => {
                  const newTheme = e.target.value;
                  localStorage.setItem('theme-color', newTheme);
                  document.body.className = document.body.className.replace(/theme-\w+/, '');
                  document.body.classList.add('theme-' + newTheme);
                }}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="ocean">Ocean</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
                <option value="amber">Amber</option>
                <option value="violet">Violet</option>
              </select>
              <button onClick={toggleTheme} className="theme-toggle-btn" title="ប្តូរពណ៌ (Theme)">
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
              </button>
            </div>
          </div>
          <div className="dashboard-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
