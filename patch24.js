const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add markAllPresent function inside the component
const handleAttendanceChangeRegex = /const handleAttendanceChange = async \(studentId: string, day: number, value: string\) => \{/;

const markAllPresentCode = `
  const markAllPresent = async (day: number) => {
    if (role !== 'admin' && role !== 'teacher') return;
    
    // Check if we have selected class and students
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return;
    
    const classStudentIds = selectedClass.studentIds || (selectedClass.studentsData ? selectedClass.studentsData.map((s: any) => s.id) : []);
    const classStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);
    
    if (classStudents.length === 0) return;

    const newRecords = { ...attendanceRecords };
    let changed = false;
    
    classStudents.forEach(student => {
      if (!newRecords[student.id]) newRecords[student.id] = {};
      // If it's not already present, mark it as present
      if (newRecords[student.id][day] !== 'present') {
        newRecords[student.id][day] = 'present';
        changed = true;
      }
    });
    
    if (changed) {
      setAttendanceRecords(newRecords);
      const docId = \`\${selectedClassId}_\${selectedYear}_\${selectedMonth}\`;
      try {
        await attendanceService.add({
          classId: selectedClassId,
          year: selectedYear,
          month: selectedMonth,
          records: newRecords,
          updatedAt: new Date().toISOString()
        }, docId);
      } catch (error) {
        console.error("Error saving bulk attendance", error);
      }
    }
  };

  const handleAttendanceChange = async (studentId: string, day: number, value: string) => {
`;

content = content.replace(handleAttendanceChangeRegex, markAllPresentCode.trim());


// 2. Modify TH for days to be clickable and reduce padding of all THs
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '50px', position: 'sticky', left: 0, background: 'var\(--bg-secondary\)', zIndex: 10 \}\}>ល\.រ<\/th>/,
  `<th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '50px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>ល.រ</th>`
);
content = content.replace(
  /<th className="mobile-hide" style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '80px', position: 'sticky', left: '50px', background: 'var\(--bg-secondary\)', zIndex: 10 \}\}>អត្តលេខ<\/th>/,
  `<th className="mobile-hide" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '80px', position: 'sticky', left: '50px', background: 'var(--bg-secondary)', zIndex: 10 }}>អត្តលេខ</th>`
);
content = content.replace(
  /<th className="sticky-name" style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '150px', position: 'sticky', background: 'var\(--bg-secondary\)', zIndex: 10 \}\}>ឈ្មោះសិស្ស<\/th>/,
  `<th className="sticky-name" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '150px', position: 'sticky', background: 'var(--bg-secondary)', zIndex: 10 }}>ឈ្មោះសិស្ស</th>`
);
content = content.replace(
  /<th className="mobile-hide sticky-gender" style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '60px', position: 'sticky', background: 'var\(--bg-secondary\)', borderRight: '2px solid var\(--border-color\)', zIndex: 10 \}\}>ភេទ<\/th>/,
  `<th className="mobile-hide sticky-gender" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '60px', position: 'sticky', background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-color)', zIndex: 10 }}>ភេទ</th>`
);

content = content.replace(
  /<th key=\{day\} style=\{\{ padding: '1rem 0\.25rem', textAlign: 'center', minWidth: '40px', fontSize: '0\.85rem' \}\}>\{day\}<\/th>/g,
  `<th key={day} onClick={() => markAllPresent(day)} title="ចុចដើម្បីដាក់វត្តមានសិស្សទាំងអស់" style={{ padding: '0.5rem 0.25rem', textAlign: 'center', minWidth: '38px', fontSize: '0.85rem', cursor: 'pointer', borderLeft: '1px solid rgba(0,0,0,0.05)', borderRight: '1px solid rgba(0,0,0,0.05)', background: 'var(--bg-secondary)' }} className="hover:bg-blue-50 transition-colors">{day}</th>`
);

