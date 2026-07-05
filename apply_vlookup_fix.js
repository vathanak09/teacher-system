const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

const saveClassOld = `    let baseStudentsData = classEditId ? (classes.find(c => c.id === classEditId)?.studentsData || []) : [];
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
    };`;

const saveClassNew = `    let baseStudentIds = classEditId ? (classes.find(c => c.id === classEditId)?.studentIds || (classes.find(c => c.id === classEditId)?.studentsData || []).map((s: any) => s.id)) : [];

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
    };`;

content = content.replace(saveClassOld, saveClassNew);

const addStudentOld = `  const handleAddStudentToClass = (studentId: string) => {
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
  };`;

const addStudentNew = `  const handleAddStudentToClass = (studentId: string) => {
    if (!viewingClass) return;
    const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
    if (existingIds.includes(studentId)) return;

    const mergedIds = [...existingIds, studentId];
    const updatedClass = { ...viewingClass, studentIds: mergedIds };
    delete updatedClass.studentsData;
    
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
  };`;
content = content.replace(addStudentOld, addStudentNew);

const removeStudentOld = `  const handleRemoveStudentFromClass = (studentId: string) => {
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
  };`;

const removeStudentNew = `  const handleRemoveStudentFromClass = (studentId: string) => {
    if (!viewingClass) return;
    if (confirm('តើអ្នកពិតជាចង់ដកសិស្សនេះចេញពីថ្នាក់មែនទេ?')) {
      const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
      const filteredIds = existingIds.filter((id: string) => id !== studentId);
      
      const updatedClass = { ...viewingClass, studentIds: filteredIds };
      delete updatedClass.studentsData;

      updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
      setViewingClass(updatedClass);
    }
  };`;
content = content.replace(removeStudentOld, removeStudentNew);


const searchResultsOld = `  const searchResults = studentSearch.trim() === '' ? [] : allStudents.filter(s => {
    const existingIds = viewingClass?.studentsData && viewingClass.studentsData.length > 0 ? viewingClass.studentsData.map((ms: any) => ms.id) : (viewingClass?.studentIds || []);
    return !existingIds.includes(s.id) && 
           (s.fullName.includes(studentSearch) || s.studentId.includes(studentSearch) || (s.englishName || '').toLowerCase().includes(studentSearch.toLowerCase()));
  }).slice(0, 5);`;

const searchResultsNew = `  const searchResults = studentSearch.trim() === '' ? [] : allStudents.filter(s => {
    const existingIds = viewingClass?.studentIds || (viewingClass?.studentsData ? viewingClass.studentsData.map((ms: any) => ms.id) : []);
    return !existingIds.includes(s.id) && 
           (s.fullName.includes(studentSearch) || s.studentId.includes(studentSearch) || (s.englishName || '').toLowerCase().includes(studentSearch.toLowerCase()));
  }).slice(0, 5);`;
content = content.replace(searchResultsOld, searchResultsNew);


const enrolledStudentsOld = `  const enrolledStudents = viewingClass ? (
    viewingClass.studentsData && viewingClass.studentsData.length > 0 
      ? viewingClass.studentsData 
      : (viewingClass.studentIds || []).map((id: string) => allStudents.find(s => s.id === id)).filter(Boolean)
  ) : [];`;

const enrolledStudentsNew = `  const enrolledStudents = viewingClass ? (
    (viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []))
      .map((id: string) => allStudents.find(s => s.id === id))
      .filter(Boolean)
  ) : [];`;
content = content.replace(enrolledStudentsOld, enrolledStudentsNew);

const saveStudentEditOld = `  const handleSaveStudentEdit = (e: React.FormEvent) => {
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
  };`;

const saveStudentEditNew = ``; // Remove completely
content = content.replace(saveStudentEditOld, saveStudentEditNew);


const requestStudentEditOld = `  const handleRequestStudentEdit = async () => {
      if (!editStudentData || !viewingClass) return;
      
      const originalStudent = (viewingClass.studentsData || []).find((s: any) => s.id === editStudentData.id) 
        || allStudents.find(s => s.id === editStudentData.id);`;

const requestStudentEditNew = `  const handleRequestStudentEdit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editStudentData || !viewingClass) return;
      
      const originalStudent = allStudents.find(s => s.id === editStudentData.id);`;
content = content.replace(requestStudentEditOld, requestStudentEditNew);

const formOld = `<form onSubmit={handleSaveStudentEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`;
const formNew = `<form onSubmit={handleRequestStudentEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`;
content = content.replace(formOld, formNew);

const buttonsOld = `                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={handleRequestStudentEdit} style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ស្នើសុំកែប្រែទៅ Admin
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>រក្សាទុកក្នុងថ្នាក់</button>
                  </div>
                </div>`;

const buttonsNew = `                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ស្នើសុំកែប្រែទៅ Admin
                  </button>
                </div>`;
content = content.replace(buttonsOld, buttonsNew);


fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed correctly.');
