import React from 'react';

export type NavCategoryKey = 'core' | 'management' | 'resources' | 'system';

export interface NavItem {
  name: string;
  shortName: string;
  path: string;
  roles: string[];
  category: NavCategoryKey;
  tint: string;
  icon: React.ReactNode;
}

export const NAV_CATEGORY_LABELS: Record<NavCategoryKey, string> = {
  core: 'ទូទៅ & ប្រចាំថ្ងៃ',
  management: 'គ្រប់គ្រងសាលា',
  resources: 'មេរៀន & ឧបករណ៍',
  system: 'ប្រព័ន្ធ & ការកំណត់',
};

export const THEME_COLOR_OPTIONS = [
  { value: 'ocean', label: 'Ocean', swatch: '#3b82f6' },
  { value: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { value: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { value: 'amber', label: 'Amber', swatch: '#f59e0b' },
  { value: 'violet', label: 'Violet', swatch: '#8b5cf6' },
];

export type StyleThemeKey = 'classic' | 'glass' | 'minimal' | 'vibrant';

export const STYLE_THEME_OPTIONS: {
  value: StyleThemeKey;
  label: string;
  desc: string;
  preview: string;
}[] = [
  {
    value: 'classic',
    label: 'ស្តង់ដារ',
    desc: 'ទំនើប និងមានតុល្យភាព',
    preview: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
  },
  {
    value: 'glass',
    label: 'Glass កញ្ចក់',
    desc: 'ថ្លាឆ្វេងបែប Glassmorphism',
    preview: 'linear-gradient(135deg, rgba(56, 189, 248, 0.75), rgba(168, 85, 247, 0.75))',
  },
  {
    value: 'minimal',
    label: 'Minimal សាមញ្ញ',
    desc: 'ស្អាត ស្រាល គ្មានភាពរញ៉េរញ៉ៃ',
    preview: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
  },
  {
    value: 'vibrant',
    label: 'ចម្រុះពណ៌',
    desc: 'ពណ៌ស្រស់ឆើត និងទាន់សម័យ',
    preview: 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)',
  },
];

export const NAV_LINKS: NavItem[] = [
  {
    name: 'ទំព័រដើម',
    shortName: 'ទំព័រដើម',
    path: '/dashboard',
    roles: ['student', 'teacher', 'admin'],
    category: 'core',
    tint: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'ថ្នាក់រៀន',
    shortName: 'ថ្នាក់រៀន',
    path: '/dashboard/classes',
    roles: ['teacher', 'admin'],
    category: 'core',
    tint: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    name: 'បញ្ចូលពិន្ទុ',
    shortName: 'ពិន្ទុ',
    path: '/dashboard/scores',
    roles: ['student', 'teacher', 'admin'],
    category: 'core',
    tint: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    name: 'វត្តមាន',
    shortName: 'វត្តមាន',
    path: '/dashboard/attendance',
    roles: ['teacher', 'admin'],
    category: 'core',
    tint: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'កាលវិភាគ',
    shortName: 'កាលវិភាគ',
    path: '/dashboard/schedule',
    roles: ['student', 'teacher', 'admin'],
    category: 'core',
    tint: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    name: 'ការបង់ប្រាក់',
    shortName: 'បង់ប្រាក់',
    path: '/dashboard/payments',
    roles: ['admin'],
    category: 'management',
    tint: '#16a34a',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    name: 'សិស្ស',
    shortName: 'សិស្ស',
    path: '/dashboard/students',
    roles: ['admin'],
    category: 'management',
    tint: '#0ea5e9',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: 'ព័ត៌មានគ្រូ',
    shortName: 'គ្រូបង្រៀន',
    path: '/dashboard/teachers',
    roles: ['admin', 'teacher'],
    category: 'management',
    tint: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: 'តាមដានការងារគ្រូ',
    shortName: 'តាមដានគ្រូ',
    path: '/dashboard/teacher-tracking',
    roles: ['admin'],
    category: 'management',
    tint: '#0d9488',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    name: 'វគ្គសិក្សា',
    shortName: 'វគ្គសិក្សា',
    path: '/dashboard/courses',
    roles: ['student', 'teacher', 'admin'],
    category: 'management',
    tint: '#ec4899',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    name: 'មេរៀន & វិធីសាស្ត្រ',
    shortName: 'មេរៀន',
    path: '/dashboard/lessons',
    roles: ['student', 'teacher', 'admin'],
    category: 'resources',
    tint: '#f97316',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: 'ឧបករណ៍',
    shortName: 'ឧបករណ៍',
    path: '/dashboard/tools',
    roles: ['teacher', 'admin'],
    category: 'resources',
    tint: '#14b8a6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: 'ធនធាន',
    shortName: 'ធនធាន',
    path: '/dashboard/resources',
    roles: ['teacher', 'admin'],
    category: 'resources',
    tint: '#a855f7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    name: 'សំណព្វចិត្ត',
    shortName: 'សំណព្វ',
    path: '/dashboard/favorites',
    roles: ['student', 'teacher', 'admin'],
    category: 'resources',
    tint: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    name: 'គ្រប់គ្រងផុស',
    shortName: 'ផុស',
    path: '/dashboard/posts',
    roles: ['admin'],
    category: 'system',
    tint: '#0284c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: 'ការកំណត់',
    shortName: 'កំណត់',
    path: '/dashboard/settings',
    roles: ['admin'],
    category: 'system',
    tint: '#64748b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function isNavPathActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/dashboard') return pathname === '/dashboard';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function getPrimaryMobilePaths(role: string): string[] {
  if (role === 'admin') {
    return ['/dashboard', '/dashboard/students', '/dashboard/payments', '/dashboard/scores'];
  }
  if (role === 'teacher') {
    return ['/dashboard', '/dashboard/classes', '/dashboard/attendance', '/dashboard/scores', '/dashboard/lessons'];
  }
  return ['/dashboard', '/dashboard/scores', '/dashboard/lessons', '/dashboard/schedule'];
}
