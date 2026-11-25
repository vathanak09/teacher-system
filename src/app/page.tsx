"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { settingsService } from '@/services/db';

const DEFAULT_FALLBACK_USERS = [
  { id: "1", username: "admin1", password: "123", role: "admin", name: "Admin User" },
];

function findMatchingUser(users: any[], inputUsername: string) {
  const clean = inputUsername.trim();
  if (!clean || !Array.isArray(users)) return null;
  return (
    users.find((u: any) => String(u?.username || '').trim() === clean) ||
    users.find((u: any) => String(u?.username || '').trim().toLowerCase() === clean.toLowerCase()) ||
    null
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [dbUsers, setDbUsers] = useState<any[]>(DEFAULT_FALLBACK_USERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLoadedUsersRef = useRef(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check auto-login
    if (localStorage.getItem('userRole')) {
      router.push('/dashboard');
      return;
    }

    const applySettingsData = (data: any) => {
      if (!data) return;
      if (data.schoolName) setSchoolName(data.schoolName);
      if (Array.isArray(data.appUsers) && data.appUsers.length > 0) {
        setDbUsers(data.appUsers);
        hasLoadedUsersRef.current = true;
      }
    };

    const unsub = settingsService.subscribeOne('global', (data) => {
      applySettingsData(data);
    });

    // Ensure fresh server read so recent password changes on another device take effect immediately
    settingsService.getFreshById('global')
      .then((freshData) => {
        if (freshData) {
          applySettingsData(freshData);
        } else {
          hasLoadedUsersRef.current = true;
        }
      })
      .catch((err: any) => {
        console.error("Failed to load settings:", err);
      });

    return () => unsub();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('សូមបញ្ចូលឈ្មោះគណនី និងលេខសម្ងាត់!');
      return;
    }

    setIsSubmitting(true);
    try {
      let activeUsers = dbUsers;
      let userByUsername = findMatchingUser(activeUsers, cleanUsername);

      // Re-fetch directly from Firestore server if users weren't loaded yet or credentials didn't match cached data
      const cachedMatchInvalid =
        !userByUsername || String(userByUsername.password ?? '') !== password;

      if (!hasLoadedUsersRef.current || cachedMatchInvalid) {
        try {
          const freshData = await settingsService.getFreshById('global');
          if (freshData) {
            if (freshData.schoolName) setSchoolName(freshData.schoolName);
            if (Array.isArray(freshData.appUsers) && freshData.appUsers.length > 0) {
              activeUsers = freshData.appUsers;
              setDbUsers(freshData.appUsers);
              hasLoadedUsersRef.current = true;
              userByUsername = findMatchingUser(activeUsers, cleanUsername);
            }
          }
        } catch (err: any) {
          console.error("Error refreshing user accounts during login:", err);
        }
      }

      if (userByUsername) {
        if (String(userByUsername.password ?? '') === password) {
          localStorage.setItem('userRole', userByUsername.role);
          localStorage.setItem('userName', userByUsername.name);
          localStorage.setItem('userId', userByUsername.id);
          router.push('/dashboard');
          return;
        }
        setError('លេខសម្ងាត់មិនត្រឹមត្រូវទេ!');
      } else {
        setError('មិនមានឈ្មោះគណនីនេះទេ!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="សាលាអន្តរជាតិប្រេនស្តម Logo" 
            style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '1rem' }}
          />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
            {schoolName}
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            ប្រព័ន្ធគ្រប់គ្រងសាលារៀន (BSIS)
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              ឈ្មោះគណនី (Username)
            </label>
            <input 
              type="text" 
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="input-field" 
              placeholder="បញ្ចូលឈ្មោះគណនីរបស់អ្នក" 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              លេខសម្ងាត់ (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                autoComplete="current-password"
                className="input-field" 
                placeholder="បញ្ចូលលេខសម្ងាត់របស់អ្នក" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', fontSize: '1.05rem', opacity: isSubmitting ? 0.75 : 1 }}>
            {isSubmitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ចូលប្រើប្រាស់'}
          </button>
        </form>
      </div>
    </div>
  );
}
