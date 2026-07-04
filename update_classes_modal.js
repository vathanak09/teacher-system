const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 2. Edit Student Modal Replacement
const modalRegex = /\{\/\* Edit Student Modal \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/;
const newModal = `{/* Edit Student Modal */}
        {isEditStudentModalOpen && editStudentData && (
          <div 
            onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="glass-panel animate-scale-in" 
              style={{ width: '100%', maxWidth: '800px', background: 'var(--modal-bg)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--modal-bg)', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>កែប្រែព័ត៌មានសិស្ស</h2>
                <button onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <form onSubmit={handleSaveStudentEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Section 1: Academic Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎓</span> ផ្នែកទី១៖ ព័ត៌មានសិក្សា (Student ID ដល់ Fee)
                  </div>
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
                        <option value="ស្រី">ស្រី</option>
                        <option value="ប្រុស">ប្រុស</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>កម្រិតសិក្សា (Level) *</label>
                      <select value={editStudentData.level || ''} onChange={e => setEditStudentData({...editStudentData, level: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="">ជ្រើសរើសកម្រិត</option>
                        <option value="K1">K1</option><option value="K2">K2</option><option value="K3">K3</option>
                        <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                        <option value="L4">L4</option><option value="L5">L5</option><option value="L6">L6</option>
                        <option value="ELE1">ELE1</option><option value="ELE2">ELE2</option><option value="ELE3">ELE3</option>
                        <option value="PRE1">PRE1</option><option value="PRE2">PRE2</option><option value="PRE3">PRE3</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>វេនសិក្សា (Shift) *</label>
                      <select value={editStudentData.shift || ''} onChange={e => setEditStudentData({...editStudentData, shift: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} required>
                        <option value="M">M (ព្រឹក)</option>
                        <option value="A">A (រសៀល)</option>
                        <option value="E">E (ល្ងាច)</option>
                        <option value="W">W (ចុងសប្តាហ៍)</option>
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
                </div>

                {/* Section 2: Personal & Contact Info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ background: 'rgba(236, 72, 153, 0.08)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏠</span> ផ្នែកទី២៖ ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង (DOB ដល់ Phone Num)
                  </div>
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
                      <input type="text" placeholder="ឧ. 27-06-2012" value={editStudentData.dob || ''} onChange={e => setEditStudentData({...editStudentData, dob: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>អាសយដ្ឋាន (Address)</label>
                      <input type="text" placeholder="កំពង់ឆ្នាំង" value={editStudentData.address || ''} onChange={e => setEditStudentData({...editStudentData, address: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ទីតាំង (Google Maps Link)</label>
                      <input type="text" placeholder="https://maps.google.com/..." value={editStudentData.location || ''} onChange={e => setEditStudentData({...editStudentData, location: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មធ្យោបាយធ្វើដំណើរ (Transport)</label>
                      <select value={editStudentData.transport || ''} onChange={e => setEditStudentData({...editStudentData, transport: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="">ជ្រើសរើស</option>
                        <option value="ម៉ូតូ">ម៉ូតូ</option>
                        <option value="កង់">កង់</option>
                        <option value="ដើរ">ដើរ</option>
                        <option value="ឡាន">ឡាន</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>តំណភ្ជាប់រូបថត (Photo URL / Google Drive)</label>
                      <input type="text" placeholder="https://drive.google.com/file/d/..." value={editStudentData.photo || ''} onChange={e => setEditStudentData({...editStudentData, photo: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ស្ថានភាពសិក្សា (Status)</label>
                      <select value={editStudentData.status || 'កំពុងសិក្សា'} onChange={e => setEditStudentData({...editStudentData, status: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}>
                        <option value="កំពុងសិក្សា">កំពុងសិក្សា</option>
                        <option value="ឈប់សម្រាក">ឈប់សម្រាក</option>
                        <option value="បោះបង់">បោះបង់</option>
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
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={handleRequestStudentEdit} style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ស្នើសុំកែប្រែទៅ Admin
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>រក្សាទុកក្នុងថ្នាក់</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}`;

if (modalRegex.test(content)) {
  content = content.replace(modalRegex, newModal);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced modal!');
} else {
  console.log('REGEX DID NOT MATCH!');
}
