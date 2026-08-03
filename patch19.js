const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert 80% tracker useEffect after selectedClass is defined
const targetSelectedClass = `const selectedClass = classes.find(c => c.id === selectedClassId);`;
const trackerEffect = `
  useEffect(() => {
    if (selectedClassId && scores.length > 0 && selectedClass) {
      const timer = setTimeout(async () => {
        const totalStudents = scores.length;
        const studentsWithScore = scores.filter(s => s.totalScore && s.totalScore !== '').length;
        const completionRate = studentsWithScore / totalStudents;
        const isCompleted = completionRate >= 0.8;
        
        let currentCompletedMonths = selectedClass.completedMonths || [];
        const hasMonth = currentCompletedMonths.includes(selectedMonth);
        
        if (isCompleted && !hasMonth) {
          await classService.update(selectedClassId, { completedMonths: [...currentCompletedMonths, selectedMonth] });
        } else if (!isCompleted && hasMonth) {
          const newCompleted = currentCompletedMonths.filter((m: string) => m !== selectedMonth);
          await classService.update(selectedClassId, { completedMonths: newCompleted });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scores, selectedClassId, selectedClass, selectedMonth]);
`;
content = content.replace(targetSelectedClass, targetSelectedClass + '\n' + trackerEffect);

// 2. Add Month Selector to the top of Class List View
const oldHeader = `<div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          
        </div>`;
const newHeader = `<div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
        </div>`;
content = content.replace(oldHeader, newHeader);

// 3. Update Class Card rendering
const oldCardRegex = /<div style={{ background: 'linear-gradient[\s\S]*?<span style={{ fontSize: '0.95rem', color: 'var\(--accent-primary\)', fontWeight: 500, marginTop: '0.5rem' }}>ចូលបញ្ចូលពិន្ទុ \&rarr;<\/span>\s*<\/div>/;
const newCard = `const isCompleted = (c.completedMonths || []).includes(selectedMonth);

            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ background: c.color || 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-md)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
                  {c.icon || '📚'}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.className}</h3>
                
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  សរុប <b>{total}</b> &nbsp;&nbsp; ស្រី <b>{female}</b> / ប្រុស <b>{male}</b>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem', color: isCompleted ? '#3b82f6' : '#ef4444' }}>
                  {isCompleted ? 'បញ្ចូលរួចរាល់✔' : 'មិនទាន់បញ្ចូលx'}
                </div>
              </div>`;
content = content.replace(/return \([\s\S]*?<\/svg>\s*<\/div>[\s\S]*?<\/div>\s*\);\s*\}/, newCard + '\n            );');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 19 applied!');
