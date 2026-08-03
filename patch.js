const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Persistence
content = content.replace(
  /const \[scoreSortConfig, setScoreSortConfig\] = useState<\{ key: string; direction: 'asc' \| 'desc' \} \| null>\(null\);\s*\/\/\s*Format:\s*YYYY-MM\s*const currentMonthStr = new Date\(\)\.toISOString\(\)\.slice\(0, 7\);\s*const \[selectedMonth, setSelectedMonth\] = useState\(currentMonthStr\);/,
  `const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scoreSortConfig');
      if (saved) return JSON.parse(saved);
    }
    return { key: 'fullName', direction: 'asc' };
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedScoreMonth');
      if (saved) return saved;
    }
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  useEffect(() => {
    if (scoreSortConfig) localStorage.setItem('scoreSortConfig', JSON.stringify(scoreSortConfig));
  }, [scoreSortConfig]);

  useEffect(() => {
    if (selectedMonth) localStorage.setItem('selectedScoreMonth', selectedMonth);
  }, [selectedMonth]);`
);

// 2. Import CSV Logic
content = content.replace(
  /const \[isClearDropdownOpen, setIsClearDropdownOpen\] = useState\(false\);\s*const clearDropdownRef = useRef<HTMLDivElement>\(null\);/,
  `const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);
  const clearDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const parseCSVLine = (str: string) => {
        let ret = [], keep = false, col = "";
        for(let i=0; i<str.length; i++) {
          if(str[i] === '"') keep = !keep;
          else if(str[i] === ',' && !keep) { ret.push(col.trim()); col = ""; }
          else col += str[i];
        }
        ret.push(col.trim());
        return ret;
      };

      const rows = text.split('\\n').map(parseCSVLine);
      if (rows.length < 2) return;

      const headers = rows[0];
      const idIndex = headers.findIndex(h => h.includes('អត្តលេខ'));
      const quizIndex = headers.findIndex(h => h.toLowerCase().includes('quiz'));
      const exerciseIndex = headers.findIndex(h => h.toLowerCase().includes('exercise'));
      const speakingIndex = headers.findIndex(h => h.toLowerCase().includes('speaking'));
      const homeworkIndex = headers.findIndex(h => h.toLowerCase().includes('homework'));
      const testIndex = headers.findIndex(h => h.toLowerCase().includes('test'));

      if (idIndex === -1) {
        alert('រកមិនឃើញជួរឈរ អត្តលេខ នៅក្នុងឯកសារ Excel ទេ!');
        return;
      }

      let updatedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;

        const studentId = row[idIndex];
        if (!studentId) continue;

        const existingScore = scores.find(s => s.studentIdCode === studentId);
        if (existingScore) {
          const updatedScore = { ...existingScore };
          if (quizIndex !== -1 && row[quizIndex] !== undefined) updatedScore.quiz = row[quizIndex];
          if (exerciseIndex !== -1 && row[exerciseIndex] !== undefined) updatedScore.exercise = row[exerciseIndex];
          if (speakingIndex !== -1 && row[speakingIndex] !== undefined) updatedScore.speaking = row[speakingIndex];
          if (homeworkIndex !== -1 && row[homeworkIndex] !== undefined) updatedScore.homework = row[homeworkIndex];
          if (testIndex !== -1 && row[testIndex] !== undefined) updatedScore.test = row[testIndex];
          
          await scoreService.updateScore(updatedScore.id, updatedScore);
          updatedCount++;
        }
      }
      
      alert(\`បានបញ្ចូលពិន្ទុជោគជ័យចំនួន \${updatedCount} នាក់!\`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };`
);

// 3. Import Button UI
content = content.replace(
  /<button onClick=\{exportToCSV\} style=\{\{ padding: '0\.5rem 1rem'/g,
  `<button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            បញ្ចូល (Import)
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />

          <button onClick={exportToCSV} style={{ padding: '0.5rem 1rem'`
);

// 4. Dynamic Lookup
content = content.replace(
  /return sortedScores\.map\(\(scoreRec, index\) => \{\s*return \(/,
  `return sortedScores.map((scoreRec, index) => {
                const studentMaster = allStudents.find(s => s.studentIdCode === scoreRec.studentIdCode);
                const displayFullName = studentMaster ? studentMaster.fullName : scoreRec.fullName;
                const displayGender = studentMaster ? studentMaster.gender : scoreRec.gender;
                return (`
);

content = content.replace(
  /\{scoreRec\.fullName\}/,
  `{displayFullName}`
);
content = content.replace(
  /scoreRec\.gender === 'ស្រី' \? '#ec4899' : 'var\(--text-primary\)'/,
  `displayGender === 'ស្រី' ? '#ec4899' : 'var(--text-primary)'`
);
content = content.replace(
  /\{scoreRec\.gender\}/,
  `{displayGender}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch applied successfully!');
