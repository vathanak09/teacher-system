const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexAdd = /const handleAddStudentToClass = \(studentId: string\) => \{([\s\S]*?)setViewingClass\(updatedClass\);\n  \};/;
const newAdd = `const handleAddStudentToClass = (studentId: string) => {
    if (!viewingClass) return;
    const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
    if (existingIds.includes(studentId)) return;

    const mergedIds = [...existingIds, studentId];
    const updatedClass = { ...viewingClass, studentIds: mergedIds };
    delete updatedClass.studentsData; // Clean up old data structure
    
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
  };`;
content = content.replace(regexAdd, newAdd);

const regexRemove = /const handleRemoveStudentFromClass = \(studentId: string\) => \{([\s\S]*?)setViewingClass\(updatedClass\);\n    \}\n  \};/;
const newRemove = `const handleRemoveStudentFromClass = (studentId: string) => {
    if (!viewingClass) return;
    if (confirm('តើអ្នកពិតជាចង់ដកសិស្សនេះចេញពីថ្នាក់មែនទេ?')) {
      const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
      const filteredIds = existingIds.filter((id: string) => id !== studentId);
      
      const updatedClass = { ...viewingClass, studentIds: filteredIds };
      delete updatedClass.studentsData; // Clean up old data structure

      updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
      setViewingClass(updatedClass);
    }
  };`;
content = content.replace(regexRemove, newRemove);

const regexSave = /let baseStudentsData = classEditId \? \(classes\.find\(c => c\.id === classEditId\)\?\.studentsData \|\| \[\]\) : \[\];([\s\S]*?)studentsData: baseStudentsData,\n    \};/;
const newSave = `let baseStudentIds = classEditId ? (classes.find(c => c.id === classEditId)?.studentIds || (classes.find(c => c.id === classEditId)?.studentsData || []).map((s: any) => s.id)) : [];

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
content = content.replace(regexSave, newSave);

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacements');
