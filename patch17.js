const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update calculateRemarks in main body
const oldRemarksFuncRegex = /const calculateRemarks = \(grade: string\) => \{[\s\S]*?default: return '';\s*\}\s*\};\s*/;
const newRemarksFunc = `  const calculateRemarks = (grade: string) => {
    switch (grade) {
      case 'A': return 'ល្អប្រសើរ';
      case 'B': return 'ល្អ';
      case 'C': return 'ល្អបង្គួរ';
      case 'D': return 'មធ្យម';
      case 'E': return 'មធ្យម';
      case 'F': return 'ខ្សោយ';
      default: return '';
    }
  };
`;
content = content.replace(oldRemarksFuncRegex, newRemarksFunc);


// 2. Add dynRemarks to computedScores map
content = content.replace(
  /dynGrade: s\.totalScore === '' \? '' : grade,/,
  `dynGrade: s.totalScore === '' ? '' : grade,
        dynRemarks: s.totalScore === '' ? '' : calculateRemarks(grade),`
);


// 3. Update useEffect to sync dynRemarks
content = content.replace(
  /if \(s\.grade !== computed\.dynGrade\) \{ toUpdate\.grade = computed\.dynGrade; needsUpdate = true; \}/,
  `if (s.grade !== computed.dynGrade) { toUpdate.grade = computed.dynGrade; needsUpdate = true; }
          if (s.remarks !== computed.dynRemarks) { toUpdate.remarks = computed.dynRemarks; needsUpdate = true; }`
);


// 4. Fix JSX to render dynAverage and dynRemarks
content = content.replace(
  /\{scoreRec\.average \|\| '-'\}/,
  `{scoreRec.dynAverage || '-'}`
);
content = content.replace(
  /\{scoreRec\.remarks \|\| '-'\}/,
  `{scoreRec.dynRemarks || '-'}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 17 ready!');
