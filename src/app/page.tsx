"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Inter' }}>
            EduConnect
          </h2>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>ប្រព័ន្ធគ្រប់គ្រងគ្រូបង្រៀន</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              ឈ្មោះគណនី (Username)
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="ឧទាហរណ៍: admin, teacher, student" 
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

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', fontSize: '1.05rem' }}>
            ចូលប្រើប្រាស់
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>គណនីសាកល្បង (Demo):</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>អ្នកគ្រប់គ្រង (Admin):</span> <code>admin1 / 123</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>គ្រូបង្រៀន (Teacher):</span> <code>teacher1 / 123</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>សិស្ស (Student):</span> <code>student1 / 123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
