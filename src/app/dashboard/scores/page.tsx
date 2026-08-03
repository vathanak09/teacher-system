"use client";
import { useEffect, useState, useRef } from 'react';
import { classService, studentService, scoreService, settingsService } from '@/services/db';
import SortDropdown from '@/components/SortDropdown';

export default function ScoresPage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [teacherProfileId, setTeacherProfileId] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]); // Global live students
  const [scores, setScores] = useState<any[]>([]); // Snapshot score records for the selected month/class
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Format: YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  
  // Settings
  const [settings, setSettings] = useState<any>({
    maxSubjects: 1,
    gradeA: 90,
    gradeB: 80,
    gradeC: 70,
    gradeD: 60,
    gradeE: 50
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);
  const clearDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clearDropdownRef.current && !clearDropdownRef.current.contains(event.target as Node)) {
        setIsClearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearColumn = async (columnKey: string, columnName: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបពិន្ទុ ${columnName} ទាំងអស់មែនទេ?`)) return;
    setIsClearDropdownOpen(false);
    const updatedScores = scores.map(s => ({ ...s, [columnKey]: '' }));
    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.updateScore(s.id, s)));
  };

  useEffect(() => { 
    setRole(localStorage.getItem('userRole') || ''); 
    setUserId(localStorage.getItem('userId') || '');
    setUserName(localStorage.getItem('userName') || '');
    setTeacherProfileId(localStorage.getItem('teacherProfileId') || '');
    
    // Fetch Settings
    const unsubSettings = settingsService.subscribeOne('scoreSettings', (data) => {
      if (data) {
        setSettings(data);
      }
    });

    const unsubClasses = classService.subscribeAll((data: any[]) => {
      const activeClasses = data.filter((c: any) => c.status !== 'បានបញ្ចប់');
      setClasses(activeClasses);
    });

    const unsubStudents = studentService.subscribeAll((data: any[]) => {
      setAllStudents(data);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubStudents();
    };
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const unsubScores = scoreService.subscribeAll((data: any[]) => {
        const filteredScores = data.filter((s: any) => s.classId === selectedClassId && s.month === selectedMonth);
        setScores(filteredScores);
      });

      return () => {
        unsubScores();
      };
    }
  }, [selectedClassId, selectedMonth]);

  // Derived filtered classes
  const displayClasses = role === 'admin' 
    ? classes 
    : classes.filter(c => c.teacherId === teacherProfileId || c.teacherId === userId || c.teacherName === userName);

  const calculateAutoGrade = (average: number) => {
    if (average >= settings.gradeA) return 'A';
    if (average >= settings.gradeB) return 'B';
    if (average >= settings.gradeC) return 'C';
    if (average >= settings.gradeD) return 'D';
    if (average >= settings.gradeE) return 'E';
    return 'F';
  };

  const calculateRemarks = (grade: string) => {
    switch (grade) {
      case 'A': return 'ល្អណាស់';
      case 'B': return 'ល្អ';
      case 'C': return 'ល្អបង្គួរ';
      case 'D': return 'មធ្យម';
      case 'E': return 'ខ្សោយ';
      case 'F': return 'ខ្សោយណាស់';
      default: return '';
    }
  };

  const handleScoreChange = async (scoreRec: any, field: string, value: string) => {
    const updatedScore = { ...scoreRec, [field]: value };
    
    // Auto calculate if a subject changes
    const subjects = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
    if (subjects.includes(field)) {
      let total = 0;
      let hasAnyValue = false;
      subjects.forEach(sub => {
        const val = updatedScore[sub];
        if (val && !isNaN(parseFloat(val))) {
          total += parseFloat(val);
          hasAnyValue = true;
        }
      });
      
      if (hasAnyValue) {
        updatedScore.totalScore = total.toString();
        const avgNum = total / (Number(settings.maxSubjects) || 1);
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.totalScore = '';
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    // Auto Calculate Average & Grade if totalScore changes manually
    if (field === 'totalScore') {
      const totalNum = parseFloat(value);
      if (!isNaN(totalNum)) {
        const avgNum = totalNum / (Number(settings.maxSubjects) || 1);
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    if (updatedScore.id) {
      await scoreService.update(updatedScore.id, updatedScore);
    }
  };

  const recalculateRanks = async () => {
    const scoredStudents = scores.filter(s => s.totalScore !== '' && !isNaN(parseFloat(s.totalScore)));
    
    // Sort descending by totalScore
    scoredStudents.sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));
    
    let currentRank = 1;
    let currentScore = -1;
    let offset = 0;

    for (let i = 0; i < scoredStudents.length; i++) {
      const s = scoredStudents[i];
      const scoreNum = parseFloat(s.totalScore);
      
      if (scoreNum !== currentScore) {
        currentRank = i + 1;
        currentScore = scoreNum;
      }
      
      if (s.id && s.rank !== currentRank.toString()) {
        await scoreService.update(s.id, { rank: currentRank.toString() });
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, startStudentIndex: number, field: string) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const rows = pasteText.split(/\r?\n/);
    
    for (let i = 0; i < rows.length; i++) {
      const val = rows[i].trim();
      const studentIndex = startStudentIndex + i;
      if (studentIndex < scores.length && val !== '') {
        await handleScoreChange(scores[studentIndex], field, val);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.add(settings, 'scoreSettings');
    setIsSettingsModalOpen(false);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const importStudentsFromClass = async () => {
    if (!selectedClass) return;
    
    // Find all live students that belong to this class
    const classStudentIds = selectedClass.studentIds || (selectedClass.studentsData ? selectedClass.studentsData.map((s: any) => s.id) : []);
    const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
    
    let importedCount = 0;
    
    for (const student of classStudents) {
      // Check if they already exist in this month's score snapshot
      const exists = scores.some(scoreRec => scoreRec.studentId === student.id);
      
      if (!exists) {
        await scoreService.add({
          classId: selectedClass.id,
          studentId: student.id, // Reference to original student
          month: selectedMonth,
          
          // Snapshot info
          studentIdCode: student.studentId || '',
          fullName: student.fullName || '',
          gender: student.gender || '',
          
          // Subject Scores
          quiz: '',
          exercise: '',
          speaking: '',
          homework: '',
          test: '',

          // Summary Score fields (always empty by default)
          totalScore: '',
          average: '',
          rank: '',
          grade: '',
          remarks: ''
        });
        importedCount++;
      }
    }
    
    if (importedCount > 0) {
      alert(`បានទាញយកសិស្សចំនួន ${importedCount} នាក់ដោយជោគជ័យ!`);
    } else {
      alert('មិនមានសិស្សថ្មីសម្រាប់ទាញយកទេ!');
    }
  };

  const removeScoreRecord = async (scoreId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបសិស្សនេះចេញពីបញ្ជីពិន្ទុខែនេះមែនទេ? (វាមិនប៉ះពាល់ដល់បញ្ជីសិស្សក្នុងថ្នាក់ទេ)')) {
      await scoreService.delete(scoreId);
    }
  };

  const exportToCSV = () => {
    if (scores.length === 0) return;
    const headers = ['អត្តលេខ', 'ឈ្មោះសិស្ស', 'ភេទ', 'Quiz', 'Exercise', 'Speaking', 'Homework', 'Test', 'ពិន្ទុសរុប', 'មធ្យមភាគ', 'និទ្ទេស', 'ចំណាត់ថ្នាក់', 'មូលវិចារណ៍'];
    const csvContent = [
      headers.join(','),
      ...scores.map(s => [
        `"${s.studentIdCode || ''}"`,
        `"${s.fullName || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.quiz || ''}"`,
        `"${s.exercise || ''}"`,
        `"${s.speaking || ''}"`,
        `"${s.homework || ''}"`,
        `"${s.test || ''}"`,
        `"${s.totalScore || ''}"`,
        `"${s.average || ''}"`,
        `"${s.grade || ''}"`,
        `"${s.rank || ''}"`,
        `"${s.remarks || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scores_${selectedClass?.className}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!selectedClassId) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          <button className="btn" onClick={() => setIsSettingsModalOpen(true)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            ⚙️ កំណត់ការគណនា
          </button>
        </div>
        
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។
        </p>

        <div className="grid-cards">
          {displayClasses.map(c => {
            // Count live students for this class
            const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((s: any) => s.id) : []);
            const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
            const total = classStudents.length;
            const female = classStudents.filter(s => s.gender === 'ស្រី').length;
            const male = total - female;

            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', padding: '1.25rem', borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.className}</h3>
                
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  សរុប <b>{total}</b> នាក់ &nbsp;&nbsp; ស្រី <b>{female}</b> នាក់ &nbsp;&nbsp; ប្រុស <b>{male}</b> នាក់
                </div>

                <span style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: 500, marginTop: '0.5rem' }}>ចូលបញ្ចូលពិន្ទុ &rarr;</span>
              </div>
            );
          })}
          {displayClasses.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>មិនមានថ្នាក់រៀនទេ</div>
          )}
        </div>

        {isSettingsModalOpen && (
          <div onClick={() => setIsSettingsModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '2rem', background: 'var(--modal-bg)', width: '90%', maxWidth: '500px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0' }}>កំណត់ការគណនាពិន្ទុ</h2>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>ចំនួនមុខវិជ្ជាសរុប (សម្រាប់ចែកមធ្យមភាគ)</label>
                  <input type="number" className="input-field" value={settings.maxSubjects || 1} onChange={e => setSettings({...settings, maxSubjects: parseInt(e.target.value)})} min="1" required />
                </div>
                
                <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1rem' }}>កំណត់និទ្ទេស (ភាគរយមធ្យមភាគ)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស A (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeA || 90} onChange={e => setSettings({...settings, gradeA: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស B (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeB || 80} onChange={e => setSettings({...settings, gradeB: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស C (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeC || 70} onChange={e => setSettings({...settings, gradeC: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស D (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeD || 60} onChange={e => setSettings({...settings, gradeD: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស E (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeE || 50} onChange={e => setSettings({...settings, gradeE: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn" onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>បោះបង់</button>
                  <button type="submit" className="btn btn-primary">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const snapshotTotal = scores.length;
  const snapshotFemale = scores.filter(s => s.gender === 'ស្រី').length;
  const snapshotMale = snapshotTotal - snapshotFemale;

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem', maxWidth: '100vw', overflowX: 'auto' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn" onClick={() => setSelectedClassId(null)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem' }}>
             &larr; ថយក្រោយ
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ថ្នាក់៖ {selectedClass?.className}</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
            />
          </div>
          <button onClick={recalculateRanks} className="btn btn-primary" title="គណនាចំណាត់ថ្នាក់ឡើងវិញដោយស្វ័យប្រវត្តិ">
            🏆 ទាញចំណាត់ថ្នាក់
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>បញ្ជីសិស្សក្នុងថ្នាក់</h3>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>សរុប {snapshotTotal} នាក់</span>
            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ស្រី {snapshotFemale} នាក់</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ប្រុស {snapshotMale} នាក់</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={importStudentsFromClass}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            title="ទាញយកបញ្ជីឈ្មោះសិស្សពីថ្នាក់ចូលក្នុងខែនេះ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>

          <SortDropdown 
            options={[
              { value: 'studentIdCode', label: 'អត្តលេខ' },
              { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
              { value: 'gender', label: 'ភេទ' },
              { value: 'totalScore', label: 'ពិន្ទុសរុប' },
              { value: 'average', label: 'មធ្យមភាគ' },
              { value: 'rank', label: 'ចំណាត់ថ្នាក់' }
            ]}
            sortBy={scoreSortConfig?.key || 'fullName'}
            sortOrder={scoreSortConfig?.direction || 'asc'}
            onSortChange={(by, order) => {
              setScoreSortConfig({ key: by, direction: order });
            }}
          />

          <div style={{ position: 'relative' }} ref={clearDropdownRef}>
            <button 
              onClick={() => setIsClearDropdownOpen(!isClearDropdownOpen)} 
              className="btn" 
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
              title="លុបទិន្នន័យតាមជួរឈរ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              លុបទិន្នន័យ
            </button>
            
            {isClearDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 50, padding: '0.5rem 0',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ជ្រើសរើសជួរឈរត្រូវលុប</div>
                {[
                  { key: 'quiz', label: 'Quiz' },
                  { key: 'exercise', label: 'Exercise' },
                  { key: 'speaking', label: 'Speaking' },
                  { key: 'homework', label: 'Homework' },
                  { key: 'test', label: 'Test' }
                ].map(col => (
                  <div 
                    key={col.key}
                    onClick={() => handleClearColumn(col.key, col.label)}
                    style={{
                      padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: 'var(--danger)', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    លុប {col.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={exportToCSV} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            ទាញយក Excel
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', overflowX: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ល.រ</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>អត្តលេខ</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ឈ្មោះសិស្ស</th>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ភេទ</th>
              
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Quiz</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Exercise</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Speaking</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Homework</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Test</div>
              </th>

              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontWeight: 'bold' }}>ពិន្ទុសរុប</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>មធ្យមភាគ</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>និទ្ទេស</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>ចំណាត់ថ្នាក់</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '80px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>មូលវិចារណ៍</div>
              </th>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ផ្សេងៗ</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const sortedScores = [...scores].sort((a: any, b: any) => {
                if (!scoreSortConfig) {
                  // Default: Female first, then Name
                  if (a.gender === 'ស្រី' && b.gender !== 'ស្រី') return -1;
                  if (a.gender !== 'ស្រី' && b.gender === 'ស្រី') return 1;
                  return (a.fullName || '').localeCompare(b.fullName || '', 'km');
                }
                const { key, direction } = scoreSortConfig;
                const aVal = (a[key] || '').toString();
                const bVal = (b[key] || '').toString();
                
                let comparison = 0;
                if (!isNaN(Number(aVal)) && !isNaN(Number(bVal)) && aVal !== '' && bVal !== '') {
                  comparison = Number(aVal) - Number(bVal);
                } else {
                  comparison = aVal.localeCompare(bVal, 'km');
                }
                return direction === 'asc' ? comparison : -comparison;
              });

              return sortedScores.map((scoreRec, index) => {
                return (
                  <tr key={scoreRec.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{index + 1}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{scoreRec.studentIdCode || 'N/A'}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{scoreRec.fullName}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: scoreRec.gender === 'ស្រី' ? '#ec4899' : 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{scoreRec.gender}</td>
                    
                    {/* New Subject Columns */}
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={scoreRec.quiz || ''}
                        onChange={(e) => handleScoreChange(scoreRec, 'quiz', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'quiz')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={scoreRec.exercise || ''}
                        onChange={(e) => handleScoreChange(scoreRec, 'exercise', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'exercise')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={scoreRec.speaking || ''}
                        onChange={(e) => handleScoreChange(scoreRec, 'speaking', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'speaking')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={scoreRec.homework || ''}
                        onChange={(e) => handleScoreChange(scoreRec, 'homework', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'homework')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={scoreRec.test || ''}
                        onChange={(e) => handleScoreChange(scoreRec, 'test', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'test')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>

                    {/* Total Score */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                      {scoreRec.totalScore || '-'}
                    </td>
                    
                    {/* Average */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
                      {scoreRec.average || '-'}
                    </td>

                    {/* Grade */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', border: '1px solid var(--border-color)' }}>
                      {scoreRec.grade || '-'}
                    </td>

                    {/* Rank */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b', border: '1px solid var(--border-color)' }}>
                      {scoreRec.rank || '-'}
                    </td>

                    {/* Remarks */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', minWidth: '80px' }}>
                      {scoreRec.remarks || '-'}
                    </td>

                    <td style={{ padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <button 
                        onClick={() => removeScoreRecord(scoreRec.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1.2rem' }}
                        title="លុបចេញពីខែនេះ"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              });
            })()}
            {scores.length === 0 && (
              <tr>
                <td colSpan={15} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  មិនមានសិស្សក្នុងខែនេះទេ។ <br/><br/>
                  សូមចុចប៊ូតុង <b>"+"</b> នៅខាងលើដើម្បីទាញយកបញ្ជីឈ្មោះពីថ្នាក់រៀន។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        * គន្លឹះ៖ លោកអ្នកអាច Copy (Ctrl+C) ទិន្នន័យពី Excel រួច Paste (Ctrl+V) ចូលក្នុងប្រអប់ណាមួយ វាអានជាជួរស្វ័យប្រវត្តិ។ រាល់ការវាយបញ្ចូលនឹង Save ចូលប្រព័ន្ធដោយស្វ័យប្រវត្តិ។
      </p>
    </div>
  );
}
