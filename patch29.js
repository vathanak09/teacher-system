const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add unlockedDay state and change sort default
content = content.replace(
  /const \[sortConfig, setSortConfig\] = useState\(\{ key: 'studentId', direction: 'asc' \}\);/,
  `const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' });\n  const [unlockedDay, setUnlockedDay] = useState(currentDate.getDate());`
);

// 2. Add Unlock Day UI controls
const controlsRegex = /<div style=\{\{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' \}\}>/;
const newControls = `<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setUnlockedDay(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
              >-</button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unlock</span>
                <input 
                  type="number" 
                  value={unlockedDay}
                  onChange={e => setUnlockedDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                  style={{ width: '40px', background: 'transparent', border: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-color)', outline: 'none' }}
                />
              </div>
              <button 
                onClick={() => setUnlockedDay(prev => Math.min(31, prev + 1))}
                style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
              >+</button>
            </div>
`;
content = content.replace(controlsRegex, newControls);

// 3. Update SortDropdown options
const sortOptionsRegex = /<SortDropdown\s+options=\{\[\s*\{\s*value:\s*'studentId',\s*label:\s*'អត្តលេខ'\s*\},\s*\{\s*value:\s*'fullName',\s*label:\s*'ឈ្មោះសិស្ស'\s*\},\s*\{\s*value:\s*'gender',\s*label:\s*'ភេទ'\s*\}\s*\]\}/;
const newSortOptions = `<SortDropdown 
              options={[
                { value: 'studentId', label: 'អត្តលេខ' },
                { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
                { value: 'gender', label: 'ភេទ' },
                { value: 'presentCount', label: 'សរុប ✔️' },
                { value: 'absentCount', label: 'សរុប ❌' },
                { value: 'permissionCount', label: 'សរុប P' }
              ]}`;
content = content.replace(sortOptionsRegex, newSortOptions);


// 4. Pre-calculate totals and update sort logic
// First, find getDaysInMonth usage to ensure we calculate days correctly for the pre-calculation.
// Inside renderAttendanceTable:
const oldClassStudentsLogic = `let classStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);
    
    classStudents = [...classStudents].sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      // Special handle for name variations
      if (sortConfig.key === 'fullName') {
        aVal = a.fullName || a.name || '';
        bVal = b.fullName || b.name || '';
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    const days = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);`;

const newClassStudentsLogic = `const days = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    let baseClassStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);
    
    // Pre-calculate attendance totals for sorting
    let classStudents = baseClassStudents.map(student => {
      let presentCount = 0;
      let absentCount = 0;
      let permissionCount = 0;
      daysArray.forEach(day => {
        const status = attendanceRecords[student.id]?.[day];
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'permission') permissionCount++;
      });
      return { ...student, presentCount, absentCount, permissionCount };
    });
    
    classStudents = [...classStudents].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'fullName') {
        aVal = a.fullName || a.name || '';
        bVal = b.fullName || b.name || '';
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });`;

content = content.replace(oldClassStudentsLogic, newClassStudentsLogic);

// Remove the inside mapping calculations since they are already in the array
const oldTbodyLoopHead = `let presentCount = 0;
                let absentCount = 0;
                let permissionCount = 0;
                
                daysArray.forEach(day => {
                  const status = attendanceRecords[student.id]?.[day];
                  if (status === 'present') presentCount++;
                  else if (status === 'absent') absentCount++;
                  else if (status === 'permission') permissionCount++;
                });`;

content = content.replace(oldTbodyLoopHead, `const { presentCount, absentCount, permissionCount } = student;`);


// 5. Lock logic for Header (markAllPresent)
content = content.replace(
  /const markAllPresent = async \(day: number\) => \{/,
  `const markAllPresent = async (day: number) => {\n    if (day !== unlockedDay) return;`
);
content = content.replace(
  /<th key=\{day\} onClick=\{[^}]+\} title="[^"]+" style=\{\{ ([^}]+) \}\} className="hover:bg-blue-50 transition-colors">\{day\}<\/th>/g,
  (match, style) => {
    // Inject dynamic lock style
    return `<th key={day} onClick={() => markAllPresent(day)} title={day === unlockedDay ? "ចុចដើម្បីដាក់/ដកវត្តមានសិស្សទាំងអស់" : "ថ្ងៃត្រូវបានចាក់សោរ"} style={{ ${style}, cursor: day === unlockedDay ? 'pointer' : 'not-allowed', opacity: day === unlockedDay ? 1 : 0.6 }} className={day === unlockedDay ? "hover:bg-blue-50 transition-colors" : ""}>{day}</th>`;
  }
);

// 6. Lock logic for Cells (cycleStatus)
content = content.replace(
  /const cycleStatus = \(\) => \{/,
  `const cycleStatus = () => {\n                        if (day !== unlockedDay) return;`
);

content = content.replace(
  /cursor: 'pointer',/g,
  `cursor: day === unlockedDay ? 'pointer' : 'not-allowed',\n                              opacity: day === unlockedDay ? 1 : 0.6,`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 29 applied!');
