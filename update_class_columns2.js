const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace background variable everywhere
content = content.replaceAll('var(--bg-primary)', 'var(--modal-bg)');

// 2. Dropdown List
const dropdownRegex = /\{\[\s*\{ id: 'photo', label: 'រូបថត' \},[\s\S]*?\]\.map\(col => \(/;
const newDropdown = `{[
                                    { id: 'photo', label: 'រូបថត' },
                                    { id: 'studentId', label: 'អត្តលេខ' },
                                    { id: 'fullName', label: 'ឈ្មោះពេញ' },
                                    { id: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
                                    { id: 'gender', label: 'ភេទ' },
                                    { id: 'level', label: 'កម្រិតសិក្សា' },
                                    { id: 'shift', label: 'វេន' },
                                    { id: 'enrollDate', label: 'ថ្ងៃចូលរៀន' },
                                    { id: 'nextPaymentDate', label: 'ថ្ងៃបង់បន្ទាប់' },
                                    { id: 'paymentStatus', label: 'ស្ថានភាពបង់ប្រាក់' },
                                    { id: 'status', label: 'ស្ថានភាព' },
                                    { id: 'className', label: 'ថ្នាក់' },
                                    { id: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' },
                                    { id: 'address', label: 'អាសយដ្ឋាន' },
                                    { id: 'location', label: 'ទីតាំង' },
                                    { id: 'transport', label: 'មធ្យោបាយ' },
                                    { id: 'contact', label: 'ទំនាក់ទំនង' },
                                    { id: 'father', label: 'ឈ្មោះឪពុក' },
                                    { id: 'mother', label: 'ឈ្មោះម្តាយ' },
                                    { id: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
                                  ].map(col => (`;
content = content.replace(dropdownRegex, newDropdown);

// 3. Full view definition
content = content.replace(
  "const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'phoneNum']);",
  "const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'nextPaymentDate', 'paymentStatus', 'status', 'className', 'dob', 'address', 'location', 'transport', 'contact', 'father', 'mother', 'phoneNum']);"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed classes UI variables and dropdown');
