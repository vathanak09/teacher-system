const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Format average on render and add Coefficient to header
let coeffCalc = `  let currentCoeff = 1;
  if (settings.coefficientType === 'custom') {
    currentCoeff = (Number(settings.customMaxScore) || 250) / 50;
  } else {
    currentCoeff = Number(settings.maxSubjects) || 1;
  }
  if (currentCoeff <= 0) currentCoeff = 1;

  const dynamicRanks = useMemo(() => {
    const ranks = {};
    const scored = [...scores].filter(s => s.average !== '' && !isNaN(parseFloat(s.average)));
    scored.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
    
    let currentRank = 1;
    let currentAvg = -1;
    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      const avgNum = parseFloat(s.average);
      if (avgNum !== currentAvg) {
        currentRank = i + 1;
        currentAvg = avgNum;
      }
      ranks[s.id] = currentRank;
    }
    return ranks;
  }, [scores]);

  useEffect(() => {
    if (scores.length === 0) return;
    const timer = setTimeout(() => {
      const updates = [];
      scores.forEach(s => {
        const newRank = dynamicRanks[s.id]?.toString() || '';
        if (s.rank !== newRank && s.id) {
          updates.push(scoreService.update(s.id, { rank: newRank }));
        }
      });
      if (updates.length > 0) Promise.all(updates);
    }, 2000);
    return () => clearTimeout(timer);
  }, [dynamicRanks, scores]);
`;

// Find where to inject coeffCalc (start of component)
// We need to inject `useMemo` in imports too.
if (!content.includes('useMemo')) {
  content = content.replace(
    /import \{ useEffect, useState, useRef \} from 'react';/,
    `import { useEffect, useState, useRef, useMemo } from 'react';`
  );
}

content = content.replace(
  /const \[isClearDropdownOpen, setIsClearDropdownOpen\] = useState\(false\);/,
  `const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);\n${coeffCalc}`
);

// Header Modification
content = content.replace(
  /<div style=\{\{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)', margin: '0 auto' \}\}>មធ្យមភាគ<\/div>/,
  `<div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>មធ្យមភាគ <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary)', transform: 'rotate(90deg)' }}>(/{currentCoeff})</span></div>`
);

// Cell Modification for 2 decimal places
content = content.replace(
  /<td style=\{\{ padding: '0\.2rem', textAlign: 'center', color: 'var\(--text-secondary\)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var\(--border-color\)' \}\}>\s*<div style=\{\{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)', margin: '0 auto' \}\}>មធ្យមភាគ<\/div>\s*<\/th>/g,
  `<th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>មធ្យមភាគ <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary)', transform: 'rotate(90deg)' }}>(/{currentCoeff})</span></div>
              </th>`
);

// Wait, the header replace regex is safer like this:
// Replace the exact <th> for average
const thAverageRegex = /<th style=\{\{ padding: '0\.2rem', textAlign: 'center', color: 'var\(--text-secondary\)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var\(--border-color\)' \}\}>\s*<div style=\{\{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)', margin: '0 auto' \}\}>មធ្យមភាគ<\/div>\s*<\/th>/;
const thAverageReplacement = `<th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>មធ្យមភាគ <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary)', transform: 'rotate(90deg)' }}>(/{currentCoeff})</span></div>
              </th>`;
content = content.replace(thAverageRegex, thAverageReplacement);


// 2 decimal format for cell
const tdAverageRegex = /<td style=\{\{ padding: '0\.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var\(--text-primary\)', border: '1px solid var\(--border-color\)' \}\}>\s*\{scoreRec\.average \|\| '-'\}\s*<\/td>/;
const tdAverageReplacement = `<td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                      {scoreRec.average && !isNaN(parseFloat(scoreRec.average)) ? parseFloat(scoreRec.average).toFixed(2) : '-'}
                    </td>`;
content = content.replace(tdAverageRegex, tdAverageReplacement);


// Remove recalculateRanks function entirely
content = content.replace(
  /const recalculateRanks = async \(\) => \{[\s\S]*?await scoreService\.update\(s\.id, \{ rank: currentRank\.toString\(\) \}\);\s*\}\s*\}\s*\};/,
  ''
);

// Remove the manual rank calculation button
content = content.replace(
  /<button onClick=\{recalculateRanks\} className="btn btn-primary" title=".*?">[\s\S]*?<\/button>/,
  ''
);

// Replace static rank cell with dynamic rank cell
const tdRankRegex = /<td style=\{\{ padding: '0\.2rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b', border: '1px solid var\(--border-color\)' \}\}>\s*\{scoreRec\.rank \|\| '-'\}\s*<\/td>/;
const tdRankReplacement = `<td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b', border: '1px solid var(--border-color)' }}>
                      {dynamicRanks[scoreRec.id] || '-'}
                    </td>`;
content = content.replace(tdRankRegex, tdRankReplacement);

// 3. Fix handleScoreChange, handlePaste, handleClearColumn replacing .replace(/\.00$/, '')
content = content.replace(/\.toFixed\(2\)\.replace\(\/\\\\\.00\$\/, ''\)/g, '.toFixed(2)');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 7 success!');
