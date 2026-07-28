"use client";
import { convertDriveImageLink } from '../../../utils/driveLink';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { settingsService, teacherService } from '@/services/db';
import SortDropdown from '@/components/SortDropdown';

export default function TeachersPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [linkedUserIdField, setLinkedUserIdField] = useState('');
  
  const [teacherSortBy, setTeacherSortBy] = useState('teacherId');
  const [teacherSortOrder, setTeacherSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // State for Teachers
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherEditId, setTeacherEditId] = useState<string | null>(null);

  // Form Fields
  const [teacherIdField, setTeacherIdField] = useState('');
  const [fullNameField, setFullNameField] = useState('');
  const [englishNameField, setEnglishNameField] = useState('');
  const [genderField, setGenderField] = useState('áž”áŸ’ážšáž»ážŸ');
  const [dobField, setDobField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [subjectField, setSubjectField] = useState('');
  const [addressField, setAddressField] = useState('');
  const [joinDateField, setJoinDateField] = useState('');
  const [photoField, setPhotoField] = useState('');
  const [statusField, setStatusField] = useState('áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“');
  // Contacts
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookLink, setFacebookLink] = useState('');
  const [otherContactEnabled, setOtherContactEnabled] = useState(false);
  const [otherContactLabel, setOtherContactLabel] = useState('');
  const [otherContactLink, setOtherContactLink] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || '';
    setRole(currentRole);
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    
    if (currentRole !== 'admin' && currentRole !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    const unsubSettings = settingsService.subscribeOne('global', (data) => {
      if (data && data.appUsers) {
        setAppUsers(data.appUsers.filter((u: any) => u.role === 'admin' || u.role === 'teacher'));
      }
    });

    const unsubscribe = teacherService.subscribeAll((data) => {
      const filtered = data.filter((t: any) => currentRole === 'admin' || t.linkedUserId === userId || t.fullName === userName);
      setTeachers(filtered);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [router]);

  const handleOpenAddTeacher = () => {
    setTeacherEditId(null);
    setTeacherIdField('');
    setFullNameField('');
    setEnglishNameField('');
    setGenderField('áž”áŸ’ážšáž»ážŸ');
    setDobField('');
    setPhoneField('');
    setSubjectField('');
    setAddressField('');
    setJoinDateField('');
    setPhotoField('');
    setStatusField('áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“');
    setLinkedUserIdField('');
    setTelegramEnabled(false);
    setTelegramLink('');
    setFacebookEnabled(false);
    setFacebookLink('');
    setOtherContactEnabled(false);
    setOtherContactLabel('');
    setOtherContactLink('');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: any) => {
    setTeacherEditId(teacher.id);
    setTeacherIdField(teacher.teacherId);
    setFullNameField(teacher.fullName);
    setEnglishNameField(teacher.englishName);
    setGenderField(teacher.gender);
    setDobField(teacher.dob);
    setPhoneField(teacher.phone);
    setSubjectField(teacher.subject);
    setAddressField(teacher.address);
    setJoinDateField(teacher.joinDate);
    setPhotoField(teacher.photo || '');
    setStatusField(teacher.status);
    setLinkedUserIdField(teacher.linkedUserId || '');
    setTelegramEnabled(!!teacher.contacts?.telegram);
    setTelegramLink(teacher.contacts?.telegram || '');
    setFacebookEnabled(!!teacher.contacts?.facebook);
    setFacebookLink(teacher.contacts?.facebook || '');
    setOtherContactEnabled(!!teacher.contacts?.other?.link);
    setOtherContactLabel(teacher.contacts?.other?.label || '');
    setOtherContactLink(teacher.contacts?.other?.link || '');
    setIsTeacherModalOpen(true);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm('ážáž¾áž¢áŸ’áž“áž€áž–áž·ážáž‡áž¶áž…áž„áŸ‹áž›áž»áž”áž‚áŸ’ážšáž¼áž“áŸáŸ‡áž˜áŸ‚áž“áž‘áŸ?')) {
      teacherService.delete(id);
    }
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameField || !teacherIdField) {
      alert('ážŸáž¼áž˜áž”áŸ†áž–áŸáž‰áž–áŸážáŸŒáž˜áž¶áž“ážŠáŸ‚áž›áž…áž¶áŸ†áž”áž¶áž…áŸ‹!');
      return;
    }
    const newTeacher = {
      teacherId: teacherIdField,
      fullName: fullNameField,
      englishName: englishNameField,
      gender: genderField,
      dob: dobField,
      phone: phoneField,
      subject: subjectField,
      address: addressField,
      joinDate: joinDateField,
      photo: photoField,
      status: statusField,
      linkedUserId: role === 'admin' ? linkedUserIdField : (teacherEditId ? (teachers.find(t=>t.id===teacherEditId)?.linkedUserId || currentUserId) : currentUserId),
      contacts: {
        telegram: telegramEnabled ? telegramLink : '',
        facebook: facebookEnabled ? facebookLink : '',
        other: otherContactEnabled ? { label: otherContactLabel, link: otherContactLink } : null
      }
    };
    
    if (teacherEditId) {
      teacherService.update(teacherEditId, newTeacher);
    } else {
      teacherService.add(newTeacher);
    }
    
    setIsTeacherModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoField(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.fullName.includes(search) || t.englishName.toLowerCase().includes(search.toLowerCase()) || (t.teacherId && t.teacherId.includes(search))
  ).sort((a, b) => {
    let comparison = 0;
    if (teacherSortBy === 'startDate') {
      comparison = new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
    } else {
      const valA = (a[teacherSortBy] || '').toString();
      const valB = (b[teacherSortBy] || '').toString();
      comparison = valA.localeCompare(valB, 'km-KH');
    }
    return teacherSortOrder === 'asc' ? comparison : -comparison;
  });

  if (!role) return null;

  return (
    <>
      <div className="page-container animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>áž–áŸážáŸŒáž˜áž¶áž“áž‚áŸ’ážšáž¼ (Teachers)</h1>
            <p style={{ color: 'var(--text-secondary)' }}>áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„áž‘áž·áž“áŸ’áž“áž“áŸáž™áž‚áŸ’ážšáž¼áž”áž„áŸ’ážšáŸ€áž“áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹</p>
          </div>
          <button 
            onClick={handleOpenAddTeacher}
            style={{ padding: '0.6rem 1.2rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            áž”áž‰áŸ’áž…áž¼áž›áž‚áŸ’ážšáž¼ážáŸ’áž˜áž¸
          </button>
        </div>

        {/* Filters */}
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ážŸáŸ’ážœáŸ‚áž„ážšáž€</label>
              <input 
                type="text" 
                placeholder="ážˆáŸ’áž˜áŸ„áŸ‡ áž¬áž¢ážáŸ’ážáž›áŸáž..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <SortDropdown 
                options={[
                  { value: 'teacherId', label: 'áž¢ážáŸ’ážáž›áŸáž' },
                  { value: 'fullName', label: 'ážˆáŸ’áž˜áŸ„áŸ‡' },
                  { value: 'englishName', label: 'ážˆáŸ’áž˜áŸ„áŸ‡áž¡áž¶ážáž¶áŸ†áž„' },
                  { value: 'gender', label: 'áž—áŸáž‘' },
                  { value: 'phone', label: 'áž›áŸážáž‘áž¼ážšážŸáŸáž–áŸ’áž‘' },
                  { value: 'startDate', label: 'ážáŸ’áž„áŸƒáž…áž¼áž›áž”áž„áŸ’ážšáŸ€áž“' }
                ]}
                sortBy={teacherSortBy}
                sortOrder={teacherSortOrder}
                onSortChange={(by, order) => {
                  setTeacherSortBy(by);
                  setTeacherSortOrder(order);
                }}
              />
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
          <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>áž›áŸážážšáŸ€áž„</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ážšáž¼áž”ážáž</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>áž¢ážáŸ’áž áž›áŸáž</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ážˆáŸ’áž˜áŸ„áŸ‡ážáŸ’áž˜áŸ‚ážš</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>áž¡áž¶ážáž¶áŸ†áž„</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>áž—áŸáž‘</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>áž›áŸážáž‘áž¼ážšážŸáŸáž–áŸ’áž‘</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Contacts</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ážŸáŸ’ážáž¶áž“áž—áž¶áž–</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher, index) => (
                <tr key={teacher.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{index + 1}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {teacher.photo ? <img src={convertDriveImageLink(teacher.photo)} alt={teacher.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{teacher.teacherId}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{teacher.fullName}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.englishName}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.gender}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {teacher.contacts?.telegram && (
                        <a href={teacher.contacts.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }} title="Telegram">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2L2 11.5L8.5 14L10 21.5L13.5 17L18.5 21L21.5 2Z" /></svg>
                        </a>
                      )}
                      {teacher.contacts?.facebook && (
                        <a href={teacher.contacts.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }} title="Facebook">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                      )}
                      {teacher.contacts?.other?.link && (
                        <a href={teacher.contacts.other.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} title={teacher.contacts.other.label || 'Link'}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '500', background: teacher.status === 'áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: teacher.status === 'áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“' ? '#10b981' : '#ef4444' }}>
                      {teacher.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenEditTeacher(teacher)} style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="áž€áŸ‚áž”áŸ’ážšáŸ‚">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteTeacher(teacher.id)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="áž›áž»áž”">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>áž˜áž·áž“áž˜áž¶áž“áž‘áž·áž“áŸ’áž“áž“áŸáž™áž‚áŸ’ážšáž¼áž‘áŸ</td>
                </tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {/* Teacher Modal */}
      {isTeacherModalOpen && (
        <div 
          onClick={() => setIsTeacherModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-in" 
            style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--modal-bg)' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--modal-bg)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{teacherEditId ? 'áž€áŸ‚áž”áŸ’ážšáŸ‚áž–áŸážáŸŒáž˜áž¶áž“áž‚áŸ’ážšáž¼' : 'áž”áž‰áŸ’áž…áž¼áž›áž‚áŸ’ážšáž¼ážáŸ’áž˜áž¸'}</h2>
              <button onClick={() => setIsTeacherModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSaveTeacher} style={{ padding: '1.5rem' }}>
              
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoField ? <img src={convertDriveImageLink(photoField)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ážšáž¼áž”ážáž</span>}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážšáž¼áž”ážáž</button>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž¢ážáŸ’ážáž›áŸáž *</label>
                    <input type="text" value={teacherIdField} onChange={e => setTeacherIdField(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ážˆáŸ’áž˜áŸ„áŸ‡ážáŸ’áž˜áŸ‚ážš *</label>
                    <input type="text" value={fullNameField} onChange={e => setFullNameField(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž¢áž€áŸ’ážŸážšáž¡áž¶ážáž¶áŸ†áž„</label>
                    <input type="text" value={englishNameField} onChange={e => setEnglishNameField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž—áŸáž‘</label>
                    <select value={genderField} onChange={e => setGenderField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="áž”áŸ’ážšáž»ážŸ">áž”áŸ’ážšáž»ážŸ</option>
                      <option value="ážŸáŸ’ážšáž¸">ážŸáŸ’ážšáž¸</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž˜áž»ážážœáž·áž‡áŸ’áž‡áž¶</label>
                  <input type="text" value={subjectField} onChange={e => setSubjectField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž‘áž¼ážšážŸáŸáž–áŸ’áž‘</label>
                  <input type="text" value={phoneField} onChange={e => setPhoneField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ážáŸ’áž„áŸƒážáŸ‚áž†áŸ’áž“áž¶áŸ†áž€áŸ†ážŽáž¾áž</label>
                  <input type="date" value={dobField} onChange={e => setDobField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ážáŸ’áž„áŸƒáž…áž¼áž›áž’áŸ’ážœáž¾áž€áž¶ážš</label>
                  <input type="date" value={joinDateField} onChange={e => setJoinDateField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž¢áž¶ážŸáž™ážŠáŸ’áž‹áž¶áž“</label>
                  <input type="text" value={addressField} onChange={e => setAddressField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ážŸáŸ’ážáž¶áž“áž—áž¶áž–</label>
                  <select value={statusField} onChange={e => setStatusField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“">áž€áŸ†áž–áž»áž„áž”áž„áŸ’ážšáŸ€áž“</option>
                    <option value="ážˆáž”áŸ‹áž”áž„áŸ’ážšáŸ€áž“">ážˆáž”áŸ‹áž”áž„áŸ’ážšáŸ€áž“</option>
                  </select>
                </div>
                {role === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>áž—áŸ’áž‡áž¶áž”áŸ‹áž‡áž¶áž˜áž½áž™áž‚ážŽáž“áž¸ (Linked User)</label>
                    <select value={linkedUserIdField} onChange={e => setLinkedUserIdField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">-- áž˜áž·áž“áž‘áž¶áž“áŸ‹áž—áŸ’áž‡áž¶áž”áŸ‹ --</option>
                      {appUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>áž‘áŸ†áž“áž¶áž€áŸ‹áž‘áŸ†áž“áž„ (Contacts)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} /> Telegram
                    </label>
                    {telegramEnabled && (
                      <input type="url" className="input-field" placeholder="https://t.me/username" value={telegramLink} onChange={e => setTelegramLink(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={facebookEnabled} onChange={(e) => setFacebookEnabled(e.target.checked)} /> Facebook
                    </label>
                    {facebookEnabled && (
                      <input type="url" className="input-field" placeholder="https://facebook.com/username" value={facebookLink} onChange={e => setFacebookLink(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={otherContactEnabled} onChange={(e) => setOtherContactEnabled(e.target.checked)} /> áž•áŸ’ážŸáŸáž„áŸ—
                    </label>
                    {otherContactEnabled && (
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px', flexWrap: 'wrap' }}>
                        <input type="text" className="input-field" placeholder="ážˆáŸ’áž˜áŸ„áŸ‡ (áž§. Line)" value={otherContactLabel} onChange={e => setOtherContactLabel(e.target.value)} style={{ width: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                        <input type="url" className="input-field" placeholder="Link URL" value={otherContactLink} onChange={e => setOtherContactLink(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsTeacherModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>áž”áŸ„áŸ‡áž”áž„áŸ‹</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>ážšáž€áŸ’ážŸáž¶áž‘áž»áž€</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

