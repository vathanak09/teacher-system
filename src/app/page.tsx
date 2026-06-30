"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');
  const router = useRouter();

  useEffect(() => {
    // Initialize default users if they don't exist
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      const defaultUsers = [
        { id: '1', username: 'admin1', password: '123', role: 'admin', name: 'Admin User' },
        { id: '2', username: 'teacher1', password: '123', role: 'teacher', name: 'Teacher User' },
        { id: '3', username: 'student1', password: '123', role: 'student', name: 'Student User' },
      ];
      localStorage.setItem('appUsers', JSON.stringify(defaultUsers));
    }

    const storedSchool = localStorage.getItem('schoolName');
    if (storedSchool) {
      setSchoolName(storedSchool);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedUsers = JSON.parse(localStorage.getItem('appUsers') || '[]');
    const user = storedUsers.find((u: any) => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userId', user.id); // store ID for targeted notifications
      router.push('/dashboard');
    } else {
      setError('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត។');
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
            <input 
              type="password" 
              className="input-field" 
              placeholder="បញ្ចូលលេខសម្ងាត់របស់អ្នក" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
