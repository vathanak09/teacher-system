const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const statesRegex = /const \[levelsOptions, setLevelsOptions\] = useState<any\[\]>\(\[\]\);/;
const newStates = `const [levelsOptions, setLevelsOptions] = useState<any[]>([]);
  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);

  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);`;
content = content.replace(statesRegex, newStates);

// 2. Update loadSettings
const loadSettingsRegex = /setShiftsOptions\(norm\(d\.appStudentShifts \|\| \[\]\)\);\s*setLevelsOptions\(norm\(d\.appStudentLevels \|\| \[\]\)\);/;
const newLoadSettings = `setShiftsOptions(norm(d.appStudentShifts || []));
             setLevelsOptions(norm(d.appStudentLevels || []));
             const normStr = (arr: any[]) => (arr||[]).map(x => typeof x === 'string' ? x : x.id);
             if (d.appStudentAddresses) setAddressOptions(normStr(d.appStudentAddresses));
             if (d.appStudentTransports) setTransportOptions(normStr(d.appStudentTransports));
             if (d.appStudentGenders) setGenderOptions(normStr(d.appStudentGenders));
             if (d.appStudentStatuses) setStatusOptions(normStr(d.appStudentStatuses));`;
content = content.replace(loadSettingsRegex, newLoadSettings);

// 3. Update the Modal sections to use collapsible headers and mapped options
const modalRegex = /\{\/\* Section 1: Academic Info \*\/\}([\s\S]*?)<div style=\{\{ paddingTop: '1rem', borderTop: '1px solid var\(--border-color\)'/;
const newModalSections = `{/* Section 1: Academic Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div onClick={() => setIsSection1Open(!isSection1Open)} style={{ cursor: 'pointer', background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem 1rem', borderBottom: isSection1Open ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎓</span> ផ្នែកទី១៖ ព័ត៌មានសិក្សា (Student ID ដល់ Fee)
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{isSection1Open ? '▼ លាក់ (Hide)' : '▶ បង្ហាញ (Show)'}</span>
                  </div>
                  {isSection1Open && (
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អត្តលេខ (Student ID) *</label>
                      <input type="text" value={editStudentData.studentId} readOnly style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)', opacity: 0.7 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះពេញ (Khmer Name) *</label>
                      <input type="text" value={editStudentData.fullName} onChange={e => setEditStudentData({...editStudentData, fullName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះឡាតាំង (English Name) *</label>
                      <input type="text" value={editStudentData.englishName || ''} onChange={e => setEditStudentData({...editStudentData, englishName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ភេទ (Gender) *</label>
                      <select value={editStudentData.gender} onChange={e => setEditStudentData({...editStudentData, gender: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {genderOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>កម្រិតសិក្សា (Level) *</label>
                      <select value={editStudentData.level || ''} onChange={e => setEditStudentData({...editStudentData, level: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="">ជ្រើសរើសកម្រិត</option>
                        {levelsOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>វេនសិក្សា (Shift) *</label>
                      <select value={editStudentData.shift || ''} onChange={e => setEditStudentData({...editStudentData, shift: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="">ជ្រើសរើសវេន</option>
                        {shiftsOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន (Enroll Date) *</label>
                      <input type="date" value={editStudentData.enrollDate || ''} onChange={e => setEditStudentData({...editStudentData, enrollDate: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្លៃសិក្សា (Fee) [1 = 1000៛] *</label>
                      <input type="number" value={editStudentData.fee || ''} onChange={e => setEditStudentData({...editStudentData, fee: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required />
                    </div>
                  </div>
                  )}
                </div>

                {/* Section 2: Personal & Contact Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div onClick={() => setIsSection2Open(!isSection2Open)} style={{ cursor: 'pointer', background: 'rgba(236, 72, 153, 0.08)', padding: '0.75rem 1rem', borderBottom: isSection2Open ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏠</span> ផ្នែកទី២៖ ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង (DOB ដល់ Phone Num)
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{isSection2Open ? '▼ លាក់ (Hide)' : '▶ បង្ហាញ (Show)'}</span>
                  </div>
                  {isSection2Open && (
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
                      <input type="text" placeholder="ឧ. 27-06-2012" value={editStudentData.dob || ''} onChange={e => setEditStudentData({...editStudentData, dob: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អាសយដ្ឋាន (Address)</label>
                      <select value={editStudentData.address || ''} onChange={e => setEditStudentData({...editStudentData, address: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {addressOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ទីតាំង (Google Maps Link)</label>
                      <input type="text" placeholder="https://maps.google.com/..." value={editStudentData.location || ''} onChange={e => setEditStudentData({...editStudentData, location: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មធ្យោបាយធ្វើដំណើរ (Transport)</label>
                      <select value={editStudentData.transport || ''} onChange={e => setEditStudentData({...editStudentData, transport: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {transportOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>តំណភ្ជាប់រូបថត (Photo URL / Google Drive)</label>
                      <input type="text" placeholder="https://drive.google.com/file/d/..." value={editStudentData.photo || ''} onChange={e => setEditStudentData({...editStudentData, photo: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ស្ថានភាពសិក្សា (Status)</label>
                      <select value={editStudentData.status || ''} onChange={e => setEditStudentData({...editStudentData, status: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        {statusOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អ្នកទំនាក់ទំនង (Social Media Link)</label>
                      <input type="text" placeholder="https://t.me/username ឬ Link ផ្សេងៗ" value={editStudentData.contact || ''} onChange={e => setEditStudentData({...editStudentData, contact: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះឪពុក (Father Name)</label>
                      <input type="text" placeholder="ឧ. លី សុវណ្ណ" value={editStudentData.father || ''} onChange={e => setEditStudentData({...editStudentData, father: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ឈ្មោះម្តាយ (Mother Name)</label>
                      <input type="text" placeholder="ឧ. មាស សុខ" value={editStudentData.mother || ''} onChange={e => setEditStudentData({...editStudentData, mother: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ (Phone Num)</label>
                      <input type="text" placeholder="ឧ. 012345678" value={editStudentData.phoneNum || ''} onChange={e => setEditStudentData({...editStudentData, phoneNum: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  )}
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)'`;

content = content.replace(modalRegex, newModalSections);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed states and collapsibles!');
