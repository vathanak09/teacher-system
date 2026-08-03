const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update logic
content = content.replace(
  /currentCoeff = maxTotalScore \/ 50;/g,
  'currentCoeff = (maxTotalScore + 5) / 50;'
);

// Update UI Text
content = content.replace(
  /មេគុណ = ពិន្ទុសរុបអតិបរមា ចែកនឹង ៥០/g,
  'មេគុណ = (ពិន្ទុសរុបអតិបរមា + 5) ចែកនឹង ៥០'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 16 applied!');
