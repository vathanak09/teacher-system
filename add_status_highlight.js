const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

content = content.replace(/\r\n/g, '\n');

const enrolledStudentsOld = `  const enrolledStudents = viewingClass ? (
    (viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []))
      .map((id: string) => allStudents.find(s => s.id === id))
      .filter(Boolean)
  ) : [];`;

const enrolledStudentsNew = `  const enrolledStudents = viewingClass ? (
    (viewingClass.studentIds || (viewingClass.studentsData ? viewingClass.studentsData.map((s: any) => s.id) : []))
      .map((id: string) => {
        const student = allStudents.find(s => s.id === id);
        if (student) return student;
        return {
          id: id,
          isDeleted: true,
          fullName: 'សិស្សត្រូវបានលុប',
          studentId: 'N/A',
          gender: '-',
          level: '-',
          shift: '-',
          status: 'លុបចេញ'
        };
      })
  ) : [];`;

content = content.replace(enrolledStudentsOld, enrolledStudentsNew);

const trOld = `<tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">`;
const trNew = `<tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: s.isDeleted ? 'rgba(239, 68, 68, 0.1)' : (s.status === 'ឈប់រៀន' || s.status === 'ព្យួរការសិក្សា') ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }} className="table-row-hover">`;
content = content.replace(trOld, trNew);

content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed deleted/suspended highlight correctly.');
