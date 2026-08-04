const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const oldStates = `  const [scores, setScores] = useState<any[]>([]); // Snapshot score records for the selected month/class`;
const newStates = `  const [scores, setScores] = useState<any[]>([]); // Snapshot score records for the selected month/class
  const [allScores, setAllScores] = useState<any[]>([]); // Global scores for computing progress
  const [selectedClassIdsFilter, setSelectedClassIdsFilter] = useState<string[]>([]);
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [classSearchFilter, setClassSearchFilter] = useState('');
  const classFilterRef = useRef<HTMLDivElement>(null);`;

content = content.replace(oldStates, newStates);

// 2. Add click outside listener for classFilterRef
const oldClickOutside = `  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clearDropdownRef.current && !clearDropdownRef.current.contains(event.target as Node)) {
        setIsClearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;

const newClickOutside = `  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clearDropdownRef.current && !clearDropdownRef.current.contains(event.target as Node)) {
        setIsClearDropdownOpen(false);
      }
      if (classFilterRef.current && !classFilterRef.current.contains(event.target as Node)) {
        setIsClassFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;

content = content.replace(oldClickOutside, newClickOutside);

// 3. Add unsubAllScores to main useEffect
const oldMainUseEffect = `    const unsubStudents = studentService.subscribeAll((data: any[]) => {
      setAllStudents(data);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubStudents();
    };`;

const newMainUseEffect = `    const unsubStudents = studentService.subscribeAll((data: any[]) => {
      setAllStudents(data);
    });

    const unsubAllScores = scoreService.subscribeAll((data: any[]) => {
      setAllScores(data);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubStudents();
      unsubAllScores();
    };`;

content = content.replace(oldMainUseEffect, newMainUseEffect);

// 4. Add filteredDisplayClasses
const oldDisplayClasses = `  const displayClasses = role === 'admin' 
    ? classes 
    : classes.filter(c => c.teacherId === teacherProfileId || c.teacherId === userId || c.teacherName === userName);`;

const newDisplayClasses = `  const displayClasses = role === 'admin' 
    ? classes 
    : classes.filter(c => c.teacherId === teacherProfileId || c.teacherId === userId || c.teacherName === userName);

  const filteredDisplayClasses = displayClasses.filter(c => {
    if (selectedClassIdsFilter.length > 0) {
      return selectedClassIdsFilter.includes(c.id);
    }
    return true;
  });`;

content = content.replace(oldDisplayClasses, newDisplayClasses);

// 5. Replace !selectedClassId render section
const oldNoSelectedClassRender = `  if (!selectedClassId) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
            />
          </div>
        </div>
        
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។
        </p>

        <div className="grid-cards">
          {displayClasses.map(c => {
            // Count live students for this class
            const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((s: any) => s.id) : []);
            const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
            const total = classStudents.length;
            const female = classStudents.filter(s => s.gender === 'ស្រី').length;
            const male = total - female;
            
            const isCompleted = (c.completedMonths || []).includes(selectedMonth);

            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ 
                  background: \`\${COLORS.find(col => col.id === c.color)?.value || '#3b82f6'}15\`, 
                  color: COLORS.find(col => col.id === c.color)?.value || '#3b82f6', 
                  padding: '1.25rem', 
                  borderRadius: '20px', 
                  fontSize: '2.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '80px', 
                  height: '80px' 
                }}>
                  {ICONS.find(i => i.id === c.icon)?.icon || '📚'}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.className}</h3>
                
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  សរុប <b>{total}</b> &nbsp;&nbsp; ស្រី <b>{female}</b> / ប្រុស <b>{male}</b>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem', color: isCompleted ? '#3b82f6' : '#ef4444' }}>
                  {isCompleted ? 'បញ្ចូលរួចរាល់✔' : 'មិនទាន់បញ្ចូលx'}
                </div>
              </div>
            );
          })}
          {displayClasses.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>មិនមានថ្នាក់រៀនទេ</div>
          )}
        </div>`;

const newNoSelectedClassRender = `  if (!selectedClassId) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Dropdown to tick class names */}
            <div style={{ position: 'relative' }} ref={classFilterRef}>
              <button 
                onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
                className="btn"
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                <span>ជ្រើសរើសថ្នាក់ ({selectedClassIdsFilter.length > 0 ? selectedClassIdsFilter.length : displayClasses.length}/{displayClasses.length})</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isClassFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              {isClassFilterOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--modal-bg, var(--main-bg))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  width: '280px',
                  maxHeight: '380px',
                  zIndex: 100,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>តម្រងថ្នាក់រៀន</span>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setSelectedClassIdsFilter(displayClasses.map(c => c.id))}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                      >
                        ជ្រើសរើសទាំងអស់
                      </button>
                      <span style={{ color: 'var(--text-secondary)' }}>|</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedClassIdsFilter([])}
                        style={{ background: 'none', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                      >
                        បោះបង់
                      </button>
                    </div>
                  </div>

                  <input 
                    type="text" 
                    placeholder="ស្វែងរកឈ្មោះថ្នាក់..." 
                    value={classSearchFilter}
                    onChange={e => setClassSearchFilter(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  />

                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {displayClasses
                      .filter(c => (c.className || '').toLowerCase().includes(classSearchFilter.toLowerCase()))
                      .map(c => {
                        const isChecked = selectedClassIdsFilter.length === 0 || selectedClassIdsFilter.includes(c.id);
                        return (
                          <label 
                            key={c.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              padding: '0.4rem 0.5rem', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              background: isChecked ? 'var(--bg-secondary)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                let currentSelected = selectedClassIdsFilter.length === 0 ? displayClasses.map(dc => dc.id) : [...selectedClassIdsFilter];
                                if (e.target.checked) {
                                  if (!currentSelected.includes(c.id)) currentSelected.push(c.id);
                                } else {
                                  currentSelected = currentSelected.filter(id => id !== c.id);
                                }
                                setSelectedClassIdsFilter(currentSelected);
                              }}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: isChecked ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.className}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
              />
            </div>
          </div>
        </div>
        
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredDisplayClasses.map(c => {
            const IconComp = ICONS.find(i => i.id === c.icon)?.icon || ICONS[0].icon;
            const colorHex = COLORS.find(co => co.id === c.color)?.value || COLORS[0].value;
            
            // Count live students for this class
            const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((s: any) => s.id) : []);
            const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
            const totalStudents = classStudents.length;
            
            // Calculate score entry progress for selected month
            const classScores = allScores.filter((sc: any) => sc.classId === c.id && sc.month === selectedMonth);
            const scoredStudentsCount = classStudents.filter((st: any) => {
              const sc = classScores.find((sc: any) => sc.studentId === st.id);
              return sc && sc.totalScore !== undefined && sc.totalScore !== null && sc.totalScore !== '';
            }).length;
            
            const progressPercent = totalStudents > 0 ? Math.min(100, Math.round((scoredStudentsCount / totalStudents) * 100)) : 0;

            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedClassId(c.id)} 
                className="glass-panel glass-panel-hoverable animate-scale-in" 
                style={{ 
                  padding: '1.25rem', 
                  cursor: 'pointer', 
                  borderStyle: 'solid',
                  borderWidth: '2px 2px 2px 6px',
                  borderColor: \`transparent transparent transparent \${colorHex}\`,
                  transition: 'all 0.2s ease', 
                  position: 'relative', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: 'var(--card-bg)'
                }}
              >
                {/* Background Icon Watermark */}
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, transform: 'scale(4)', pointerEvents: 'none' }}>
                  {IconComp}
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: \`\${colorHex}15\`, color: colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {IconComp}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.className}</h3>
                        {c.classCode && <span style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>{c.classCode}</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{c.academicYear || '2026-2027'} • {c.shift || 'N/A'}</p>
                      {c.time && <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>ម៉ោង៖ {c.time}</p>}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.teacherName || 'មិនទាន់កំណត់'}</span>
                        <span style={{ margin: '0 0.2rem', color: 'var(--text-secondary)' }}>•</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>សិស្ស {totalStudents} នាក់</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Entry Progress Bar */}
                <div style={{ position: 'relative', zIndex: 1, paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <span>វឌ្ឍនភាពបញ្ចូលពិន្ទុ</span>
                    <span style={{ fontWeight: 700, color: progressPercent === 100 ? '#10b981' : colorHex }}>{progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${progressPercent}%\`, background: progressPercent === 100 ? '#10b981' : colorHex, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredDisplayClasses.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px', gridColumn: '1 / -1' }}>
              មិនមានថ្នាក់រៀនទេ
            </div>
          )}
        </div>`;

content = content.replace(oldNoSelectedClassRender, newNoSelectedClassRender);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ScoresPage cards and filter dropdown!');
