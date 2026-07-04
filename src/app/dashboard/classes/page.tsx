"use client";

import { useState, useEffect } from 'react';
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

  // Class Management View
  const [viewingClass, setViewingClass] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

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

    let baseStudentsData = classEditId ? (classes.find(c => c.id === classEditId)?.studentsData || []) : [];
    let baseStudentIds = classEditId ? (classes.find(c => c.id === classEditId)?.studentIds || []) : [];

    if (autoImportStudents) {
      const existingIds = baseStudentsData && baseStudentsData.length > 0 ? baseStudentsData.map((s: any) => s.id) : baseStudentIds;
      const matchingStudents = allStudents.filter(s => {
        const matchLevel = targetLevelsField.length === 0 || targetLevelsField.includes(s.level);
        const matchShift = targetShiftsField.length === 0 || targetShiftsField.includes(s.shift);
        return matchLevel && matchShift && !existingIds.includes(s.id);
      });
      if (matchingStudents.length > 0) {
        baseStudentsData = [...baseStudentsData, ...matchingStudents];
        baseStudentIds = baseStudentsData.map((s: any) => s.id);
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
      studentsData: baseStudentsData,
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
    const existingIds = viewingClass.studentsData && viewingClass.studentsData.length > 0 ? viewingClass.studentsData.map((s: any) => s.id) : (viewingClass.studentIds || []);
    if (existingIds.includes(studentId)) return;

    const studentObj = allStudents.find(s => s.id === studentId);
    if (!studentObj) return;

    const existingData = viewingClass.studentsData && viewingClass.studentsData.length > 0
      ? viewingClass.studentsData 
      : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean);

    const merged = [...existingData, studentObj];
    const updatedClass = { ...viewingClass, studentsData: merged, studentIds: merged.map((m: any) => m.id) };
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
  };

  const handleRemoveStudentFromClass = (studentId: string) => {
    if (!viewingClass) return;
    if (confirm('តើអ្នកពិតជាចង់ដកសិស្សនេះចេញពីថ្នាក់មែនទេ?')) {
      const existingData = viewingClass.studentsData && viewingClass.studentsData.length > 0
        ? viewingClass.studentsData 
        : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean);
      
      const filtered = existingData.filter((s: any) => s.id !== studentId);
      const updatedClass = { ...viewingClass, studentsData: filtered, studentIds: filtered.map((m: any) => m.id) };
      updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
      setViewingClass(updatedClass);
    }
  };

  const handleImportStudents = () => {
    if (!viewingClass) return;
    const { targetLevels = [], targetShifts = [] } = viewingClass;
    if (targetLevels.length === 0 && targetShifts.length === 0) {
      alert("សូមកំណត់គោលដៅកម្រិតសិក្សា ឬវេនសិក្សានៅក្នុងថ្នាក់ (Edit Class) ជាមុនសិន។");
      return;
    }
    
    const matchingStudents = allStudents.filter(s => {
      const matchLevel = targetLevels.length === 0 || targetLevels.includes(s.level);
      const matchShift = targetShifts.length === 0 || targetShifts.includes(s.shift);
      return matchLevel && matchShift;
    });

    if (matchingStudents.length === 0) {
      alert("មិនមានសិស្សណាមួយត្រូវនឹងលក្ខខណ្ឌនេះទេ។");
      return;
    }

    const existingData = viewingClass.studentsData && viewingClass.studentsData.length > 0
      ? viewingClass.studentsData 
      : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean);
    
    const merged = [...existingData];
    let importedCount = 0;
    matchingStudents.forEach(ms => {
      if (!merged.find(m => m.id === ms.id)) {
        merged.push(ms);
        importedCount++;
      }
    });

    if (importedCount === 0) {
      alert("សិស្សដែលត្រូវលក្ខខណ្ឌ ត្រូវបានបញ្ចូលក្នុងថ្នាក់រួចរាល់អស់ហើយ។");
      return;
    }

    const updatedClass = { ...viewingClass, studentsData: merged, studentIds: merged.map((m: any) => m.id) };
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
    alert(`បានទាញយកសិស្សចំនួន ${importedCount} នាក់ដោយជោគជ័យ!`);
  };

  const searchResults = studentSearch.trim() === '' ? [] : allStudents.filter(s => {
    const existingIds = viewingClass?.studentsData && viewingClass.studentsData.length > 0 ? viewingClass.studentsData.map((ms: any) => ms.id) : (viewingClass?.studentIds || []);
    return !existingIds.includes(s.id) && 
           (s.fullName.includes(studentSearch) || s.studentId.includes(studentSearch) || (s.englishName || '').toLowerCase().includes(studentSearch.toLowerCase()));
  }).slice(0, 5);

  const enrolledStudents = viewingClass ? (
    viewingClass.studentsData && viewingClass.studentsData.length > 0 
      ? viewingClass.studentsData 
      : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean)
  ) : [];

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingClass || !editStudentData) return;
    
    const existingData = viewingClass.studentsData && viewingClass.studentsData.length > 0
      ? viewingClass.studentsData 
      : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean);
    
    const updatedData = existingData.map((s: any) => s.id === editStudentData.id ? editStudentData : s);
    
    const updatedClass = { ...viewingClass, studentsData: updatedData };
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
    setIsEditStudentModalOpen(false);
    setEditStudentData(null);
  };

  const handleRequestStudentEdit = async () => {
    if (!editStudentData) return;
    
    const msg = {
      text: `សូម Admin ជួយកែប្រែទិន្នន័យសិស្សឈ្មោះ ${editStudentData.fullName} (អត្តលេខ: ${editStudentData.studentId})។\nព័ត៌មានដែលបានកែប្រែថ្មី៖\n- ឈ្មោះអង់គ្លេស: ${editStudentData.englishName}\n- ភេទ: ${editStudentData.gender}\n- ថ្ងៃកំណើត: ${editStudentData.dob}\n- លេខទូរស័ព្ទ: ${editStudentData.phoneNum}`,
      senderId: userId,
      senderName: userName,
      senderRole: role,
      receiverId: 'admin',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'messages'), msg);
    alert('សំណើកែប្រែត្រូវបានបញ្ជូនទៅកាន់ Admin ដោយជោគជ័យ!');
    setIsEditStudentModalOpen(false);
    setEditStudentData(null);
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
              
              <div style={{ padding: '1.5rem' }}>
                {/* Search & Add Students */}
                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                  <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>បន្ថែមសិស្សចូលថ្នាក់</label>
                  <div style={{ position: 'relative' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                      type="text" 
                      placeholder="វាយឈ្មោះ ឬអត្តលេខសិស្ស ដើម្បីស្វែងរក..." 
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid var(--primary-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {studentSearch.trim() !== '' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
                      {searchResults.length > 0 ? (
                        searchResults.map(s => (
                          <div key={s.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="table-row-hover">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {s.photo ? <img src={s.photo} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
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

                {/* Enrolled Students Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>បញ្ជីសិស្សក្នុងថ្នាក់ ({enrolledStudents.length} នាក់)</h3>
                  <button 
                    onClick={handleImportStudents}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    ទាញយកសិស្ស (Import)
                  </button>
                </div>
                
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>
                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះ</th>
                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                          <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{s.studentId}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                              <div 
                                onMouseEnter={() => setHoveredStudent(s.id)}
                                onMouseLeave={() => setHoveredStudent(null)}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}
                              >
                                {s.photo ? <img src={s.photo} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                              </div>
                              
                              {hoveredStudent === s.id && (
                                <div 
                                  style={{ position: 'absolute', top: '100%', left: '0', zIndex: 100, background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', minWidth: '250px', pointerEvents: 'none' }}
                                >
                                  <p style={{ margin: 0, fontWeight: 'bold' }}>{s.fullName} ({s.englishName})</p>
                                  <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>អត្តលេខ៖ {s.studentId}</p>
                                  <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>ថ្ងៃខែឆ្នាំកំណើត៖ {s.dob}</p>
                                  <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>កម្រិត៖ {s.level} - {s.shift}</p>
                                  <p style={{ margin: 0, fontSize: '0.85rem' }}>លេខទូរស័ព្ទ៖ {s.phoneNum || 'គ្មាន'}</p>
                                </div>
                              )}
                              
                              {s.fullName}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.gender}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button 
                                onClick={() => {
                                  setEditStudentData(s);
                                  setIsEditStudentModalOpen(true);
                                }} 
                                style={{ padding: '0.4rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }} 
                                title="កែប្រែទិន្នន័យសិស្សក្នុងថ្នាក់"
                              >
                                កែប្រែ
                              </button>
                              <button 
                                onClick={() => handleRemoveStudentFromClass(s.id)} 
                                style={{ padding: '0.4rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }} 
                                title="ដកចេញពីថ្នាក់"
                              >
                                ដកចេញ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {enrolledStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                              <p>មិនទាន់មានសិស្សក្នុងថ្នាក់នេះទេ<br/>សូមស្វែងរក និងបន្ថែមសិស្សនៅខាងលើ</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
</div>
                </div>

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
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
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
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
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
                        border: colorField === c.id ? '3px solid var(--bg-primary)' : 'none',
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
            style={{ width: '100%', maxWidth: '500px', background: 'var(--modal-bg)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--modal-bg)', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>កែប្រែព័ត៌មានសិស្ស</h2>
              <button onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveStudentEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>អត្តលេខសិស្ស</label>
                <input type="text" value={editStudentData.studentId} readOnly style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', opacity: 0.7 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ឈ្មោះពេញ (ខ្មែរ)</label>
                <input type="text" value={editStudentData.fullName} onChange={e => setEditStudentData({...editStudentData, fullName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ភេទ</label>
                  <select value={editStudentData.gender} onChange={e => setEditStudentData({...editStudentData, gender: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="ប្រុស">ប្រុស</option>
                    <option value="ស្រី">ស្រី</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ថ្ងៃខែឆ្នាំកំណើត</label>
                  <input type="text" value={editStudentData.dob || ''} onChange={e => setEditStudentData({...editStudentData, dob: e.target.value})} placeholder="DD/MM/YYYY" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ</label>
                <input type="text" value={editStudentData.phoneNum || ''} onChange={e => setEditStudentData({...editStudentData, phoneNum: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={handleRequestStudentEdit} style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  ស្នើសុំកែប្រែទៅ Admin
                </button>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>រក្សាទុកក្នុងថ្នាក់</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

