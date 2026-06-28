"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState<'tags' | 'users' | 'school'>('tags');

  // Tag Group States
  const [tagGroups, setTagGroups] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupEditId, setGroupEditId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');

  // Tag States
  const [tags, setTags] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagEditId, setTagEditId] = useState<number | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [tagGroupId, setTagGroupId] = useState<number | string>(''); // assigned group id

  const tagColors = [
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Orange', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Indigo', hex: '#6366f1' }
  ];

  // User States (Migrated from users/page.tsx)
  const [users, setUsers] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [userNameField, setUserNameField] = useState('');
  const [userUsernameField, setUserUsernameField] = useState('');
  const [userPasswordField, setUserPasswordField] = useState('');
  const [userRoleField, setUserRoleField] = useState('student');

  // School Info States
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Load Tag Groups
    const savedGroups = localStorage.getItem('appTagGroups');
    let currentGroups = [];
    if (savedGroups) {
      currentGroups = JSON.parse(savedGroups);
      setTagGroups(currentGroups);
    } else {
      currentGroups = [
        { id: 1, name: 'កម្រិតថ្នាក់' },
        { id: 2, name: 'មុខវិជ្ជា' }
      ];
      setTagGroups(currentGroups);
      localStorage.setItem('appTagGroups', JSON.stringify(currentGroups));
    }

    // Load Tags
    const savedTags = localStorage.getItem('appTags');
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    } else {
      const defaultTags = [
        { id: 1, name: 'ភាសាបរទេស', color: '#8b5cf6', groupId: 2 },
        { id: 2, name: 'បច្ចេកវិទ្យា', color: '#3b82f6', groupId: 2 },
        { id: 3, name: 'ថ្នាក់ទី១២', color: '#10b981', groupId: 1 }
      ];
      setTags(defaultTags);
      localStorage.setItem('appTags', JSON.stringify(defaultTags));
    }

    // Load Users
    const storedUsers = JSON.parse(localStorage.getItem('appUsers') || '[]');
    setUsers(storedUsers);

    // Load School Name
    const storedSchool = localStorage.getItem('schoolName');
    if (storedSchool) {
      setSchoolName(storedSchool);
    }
  }, [router]);

  // Tag Group CRUD Functions
  const handleOpenAddGroup = () => {
    setGroupEditId(null);
    setGroupName('');
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: any) => {
    setGroupEditId(group.id);
    setGroupName(group.name);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = () => {
    if (!groupName) {
      alert('សូមបំពេញឈ្មោះក្រុមស្លាកពាក្យ!');
      return;
    }
    let updatedGroups;
    if (groupEditId) {
      updatedGroups = tagGroups.map(g => g.id === groupEditId ? { ...g, name: groupName } : g);
    } else {
      updatedGroups = [...tagGroups, { id: Date.now(), name: groupName }];
    }
    setTagGroups(updatedGroups);
    localStorage.setItem('appTagGroups', JSON.stringify(updatedGroups));
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបក្រុមស្លាកពាក្យនេះមែនទេ? (ស្លាកពាក្យនៅក្នុងក្រុមនេះនឹងត្រូវប្តូរទៅជាគ្មានក្រុម)')) {
      const updatedGroups = tagGroups.filter(g => g.id !== id);
      setTagGroups(updatedGroups);
      localStorage.setItem('appTagGroups', JSON.stringify(updatedGroups));

      // Remove groupId from tags that belonged to deleted group
      const updatedTags = tags.map(t => t.groupId === id ? { ...t, groupId: null } : t);
      setTags(updatedTags);
      localStorage.setItem('appTags', JSON.stringify(updatedTags));
    }
  };

  // Tag CRUD Functions
  const handleOpenAddTag = () => {
    setTagEditId(null);
    setTagName('');
    setTagColor('#3b82f6');
    setTagGroupId('');
    setIsTagModalOpen(true);
  };

  const handleOpenEditTag = (tag: any) => {
    setTagEditId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagGroupId(tag.groupId || '');
    setIsTagModalOpen(true);
  };

  const handleSaveTag = () => {
    if (!tagName) {
      alert('សូមបំពេញឈ្មោះស្លាកពាក្យ!');
      return;
    }
    const parsedGroupId = tagGroupId ? Number(tagGroupId) : null;
    let updatedTags;
    if (tagEditId) {
      updatedTags = tags.map(t => t.id === tagEditId ? { ...t, name: tagName, color: tagColor, groupId: parsedGroupId } : t);
    } else {
      updatedTags = [...tags, { id: Date.now(), name: tagName, color: tagColor, groupId: parsedGroupId }];
    }
    setTags(updatedTags);
    localStorage.setItem('appTags', JSON.stringify(updatedTags));
    setIsTagModalOpen(false);
  };

  const handleDeleteTag = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបស្លាកពាក្យនេះមែនទេ?')) {
      const updatedTags = tags.filter(t => t.id !== id);
      setTags(updatedTags);
      localStorage.setItem('appTags', JSON.stringify(updatedTags));
    }
  };

  // User CRUD Functions
  const handleOpenAddUser = () => {
    setUserEditId(null);
    setUserNameField('');
    setUserUsernameField('');
    setUserPasswordField('');
    setUserRoleField('student');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setUserEditId(user.id);
    setUserNameField(user.name);
    setUserUsernameField(user.username);
    setUserPasswordField(user.password);
    setUserRoleField(user.role);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (userNameField && userUsernameField && userPasswordField && userRoleField) {
      if (!userEditId && users.find(u => u.username === userUsernameField)) {
        alert('ឈ្មោះគណនីនេះមានរួចហើយ! សូមជ្រើសរើសឈ្មោះផ្សេង។');
        return;
      }
      
      let updated;
      if (userEditId) {
        updated = users.map(u => u.id === userEditId ? { id: userEditId, name: userNameField, username: userUsernameField, password: userPasswordField, role: userRoleField } : u);
      } else {
        updated = [...users, { id: Date.now().toString(), name: userNameField, username: userUsernameField, password: userPasswordField, role: userRoleField }];
      }
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
      setIsUserModalOpen(false);
    } else {
      alert('សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!');
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
    }
  };

  // School Info Functions
  const handleSaveSchoolInfo = () => {
    localStorage.setItem('schoolName', schoolName);
    alert('រក្សាទុកព័ត៌មានសាលារៀនដោយជោគជ័យ! (សូម Refresh ដើម្បីឃើញការផ្លាស់ប្តូរ)');
  };

  if (role !== 'admin') return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>ការកំណត់របស់ Admin</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>ផ្ទាំងបញ្ជាកណ្តាលសម្រាប់គ្រប់គ្រងប្រព័ន្ធ</p>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('tags')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'tags' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'tags' ? '3px solid var(--accent-primary)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
        >
          🏷️ គ្រប់គ្រង Tags & ក្រុម
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'users' ? '3px solid var(--accent-primary)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
        >
          👥 អ្នកប្រើប្រាស់ (Users)
        </button>
        <button 
          onClick={() => setActiveTab('school')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', color: activeTab === 'school' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'school' ? '3px solid var(--accent-primary)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
        >
          🏫 ព័ត៌មានសាលា (School Info)
        </button>
      </div>

      {/* TAB CONTENT: TAGS & GROUPS (2-Column Layout) */}
      {activeTab === 'tags' && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Column 1: Tag Groups (35% Width) */}
          <div style={{ flex: '1 1 350px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📂 ក្រុមស្លាកពាក្យ (Tag Groups)</h2>
              <button className="btn btn-primary" onClick={handleOpenAddGroup} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                + បង្កើតក្រុម
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tagGroups.map(group => (
                <div key={group.id} className="flex-between" style={{ padding: '0.75rem', background: 'var(--main-bg)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{group.name}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleOpenEditGroup(group)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">✏️</button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">🗑</button>
                  </div>
                </div>
              ))}
              {tagGroups.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  មិនទាន់មានក្រុមនៅឡើយទេ។
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Tags (65% Width) */}
          <div style={{ flex: '2 1 550px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🏷️ ស្លាកពាក្យ (Tags)</h2>
              <button className="btn btn-primary" onClick={handleOpenAddTag} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                + បង្កើត Tag
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tags.map(tag => {
                const group = tagGroups.find(g => g.id === tag.groupId);
                return (
                  <div key={tag.id} className="flex-between" style={{ padding: '0.75rem', background: 'var(--main-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: tag.color, color: 'white', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
                        {tag.name}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ក្រុម៖ <b>{group ? group.name : 'គ្មានក្រុម'}</b>
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleOpenEditTag(tag)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ / ប្តូរក្រុម">✏️ Move/Edit</button>
                      <button onClick={() => handleDeleteTag(tag.id)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">🗑</button>
                    </div>
                  </div>
                );
              })}
              {tags.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  មិនទាន់មានស្លាកពាក្យនៅឡើយទេ។
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់</h2>
            <button className="btn btn-primary" onClick={handleOpenAddUser}>+ បង្កើតគណនីថ្មី</button>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>ឈ្មោះ</th>
                  <th style={{ padding: '1rem 1.5rem' }}>ឈ្មោះគណនី</th>
                  <th style={{ padding: '1rem 1.5rem' }}>លេខសម្ងាត់</th>
                  <th style={{ padding: '1rem 1.5rem' }}>តួនាទី</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.name}</td>
                    <td style={{ padding: '1rem 1.5rem' }}><code>{user.username}</code></td>
                    <td style={{ padding: '1rem 1.5rem' }}><code>{user.password}</code></td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
                        background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'teacher' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: user.role === 'admin' ? '#ef4444' : user.role === 'teacher' ? '#3b82f6' : '#10b981',
                        fontWeight: 600
                      }}>
                        {user.role === 'admin' ? 'អ្នកគ្រប់គ្រង' : user.role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenEditUser(user)} className="btn" style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">✏️</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHOOL INFO */}
      {activeTab === 'school' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>កំណត់ព័ត៌មានសាលារៀន</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ឈ្មោះសាលារៀន (ភាសាខ្មែរ)</label>
            <input 
              type="text" 
              className="input-field" 
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="វាយបញ្ចូលឈ្មោះសាលារៀន..."
              style={{ background: 'var(--main-bg)', padding: '0.85rem' }}
            />
          </div>

          <button className="btn btn-primary" onClick={handleSaveSchoolInfo} style={{ width: '100%', padding: '0.85rem' }}>
            រក្សាទុកការផ្លាស់ប្តូរ
          </button>
        </div>
      )}

      {/* TAG GROUP MODAL (Add/Edit) */}
      {isGroupModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '450px', maxWidth: '90%', padding: '2rem', background: 'var(--modal-bg)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{groupEditId ? 'កែប្រែក្រុមស្លាកពាក្យ' : 'បង្កើតក្រុមស្លាកពាក្យថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះក្រុម (Group Name)</label>
              <input type="text" className="input-field" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="ឧ. មុខវិជ្ជា, ថ្នាក់សិក្សា..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsGroupModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveGroup}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* TAG MODAL (Add/Edit) */}
      {isTagModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '450px', maxWidth: '90%', padding: '2rem', background: 'var(--modal-bg)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{tagEditId ? 'កែប្រែស្លាកពាក្យ' : 'បន្ថែមស្លាកពាក្យថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះស្លាកពាក្យ (Tag Name)</label>
              <input type="text" className="input-field" value={tagName} onChange={e => setTagName(e.target.value)} placeholder="ឧ. កម្រិតដំបូង, Programming..." />
            </div>

            {/* Move Tag (Assigned Group Selection) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ក្រុមស្លាកពាក្យ (Tag Group / Move to)</label>
              <select className="input-field" value={tagGroupId} onChange={e => setTagGroupId(e.target.value)}>
                <option value="">-- គ្មានក្រុម (Ungrouped) --</option>
                {tagGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ពណ៌ស្លាកពាក្យ (Badge Color)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {tagColors.map(c => (
                  <div 
                    key={c.hex}
                    onClick={() => setTagColor(c.hex)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: c.hex, cursor: 'pointer',
                      border: tagColor === c.hex ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                      transform: tagColor === c.hex ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
              <input type="color" value={tagColor} onChange={e => setTagColor(e.target.value)} style={{ width: '100%', height: '40px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsTagModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveTag}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '450px', maxWidth: '90%', padding: '2rem', background: 'var(--modal-bg)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{userEditId ? 'កែប្រែគណនី' : 'បង្កើតគណនីថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះពេញ</label>
              <input type="text" className="input-field" value={userNameField} onChange={e => setUserNameField(e.target.value)} placeholder="ឧ. សុខ ម៉េង" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះគណនី (Username)</label>
              <input type="text" className="input-field" value={userUsernameField} onChange={e => setUserUsernameField(e.target.value)} placeholder="Username សម្រាប់ Login" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>លេខសម្ងាត់ (Password)</label>
              <input type="text" className="input-field" value={userPasswordField} onChange={e => setUserPasswordField(e.target.value)} placeholder="បញ្ចូលលេខសម្ងាត់..." />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>តួនាទី</label>
              <select className="input-field" value={userRoleField} onChange={e => setUserRoleField(e.target.value)}>
                <option value="student">សិស្ស (Student)</option>
                <option value="teacher">គ្រូបង្រៀន (Teacher)</option>
                <option value="admin">អ្នកគ្រប់គ្រង (Admin)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsUserModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveUser}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
