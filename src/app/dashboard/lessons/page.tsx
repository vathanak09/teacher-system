"use client";
function renderContentWithEmbeds(html: string, embeddedCodes?: string[]) {
  if (!html) return '';
  let result = html;
  if (embeddedCodes && embeddedCodes.length > 0) {
    embeddedCodes.forEach((code, i) => {
      result = result.replace(`[EMBED_${i}]`, `<div class="embed-wrapper" style="margin: 1.5rem 0; width: 100%; overflow: hidden;">${code}</div>`);
    });
  }
  return result;
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import AdvancedEditor from '@/components/AdvancedEditor';

export default function LessonsPage() {
  const router = useRouter();


  const [posts, setPosts] = useState<any[]>([]);
  
  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  
  const [role, setRole] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [userId, setUserId] = useState('');

  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [postCodeField, setPostCodeField] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTagsByGroup, setFilterTagsByGroup] = useState<Record<number, string>>({});

  // Tag & Tag Group lists
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [tagGroups, setTagGroups] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [embeddedCodes, setEmbeddedCodes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Read post state
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // --- Caching Logic ---
  useEffect(() => {
    const cached_searchQuery = sessionStorage.getItem('lessons_searchQuery');
    if (cached_searchQuery !== null) setSearchQuery(cached_searchQuery as any);
    const cached_viewMode = sessionStorage.getItem('lessons_viewMode');
    if (cached_viewMode !== null) setViewMode(cached_viewMode as any);
    const cached_filterAuthor = sessionStorage.getItem('lessons_filterAuthor');
    if (cached_filterAuthor !== null) setFilterAuthor(cached_filterAuthor as any);
    const cached_sortBy = sessionStorage.getItem('lessons_sortBy');
    if (cached_sortBy !== null) setSortBy(cached_sortBy as any);
  }, []);

  useEffect(() => { sessionStorage.setItem('lessons_searchQuery', searchQuery); }, [searchQuery]);
  useEffect(() => { sessionStorage.setItem('lessons_viewMode', viewMode); }, [viewMode]);
  useEffect(() => { sessionStorage.setItem('lessons_filterAuthor', filterAuthor); }, [filterAuthor]);
  useEffect(() => { sessionStorage.setItem('lessons_sortBy', sortBy); }, [sortBy]);
  // ----------------------

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
    const unsubscribe = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      const postsData: any[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ ...doc.data(), id: doc.id });
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
    setPostCodeField(generatePostCode());
    setEditingId(null);
    
    setIsEditorOpen(true);
  };

  const openEditModal = (post: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(post.title);
    setContent(post.content);
    setEmbeddedCodes(post.embeddedCodes || []);
    setSelectedTags(post.tags || []);
    setPostCodeField(post.postCode || '');
    setEditingId(post.id);
    
    setIsEditorOpen(true);
  };

  const openReadModal = (post: any) => { router.push(`/dashboard/view/${post.postCode || post.id}`); };

  const handleSave = async () => {
    if (!title) return alert("សូមបំពេញចំណងជើង!");
    if (!postCodeField) return alert("សូមបញ្ចូលលេខកូដ (ID)!");
    
    // Check for uniqueness across lessons and methodologies
    const lessonsRef = collection(db, 'lessons');
    const methodsRef = collection(db, 'methodologies');
    const q1 = query(lessonsRef, where('postCode', '==', postCodeField));
    const q2 = query(methodsRef, where('postCode', '==', postCodeField));
    
    try {
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const isDuplicate = [...snap1.docs, ...snap2.docs].some(doc => doc.id !== editingId);
      if (isDuplicate) {
        return alert("លេខកូដនេះមានរួចហើយ សូមប្រើលេខកូដផ្សេង!");
      }
    } catch (error) {
      console.error("Error checking post code uniqueness", error);
      return alert("មានបញ្ហាក្នុងការត្រួតពិនិត្យលេខកូដ!");
    }

    const postData: any = {
      title,
      content,
      author: authorName,
      date: new Date().toLocaleDateString('km-KH'),
      timestamp: Date.now(),
      embeddedCodes,
      authorId: userId,
      authorRole: role,
      tags: selectedTags,
      postCode: postCodeField
    };
    if (editingId) {
      await updateDoc(doc(db, 'lessons', editingId.toString()), postData);
    } else {
      postData.likes = [];
      await addDoc(collection(db, 'lessons'), postData);
    }
    setIsEditorOpen(false);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("តើអ្នកពិតជាចង់លុបមេរៀននេះមែនទេ?")) {
      deleteDoc(doc(db, 'lessons', id));
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
    
    updateDoc(doc(db, 'lessons', post.id), { likes: newLikes });
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

  const generatePostCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleShare = (e: React.MouseEvent, postCode: string | undefined, id: string) => {
    e.stopPropagation();
    const code = postCode || id;
    const url = `${window.location.origin}/p/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link ត្រូវបានចម្លង: ' + url);
    });
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
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = post.title.toLowerCase().includes(searchLower) || (post.postCode && post.postCode.toString().includes(searchLower));
      const matchesFilter = filterAuthor === 'all' || 
        (filterAuthor === 'mine' && post.author === authorName) ||
        (filterAuthor === 'others' && post.author !== authorName) ||
        (filterAuthor === 'favorites' && post.likes && post.likes.includes(userId));
      
      const matchesGroupTags = Object.keys(filterTagsByGroup).every(groupId => {
        const tagId = filterTagsByGroup[Number(groupId)];
        if (!tagId || tagId === 'all') return true;
        return post.tags && post.tags.includes(Number(tagId));
      });
      
      return matchesSearch && matchesFilter && matchesGroupTags;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return ((b.views || 0) + (b.likes?.length || 0)) - ((a.views || 0) + (a.likes?.length || 0));
      if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'km-KH');
      return 0;
    });

  return (
    <>
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>មេរៀន</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>កន្លែងចែករំលែកមេរៀន និងឯកសារសម្រាប់សិស្ស</p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + បង្កើតមេរៀនថ្មី
          </button>
        )}
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="ស្វែងរកចំណងជើងមេរៀន..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '1rem', background: 'var(--main-bg)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Dynamic Tag Group Filters */}
          {tagGroups.map(group => {
            const groupTags = availableTags.filter(tag => tag.groupId === group.id);
            if (groupTags.length === 0) return null;
            return (
              <select 
                key={group.id}
                className="input-field" 
                value={filterTagsByGroup[group.id] || 'all'} 
                onChange={e => setFilterTagsByGroup({...filterTagsByGroup, [group.id]: e.target.value})}
                style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
              >
                <option value="all">{group.name}ទាំងអស់</option>
                {groupTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            );
          })}

          <select 
            className="input-field" 
            value={filterAuthor} 
            onChange={e => setFilterAuthor(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
          >
            <option value="all">មេរៀនទាំងអស់</option>
            <option value="favorites">មេរៀនដែលខ្ញុំពេញចិត្ត</option>
            <option value="mine">មេរៀនរបស់ខ្ញុំ</option>
            <option value="others">មេរៀនអ្នកដទៃ</option>
          </select>

          <select 
            className="input-field" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)', paddingRight: '2rem' }}
          >
            <option value="popular">ពេញនិយមជាងគេ</option>
            <option value="newest">ថ្មីបំផុត</option>
            <option value="oldest">ចាស់បំផុត</option>
            <option value="title">តាមចំណងជើង (ក-ខ)</option>
          </select>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }} title="Grid View">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }} title="List View">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      {filteredAndSortedPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {searchQuery ? "រកមិនឃើញមេរៀនដែលត្រូវគ្នានឹងការស្វែងរកទេ!" : "មិនទាន់មានមេរៀនណាមួយនៅឡើយទេ!"}
        </div>
      ) : viewMode === 'list' ? (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', cursor: 'default' }}>សកម្មភាព</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>លេខកូដ</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>ចំណងជើង</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', cursor: 'default' }}>ស្លាក (Tags)</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>ប្រភេទ</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>អ្នកនិពន្ធ</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>កាលបរិច្ឆេទ</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>រកមិនឃើញទិន្នន័យឡើយ!</td>
                </tr>
              ) : (
                filteredAndSortedPosts.map(post => (
                  <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button onClick={() => openReadModal(post)} className="btn" style={{ padding: '0.35rem', background: 'var(--main-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} title="មើល">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        {(role === 'admin' || post.author === authorName) ? (
                          <>
                            <button onClick={(e) => openEditModal(post, e)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button onClick={(e) => handleDelete(post.id, e)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      #{post.postCode || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle', fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {post.title}
                        {post.views > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> {post.views}</span>}
                        {post.likes?.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> {post.likes.length}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {post.tags && post.tags.map((tagId: number) => {
                          const t = availableTags.find((tg: any) => tg.id === tagId);
                          if (!t) return null;
                          return (
                            <span key={tagId} style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30`, padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                              {t.name}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        មេរៀន
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {post.author}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      {post.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => (
            <div key={post.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden' }} onClick={() => openReadModal(post)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{post.title}</h3>
                  {userId && (
                    <button 
                      onClick={(e) => toggleLike(e, post)} 
                      className="btn" 
                      style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '1.25rem', color: post.likes?.includes(userId) ? '#ef4444' : '#ccc', lineHeight: 1 }} 
                      title={post.likes?.includes(userId) ? "ដកចេញពីការពេញចិត្ត" : "បន្ថែមទៅការពេញចិត្ត"}
                    >
                      {post.likes?.includes(userId) ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(244,63,94,0.3))" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>}
                    </button>
                  )}
                </div>
                
                {/* Render Tag Badges on Cards */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {post.postCode && (
                    <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      #{post.postCode}
                    </span>
                  )}
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

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1, marginBottom: '0.75rem' }}>
                  {getExcerpt(post.content)}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {post.author}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {post.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      {post.views || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      {post.likes?.length || 0}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => handleShare(e, post.postCode, post.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none' }} title="Share">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                  {(role === 'admin' || post.author === authorName) ? (
                    <>
                      <button onClick={(e) => openEditModal(post, e)} className="btn" style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={(e) => handleDelete(post.id, e)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </>
                  ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* EDITOR MODAL (Solid Background Fixed) */}
    {isEditorOpen && (
      <div 
        onClick={() => setIsEditorOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          className="glass-panel animate-fade-in post-editor-modal" 
          style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg)' }}
        >
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--modal-bg)' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{editingId ? 'កែប្រែមេរៀន' : 'សរសេរមេរៀនថ្មី'}</h2>
            
            
          </div>
          
          <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ចំណងជើងមេរៀន</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="វាយបញ្ចូលចំណងជើង..." 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--main-bg)' }}
                />
              </div>
              <div style={{ width: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>លេខកូដ (ID)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={postCodeField}
                  onChange={e => setPostCodeField(e.target.value)}
                  placeholder="XXXX"
                  style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--main-bg)' }}
                />
              </div>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ខ្លឹមសារមេរៀន</label>
              <AdvancedEditor 
                content={content} 
                onChange={setContent} 
                embeddedCodes={embeddedCodes} 
                onEmbeddedCodesChange={setEmbeddedCodes} 
                placeholder="សរសេរទីនេះ..." 
              />
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
             <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem' }}>
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