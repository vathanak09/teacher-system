const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/students/page.tsx', 'utf8');
content = content.replace(/\r\n/g, '\n');

const deleteOld = `  const handleDeleteStudent = (id: string) => {
    if (isStudentTableLocked) return;
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ?')) {
      deleteDoc(doc(db, 'students', id));
    }
  };

  const handleBulkDelete = () => {
    if (isStudentTableLocked) return;
    if (selectedStudentIds.length === 0) return;
    if (confirm(\`តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សទាំង \${selectedStudentIds.length} នាក់នេះមែនទេ?\`)) {
      selectedStudentIds.forEach(id => deleteDoc(doc(db, 'students', id)));
      setSelectedStudentIds([]);
    }
  };`;

const deleteNew = `  const handleDeleteStudent = (id: string) => {
    if (isStudentTableLocked) return;
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ?')) {
      const studentToDelete = students.find(s => s.id === id);
      
      // Update classes that contain this student to preserve their final data
      classesData.forEach(c => {
        if (c.studentIds && c.studentIds.includes(id)) {
          const deletedData = c.deletedStudentsData || [];
          if (studentToDelete) {
            updateDoc(doc(db, 'classes', c.id), {
              deletedStudentsData: [...deletedData, studentToDelete]
            });
          }
        }
      });
      
      deleteDoc(doc(db, 'students', id));
    }
  };

  const handleBulkDelete = () => {
    if (isStudentTableLocked) return;
    if (selectedStudentIds.length === 0) return;
    if (confirm(\`តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សទាំង \${selectedStudentIds.length} នាក់នេះមែនទេ?\`)) {
      selectedStudentIds.forEach(id => {
        const studentToDelete = students.find(s => s.id === id);
        
        classesData.forEach(c => {
          if (c.studentIds && c.studentIds.includes(id)) {
            const deletedData = c.deletedStudentsData || [];
            if (studentToDelete) {
              updateDoc(doc(db, 'classes', c.id), {
                deletedStudentsData: [...deletedData, studentToDelete]
              });
            }
          }
        });
        
        deleteDoc(doc(db, 'students', id));
      });
      setSelectedStudentIds([]);
    }
  };`;

content = content.replace(deleteOld, deleteNew);
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/students/page.tsx', content, 'utf8');
console.log('Updated students page.');
