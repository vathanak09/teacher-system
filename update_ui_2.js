const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

// Fix table width
content = content.replace(/minWidth: '800px'/g, "minWidth: 'max-content'");

// Fix Edit Student Modal Sections Grid to Flex
content = content.replace(/<div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>/g, "<div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>");

// For every `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>` inside the form, add flex: '1 1 250px'
// Actually, it's safer to use regex to replace all of these since they are standard field wrappers.
content = content.replace(/<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>\s*<label/g, "<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 200px' }}>\n                      <label");

fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed edit modal responsiveness and table min-width.');
