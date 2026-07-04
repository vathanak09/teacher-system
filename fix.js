const fs = require('fs');

const fixFile = (filePath, depth) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    let regexes = [
        { find: /src=\{student\.photo\}/g, replace: 'src={convertDriveImageLink(student.photo)}' },
        { find: /src=\{s\.photo\}/g, replace: 'src={convertDriveImageLink(s.photo)}' },
        { find: /src=\{teacher\.photo\}/g, replace: 'src={convertDriveImageLink(teacher.photo)}' },
        { find: /src=\{userPhoto\}/g, replace: 'src={convertDriveImageLink(userPhoto)}' },
        { find: /src=\{photoField\}/g, replace: 'src={convertDriveImageLink(photoField)}' },
        { find: /href=\{student\.photo\}/g, replace: 'href={convertDriveImageLink(student.photo)}' }
    ];

    for (let r of regexes) {
        if (content.match(r.find)) {
            content = content.replace(r.find, r.replace);
            changed = true;
        }
    }

    if (changed) {
        let relPath = '../'.repeat(depth) + 'utils/driveLink';
        let importStmt = 'import { convertDriveImageLink } from \'' + relPath + '\';\n';
        content = importStmt + content;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed ' + filePath);
    }
}

fixFile('./src/app/dashboard/students/page.tsx', 3);
fixFile('./src/app/dashboard/classes/page.tsx', 3);
fixFile('./src/app/dashboard/teachers/page.tsx', 3);
fixFile('./src/app/dashboard/layout.tsx', 2);
console.log('Done!');
