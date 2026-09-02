"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { settingsService } from '@/services/db';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const [dbUsers, setDbUsers] = useState<any[]>([{ id: "1", username: "admin1", password: "123", role: "admin", name: "Admin User" }]);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check auto-login
    if (localStorage.getItem('userRole')) {
      router.push('/dashboard');
      return;
    }

    const fetchSettings = async () => {
      try {
        const data = await settingsService.getById('global');
        if (data) {
          if (data.appUsers) setDbUsers(data.appUsers);
          if (data.schoolName) setSchoolName(data.schoolName);
        } else {
          // Default admin if nothing exists in Firebase
          setDbUsers([{ id: '1', username: 'admin1', password: '123', role: 'admin', name: 'Admin User' }]);
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        setError("Error loading users: " + err.message);
        setDbUsers([{ id: '1', username: 'admin1', password: '123', role: 'admin', name: 'Admin User' }]);
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userByUsername = dbUsers.find((u: any) => u.username === username);

    if (userByUsername) {
      if (userByUsername.password === password) {
        localStorage.setItem('userRole', userByUsername.role);
        localStorage.setItem('userName', userByUsername.name);
        localStorage.setItem('userId', userByUsername.id); // store ID for targeted notifications
        router.push('/dashboard');
      } else {
        setError('លេខសម្ងាត់មិនត្រឹមត្រូវទេ!');
      }
    } else {
      setError('មិនមានឈ្មោះគណនីនេះទេ!');
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
              className="input-field" 
              placeholder="ឧទាហរណ៍: admin1, teacher1" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              លេខសម្ងាត់ (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field" 
                placeholder="បញ្ចូលលេខសម្ងាត់របស់អ្នក" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', fontSize: '1.05rem' }}>
            ចូលប្រើប្រាស់
          </button>
        </form>
      </div>
    </div>
  );
}
