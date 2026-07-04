const fs = require('fs');
const file = 'src/app/dashboard/classes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Hover Profile Popup Replacement
const hoverPopupRegex = /\{\/\* Centered Hover Profile Popup \*\/\}([\s\S]*?)document\.body\s*\)\s*\}/;
const newHoverPopup = `{/* Centered Hover Profile Popup */}
                                        {hoveredStudent === s.id && typeof window !== 'undefined' && createPortal(
                                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, pointerEvents: 'none' }}>
                                            <div style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backdropFilter: 'blur(10px)' }} onMouseEnter={() => setHoveredStudent(s.id)} onMouseLeave={() => setHoveredStudent(null)} onClick={e => e.stopPropagation()}>
                                              {/* Header */}
                                              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                                                {s.photo && String(s.photo).trim() !== '' ? (
                                                  <img src={convertDriveImageLink(s.photo)} alt={s.fullName} style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                                                ) : (
                                                  <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: s.gender === 'ស្រី' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', border: '3px solid var(--accent-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>{getFirstLetter(s.fullName)}</div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{s.fullName}</h2>
                                                  <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.englishName || 'គ្មានឈ្មោះអង់គ្លេស'}</p>
                                                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700 }}>ID: {s.studentId}</span>
                                                    <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>{s.status || 'កំពុងសិក្សា'}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Details */}
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div style={{ background: 'rgba(139, 92, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                                  <h4 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                                                    ព័ត៌មានសិក្សា
                                                  </h4>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្នាក់៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.className || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>កម្រិត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.level || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>វេន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.shift || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃចូលរៀន៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.enrollDate || 'N/A'}</strong></div>
                                                  </div>
                                                </div>

                                                <div style={{ background: 'rgba(236, 72, 153, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                                                  <h4 style={{ margin: '0 0 1rem 0', color: '#ec4899', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    ជីវប្រវត្តិ & ទំនាក់ទំនង
                                                  </h4>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ភេទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.gender || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃកំណើត៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.dob || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ឪពុក៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.father || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>ម្តាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.mother || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>លេខទូរស័ព្ទ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.phoneNum || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>មធ្យោបាយ៖</span> <strong style={{ color: 'var(--text-primary)' }}>{s.transport || 'N/A'}</strong></div>
                                                  </div>
                                                </div>

                                                <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.04)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>អាសយដ្ឋាន៖</span> <strong style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{s.address || 'N/A'}</strong></div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>បណ្តាញសង្គម៖</span> 
                                                      {s.contact ? (s.contact.startsWith('http') ? <a href={s.contact} target="_blank" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'underline' }}>ចុចទីនេះ</a> : <strong style={{ color: 'var(--text-primary)' }}>{s.contact}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}><span style={{ color: 'var(--text-secondary)', minWidth: '90px' }}>ទីតាំងផ្ទះ៖</span> 
                                                      {s.location ? (s.location.startsWith('http') ? <a href={s.location} target="_blank" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>ផែនទី</a> : <strong style={{ color: 'var(--text-primary)' }}>{s.location}</strong>) : <strong style={{ color: 'var(--text-primary)' }}>N/A</strong>}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <button onClick={() => { setHoveredStudent(null); setEditStudentData(s); setIsEditStudentModalOpen(true); }} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', border: 'none', fontSize: '1.05rem', fontWeight: 700, marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                កែប្រែព័ត៌មានសិស្ស
                                              </button>
                                            </div>
                                          </div>,
                                          document.body
                                        )}`;
content = content.replace(hoverPopupRegex, newHoverPopup);

// 2. Edit Student Modal Replacement
const modalRegex = /\{\/\* Edit Student Modal \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)/;
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
                    ស្នើសុំការកែប្រែទៅកាន់ Admin
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => { setIsEditStudentModalOpen(false); setEditStudentData(null); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>រក្សាទុកការផ្លាស់ប្តូរ</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}`;
content = content.replace(modalRegex, newModal);

// 3. Highlight modified fields in handleRequestStudentEdit
const requestFunctionRegex = /const handleRequestStudentEdit = async \(\) => \{([\s\S]*?)\n\s+if \(!role\) return null;/;
const newRequestFunction = `const handleRequestStudentEdit = async () => {
      if (!editStudentData || !viewingClass) return;
      
      const originalStudent = (viewingClass.studentsData || []).find((s: any) => s.id === editStudentData.id) 
        || allStudents.find(s => s.id === editStudentData.id);
      
      let changedFields = [];
      if (originalStudent) {
        const fieldsToCheck = [
          { key: 'fullName', label: 'ឈ្មោះពេញ' }, { key: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
          { key: 'gender', label: 'ភេទ' }, { key: 'level', label: 'កម្រិតសិក្សា' }, { key: 'shift', label: 'វេន' },
          { key: 'enrollDate', label: 'ថ្ងៃចូលរៀន' }, { key: 'fee', label: 'ថ្លៃសិក្សា' },
          { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' }, { key: 'address', label: 'អាសយដ្ឋាន' },
          { key: 'location', label: 'ទីតាំង' }, { key: 'transport', label: 'មធ្យោបាយ' },
          { key: 'photo', label: 'រូបថត' }, { key: 'status', label: 'ស្ថានភាព' },
          { key: 'contact', label: 'អ្នកទំនាក់ទំនង' }, { key: 'father', label: 'ឈ្មោះឪពុក' },
          { key: 'mother', label: 'ឈ្មោះម្តាយ' }, { key: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
        ];
        
        for (const field of fieldsToCheck) {
          if (String(originalStudent[field.key] || '') !== String(editStudentData[field.key] || '')) {
            changedFields.push(\`- \${field.label}: [ចាស់]: \${originalStudent[field.key] || 'ទទេ'} -> [ថ្មី]: **\${editStudentData[field.key] || 'ទទេ'}**\`);
          }
        }
      }
      
      const changesText = changedFields.length > 0 
        ? \`មានព័ត៌មានដែលបានកែប្រែ៖\\n\${changedFields.join('\\n')}\`
        : 'មិនមានព័ត៌មានត្រូវបានកែប្រែទេប៉ុន្តែបានស្នើសុំពិនិត្យមើល។';

      const msg = {
        text: \`សួស្តី Admin សូមជួយកែប្រែព័ត៌មានសិស្សខាងក្រោម៖ \\n\${editStudentData.fullName} (អត្តលេខ: \${editStudentData.studentId})\\n\\n\${changesText}\`,
        senderId: userId,
        senderName: userName,
        senderRole: role,
        receiverId: 'admin',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      try {
        await addDoc(collection(db, 'messages'), msg);
        alert('សំណើកែប្រែព័ត៌មានសិស្សត្រូវបានបញ្ជូនទៅកាន់ Admin ដោយជោគជ័យ!');
        setIsEditStudentModalOpen(false);
        setEditStudentData(null);
      } catch (error) {
        console.error("Error sending request:", error);
        alert("មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ សូមព្យាយាមម្តងទៀត។");
      }
    };
  
    if (!role) return null;`;
content = content.replace(requestFunctionRegex, newRequestFunction);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed popups successfully');
