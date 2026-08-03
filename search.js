const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, 'src', 'app', 'dashboard', 'scores', 'page.tsx'), 'utf8').split('\n');
lines.forEach((line, index) => {
  if (line.includes('ពិន្ទុអតិបរមាក្នុងបញ្ជី') || line.includes('ពិន្ទុសរុបអតិបរមា')) {
    console.log(index + 1, ':', line.trim());
  }
});
