const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldFuncRegex = /const calculateAutoGrade = \(average: number\) => \{\s*if \(average >= settings\.gradeA\) return 'A';\s*if \(average >= settings\.gradeB\) return 'B';\s*if \(average >= settings\.gradeC\) return 'C';\s*if \(average >= settings\.gradeD\) return 'D';\s*if \(average >= settings\.gradeE\) return 'E';\s*return 'F';\s*\};/;

const newFunc = `  const calculateAutoGrade = (average: number) => {
    const avgPercentage = (average / 50) * 100;
    if (avgPercentage >= (settings.gradeA || 90)) return 'A';
    if (avgPercentage >= (settings.gradeB || 80)) return 'B';
    if (avgPercentage >= (settings.gradeC || 70)) return 'C';
    if (avgPercentage >= (settings.gradeD || 60)) return 'D';
    if (avgPercentage >= (settings.gradeE || 50)) return 'E';
    return 'F';
  };`;

content = content.replace(oldFuncRegex, newFunc);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 15 applied!');
