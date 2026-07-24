"use client";
import { useState, useEffect } from 'react';
import { classService, studentService } from '@/services/db';
import SpinningWheel from '@/components/SpinningWheel';
import GroupGenerator from '@/components/GroupGenerator';
import RaceVisualizer from '@/components/RaceVisualizer';

export default function RandomizerPage() {
  const [activeTab, setActiveTab] = useState<'picker' | 'race' | 'groups'>('picker');
  
  // Data State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Name List State
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [removeWinner, setRemoveWinner] = useState(false);
  
  // Mobile Sidebar Toggle
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    const savedNames = localStorage.getItem('toolNamesList');
    if (savedNames) {
      try { setNames(JSON.parse(savedNames)); } catch (e) {}
    }
    const savedHistory = localStorage.getItem('toolHistoryList');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }

    return () => unsubClasses();
  }, []);

  useEffect(() => {
    localStorage.setItem('toolNamesList', JSON.stringify(names));
  }, [names]);
  
  useEffect(() => {
    localStorage.setItem('toolHistoryList', JSON.stringify(history));
  }, [history]);

  const handleImportClass = async () => {
    if (!selectedClassId) return;
    setIsLoadingStudents(true);

    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const allStudents = await studentService.getAll();
      const classStudents = allStudents.filter(s => {
        return (selectedClass?.studentIds && selectedClass.studentIds.includes(s.id)) || s.className === selectedClass?.className;
      });
      const activeStudents = classStudents.filter(s => s.status !== 'ឈប់សិក្សា' && s.status !== 'ព្យួរការសិក្សា');
      const studentNames = activeStudents.map(s => s.fullName || s.englishName).filter(Boolean);
      
      if (studentNames.length > 0) {
        const newNamesList = Array.from(new Set([...names, ...studentNames]));
        setNames(newNamesList);
      } else {
        alert('មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ!');
      }
    } catch (error) {
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
  
  const handleRestoreName = (nameToRestore: string) => {
    if (!names.includes(nameToRestore)) {
      setNames([...names, nameToRestore]);
    }
    setHistory(history.filter(n => n !== nameToRestore));
  };

  const handleClearAll = () => {
    if (confirm('តើអ្នកពិតជាចង់លុបឈ្មោះទាំងអស់មែនទេ?')) {
      setNames([]);
    }
  };
  
  const handleClearHistory = () => {
    if (confirm('តើអ្នកពិតជាចង់លុបប្រវត្តិទាំងអស់មែនទេ?')) {
      setHistory([]);
    }
  };

  const handleWinnerSelected = (winnerName: string) => {
    // Add to history
    setHistory(prev => [winnerName, ...prev]);
    
    // Remove if requested
    if (removeWinner) {
      setNames(prev => prev.filter(n => n !== winnerName));
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : 'calc(100vh - 100px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => window.history.back()}
          className="btn" 
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}
          title="ត្រឡប់ក្រោយ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', color: 'var(--text-primary)' }}>ឧបករណ៍បែងចែកសិស្ស</h1>
        </div>
        {isMobile && (
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem' }}
          >
            {showSidebar ? 'លាក់បញ្ជីឈ្មោះ' : 'បង្ហាញបញ្ជីឈ្មោះ'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Sidebar: Name Management */}
        {showSidebar && (
          <div className="glass-panel" style={{ width: isMobile ? '100%' : '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, height: isMobile ? '500px' : 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  រង់ចាំ ({names.length})
                </h3>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  រួចរាល់ ({history.length})
                </h3>
              </div>

              {/* Settings & Import */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', background: 'var(--main-bg)', padding: '0.75rem', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ទាញយកពីថ្នាក់រៀន</label>
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px' }}
                >
                  <option value="">ជ្រើសរើសថ្នាក់...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.teacherName || 'គ្មានគ្រូ'}</option>
                  ))}
                </select>
                <button 
                  onClick={handleImportClass} 
                  disabled={!selectedClassId || isLoadingStudents}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {isLoadingStudents ? 'កំពុងទាញយក...' : 'នាំចូលឈ្មោះសិស្ស'}
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} />
                <span style={{ color: 'var(--text-primary)' }}>ដកឈ្មោះចេញក្រោយពេលជ្រើសរើសរួច</span>
              </label>

              {/* Add Manual Name */}
              <form onSubmit={handleAddName} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="បន្ថែមឈ្មោះថ្មី..."
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

            {/* Names Lists */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>បញ្ជីរង់ចាំ (មិនទាន់ហៅ)</div>
                {names.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>គ្មានឈ្មោះសិស្សរង់ចាំទេ</div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {names.map((name, index) => (
                      <li key={`wait-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'var(--main-bg)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.95rem' }}>{name}</span>
                        <button onClick={() => handleRemoveName(name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {names.length > 0 && (
                  <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', textDecoration: 'underline' }}>
                    លុបបញ្ជីរង់ចាំទាំងអស់
                  </button>
                )}
              </div>
              
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>អ្នកជាប់ឆ្នោត (ហៅរួចរាល់)</div>
                {history.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>មិនទាន់មាននរណាម្នាក់ជាប់ឆ្នោតទេ</div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {history.map((name, index) => (
                      <li key={`hist-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '0.95rem', textDecoration: 'line-through' }}>{name}</span>
                        <button onClick={() => handleRestoreName(name)} title="យកត្រឡប់ទៅបញ្ជីរង់ចាំវិញ" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {history.length > 0 && (
                  <button onClick={handleClearHistory} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', textDecoration: 'underline' }}>
                    លុបប្រវត្តិទាំងអស់
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setActiveTab('picker')}
              style={{
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'picker' ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === 'picker' ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'picker' ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
              កង់រង្វិល
            </button>
            <button
              onClick={() => setActiveTab('race')}
              style={{
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'race' ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === 'race' ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'race' ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              ការរត់ប្រណាំង
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              style={{
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'groups' ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === 'groups' ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'groups' ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              បែងចែកក្រុម
            </button>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px' }}>
              {activeTab === 'picker' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SpinningWheel items={names} onWinner={handleWinnerSelected} />
                </div>
              )}

              {activeTab === 'race' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <RaceVisualizer items={names} onWinner={handleWinnerSelected} />
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
