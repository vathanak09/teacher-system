"use client";
import { useState, useEffect } from 'react';

export default function CoursesPage() {
  const [role, setRole] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('កំពុងសិក្សា');

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || '');
    const saved = localStorage.getItem('coursesData');
    if (saved && JSON.parse(saved).length > 0) {
      setCourses(JSON.parse(saved));
    } else {
      const defaultData = [
        { id: 1, name: 'ការអភិវឌ្ឍន៍គេហទំព័រមូលដ្ឋាន', teacher: 'លោកគ្រូ សុខ ម៉េង', progress: 75, status: 'កំពុងសិក្សា' },
        { id: 2, name: 'ភាសាសរសេរកូដកម្រិតខ្ពស់', teacher: 'អ្នកគ្រូ ចាន់ ស្រីមុំ', progress: 40, status: 'កំពុងសិក្សា' },
        { id: 3, name: 'បណ្តាញកុំព្យូទ័រ', teacher: 'Mr. John', progress: 100, status: 'បញ្ចប់រួចរាល់' },
      ];
      setCourses(defaultData);
      localStorage.setItem('coursesData', JSON.stringify(defaultData));
    }
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setTeacher('');
    setProgress(0);
    setStatus('កំពុងសិក្សា');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setName(item.name);
    setTeacher(item.teacher);
    setProgress(item.progress);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបវគ្គសិក្សានេះមែនទេ?')) {
      const updated = courses.filter(c => c.id !== id);
      setCourses(updated);
      localStorage.setItem('coursesData', JSON.stringify(updated));
    }
  };

  const handleSave = () => {
    if (!name || !teacher) {
      alert('សូមបំពេញឈ្មោះវគ្គសិក្សា និងឈ្មោះគ្រូ!');
      return;
    }
    let updated;
    if (editId) {
      updated = courses.map(c => c.id === editId ? { ...c, name, teacher, progress: Number(progress), status } : c);
    } else {
      updated = [...courses, { id: Date.now(), name, teacher, progress: Number(progress), status }];
    }
    setCourses(updated);
    localStorage.setItem('coursesData', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>វគ្គសិក្សា (Courses)</h1>
        {(role === 'admin' || role === 'teacher') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + បន្ថែមវគ្គសិក្សា
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>គ្រប់គ្រងវគ្គសិក្សាទាំងអស់នៅក្នុងប្រព័ន្ធ</p>
      
      <div className="grid-cards">
        {courses.map(course => (
          <div key={course.id} className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', flex: 1, paddingRight: '1rem', lineHeight: 1.4 }}>{course.name}</h3>
              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: course.progress === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: course.progress === 100 ? 'var(--success)' : 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
                {course.status}
              </span>
            </div>
            
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              បង្រៀនដោយ៖ {course.teacher}
            </p>
            
            <div style={{ marginTop: 'auto' }}>
              <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                <span>វឌ្ឍនភាព (Progress)</span>
                <span>{course.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${course.progress}%`, height: '100%', background: course.progress === 100 ? 'var(--success)' : 'var(--accent-primary)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>

            {(role === 'admin' || role === 'teacher') ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn" style={{ flex: 1, padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} onClick={() => openEditModal(course)}>កែប្រែ</button>
                <button className="btn" style={{ flex: 1, padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => handleDelete(course.id)}>លុប</button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.5rem' }}>ចូលរៀនបន្ត &rarr;</button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in" 
            style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{editId ? 'កែប្រែវគ្គសិក្សា' : 'បន្ថែមវគ្គសិក្សាថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះវគ្គសិក្សា</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="ឧ. ភាសាសរសេរកូដមូលដ្ឋាន" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>គ្រូបង្រៀន</label>
              <input type="text" className="input-field" value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="ឈ្មោះគ្រូ..." />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ភាគរយបញ្ចប់ ({progress}%)</label>
              <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ស្ថានភាព</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="កំពុងសិក្សា">កំពុងសិក្សា</option>
                <option value="បញ្ចប់រួចរាល់">បញ្ចប់រួចរាល់</option>
                <option value="មិនទាន់ចាប់ផ្តើម">មិនទាន់ចាប់ផ្តើម</option>
              </select>
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
