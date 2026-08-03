const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove coefficient from average header
content = content.replace(
  /<div style=\{\{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0\.2rem' \}\}>មធ្យមភាគ <span.*?>\(\/\{computedScores\.currentCoeff\}\)<\/span><\/div>/g,
  '<div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0 auto" }}>មធ្យមភាគ</div>'
);
content = content.replace(
  /<div style=\{\{ writingMode: 'vertical-rl', transform: 'rotate\(180deg\)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0\.5rem' \}\}>មធ្យមភាគ <span.*?>\(\/\{computedScores\.currentCoeff\}\)<\/span><\/div>/g,
  '<div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0 auto" }}>មធ្យមភាគ</div>'
);


// 2. Fix the tbody rendering loop to use computedScores.rows instead of scores
content = content.replace(
  /const sortedScores = \[\.\.\.scores\]\.sort\(\(a: any, b: any\) => \{/,
  'const sortedScores = [...computedScores.rows].sort((a: any, b: any) => {'
);


// 3. Make sure to only allow numbers in the input boxes!
content = content.replace(/type="text"\s+value=\{scoreRec\.quiz \|\| ''\}/g, 'type="number" step="any" value={scoreRec.quiz || ""}');
content = content.replace(/type="text"\s+value=\{scoreRec\.exercise \|\| ''\}/g, 'type="number" step="any" value={scoreRec.exercise || ""}');
content = content.replace(/type="text"\s+value=\{scoreRec\.speaking \|\| ''\}/g, 'type="number" step="any" value={scoreRec.speaking || ""}');
content = content.replace(/type="text"\s+value=\{scoreRec\.homework \|\| ''\}/g, 'type="number" step="any" value={scoreRec.homework || ""}');
content = content.replace(/type="text"\s+value=\{scoreRec\.test \|\| ''\}/g, 'type="number" step="any" value={scoreRec.test || ""}');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 13 ready!');
