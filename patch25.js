const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
if (!content.includes("import SortDropdown")) {
  content = content.replace(
    /import \{ classService, teacherService, studentService, attendanceService \} from '@\/services\/db';/,
    `import { classService, teacherService, studentService, attendanceService } from '@/services/db';\nimport SortDropdown from '@/components/SortDropdown';`
  );
}

// 2. Add sortConfig state
if (!content.includes("const [sortConfig")) {
  content = content.replace(
    /const \[attendanceRecords, setAttendanceRecords\] = useState[^;]+;/,
    `const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<number, string>>>({});\n  const [sortConfig, setSortConfig] = useState({ key: 'studentId', direction: 'asc' });`
  );
}

// 3. Update markAllPresent logic to toggle
const oldMarkLogic = `    classStudents.forEach(student => {
      if (!newRecords[student.id]) newRecords[student.id] = {};
      // If it's not already present, mark it as present
      if (newRecords[student.id][day] !== 'present') {
        newRecords[student.id][day] = 'present';
        changed = true;
      }
    });`;

const newMarkLogic = `    const allPresent = classStudents.every(s => attendanceRecords[s.id]?.[day] === 'present');
    classStudents.forEach(student => {
      if (!newRecords[student.id]) newRecords[student.id] = {};
      const newValue = allPresent ? '' : 'present';
      if (newRecords[student.id][day] !== newValue) {
        if (newValue === '') {
          delete newRecords[student.id][day];
        } else {
          newRecords[student.id][day] = newValue;
        }
        changed = true;
      }
    });`;
content = content.replace(oldMarkLogic, newMarkLogic);

// 4. Sort students
const oldClassStudents = `const classStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);`;
const newClassStudents = `let classStudents = students.filter(s => classStudentIds.includes(s.id) || s.className === selectedClass.className);
    
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
    });`;
content = content.replace(oldClassStudents, newClassStudents);

// 5. Add SortDropdown to UI
const controlsRegex = /<div style=\{\{ display: 'flex', gap: '1rem', alignItems: 'center' \}\}>/;
const newControls = `<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <SortDropdown 
              options={[
                { value: 'studentId', label: 'អត្តលេខ' },
                { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
                { value: 'gender', label: 'ភេទ' }
              ]}
              currentSort={sortConfig}
              onSortChange={setSortConfig}
            />`;
content = content.replace(controlsRegex, newControls);

// 6. Highlight Weekends - Header
const headerMapRegex = /\{daysArray\.map\(day => \(\s*<th key=\{day\}[^>]*>\{day\}<\/th>\s*\)\)\}/;
const newHeaderMap = `{daysArray.map(day => {
                  const date = new Date(selectedYear, selectedMonth - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th key={day} onClick={() => markAllPresent(day)} title="ចុចដើម្បីដាក់/ដកវត្តមានសិស្សទាំងអស់" style={{ padding: '0.5rem 0.25rem', textAlign: 'center', minWidth: '38px', fontSize: '0.85rem', cursor: 'pointer', borderLeft: '1px solid rgba(0,0,0,0.05)', borderRight: '1px solid rgba(0,0,0,0.05)', background: isWeekend ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)', color: isWeekend ? '#ef4444' : 'inherit' }} className="hover:bg-blue-50 transition-colors">{day}</th>
                  );
                })}`;
content = content.replace(headerMapRegex, newHeaderMap);

// 7. Highlight Weekends - Body
const bodyMapRegex = /\{daysArray\.map\(day => \{\s*const status = attendanceRecords\[student\.id\]\?\.\[day\] \|\| '';\s*let bgColor = 'var\(--bg-secondary\)';/;
const newBodyMap = `{daysArray.map(day => {
                      const date = new Date(selectedYear, selectedMonth - 1, day);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      const status = attendanceRecords[student.id]?.[day] || '';
                      let bgColor = isWeekend ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)';`;
content = content.replace(bodyMapRegex, newBodyMap);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 25 applied!');
