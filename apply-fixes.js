const fs = require('fs');

// 1. Fix layout.tsx
let layout = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Add My Favorite tab
layout = layout.replace(
  "{ name: 'វិធីសាស្ត្របង្រៀន', path: '/dashboard/methodologies', icon: <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"></path><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"></path></svg> },",
  `{ name: 'វិធីសាស្ត្របង្រៀន', path: '/dashboard/methodologies', icon: <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"></path><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"></path></svg> },\n      { name: 'សំណព្វចិត្ត', path: '/dashboard/favorites', icon: <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path></svg> },`
);

// Add Theme Dropdown next to dark mode button
layout = layout.replace(
  '<button onClick={toggleTheme} className=\"theme-toggle\" aria-label=\"Toggle Dark Mode\">',
  `<select 
                value={typeof window !== 'undefined' ? localStorage.getItem('theme-color') || 'emerald' : 'emerald'}
                onChange={(e) => {
                  const newTheme = e.target.value;
                  localStorage.setItem('theme-color', newTheme);
                  document.body.className = document.body.className.replace(/theme-\\w+/, '');
                  document.body.classList.add('theme-' + newTheme);
                }}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                <option value=\"emerald\">Emerald</option>
                <option value=\"ocean\">Ocean</option>
                <option value=\"rose\">Rose</option>
                <option value=\"amber\">Amber</option>
                <option value=\"violet\">Violet</option>
              </select>\n              <button onClick={toggleTheme} className=\"theme-toggle\" aria-label=\"Toggle Dark Mode\">`
);

fs.writeFileSync('src/app/dashboard/layout.tsx', layout, 'utf8');

// 2. Fix lessons & methodologies page hearts
['src/app/dashboard/lessons/page.tsx', 'src/app/dashboard/methodologies/page.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '❤️',
    '<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"#f43f5e\" stroke=\"#f43f5e\" strokeWidth=\"2\" style={{ filter: \"drop-shadow(0 2px 4px rgba(244,63,94,0.3))\" }}><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path></svg>'
  );
  content = content.replace(
    '🤍',
    '<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path></svg>'
  );
  fs.writeFileSync(file, content, 'utf8');
});

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('page.tsx')) {
      files.push(name);
    }
  }
  return files;
}

getFiles('src/app/dashboard').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Use .page-container
  content = content.replace(/<div className=\"animate-fade-in\" style={{ maxWidth: '1200px', margin: '0 auto' }}>/g, '<div className=\"page-container animate-fade-in\">');
  content = content.replace(/<div className=\"animate-fade-in\" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', flexDirection: 'row', flexWrap: 'wrap' }}>/g, '<div className=\"page-container animate-fade-in\" style={{ display: \'flex\', gap: \'2rem\', flexDirection: \'row\', flexWrap: \'wrap\' }}>');
  content = content.replace(/<div className=\"animate-fade-in\">/g, '<div className=\"page-container animate-fade-in\">');
  
  // Teachers page btn
  content = content.replace(/style={{ padding: '0.75rem 1.5rem', background: 'var\\(--primary-color\\)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba\\(99, 102, 241, 0.2\\)' }}/g, 'className=\"btn btn-primary\" style={{ padding: \"0.75rem 1.5rem\", gap: \"0.5rem\" }}');
  // Classes page btn
  content = content.replace(/style={{ padding: '0.5rem 1rem', background: 'var\\(--primary-color\\)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}/g, 'className=\"btn btn-primary\" style={{ gap: \"0.5rem\" }}');
  // Save btns
  content = content.replace(/style={{ padding: '0.75rem 1.5rem', background: 'var\\(--primary-color\\)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}/g, 'className=\"btn btn-primary\"');
  
  fs.writeFileSync(file, content, 'utf8');
});
