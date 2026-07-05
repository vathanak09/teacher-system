const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. handleSaveClass
content = content.replace(
  /let baseStudentsData = classEditId \? \(classes\.find\(c => c\.id === classEditId\)\?\.studentsData \|\| \[\]\) : \[\];\n\s*let baseStudentIds = classEditId \? \(classes\.find\(c => c\.id === classEditId\)\?\.studentIds \|\| \[\]\) : \[\];/,
  `let baseStudentIds = classEditId ? (classes.find(c => c.id === classEditId)?.studentIds || (classes.find(c => c.id === classEditId)?.studentsData || []).map(s => s.id)) : [];`
);

content = content.replace(
  /const existingIds = baseStudentsData && baseStudentsData\.length > 0 \? baseStudentsData\.map\(\(s: any\) => s\.id\) : baseStudentIds;\n\s*const matchingStudents = allStudents\.filter\(s => {/,
  `const existingIds = baseStudentIds;\n      const matchingStudents = allStudents.filter(s => {`
);

content = content.replace(
  /baseStudentsData = \[\.\.\.baseStudentsData, \.\.\.matchingStudents\];\n\s*baseStudentIds = baseStudentsData\.map\(\(s: any\) => s\.id\);/,
  `baseStudentIds = [...baseStudentIds, ...matchingStudents.map(s => s.id)];`
);

content = content.replace(
  /studentIds: baseStudentIds,\n\s*studentsData: baseStudentsData,/,
  `studentIds: baseStudentIds,`
);

// 2. handleAddStudentToClass
const addStudentRegex = /const handleAddStudentToClass = \(studentId: string\) => \{([\s\S]*?)setViewingClass\(updatedClass\);\n  \};/;
const newAddStudent = `const handleAddStudentToClass = (studentId: string) => {
    if (!viewingClass) return;
    const existingIds = viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []);
    if (existingIds.includes(studentId)) return;

    const mergedIds = [...existingIds, studentId];
    const updatedClass = { ...viewingClass, studentIds: mergedIds };
    delete updatedClass.studentsData; // Clean up old data structure
    
    updateDoc(doc(db, 'classes', viewingClass.id), updatedClass);
    setViewingClass(updatedClass);
  };`;
content = content.replace(addStudentRegex, newAddStudent);

// 3. handleRemoveStudentFromClass
const removeStudentRegex = /const handleRemoveStudentFromClass = \(studentId: string\) => \{([\s\S]*?)setViewingClass\(updatedClass\);\n    \}\n  \};/;
const newRemoveStudent = `const handleRemoveStudentFromClass = (studentId: string) => {
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
content = content.replace(removeStudentRegex, newRemoveStudent);

// 4. enrolledStudents
const enrolledStudentsRegex = /const enrolledStudents = viewingClass \? \([\s\S]*?\) : \[\];/;
const newEnrolledStudents = `const enrolledStudents = viewingClass ? (
    (viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []))
      .map((id: string) => allStudents.find(s => s.id === id))
      .filter(Boolean)
  ) : [];`;
content = content.replace(enrolledStudentsRegex, newEnrolledStudents);


fs.writeFileSync(file, content, 'utf8');
console.log('Fixed VLOOKUP logic');
