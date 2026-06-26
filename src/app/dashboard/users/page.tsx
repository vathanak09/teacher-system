"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [role, setRole] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('student');
  const router = useRouter();

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = () => {
    const stored = JSON.parse(localStorage.getItem('appUsers') || '[]');
    setUsers(stored);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setUsername('');
    setPassword('');
    setUserRole('student');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setUserRole(user.role);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
    }
  };

  const handleSave = () => {
    if (name && username && password && userRole) {
      // Basic check for existing username if it's a new user
      if (!editId && users.find(u => u.username === username)) {
        alert('ឈ្មោះគណនីនេះមានរួចហើយ! សូមជ្រើសរើសឈ្មោះផ្សេង។');
        return;
      }
      
      let updated;
      if (editId) {
        updated = users.map(u => u.id === editId ? { id: editId, name, username, password, role: userRole } : u);
      } else {
        updated = [...users, { id: Date.now().toString(), name, username, password, role: userRole }];
      }
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
      setIsModalOpen(false);
    } else {
      alert('សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!');
    }
  };
  
  const getRoleName = (r: string) => r === 'admin' ? 'អ្នកគ្រប់គ្រង' : r === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស';
  const getRoleColor = (r: string) => r === 'admin' ? '#ef4444' : r === 'teacher' ? '#3b82f6' : '#10b981';

  if (role !== 'admin') return null;

  return (
    <>
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0' }}>គ្រប់គ្រងអ្នកប្រើប្រាស់</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>បង្កើត ឬកែប្រែគណនី និងលេខសម្ងាត់សម្រាប់សិស្ស គ្រូ។</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + បង្កើតគណនីថ្មី
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>ឈ្មោះ / Name</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>គណនី / Username</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>តួនាទី / Role</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>លេខសម្ងាត់ / Password</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>សកម្មភាព / Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{u.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.username}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    background: `${getRoleColor(u.role)}20`, 
                    color: getRoleColor(u.role), 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '99px', 
                    fontSize: '0.85rem', 
                    fontWeight: 500 
                  }}>
                    {getRoleName(u.role)}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                  {u.password}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', marginRight: '1rem', fontWeight: 500 }}>
                    កែប្រែ
                  </button>
                  {u.username !== 'admin1' && (
                    <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500 }}>
                      លុប
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {isModalOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', padding: '2rem', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>
            {editId ? 'កែប្រែព័ត៌មានអ្នកប្រើប្រាស់' : 'បង្កើតគណនីថ្មី'}
          </h2>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះពេញ (Full Name)</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="ឧ. សុវណ្ណ តារា" />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះគណនី (Username)</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} placeholder="ឧ. sovann" disabled={!!editId} />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>លេខសម្ងាត់ (Password)</label>
            <input type="text" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="លេខសម្ងាត់" />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>តួនាទី (Role)</label>
            <select className="input-field" value={userRole} onChange={e => setUserRole(e.target.value)} disabled={username === 'admin1'}>
              <option value="student">សិស្ស (Student)</option>
              <option value="teacher">គ្រូបង្រៀន (Teacher)</option>
              <option value="admin">អ្នកគ្រប់គ្រង (Admin)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsModalOpen(false)}>បោះបង់</button>
            <button className="btn btn-primary" onClick={handleSave}>រក្សាទុក</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
