const fs = require('fs');
const files = [
  'src/app/dashboard/classes/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/students/page.tsx',
  'src/app/dashboard/teachers/page.tsx',
  'src/app/dashboard/attendance/page.tsx',
  'src/app/dashboard/schedule/page.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('className="table-responsive"')) {
      content = content.replace(/(<table[^>]*>[\s\S]*?<\/table>)/g, '<div className="table-responsive">\n$1\n</div>');
      fs.writeFileSync(f, content);
      console.log('Wrapped table in ' + f);
    }
  }
});
