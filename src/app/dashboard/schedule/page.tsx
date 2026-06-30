"use client";
import { useState, useEffect } from 'react';

export default function SchedulePage() {
  const [role, setRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [time, setTime] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState('ថ្ងៃច័ន្ទ');

  const days = ['ថ្ងៃច័ន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'];

  const [scheduleData, setScheduleData] = useState<any[]>([]);

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || '');
    const saved = localStorage.getItem('scheduleData');
    if (saved && JSON.parse(saved).length > 0) {
      setScheduleData(JSON.parse(saved));
    } else {
      const defaultData = [
        { id: 1, day: 'ថ្ងៃច័ន្ទ', time: '08:00 AM - 09:30 AM', subject: 'គណិតវិទ្យា', room: 'បន្ទប់ A101' },
        { id: 2, day: 'ថ្ងៃច័ន្ទ', time: '10:00 AM - 11:30 AM', subject: 'រូបវិទ្យា', room: 'បន្ទប់ B205' },
        { id: 3, day: 'ថ្ងៃអង្គារ', time: '08:00 AM - 09:30 AM', subject: 'គីមីវិទ្យា', room: 'បន្ទប់ C304' },
      ];
      setScheduleData(defaultData);
      localStorage.setItem('scheduleData', JSON.stringify(defaultData));
    }
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setTime('');
    setSubject('');
    setRoom('');
    setDay('ថ្ងៃច័ន្ទ');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setTime(item.time);
    setSubject(item.subject);
    setRoom(item.room);
    setDay(item.day);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបម៉ោងសិក្សានេះមែនទេ?')) {
      const updated = scheduleData.filter(s => s.id !== id);
      setScheduleData(updated);
      localStorage.setItem('scheduleData', JSON.stringify(updated));
    }
  };

  const handleSave = () => {
    if (!time || !subject || !room) {
      alert('សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!');
      return;
    }
    let updated;
    if (editId) {
      updated = scheduleData.map(s => s.id === editId ? { ...s, time, subject, room, day } : s);
    } else {
      updated = [...scheduleData, { id: Date.now(), time, subject, room, day }];
    }
    
    // Sort by day and time
    updated.sort((a, b) => {
      if (days.indexOf(a.day) !== days.indexOf(b.day)) {
        return days.indexOf(a.day) - days.indexOf(b.day);
      }
      return a.time.localeCompare(b.time);
    });

    setScheduleData(updated);
    localStorage.setItem('scheduleData', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>កាលវិភាគ (Schedule)</h1>
        {(role === 'admin' || role === 'teacher') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + បន្ថែមម៉ោងសិក្សា
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>កាលវិភាគសម្រាប់ការសិក្សានៅក្នុងថ្នាក់នីមួយៗ</p>
      
      {days.map(d => {
        const dayItems = scheduleData.filter(s => s.day === d);
        if (dayItems.length === 0) return null;

        return (
          <div key={d} style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-primary)', display: 'inline-block' }}>
              {d}
            </h3>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {dayItems.map((item, idx) => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: idx === dayItems.length - 1 ? 'none' : '1px solid var(--border-color)',
                  alignItems: 'center',
                  gap: '2rem',
                  flexWrap: 'wrap',
                  position: 'relative',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)', minWidth: '160px' }}>{item.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.subject}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.room}</div>
                  </div>
                  
                  {(role === 'admin' || role === 'teacher') && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(item)} className="btn" style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: 'var(--main-bg)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{editId ? 'កែប្រែម៉ោងសិក្សា' : 'បន្ថែមម៉ោងសិក្សាថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ថ្ងៃសិក្សា</label>
              <select className="input-field" value={day} onChange={e => setDay(e.target.value)}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ម៉ោង (ឧ. 08:00 AM - 09:30 AM)</label>
              <input type="text" className="input-field" value={time} onChange={e => setTime(e.target.value)} placeholder="00:00 - 00:00" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>មុខវិជ្ជា</label>
              <input type="text" className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="បញ្ចូលឈ្មោះមុខវិជ្ជា..." />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>បន្ទប់រៀន</label>
              <input type="text" className="input-field" value={room} onChange={e => setRoom(e.target.value)} placeholder="ឧ. បន្ទប់ A101" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSave}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
