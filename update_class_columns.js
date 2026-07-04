const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace background variable everywhere
content = content.replaceAll('var(--bg-primary)', 'var(--modal-bg)');

// 2. Dropdown List
const dropdownRegex = /\{\[\s*\{ id: 'photo'[\s\S]*?\]\.map/;
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
                                  ].map`;
content = content.replace(dropdownRegex, newDropdown);

// 3. Table Header
const theadRegex = /<tr style=\{\{ background: 'var\(--bg-secondary\)', borderBottom: '1px solid var\(--border-color\)' \}\}>[\s\S]*?<\/tr>/;
const newThead = `<tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ល.រ</th>
                                {classVisibleColumns.includes('photo') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>}
                                {classVisibleColumns.includes('studentId') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>}
                                {classVisibleColumns.includes('fullName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះ</th>}
                                {classVisibleColumns.includes('englishName') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះអង់គ្លេស</th>}
                                {classVisibleColumns.includes('gender') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>}
                                {classVisibleColumns.includes('level') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>កម្រិត</th>}
                                {classVisibleColumns.includes('shift') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>វេន</th>}
                                {classVisibleColumns.includes('enrollDate') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្ងៃចូលរៀន</th>}
                                {classVisibleColumns.includes('nextPaymentDate') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្ងៃបង់បន្ទាប់</th>}
                                {classVisibleColumns.includes('paymentStatus') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាពបង់ប្រាក់</th>}
                                {classVisibleColumns.includes('status') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>}
                                {classVisibleColumns.includes('className') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្នាក់</th>}
                                {classVisibleColumns.includes('dob') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ថ្ងៃខែឆ្នាំកំណើត</th>}
                                {classVisibleColumns.includes('address') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អាសយដ្ឋាន</th>}
                                {classVisibleColumns.includes('location') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ទីតាំង</th>}
                                {classVisibleColumns.includes('transport') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>មធ្យោបាយ</th>}
                                {classVisibleColumns.includes('contact') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ទំនាក់ទំនង</th>}
                                {classVisibleColumns.includes('father') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះឪពុក</th>}
                                {classVisibleColumns.includes('mother') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះម្តាយ</th>}
                                {classVisibleColumns.includes('phoneNum') && <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>}
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>
                              </tr>`;
content = content.replace(theadRegex, newThead);

// 4. Table Body columns
const tbodyRegex = /\{classVisibleColumns\.includes\('studentId'\)[\s\S]*?\{classVisibleColumns\.includes\('phoneNum'\)[\s\S]*?<\/td>\}/;
const newTbody = `{classVisibleColumns.includes('studentId') && <td style={{ padding: '1rem', fontWeight: '500' }}>{s.studentId}</td>}
                                  {classVisibleColumns.includes('fullName') && <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{s.fullName}</td>}
                                  {classVisibleColumns.includes('englishName') && <td style={{ padding: '1rem' }}>{s.englishName}</td>}
                                  {classVisibleColumns.includes('gender') && <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.gender}</td>}
                                  {classVisibleColumns.includes('level') && <td style={{ padding: '1rem' }}>{s.level}</td>}
                                  {classVisibleColumns.includes('shift') && <td style={{ padding: '1rem' }}>{s.shift}</td>}
                                  {classVisibleColumns.includes('enrollDate') && <td style={{ padding: '1rem' }}>{s.enrollDate}</td>}
                                  {classVisibleColumns.includes('nextPaymentDate') && <td style={{ padding: '1rem' }}>{s.nextPaymentDate}</td>}
                                  {classVisibleColumns.includes('paymentStatus') && <td style={{ padding: '1rem' }}>
                                    {s.paymentStatus === 'បានបង់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus === 'ជំពាក់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus === 'ផុតកំណត់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem' }}>{s.paymentStatus}</span> : s.paymentStatus}
                                  </td>}
                                  {classVisibleColumns.includes('status') && <td style={{ padding: '1rem' }}>
                                    {s.status === 'កំពុងសិក្សា' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status === 'ឈប់សម្រាក' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status === 'បោះបង់' ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem' }}>{s.status}</span> : s.status}
                                  </td>}
                                  {classVisibleColumns.includes('className') && <td style={{ padding: '1rem' }}>{s.className}</td>}
                                  {classVisibleColumns.includes('dob') && <td style={{ padding: '1rem' }}>{s.dob}</td>}
                                  {classVisibleColumns.includes('address') && <td style={{ padding: '1rem' }}>{s.address}</td>}
                                  {classVisibleColumns.includes('location') && <td style={{ padding: '1rem' }}>{s.location}</td>}
                                  {classVisibleColumns.includes('transport') && <td style={{ padding: '1rem' }}>{s.transport}</td>}
                                  {classVisibleColumns.includes('contact') && <td style={{ padding: '1rem' }}>{s.contact}</td>}
                                  {classVisibleColumns.includes('father') && <td style={{ padding: '1rem' }}>{s.father}</td>}
                                  {classVisibleColumns.includes('mother') && <td style={{ padding: '1rem' }}>{s.mother}</td>}
                                  {classVisibleColumns.includes('phoneNum') && <td style={{ padding: '1rem' }}>{s.phoneNum}</td>}`;
content = content.replace(tbodyRegex, newTbody);


// 5. Full view definition
content = content.replace(
  "const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'phoneNum']);",
  "const setFullView = () => setClassVisibleColumns(['photo', 'studentId', 'fullName', 'englishName', 'gender', 'level', 'shift', 'enrollDate', 'nextPaymentDate', 'paymentStatus', 'status', 'className', 'dob', 'address', 'location', 'transport', 'contact', 'father', 'mother', 'phoneNum']);"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed classes UI');
