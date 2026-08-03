const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'attendance', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject responsive CSS styles at the beginning of the return statement of renderAttendanceTable
const renderAttendanceTableRegex = /return \(\s*<div className="animate-fade-in" style=\{\{ display: 'flex', flexDirection: 'column', gap: '1\.5rem' \}\}>/;

const responsiveStyles = `
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <style dangerouslySetInnerHTML={{__html: \`
          .mobile-hide { display: table-cell; }
          .sticky-name { left: 130px; }
          .sticky-gender { left: 280px; }
          @media (max-width: 768px) {
            .mobile-hide { display: none !important; }
            .sticky-name { left: 50px !important; }
            .sticky-gender { left: 200px !important; }
          }
        \`}} />
`;
content = content.replace(renderAttendanceTableRegex, responsiveStyles.trim());

// 2. Add summary headers to the table
const theadRegex = /\{daysArray\.map\(day => \(\s*<th key=\{day\}[^>]+>\{day\}<\/th>\s*\)\)\}\s*<\/tr>/;
const newThead = `{daysArray.map(day => (
                  <th key={day} style={{ padding: '1rem 0.25rem', textAlign: 'center', minWidth: '40px', fontSize: '0.85rem' }}>{day}</th>
                ))}
                <th style={{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#10b981' }}>សរុប ✔️</th>
                <th style={{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#ef4444' }}>សរុប ❌</th>
                <th style={{ padding: '1rem', textAlign: 'center', minWidth: '60px', color: '#f59e0b' }}>សរុប P</th>
              </tr>`;
content = content.replace(theadRegex, newThead);

// 3. Update table columns with classes for sticky behavior
// Headers
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '80px', position: 'sticky', left: '50px', background: 'var\(--bg-secondary\)', zIndex: 10 \}\}>អត្តលេខ<\/th>/,
  `<th className="mobile-hide" style={{ padding: '1rem', textAlign: 'left', minWidth: '80px', position: 'sticky', left: '50px', background: 'var(--bg-secondary)', zIndex: 10 }}>អត្តលេខ</th>`
);
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '150px', position: 'sticky', left: '130px', background: 'var\(--bg-secondary\)', zIndex: 10 \}\}>ឈ្មោះសិស្ស<\/th>/,
  `<th className="sticky-name" style={{ padding: '1rem', textAlign: 'left', minWidth: '150px', position: 'sticky', background: 'var(--bg-secondary)', zIndex: 10 }}>ឈ្មោះសិស្ស</th>`
);
content = content.replace(
  /<th style=\{\{ padding: '1rem', textAlign: 'left', minWidth: '60px', position: 'sticky', left: '280px', background: 'var\(--bg-secondary\)', borderRight: '2px solid var\(--border-color\)', zIndex: 10 \}\}>ភេទ<\/th>/,
  `<th className="mobile-hide sticky-gender" style={{ padding: '1rem', textAlign: 'left', minWidth: '60px', position: 'sticky', background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-color)', zIndex: 10 }}>ភេទ</th>`
);

// Body Columns and button logic and summary cells
const tbodyLoopRegex = /\{classStudents\.map\(\(student, idx\) => \([\s\S]*?<\/tr>\s*\)\)}/;

const newTbodyLoop = `{classStudents.map((student, idx) => {
                let presentCount = 0;
                let absentCount = 0;
                let permissionCount = 0;
                
                daysArray.forEach(day => {
                  const status = attendanceRecords[student.id]?.[day];
                  if (status === 'present') presentCount++;
                  else if (status === 'absent') absentCount++;
                  else if (status === 'permission') permissionCount++;
                });

                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-black/5">
                    <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 5 }}>{idx + 1}</td>
                    <td className="mobile-hide" style={{ padding: '0.75rem 1rem', position: 'sticky', left: '50px', background: 'var(--card-bg)', zIndex: 5 }}>{student.studentId || ''}</td>
                    <td className="sticky-name" style={{ padding: '0.75rem 1rem', fontWeight: 600, position: 'sticky', background: 'var(--card-bg)', zIndex: 5 }}>{student.fullName || student.name || ''}</td>
                    <td className="mobile-hide sticky-gender" style={{ padding: '0.75rem 1rem', position: 'sticky', background: 'var(--card-bg)', borderRight: '2px solid var(--border-color)', zIndex: 5 }}>{student.gender}</td>
                    {daysArray.map(day => {
                      const status = attendanceRecords[student.id]?.[day] || '';
                      let bgColor = 'var(--bg-secondary)';
                      let color = 'inherit';
                      let icon = '';
                      
                      if (status === 'present') { bgColor = 'rgba(16, 185, 129, 0.15)'; color = '#3b82f6'; icon = '✔️'; } // User requested checkmark is blue
                      else if (status === 'absent') { bgColor = 'rgba(239, 68, 68, 0.15)'; color = '#ef4444'; icon = '❌'; }
                      else if (status === 'permission') { bgColor = 'rgba(245, 158, 11, 0.15)'; color = '#f59e0b'; icon = 'P'; }

                      const cycleStatus = () => {
                        let next = '';
                        if (!status) next = 'present';
                        else if (status === 'present') next = 'absent';
                        else if (status === 'absent') next = 'permission';
                        else if (status === 'permission') next = '';
                        handleAttendanceChange(student.id, day, next);
                      };

                      return (
                        <td key={day} style={{ padding: '0.25rem', textAlign: 'center' }}>
                          <button 
                            onClick={cycleStatus}
                            style={{ 
                              width: '32px', 
                              height: '32px',
                              padding: 0, 
                              border: 'none', 
                              borderRadius: '8px',
                              background: bgColor,
                              color: color,
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              transition: 'all 0.2s'
                            }}
                          >
                            {icon}
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>{presentCount > 0 ? presentCount : ''}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{absentCount > 0 ? absentCount : ''}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>{permissionCount > 0 ? permissionCount : ''}</td>
                  </tr>
                );
              })}`;

content = content.replace(tbodyLoopRegex, newTbodyLoop);

// Also need to fix colspan in the "No students" row
content = content.replace(/colSpan=\{4 \+ days\}/, 'colSpan={7 + days}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 23 applied!');
