"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { settingsService } from '@/services/db';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState<'tags' | 'users' | 'school' | 'studentOptions'>('tags');

  // Student Options States
  type StudentOption = { id: string; detail1?: string; detail2?: string };
  const normalizeOptions = (arr: any[]): StudentOption[] => (arr || []).map(item => typeof item === 'string' ? { id: item } : item);
  
  const [levels, setLevels] = useState<StudentOption[]>([]);
  const [shifts, setShifts] = useState<StudentOption[]>([]);
  const [addresses, setAddresses] = useState<StudentOption[]>([]);
  const [transports, setTransports] = useState<StudentOption[]>([]);
  const [genders, setGenders] = useState<StudentOption[]>([]);
  const [statuses, setStatuses] = useState<StudentOption[]>([]);
  const [editingOptionType, setEditingOptionType] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionDetail1, setNewOptionDetail1] = useState('');
  const [newOptionDetail2, setNewOptionDetail2] = useState('');

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

    const unsub = settingsService.subscribeOne('global', (data) => {
      if (data) {
        setTagGroups(data.appTagGroups || [
          { id: 1, name: 'កម្រិតថ្នាក់' },
          { id: 2, name: 'មុខវិជ្ជា' }
        ]);
        setTags(data.appTags || [
          { id: 1, name: 'ភាសាបរទេស', color: '#8b5cf6', groupId: 2 },
          { id: 2, name: 'បច្ចេកវិទ្យា', color: '#3b82f6', groupId: 2 },
          { id: 3, name: 'ថ្នាក់ទី១២', color: '#10b981', groupId: 1 }
        ]);
        setUsers(data.appUsers || []);
        setSchoolName(data.schoolName || 'សាលាអន្តរជាតិប្រេនស្តម');
        setLevels(normalizeOptions(data.appStudentLevels || ['កម្រិតបឋមសិក្សា', 'កម្រិតមធ្យមសិក្សា', 'កម្រិតវិទ្យាល័យ']));
        setShifts(normalizeOptions(data.appStudentShifts || ['វេនព្រឹក', 'វេនរសៀល', 'វេនល្ងាច', 'សៅរ៍-អាទិត្យ']));
        setAddresses(normalizeOptions(data.appStudentAddresses || ['ភ្នំពេញ', 'កណ្ដាល', 'តាកែវ', 'កំពង់ចាម']));
        setTransports(normalizeOptions(data.appStudentTransports || ['Bus', 'Personal', 'ម៉ូតូ', 'កង់']));
        setGenders(normalizeOptions(data.appStudentGenders || ['ប្រុស', 'ស្រី']));
        setStatuses(normalizeOptions(data.appStudentStatuses || ['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'បោះបង់ការសិក្សា']));
      } else {
        // Initialize defaults in Firebase
        settingsService.add({
          appTagGroups: [
            { id: 1, name: 'កម្រិតថ្នាក់' },
            { id: 2, name: 'មុខវិជ្ជា' }
          ],
          appTags: [
            { id: 1, name: 'ភាសាបរទេស', color: '#8b5cf6', groupId: 2 },
            { id: 2, name: 'បច្ចេកវិទ្យា', color: '#3b82f6', groupId: 2 },
            { id: 3, name: 'ថ្នាក់ទី១២', color: '#10b981', groupId: 1 }
          ],
          appUsers: [],
          schoolName: 'សាលាអន្តរជាតិប្រេនស្តម',
          appStudentLevels: normalizeOptions(['កម្រិតបឋមសិក្សា', 'កម្រិតមធ្យមសិក្សា', 'កម្រិតវិទ្យាល័យ']),
          appStudentShifts: normalizeOptions(['វេនព្រឹក', 'វេនរសៀល', 'វេនល្ងាច', 'សៅរ៍-អាទិត្យ']),
          appStudentAddresses: normalizeOptions(['ភ្នំពេញ', 'កណ្ដាល', 'តាកែវ', 'កំពង់ចាម']),
          appStudentTransports: normalizeOptions(['Bus', 'Personal', 'ម៉ូតូ', 'កង់']),
          appStudentGenders: normalizeOptions(['ប្រុស', 'ស្រី']),
          appStudentStatuses: normalizeOptions(['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'បោះបង់ការសិក្សា'])
        }, 'global');
      }
    });
    return () => unsub();
  }, [router]);

  const updateSettings = async (updates: any) => {
    await settingsService.add(updates, 'global');
  };

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
    updateSettings({ appTagGroups: updatedGroups });
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបក្រុមស្លាកពាក្យនេះមែនទេ? (ស្លាកពាក្យនៅក្នុងក្រុមនេះនឹងត្រូវប្តូរទៅជាគ្មានក្រុម)')) {
      const updatedGroups = tagGroups.filter(g => g.id !== id);
      setTagGroups(updatedGroups);
      updateSettings({ appTagGroups: updatedGroups });

      const updatedTags = tags.map(t => t.groupId === id ? { ...t, groupId: null } : t);
      setTags(updatedTags);
      updateSettings({ appTags: updatedTags });
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
    updateSettings({ appTags: updatedTags });
    setIsTagModalOpen(false);
  };

  const handleDeleteTag = (id: number) => {
    if (confirm('តើអ្នកពិតជាចង់លុបស្លាកពាក្យនេះមែនទេ?')) {
      const updatedTags = tags.filter(t => t.id !== id);
      setTags(updatedTags);
      updateSettings({ appTags: updatedTags });
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
      updateSettings({ appUsers: updated });
      setIsUserModalOpen(false);
    } else {
      alert('សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!');
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      updateSettings({ appUsers: updated });
    }
  };

  // School Info Functions
  const handleSaveSchoolInfo = () => {
    updateSettings({ schoolName: schoolName });
    alert('រក្សាទុកព័ត៌មានសាលារៀនដោយជោគជ័យ! (សូម Refresh ដើម្បីឃើញការផ្លាស់ប្តូរ)');
  };

  // Student Options Functions
  const handleSaveOption = () => {
    if (!newOptionValue.trim() || !editingOptionType) return;
    const val = newOptionValue.trim();
    const newObj = { id: val, detail1: newOptionDetail1.trim(), detail2: newOptionDetail2.trim() };
    
    if (editingOptionType === 'level') {
      const updated = levels.find(x => x.id === val) ? levels.map(x => x.id === val ? newObj : x) : [...levels, newObj];
      setLevels(updated); updateSettings({ appStudentLevels: updated });
    } else if (editingOptionType === 'shift') {
      const updated = shifts.find(x => x.id === val) ? shifts.map(x => x.id === val ? newObj : x) : [...shifts, newObj];
      setShifts(updated); updateSettings({ appStudentShifts: updated });
    } else if (editingOptionType === 'address') {
      const updated = addresses.find(x => x.id === val) ? addresses.map(x => x.id === val ? newObj : x) : [...addresses, newObj];
      setAddresses(updated); updateSettings({ appStudentAddresses: updated });
    } else if (editingOptionType === 'transport') {
      const updated = transports.find(x => x.id === val) ? transports.map(x => x.id === val ? newObj : x) : [...transports, newObj];
      setTransports(updated); updateSettings({ appStudentTransports: updated });
    } else if (editingOptionType === 'gender') {
      const updated = genders.find(x => x.id === val) ? genders.map(x => x.id === val ? newObj : x) : [...genders, newObj];
      setGenders(updated); updateSettings({ appStudentGenders: updated });
    } else if (editingOptionType === 'status') {
      const updated = statuses.find(x => x.id === val) ? statuses.map(x => x.id === val ? newObj : x) : [...statuses, newObj];
      setStatuses(updated); updateSettings({ appStudentStatuses: updated });
    }
    setNewOptionValue('');
    setNewOptionDetail1('');
    setNewOptionDetail2('');
  };

  const handleEditOption = (type: string, opt: StudentOption) => {
    setEditingOptionType(type);
    setNewOptionValue(opt.id);
    setNewOptionDetail1(opt.detail1 || '');
    setNewOptionDetail2(opt.detail2 || '');
    
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteOption = (type: string, val: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុប "${val}" មែនទេ?`)) return;
    if (type === 'level') {
      const updated = levels.filter(x => x.id !== val);
      setLevels(updated); updateSettings({ appStudentLevels: updated });
    } else if (type === 'shift') {
      const updated = shifts.filter(x => x.id !== val);
      setShifts(updated); updateSettings({ appStudentShifts: updated });
    } else if (type === 'address') {
      const updated = addresses.filter(x => x.id !== val);
      setAddresses(updated); updateSettings({ appStudentAddresses: updated });
    } else if (type === 'transport') {
      const updated = transports.filter(x => x.id !== val);
      setTransports(updated); updateSettings({ appStudentTransports: updated });
    } else if (type === 'gender') {
      const updated = genders.filter(x => x.id !== val);
      setGenders(updated); updateSettings({ appStudentGenders: updated });
    } else if (type === 'status') {
      const updated = statuses.filter(x => x.id !== val);
      setStatuses(updated); updateSettings({ appStudentStatuses: updated });
    }
  };

  if (role !== 'admin') return null;

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>ការកំណត់របស់ Admin</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>ផ្ទាំងបញ្ជាកណ្តាលសម្រាប់គ្រប់គ្រងប្រព័ន្ធ</p>
      </div>

      {/* Tab Selectors (No Emojis, replaced with pure SVGs) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('tags')}
          style={{ 
            padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', 
            color: activeTab === 'tags' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
            borderBottom: activeTab === 'tags' ? '3px solid var(--accent-primary)' : '3px solid transparent', 
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          គ្រប់គ្រង Tags & ក្រុម
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ 
            padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', 
            color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
            borderBottom: activeTab === 'users' ? '3px solid var(--accent-primary)' : '3px solid transparent', 
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          អ្នកប្រើប្រាស់ (Users)
        </button>
        <button 
          onClick={() => setActiveTab('school')}
          style={{ 
            padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', 
            color: activeTab === 'school' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
            borderBottom: activeTab === 'school' ? '3px solid var(--accent-primary)' : '3px solid transparent', 
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          ព័ត៌មានសាលា (School Info)
        </button>
        <button 
          onClick={() => setActiveTab('studentOptions')}
          style={{ 
            padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', 
            color: activeTab === 'studentOptions' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
            borderBottom: activeTab === 'studentOptions' ? '3px solid var(--accent-primary)' : '3px solid transparent', 
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          កំណត់ទម្រង់សិស្ស
        </button>
      </div>

      {/* TAB CONTENT: TAGS & GROUPS */}
      {activeTab === 'tags' && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Column 1: Tag Groups (35% Width) */}
          <div style={{ flex: '1 1 350px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                ក្រុមស្លាកពាក្យ (Tag Groups)
              </h2>
              <button className="btn btn-primary" onClick={handleOpenAddGroup} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                + បង្កើតក្រុម
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tagGroups.map(group => (
                <div key={group.id} className="flex-between" style={{ padding: '0.75rem', background: 'var(--main-bg)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{group.name}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleOpenEditGroup(group)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center' }} title="កែប្រែ">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
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
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                ស្លាកពាក្យ (Tags)
              </h2>
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
                      <button onClick={() => handleOpenEditTag(tag)} className="btn" style={{ padding: '0.35rem 0.6rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }} title="កែប្រែ / ប្តូរក្រុម">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Move/Edit
                      </button>
                      <button onClick={() => handleDeleteTag(tag.id)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
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
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់
            </h2>
            <button className="btn btn-primary" onClick={handleOpenAddUser}>+ បង្កើតគណនីថ្មី</button>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto' }}>
            <div className="table-responsive">
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
                        <button onClick={() => handleOpenEditUser(user)} className="btn" style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center' }} title="កែប្រែ">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHOOL INFO */}
      {activeTab === 'school' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            កំណត់ព័ត៌មានសាលារៀន
          </h2>
          
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

      {/* TAB CONTENT: STUDENT OPTIONS */}
      {activeTab === 'studentOptions' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>កំណត់ទម្រង់សិស្ស (Student Form Options)</h2>
          
          {/* Add Option Input Row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ប្រភេទជម្រើស</label>
              <select className="input-field" value={editingOptionType || ''} onChange={(e) => setEditingOptionType(e.target.value)}>
                <option value="" disabled>-- ជ្រើសរើសប្រភេទ --</option>
                <option value="gender">ភេទ (Gender)</option>
                <option value="level">កម្រិតសិក្សា (Level)</option>
                <option value="shift">វេនសិក្សា (Shift)</option>
                <option value="status">ស្ថានភាព (Status)</option>
                <option value="address">អាសយដ្ឋាន (Address)</option>
                <option value="transport">មធ្យោបាយ (Transport)</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>តម្លៃថ្មី (Main)</label>
              <input type="text" className="input-field" value={newOptionValue} onChange={e => setNewOptionValue(e.target.value)} placeholder="តម្លៃគោល/អក្សរកាត់" onKeyDown={(e) => e.key === 'Enter' && handleSaveOption()} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ព័ត៌មានលម្អិត ១ (ស្រេចចិត្ត)</label>
              <input type="text" className="input-field" value={newOptionDetail1} onChange={e => setNewOptionDetail1(e.target.value)} placeholder="ឧ. អត្ថន័យពេញ" onKeyDown={(e) => e.key === 'Enter' && handleSaveOption()} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ព័ត៌មានលម្អិត ២ (ស្រេចចិត្ត)</label>
              <input type="text" className="input-field" value={newOptionDetail2} onChange={e => setNewOptionDetail2(e.target.value)} placeholder="ឧ. ផ្សេងៗ" onKeyDown={(e) => e.key === 'Enter' && handleSaveOption()} />
            </div>
            <button className="btn btn-primary" onClick={handleSaveOption} disabled={!editingOptionType || !newOptionValue.trim()} style={{ padding: '0.8rem 1.5rem', height: 'max-content' }}>
              បន្ថែម
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>ភេទ (Gender) ({genders.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {genders.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('gender', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('gender', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>កម្រិតសិក្សា (Level) ({levels.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {levels.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('level', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('level', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>វេនសិក្សា (Shift) ({shifts.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {shifts.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('shift', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('shift', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>ស្ថានភាព (Status) ({statuses.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {statuses.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('status', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('status', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>អាសយដ្ឋាន (Address) ({addresses.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {addresses.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('address', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('address', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>មធ្យោបាយ (Transport) ({transports.length})</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {transports.map(val => (
                  <li key={val.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--border-color)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{val.id}</strong>
                      {(val.detail1 || val.detail2) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {val.detail1} {val.detail1 && val.detail2 ? '•' : ''} {val.detail2}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleEditOption('transport', val)} className="btn" style={{ color: '#3b82f6', background: 'transparent', padding: '0.4rem', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteOption('transport', val.id)} className="btn" style={{ color: 'var(--danger)', background: 'transparent', padding: '0.4rem', border: 'none' }} title="លុប">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAG GROUP MODAL (Add/Edit) */}
      {isGroupModalOpen && (
        <div 
          onClick={() => setIsGroupModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal" 
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
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
        <div 
          onClick={() => setIsTagModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal" 
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{tagEditId ? 'កែប្រែស្លាកពាក្យ' : 'បន្ថែមស្លាកពាក្យថ្មី'}</h2>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះស្លាកពាក្យ (Tag Name)</label>
              <input type="text" className="input-field" value={tagName} onChange={e => setTagName(e.target.value)} placeholder="ឧ. កម្រិតដំបូង, Programming..." />
            </div>

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
        <div 
          onClick={() => setIsUserModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal" 
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
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
