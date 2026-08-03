const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure all basic elements inherit or use Kantumruy Pro explicitly
const oldBodyRule = `body {
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
  background: var(--main-bg);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  transition: all 0.3s ease;
}`;

const newBodyRule = `body {
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
  background: var(--main-bg);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  transition: all 0.3s ease;
}

h1, h2, h3, h4, h5, h6, p, span, div, input, select, textarea, button, a {
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
}`;

if (content.includes(oldBodyRule)) {
  content = content.replace(oldBodyRule, newBodyRule);
} else {
  // Fallback if exactly not matching
  content = content.replace(
    /body\s*\{[^}]*\}/, 
    match => match + "\n\nh1, h2, h3, h4, h5, h6, p, span, div, input, select, textarea, button, a {\n  font-family: 'Kantumruy Pro', 'Inter', sans-serif;\n}"
  );
}

// Ensure .input-field explicitly uses it just in case
const oldInputField = `.input-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}`;

const newInputField = `.input-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
}`;
content = content.replace(oldInputField, newInputField);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch 28 applied!');
