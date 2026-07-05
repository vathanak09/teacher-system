"use client";
import { convertDriveImageLink } from '../../../utils/driveLink';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';

// 15 Icons
const ICONS = [
  { id: 'book', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, label: 'សៀវភៅ' },
  { id: 'monitor', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'កុំព្យូទ័រ' },
  { id: 'music', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>, label: 'តន្ត្រី' },
  { id: 'science', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>, label: 'វិទ្យាសាស្ត្រ' },
  { id: 'globe', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'ភូមិវិទ្យា' },
  { id: 'pen-tool', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>, label: 'គំនូរ' },
  { id: 'activity', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>, label: 'កីឡា' },
  { id: 'language', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'ភាសា' },
  { id: 'calculator', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>, label: 'គណិតវិទ្យា' },
  { id: 'cpu', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>, label: 'បច្ចេកវិទ្យា' },
  { id: 'mic', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>, label: 'ការនិយាយ' },
  { id: 'star', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, label: 'ពិសេស' },
  { id: 'award', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>, label: 'ឆ្នើម' },
  { id: 'users', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, label: 'ក្រុម' },
  { id: 'sun', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, label: 'ធម្មជាតិ' }
];

// 10 Colors
const COLORS = [
  { id: 'blue', value: '#3b82f6', label: 'ខៀវ' },
  { id: 'indigo', value: '#6366f1', label: 'ខៀវចាស់' },
  { id: 'purple', value: '#8b5cf6', label: 'ស្វាយ' },
  { id: 'pink', value: '#ec4899', label: 'ផ្កាឈូក' },
  { id: 'red', value: '#ef4444', label: 'ក្រហម' },
  { id: 'orange', value: '#f97316', label: 'ទឹកក្រូច' },
  { id: 'yellow', value: '#eab308', label: 'លឿង' },
  { id: 'green', value: '#22c55e', label: 'បៃតង' },
  { id: 'teal', value: '#14b8a6', label: 'ខៀវបៃតង' },
  { id: 'slate', value: '#64748b', label: 'ប្រផេះ' }
];

