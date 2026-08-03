const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the old coeffCalc and dynamicRanks
const oldCoeffStart = content.indexOf('  let currentCoeff = 1;');
const oldCoeffEnd = content.indexOf('}, [dynamicRanks, scores]);') + '}, [dynamicRanks, scores]);'.length;
if (oldCoeffStart !== -1 && oldCoeffEnd !== -1) {
  content = content.substring(0, oldCoeffStart) + content.substring(oldCoeffEnd);
}

// 2. Insert the new computedScores logic
const computedScoresLogic = `
  const computedScores = useMemo(() => {
    let maxTotalScore = 0;
    if (settings.coefficientType !== 'custom') {
      maxTotalScore = Math.max(...scores.map(s => parseFloat(s.totalScore) || 0));
      if (maxTotalScore <= 0) maxTotalScore = 50; // fallback
    }
    
    let currentCoeff = 1;
    if (settings.coefficientType === 'custom') {
      currentCoeff = (Number(settings.customMaxScore) || 250) / 50;
    } else {
      currentCoeff = maxTotalScore / 50;
    }
    if (currentCoeff <= 0) currentCoeff = 1;

    const mapped = scores.map(s => {
      const total = parseFloat(s.totalScore) || 0;
      let avg = total / currentCoeff;
      
      let grade = 'F';
      if (avg >= (settings.gradeA || 90)) grade = 'A';
      else if (avg >= (settings.gradeB || 80)) grade = 'B';
      else if (avg >= (settings.gradeC || 70)) grade = 'C';
      else if (avg >= (settings.gradeD || 60)) grade = 'D';
      else if (avg >= (settings.gradeE || 50)) grade = 'E';
      
      return {
        ...s,
        dynAverage: s.totalScore === '' ? '' : avg.toFixed(2),
        dynGrade: s.totalScore === '' ? '' : grade,
        avgNum: s.totalScore === '' ? -1 : avg
      };
    });
    
    const scored = [...mapped].filter(s => s.avgNum !== -1);
    scored.sort((a, b) => b.avgNum - a.avgNum);
    
    let currentRank = 1;
    let currentAvg = -1;
    const ranks: Record<string, number> = {};
    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      if (s.avgNum !== currentAvg) {
        currentRank = i + 1;
        currentAvg = s.avgNum;
      }
      ranks[s.id as string] = currentRank;
    }
    
    return {
      currentCoeff,
      maxTotalScore,
      rows: mapped.map(s => ({
        ...s,
        dynRank: ranks[s.id] || ''
      }))
    };
  }, [scores, settings]);

  useEffect(() => {
    if (scores.length === 0) return;
    const timer = setTimeout(() => {
      const updates: Promise<void>[] = [];
      scores.forEach(s => {
        const computed = computedScores.rows.find(r => r.id === s.id);
        if (computed) {
          let needsUpdate = false;
          const toUpdate = {};
          if (s.average !== computed.dynAverage) { toUpdate.average = computed.dynAverage; needsUpdate = true; }
          if (s.grade !== computed.dynGrade) { toUpdate.grade = computed.dynGrade; needsUpdate = true; }
          if (s.rank !== computed.dynRank?.toString()) { toUpdate.rank = computed.dynRank?.toString(); needsUpdate = true; }
          
          if (needsUpdate && s.id) {
            updates.push(scoreService.update(s.id, toUpdate));
          }
        }
      });
      if (updates.length > 0) Promise.all(updates);
    }, 2000);
    return () => clearTimeout(timer);
  }, [computedScores, scores]);
`;

content = content.replace(
  /const \[isClearDropdownOpen, setIsClearDropdownOpen\] = useState\(false\);\s*/,
  `const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);\n${computedScoresLogic}`
);


// 3. Update the UI to use computedScores.rows
content = content.replace(
  /const sortedScores = useMemo\(\(\) => \{[\s\S]*?return result;\s*\}, \[scores, sortConfig, searchTerm\]\);/,
  `const sortedScores = useMemo(() => {
    let result = [...computedScores.rows];
    if (searchTerm) {
      result = result.filter(s => 
        (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.studentIdCode || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        
        if (['totalScore', 'average', 'rank'].includes(sortConfig.key)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [computedScores.rows, sortConfig, searchTerm]);`
);


// 4. Fix currentCoeff usage in JSX
content = content.replace(/\{currentCoeff\}/g, '{computedScores.currentCoeff}');

// 5. Update UI rendering cells to use dyn fields
content = content.replace(
  /\{scoreRec\.average && !isNaN\(parseFloat\(scoreRec\.average\)\) \? parseFloat\(scoreRec\.average\)\.toFixed\(2\) : '-'\}/g,
  '{scoreRec.dynAverage || "-"}'
);
content = content.replace(
  /\{dynamicRanks\[scoreRec\.id\] \|\| '-'\}/g,
  '{scoreRec.dynRank || "-"}'
);
content = content.replace(
  /\{scoreRec\.grade \|\| '-'\}/g,
  '{scoreRec.dynGrade || "-"}'
);


// 6. Update Coefficient modal text
content = content.replace(
  /1\. ផ្អែកតាមចំនួនមុខវិជ្ជា/g,
  '1. ផ្អែកតាមពិន្ទុអតិបរមាក្នុងបញ្ជី'
);
content = content.replace(
  /មេគុណ = ចំនួនមុខវិជ្ជាសរុប \(ចែកនឹង ៥០\)/g,
  'មេគុណ = ពិន្ទុសរុបអតិបរមា ចែកនឹង ៥០'
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 11 ready!');
