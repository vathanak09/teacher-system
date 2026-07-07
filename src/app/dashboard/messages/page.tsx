"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { messageService, studentService, classService, taskService, postService, teacherService } from '@/services/db';

export default function MessagesPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [selectedChanges, setSelectedChanges] = useState<{[msgId: string]: string[]}>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgTextField, setMsgTextField] = useState('');
  const [msgTargetAccounts, setMsgTargetAccounts] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [taskTitleField, setTaskTitleField] = useState('');
  const [taskSourceTypeField, setTaskSourceTypeField] = useState<'post' | 'link'>('post');
  const [taskSourceValueField, setTaskSourceValueField] = useState('');
  const [taskDetailField, setTaskDetailField] = useState('');
  const [taskDurationTypeField, setTaskDurationTypeField] = useState<'date' | 'days'>('date');
  const [taskDurationValueField, setTaskDurationValueField] = useState('');

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    setRole(currentRole);
    setUserId(currentUserId);
    setUserName(currentUserName);

    if (currentRole !== 'admin' && currentRole !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    const unsubscribeClasses = classService.subscribeAll(setClasses);
    const unsubscribeTeachers = teacherService.subscribeAll(setTeachers);
    const unsubscribePosts = postService.subscribeAll(setPosts);
    const unsubscribe = messageService.subscribeAll((data) => {
      const filtered = data.filter((d: any) => currentRole === 'admin' || d.senderId === currentUserId || d.receiverId === currentUserId || d.receiverId === currentRole);
      const sorted = filtered.sort((a: any, b: any) => {
        const d1 = new Date(a.createdAt).getTime();
        const d2 = new Date(b.createdAt).getTime();
        return d2 - d1;
      });
      setMessages(sorted);
    });

    return () => { unsubscribe(); unsubscribeClasses();
      unsubscribeTeachers();
      unsubscribePosts(); };
  }, [router]);

  const handleMarkAsRead = async (msgId: string) => {
    await messageService.update(msgId, { isRead: true });
  };

  const handleToggleChange = (msgId: string, key: string) => {
    setSelectedChanges(prev => {
      const current = prev[msgId] || [];
      if (current.includes(key)) {
        return { ...prev, [msgId]: current.filter(k => k !== key) };
      }
      return { ...prev, [msgId]: [...current, key] };
    });
  };

  const handleApproveEditRequest = async (msg: any) => {
    if (!msg.editRequestData || !msg.editRequestData.studentId) return;
    
    const selectedKeys = selectedChanges[msg.id] || [];
    if (selectedKeys.length === 0) {
      alert('សូមជ្រើសរើសព័ត៌មានយ៉ាងហោចណាស់មួយដើម្បីអនុម័ត!');
      return;
    }

    const updates: any = {};
    msg.editRequestData.changes.forEach((c: any) => {
      if (selectedKeys.includes(c.key)) {
        updates[c.key] = c.newVal;
      }
    });

    try {
      await studentService.update(msg.editRequestData.studentId, updates);
      
      // Update the message to indicate it was approved
      await messageService.update(msg.id, {
        isApproved: true,
        approvedAt: new Date().toISOString()
      });
      
      alert('ព័ត៌មានត្រូវបានកែប្រែដោយជោគជ័យ!');
    } catch (error) {
      console.error("Error approving edit request", error);
      alert('មានបញ្ហាក្នុងការរក្សាទុក។ សូមព្យាយាមម្តងទៀត។');
    }
  };

  const handleDelete = async (msgId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបសារនេះមែនទេ?')) {
      await messageService.delete(msgId);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    const replyMsg = {
      text: replyText,
      senderId: userId,
      senderName: userName,
      senderRole: role,
      receiverId: replyingTo.senderId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    await messageService.add(replyMsg);
    setReplyText('');
    setReplyingTo(null);
    alert('បានផ្ញើសារតបតជោគជ័យ!');
  };

  if (!role) return null;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>សារ និងការជូនដំណឹង (Messages)</h1>
        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => { setMsgTextField(''); setMsgTargetAccounts([]); setIsMsgModalOpen(true); }} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ សរសេរសារ/ជូនដំណឹង</button>
            <button onClick={() => { setSelectedClassIds([]); setTaskTitleField(''); setTaskSourceTypeField('post'); setTaskSourceValueField(''); setTaskDetailField(''); setTaskDurationTypeField('date'); setTaskDurationValueField(''); setIsTaskModalOpen(true); }} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ ដាក់កិច្ចការ</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className="glass-panel" 
            style={{ 
              padding: '1.5rem', 
              borderLeft: msg.isRead ? '4px solid var(--border-color)' : '4px solid var(--primary-color)',
              background: msg.isRead ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {msg.senderName} ({msg.senderRole === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'គ្រូបង្រៀន'})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(msg.createdAt).toLocaleString('km-KH')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!msg.isRead && (role === 'admin' || msg.receiverId === userId) && (
                  <button onClick={() => handleMarkAsRead(msg.id)} style={{ padding: '0.4rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>ធីកថាបានអាន</button>
                )}
                {role === 'admin' && (
                  <button onClick={() => handleDelete(msg.id)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="លុប">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              {msg.type === 'student_edit_request' ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-color)' }}>
                    សំណើកែប្រែព័ត៌មានសិស្ស៖ {msg.editRequestData?.studentName} (ID: {msg.editRequestData?.studentIdCode})
                  </div>
                  {msg.isApproved && (
                    <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', marginBottom: '1rem', fontWeight: 600 }}>
                      ✓ សំណើត្រូវបានអនុម័តរួចរាល់
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {msg.editRequestData?.changes?.map((change: any, i: number) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--modal-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: msg.isApproved ? 'default' : 'pointer', opacity: msg.isApproved ? 0.7 : 1 }}>
                        <input 
                          type="checkbox" 
                          disabled={msg.isApproved}
                          checked={msg.isApproved || (selectedChanges[msg.id] || []).includes(change.key)}
                          onChange={() => handleToggleChange(msg.id, change.key)}
                          style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem', accentColor: 'var(--primary-color)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{change.label}</div>
                          <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{change.oldVal || 'ទទេ'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>→</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{change.newVal || 'ទទេ'}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {role === 'admin' && !msg.isApproved && (
                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        onClick={() => handleApproveEditRequest(msg)} 
                        disabled={(selectedChanges[msg.id] || []).length === 0}
                        style={{ padding: '0.75rem 1.5rem', background: (selectedChanges[msg.id] || []).length > 0 ? 'var(--primary-color)' : 'var(--bg-secondary)', color: (selectedChanges[msg.id] || []).length > 0 ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: (selectedChanges[msg.id] || []).length > 0 ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                      >
                        អនុម័តការកែប្រែជ្រើសរើស (Approve Selected)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>{msg.text}</>
              )}
            </div>

            {role === 'admin' && msg.senderId !== userId && (
              <div style={{ marginTop: '1rem' }}>
                {replyingTo?.id === msg.id ? (
                  <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                      placeholder="វាយសារតបត..." 
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                      required 
                    />
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>ផ្ញើ</button>
                    <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>បោះបង់</button>
                  </form>
                ) : (
                  <button onClick={() => setReplyingTo(msg)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                    តបត (Reply)
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" style={{ marginBottom: '1rem' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p>មិនទាន់មានសារទេ</p>
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      {isTaskModalOpen && (
        <div 
          onClick={() => setIsTaskModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-in" 
            style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>ដាក់កិច្ចការថ្មី (Assign Task)</h2>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (selectedClassIds.length === 0) {
                alert('សូមជ្រើសរើសយ៉ាងហោចណាស់១ថ្នាក់!');
                return;
              }
              if (!taskTitleField || !taskDurationValueField) {
                alert('សូមបំពេញព័ត៌មានដែលចាំបាច់ (ចំណងជើង, រយៈពេល)!');
                return;
              }
              const baseData = {
                title: taskTitleField,
                sourceType: taskSourceTypeField,
                sourceValue: taskSourceValueField,
                detail: taskDetailField,
                durationType: 'date',
                durationValue: taskDurationValueField,
                progress: 0,
                success: false,
                createdAt: new Date().toISOString()
              };
              
              for (const cId of selectedClassIds) {
                await taskService.add({ ...baseData, classId: cId });
              }
              
              alert('បានដាក់កិច្ចការដោយជោគជ័យ!');
              setIsTaskModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ជ្រើសរើសថ្នាក់ (Assign to Classes)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                  {classes.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedClassIds.includes(c.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClassIds([...selectedClassIds, c.id]);
                          else setSelectedClassIds(selectedClassIds.filter(id => id !== c.id));
                        }} 
                      />
                      <span>{c.classCode ? `[${c.classCode}] ` : ''}{c.className} - {c.teacherName || 'គ្មានគ្រូ'}</span>
                    </label>
                  ))}
                  {classes.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>មិនទាន់មានថ្នាក់ទេ</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ចំណងជើង</label>
                <input type="text" value={taskTitleField} onChange={e => setTaskTitleField(e.target.value)} required placeholder="បំពេញចំណងជើង..." style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ប្រភព / យោង (មិនចាំបាច់មានក៏បាន)</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input type="radio" checked={taskSourceTypeField === 'post'} onChange={() => setTaskSourceTypeField('post')} /> លេខកូដ Post
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input type="radio" checked={taskSourceTypeField === 'link'} onChange={() => setTaskSourceTypeField('link')} /> តំណភ្ជាប់ (Link)
                  </label>
                </div>
                {taskSourceTypeField === 'post' ? (
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={taskSourceValueField} 
                      onChange={e => setTaskSourceValueField(e.target.value)}
                      placeholder="វាយលេខកូដ Post ឬចំណងជើង ដើម្បីស្វែងរក..." 
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }} 
                    />
                    {(!taskSourceValueField || !posts.find(p => p.postCode && p.postCode === taskSourceValueField)) && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {posts.filter(p => !taskSourceValueField || (p.postCode && p.postCode.toLowerCase().includes(taskSourceValueField.toLowerCase())) || (p.title && p.title.toLowerCase().includes(taskSourceValueField.toLowerCase()))).map(p => (
                          <div key={p.id} onClick={() => setTaskSourceValueField(p.postCode)} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--main-bg)' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{p.postCode}</span>
                              <span style={{ marginLeft: '0.5rem', color: 'var(--text-primary)' }}>{p.title}</span>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setTaskSourceValueField(p.postCode); }} style={{ padding: '0.25rem 0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>បញ្ចូល</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="text" value={taskSourceValueField} onChange={e => setTaskSourceValueField(e.target.value)} placeholder="https://example.com" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ព័ត៌មានលម្អិត</label>
                <textarea value={taskDetailField} onChange={e => setTaskDetailField(e.target.value)} rows={3} placeholder="ពណ៌នាអំពីកិច្ចការ..." style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>កាលបរិច្ឆេទអនុវត្ត</label>
                <input type="date" value={taskDurationValueField} onChange={e => setTaskDurationValueField(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>ដាក់កិច្ចការនេះ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Message/Announcement Modal */}
      {isMsgModalOpen && (
        <div 
          onClick={() => setIsMsgModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-in" 
            style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>សរសេរសារ ឬសេចក្តីជូនដំណឹង</h2>
              <button onClick={() => setIsMsgModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (msgTargetAccounts.length === 0) {
                alert('សូមជ្រើសរើសអ្នកទទួលយ៉ាងហោចណាស់១នាក់!');
                return;
              }
              if (!msgTextField.trim()) {
                alert('សូមសរសេរសាររបស់អ្នក!');
                return;
              }
              
              if (msgTargetAccounts.includes('all_teachers')) {
                 for (const t of teachers) {
                   await messageService.add({
                     text: msgTextField,
                     senderId: userId,
                     senderName: userName,
                     senderRole: role,
                     receiverId: t.id,
                     isRead: false,
                     createdAt: new Date().toISOString()
                   });
                 }
              } else {
                 for (const targetId of msgTargetAccounts) {
                   await messageService.add({
                     text: msgTextField,
                     senderId: userId,
                     senderName: userName,
                     senderRole: role,
                     receiverId: targetId,
                     isRead: false,
                     createdAt: new Date().toISOString()
                   });
                 }
              }
              
              alert('បានផ្ញើសារជោគជ័យ!');
              setIsMsgModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ជ្រើសរើសអ្នកទទួល</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    <input 
                      type="checkbox" 
                      checked={msgTargetAccounts.includes('all_teachers')} 
                      onChange={(e) => {
                        if (e.target.checked) setMsgTargetAccounts(['all_teachers']);
                        else setMsgTargetAccounts([]);
                      }} 
                    />
                    <span>គ្រូបង្រៀនទាំងអស់</span>
                  </label>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
                  {teachers.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        disabled={msgTargetAccounts.includes('all_teachers')}
                        checked={msgTargetAccounts.includes('all_teachers') || msgTargetAccounts.includes(t.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setMsgTargetAccounts([...msgTargetAccounts.filter(id => id !== 'all_teachers'), t.id]);
                          else setMsgTargetAccounts(msgTargetAccounts.filter(id => id !== t.id));
                        }} 
                      />
                      <span>{t.fullName} (គ្រូ)</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ខ្លឹមសារ</label>
                <textarea value={msgTextField} onChange={e => setMsgTextField(e.target.value)} required rows={4} placeholder="សរសេរសារ ឬសេចក្តីជូនដំណឹងនៅទីនេះ..." style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsMsgModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>បោះបង់</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>ផ្ញើសារចេញ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
