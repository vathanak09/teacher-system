"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore';

export default function FavoritesPage() {
  const [lessonsPosts, setLessonsPosts] = useState<any[]>([]);
  const [methodsPosts, setMethodsPosts] = useState<any[]>([]);
  
  // Modals state
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');

  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  // Tag list
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  // Read post state
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId') || '';
    setUserId(currentUserId);
    setRole(localStorage.getItem('userRole') || '');

    if (!currentUserId) return;

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appTags) setAvailableTags(data.appTags);
      }
    });

    const lessonsQuery = query(collection(db, 'lessons'), where('likes', 'array-contains', currentUserId));
    const unsubLessons = onSnapshot(lessonsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, collectionName: 'lessons', ...doc.data() }));
      setLessonsPosts(data);
    });

    const methodsQuery = query(collection(db, 'methodologies'), where('likes', 'array-contains', currentUserId));
    const unsubMethods = onSnapshot(methodsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, collectionName: 'methodologies', ...doc.data() }));
      setMethodsPosts(data);
    });

    return () => {
      unsubSettings();
      unsubLessons();
      unsubMethods();
    };
  }, []);

  const openReadModal = (post: any) => {
    setSelectedPost(post);
    setIsReadModalOpen(true);
  };

  const toggleLike = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!userId) return;
    const currentLikes = post.likes || [];
    const hasLiked = currentLikes.includes(userId);
    const newLikes = hasLiked 
      ? currentLikes.filter((id: string) => id !== userId)
      : [...currentLikes, userId];
    
    updateDoc(doc(db, post.collectionName, post.id), { likes: newLikes });
    
    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost({ ...selectedPost, likes: newLikes });
    }
  };

  const getExcerpt = (html: string) => {
    if (typeof window !== 'undefined') {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      const text = tmp.textContent || tmp.innerText || "";
      return text.substring(0, 100) + (text.length > 100 ? "..." : "");
    }
    return "";
  };

  const allPosts = [...lessonsPosts, ...methodsPosts];

  const filteredAndSortedPosts = allPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || post.collectionName === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'km-KH');
      return 0;
    });

  if (!role) return null;

  return (
    <>
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>ážŸáŸ†ážŽáž–áŸ’ážœáž…áž·ážáŸ’áž</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>áž€áž¶ážšáž”áŸ’ážšáž˜áž¼áž›áž•áŸ’ážáž»áŸ†áž˜áŸážšáŸ€áž“ áž“áž·áž„ážœáž·áž’áž¸ážŸáž¶ážŸáŸ’ážáŸ’ážšážŠáŸ‚áž›áž¢áŸ’áž“áž€áž…áž¼áž›áž…áž·ážáŸ’áž</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="ážŸáŸ’ážœáŸ‚áž„ážšáž€áž…áŸ†ážŽáž„áž‡áž¾áž„..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '1rem', background: 'var(--main-bg)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select 
            className="input-field" 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)' }}
          >
            <option value="all">áž”áŸ’ážšáž—áŸáž‘áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹</option>
            <option value="lessons">áž˜áŸážšáŸ€áž“</option>
            <option value="methodologies">ážœáž·áž’áž¸ážŸáž¶ážŸáŸ’ážáŸ’ážš</option>
          </select>

          <select 
            className="input-field" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)' }}
          >
            <option value="newest">ážáŸ’áž˜áž¸áž”áŸ†áž•áž»áž</option>
            <option value="oldest">áž…áž¶ážŸáŸ‹áž”áŸ†áž•áž»áž</option>
            <option value="title">ážáž¶áž˜áž…áŸ†ážŽáž„áž‡áž¾áž„ (áž€-áž)</option>
          </select>
        </div>
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {searchQuery ? "ážšáž€áž˜áž·áž“ážƒáž¾áž‰áž€áž¶ážšážŸáŸ’ážœáŸ‚áž„ážšáž€áž“áŸáŸ‡áž‘áŸ!" : "áž¢áŸ’áž“áž€áž˜áž·áž“áž‘áž¶áž“áŸ‹áž˜áž¶áž“ážŸáŸ†ážŽáž–áŸ’ážœáž…áž·ážáŸ’ážáž“áŸ…áž¡áž¾áž™áž‘áŸ!"}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => (
            <div key={post.id + post.collectionName} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden' }} onClick={() => openReadModal(post)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {post.collectionName === 'lessons' ? 'áž˜áŸážšáŸ€áž“' : 'ážœáž·áž’áž¸ážŸáž¶ážŸáŸ’ážáŸ’ážš'}
                </div>

                <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{post.title}</h3>
                  {userId && (
                    <button 
                      onClick={(e) => toggleLike(e, post)} 
                      className="btn" 
                      style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '1.25rem', color: post.likes?.includes(userId) ? '#ef4444' : '#ccc', lineHeight: 1 }} 
                      title={post.likes?.includes(userId) ? "ážŠáž€áž…áŸáž‰áž–áž¸áž€áž¶ážšáž–áŸáž‰áž…áž·ážáŸ’áž" : "áž”áž“áŸ’ážáŸ‚áž˜áž‘áŸ…áž€áž¶ážšáž–áŸáž‰áž…áž·ážáŸ’áž"}
                    >
                    {post.likes?.includes(userId) ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(244,63,94,0.3))', transition: 'all 0.2s' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6, transition: 'all 0.2s' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    )}
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {post.tags && post.tags.map((tagId: number) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span key={tagId} style={{ background: tag.color, color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 }}>
                        {tag.name}
                      </span>
                    );
                  })}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1, marginBottom: '1.5rem' }}>
                  {getExcerpt(post.content)}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {post.author}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {new Date(post.timestamp).toLocaleDateString('km-KH')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* READ MODAL */}
    {isReadModalOpen && selectedPost && (
      <div 
        onClick={() => setIsReadModalOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          className="glass-panel animate-fade-in post-read-modal" 
          style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg)', overflow: 'hidden' }}
        >
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--modal-bg)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               <h2 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.4rem' }}>{selectedPost.title}</h2>
               {selectedPost.tags && selectedPost.tags.length > 0 && (
                 <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                   {selectedPost.tags.map((tagId: number) => {
                     const tag = availableTags.find(t => t.id === tagId);
                     if (!tag) return null;
                     return (
                       <span key={tagId} style={{ background: tag.color, color: 'white', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 }}>
                         {tag.name}
                       </span>
                     );
                   })}
                 </div>
               )}
             </div>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               {userId && (
                 <button 
                   onClick={(e) => toggleLike(e, selectedPost)} 
                   style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                   title={selectedPost.likes?.includes(userId) ? "ážŠáž€áž…áŸáž‰áž–áž¸áž€áž¶ážšáž–áŸáž‰áž…áž·ážáŸ’áž" : "áž”áž“áŸ’ážáŸ‚áž˜áž‘áŸ…áž€áž¶ážšáž–áŸáž‰áž…áž·ážáŸ’áž"}
                 >
                   {selectedPost.likes?.includes(userId) ? (
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(244,63,94,0.3))', transition: 'all 0.2s' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                   ) : (
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6, transition: 'all 0.2s' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                   )}
                 </button>
               )}
               <button onClick={() => setIsReadModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
             </div>
          </div>
          <div style={{ flex: 1, background: 'white', position: 'relative' }}>
            <iframe 
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                      body { font-family: 'Kantumruy Pro', 'Inter', sans-serif; margin: 0; padding: 2.5rem; color: #0f172a; line-height: 1.8; font-size: 1.05rem; }
                      img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; }
                      pre { background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; }
                      code { font-family: monospace; }
                      h1, h2, h3, h4 { color: #1e3a8a; margin-top: 1.5rem; margin-bottom: 1rem; }
                      p { margin-bottom: 1.2rem; }
                      ul, ol { padding-left: 2rem; margin-bottom: 1.5rem; }
                      blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #475569; font-style: italic; margin: 1.5rem 0; }
                      .ql-align-center { text-align: center; } .ql-align-right { text-align: right; } .ql-align-justify { text-align: justify; }
                    </style>
                  </head>
                  <body>
                    ${selectedPost.content}
                  </body>
                </html>
              `}
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
              title="Post Content"
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}