export default function ClassesPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  
  // States
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classEditId, setClassEditId] = useState<string | null>(null);

  // Student interaction states
  const [hoveredStudent, setHoveredStudent] = useState<any | null>(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState<any | null>(null);

  // Form Fields
  const [classCodeField, setClassCodeField] = useState('');
  const [classNameField, setClassNameField] = useState('');
  const [teacherNameField, setTeacherNameField] = useState('');
  const [teacherIdField, setTeacherIdField] = useState('');
  const [academicYearField, setAcademicYearField] = useState('');
  const [shiftField, setShiftField] = useState('វេនព្រឹក');
  const [timeField, setTimeField] = useState('');
  const [descriptionField, setDescriptionField] = useState('');
  const [iconField, setIconField] = useState('book');
  const [colorField, setColorField] = useState('blue');
  const [targetLevelsField, setTargetLevelsField] = useState<string[]>([]);
  const [targetShiftsField, setTargetShiftsField] = useState<string[]>([]);
  const [autoImportStudents, setAutoImportStudents] = useState(false);

  // Option dropdowns from settings
  const [shiftsOptions, setShiftsOptions] = useState<any[]>([]);
  const [levelsOptions, setLevelsOptions] = useState<any[]>([]);
  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);

  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);

  // Class Management View
  const [viewingClass, setViewingClass] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  const [isAddStudentVisible, setIsAddStudentVisible] = useState(false);
  const [classSortConfig, setClassSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [classVisibleColumns, setClassVisibleColumns] = useState<string[]>(['photo', 'studentId', 'fullName', 'gender', 'level', 'shift']);
  const [isClassColumnDropdownOpen, setIsClassColumnDropdownOpen] = useState(false);
  const classColumnDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classColumnDropdownRef.current && !classColumnDropdownRef.current.contains(event.target as Node)) {
        setIsClassColumnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFirstLetter = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0);
  };


  // Load Data
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

    // Load options from settings
    const loadSettings = async () => {
      const snap = await getDocs(collection(db, 'settings'));
      snap.forEach(doc => {
        if (doc.id === 'global') {
           const d = doc.data();
           const norm = (arr: any[]) => (arr||[]).map(x => typeof x === 'string' ? {id: x} : x);
           setShiftsOptions(norm(d.appStudentShifts || []));
             setLevelsOptions(norm(d.appStudentLevels || []));
             const normStr = (arr: any[]) => (arr||[]).map(x => typeof x === 'string' ? x : x.id);
             if (d.appStudentAddresses) setAddressOptions(normStr(d.appStudentAddresses));
             if (d.appStudentTransports) setTransportOptions(normStr(d.appStudentTransports));
             if (d.appStudentGenders) setGenderOptions(normStr(d.appStudentGenders));
             if (d.appStudentStatuses) setStatusOptions(normStr(d.appStudentStatuses));
        }
      });
    };
    loadSettings();

    // Fetch teachers list for Admin to assign
    const unsubscribeTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const td: any[] = [];
      snapshot.forEach((doc) => {
        td.push({ ...doc.data(), id: doc.id });
      });
      setAllTeachers(td);
    });

    const unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classesData: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Role based filtering: Admin sees all, Teacher sees only theirs
        if (currentRole === 'admin' || data.teacherId === currentUserId || data.teacherName === currentUserName) {
          classesData.push({ id: doc.id, ...data });
        }
      });
      setClasses(classesData);
    });

    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: any[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ ...doc.data(), id: doc.id });
      });
      setAllStudents(studentsData);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeStudents();
      unsubscribeTeachers();
    };
  }, [router]);

  // CRUD Class
  const handleOpenAddClass = () => {
    setClassEditId(null);
    setClassCodeField('');
    setClassNameField('');
    setAcademicYearField('2026-2027');
    setShiftField('វេនព្រឹក');
    setTimeField('');
    setDescriptionField('');
    setIconField('book');
    setColorField('blue');
    setTargetLevelsField([]);
    setTargetShiftsField([]);
    setAutoImportStudents(false);
    
    // Auto assign teacher if role is teacher
    if (role === 'teacher') {
      setTeacherIdField(userId);
      setTeacherNameField(userName);
    } else {
      setTeacherIdField('');
      setTeacherNameField('');
    }

    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: any) => {
    setClassEditId(c.id);
    setClassCodeField(c.classCode || '');
    setClassNameField(c.className || '');
    setAcademicYearField(c.academicYear || '');
    setShiftField(c.shift || '');
    setTimeField(c.time || '');
    setDescriptionField(c.description || '');
    setIconField(c.icon || 'book');
    setColorField(c.color || 'blue');
    setTeacherIdField(c.teacherId || '');
    setTeacherNameField(c.teacherName || '');
    setTargetLevelsField(c.targetLevels || []);
    setTargetShiftsField(c.targetShifts || []);
    setAutoImportStudents(false);
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបថ្នាក់រៀននេះមែនទេ? ទិន្នន័យសិស្សក្នុងថ្នាក់ក៏នឹងត្រូវលុបចេញពីថ្នាក់នេះដែរ។')) {
      deleteDoc(doc(db, 'classes', id));
      if (viewingClass?.id === id) setViewingClass(null);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameField || !academicYearField) {
      alert('សូមបំពេញឈ្មោះថ្នាក់ និងឆ្នាំសិក្សា!');
      return;
    }

    let baseStudentIds = classEditId ? (classes.find(c => c.id === classEditId)?.studentIds || (classes.find(c => c.id === classEditId)?.studentsData || []).map((s: any) => s.id)) : [];

    if (autoImportStudents) {
      const existingIds = baseStudentIds;
      const matchingStudents = allStudents.filter(s => {
        const matchLevel = targetLevelsField.length === 0 || targetLevelsField.includes(s.level);
        const matchShift = targetShiftsField.length === 0 || targetShiftsField.includes(s.shift);
        return matchLevel && matchShift && !existingIds.includes(s.id);
      });
      if (matchingStudents.length > 0) {
        baseStudentIds = [...baseStudentIds, ...matchingStudents.map(s => s.id)];
      }
    }

    const newClass = {
      classCode: classCodeField,
      className: classNameField,
      teacherId: teacherIdField,
      teacherName: teacherNameField,
      academicYear: academicYearField,
      shift: shiftField,
      time: timeField,
      icon: iconField,
      color: colorField,
      description: descriptionField,
      targetLevels: targetLevelsField,
      targetShifts: targetShiftsField,
      studentIds: baseStudentIds,
    };

    if (classEditId) {
      updateDoc(doc(db, 'classes', classEditId), newClass);
    } else {
      addDoc(collection(db, 'classes'), newClass);
    }

    setIsClassModalOpen(false);
    if (viewingClass && classEditId === viewingClass.id) {
      setViewingClass({ ...viewingClass, ...newClass });
    }
  };

  // Manage Students in Class
  const handleAddStudentToClass = (studentId: string) => {
    if (!viewingClass) return;
    const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
    if (existingIds.includes(studentId)) return;

    const mergedIds = [...existingIds, studentId];
    const updatedClass = { ...viewingClass, studentIds: mergedIds };
    delete updatedClass.studentsData;
    
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
  };

  const handleRemoveStudentFromClass = (studentId: string) => {
    if (!viewingClass) return;
    if (confirm('តើអ្នកពិតជាចង់ដកសិស្សនេះចេញពីថ្នាក់មែនទេ?')) {
      const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
      const filteredIds = existingIds.filter((id: string) => id !== studentId);
      
      const updatedClass = { ...viewingClass, studentIds: filteredIds };
      delete updatedClass.studentsData;

      updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
      setViewingClass(updatedClass);
    }
  };



  const searchResults = studentSearch.trim() === '' ? [] : allStudents.filter(s => {
    const existingIds = viewingClass?.studentIds || (viewingClass?.studentsData ? viewingClass.studentsData.map((ms: any) => ms.id) : []);
    return !existingIds.includes(s.id) && 
           (s.fullName.includes(studentSearch) || s.studentId.includes(studentSearch) || (s.englishName || '').toLowerCase().includes(studentSearch.toLowerCase()));
  }).slice(0, 5);

  const enrolledStudents = viewingClass ? (
    (viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []))
      .map((id: string) => allStudents.find(s => s.id === id))
      .filter(Boolean)
  ) : [];



  const handleRequestStudentEdit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editStudentData || !viewingClass) return;
      
      const originalStudent = allStudents.find(s => s.id === editStudentData.id);
      
      let changedFields = [];
      if (originalStudent) {
        const fieldsToCheck = [
          { key: 'fullName', label: 'ឈ្មោះពេញ' }, { key: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
          { key: 'gender', label: 'ភេទ' }, { key: 'level', label: 'កម្រិតសិក្សា' }, { key: 'shift', label: 'វេន' },
          { key: 'enrollDate', label: 'ថ្ងៃចូលរៀន' }, { key: 'fee', label: 'ថ្លៃសិក្សា' },
          { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' }, { key: 'address', label: 'អាសយដ្ឋាន' },
          { key: 'location', label: 'ទីតាំង' }, { key: 'transport', label: 'មធ្យោបាយ' },
          { key: 'photo', label: 'រូបថត' }, { key: 'status', label: 'ស្ថានភាព' },
          { key: 'contact', label: 'អ្នកទំនាក់ទំនង' }, { key: 'father', label: 'ឈ្មោះឪពុក' },
          { key: 'mother', label: 'ឈ្មោះម្តាយ' }, { key: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
        ];
        
        for (const field of fieldsToCheck) {
          if (String(originalStudent[field.key] || '') !== String(editStudentData[field.key] || '')) {
            changedFields.push(`- ${field.label}: [ចាស់]: ${originalStudent[field.key] || 'ទទេ'} -> [ថ្មី]: **${editStudentData[field.key] || 'ទទេ'}**`);
          }
        }
      }
      
      const changesText = changedFields.length > 0 
        ? `មានព័ត៌មានដែលបានកែប្រែ៖\n${changedFields.join('\n')}`
        : 'មិនមានព័ត៌មានត្រូវបានកែប្រែទេប៉ុន្តែបានស្នើសុំពិនិត្យមើល។';

      const msg = {
        text: `សួស្តី Admin សូមជួយកែប្រែព័ត៌មានសិស្សខាងក្រោម៖ \n${editStudentData.fullName} (អត្តលេខ: ${editStudentData.studentId})\n\n${changesText}`,
        senderId: userId,
        senderName: userName,
        senderRole: role,
        receiverId: 'admin',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      try {
        await addDoc(collection(db, 'messages'), msg);
        alert('សំណើកែប្រែព័ត៌មានសិស្សត្រូវបានបញ្ជូនទៅកាន់ Admin ដោយជោគជ័យ!');
        setIsEditStudentModalOpen(false);
        setEditStudentData(null);
      } catch (error) {
        console.error("Error sending request:", error);
        alert("មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ សូមព្យាយាមម្តងទៀត។");
      }
    };
  
    if (!role) return null;

  return (
    <>
      <div className="page-container animate-fade-in" style={{ display: 'flex', gap: '2rem', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Left Side: Class List */}
        <div style={{ flex: '1 1 350px', minWidth: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>ថ្នាក់រៀន</h1>
            <button 
              onClick={handleOpenAddClass}
              style={{ padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              បង្កើតថ្នាក់
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {classes.map(c => {
              const IconComp = ICONS.find(i => i.id === c.icon)?.icon || ICONS[0].icon;
              const colorHex = COLORS.find(co => co.id === c.color)?.value || COLORS[0].value;
              return (
                <div 
                  key={c.id} 
                  className={`glass-panel ${viewingClass?.id === c.id ? 'active-class' : ''}`}
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer', 
                    borderStyle: 'solid',
                    borderWidth: '2px 2px 2px 6px',
                    borderColor: viewingClass?.id === c.id ? `${colorHex} ${colorHex} ${colorHex} ${colorHex}` : `transparent transparent transparent ${colorHex}`,
                    transition: 'all 0.2s ease', 
                    position: 'relative', 
                    overflow: 'hidden' 
                  }}
                  onClick={() => setViewingClass(c)}
                >
                  {/* Subtle Background Icon */}
                  <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, transform: 'scale(4)' }}>
                    {IconComp}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${colorHex}15`, color: colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {IconComp}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{c.className}</h3>
                          {c.classCode && <span style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{c.classCode}</span>}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{c.academicYear} • {c.shift}</p>
                        {c.time && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>ម៉ោង៖ {c.time}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                           </div>
                           <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{c.teacherName || 'មិនទាន់កំណត់'}</span>
                           <span style={{ margin: '0 0.25rem', color: 'var(--text-secondary)' }}>•</span>
                           <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>សិស្ស {c.studentsData && c.studentsData.length > 0 ? c.studentsData.length : (c.studentIds?.length || 0)} នាក់</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEditClass(c); }} style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="លុប">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                មិនទាន់មានថ្នាក់រៀនទេ
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Class Details & Student Management */}
        <div style={{ flex: '2 1 500px', minWidth: '300px' }}>
          {viewingClass ? (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: `${COLORS.find(c => c.id === viewingClass.color)?.value || COLORS[0].value}15`, borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ color: COLORS.find(c => c.id === viewingClass.color)?.value || COLORS[0].value }}>
                     {ICONS.find(i => i.id === viewingClass.icon)?.icon || ICONS[0].icon}
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>ថ្នាក់ {viewingClass.className} {viewingClass.classCode && `(${viewingClass.classCode})`}</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <span><strong style={{ color: 'var(--text-primary)' }}>គ្រូ៖</strong> {viewingClass.teacherName || 'មិនទាន់កំណត់'}</span>
                  <span>•</span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>ម៉ោង៖</strong> {viewingClass.time || 'មិនទាន់កំណត់'}</span>
                  <span>•</span>
                  <span>{viewingClass.shift}</span>
                </p>
                {viewingClass.description && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>{viewingClass.description}</p>}
              </div>
              
              <div style={{ borderBottom: '1px solid var(--border-color)', display: 'flex' }}>
                <button 
                  onClick={() => setActiveTab('students')}
                  style={{ padding: '1rem 1.5rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'students' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'students' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'students' ? '600' : '500', cursor: 'pointer', outline: 'none' }}
                >
                  បញ្ជីសិស្ស
                </button>
                <button 
                  onClick={() => setActiveTab('records')}
                  style={{ padding: '1rem 1.5rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'records' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'records' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'records' ? '600' : '500', cursor: 'pointer', outline: 'none' }}
                >
                  កំណត់ត្រាបង្រៀន
                </button>
                <button 
                  onClick={() => setActiveTab('tasks')}
                  style={{ padding: '1rem 1.5rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'tasks' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'tasks' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'tasks' ? '600' : '500', cursor: 'pointer', outline: 'none' }}
                >
                  កិច្ចការ
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {activeTab === 'students' && (
                  <>
                {/* Search & Add Students (Toggled) */}
                {isAddStudentVisible && (
                  <div style={{ marginBottom: '2rem', position: 'relative', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>បន្ថែមសិស្សចូលថ្នាក់</label>
                      <button onClick={() => setIsAddStudentVisible(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input 
                        type="text" 
                        placeholder="វាយឈ្មោះ ឬអត្តលេខសិស្ស ដើម្បីស្វែងរក..." 
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid var(--primary-color)', background: 'var(--modal-bg)', color: 'var(--text-primary)', fontSize: '1rem' }}
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {studentSearch.trim() !== '' && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'var(--modal-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
                        {searchResults.length > 0 ? (
                          searchResults.map(s => (
                            <div key={s.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="table-row-hover">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {s.photo && String(s.photo).trim() !== '' ? <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                                </div>
                                <div>
                                  <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{s.fullName} ({s.studentId})</p>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.gender} • {s.dob}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => { handleAddStudentToClass(s.id); setStudentSearch(''); }}
                                style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                + បញ្ចូល
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            រកមិនឃើញសិស្សឈ្មោះនេះទេ (ឬសិស្សនេះមានក្នុងថ្នាក់រួចហើយ)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced Student List Table Controls */}
                {(() => {
                  const maleCount = enrolledStudents.filter((s: any) => s.gender === 'ប្រុស').length;
                  const femaleCount = enrolledStudents.filter((s: any) => s.gender === 'ស្រី').length;
                  
                  const sortedEnrolledStudents = [...enrolledStudents].sort((a: any, b: any) => {
                    if (!classSortConfig) return 0;
                    const { key, direction } = classSortConfig;
                    let aVal = a[key] || '';
                    let bVal = b[key] || '';
                    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                    return 0;
                  });

                  const handleClassSort = (key: string) => {
                    let direction: 'asc' | 'desc' = 'asc';
                    if (classSortConfig && classSortConfig.key === key && classSortConfig.direction === 'asc') {
                      direction = 'desc';
                    }
                    setClassSortConfig({ key, direction });
                  };

                  const toggleClassColumn = (colId: string) => {
                    if (classVisibleColumns.includes(colId)) {
                      setClassVisibleColumns(classVisibleColumns.filter(c => c !== colId));
                    } else {
                      setClassVisibleColumns([...classVisibleColumns, colId]);
                    }
                  };

                  const setSummaryView = () => setClassVisibleColumns(['photo', 'fullName', 'gender', 'level']);
                  const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'nextPaymentDate', 'paymentStatus', 'status', 'dob', 'address', 'location', 'transport', 'contact', 'father', 'mother', 'phoneNum']);

                  const handleDownloadClassCSV = () => {
                    const headers = ['ល.រ', ...classVisibleColumns.map(col => {
                      const titles: any = {
                        studentId: 'អត្តលេខ', fullName: 'ឈ្មោះ', englishName: 'ឈ្មោះអង់គ្លេស', gender: 'ភេទ', level: 'កម្រិត',
                        shift: 'វេន', enrollDate: 'ថ្ងៃចូលរៀន', nextPaymentDate: 'ថ្ងៃបង់បន្ទាប់', paymentStatus: 'ស្ថានភាពបង់ប្រាក់',
                        status: 'ស្ថានភាព', dob: 'ថ្ងៃខែឆ្នាំកំណើត', address: 'អាសយដ្ឋាន', location: 'ទីតាំង', transport: 'មធ្យោបាយ',
                        contact: 'ទំនាក់ទំនង', father: 'ឈ្មោះឪពុក', mother: 'ឈ្មោះម្តាយ', phoneNum: 'លេខទូរស័ព្ទ'
                      };
                      return titles[col] || col;
                    }).filter(h => h !== 'photo')];

                    const rows = sortedEnrolledStudents.map((s: any, idx: number) => {
                      const rowData: string[] = [(idx + 1).toString()];
                      classVisibleColumns.forEach(col => {
                        if (col === 'photo') return;
                        rowData.push('"' + (s[col] || '') + '"');
                      });
                      return rowData.join(',');
                    });

                    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `${viewingClass?.className || 'class'}_students.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  };

                  return (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>បញ្ជីសិស្សក្នុងថ្នាក់</h3>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>សរុប {enrolledStudents.length} នាក់</span>
                            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ស្រី {femaleCount} នាក់</span>
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ប្រុស {maleCount} នាក់</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Add Button */}
                          <button 
                            onClick={() => setIsAddStudentVisible(!isAddStudentVisible)}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                            title="បន្ថែមសិស្ស"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          </button>

                          {/* Sort Button */}
                          <button 
                            onClick={() => handleClassSort(classSortConfig?.key === 'fullName' ? 'gender' : classSortConfig?.key === 'gender' ? 'shift' : 'fullName')}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                            តម្រៀប
                          </button>

                          {/* Columns Dropdown */}
                          <div style={{ position: 'relative' }} ref={classColumnDropdownRef}>
                            <button 
                              onClick={() => setIsClassColumnDropdownOpen(!isClassColumnDropdownOpen)}
                              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                              ជួរឈរ
                            </button>
                            {isClassColumnDropdownOpen && (
                              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--modal-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 30, minWidth: '220px', padding: '0.5rem' }}>
                                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                  <button onClick={setSummaryView} style={{ width: '100%', padding: '0.5rem', textAlign: 'left', background: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '0.25rem' }}>ទិដ្ឋភាពសង្ខេប</button>
                                  <button onClick={setFullView} style={{ width: '100%', padding: '0.5rem', textAlign: 'left', background: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>បង្ហាញទាំងអស់</button>
                                </div>
                                <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
                                  {[
                                    { id: 'photo', label: 'រូបថត' },
                                    { id: 'studentId', label: 'អត្តលេខ' },
                                    { id: 'fullName', label: 'ឈ្មោះពេញ' },
                                    { id: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
                                    { id: 'gender', label: 'ភេទ' },
                                    { id: 'level', label: 'កម្រិតសិក្សា' },
                                    { id: 'shift', label: 'វេន' },
                                    { id: 'enrollDate', label: 'ថ្ងៃចូលរៀន' },
                                    { id: 'nextPaymentDate', label: 'ថ្ងៃបង់បន្ទាប់' },
                                    { id: 'paymentStatus', label: 'ស្ថានភាពបង់ប្រាក់' },
                                    { id: 'status', label: 'ស្ថានភាព' },
                                    { id: 'className', label: 'ថ្នាក់' },
                                    { id: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' },
                                    { id: 'address', label: 'អាសយដ្ឋាន' },
                                    { id: 'location', label: 'ទីតាំង' },
                                    { id: 'transport', label: 'មធ្យោបាយ' },
                                    { id: 'contact', label: 'ទំនាក់ទំនង' },
                                    { id: 'father', label: 'ឈ្មោះឪពុក' },
                                    { id: 'mother', label: 'ឈ្មោះម្តាយ' },
                                    { id: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
                                  ].map(col => (
                                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem', cursor: 'pointer', gap: '0.5rem' }}>
                                      <input type="checkbox" checked={classVisibleColumns.includes(col.id)} onChange={() => toggleClassColumn(col.id)} />
                                      {col.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Download CSV */}
                          <button 
                            onClick={handleDownloadClassCSV}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ទាញយក CSV
                          </button>
                        </div>
                      </div>
                      
                      {/* Enrolled Students Table */}
                      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div className="table-responsive">
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ល.រ</th>
                                {classVisibleColumns.includes('photo') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>}
                                {classVisibleColumns.includes('studentId') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>}
                                {classVisibleColumns.includes('fullName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះ</th>}
                                {classVisibleColumns.includes('englishName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះអង់គ្លេស</th>}
                                {classVisibleColumns.includes('gender') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>}
                                {classVisibleColumns.includes('level') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>កម្រិត</th>}
                                {classVisibleColumns.includes('shift') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>វេន</th>}
                                {classVisibleColumns.includes('enrollDate') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្ងៃចូលរៀន</th>}
                                {classVisibleColumns.includes('phoneNum') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>}
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedEnrolledStudents.map((s: any, index: number) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{index + 1}</td>
                                  
                                  {classVisibleColumns.includes('photo') && (
                                    <td style={{ padding: '1rem', position: 'relative' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                                        {s.photo && String(s.photo).trim() !== '' ? <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: s.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{getFirstLetter(s.fullName)}</div>}
                                      </div>
                                      
                                      {/* Centered Hover Profile Popup */}
                                        {hoveredStudent === s.id && typeof window !== 'undefined' && createPortal(
                                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>
                                            <div style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backdropFilter: 'blur(10px)' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)} onClick={e => e.stopPropagation()}>
                                              {/* Header */}
                                              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                                                {s.photo && String(s.photo).trim() !== '' ? (
                                                  <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                                                ) : (
                                                  <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: s.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{getFirstLetter(s.fullName)}</div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{s.fullName}</h2>
                                                  <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.englishName || 'គ្មានឈ្មោះអង់គ្លេស'}</p>
                                                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700 }}>ID: {s.studentId}</span>
                                                    <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>{s.status || 'កំពុងសិក្សា'}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Details */}
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div style={{ background: 'rgba(139, 92, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                                  <h4 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                                                    ព័ត៌មានសិក្សា
                                                  </h4>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្នាក់៖</span> <strong style={{ color: 'var(--text-primary)' }}>{viewingClass?.className || s.className || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>គ្រូបង្រៀន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{viewingClass?.teacherName || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>កម្រិត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.level || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>វេន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.shift || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.enrollDate || 'N/A'}</strong></div>
                                                  </div>
                                                </div>

                                                <div style={{ background: 'rgba(236, 72, 153, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                                                  <h4 style={{ margin: '0 0 1rem 0', color: '#ec4899', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    ជីវប្រវត្តិ & ទំនាក់ទំនង
                                                  </h4>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ភេទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.gender || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃកំណើត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.dob || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ឪពុក៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.father || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ម្តាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.mother || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.phoneNum || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>មធ្យោបាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.transport || 'N/A'}</strong></div>
                                                  </div>
                                                </div>

                                                <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>អាសយដ្ឋាន៖</span> <strong style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{s.address || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>បណ្តាញសង្គម៖</span> 
                                                      {s.contact ? (s.contact.startsWith('http') ? <a href={s.contact} target="_blank" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'underline' }}>ចុចទីនេះ</a> : <strong style={{ color: 'var(--text-primary)' }}>{s.contact}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>ទីតាំងផ្ទះ៖</span> 
                                                      {s.location ? (s.location.startsWith('http') ? <a href={s.location} target="_blank" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>ផែនទី</a> : <strong style={{ color: 'var(--text-primary)' }}>{s.location}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <button onClick={() => { setHoveredStudent(null); setEditStudentData(s); setIsEditStudentModalOpen(true); }} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', border: 'none', fontSize: '1.05rem', fontWeight: 700, marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                កែប្រែព័ត៌មានសិស្ស
                                              </button>
                                            </div>
                                          </div>,
                                          document.body
                                        )}
                                    </td>
                                  )}
                                  
                                  {classVisibleColumns.includes('studentId') && <td style={{ padding: '1rem', fontWeight: '500' }}>{s.studentId}</td>}
                                  {classVisibleColumns.includes('fullName') && <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{s.fullName}</td>}
                                  {classVisibleColumns.includes('englishName') && <td style={{ padding: '1rem' }}>{s.englishName}</td>}
                                  {classVisibleColumns.includes('gender') && <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.gender}</td>}
                                  {classVisibleColumns.includes('level') && <td style={{ padding: '1rem' }}>{s.level}</td>}
                                  {classVisibleColumns.includes('shift') && <td style={{ padding: '1rem' }}>{s.shift}</td>}
                                  {classVisibleColumns.includes('enrollDate') && <td style={{ padding: '1rem' }}>{s.enrollDate}</td>}
                                  {classVisibleColumns.includes('nextPaymentDate') && <td style={{ padding: '1rem' }}>{s.nextPaymentDate}</td>}
                                  {classVisibleColumns.includes('paymentStatus') && <td style={{ padding: '1rem' }}>
                                    {s.paymentStatus === 'បានបង់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus === 'ជំពាក់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus === 'ផុតកំណត់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus}
                                  </td>}
                                  {classVisibleColumns.includes('status') && <td style={{ padding: '1rem' }}>
                                    {s.status === 'កំពុងសិក្សា' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status === 'ឈប់សម្រាក' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status === 'បោះបង់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status}
                                  </td>}
                                  {classVisibleColumns.includes('className') && <td style={{ padding: '1rem' }}>{s.className}</td>}
                                  {classVisibleColumns.includes('dob') && <td style={{ padding: '1rem' }}>{s.dob}</td>}
                                  {classVisibleColumns.includes('address') && <td style={{ padding: '1rem' }}>{s.address}</td>}
                                  {classVisibleColumns.includes('location') && <td style={{ padding: '1rem' }}>{s.location}</td>}
                                  {classVisibleColumns.includes('transport') && <td style={{ padding: '1rem' }}>{s.transport}</td>}
                                  {classVisibleColumns.includes('contact') && <td style={{ padding: '1rem' }}>{s.contact}</td>}
                                  {classVisibleColumns.includes('father') && <td style={{ padding: '1rem' }}>{s.father}</td>}
                                  {classVisibleColumns.includes('mother') && <td style={{ padding: '1rem' }}>{s.mother}</td>}
                                  {classVisibleColumns.includes('phoneNum') && <td style={{ padding: '1rem' }}>{s.phoneNum}</td>}

                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                      <button onClick={() => { setEditStudentData(s); setIsEditStudentModalOpen(true); }} style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="កែប្រែ">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                      </button>
                                      <button onClick={() => handleRemoveStudentFromClass(s.id)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="ដកចេញ">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {sortedEnrolledStudents.length === 0 && (
                                <tr>
                                  <td colSpan={classVisibleColumns.length + 2} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                      <p>មិនទាន់មានសិស្សក្នុងថ្នាក់នេះទេ</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
                  </>
                )}

                {activeTab === 'records' && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    កំណត់ត្រាបង្រៀននឹងបង្ហាញនៅទីនេះ។
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    កិច្ចការនឹងបង្ហាញនៅទីនេះ។
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" style={{ marginBottom: '1rem' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              <h2>សូមជ្រើសរើសថ្នាក់រៀនណាមួយ</h2>
              <p>ដើម្បីមើលព័ត៌មានលម្អិត និងគ្រប់គ្រងសិស្សក្នុងថ្នាក់</p>
            </div>
          )}
        </div>
      </div>

      {/* Class Modal */}
      {isClassModalOpen && (
        <div 
          onClick={() => setIsClassModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-in" 
            style={{ width: '100%', maxWidth: '700px', background: 'var(--modal-bg)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--modal-bg)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{classEditId ? 'កែប្រែថ្នាក់រៀន' : 'បង្កើតថ្នាក់រៀនថ្មី'}</h2>
              <button onClick={() => setIsClassModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveClass} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>លេខកូដថ្នាក់ (ID)</label>
                  <input type="text" value={classCodeField} onChange={e => setClassCodeField(e.target.value)} placeholder="ឧ. C-101" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ឈ្មោះថ្នាក់ *</label>
                  <input type="text" value={classNameField} onChange={e => setClassNameField(e.target.value)} required placeholder="ឧ. 10A" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ឈ្មោះគ្រូ</label>
                  {role === 'admin' ? (
                    <select value={teacherIdField} onChange={(e) => {
                       const t = allTeachers.find(x => x.id === e.target.value);
                       setTeacherIdField(t?.id || '');
                       setTeacherNameField(t?.fullName || '');
                    }} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">-- ជ្រើសរើសគ្រូ --</option>
                      {allTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={teacherNameField} readOnly style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', opacity: 0.7, cursor: 'not-allowed' }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ឆ្នាំសិក្សា *</label>
                  <input type="text" value={academicYearField} onChange={e => setAcademicYearField(e.target.value)} required placeholder="ឧ. 2026-2027" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>វេនសិក្សា</label>
                  <select value={shiftField} onChange={e => setShiftField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {shiftsOptions.length > 0 ? shiftsOptions.map(opt => (
                       <option key={opt.id} value={opt.id}>{opt.id}</option>
                    )) : (
                       <>
                         <option value="វេនព្រឹក">វេនព្រឹក</option>
                         <option value="វេនរសៀល">វេនរសៀល</option>
                         <option value="វេនល្ងាច">វេនល្ងាច</option>
                         <option value="សៅរ៍-អាទិត្យ">សៅរ៍-អាទិត្យ</option>
                       </>
                    )}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ពេលសិក្សា (ម៉ោង)</label>
                  <input type="text" value={timeField} onChange={e => setTimeField(e.target.value)} placeholder="ឧ. 07:00 AM - 09:00 AM" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              {/* Target Criteria for importing students */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>គោលដៅកម្រិតសិក្សា (Target Levels)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', maxHeight: '120px', overflowY: 'auto' }}>
                    {levelsOptions.length > 0 ? levelsOptions.map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--modal-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <input 
                          type="checkbox" 
                          checked={targetLevelsField.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTargetLevelsField([...targetLevelsField, opt.id]);
                            else setTargetLevelsField(targetLevelsField.filter(l => l !== opt.id));
                          }}
                        /> {opt.id}
                      </label>
                    )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មិនទាន់មានទិន្នន័យ</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>គោលដៅវេនសិក្សា (Target Shifts)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', maxHeight: '120px', overflowY: 'auto' }}>
                    {shiftsOptions.length > 0 ? shiftsOptions.map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--modal-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <input 
                          type="checkbox" 
                          checked={targetShiftsField.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTargetShiftsField([...targetShiftsField, opt.id]);
                            else setTargetShiftsField(targetShiftsField.filter(s => s !== opt.id));
                          }}
                        /> {opt.id}
                      </label>
                    )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មិនទាន់មានទិន្នន័យ</span>}
                  </div>
                </div>
              </div>

              {/* Auto Import Checkbox */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
                  <input 
                    type="checkbox" 
                    checked={autoImportStudents} 
                    onChange={(e) => setAutoImportStudents(e.target.checked)} 
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.95rem' }}>ទាញយកសិស្សចូលថ្នាក់ដោយស្វ័យប្រវត្តិ (Import Students)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ទាញយកសិស្សទាំងអស់ដែលត្រូវនឹងគោលដៅខាងលើ ចូលក្នុងថ្នាក់នេះពេលរក្សាទុក។</div>
                  </div>
                </label>
              </div>

              {/* Icon Selector */}
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>រូបតំណាង (Icon)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '0.75rem' }}>
                  {ICONS.map(i => (
                    <div 
                      key={i.id}
                      onClick={() => setIconField(i.id)}
                      style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: iconField === i.id ? 'var(--primary-color)' : 'var(--bg-secondary)',
                        color: iconField === i.id ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${iconField === i.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        transition: 'all 0.2s ease'
                      }}
                      title={i.label}
                    >
                      {i.icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>ពណ៌កាត (Card Color)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {COLORS.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => setColorField(c.id)}
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                        background: c.value,
                        border: colorField === c.id ? '3px solid var(--modal-bg)' : 'none',
                        boxShadow: colorField === c.id ? `0 0 0 2px ${c.value}` : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ពិពណ៌នា</label>
                <textarea value={descriptionField} onChange={e => setDescriptionField(e.target.value)} rows={2} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsClassModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>រក្សាទុក</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
        {isEditStudentModalOpen && editStudentData && (
          <div 
            onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="glass-panel animate-scale-in" 
              style={{ width: '100%', maxWidth: '800px', background: 'var(--modal-bg)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--modal-bg)', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>កែប្រែព័ត៌មានសិស្ស</h2>
                <button onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <form onSubmit={handleRequestStudentEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Section 1: Academic Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div onClick={() => setIsSection1Open(!isSection1Open)} style={{ cursor: 'pointer', background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem 1rem', borderBottom: isSection1Open ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎓</span> ផ្នែកទី១៖ ព័ត៌មានសិក្សា (Student ID ដល់ Enroll Date)
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{isSection1Open ? '▼ លាក់ (Hide)' : '▶ បង្ហាញ (Show)'}</span>
                  </div>
                  {isSection1Open && (
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អត្តលេខ (Student ID) *</label>
                      <input type="text" value={editStudentData.studentId} readOnly style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)', opacity: 0.7 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះពេញ (Khmer Name) *</label>
                      <input type="text" value={editStudentData.fullName} onChange={e => setEditStudentData({...editStudentData, fullName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះឡាតាំង (English Name) *</label>
                      <input type="text" value={editStudentData.englishName || ''} onChange={e => setEditStudentData({...editStudentData, englishName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ភេទ (Gender) *</label>
                      <select value={editStudentData.gender} onChange={e => setEditStudentData({...editStudentData, gender: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {genderOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>កម្រិតសិក្សា (Level) *</label>
                      <select value={editStudentData.level || ''} onChange={e => setEditStudentData({...editStudentData, level: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="">ជ្រើសរើសកម្រិត</option>
                        {levelsOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>វេនសិក្សា (Shift) *</label>
                      <select value={editStudentData.shift || ''} onChange={e => setEditStudentData({...editStudentData, shift: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="">ជ្រើសរើសវេន</option>
                        {shiftsOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន (Enroll Date) *</label>
                      <input type="date" value={editStudentData.enrollDate || ''} onChange={e => setEditStudentData({...editStudentData, enrollDate: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>

                  </div>
                  )}
                </div>

                {/* Section 2: Personal & Contact Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div onClick={() => setIsSection2Open(!isSection2Open)} style={{ cursor: 'pointer', background: 'rgba(236, 72, 153, 0.08)', padding: '0.75rem 1rem', borderBottom: isSection2Open ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏠</span> ផ្នែកទី២៖ ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង (DOB ដល់ Phone Num)
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{isSection2Open ? '▼ លាក់ (Hide)' : '▶ បង្ហាញ (Show)'}</span>
                  </div>
                  {isSection2Open && (
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
                      <input type="text" placeholder="ឧ. 27-06-2012" value={editStudentData.dob || ''} onChange={e => setEditStudentData({...editStudentData, dob: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អាសយដ្ឋាន (Address)</label>
                      <select value={editStudentData.address || ''} onChange={e => setEditStudentData({...editStudentData, address: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {addressOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ទីតាំង (Google Maps Link)</label>
                      <input type="text" placeholder="https://maps.google.com/..." value={editStudentData.location || ''} onChange={e => setEditStudentData({...editStudentData, location: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មធ្យោបាយធ្វើដំណើរ (Transport)</label>
                      <select value={editStudentData.transport || ''} onChange={e => setEditStudentData({...editStudentData, transport: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {transportOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>តំណភ្ជាប់រូបថត (Photo URL / Google Drive)</label>
                      <input type="text" placeholder="https://drive.google.com/file/d/..." value={editStudentData.photo || ''} onChange={e => setEditStudentData({...editStudentData, photo: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ស្ថានភាពសិក្សា (Status)</label>
                      <select value={editStudentData.status || ''} onChange={e => setEditStudentData({...editStudentData, status: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {statusOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អ្នកទំនាក់ទំនង (Social Media Link)</label>
                      <input type="text" placeholder="https://t.me/username ឬ Link ផ្សេងៗ" value={editStudentData.contact || ''} onChange={e => setEditStudentData({...editStudentData, contact: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះឪពុក (Father Name)</label>
                      <input type="text" placeholder="ឧ. លី សុវណ្ណ" value={editStudentData.father || ''} onChange={e => setEditStudentData({...editStudentData, father: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះម្តាយ (Mother Name)</label>
                      <input type="text" placeholder="ឧ. មាស សុខ" value={editStudentData.mother || ''} onChange={e => setEditStudentData({...editStudentData, mother: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ (Phone Num)</label>
                      <input type="text" placeholder="ឧ. 012345678" value={editStudentData.phoneNum || ''} onChange={e => setEditStudentData({...editStudentData, phoneNum: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  )}
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ស្នើសុំកែប្រែទៅ Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}

