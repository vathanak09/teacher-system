const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldGradeLogic = `      let grade = 'F';
      if (avg >= (settings.gradeA || 90)) grade = 'A';
      else if (avg >= (settings.gradeB || 80)) grade = 'B';
      else if (avg >= (settings.gradeC || 70)) grade = 'C';
      else if (avg >= (settings.gradeD || 60)) grade = 'D';
      else if (avg >= (settings.gradeE || 50)) grade = 'E';`;

const newGradeLogic = `      const avgPercentage = (avg / 50) * 100;
      let grade = 'F';
      if (avgPercentage >= (settings.gradeA || 90)) grade = 'A';
      else if (avgPercentage >= (settings.gradeB || 80)) grade = 'B';
      else if (avgPercentage >= (settings.gradeC || 70)) grade = 'C';
      else if (avgPercentage >= (settings.gradeD || 60)) grade = 'D';
      else if (avgPercentage >= (settings.gradeE || 50)) grade = 'E';`;

content = content.replace(oldGradeLogic, newGradeLogic);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 14 applied!');
