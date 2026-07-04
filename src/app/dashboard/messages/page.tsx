"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';

export default function MessagesPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

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

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (currentRole === 'admin' || data.senderId === currentUserId || data.receiverId === currentUserId || data.receiverId === currentRole) {
          msgs.push({ id: doc.id, ...data });
        }
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [router]);

  const handleMarkAsRead = async (msgId: string) => {
    await updateDoc(doc(db, 'messages', msgId), { isRead: true });
  };

  const handleDelete = async (msgId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបសារនេះមែនទេ?')) {
      await deleteDoc(doc(db, 'messages', msgId));
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
    await addDoc(collection(db, 'messages'), replyMsg);
    setReplyText('');
    setReplyingTo(null);
    alert('បានផ្ញើសារតបតជោគជ័យ!');
  };

  if (!role) return null;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>សារ និងការជូនដំណឹង (Messages)</h1>
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
              {msg.text}
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
    </div>
  );
}
