"use client";
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CustomDatePicker from '@/components/CustomDatePicker';
import { useRouter } from 'next/navigation';
import { settingsService, teacherService } from '@/services/db';
import SortDropdown from '@/components/SortDropdown';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import ImageUploadBox from '@/components/ImageUploadBox';
import TeacherDetailModal from '@/components/TeacherDetailModal';
import { convertDriveImageLink } from '@/utils/driveLink';
import { formatDateToDMY } from '@/utils/dateFormatter';
import { useConfirm } from '@/components/ConfirmDialog';

export default function TeachersPage() {
  const confirmDialog = useConfirm();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [linkedUserIdField, setLinkedUserIdField] = useState('');

  const [teacherSortBy, setTeacherSortBy] = useState('teacherId');
  const [teacherSortOrder, setTeacherSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'កំពុងបង្រៀន' | 'ឈប់បង្រៀន'>('all');

  // State for Teachers
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherEditId, setTeacherEditId] = useState<string | null>(null);
  const [detailTeacher, setDetailTeacher] = useState<any | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form Fields
  const [teacherIdField, setTeacherIdField] = useState('');
  const [fullNameField, setFullNameField] = useState('');
  const [englishNameField, setEnglishNameField] = useState('');
  const [genderField, setGenderField] = useState('ប្រុស');
  const [dobField, setDobField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [subjectField, setSubjectField] = useState('');
  const [addressField, setAddressField] = useState('');
  const [joinDateField, setJoinDateField] = useState('');
  const [photoField, setPhotoField] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [statusField, setStatusField] = useState('កំពុងបង្រៀន');

  // Contacts
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookLink, setFacebookLink] = useState('');
  const [otherContactEnabled, setOtherContactEnabled] = useState(false);
  const [otherContactLabel, setOtherContactLabel] = useState('');
  const [otherContactLink, setOtherContactLink] = useState('');

  // Search
  const [search, setSearch] = useState('');

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

    // Admin sees all teachers; Teacher accounts see strictly their own profile only
    const unsubscribe = teacherService.subscribeAll((data) => {
      const filtered =
        currentRole === 'admin'
          ? data
          : data.filter((t: any) => t.linkedUserId === userId || (userName && t.fullName === userName));
      setTeachers(filtered);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [router]);

  const isOwnProfile = (teacher: any) => {
    if (!teacher) return false;
    return Boolean(
      (currentUserId && teacher.linkedUserId === currentUserId) ||
        (currentUserName && teacher.fullName === currentUserName)
    );
  };

  const canEditTeacher = (teacher: any) => role === 'admin' || isOwnProfile(teacher);

  const myTeacherProfile = useMemo(
    () => teachers.find((t) => isOwnProfile(t)) || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teachers, currentUserId, currentUserName]
  );

  const handleOpenAddTeacher = () => {
    if (role !== 'admin') return;
    setTeacherEditId(null);
    setTeacherIdField('');
    setFullNameField('');
    setEnglishNameField('');
    setGenderField('ប្រុស');
    setDobField('');
    setPhoneField('');
    setSubjectField('');
    setAddressField('');
    setJoinDateField('');
    setPhotoField('');
    setStatusField('កំពុងបង្រៀន');
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
    if (!canEditTeacher(teacher)) return;
    setTeacherEditId(teacher.id);
    setTeacherIdField(teacher.teacherId || '');
    setFullNameField(teacher.fullName || '');
    setEnglishNameField(teacher.englishName || '');
    setGenderField(teacher.gender || 'ប្រុស');
    setDobField(teacher.dob || '');
    setPhoneField(teacher.phone || '');
    setSubjectField(teacher.subject || '');
    setAddressField(teacher.address || '');
    setJoinDateField(teacher.joinDate || '');
    setPhotoField(teacher.photo || '');
    setStatusField(teacher.status || 'កំពុងបង្រៀន');
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

  const handleDeleteTeacher = async (id: string) => {
    if (role !== 'admin') return;
    if (await confirmDialog('តើអ្នកពិតជាចង់លុបគ្រូនេះមែនទេ?')) {
      teacherService.delete(id);
    }
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameField || !teacherIdField) {
      alert('សូមបំពេញព័ត៌មានដែលចាំបាច់!');
      return;
    }

    const existingTeacher = teacherEditId ? teachers.find((t) => t.id === teacherEditId) : null;
    if (role !== 'admin' && (!existingTeacher || !isOwnProfile(existingTeacher))) {
      alert('អ្នកអាចកែប្រែបានតែព័ត៌មានផ្ទាល់ខ្លួនប៉ុណ្ណោះ!');
      return;
    }

    const payload = {
      teacherId: role === 'admin' ? teacherIdField : existingTeacher?.teacherId || teacherIdField,
      fullName: fullNameField,
      englishName: englishNameField,
      gender: genderField,
      dob: dobField,
      phone: phoneField,
      subject: subjectField,
      address: addressField,
      joinDate: role === 'admin' ? joinDateField : existingTeacher?.joinDate || joinDateField,
      photo: photoField,
      status: role === 'admin' ? statusField : existingTeacher?.status || statusField,
      linkedUserId:
        role === 'admin'
          ? linkedUserIdField
          : existingTeacher?.linkedUserId || currentUserId,
      contacts: {
        telegram: telegramEnabled ? telegramLink : '',
        facebook: facebookEnabled ? facebookLink : '',
        other: otherContactEnabled ? { label: otherContactLabel, link: otherContactLink } : null,
      },
    };

    if (teacherEditId) {
      teacherService.update(teacherEditId, payload);
    } else {
      teacherService.add(payload);
    }

    setIsTeacherModalOpen(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setIsUploadSuccess(false);
      const { compressImage } = await import('@/utils/imageCompressor');
      const { uploadTeacherPhoto } = await import('@/services/db/StorageService');
      const compressedBlob = await compressImage(file, 300, 1024);

      const teacherName = englishNameField || fullNameField || 'teacher';
      const tId = teacherIdField || 'no_id';
      const formattedName = `${tId}_${teacherName}`.replace(/\s+/g, '_');

      const url = await uploadTeacherPhoto(compressedBlob, formattedName);
      setPhotoField(url);
      setIsUploadSuccess(true);
      setTimeout(() => setIsUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to upload photo', err);
      alert('បរាជ័យក្នុងការបញ្ចូលរូបថត។');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter((t) => {
        if (statusFilter !== 'all' && (t.status || 'កំពុងបង្រៀន') !== statusFilter) return false;
        if (!q) return true;
        return (
          (t.fullName || '').toLowerCase().includes(q) ||
          (t.englishName || '').toLowerCase().includes(q) ||
          (t.teacherId || '').toLowerCase().includes(q) ||
          (t.subject || '').toLowerCase().includes(q) ||
          (t.phone || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Put own profile first in cards view by default if sorting by teacherId asc? Keep strict requested sort!
        let comparison = 0;
        if (teacherSortBy === 'joinDate' || teacherSortBy === 'startDate') {
          comparison =
            new Date(a.joinDate || a.startDate || 0).getTime() -
            new Date(b.joinDate || b.startDate || 0).getTime();
        } else {
          const valA = (a[teacherSortBy] || '').toString();
          const valB = (b[teacherSortBy] || '').toString();
          comparison = valA.localeCompare(valB, 'km-KH');
        }
        return teacherSortOrder === 'asc' ? comparison : -comparison;
      });
  }, [teachers, search, statusFilter, teacherSortBy, teacherSortOrder]);

  if (!role) return null;

  const isEditingSelfOnly = role !== 'admin' && Boolean(teacherEditId);

  return (
    <>
      <div className="page-container animate-fade-in">
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.15rem',
            flexWrap: 'wrap',
            gap: '0.85rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 0.2rem 0' }}>
              {role === 'admin' ? 'ព័ត៌មាន និងប្រវត្តិរូបគ្រូ' : 'ព័ត៌មានផ្ទាល់ខ្លួន'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
              {role === 'admin'
                ? `រូបថត និងប្រវត្តិរូបគ្រូបង្រៀនទាំងអស់ (${teachers.length} នាក់)`
                : 'ព័ត៌មានលម្អិតនៃប្រវត្តិរូបគ្រូបង្រៀនរបស់អ្នក'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {myTeacherProfile && (
              <button
                type="button"
                onClick={() => handleOpenEditTeacher(myTeacherProfile)}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>កែប្រែព័ត៌មាន</span>
              </button>
            )}

            {role === 'admin' && (
              <button
                type="button"
                onClick={handleOpenAddTeacher}
                style={{
                  padding: '0.6rem 1.15rem',
                  background: 'var(--card-bg)',
                  color: 'var(--primary-color)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>បញ្ចូលគ្រូថ្មី</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Personal Detail View for Teacher Role (Cannot view other accounts) */}
        {role !== 'admin' ? (
          myTeacherProfile ? (
            <div
              className="glass-panel"
              style={{
                borderRadius: '22px',
                overflow: 'hidden',
                padding: 0,
                maxWidth: '720px',
                margin: '0 auto',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Soft Top Banner */}
              <div
                style={{
                  height: '115px',
                  background:
                    myTeacherProfile.gender === 'ស្រី'
                      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.24), rgba(139, 92, 246, 0.22))'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.24), rgba(16, 185, 129, 0.2))',
                }}
              />

              <div style={{ padding: '0 1.5rem 1.5rem', marginTop: '-56px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div
                    onClick={() =>
                      myTeacherProfile.photo && setPreviewPhotoUrl(convertDriveImageLink(myTeacherProfile.photo))
                    }
                    style={{
                      width: '108px',
                      height: '108px',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      border: '4px solid var(--modal-bg, #ffffff)',
                      boxShadow: '0 10px 26px rgba(0, 0, 0, 0.16)',
                      background:
                        myTeacherProfile.gender === 'ស្រី'
                          ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                          : 'linear-gradient(135deg, #3b82f6, #10b981)',
                      color: '#ffffff',
                      fontSize: '2.4rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: myTeacherProfile.photo ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                    title={myTeacherProfile.photo ? 'ចុចដើម្បីមើលរូបភាពធំ' : undefined}
                  >
                    {myTeacherProfile.photo ? (
                      <img
                        src={convertDriveImageLink(myTeacherProfile.photo)}
                        alt={myTeacherProfile.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      (myTeacherProfile.fullName || 'T').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '0.25rem' }}>
                    {myTeacherProfile.teacherId && (
                      <span
                        style={{
                          padding: '0.32rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        អត្តលេខ៖ {myTeacherProfile.teacherId}
                      </span>
                    )}
                    <span
                      style={{
                        padding: '0.32rem 0.78rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background:
                          myTeacherProfile.status === 'កំពុងបង្រៀន'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color: myTeacherProfile.status === 'កំពុងបង្រៀន' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {myTeacherProfile.status || 'កំពុងបង្រៀន'}
                    </span>
                  </div>
                </div>

                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {myTeacherProfile.fullName}
                </h2>
                {myTeacherProfile.englishName && (
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.15rem', fontWeight: 500 }}>
                    {myTeacherProfile.englishName}
                  </div>
                )}

                {/* Detailed Info Grid */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.1rem',
                    borderRadius: '16px',
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-color)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <ProfileDetailItem label="មុខវិជ្ជាបង្រៀន" value={myTeacherProfile.subject || 'មិនមាន'} />
                  <ProfileDetailItem label="ភេទ" value={myTeacherProfile.gender || '-'} />
                  <ProfileDetailItem
                    label="លេខទូរស័ព្ទ"
                    value={myTeacherProfile.phone || 'មិនមាន'}
                    href={myTeacherProfile.phone ? `tel:${myTeacherProfile.phone}` : undefined}
                  />
                  <ProfileDetailItem label="ថ្ងៃខែឆ្នាំកំណើត" value={formatDateToDMY(myTeacherProfile.dob) || 'មិនមាន'} />
                  <ProfileDetailItem label="ថ្ងៃចូលធ្វើការ" value={formatDateToDMY(myTeacherProfile.joinDate) || 'មិនមាន'} />
                  <ProfileDetailItem label="អាសយដ្ឋាន" value={myTeacherProfile.address || 'មិនមាន'} />
                </div>

                {/* Social Contacts */}
                {(myTeacherProfile.contacts?.telegram ||
                  myTeacherProfile.contacts?.facebook ||
                  myTeacherProfile.contacts?.other?.link) && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {myTeacherProfile.contacts?.telegram && (
                      <a
                        href={myTeacherProfile.contacts.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={selfContactPill('#0088cc')}
                      >
                        Telegram
                      </a>
                    )}
                    {myTeacherProfile.contacts?.facebook && (
                      <a
                        href={myTeacherProfile.contacts.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={selfContactPill('#1877F2')}
                      >
                        Facebook
                      </a>
                    )}
                    {myTeacherProfile.contacts?.other?.link && (
                      <a
                        href={myTeacherProfile.contacts.other.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={selfContactPill('var(--text-primary)')}
                      >
                        {myTeacherProfile.contacts.other.label || 'តំណភ្ជាប់ផ្សេងៗ'}
                      </a>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '1.35rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditTeacher(myTeacherProfile)}
                    className="btn btn-primary"
                    style={{ padding: '0.7rem 1.4rem', borderRadius: '12px', gap: '0.45rem' }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>កែប្រែព័ត៌មាន</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
              មិនទាន់មានព័ត៌មានប្រវត្តិរូបភ្ជាប់ជាមួយគណនីរបស់អ្នកទេ។ សូមទាក់ទង Admin។
            </div>
          )
        ) : (
          <>
        {/* Admin View: Highlighted My Profile Card (if linked) + Full Teachers Directory */}
        {myTeacherProfile && (
          <div
            className="glass-panel"
            style={{
              padding: '1.15rem',
              marginBottom: '1.15rem',
              borderRadius: '18px',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, var(--border-color))',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 9%, var(--card-bg)), var(--card-bg))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: '1 1 260px' }}>
              <div
                onClick={() =>
                  myTeacherProfile.photo && setPreviewPhotoUrl(convertDriveImageLink(myTeacherProfile.photo))
                }
                style={{
                  width: '78px',
                  height: '78px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '2.5px solid var(--accent-primary)',
                  background:
                    myTeacherProfile.gender === 'ស្រី'
                      ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                      : 'linear-gradient(135deg, #3b82f6, #10b981)',
                  color: '#ffffff',
                  fontSize: '1.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: myTeacherProfile.photo ? 'pointer' : 'default',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                }}
                title={myTeacherProfile.photo ? 'ចុចដើម្បីមើលរូបភាពធំ' : undefined}
              >
                {myTeacherProfile.photo ? (
                  <img
                    src={convertDriveImageLink(myTeacherProfile.photo)}
                    alt={myTeacherProfile.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (myTeacherProfile.fullName || 'T').charAt(0).toUpperCase()
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      padding: '0.18rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                    }}
                  >
                    ប្រវត្តិរូបរបស់ខ្ញុំ
                  </span>
                  {myTeacherProfile.teacherId && (
                    <span
                      style={{
                        padding: '0.18rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      ID: {myTeacherProfile.teacherId}
                    </span>
                  )}
                </div>

                <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {myTeacherProfile.fullName}
                  {myTeacherProfile.englishName && (
                    <span style={{ fontWeight: 500, fontSize: '0.92rem', color: 'var(--text-secondary)', marginLeft: '0.45rem' }}>
                      ({myTeacherProfile.englishName})
                    </span>
                  )}
                </h2>

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  {myTeacherProfile.subject && <span>មុខវិជ្ជា៖ <strong style={{ color: 'var(--text-primary)' }}>{myTeacherProfile.subject}</strong></span>}
                  {myTeacherProfile.phone && <span>ទូរស័ព្ទ៖ <strong style={{ color: 'var(--text-primary)' }}>{myTeacherProfile.phone}</strong></span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDetailTeacher(myTeacherProfile)}
                className="btn"
                style={{
                  background: 'var(--modal-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                មើលលម្អិត
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditTeacher(myTeacherProfile)}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>កែព័ត៌មានផ្ទាល់ខ្លួន</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters & View Mode Bar */}
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1rem',
            marginBottom: '1.15rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ អត្តលេខ មុខវិជ្ជា ឬទូរស័ព្ទ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--main-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <CustomSelectDropdown
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
              searchable={false}
              style={{ width: 'auto', minWidth: '140px', padding: '0.45rem 0.75rem', background: 'var(--main-bg)' }}
              options={[
                { value: 'all', label: 'ស្ថានភាព៖ ទាំងអស់' },
                { value: 'កំពុងបង្រៀន', label: 'កំពុងបង្រៀន' },
                { value: 'ឈប់បង្រៀន', label: 'ឈប់បង្រៀន' },
              ]}
            />

            <SortDropdown
              options={[
                { value: 'teacherId', label: 'អត្តលេខ' },
                { value: 'fullName', label: 'ឈ្មោះ' },
                { value: 'englishName', label: 'ឈ្មោះឡាតាំង' },
                { value: 'gender', label: 'ភេទ' },
                { value: 'phone', label: 'លេខទូរស័ព្ទ' },
                { value: 'joinDate', label: 'ថ្ងៃចូលបង្រៀន' },
              ]}
              sortBy={teacherSortBy}
              sortOrder={teacherSortOrder}
              onSortChange={(by, order) => {
                setTeacherSortBy(by);
                setTeacherSortOrder(order);
              }}
            />

            {/* Card / Table Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--main-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '3px',
                gap: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.38rem 0.7rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: viewMode === 'cards' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                កាតរូបថត
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.38rem 0.7rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: viewMode === 'table' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                តារាង
              </button>
            </div>
          </div>
        </div>

        {/* Cards Photo Gallery View (Default) */}
        {viewMode === 'cards' ? (
          filteredTeachers.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))',
                gap: '1.1rem',
              }}
            >
              {filteredTeachers.map((teacher) => {
                const own = isOwnProfile(teacher);
                const editable = canEditTeacher(teacher);
                const isFemale = teacher.gender === 'ស្រី';
                const photoUrl = teacher.photo ? convertDriveImageLink(teacher.photo) : '';
                const initial = (teacher.fullName || teacher.englishName || 'T').trim().charAt(0).toUpperCase();

                return (
                  <div
                    key={teacher.id}
                    onClick={() => setDetailTeacher(teacher)}
                    className="glass-panel glass-panel-hoverable animate-scale-in"
                    style={{
                      borderRadius: '18px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      border: own
                        ? '1.5px solid var(--accent-primary)'
                        : '1px solid var(--border-color)',
                      padding: 0,
                    }}
                  >
                    {/* Card Header Gradient Strip */}
                    <div
                      style={{
                        height: '76px',
                        padding: '0.7rem 0.9rem',
                        background: isFemale
                          ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(139, 92, 246, 0.18))'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(16, 185, 129, 0.18))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {own && (
                          <span
                            style={{
                              padding: '0.18rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'var(--accent-primary)',
                              color: '#ffffff',
                            }}
                          >
                            ខ្ញុំ
                          </span>
                        )}
                        {teacher.teacherId && (
                          <span
                            style={{
                              padding: '0.18rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'var(--modal-bg)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {teacher.teacherId}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            teacher.status === 'កំពុងបង្រៀន'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(239, 68, 68, 0.18)',
                          color: teacher.status === 'កំពុងបង្រៀន' ? '#059669' : '#dc2626',
                        }}
                      >
                        {teacher.status || 'កំពុងបង្រៀន'}
                      </span>
                    </div>

                    {/* Portrait Photo Overlapping Banner */}
                    <div style={{ padding: '0 1.1rem 1.1rem', marginTop: '-44px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <div
                          onClick={(e) => {
                            if (photoUrl) {
                              e.stopPropagation();
                              setPreviewPhotoUrl(photoUrl);
                            }
                          }}
                          style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '22px',
                            overflow: 'hidden',
                            border: '3.5px solid var(--modal-bg, #ffffff)',
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)',
                            background: isFemale
                              ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                              : 'linear-gradient(135deg, #3b82f6, #10b981)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 700,
                          }}
                          title={photoUrl ? 'ចុចដើម្បីមើលរូបភាពធំ' : undefined}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={teacher.fullName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            initial
                          )}
                        </div>
                      </div>

                      {/* Name & Subject */}
                      <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {teacher.fullName}
                        </h3>
                        {teacher.englishName && (
                          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {teacher.englishName}
                          </div>
                        )}
                        {teacher.subject && (
                          <div style={{ marginTop: '0.45rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.22rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                background: 'rgba(139, 92, 246, 0.12)',
                                color: '#7c3aed',
                              }}
                            >
                              {teacher.subject}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Info Rows */}
                      <div
                        style={{
                          padding: '0.7rem 0.85rem',
                          borderRadius: '12px',
                          background: 'var(--main-bg)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                          fontSize: '0.84rem',
                          marginBottom: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>ទូរស័ព្ទ៖</span>
                          {teacher.phone ? (
                            <a
                              href={`tel:${teacher.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' }}
                            >
                              {teacher.phone}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>មិនមាន</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>ភេទ៖</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{teacher.gender || '-'}</span>
                        </div>
                        {teacher.joinDate && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃចូលបង្រៀន៖</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatDateToDMY(teacher.joinDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contacts + Action Buttons */}
                      <div
                        style={{
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          paddingTop: '0.4rem',
                          borderTop: '1px dashed var(--border-color)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                          {teacher.contacts?.telegram && (
                            <a
                              href={teacher.contacts.telegram}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={iconContactBtn('#0088cc')}
                              title="Telegram"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.5 2L2 11.5L8.5 14L10 21.5L13.5 17L18.5 21L21.5 2Z" />
                              </svg>
                            </a>
                          )}
                          {teacher.contacts?.facebook && (
                            <a
                              href={teacher.contacts.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={iconContactBtn('#1877F2')}
                              title="Facebook"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                              </svg>
                            </a>
                          )}
                          {teacher.contacts?.other?.link && (
                            <a
                              href={teacher.contacts.other.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={iconContactBtn('var(--text-secondary)')}
                              title={teacher.contacts.other.label || 'Link'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                          {editable && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditTeacher(teacher)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: own ? 'var(--primary-color)' : 'rgba(59, 130, 246, 0.12)',
                                color: own ? '#ffffff' : '#3b82f6',
                                border: 'none',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>{own ? 'កែផ្ទាល់ខ្លួន' : 'កែប្រែ'}</span>
                            </button>
                          )}

                          {role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              style={{
                                padding: '0.4rem',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="លុប"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              មិនមានទិន្នន័យគ្រូទេ
            </div>
          )
        ) : (
          /* Table View */
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ល.រ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះខ្មែរ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឡាតាំង</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>មុខវិជ្ជា</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher, index) => {
                    const editable = canEditTeacher(teacher);
                    const own = isOwnProfile(teacher);
                    return (
                      <tr
                        key={teacher.id}
                        className="table-row-hover"
                        onClick={() => setDetailTeacher(teacher)}
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '1rem' }}>{index + 1}</td>
                        <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                          <div
                            onClick={() =>
                              teacher.photo && setPreviewPhotoUrl(convertDriveImageLink(teacher.photo))
                            }
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'var(--bg-secondary)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: teacher.photo ? 'pointer' : 'default',
                            }}
                          >
                            {teacher.photo ? (
                              <img
                                src={convertDriveImageLink(teacher.photo)}
                                alt={teacher.fullName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{teacher.teacherId}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: own ? 700 : 500 }}>
                          {teacher.fullName} {own && <span style={{ color: 'var(--accent-primary)', fontSize: '0.78rem' }}>(ខ្ញុំ)</span>}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.englishName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.gender}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.subject || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.phone}</td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              background: teacher.status === 'កំពុងបង្រៀន' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: teacher.status === 'កំពុងបង្រៀន' ? '#10b981' : '#ef4444',
                            }}
                          >
                            {teacher.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {editable && (
                              <button
                                onClick={() => handleOpenEditTeacher(teacher)}
                                style={{
                                  padding: '0.45rem 0.65rem',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  color: '#3b82f6',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                }}
                                title="កែប្រែ"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            )}
                            {role === 'admin' && (
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                style={{ padding: '0.45rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                title="លុប"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        មិនមានទិន្នន័យគ្រូទេ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Teacher Profile Detail Modal */}
      <TeacherDetailModal
        teacher={detailTeacher}
        isOwnProfile={isOwnProfile(detailTeacher)}
        canEdit={canEditTeacher(detailTeacher)}
        onClose={() => setDetailTeacher(null)}
        onEdit={(t) => handleOpenEditTeacher(t)}
        onPreviewPhoto={(url) => setPreviewPhotoUrl(url)}
      />

      {/* Fullscreen Photo Preview Modal */}
      {previewPhotoUrl && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20060,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              aria-label="បិទរូបភាព"
            >
              ✕
            </button>
            <img
              src={previewPhotoUrl}
              alt="Teacher Photo"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: '16px',
                objectFit: 'contain',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Teacher Edit / Add Modal */}
      {isTeacherModalOpen && (
        <div
          onClick={() => setIsTeacherModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20030,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--modal-bg)',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--modal-bg)',
                zIndex: 10,
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {isEditingSelfOnly
                  ? 'កែប្រែព័ត៌មានផ្ទាល់ខ្លួន'
                  : teacherEditId
                    ? 'កែប្រែព័ត៌មានគ្រូ'
                    : 'បញ្ចូលគ្រូថ្មី'}
              </h2>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <ImageUploadBox
                      onFileSelect={handlePhotoUpload}
                      currentImage={photoField ? convertDriveImageLink(photoField) : undefined}
                      isUploading={isUploadingPhoto}
                      isUploadSuccess={isUploadSuccess}
                      shape="square"
                      width="120px"
                      isActiveModal={isTeacherModalOpen}
                    />
                  </div>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>អត្តលេខ *</label>
                      <input
                        type="text"
                        value={teacherIdField}
                        onChange={(e) => setTeacherIdField(e.target.value)}
                        disabled={role !== 'admin'}
                        required
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          opacity: role !== 'admin' ? 0.7 : 1,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ឈ្មោះខ្មែរ *</label>
                      <input
                        type="text"
                        value={fullNameField}
                        onChange={(e) => setFullNameField(e.target.value)}
                        required
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>អក្សរឡាតាំង</label>
                      <input
                        type="text"
                        value={englishNameField}
                        onChange={(e) => setEnglishNameField(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ភេទ</label>
                      <CustomSelectDropdown
                        value={genderField}
                        onChange={setGenderField}
                        searchable={false}
                        options={['ប្រុស', 'ស្រី']}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>មុខវិជ្ជា</label>
                    <input
                      type="text"
                      value={subjectField}
                      onChange={(e) => setSubjectField(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ទូរស័ព្ទ</label>
                    <input
                      type="text"
                      value={phoneField}
                      onChange={(e) => setPhoneField(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ថ្ងៃខែឆ្នាំកំណើត</label>
                    <CustomDatePicker
                      selected={dobField}
                      onChange={(date) => setDobField(date)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ថ្ងៃចូលធ្វើការ</label>
                    <CustomDatePicker
                      selected={joinDateField}
                      onChange={(date) => setJoinDateField(date)}
                      disabled={role !== 'admin'}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>អាសយដ្ឋាន</label>
                    <input
                      type="text"
                      value={addressField}
                      onChange={(e) => setAddressField(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  {role === 'admin' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ស្ថានភាព</label>
                        <CustomSelectDropdown
                          value={statusField}
                          onChange={setStatusField}
                          searchable={false}
                          options={['កំពុងបង្រៀន', 'ឈប់បង្រៀន']}
                          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ភ្ជាប់ជាមួយគណនី (Linked User)</label>
                        <CustomSelectDropdown
                          value={linkedUserIdField}
                          onChange={setLinkedUserIdField}
                          emptyOptionLabel="-- មិនទាន់ភ្ជាប់ --"
                          searchable={appUsers.length > 6}
                          options={appUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h3 style={{ marginBottom: '0.9rem', fontSize: '1.05rem' }}>ទំនាក់ទំនង (Contacts)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} /> Telegram
                      </label>
                      {telegramEnabled && (
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://t.me/username"
                          value={telegramLink}
                          onChange={(e) => setTelegramLink(e.target.value)}
                          style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={facebookEnabled} onChange={(e) => setFacebookEnabled(e.target.checked)} /> Facebook
                      </label>
                      {facebookEnabled && (
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://facebook.com/username"
                          value={facebookLink}
                          onChange={(e) => setFacebookLink(e.target.value)}
                          style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={otherContactEnabled} onChange={(e) => setOtherContactEnabled(e.target.checked)} /> ផ្សេងៗ
                      </label>
                      {otherContactEnabled && (
                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="ឈ្មោះ (ឧ. Line)"
                            value={otherContactLabel}
                            onChange={(e) => setOtherContactLabel(e.target.value)}
                            style={{ width: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          />
                          <input
                            type="url"
                            className="input-field"
                            placeholder="Link URL"
                            value={otherContactLink}
                            onChange={(e) => setOtherContactLink(e.target.value)}
                            style={{ flex: 1, minWidth: '150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1.1rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--modal-bg)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  style={{ padding: '0.65rem 1.35rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 500 }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.45rem', borderRadius: '10px' }}
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function iconContactBtn(color: string): React.CSSProperties {
  return {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--main-bg)',
    border: '1px solid var(--border-color)',
    color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };
}

function ProfileDetailItem({ label, value, href }: { label: string; value?: string; href?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</div>
      {href ? (
        <a href={href} style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' }}>
          {value}
        </a>
      ) : (
        <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
          {value}
        </div>
      )}
    </div>
  );
}

function selfContactPill(color: string): React.CSSProperties {
  return {
    padding: '0.45rem 0.9rem',
    borderRadius: '10px',
    background: 'var(--main-bg)',
    border: '1px solid var(--border-color)',
    color,
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  };
}
