const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix handleClearColumn auto-calculate
const oldClearCol = `  const handleClearColumn = async (columnKey: string, columnName: string) => {
    if (!window.confirm(\`តើអ្នកពិតជាចង់លុបពិន្ទុ \${columnName} ទាំងអស់មែនទេ?\`)) return;
    setIsClearDropdownOpen(false);
    const updatedScores = scores.map(s => ({ ...s, [columnKey]: '' }));
    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.update(s.id, s)));
  };`;

const newClearCol = `  const handleClearColumn = async (columnKey: string, columnName: string) => {
    if (!window.confirm(\`តើអ្នកពិតជាចង់លុបពិន្ទុ \${columnName} ទាំងអស់មែនទេ?\`)) return;
    setIsClearDropdownOpen(false);
    
    const updatedScores = scores.map(s => {
      let currentRec = { ...s, [columnKey]: '' };
      const SCORE_FIELDS = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
      let total = 0;
      let hasAnyValue = false;
      SCORE_FIELDS.forEach(sub => {
        const val = currentRec[sub];
        if (val && !isNaN(parseFloat(val))) {
          total += parseFloat(val);
          hasAnyValue = true;
        }
      });
      
      if (hasAnyValue) {
        currentRec.totalScore = total.toString();
        const avgNum = total / (Number(settings.maxSubjects) || 1);
        currentRec.average = avgNum.toFixed(2).replace(/\\.00$/, '');
        
        let g = 'F';
        if (avgNum >= settings.gradeA) g = 'A';
        else if (avgNum >= settings.gradeB) g = 'B';
        else if (avgNum >= settings.gradeC) g = 'C';
        else if (avgNum >= settings.gradeD) g = 'D';
        else if (avgNum >= settings.gradeE) g = 'E';
        currentRec.grade = g;
        
        let r = '';
        if (g === 'A') r = 'ល្អណាស់';
        else if (g === 'B') r = 'ល្អ';
        else if (g === 'C') r = 'ល្អបង្គួរ';
        else if (g === 'D') r = 'មធ្យម';
        else if (g === 'E') r = 'ខ្សោយ';
        else if (g === 'F') r = 'ខ្សោយណាស់';
        currentRec.remarks = r;
      } else {
        currentRec.totalScore = '';
        currentRec.average = '';
        currentRec.grade = '';
        currentRec.remarks = '';
      }
      return currentRec;
    });

    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.update(s.id, s)));
  };`;

content = content.replace(oldClearCol, newClearCol);

// 2. Fix handlePaste split
content = content.replace(
  /const cols = rowText\.split\(\/\\\\t\/\);/g,
  `const cols = rowText.includes('\\t') ? rowText.split('\\t') : rowText.split(/\\s+/);`
);

// 3. Fix input onChange to restrict numbers and td widths
const fields = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
fields.forEach(field => {
  const newTd = `<td style={{ padding: '0.2rem', border: '1px solid var(--border-color)', width: '60px', minWidth: '60px' }}>
                        <input 
                          type="text" 
                          value={scoreRec.${field} || ''}
                          onChange={(e) => handleScoreChange(scoreRec, '${field}', e.target.value.replace(/[^0-9.]/g, ''))}
                          onPaste={(e) => handlePaste(e, index, '${field}')}
                          style={{ width: '100%', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                          placeholder=""
                        />
                      </td>`;
  // use a loose regex because of potential whitespace differences
  const regex = new RegExp(
    `<td style=\\{\\{ padding: '0\\\\.2rem', border: '1px solid var\\(--border-color\\)' \\}\\}>\\\\s*<input \\\\s*type="text" \\\\s*value=\\{scoreRec\\\\.${field} \\|\\| ''\\}\\\\s*onChange=\\{\\(e\\) => handleScoreChange\\(scoreRec, '${field}', e\\\\.target\\\\.value\\)\\}\\\\s*onPaste=\\{\\(e\\) => handlePaste\\(e, index, '${field}'\\)\\}\\\\s*style=\\{\\{ width: '45px'[\\s\\S]*?/>\\\\s*</td>`
  );
  content = content.replace(regex, newTd);
});

// Also fix totalScore width
content = content.replace(
  /<td style={{ padding: '0\.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var\(--text-primary\)', border: '1px solid var\(--border-color\)' }}>/g,
  `<td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)', width: '70px', minWidth: '70px' }}>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 4 applied successfully!');