content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#10b981' \}\}>សរុប ✔️<\/th>/,
  `<th style={{ padding: '0.5rem', textAlign: 'center', minWidth: '50px', color: '#3b82f6' }}>សរុប ✔️</th>` // Note: User wants blue checkmark so summary header should be blue (#3b82f6) not green.
);
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#ef4444' \}\}>សរុប ❌<\/th>/,
  `<th style={{ padding: '0.5rem', textAlign: 'center', minWidth: '50px', color: '#ef4444' }}>សរុប ❌</th>`
);
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#f59e0b' \}\}>សរុប P<\/th>/,
  `<th style={{ padding: '0.5rem', textAlign: 'center', minWidth: '50px', color: '#f59e0b' }}>សរុប P</th>`
);


// 3. Modify TBODY cells to reduce padding and add light borders to day columns
content = content.replace(
  /<td style=\{\{ padding: '0\.75rem 1rem', position: 'sticky', left: 0, background: 'var\(--card-bg\)', zIndex: 5 \}\}>\{idx \+ 1\}<\/td>/,
  `<td style={{ padding: '0.35rem 0.75rem', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 5 }}>{idx + 1}</td>`
);
content = content.replace(
  /<td className="mobile-hide" style=\{\{ padding: '0\.75rem 1rem', position: 'sticky', left: '50px', background: 'var\(--card-bg\)', zIndex: 5 \}\}>\{student\.studentId \|\| ''\}<\/td>/,
  `<td className="mobile-hide" style={{ padding: '0.35rem 0.75rem', position: 'sticky', left: '50px', background: 'var(--card-bg)', zIndex: 5 }}>{student.studentId || ''}</td>`
);
content = content.replace(
  /<td className="sticky-name" style=\{\{ padding: '0\.75rem 1rem', fontWeight: 600, position: 'sticky', background: 'var\(--card-bg\)', zIndex: 5 \}\}>\{student\.fullName \|\| student\.name \|\| ''\}<\/td>/,
  `<td className="sticky-name" style={{ padding: '0.35rem 0.75rem', fontWeight: 600, position: 'sticky', background: 'var(--card-bg)', zIndex: 5 }}>{student.fullName || student.name || ''}</td>`
);
content = content.replace(
  /<td className="mobile-hide sticky-gender" style=\{\{ padding: '0\.75rem 1rem', position: 'sticky', background: 'var\(--card-bg\)', borderRight: '2px solid var\(--border-color\)', zIndex: 5 \}\}>\{student\.gender\}<\/td>/,
  `<td className="mobile-hide sticky-gender" style={{ padding: '0.35rem 0.75rem', position: 'sticky', background: 'var(--card-bg)', borderRight: '2px solid var(--border-color)', zIndex: 5 }}>{student.gender}</td>`
);

content = content.replace(
  /<td key=\{day\} style=\{\{ padding: '0\.25rem', textAlign: 'center' \}\}>/g,
  `<td key={day} style={{ padding: '0.15rem', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.05)', borderRight: '1px solid rgba(0,0,0,0.05)' }}>`
);

content = content.replace(
  /<td style=\{\{ padding: '0\.75rem', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' \}\}>/g,
  `<td style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>`
);
content = content.replace(
  /<td style=\{\{ padding: '0\.75rem', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' \}\}>/g,
  `<td style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>`
);
content = content.replace(
  /<td style=\{\{ padding: '0\.75rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' \}\}>/g,
  `<td style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>`
);


// 4. Update the button styling inside the day td
const buttonStyleRegex = /width: '32px',\s*height: '32px',\s*padding: 0,\s*border: 'none',\s*borderRadius: '8px',\s*background: bgColor,\s*color: color,\s*fontWeight: 'bold',\s*fontSize: '1rem',\s*cursor: 'pointer',\s*display: 'flex',\s*alignItems: 'center',\s*justifyContent: 'center',\s*margin: '0 auto',\s*transition: 'all 0\.2s'/;

const newButtonStyle = `width: '28px', 
                              height: '28px',
                              padding: 0, 
                              border: 'none', 
                              borderRadius: '6px',
                              background: bgColor,
                              color: color,
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              transition: 'all 0.2s'`;

content = content.replace(buttonStyleRegex, newButtonStyle);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 24 applied!');
