const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/students/page.tsx', 'utf8');

const oldStr = `{student.photo && String(student.photo).trim() !== '' ? (
                          <img src={convertDriveImageLink(student.photo)} alt={student.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                        ) : (
                          <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: student.gender === '????' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                            {getFirstLetter(student.fullName)}
                          </div>
                        )}`;

const newStr = `{student.photo && String(student.photo).trim() !== '' && !String(student.photo).includes('1SvTDHG3zdMHxOkER5Tii3Ac0alK3EqHi') ? (
                          <img src={convertDriveImageLink(student.photo)} alt={student.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                        ) : (
                          <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: student.gender === '????' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          </div>
                        )}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/app/dashboard/students/page.tsx', content);
