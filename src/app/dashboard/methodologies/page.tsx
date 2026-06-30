"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function MethodologiesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  
  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  
  const [role, setRole] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [userId, setUserId] = useState('');

  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTag, setFilterTag] = useState('all');

  // Tag & Tag Group lists
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [tagGroups, setTagGroups] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editorMode, setEditorMode] = useState<'word' | 'html'>('word');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Read post state
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || '');
    setAuthorName(localStorage.getItem('userName') || 'Admin');
    setUserId(localStorage.getItem('userId') || '');

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appTags) setAvailableTags(data.appTags);
        if (data.appTagGroups) setTagGroups(data.appTagGroups);
      }
    });

    // Load Posts
    const unsubscribe = onSnapshot(collection(db, 'methodologies'), (snapshot) => {
      const postsData: any[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const openCreateModal = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setEditingId(null);
    setEditorMode('word');
    setIsEditorOpen(true);
  };

  const openEditModal = (post: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(post.title);
    setContent(post.content);
    setSelectedTags(post.tags || []);
    setEditingId(post.id);
    setEditorMode(post.editorMode || 'word');
    setIsEditorOpen(true);
  };

  const openReadModal = (post: any) => {
    setSelectedPost(post);
    setIsReadModalOpen(true);
  };

  const handleSave = () => {
    if (!title) return alert("សូមបំពេញចំណងជើង!");
    const postData = {
      title,
      content,
      author: authorName,
      date: new Date().toLocaleDateString('km-KH'),
      timestamp: Date.now(),
      editorMode,
      tags: selectedTags,
      likes: []
    };
    if (editingId) {
      updateDoc(doc(db, 'methodologies', editingId.toString()), postData);
    } else {
      addDoc(collection(db, 'methodologies'), postData);
    }
    setIsEditorOpen(false);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("តើអ្នកពិតជាចង់លុបអត្ថបទនេះមែនទេ?")) {
      deleteDoc(doc(db, 'methodologies', id));
    }
  };

  const toggleLike = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!userId) return;
    const currentLikes = post.likes || [];
    const hasLiked = currentLikes.includes(userId);
    const newLikes = hasLiked 
      ? currentLikes.filter((id: string) => id !== userId)
      : [...currentLikes, userId];
    
    updateDoc(doc(db, 'methodologies', post.id), { likes: newLikes });
  };

  // Enhanced Quill Modules with size, color, background-color, alignment
  const modules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
  };

  // Helper function to strip HTML for preview
  const getExcerpt = (html: string) => {
    if (typeof window !== 'undefined') {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      const text = tmp.textContent || tmp.innerText || "";
      return text.substring(0, 100) + (text.length > 100 ? "..." : "");
    }
    return "";
  };

  // Filter and Sort logic
  const filteredAndSortedPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterAuthor === 'all' || 
        (filterAuthor === 'mine' && post.author === authorName) ||
        (filterAuthor === 'others' && post.author !== authorName) ||
        (filterAuthor === 'favorites' && post.likes && post.likes.includes(userId));
      
      const matchesTag = filterTag === 'all' || (post.tags && post.tags.includes(Number(filterTag)));
      
      return matchesSearch && matchesFilter && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'km-KH');
      return 0;
    });

  return (
    <>
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>វិធីសាស្ត្របង្រៀន</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>ចែករំលែក និងស្វែងយល់ពីវិធីសាស្ត្របង្រៀនថ្មីៗ</p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + បង្កើតអត្ថបទថ្មី
          </button>
        )}
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="ស្វែងរកចំណងជើងអត្ថបទ..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '1rem', background: 'var(--main-bg)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Tag Filter */}
          <select 
            className="input-field" 
            value={filterTag} 
            onChange={e => setFilterTag(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
          >
            <option value="all">ស្លាកពាក្យទាំងអស់</option>
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>

          <select 
            className="input-field" 
            value={filterAuthor} 
            onChange={e => setFilterAuthor(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
          >
            <option value="all">អត្ថបទទាំងអស់</option>
            <option value="favorites">អត្ថបទដែលខ្ញុំពេញចិត្ត</option>
            <option value="mine">អត្ថបទរបស់ខ្ញុំ</option>
            <option value="others">អត្ថបទអ្នកដទៃ</option>
          </select>

          <select 
            className="input-field" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
          >
            <option value="newest">ថ្មីបំផុត</option>
            <option value="oldest">ចាស់បំផុត</option>
            <option value="title">តាមចំណងជើង (ក-ខ)</option>
          </select>
        </div>
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {searchQuery ? "រកមិនឃើញអត្ថបទដែលត្រូវគ្នានឹងការស្វែងរកទេ!" : "មិនទាន់មានអត្ថបទណាមួយនៅឡើយទេ!"}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => (
            <div key={post.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden' }} onClick={() => openReadModal(post)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{post.title}</h3>
                  {userId && (
                    <button 
                      onClick={(e) => toggleLike(e, post)} 
                      className="btn" 
                      style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '1.25rem', color: post.likes?.includes(userId) ? '#ef4444' : '#ccc', lineHeight: 1 }} 
                      title={post.likes?.includes(userId) ? "ដកចេញពីការពេញចិត្ត" : "បន្ថែមទៅការពេញចិត្ត"}
                    >
                      {post.likes?.includes(userId) ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>
                
                {/* Render Tag Badges on Cards */}
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
                      {post.date}
                    </span>
                  </div>
                  
                  {(role === 'admin' || post.author === authorName) ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={(e) => openEditModal(post, e)} className="btn" style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={(e) => handleDelete(post.id, e)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 500 }}>អានលម្អិត &rarr;</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* EDITOR MODAL (Solid Background Fixed) */}
    {isEditorOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
        <div className="glass-panel animate-fade-in post-editor-modal" style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg)' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--modal-bg)' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{editingId ? 'កែប្រែអត្ថបទ' : 'សរសេរអត្ថបទថ្មី'}</h2>
            
            {!editingId ? (
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--main-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                 <button 
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: editorMode === 'word' ? 'var(--accent-primary)' : 'transparent', color: editorMode === 'word' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                    onClick={() => setEditorMode('word')}
                 >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                   Word Style
                 </button>
                 <button 
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: editorMode === 'html' ? 'var(--accent-primary)' : 'transparent', color: editorMode === 'html' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                    onClick={() => setEditorMode('html')}
                 >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                   HTML Style
                 </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                របៀបសរសេរ៖ {editorMode === 'word' ? 'Word Style' : 'HTML Style'}
              </span>
            )}
          </div>
          
          <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ចំណងជើងអត្ថបទ</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="វាយបញ្ចូលចំណងជើង..." 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--main-bg)' }}
              />
            </div>

            {/* Grouped Tag Selection in Editor */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>ស្លាកពាក្យ (Tags)</label>
              {availableTags.length === 0 ? (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>មិនទាន់មានស្លាកពាក្យនៅឡើយទេ។ (គ្រប់គ្រងស្លាកពាក្យក្នុងទំព័រ Settings)</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--main-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  
                  {/* Grouped Tags */}
                  {tagGroups.map(group => {
                    const groupTags = availableTags.filter(t => t.groupId === group.id);
                    if (groupTags.length === 0) return null;
                    return (
                      <div key={group.id}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                          📂 {group.name}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {groupTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <div 
                                key={tag.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                  } else {
                                    setSelectedTags([...selectedTags, tag.id]);
                                  }
                                }}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  background: isSelected ? tag.color : 'var(--modal-bg)',
                                  color: isSelected ? 'white' : 'var(--text-secondary)',
                                  border: `1px solid ${isSelected ? tag.color : 'var(--border-color)'}`,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {tag.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Ungrouped Tags */}
                  {(() => {
                    const ungroupedTags = availableTags.filter(t => !t.groupId);
                    if (ungroupedTags.length === 0) return null;
                    return (
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                          🏷️ ស្លាកពាក្យផ្សេងៗ (Others)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {ungroupedTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <div 
                                key={tag.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                  } else {
                                    setSelectedTags([...selectedTags, tag.id]);
                                  }
                                }}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  background: isSelected ? tag.color : 'var(--modal-bg)',
                                  color: isSelected ? 'white' : 'var(--text-secondary)',
                                  border: `1px solid ${isSelected ? tag.color : 'var(--border-color)'}`,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {tag.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ខ្លឹមសារអត្ថបទ</label>
              {editorMode === 'html' ? (
                <textarea 
                  className="input-field" 
                  style={{ flex: 1, fontFamily: 'monospace', resize: 'none', background: '#1e293b', color: '#e2e8f0', padding: '1rem', lineHeight: '1.6' }} 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  placeholder="<h2>សរសេរ HTML របស់អ្នកនៅទីនេះ...</h2>"
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', color: 'black', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    modules={modules}
                    placeholder="ចាប់ផ្តើមសរសេរអត្ថបទរបស់អ្នក..."
                    style={{ height: 'calc(100% - 42px)', display: 'flex', flexDirection: 'column' }} 
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--modal-bg)' }}>
            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsEditorOpen(false)}>បោះបង់</button>
            <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: '150px' }}>{editingId ? 'រក្សាទុក (Update)' : 'ផ្សព្វផ្សាយ (Publish)'}</button>
          </div>
        </div>
      </div>
    )}

    {/* READ MODAL (Solid Background Fixed) */}
    {isReadModalOpen && selectedPost && (
      <div 
        onClick={() => setIsReadModalOpen(false)} // Exit when clicking outside
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      >
        <div 
          onClick={e => e.stopPropagation()} // Stop propagation to prevent closing
          className="glass-panel animate-fade-in post-read-modal" 
          style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg)', overflow: 'hidden' }}
        >
          
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--modal-bg)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               <h2 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.4rem' }}>{selectedPost.title}</h2>
               {/* Display Tags in Reader Header */}
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
                   onClick={(e) => {
                     toggleLike(e, selectedPost);
                     // Optimistically update selectedPost for the modal view
                     const currentLikes = selectedPost.likes || [];
                     const hasLiked = currentLikes.includes(userId);
                     setSelectedPost({
                       ...selectedPost,
                       likes: hasLiked ? currentLikes.filter((id: string) => id !== userId) : [...currentLikes, userId]
                     });
                   }} 
                   style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                   title={selectedPost.likes?.includes(userId) ? "ដកចេញពីការពេញចិត្ត" : "បន្ថែមទៅការពេញចិត្ត"}
                 >
                   {selectedPost.likes?.includes(userId) ? '❤️' : '🤍'}
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
                      body {
                        font-family: 'Kantumruy Pro', 'Inter', sans-serif;
                        margin: 0;
                        padding: 2.5rem;
                        color: #0f172a;
                        background-color: #ffffff;
                        line-height: 1.8;
                        font-size: 1.05rem;
                      }
                      img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; }
                      pre { background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; }
                      code { font-family: monospace; }
                      h1, h2, h3, h4 { color: #1e3a8a; margin-top: 1.5rem; margin-bottom: 1rem; }
                      p { margin-bottom: 1.2rem; }
                      ul, ol { padding-left: 2rem; margin-bottom: 1.5rem; }
                      li { margin-bottom: 0.5rem; }
                      blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #475569; font-style: italic; margin: 1.5rem 0; }
                      
                      /* Quill alignments */
                      .ql-align-center { text-align: center; }
                      .ql-align-right { text-align: right; }
                      .ql-align-justify { text-align: justify; }
                      
                      /* Custom styles if user pastes HTML buttons */
                      button {
                        cursor: pointer;
                      }
                    </style>
                  </head>
                  <body>
                    ${selectedPost.content}
                  </body>
                </html>
              `}
              title={selectedPost.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          
        </div>
      </div>
    )}

    <style dangerouslySetInnerHTML={{__html: `
      .ql-container { flex: 1; overflow-y: auto; font-family: inherit !important; font-size: 1rem !important; }
      .ql-editor { min-height: 300px; padding: 1.5rem !important; }
      .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc; padding: 12px !important; }
    `}} />
    </>
  );
}
