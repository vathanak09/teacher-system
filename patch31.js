const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix markAllPresent
const oldMarkAll = `    classStudents.forEach(student => {
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

const newMarkAll = `    classStudents.forEach(student => {
      newRecords[student.id] = { ...(newRecords[student.id] || {}) };
      const newValue = allPresent ? '' : 'present';
      if (newRecords[student.id][day] !== newValue) {
        newRecords[student.id][day] = newValue;
        changed = true;
      }
    });`;

content = content.replace(oldMarkAll, newMarkAll);

// Fix handleAttendanceChange
const oldHandleChange = `    const newRecords = { ...attendanceRecords };
    if (!newRecords[studentId]) newRecords[studentId] = {};
    
    if (value === '') {
      delete newRecords[studentId][day];
    } else {
      newRecords[studentId][day] = value;
    }`;

const newHandleChange = `    const newRecords = { ...attendanceRecords };
    newRecords[studentId] = { ...(newRecords[studentId] || {}) };
    
    // Always set the value (even if '') so Firebase merge:true will properly overwrite it
    newRecords[studentId][day] = value;`;

content = content.replace(oldHandleChange, newHandleChange);

// Fix sorting logic in SortDropdown handling to make sure numbers sort well
const oldSort = `      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;`;

const newSort = `      // Handle numeric sorting specifically for counts
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;`;
content = content.replace(oldSort, newSort);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 31 applied!');
