"use client";
import { useState, useEffect } from 'react';

export default function AttendancePage() {
  const [role, setRole] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dummy student list if not found in users
  const defaultStudents = [
    { id: 1, name: 'Student 1', role: 'student' },
    { id: 2, name: 'Student 2', role: 'student' },
    { id: 3, name: 'Student 3', role: 'student' },
  ];

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<number, string>>>({}); // { '2026-06-27': { 1: 'present', 2: 'absent' } }

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || '');
    
    // Load users to get students
    const savedUsers = localStorage.getItem('usersList');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      const studentList = parsed.filter((u: any) => u.role === 'student');
      setStudents(studentList.length > 0 ? studentList : defaultStudents);
    } else {
      setStudents(defaultStudents);
    }

    // Load attendance records
    const savedAtt = localStorage.getItem('attendanceRecords');
    if (savedAtt) {
      setAttendance(JSON.parse(savedAtt));
    }
  }, []);

  const handleStatusChange = (studentId: number, status: string) => {
    if (role !== 'admin' && role !== 'teacher') return;
    
    const updated = { ...attendance };
    if (!updated[date]) {
      updated[date] = {};
    }
    updated[date][studentId] = status;
    setAttendance(updated);
    localStorage.setItem('attendanceRecords', JSON.stringify(updated));
  };

  const currentRecords = attendance[date] || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'var(--success)';
      case 'absent': return 'var(--danger)';
      case 'permission': return 'var(--warning)';
      default: return 'var(--border-color)';
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>បញ្ជីវត្តមាន (Attendance)</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>ស្រង់វត្តមានសិស្សប្រចាំថ្ងៃ</p>
      
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ fontWeight: 600 }}>ជ្រើសរើសកាលបរិច្ឆេទ៖</label>
        <input 
          type="date" 
          className="input-field" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          style={{ width: 'auto', background: 'var(--main-bg)' }}
        />
      </div>

      <div className="glass-panel table-responsive" style={{ overflow: 'auto' }}>
        <div style={{ minWidth: '600px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', background: 'rgba(0,0,0,0.02)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
            <div>ឈ្មោះសិស្ស (Student Name)</div>
            <div style={{ textAlign: 'center' }}>មានវត្តមាន (Present)</div>
            <div style={{ textAlign: 'center' }}>អវត្តមាន (Absent)</div>
            <div style={{ textAlign: 'center' }}>ច្បាប់ (Permission)</div>
          </div>
          
          {students.map((student, idx) => {
          const status = currentRecords[student.id] || '';
          const isEditable = role === 'admin' || role === 'teacher';
          return (
            <div key={student.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 1fr', 
              padding: '1rem 1.5rem', 
              borderBottom: idx === students.length - 1 ? 'none' : '1px solid var(--border-color)',
              alignItems: 'center',
              background: status ? `${getStatusColor(status)}10` : 'transparent',
              transition: 'background 0.2s'
            }}>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {student.name.charAt(0).toUpperCase()}
                </div>
                {student.name}
              </div>
              
              {/* Present Radio */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'inline-flex', cursor: isEditable ? 'pointer' : 'default', padding: '0.5rem' }}>
                  <input 
                    type="radio" 
                    name={`status-${student.id}`} 
                    checked={status === 'present'} 
                    onChange={() => handleStatusChange(student.id, 'present')} 
                    disabled={!isEditable}
                    style={{ transform: 'scale(1.2)', accentColor: 'var(--success)' }}
                  />
                </label>
              </div>

              {/* Absent Radio */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'inline-flex', cursor: isEditable ? 'pointer' : 'default', padding: '0.5rem' }}>
                  <input 
                    type="radio" 
                    name={`status-${student.id}`} 
                    checked={status === 'absent'} 
                    onChange={() => handleStatusChange(student.id, 'absent')} 
                    disabled={!isEditable}
                    style={{ transform: 'scale(1.2)', accentColor: 'var(--danger)' }}
                  />
                </label>
              </div>

              {/* Permission Radio */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'inline-flex', cursor: isEditable ? 'pointer' : 'default', padding: '0.5rem' }}>
                  <input 
                    type="radio" 
                    name={`status-${student.id}`} 
                    checked={status === 'permission'} 
                    onChange={() => handleStatusChange(student.id, 'permission')} 
                    disabled={!isEditable}
                    style={{ transform: 'scale(1.2)', accentColor: 'var(--warning)' }}
                  />
                </label>
              </div>
            </div>
          );
        })}
        {students.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            មិនទាន់មានសិស្សនៅក្នុងប្រព័ន្ធនៅឡើយទេ។
          </div>
        )}
        </div>
      </div>
      
      {(role === 'admin' || role === 'teacher') && (
        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ទិន្នន័យរក្សាទុកដោយស្វ័យប្រវត្តិ (Auto-saved)</span>
        </div>
      )}
    </div>
  );
}
