"use client";
import { useState, useEffect } from 'react';
import { classService, studentService } from '@/services/db';
import SpinningWheel from '@/components/SpinningWheel';
import GroupGenerator from '@/components/GroupGenerator';

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'picker' | 'groups'>('picker');
  
  // Data State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Name List State
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Fetch classes for dropdown
    const currentRole = localStorage.getItem('userRole');
    const teacherProfileId = localStorage.getItem('teacherProfileId');
    const currentUserId = localStorage.getItem('userId');
    const currentUserName = localStorage.getItem('userName');

    const unsubClasses = classService.subscribeAll(data => {
      if (currentRole === 'admin') {
        setClasses(data);
      } else {
        setClasses(data.filter((c: any) => c.teacherId === teacherProfileId || c.teacherId === currentUserId || c.teacherName === currentUserName));
      }
    });

    // Load saved names from localStorage to remember across sessions
    const savedNames = localStorage.getItem('toolNamesList');
    if (savedNames) {
      try {
        setNames(JSON.parse(savedNames));
      } catch (e) {}
    }

    return () => unsubClasses();
  }, []);

  // Save names to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('toolNamesList', JSON.stringify(names));
  }, [names]);

  const handleImportClass = async () => {
    if (!selectedClassId) return;
    setIsLoadingStudents(true);

    try {
      // Find the class to get studentIds (optional, or just fetch all students and filter by className)
      // The student model has `className` and the class model has `studentIds`.
      const selectedClass = classes.find(c => c.id === selectedClassId);
      
      // Fetch all students (Cache-first because of our optimization)
      // Since subscribeAll behaves as getDocs, we can just use getAll()
      const allStudents = await studentService.getAll();
      
      const classStudents = allStudents.filter(s => {
        return (selectedClass?.studentIds && selectedClass.studentIds.includes(s.id)) || s.className === selectedClass?.className;
      });

      // We might just want active students
      const activeStudents = classStudents.filter(s => s.status !== 'ឈប់សិក្សា' && s.status !== 'ព្យួរការសិក្សា');

      const studentNames = activeStudents.map(s => s.fullName || s.englishName).filter(Boolean);
      
      if (studentNames.length > 0) {
        // Merge without duplicates
        const newNamesList = Array.from(new Set([...names, ...studentNames]));
        setNames(newNamesList);
      } else {
        alert('មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ!');
      }
    } catch (error) {
      console.error('Error importing students:', error);
      alert('មានបញ្ហាក្នុងការទាញយកទិន្នន័យសិស្ស');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (!names.includes(newName.trim())) {
        setNames([...names, newName.trim()]);
      }
      setNewName('');
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    setNames(names.filter(n => n !== nameToRemove));
  };

  const handleClearAll = () => {
    if (confirm('តើអ្នកពិតជាចង់លុបឈ្មោះទាំងអស់មែនទេ?')) {
      setNames([]);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => window.history.back()}
          className="btn" 
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}
          title="ត្រឡប់ក្រោយ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>កង់រង្វិល និងបែងចែកក្រុម</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>ឧបករណ៍ជ្រើសរើសសិស្សដោយចៃដន្យ និងបែងចែកក្រុម</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        
        {/* Sidebar: Name Management */}
        <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              បញ្ជីឈ្មោះ ({names.length})
            </h3>

            {/* Import from Class */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--main-bg)', padding: '1rem', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ទាញយកពីថ្នាក់រៀន</label>
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px' }}
              >
                <option value="">ជ្រើសរើសថ្នាក់...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
              </select>
              <button 
                onClick={handleImportClass} 
                disabled={!selectedClassId || isLoadingStudents}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                {isLoadingStudents ? 'កំពុងទាញយក...' : 'នាំចូលឈ្មោះសិស្ស'}
              </button>
            </div>

            {/* Add Manual Name */}
            <form onSubmit={handleAddName} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="វាយបញ្ចូលឈ្មោះថ្មី..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="input-field"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px' }}
              />
              <button type="submit" className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none' }}>
                បន្ថែម
              </button>
            </form>
          </div>

          {/* Names List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {names.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.7 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem' }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                មិនទាន់មានឈ្មោះទេ<br/>សូមបន្ថែមពីខាងលើ
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {names.map((name, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 1rem',
                    background: 'var(--main-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <button 
                      onClick={() => handleRemoveName(name)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                      title="លុបឈ្មោះនេះ"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Footer of Sidebar */}
          {names.length > 0 && (
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
               <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  លុបឈ្មោះទាំងអស់
               </button>
            </div>
          )}
        </div>

        {/* Main Workspace */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
            <button
              onClick={() => setActiveTab('picker')}
              style={{
                padding: '1.25rem 2rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'picker' ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === 'picker' ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'picker' ? 700 : 500,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
              កង់រង្វិល (Wheel)
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              style={{
                padding: '1.25rem 2rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'groups' ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === 'groups' ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'groups' ? 700 : 500,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              បែងចែកក្រុម (Groups)
            </button>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px' }}>
              {activeTab === 'picker' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SpinningWheel items={names} />
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="animate-fade-in">
                  <GroupGenerator items={names} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
