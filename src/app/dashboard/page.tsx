"use client";
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [targetId, setTargetId] = useState('all');

  useEffect(() => { 
    setRole(localStorage.getItem('userRole') || ''); 
    setUserId(localStorage.getItem('userId') || '');
    setUserName(localStorage.getItem('userName') || '');
    
    const storedAnn = JSON.parse(localStorage.getItem('appAnnouncements') || '[]');
    if (storedAnn.length === 0) {
       const defaultAnn = [{ 
         id: 1, 
         title: 'ការអាប់ដេតប្រព័ន្ធ (System Update)', 
         message: 'ប្រព័ន្ធគ្រប់គ្រងគ្រូបង្រៀនជំនាន់ថ្មីត្រូវបានដាក់អោយប្រើប្រាស់ជាផ្លូវការហើយ! សូមស្វាគមន៍មកកាន់ការប្រើប្រាស់។', 
         targetId: 'all', 
         date: new Date().toLocaleDateString('km-KH') 
       }];
       localStorage.setItem('appAnnouncements', JSON.stringify(defaultAnn));
       setAnnouncements(defaultAnn);
    } else {
       setAnnouncements(storedAnn);
    }
    
    setUsers(JSON.parse(localStorage.getItem('appUsers') || '[]'));
  }, []);

  const handleSave = () => {
    if (newTitle && newMessage) {
       const newAnn = { 
         id: Date.now(), 
         title: newTitle, 
         message: newMessage, 
         targetId, 
         date: new Date().toLocaleDateString('km-KH') 
       };
       const updated = [newAnn, ...announcements];
       setAnnouncements(updated);
       localStorage.setItem('appAnnouncements', JSON.stringify(updated));
       setIsModalOpen(false);
       setNewTitle('');
       setNewMessage('');
       setTargetId('all');
    } else {
       alert('សូមបំពេញ ចំណងជើង និងសារអោយបានត្រឹមត្រូវ!');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('តើអ្នកចង់លុបសេចក្តីជូនដំណឹងនេះមែនទេ?')) {
      const updated = announcements.filter(a => a.id !== id);
      setAnnouncements(updated);
      localStorage.setItem('appAnnouncements', JSON.stringify(updated));
    }
  };

  const roleKhmer = role === 'admin' ? 'អ្នកគ្រប់គ្រង' : role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស';
  const visibleAnnouncements = announcements.filter(a => role === 'admin' || a.targetId === 'all' || a.targetId === userId);

  return (
    <>
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>សូមស្វាគមន៍មកកាន់ សាលាអន្តរជាតិប្រេនស្តម-BSIS!</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        នេះគឺជាព័ត៌មានសង្ខេបសម្រាប់ថ្ងៃនេះ។
      </p>
      
      <div className="grid-cards">
        <div className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>សិទ្ធិប្រើប្រាស់របស់អ្នក</h3>
          <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>{roleKhmer}</p>
        </div>
        <div className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>វគ្គសិក្សាសរុប</h3>
          <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>៤ វគ្គសិក្សា</p>
        </div>
        <div className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>ម៉ោងបន្ទាប់</h3>
          <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>គណិតវិទ្យា</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>ម៉ោង ១០:០០ ព្រឹក</p>
        </div>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>សេចក្តីជូនដំណឹងថ្មីៗ (Announcements)</h2>
          {role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              + ជូនដំណឹងថ្មី
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleAnnouncements.length === 0 && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              មិនមានសេចក្តីជូនដំណឹងថ្មីទេ!
            </div>
          )}
          {visibleAnnouncements.map(ann => (
             <div key={ann.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                {role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(ann.id)} 
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    លុប
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                   <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.4rem', borderRadius: '50%' }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                   </div>
                   <h4 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.15rem' }}>{ann.title}</h4>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {ann.date}</span>
                   
                   {role === 'admin' && ann.targetId !== 'all' && (
                     <span style={{ fontSize: '0.8rem', background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.2)' }}>
                       ផ្ញើទៅកាន់: {users.find(u => u.id === ann.targetId)?.name || 'Unknown'}
                     </span>
                   )}
                </div>
                <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)', paddingLeft: '2.5rem' }}>
                  {ann.message}
                </p>
             </div>
          ))}
        </div>
      </div>
    </div>

    {isModalOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>
            បង្កើតសេចក្តីជូនដំណឹងថ្មី
          </h2>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ចំណងជើង (Title)</label>
            <input type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="ឧ. ឈប់សម្រាកបុណ្យជាតិ" />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>សារ (Message)</label>
            <textarea 
              className="input-field" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              placeholder="វាយបញ្ចូលសារជូនដំណឹង..." 
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ផ្ញើទៅកាន់ (Send To)</label>
            <select className="input-field" value={targetId} onChange={e => setTargetId(e.target.value)}>
              <option value="all">អ្នកប្រើប្រាស់ទាំងអស់ (All Users)</option>
              <optgroup label="អ្នកប្រើប្រាស់ជាក់លាក់ (Specific Users)">
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsModalOpen(false)}>បោះបង់</button>
            <button className="btn btn-primary" onClick={handleSave}>ផ្សព្វផ្សាយ</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
