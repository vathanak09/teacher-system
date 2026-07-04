
const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/teachers/page.tsx', 'utf8');

// 1. Add State
code = code.replace(
  "const [statusField, setStatusField] = useState('កំពុងបង្រៀន');",
  "const [statusField, setStatusField] = useState('កំពុងបង្រៀន');\n  // Contacts\n  const [telegramEnabled, setTelegramEnabled] = useState(false);\n  const [telegramLink, setTelegramLink] = useState('');\n  const [facebookEnabled, setFacebookEnabled] = useState(false);\n  const [facebookLink, setFacebookLink] = useState('');\n  const [otherContactEnabled, setOtherContactEnabled] = useState(false);\n  const [otherContactLabel, setOtherContactLabel] = useState('');\n  const [otherContactLink, setOtherContactLink] = useState('');"
);

// 2. handleOpenAddTeacher
code = code.replace(
  "setStatusField('កំពុងបង្រៀន');\n    setIsTeacherModalOpen(true);",
  "setStatusField('កំពុងបង្រៀន');\n    setTelegramEnabled(false);\n    setTelegramLink('');\n    setFacebookEnabled(false);\n    setFacebookLink('');\n    setOtherContactEnabled(false);\n    setOtherContactLabel('');\n    setOtherContactLink('');\n    setIsTeacherModalOpen(true);"
);

// 3. handleOpenEditTeacher
code = code.replace(
  "setStatusField(teacher.status);\n    setIsTeacherModalOpen(true);",
  "setStatusField(teacher.status);\n    setTelegramEnabled(!!teacher.contacts?.telegram);\n    setTelegramLink(teacher.contacts?.telegram || '');\n    setFacebookEnabled(!!teacher.contacts?.facebook);\n    setFacebookLink(teacher.contacts?.facebook || '');\n    setOtherContactEnabled(!!teacher.contacts?.other?.link);\n    setOtherContactLabel(teacher.contacts?.other?.label || '');\n    setOtherContactLink(teacher.contacts?.other?.link || '');\n    setIsTeacherModalOpen(true);"
);

// 4. handleSaveTeacher
code = code.replace(
  "status: statusField,\n    };",
  "status: statusField,\n      contacts: {\n        telegram: telegramEnabled ? telegramLink : '',\n        facebook: facebookEnabled ? facebookLink : '',\n        other: otherContactEnabled ? { label: otherContactLabel, link: otherContactLink } : null\n      }\n    };"
);

fs.writeFileSync('src/app/dashboard/teachers/page.tsx', code, 'utf8');
console.log('Patched state and handlers');

