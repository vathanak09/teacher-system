const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, useRef } from 'react';\nimport { createPortal } from 'react-dom';"
);

// 2. Add states around line ~50 (inside Classes function)
const stateToAdd = `
  const [isAddStudentVisible, setIsAddStudentVisible] = useState(false);
  const [classSortConfig, setClassSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [classVisibleColumns, setClassVisibleColumns] = useState<string[]>(['photo', 'studentId', 'fullName', 'gender', 'level', 'shift']);
  const [isClassColumnDropdownOpen, setIsClassColumnDropdownOpen] = useState(false);
  const classColumnDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classColumnDropdownRef.current && !classColumnDropdownRef.current.contains(event.target as Node)) {
        setIsClassColumnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFirstLetter = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0);
  };
`;
content = content.replace("const [activeTab, setActiveTab] = useState('students');", "const [activeTab, setActiveTab] = useState('students');\n" + stateToAdd);

// 3. Replace the Search Section and Table Section
const parts = content.split('{/* Search & Add Students */}');
if (parts.length < 2) {
  console.log("Could not find Search & Add Students");
  process.exit(1);
}

const tableParts = parts[1].split("{/* Enrolled Students Table */}");
const afterTableParts = tableParts[1].split(/<\/table>\s*<\/div>\s*<\/div>/);

const searchBlockOriginal = tableParts[0]; // between Search & Add and Enrolled Students Table
const tableBlockOriginal = tableParts[1]; // after Enrolled Students Table

// The search block has:
// <div style={{ marginBottom: '2rem', position: 'relative' }}>
// Let's replace the outer div of searchBlock to conditionally show it
const newSearchBlock = `{/* Search & Add Students (Toggled) */}
                {isAddStudentVisible && (
                  <div style={{ marginBottom: '2rem', position: 'relative', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>បន្ថែមសិស្សចូលថ្នាក់</label>
                      <button onClick={() => setIsAddStudentVisible(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input 
                        type="text" 
                        placeholder="វាយឈ្មោះ ឬអត្តលេខសិស្ស ដើម្បីស្វែងរក..." 
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid var(--primary-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {studentSearch.trim() !== '' && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
                        {searchResults.length > 0 ? (
                          searchResults.map(s => (
                            <div key={s.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="table-row-hover">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {s.photo && String(s.photo).trim() !== '' ? <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                                </div>
                                <div>
                                  <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{s.fullName} ({s.studentId})</p>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.gender} • {s.dob}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => { handleAddStudentToClass(s.id); setStudentSearch(''); }}
                                style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                + បញ្ចូល
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            រកមិនឃើញសិស្សឈ្មោះនេះទេ (ឬសិស្សនេះមានក្នុងថ្នាក់រួចហើយ)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}\n`;

