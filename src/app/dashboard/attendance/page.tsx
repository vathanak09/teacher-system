"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { classService, teacherService, studentService, attendanceService } from '@/services/db';

export default function AttendancePage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Date selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Attendance Records: { [studentId]: { [day]: 'present' | 'absent' | 'permission' } }
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<number, string>>>({});
  const router = useRouter();

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    setRole(currentRole);
    setUserId(currentUserId);
    setUserName(currentUserName);

    if (currentRole !== 'admin' && currentRole !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    const unsubscribeClasses = classService.subscribeAll(data => {
      if (currentRole === 'admin') {
        setClasses(data);
      } else {
        setClasses(data.filter((c: any) => c.teacherId === currentUserId || c.teacherName === currentUserName));
      }
    });

    const unsubscribeTeachers = teacherService.subscribeAll(setTeachers);
    const unsubscribeStudents = studentService.subscribeAll(setStudents);

    return () => {
      unsubscribeClasses();
      unsubscribeTeachers();
      unsubscribeStudents();
    };
  }, [router]);

  // Load attendance data when class/month/year changes
  useEffect(() => {
    if (!selectedClassId) return;
    
    const docId = `${selectedClassId}_${selectedYear}_${selectedMonth}`;
    const loadAttendance = async () => {
      try {
        const doc = await attendanceService.getById(docId);
        if (doc && doc.records) {
          setAttendanceRecords(doc.records);
        } else {
          setAttendanceRecords({});
        }
      } catch (error) {
        console.error("Error loading attendance", error);
        setAttendanceRecords({});
      }
    };
    loadAttendance();
  }, [selectedClassId, selectedMonth, selectedYear]);

  const handleAttendanceChange = async (studentId: string, day: number, value: string) => {
    if (role !== 'admin' && role !== 'teacher') return;
    
    const newRecords = { ...attendanceRecords };
    if (!newRecords[studentId]) newRecords[studentId] = {};
    
    if (value === '') {
      delete newRecords[studentId][day];
    } else {
      newRecords[studentId][day] = value;
    }
    
    setAttendanceRecords(newRecords);
    
    // Auto-save
    const docId = `${selectedClassId}_${selectedYear}_${selectedMonth}`;
    try {
      await attendanceService.add({
        classId: selectedClassId,
        year: selectedYear,
        month: selectedMonth,
        records: newRecords,
        updatedAt: new Date().toISOString()
      }, docId);
    } catch (error) {
      console.error("Error saving attendance", error);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const renderClassList = () => {
    // Group classes by teacher
    const grouped: Record<string, any[]> = {};
    classes.forEach(c => {
      const teacherName = c.teacherName || 'មិនទាន់កំណត់ (Unassigned)';
      if (!grouped[teacherName]) grouped[teacherName] = [];
      grouped[teacherName].push(c);
    });

    return (
      <div className="animate-fade-in">
        {Object.keys(grouped).map(teacherName => (
          <div key={teacherName} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>
              ថ្នាក់រៀនរបស់៖ <span style={{ color: 'var(--primary-color)' }}>{teacherName}</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {grouped[teacherName].map(c => {
                // Students count
                const studentCount = c.studentsData ? c.studentsData.length : (c.studentIds ? c.studentIds.length : 0);
                
                return (
                  <div 
                    key={c.id} 
                    className="glass-panel hover-card animate-scale-in"
                    onClick={() => setSelectedClassId(c.id)}
                    style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid ${c.color || 'var(--primary-color)'}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{c.className || c.classCode}</h3>
                      <span style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>{c.shift || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <span>សិស្សសរុប៖ <strong>{studentCount}</strong> នាក់</span>
                    </div>
                    {c.level && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>កម្រិត៖ {c.level}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            មិនមានថ្នាក់រៀនសម្រាប់បង្ហាញទេ។
          </div>
        )}
      </div>
    );
  };

  const renderAttendanceTable = () => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return null;

    // Filter students for this class
    const classStudentIds = selectedClass.studentIds || (selectedClass.studentsData ? selectedClass.studentsData.map((s: any) => s.id) : []);
    const classStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);
    
    const days = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>ថ្នាក់៖ <span style={{ color: 'var(--primary-color)' }}>{selectedClass.className}</span></h2>
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>គ្រូ៖ {selectedClass.teacherName} • សិស្ស៖ {classStudents.length} នាក់</div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>ខែ៖</label>
              <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ padding: '0.5rem', background: 'var(--bg-secondary)', width: 'auto' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>ខែ {m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>ឆ្នាំ៖</label>
              <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ padding: '0.5rem', background: 'var(--bg-secondary)', width: 'auto' }}>
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel table-responsive" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '50px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>ល.រ</th>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '80px', position: 'sticky', left: '50px', background: 'var(--bg-secondary)', zIndex: 10 }}>អត្តលេខ</th>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px', position: 'sticky', left: '130px', background: 'var(--bg-secondary)', zIndex: 10 }}>ឈ្មោះសិស្ស</th>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '60px', position: 'sticky', left: '280px', background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-color)', zIndex: 10 }}>ភេទ</th>
                {daysArray.map(day => (
                  <th key={day} style={{ padding: '1rem 0.25rem', textAlign: 'center', minWidth: '40px', fontSize: '0.85rem' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-black/5">
                  <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 5 }}>{idx + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: '50px', background: 'var(--card-bg)', zIndex: 5 }}>{student.studentId || ''}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, position: 'sticky', left: '130px', background: 'var(--card-bg)', zIndex: 5 }}>{student.fullName || student.name || ''}</td>
                  <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: '280px', background: 'var(--card-bg)', borderRight: '2px solid var(--border-color)', zIndex: 5 }}>{student.gender}</td>
                  {daysArray.map(day => {
                    const status = attendanceRecords[student.id]?.[day] || '';
                    let bgColor = 'transparent';
                    let color = 'inherit';
                    if (status === 'present') { bgColor = 'rgba(16, 185, 129, 0.1)'; color = '#10b981'; }
                    else if (status === 'absent') { bgColor = 'rgba(239, 68, 68, 0.1)'; color = '#ef4444'; }
                    else if (status === 'permission') { bgColor = 'rgba(245, 158, 11, 0.1)'; color = '#f59e0b'; }

                    return (
                      <td key={day} style={{ padding: '0.25rem', textAlign: 'center' }}>
                        <select 
                          value={status}
                          onChange={(e) => handleAttendanceChange(student.id, day, e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '0.25rem', 
                            appearance: 'none', 
                            textAlign: 'center', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '4px',
                            background: bgColor,
                            color: color,
                            fontWeight: status ? 'bold' : 'normal',
                            cursor: 'pointer'
                          }}
                        >
                          <option value=""></option>
                          <option value="present">✓</option>
                          <option value="absent">X</option>
                          <option value="permission">P</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={4 + days} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', textAlign: 'center', lineHeight: '16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>✓</span> 
            <span style={{ fontSize: '0.9rem' }}>មានវត្តមាន</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textAlign: 'center', lineHeight: '16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>X</span> 
            <span style={{ fontSize: '0.9rem' }}>អវត្តមាន</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', textAlign: 'center', lineHeight: '16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>P</span> 
            <span style={{ fontSize: '0.9rem' }}>ច្បាប់</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            * ទិន្នន័យរក្សាទុកដោយស្វ័យប្រវត្តិពេលជ្រើសរើស (Auto-saved)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {selectedClassId && (
            <button 
              onClick={() => setSelectedClassId(null)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <h1 style={{ margin: 0 }}>បញ្ជីវត្តមាន (Attendance)</h1>
        </div>
      </div>
      
      {!selectedClassId && <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>ជ្រើសរើសថ្នាក់រៀនខាងក្រោមដើម្បីស្រង់វត្តមានប្រចាំខែ។</p>}

      {selectedClassId ? renderAttendanceTable() : renderClassList()}
    </div>
  );
}
