"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

export default function StudentsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  
  // Student States
  const [students, setStudents] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  // Inline Editing & Column Visibility
  const AVAILABLE_COLUMNS = [
    { id: 'photo', label: 'រូបថត' },
    { id: 'photoLink', label: 'តំណភ្ជាប់រូបថត' },
    { id: 'studentId', label: 'អត្តលេខ' },
    { id: 'fullName', label: 'ឈ្មោះពេញ' },
    { id: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
    { id: 'gender', label: 'ភេទ' },
    { id: 'level', label: 'កម្រិតសិក្សា' },
    { id: 'shift', label: 'វេន' },
    { id: 'enrollDate', label: 'ថ្ងៃចូលរៀន' },
    { id: 'fee', label: 'ថ្លៃសិក្សា (Fee)' },
    { id: 'status', label: 'ស្ថានភាពសិក្សា' },
    { id: 'className', label: 'ថ្នាក់' },
    { id: 'teacherName', label: 'គ្រូ' },
    { id: 'dob', label: 'ថ្ងៃកំណើត (DOB)' },
    { id: 'address', label: 'អាសយដ្ឋាន' },
    { id: 'location', label: 'ទីតាំង' },
    { id: 'transport', label: 'មធ្យោបាយ' },
    { id: 'contact', label: 'អ្នកទំនាក់ទំនង' },
    { id: 'father', label: 'ឪពុក' },
    { id: 'mother', label: 'ម្តាយ' },
    { id: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: string, value: string } | null>(null);
  const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterPhoto = (id: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredPhotoId(id);
  };

  const handleMouseLeavePhoto = () => {
    hoverTimeout.current = setTimeout(() => setHoveredPhotoId(null), 400);
  };

  useEffect(() => {
    const saved = localStorage.getItem('studentTableColumns');
    if (saved) {
      setVisibleColumns(JSON.parse(saved));
    } else {
      setVisibleColumns(AVAILABLE_COLUMNS.map(c => c.id).filter(id => id !== 'photoLink')); 
    }
  }, []);

  const toggleColumn = (colId: string) => {
    let updated;
    if (visibleColumns.includes(colId)) {
      updated = visibleColumns.filter(c => c !== colId);
    } else {
      updated = [...visibleColumns, colId];
    }
    setVisibleColumns(updated);
    localStorage.setItem('studentTableColumns', JSON.stringify(updated));
  };

  const handleCellClick = (e: React.MouseEvent, student: any, field: string) => {
    e.stopPropagation();
    if (role !== 'admin' || isStudentTableLocked) return;
    setEditingCell({ id: student.id, field, value: student[field] || '' });
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    try {
      await updateDoc(doc(db, 'students', editingCell.id), { [editingCell.field]: editingCell.field === 'fee' ? Number(editingCell.value) || 0 : editingCell.value });
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating cell', error);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCellSave();
    if (e.key === 'Escape') setEditingCell(null);
  };
  
  const renderCell = (student: any, field: string, defaultRender: React.ReactNode) => {
    if (editingCell && editingCell.id === student.id && editingCell.field === field) {
      const selectFields = ['gender', 'level', 'shift', 'status', 'address', 'transport'];
      if (selectFields.includes(field)) {
        let options: string[] = [];
        if (field === 'gender') options = ['ប្រុស', 'ស្រី'];
        else if (field === 'level') options = levelOptions;
        else if (field === 'shift') options = shiftOptions;
        else if (field === 'status') options = ['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'ឈប់រៀន'];
        else if (field === 'address') options = addressOptions;
        else if (field === 'transport') options = transportOptions;
        
        return (
          <select
            autoFocus
            value={editingCell.value}
            onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
            onBlur={handleCellSave}
            onKeyDown={handleCellKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', minWidth: '80px', padding: '0.25rem', border: '1px solid var(--accent)', borderRadius: '4px', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={field === 'fee' ? 'number' : 'text'}
          value={editingCell.value}
          onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={handleCellSave}
          onKeyDown={handleCellKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', minWidth: '80px', padding: '0.25rem', border: '1px solid var(--accent)', borderRadius: '4px', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
        />
      );
    }
    return (
      <div onClick={(e) => handleCellClick(e, student, field)} style={{ cursor: role === 'admin' && !isStudentTableLocked ? 'text' : 'default', minHeight: '1.5rem', display: 'flex', alignItems: 'center' }}>
        {defaultRender}
      </div>
    );
  };

  const [studentEditId, setStudentEditId] = useState<string | null>(null);
  const [isStudentTableLocked, setIsStudentTableLocked] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Form Fields
  const [studentIdField, setStudentIdField] = useState('');
  const [studentFullNameField, setStudentFullNameField] = useState('');
  const [studentEnglishNameField, setStudentEnglishNameField] = useState('');
  const [studentGenderField, setStudentGenderField] = useState('ស្រី');
  const [studentLevelField, setStudentLevelField] = useState('កម្រិតមធ្យមសិក្សា');
  const [studentShiftField, setStudentShiftField] = useState('វេនព្រឹក');
  const [studentEnrollDateField, setStudentEnrollDateField] = useState('');
  const [studentFeeField, setStudentFeeField] = useState('120'); // 1 = 1000 Riels
  const [studentClassNameField, setStudentClassNameField] = useState('10C');
  const [studentTeacherField, setStudentTeacherField] = useState('ស៊ុន សុខ');
  const [studentDobField, setStudentDobField] = useState('');
  const [studentAddressField, setStudentAddressField] = useState('');
  const [studentLocationField, setStudentLocationField] = useState('');
  const [studentTransportField, setStudentTransportField] = useState('Personal');
  const [studentPhotoField, setStudentPhotoField] = useState('');
  const [studentStatusField, setStudentStatusField] = useState('កំពុងសិក្សា');
  const [studentContactField, setStudentContactField] = useState('');
  const [studentFatherField, setStudentFatherField] = useState('');
  const [studentMotherField, setStudentMotherField] = useState('');
  const [studentPhoneNumField, setStudentPhoneNumField] = useState('');

  // Form Part Visibility toggles
  const [showPart1, setShowPart1] = useState(true);
  const [showPart2, setShowPart2] = useState(true);

  // Student Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentLevelFilter, setStudentLevelFilter] = useState('all');
  const [studentShiftFilter, setStudentShiftFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('កំពុងសិក្សា');
  const [studentSortBy, setStudentSortBy] = useState('id'); // 'id' | 'name' | 'dob'
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Options States
  const [levelOptions, setLevelOptions] = useState<string[]>(['កម្រិតបឋមសិក្សា', 'កម្រិតមធ្យមសិក្សា', 'កម្រិតវិទ្យាល័យ']);
  const [shiftOptions, setShiftOptions] = useState<string[]>(['វេនព្រឹក', 'វេនរសៀល', 'វេនល្ងាច', 'សៅរ៍-អាទិត្យ']);
  const [addressOptions, setAddressOptions] = useState<string[]>(['ភ្នំពេញ', 'កណ្ដាល', 'តាកែវ', 'កំពង់ចាម']);
  const [transportOptions, setTransportOptions] = useState<string[]>(['Bus', 'Personal', 'ម៉ូតូ', 'កង់']);
  const [genderOptions, setGenderOptions] = useState<string[]>(['ប្រុស', 'ស្រី']);
  const [statusOptions, setStatusOptions] = useState<string[]>(['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'ឈប់រៀន']);

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appStudentLevels) setLevelOptions(data.appStudentLevels.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
        if (data.appStudentShifts) setShiftOptions(data.appStudentShifts.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
        if (data.appStudentAddresses) setAddressOptions(data.appStudentAddresses.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
        if (data.appStudentTransports) setTransportOptions(data.appStudentTransports.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
        if (data.appStudentGenders) setGenderOptions(data.appStudentGenders.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
        if (data.appStudentStatuses) setStatusOptions(data.appStudentStatuses.map((opt: any) => typeof opt === 'string' ? opt : opt.id));
      }
    });

    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: any[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const cData: any[] = [];
      snapshot.forEach((doc) => {
        cData.push({ id: doc.id, ...doc.data() });
      });
      setClassesData(cData);
    });

    return () => {
      unsubscribe();
      unsubSettings();
      unsubClasses();
    };
  }, [router]);

  const augmentedStudents = students.map(s => {
    const sClasses = classesData.filter(c => c.studentIds && c.studentIds.includes(s.id));
    if (sClasses.length > 0) {
      return {
        ...s,
        className: sClasses.map(c => c.className).join(', '),
        teacherName: sClasses.map(c => c.teacherName).filter(Boolean).join(', ')
      };
    }
    return s;
  });

  // Student CRUD Functions
  const handleOpenAddStudent = () => {
    if (isStudentTableLocked) return;
    setStudentEditId(null);
    setStudentIdField('');
    setStudentFullNameField('');
    setStudentEnglishNameField('');
    setStudentGenderField(genderOptions.length > 0 ? genderOptions[0] : '');
      setStudentLevelField(levelOptions.length > 0 ? levelOptions[0] : '');
    setStudentShiftField(shiftOptions.length > 0 ? shiftOptions[0] : '');
    setStudentEnrollDateField(new Date().toISOString().slice(0, 10));
    setStudentFeeField('120');
    setStudentClassNameField('');
    setStudentTeacherField('');
    setStudentDobField('');
    setStudentAddressField(addressOptions.length > 0 ? addressOptions[0] : '');
    setStudentLocationField('');
    setStudentTransportField(transportOptions.includes('Personal') ? 'Personal' : transportOptions.length > 0 ? transportOptions[0] : 'Personal');
    setStudentPhotoField('');
    setStudentStatusField('កំពុងសិក្សា');
    setStudentContactField('');
    setStudentFatherField('');
    setStudentMotherField('');
    setStudentPhoneNumField('');
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: any) => {
    if (isStudentTableLocked) return;
    setStudentEditId(student.id);
    setStudentIdField(student.studentId || '');
    setStudentFullNameField(student.fullName || '');
    setStudentEnglishNameField(student.englishName || '');
    setStudentGenderField(student.gender || (genderOptions.length > 0 ? genderOptions[0] : ''));
    setStudentLevelField(student.level || 'កម្រិតមធ្យមសិក្សា');
    setStudentShiftField(student.shift || 'វេនព្រឹក');
    setStudentEnrollDateField(student.enrollDate || '');
    setStudentFeeField((student.fee || 120).toString());
    setStudentClassNameField(student.className || '10C');
    setStudentTeacherField(student.teacherName || 'ស៊ុន សុខ');
    setStudentDobField(student.dob || '');
    setStudentAddressField(student.address || '');
    setStudentLocationField(student.location || '');
    setStudentTransportField(student.transport || 'ម៉ូតូ');
    setStudentPhotoField(student.photo || '');
    setStudentStatusField(student.status || 'កំពុងសិក្សា');
    setStudentContactField(student.contact || '');
    setStudentFatherField(student.father || '');
    setStudentMotherField(student.mother || '');
    setStudentPhoneNumField(student.phoneNum || '');
    setIsStudentModalOpen(true);
  };

  const convertDriveUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      let fileId = '';
      const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      } else {
        const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) {
          fileId = matchId[1];
        }
      }
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    return url;
  };

  const handleSaveStudent = () => {
    // Validate all Part 1 fields (Mandatory)
    if (!studentIdField.trim() || !studentFullNameField.trim() || !studentEnglishNameField.trim() || !studentGenderField || !studentLevelField || !studentShiftField || !studentEnrollDateField || !studentFeeField) {
      alert('សូមបំពេញរាល់ព័ត៌មានសិក្សានៅផ្នែកទី១ ឱ្យបានគ្រប់ជ្រុងជ្រោយ (មិនអាចរំលងបានឡើយ)!');
      return;
    }

    const directPhotoUrl = convertDriveUrl(studentPhotoField);
    
    let updated;
    const studentData = {
      studentId: studentIdField,
      fullName: studentFullNameField,
      englishName: studentEnglishNameField,
      gender: studentGenderField,
      level: studentLevelField,
      shift: studentShiftField,
      enrollDate: studentEnrollDateField,
      fee: Number(studentFeeField) || 0,
      className: studentClassNameField,
      teacherName: studentTeacherField,
      dob: studentDobField,
      address: studentAddressField,
      location: studentLocationField,
      transport: studentTransportField,
      photo: directPhotoUrl,
      status: studentStatusField,
      contact: studentContactField,
      father: studentFatherField,
      mother: studentMotherField,
      phoneNum: studentPhoneNumField
    };

    if (studentEditId) {
      updateDoc(doc(db, 'students', studentEditId), studentData);
    } else {
      addDoc(collection(db, 'students'), studentData);
    }

    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    if (isStudentTableLocked) return;
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ?')) {
      deleteDoc(doc(db, 'students', id));
    }
  };

  const handleBulkDelete = () => {
    if (isStudentTableLocked) return;
    if (selectedStudentIds.length === 0) return;
    if (confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សទាំង ${selectedStudentIds.length} នាក់នេះមែនទេ?`)) {
      selectedStudentIds.forEach(id => deleteDoc(doc(db, 'students', id)));
      setSelectedStudentIds([]);
    }
  };

  const downloadSampleCSV = () => {
    const headers = [
      "ID", "Full Name", "English Name", "Gender", "Level", "Shift", 
      "Enroll Date", "Fee", "Class", "Teacher", "DOB", "Address", 
      "Location", "Transport", "Photo", "Status", "Contact", "Father", "Mother", "Phone Num"
    ];
    const sampleRow = [
      "9201", "លី តិចស្រេង", "Ly Tichsreng", "ស្រី", "កម្រិតមធ្យមសិក្សា", "វេនព្រឹក", 
      "2026-05-10", "120", "10C", "ស៊ុន សុខ", "27-06-2012", "ភ្នំពេញ", 
      "ច្បារអំពៅ", "Personal", "", "កំពុងសិក្សា", "មាស សុខ", "លី សុវណ្ណ", "មាស សុខ", "012345678"
    ];
    const csvContent = "\uFEFF" + [headers.join(","), sampleRow.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(",")].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sample_students_import.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export & Import
  const exportToCSV = () => {
    const headers = [
      "ID", "Full Name", "English Name", "Gender", "Level", "Shift", 
      "Enroll Date", "Fee", "Class", "Teacher", "DOB", "Address", 
      "Location", "Transport", "Photo", "Status", "Contact", "Father", "Mother", "Phone Num"
    ];
    const rows = augmentedStudents.map(s => [
      s.studentId, s.fullName, s.englishName, s.gender, s.level, s.shift,
      s.enrollDate, s.fee, s.className, s.teacherName, s.dob, s.address,
      s.location, s.transport, s.photo, s.status || 'កំពុងសិក្សា',
      s.contact || '', s.father || '', s.mother || '', s.phoneNum || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student_data_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length <= 1) return;

      const imported: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const fields = matches.map(f => f.replace(/^"|"$/g, '').trim());

        if (fields.length >= 10) {
          imported.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            studentId: fields[0] || '',
            fullName: fields[1] || '',
            englishName: fields[2] || '',
            gender: fields[3] || 'ប្រុស',
            level: fields[4] || 'កម្រិតមធ្យមសិក្សា',
            shift: fields[5] || 'វេនព្រឹក',
            enrollDate: fields[6] || '',
            fee: Number(fields[7]) || 120,
            className: fields[8] || '10C',
            teacherName: fields[9] || 'ស៊ុន សុខ',
            dob: fields[10] || '',
            address: fields[11] || '',
            location: fields[12] || '',
            transport: fields[13] || 'ម៉ូតូ',
            photo: fields[14] || '',
            status: fields[15] || 'កំពុងសិក្សា',
            contact: fields[16] || '',
            father: fields[17] || '',
            mother: fields[18] || '',
            phoneNum: fields[19] || ''
          });
        }
      }

      if (imported.length > 0) {
        imported.forEach(student => addDoc(collection(db, 'students'), student));
        alert(`កំពុងនាំចូលទិន្នន័យសិស្សចំនួន ${imported.length} នាក់...`);
      } else {
        alert('សូមពិនិត្យមើលទម្រង់ហ្វាយ CSV របស់អ្នកឡើងវិញ!');
      }
    };
    reader.readAsText(file);
  };

  const getFirstLetter = (name: string) => {
    if (!name) return 'ស';
    const parts = name.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0);
  };

  const formatDOBToYear = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    const year = parts.find(p => p.length === 4);
    return year || dateStr;
  };

  const formatEnrollToDay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const year = parts.find(p => p.length === 4);
    if (parts[0] === year) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  // Dynamic Class Options based on current students
  const classOptions = Array.from(new Set(augmentedStudents.map(s => s.className).filter(Boolean)));

  // Selection Checkbox Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredAndSortedStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, id]);
    } else {
      setSelectedStudentIds(prev => prev.filter(item => item !== id));
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedStudents = augmentedStudents
    .filter(s => {
      const matchesSearch = 
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || 
        s.englishName.toLowerCase().includes(studentSearch.toLowerCase()) || 
        s.studentId.includes(studentSearch);
      const matchesClass = studentClassFilter === 'all' || s.className === studentClassFilter;
      const matchesLevel = studentLevelFilter === 'all' || s.level === studentLevelFilter;
      const matchesShift = studentShiftFilter === 'all' || s.shift === studentShiftFilter;
      const matchesStatus = s.status === studentStatusFilter;
      return matchesSearch && matchesClass && matchesLevel && matchesShift && matchesStatus;
    })
    .sort((a, b) => {
      if (studentSortBy === 'id') return a.studentId.localeCompare(b.studentId);
      if (studentSortBy === 'name') return a.fullName.localeCompare(b.fullName, 'km-KH');
      if (studentSortBy === 'dob') return a.dob.localeCompare(b.dob);
      return 0;
    });

  const totalInFilter = filteredAndSortedStudents.length;
  const femaleCount = filteredAndSortedStudents.filter(s => s.gender === 'ស្រី').length;
  const maleCount = filteredAndSortedStudents.filter(s => s.gender === 'ប្រុស').length;

  if (role !== 'admin' && role !== 'teacher') return null;

  return (
    <>
      <div className="page-container animate-fade-in">
      
      {/* Header Bar: Title and Stats */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            ព័ត៌មានសិស្ស
          </h1>
          {/* Stats Badges (Custom CSS Badges instead of Emojis) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
              {totalInFilter === students.length ? `សរុប ${students.length} នាក់` : `បង្ហាញ ${totalInFilter} / ${students.length} នាក់`}
            </span>
            <span style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
              ស្រី {femaleCount}
            </span>
            <span style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
              ប្រុស {maleCount}
            </span>
          </div>
        </div>

        {/* Filters and Action Buttons Row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Level Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select className="input-field" value={studentLevelFilter} onChange={e => setStudentLevelFilter(e.target.value)} style={{ width: 'auto', background: 'var(--main-bg)', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.9rem' }}>
              <option value="all">គ្រប់កម្រិត</option>
              {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Shift Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select className="input-field" value={studentShiftFilter} onChange={e => setStudentShiftFilter(e.target.value)} style={{ width: 'auto', background: 'var(--main-bg)', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.9rem' }}>
              <option value="all">គ្រប់វេន</option>
              {shiftOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Class Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select className="input-field" value={studentClassFilter} onChange={e => setStudentClassFilter(e.target.value)} style={{ width: 'auto', background: 'var(--main-bg)', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.9rem' }}>
              <option value="all">គ្រប់ថ្នាក់</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <select className="input-field" value={studentStatusFilter} onChange={e => setStudentStatusFilter(e.target.value)} style={{ width: 'auto', background: 'var(--main-bg)', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.9rem' }}>
            <option value="កំពុងសិក្សា">កំពុងសិក្សា</option>
            <option value="ព្យួរការសិក្សា">ព្យួរការសិក្សា</option>
            <option value="ឈប់រៀន">ឈប់រៀន</option>
          </select>

          {/* Search Box */}
          <input 
            type="text" 
            className="input-field" 
            placeholder="ស្វែងរក..." 
            value={studentSearch} 
            onChange={e => setStudentSearch(e.target.value)}
            style={{ width: '160px', padding: '0.4rem 0.75rem', background: 'var(--main-bg)', fontSize: '0.9rem' }} 
          />

          {/* Column Visibility Toggle */}
          <div style={{ position: 'relative' }}>
            <button className="btn" onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} style={{ background: 'var(--main-bg)', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', height: '100%' }} title="លាក់/បង្ហាញ ជួរឈរ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            {isColumnMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', zIndex: 50, width: '250px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>បង្ហាញ/លាក់ ជួរឈរ</div>
                {AVAILABLE_COLUMNS.map(col => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Action SVGs (Stop using Emojis) */}
          <button onClick={handleOpenAddStudent} className="btn btn-primary" disabled={isStudentTableLocked} style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', opacity: isStudentTableLocked ? 0.6 : 1 }} title="បន្ថែមសិស្ស">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          
          {selectedStudentIds.length > 0 && (
            <button 
              onClick={handleBulkDelete} 
              className="btn animate-fade-in" 
              disabled={isStudentTableLocked} 
              style={{ 
                padding: '0.45rem 0.75rem', 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: 'var(--danger)',
                border: 'none', 
                display: 'flex', 
                alignItems: 'center',
                opacity: isStudentTableLocked ? 0.5 : 1
              }} 
              title="លុបសិស្សដែលបានជ្រើសរើស"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}

          <button onClick={() => setStudentSortBy(studentSortBy === 'id' ? 'name' : studentSortBy === 'name' ? 'dob' : 'id')} className="btn" style={{ padding: '0.45rem 0.75rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }} title="តម្រៀប">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 9 17 9 17 21 13 21 13 9 9 9 15 3"></polyline><polyline points="9 21 3 15 7 15 7 3 11 3 11 15 15 15 9 21"></polyline></svg>
          </button>
          
          <button onClick={() => { setStudentSearch(''); setStudentClassFilter('all'); setStudentLevelFilter('all'); setStudentShiftFilter('all'); setStudentStatusFilter('កំពុងសិក្សា'); setSelectedStudentIds([]); }} className="btn" style={{ padding: '0.45rem 0.75rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          </button>

          <button onClick={exportToCSV} className="btn" style={{ padding: '0.45rem 0.75rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }} title="Export CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
          
          <button onClick={() => !isStudentTableLocked && fileInputRef.current?.click()} className="btn" disabled={isStudentTableLocked} style={{ padding: '0.45rem 0.75rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', opacity: isStudentTableLocked ? 0.6 : 1 }} title="Import CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </button>
          
          <button onClick={downloadSampleCSV} className="btn" style={{ padding: '0.45rem 0.75rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }} title="ទាញយកគំរូ CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            គំរូ CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={importFromCSV} style={{ display: 'none' }} />

          {/* Lock Toggle SVG Button */}
          <button 
            onClick={() => setIsStudentTableLocked(!isStudentTableLocked)} 
            className="btn" 
            style={{ 
              padding: '0.45rem 0.75rem', 
              background: isStudentTableLocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
              color: isStudentTableLocked ? '#d97706' : '#10b981', 
              border: 'none', 
              display: 'flex',
              alignItems: 'center'
            }}
            title={isStudentTableLocked ? "ដោះសោដើម្បីកែប្រែ" : "ចាក់សោតារាង"}
          >
            {isStudentTableLocked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
            )}
          </button>
        </div>
      </div>

      {/* Lock Warning Banner */}
      {isStudentTableLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#d97706', marginBottom: '1.25rem', fontWeight: 500, fontSize: '0.9rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          តារាងត្រូវបានចាក់សោ — ចុចរូបសោ 🔒 នៅខាងលើ ដើម្បីបើកបន្ថែម កែប្រែ ឬលុបទិន្នន័យសិស្ស។
        </div>
      )}

      {/* Table Container (Horizontal Scrollable) */}
      <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
        <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1800px', fontSize: '0.95rem' }}>
          <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '0.85rem 1.25rem', width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={filteredAndSortedStudents.length > 0 && selectedStudentIds.length === filteredAndSortedStudents.length} 
                  onChange={handleSelectAll} 
                />
              </th>
              <th style={{ padding: '0.85rem 1.25rem', width: '60px' }}>ល.រ</th>
              {AVAILABLE_COLUMNS.map(col => visibleColumns.includes(col.id) && <th key={col.id} style={{ padding: '0.85rem 1.25rem' }}>{col.label}</th>)}
              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', width: '120px' }}>ជម្រើស</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStudents.map((student, index) => (
              <tr 
                key={student.id} 
                onDoubleClick={() => handleOpenEditStudent(student)}
                style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                  cursor: isStudentTableLocked ? 'default' : 'pointer',
                  transition: 'background 0.2s'
                }}
                className={!isStudentTableLocked ? 'hover:bg-black/5' : ''}
              >
                                <td style={{ padding: '0.75rem 1.25rem' }} onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedStudentIds.includes(student.id)} 
                    onChange={(e) => handleSelectOne(student.id, e.target.checked)} 
                  />
                </td>
                <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)' }}>{index + 1}</td>
                
                {visibleColumns.includes('photo') && <td style={{ padding: '0.75rem 1.25rem', position: 'relative' }} onMouseEnter={() => handleMouseEnterPhoto(student.id)} onMouseLeave={handleMouseLeavePhoto}>
                  {student.photo ? (
                    <img src={student.photo} alt={student.fullName} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                  ) : (
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '12px', 
                      background: student.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      {getFirstLetter(student.fullName)}
                    </div>
                  )}
                  {/* Hover Profile Popup (Centered on Screen using Portal) */}
                  {hoveredPhotoId === student.id && typeof window !== 'undefined' && createPortal(
                    <div style={{
                      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 99999, pointerEvents: 'none'
                    }}>
                      <div style={{
                        background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '24px',
                        padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', pointerEvents: 'auto',
                        display: 'flex', flexDirection: 'column', gap: '1.5rem', cursor: 'default',
                        backdropFilter: 'blur(10px)'
                      }} 
                      onMouseEnter={() => handleMouseEnterPhoto(student.id)} 
                      onMouseLeave={handleMouseLeavePhoto}
                      onClick={e => e.stopPropagation()}>
                      {/* Header Section */}
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                        {student.photo ? (
                          <img src={student.photo} alt={student.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                        ) : (
                          <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: student.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                            {getFirstLetter(student.fullName)}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{student.fullName}</h2>
                          <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{student.englishName || 'គ្មានឈ្មោះអង់គ្លេស'}</p>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700 }}>ID: {student.studentId}</span>
                            <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: student.status === 'កំពុងសិក្សា' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: student.status === 'កំពុងសិក្សា' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{student.status || 'កំពុងសិក្សា'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Info Sections */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        
                        {/* Academic Info */}
                        <div style={{ background: 'rgba(139, 92, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                            ព័ត៌មានសិក្សា
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្នាក់៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.className || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>កម្រិត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.level || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>វេន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.shift || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>គ្រូបន្ទុកថ្នាក់៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.teacherName || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{formatEnrollToDay(student.enrollDate) || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្លៃសិក្សា៖</span> <strong style={{ color: '#10b981' }}>{student.fee ? `${student.fee} ពាន់រៀល` : 'N/A'}</strong></div>
                          </div>
                        </div>

                        {/* Personal & Contact Info */}
                        <div style={{ background: 'rgba(236, 72, 153, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#ec4899', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            ជីវប្រវត្តិ & ទំនាក់ទំនង
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ភេទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.gender || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃកំណើត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.dob || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ឪពុក៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.father || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ម្តាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.mother || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.phoneNum || 'N/A'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>មធ្យោបាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{student.transport || 'N/A'}</strong></div>
                          </div>
                        </div>

                        {/* Extra Details spanning full width */}
                        <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>អាសយដ្ឋាន៖</span> <strong style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{student.address || 'N/A'}</strong></div>
                             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>បណ្តាញសង្គម៖</span> 
                               {student.contact ? (student.contact.startsWith('http') ? <a href={student.contact} target="_blank" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'underline' }}>ចុចទីនេះ 📍</a> : <strong style={{ color: 'var(--text-primary)' }}>{student.contact}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                             </div>
                             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>ទីតាំងផ្ទះ៖</span> 
                               {student.location ? (student.location.startsWith('http') ? <a href={student.location} target="_blank" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>ផែនទី 📍</a> : <strong style={{ color: 'var(--text-primary)' }}>{student.location}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                             </div>
                           </div>
                        </div>
                      </div>

                      <button onClick={() => { setHoveredPhotoId(null); handleOpenEditStudent(student); }} className="btn btn-primary" disabled={isStudentTableLocked} style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', border: 'none', fontSize: '1.05rem', fontWeight: 700, marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        កែប្រែព័ត៌មានលម្អិតសិស្ស
                      </button>
                    </div>
                  </div>,
                  document.body
                  )}
                </td>}
                
                {visibleColumns.includes('photoLink') && <td style={{ padding: '0.75rem 1.25rem' }}>
                  {renderCell(student, 'photo', student.photo ? (
                    <a href={student.photo} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', textDecoration: 'underline', fontWeight: 600 }} onClick={e => e.stopPropagation()}>Link 📍</a>
                  ) : <span style={{ color: 'var(--text-secondary)' }}>គ្មាន</span>)}
                </td>}

                {visibleColumns.includes('studentId') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'studentId', <code>{student.studentId}</code>)}</td>}
                {visibleColumns.includes('fullName') && <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>{renderCell(student, 'fullName', student.fullName)}</td>}
                {visibleColumns.includes('englishName') && <td style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>{renderCell(student, 'englishName', student.englishName)}</td>}
                
                {visibleColumns.includes('gender') && <td style={{ padding: '0.75rem 1.25rem' }}>
                  {renderCell(student, 'gender', <span style={{ 
                    fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 600,
                    background: student.gender === 'ស្រី' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: student.gender === 'ស្រី' ? '#ec4899' : '#3b82f6'
                  }}>
                    {student.gender}
                  </span>)}
                </td>}
                
                {visibleColumns.includes('level') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'level', student.level)}</td>}
                {visibleColumns.includes('shift') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'shift', student.shift)}</td>}
                {visibleColumns.includes('enrollDate') && <td style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>{renderCell(student, 'enrollDate', formatEnrollToDay(student.enrollDate))}</td>}
                
                {visibleColumns.includes('fee') && <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  {renderCell(student, 'fee', student.fee)}
                </td>}

                {visibleColumns.includes('status') && <td style={{ padding: '0.75rem 1.25rem' }}>
                  {renderCell(student, 'status', <span style={{ 
                    fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 600,
                    background: student.status === 'កំពុងសិក្សា' ? 'rgba(16, 185, 129, 0.1)' : student.status === 'ព្យួរការសិក្សា' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: student.status === 'កំពុងសិក្សា' ? '#10b981' : student.status === 'ព្យួរការសិក្សា' ? '#f59e0b' : '#ef4444'
                  }}>
                    {student.status || 'កំពុងសិក្សា'}
                  </span>)}
                </td>}
                
                {visibleColumns.includes('className') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'className', student.className)}</td>}
                {visibleColumns.includes('teacherName') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'teacherName', student.teacherName)}</td>}
                {visibleColumns.includes('dob') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'dob', formatDOBToYear(student.dob))}</td>}
                {visibleColumns.includes('address') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'address', student.address)}</td>}
                
                {visibleColumns.includes('location') && <td style={{ padding: '0.75rem 1.25rem' }}>
                  {renderCell(student, 'location', student.location && (student.location.startsWith('http://') || student.location.startsWith('https://')) ? (
                    <a href={student.location} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                      Link 📍
                    </a>
                  ) : student.location)}
                </td>}
                
                {visibleColumns.includes('transport') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'transport', student.transport)}</td>}
                
                {visibleColumns.includes('contact') && <td style={{ padding: '0.75rem 1.25rem' }}>
                  {renderCell(student, 'contact', student.contact ? (
                    student.contact.startsWith('http://') || student.contact.startsWith('https://') ? (
                      <a href={student.contact} target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                        Link 📍
                      </a>
                    ) : student.contact
                  ) : '')}
                </td>}
                
                {visibleColumns.includes('father') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'father', student.father)}</td>}
                {visibleColumns.includes('mother') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'mother', student.mother)}</td>}
                {visibleColumns.includes('phoneNum') && <td style={{ padding: '0.75rem 1.25rem' }}>{renderCell(student, 'phoneNum', student.phoneNum)}</td>}
                
                {/* Actions */}
                <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEditStudent(student); }} 
                      className="btn" 
                      disabled={isStudentTableLocked}
                      style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', opacity: isStudentTableLocked ? 0.4 : 1 }} 
                      title="កែប្រែ"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }} 
                      className="btn" 
                      disabled={isStudentTableLocked}
                      style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', opacity: isStudentTableLocked ? 0.4 : 1 }} 
                      title="លុប"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSortedStudents.length === 0 && (
              <tr>
                <td colSpan={22} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  មិនមានទិន្នន័យសិស្សត្រូវគ្នានឹងការស្វែងរកទេ។
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>

      </div>

      {/* STUDENT MODAL (Responsive Opaque Modals) */}
      {isStudentModalOpen && (
        <div 
          onClick={() => setIsStudentModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-fade-in post-read-modal" 
            style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg)', padding: '2rem', overflowY: 'auto' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>
              {studentEditId ? 'កែប្រែព័ត៌មានសិស្ស' : 'បន្ថែមសិស្សថ្មី'}
            </h2>
            
            {/* Part 1 Header Toggle */}
            <div 
              onClick={() => setShowPart1(!showPart1)} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: 'rgba(99, 102, 241, 0.08)', 
                border: '1px solid rgba(99, 102, 241, 0.15)', 
                padding: '0.75rem 1.25rem', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                marginBottom: '1rem',
                userSelect: 'none'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎓 ផ្នែកទី១៖ ព័ត៌មានសិក្សា (Student ID ដល់ Fee)
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{showPart1 ? '▼ លាក់ (Hide)' : '▲ បង្ហាញ (Show)'}</span>
            </div>

            {showPart1 && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>អត្តលេខ (Student ID) *</label>
                  <input type="text" className="input-field" value={studentIdField} onChange={e => setStudentIdField(e.target.value)} placeholder="ឧ. 9201" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ឈ្មោះពេញ (Khmer Name) *</label>
                  <input type="text" className="input-field" value={studentFullNameField} onChange={e => setStudentFullNameField(e.target.value)} placeholder="ឧ. លី តិចស្រេង" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ឈ្មោះឡាតាំង (English Name) *</label>
                  <input type="text" className="input-field" value={studentEnglishNameField} onChange={e => setStudentEnglishNameField(e.target.value)} placeholder="ឧ. Ly Tichsreng" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ភេទ (Gender) *</label>
                  <select className="input-field" value={studentGenderField} onChange={e => setStudentGenderField(e.target.value)}>
                      {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      {genderOptions.length === 0 && <option value="" disabled>-- គ្មានជម្រើស --</option>}
                    </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>កម្រិតសិក្សា (Level) *</label>
                  <select className="input-field" value={studentLevelField} onChange={e => setStudentLevelField(e.target.value)}>
                    {levelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {!levelOptions.includes(studentLevelField) && studentLevelField && <option value={studentLevelField}>{studentLevelField}</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>វេនសិក្សា (Shift) *</label>
                  <select className="input-field" value={studentShiftField} onChange={e => setStudentShiftField(e.target.value)}>
                    {shiftOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {!shiftOptions.includes(studentShiftField) && studentShiftField && <option value={studentShiftField}>{studentShiftField}</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ថ្ងៃចូលរៀន (Enroll Date) *</label>
                  <input type="date" className="input-field" value={studentEnrollDateField} onChange={e => setStudentEnrollDateField(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ថ្លៃសិក្សា (Fee) [1 = 1000៛] *</label>
                  <input type="number" className="input-field" value={studentFeeField} onChange={e => setStudentFeeField(e.target.value)} placeholder="ឧ. 120 (120,000៛)" />
                </div>
              </div>
            )}

            {/* Part 2 Header Toggle */}
            <div 
              onClick={() => setShowPart2(!showPart2)} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: 'rgba(139, 92, 246, 0.08)', 
                border: '1px solid rgba(139, 92, 246, 0.15)', 
                padding: '0.75rem 1.25rem', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                marginBottom: '1rem',
                userSelect: 'none'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏠 ផ្នែកទី២៖ ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង (DOB ដល់ Phone Num)
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{showPart2 ? '▼ លាក់ (Hide)' : '▲ បង្ហាញ (Show)'}</span>
            </div>

            {showPart2 && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
                  <input type="text" className="input-field" value={studentDobField} onChange={e => setStudentDobField(e.target.value)} placeholder="ឧ. 27-06-2012" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>អាសយដ្ឋាន (Address)</label>
                  <select className="input-field" value={studentAddressField} onChange={e => setStudentAddressField(e.target.value)}>
                    {addressOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {!addressOptions.includes(studentAddressField) && studentAddressField && <option value={studentAddressField}>{studentAddressField}</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ទីតាំង (Google Maps Link)</label>
                  <input type="text" className="input-field" value={studentLocationField} onChange={e => setStudentLocationField(e.target.value)} placeholder="https://maps.google.com/..." />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>មធ្យោបាយធ្វើដំណើរ (Transport)</label>
                  <select className="input-field" value={studentTransportField} onChange={e => setStudentTransportField(e.target.value)}>
                    {transportOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {!transportOptions.includes(studentTransportField) && studentTransportField && <option value={studentTransportField}>{studentTransportField}</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>តំណលីងរូបថត (Photo URL / Google Drive)</label>
                  <input type="text" className="input-field" value={studentPhotoField} onChange={e => setStudentPhotoField(e.target.value)} placeholder="បិទភ្ជាប់ Link រូបភាព ឬ Link ពី Google Drive" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ស្ថានភាពសិក្សា (Status)</label>
                  <select className="input-field" value={studentStatusField} onChange={e => setStudentStatusField(e.target.value)}>
                      {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      {statusOptions.length === 0 && <option value="" disabled>-- គ្មានជម្រើស --</option>}
                    </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>អ្នកទំនាក់ទំនង (Social Media Link)</label>
                  <input type="text" className="input-field" value={studentContactField} onChange={e => setStudentContactField(e.target.value)} placeholder="https://t.me/username ឬ Link ផ្សេងៗ" />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ឈ្មោះឪពុក (Father Name)</label>
                  <input type="text" className="input-field" value={studentFatherField} onChange={e => setStudentFatherField(e.target.value)} placeholder="ឧ. លី សុវណ្ណ" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>ឈ្មោះម្តាយ (Mother Name)</label>
                  <input type="text" className="input-field" value={studentMotherField} onChange={e => setStudentMotherField(e.target.value)} placeholder="ឧ. មាស សុខ" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>លេខទូរស័ព្ទ (Phone Num)</label>
                  <input type="text" className="input-field" value={studentPhoneNumField} onChange={e => setStudentPhoneNumField(e.target.value)} placeholder="ឧ. 012345678" />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsStudentModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveStudent} style={{ padding: '0.75rem 2rem' }}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
