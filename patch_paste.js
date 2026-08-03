const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldHandlePaste = `  const handlePaste = async (e: React.ClipboardEvent, startStudentIndex: number, field: string) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const rows = pasteText.split(/\\r?\\n/);
    
    for (let i = 0; i < rows.length; i++) {
      const val = rows[i].trim();
      const studentIndex = startStudentIndex + i;
      if (studentIndex < scores.length && val !== '') {
        await handleScoreChange(scores[studentIndex], field, val);
      }
    }
  };`;

const newHandlePaste = `  const handlePaste = async (e: React.ClipboardEvent, startStudentIndex: number, field: string) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const rows = pasteText.split(/\\r?\\n/);
    
    const SCORE_FIELDS = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
    const startFieldIndex = SCORE_FIELDS.indexOf(field);
    if (startFieldIndex === -1) return;

    let updatedScoresList = [...scores];
    let promises = [];

    for (let i = 0; i < rows.length; i++) {
      const rowText = rows[i];
      if (rowText.trim() === '') continue;
      
      const cols = rowText.split(/\\t/);
      const studentIndex = startStudentIndex + i;
      
      if (studentIndex < updatedScoresList.length) {
        let currentRec = { ...updatedScoresList[studentIndex] };
        let hasChanges = false;
        
        for (let j = 0; j < cols.length; j++) {
          const targetField = SCORE_FIELDS[startFieldIndex + j];
          if (targetField) {
            const val = cols[j].trim();
            if (val !== '') {
              currentRec[targetField] = val;
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
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
            currentRec.grade = calculateAutoGrade(avgNum);
            currentRec.remarks = calculateRemarks(currentRec.grade);
          } else {
            currentRec.totalScore = '';
            currentRec.average = '';
            currentRec.grade = '';
            currentRec.remarks = '';
          }
          
          updatedScoresList[studentIndex] = currentRec;
          if (currentRec.id) {
            promises.push(scoreService.update(currentRec.id, currentRec));
          }
        }
      }
    }

    setScores(updatedScoresList);
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };`;

content = content.replace(oldHandlePaste, newHandlePaste);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch success!');