const newTableBlock = `
                {/* Advanced Student List Table Controls */}
                {(() => {
                  const maleCount = enrolledStudents.filter((s: any) => s.gender === 'ប្រុស').length;
                  const femaleCount = enrolledStudents.filter((s: any) => s.gender === 'ស្រី').length;
                  
                  const sortedEnrolledStudents = [...enrolledStudents].sort((a: any, b: any) => {
                    if (!classSortConfig) return 0;
                    const { key, direction } = classSortConfig;
                    let aVal = a[key] || '';
                    let bVal = b[key] || '';
                    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                    return 0;
                  });

                  const handleClassSort = (key: string) => {
                    let direction: 'asc' | 'desc' = 'asc';
                    if (classSortConfig && classSortConfig.key === key && classSortConfig.direction === 'asc') {
                      direction = 'desc';
                    }
                    setClassSortConfig({ key, direction });
                  };

                  const toggleClassColumn = (colId: string) => {
                    if (classVisibleColumns.includes(colId)) {
                      setClassVisibleColumns(classVisibleColumns.filter(c => c !== colId));
                    } else {
                      setClassVisibleColumns([...classVisibleColumns, colId]);
                    }
                  };

                  const setSummaryView = () => setClassVisibleColumns(['photo', 'fullName', 'gender', 'level']);
                  const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'nextPaymentDate', 'paymentStatus', 'status', 'dob', 'address', 'location', 'transport', 'contact', 'father', 'mother', 'phoneNum']);

                  const handleDownloadClassCSV = () => {
                    const headers = ['ល.រ', ...classVisibleColumns.map(col => {
                      const titles: any = {
                        studentId: 'អត្តលេខ', fullName: 'ឈ្មោះ', englishName: 'ឈ្មោះអង់គ្លេស', gender: 'ភេទ', level: 'កម្រិត',
                        shift: 'វេន', enrollDate: 'ថ្ងៃចូលរៀន', nextPaymentDate: 'ថ្ងៃបង់បន្ទាប់', paymentStatus: 'ស្ថានភាពបង់ប្រាក់',
                        status: 'ស្ថានភាព', dob: 'ថ្ងៃខែឆ្នាំកំណើត', address: 'អាសយដ្ឋាន', location: 'ទីតាំង', transport: 'មធ្យោបាយ',
                        contact: 'ទំនាក់ទំនង', father: 'ឈ្មោះឪពុក', mother: 'ឈ្មោះម្តាយ', phoneNum: 'លេខទូរស័ព្ទ'
                      };
                      return titles[col] || col;
                    }).filter(h => h !== 'photo')];

                    const rows = sortedEnrolledStudents.map((s: any, idx: number) => {
                      const rowData = [idx + 1];
                      classVisibleColumns.forEach(col => {
                        if (col === 'photo') return;
                        rowData.push('"' + (s[col] || '') + '"');
                      });
                      return rowData.join(',');
                    });

                    const csvContent = "data:text/csv;charset=utf-8,\\uFEFF" + headers.join(',') + '\\n' + rows.join('\\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", \`\${viewingClass?.className || 'class'}_students.csv\`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  };

                  return (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>បញ្ជីសិស្សក្នុងថ្នាក់</h3>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>សរុប {enrolledStudents.length} នាក់</span>
                            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ស្រី {femaleCount} នាក់</span>
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ប្រុស {maleCount} នាក់</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Add Button */}
                          <button 
                            onClick={() => setIsAddStudentVisible(!isAddStudentVisible)}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                            title="បន្ថែមសិស្ស"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          </button>

                          {/* Sort Button */}
                          <button 
                            onClick={() => handleClassSort(classSortConfig?.key === 'fullName' ? 'gender' : classSortConfig?.key === 'gender' ? 'shift' : 'fullName')}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                            តម្រៀប
                          </button>

                          {/* Columns Dropdown */}
                          <div style={{ position: 'relative' }} ref={classColumnDropdownRef}>
                            <button 
                              onClick={() => setIsClassColumnDropdownOpen(!isClassColumnDropdownOpen)}
                              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                              ជួរឈរ
                            </button>
                            {isClassColumnDropdownOpen && (
                              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 30, minWidth: '220px', padding: '0.5rem' }}>
                                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                  <button onClick={setSummaryView} style={{ width: '100%', padding: '0.5rem', textAlign: 'left', background: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '0.25rem' }}>ទិដ្ឋភាពសង្ខេប</button>
                                  <button onClick={setFullView} style={{ width: '100%', padding: '0.5rem', textAlign: 'left', background: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>បង្ហាញទាំងអស់</button>
                                </div>
                                <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
                                  {[
                                    { id: 'photo', label: 'រូបថត' },
                                    { id: 'studentId', label: 'អត្តលេខ' },
                                    { id: 'fullName', label: 'ឈ្មោះពេញ' },
                                    { id: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
                                    { id: 'gender', label: 'ភេទ' },
                                    { id: 'level', label: 'កម្រិតសិក្សា' },
                                    { id: 'shift', label: 'វេន' },
                                    { id: 'enrollDate', label: 'ថ្ងៃចូលរៀន' },
                                    { id: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
                                  ].map(col => (
                                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem', cursor: 'pointer', gap: '0.5rem' }}>
                                      <input type="checkbox" checked={classVisibleColumns.includes(col.id)} onChange={() => toggleClassColumn(col.id)} />
                                      {col.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Download CSV */}
                          <button 
                            onClick={handleDownloadClassCSV}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ទាញយក CSV
                          </button>
                        </div>
                      </div>
                      
                      {/* Enrolled Students Table */}
                      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div className="table-responsive">
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ល.រ</th>
                                {classVisibleColumns.includes('photo') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>}
                                {classVisibleColumns.includes('studentId') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>}
                                {classVisibleColumns.includes('fullName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះ</th>}
                                {classVisibleColumns.includes('englishName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះអង់គ្លេស</th>}
                                {classVisibleColumns.includes('gender') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>}
                                {classVisibleColumns.includes('level') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>កម្រិត</th>}
                                {classVisibleColumns.includes('shift') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>វេន</th>}
                                {classVisibleColumns.includes('enrollDate') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្ងៃចូលរៀន</th>}
                                {classVisibleColumns.includes('phoneNum') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>}
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedEnrolledStudents.map((s: any, index: number) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{index + 1}</td>
                                  
                                  {classVisibleColumns.includes('photo') && (
                                    <td style={{ padding: '1rem', position: 'relative' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                                        {s.photo && String(s.photo).trim() !== '' ? <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: s.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{getFirstLetter(s.fullName)}</div>}
                                      </div>
                                      
                                      {/* Centered Hover Profile Popup */}
                                      {hoveredStudent === s.id && typeof window !== 'undefined' && createPortal(
                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>
                                          <div style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backdropFilter: 'blur(10px)' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)} onClick={e => e.stopPropagation()}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                                              {s.photo && String(s.photo).trim() !== '' ? (
                                                <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                                              ) : (
                                                <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: s.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{getFirstLetter(s.fullName)}</div>
                                              )}
                                              <div style={{ flex: 1 }}>
                                                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{s.fullName}</h2>
                                                <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.englishName || 'គ្មានឈ្មោះអង់គ្លេស'}</p>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                  <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700 }}>ID: {s.studentId}</span>
                                                  <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>កំពុងសិក្សា</span>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Details */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                              <div style={{ background: 'rgba(139, 92, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                                <h4 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>ព័ត៌មានសិក្សា</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្នាក់៖</span> <strong style={{ color: 'var(--text-primary)' }}>{viewingClass?.className || 'N/A'}</strong></div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>កម្រិត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.level || 'N/A'}</strong></div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>វេន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.shift || 'N/A'}</strong></div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.enrollDate || 'N/A'}</strong></div>
                                                </div>
                                              </div>
                                              <div style={{ background: 'rgba(236, 72, 153, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                                                <h4 style={{ margin: '0 0 1rem 0', color: '#ec4899', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>ជីវប្រវត្តិ & ទំនាក់ទំនង</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ភេទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.gender || 'N/A'}</strong></div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃកំណើត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.dob || 'N/A'}</strong></div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.phoneNum || 'N/A'}</strong></div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>,
                                        document.body
                                      )}
                                    </td>
                                  )}
                                  
                                  {classVisibleColumns.includes('studentId') && <td style={{ padding: '1rem', fontWeight: '500' }}>{s.studentId}</td>}
                                  {classVisibleColumns.includes('fullName') && <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{s.fullName}</td>}
                                  {classVisibleColumns.includes('englishName') && <td style={{ padding: '1rem' }}>{s.englishName}</td>}
                                  {classVisibleColumns.includes('gender') && <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.gender}</td>}
                                  {classVisibleColumns.includes('level') && <td style={{ padding: '1rem' }}>{s.level}</td>}
                                  {classVisibleColumns.includes('shift') && <td style={{ padding: '1rem' }}>{s.shift}</td>}
                                  {classVisibleColumns.includes('enrollDate') && <td style={{ padding: '1rem' }}>{s.enrollDate}</td>}
                                  {classVisibleColumns.includes('phoneNum') && <td style={{ padding: '1rem' }}>{s.phoneNum}</td>}

                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                      <button onClick={() => { setEditStudentData(s); setIsEditStudentModalOpen(true); }} style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="កែប្រែ">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                      </button>
                                      <button onClick={() => handleRemoveStudentFromClass(s.id)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="ដកចេញ">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {sortedEnrolledStudents.length === 0 && (
                                <tr>
                                  <td colSpan={classVisibleColumns.length + 2} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                      <p>មិនទាន់មានសិស្សក្នុងថ្នាក់នេះទេ</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}`;

const finalContent = parts[0] + newSearchBlock + newTableBlock + afterTableParts[1];

fs.writeFileSync(file, finalContent, 'utf8');
console.log('Modified class page properly.');
