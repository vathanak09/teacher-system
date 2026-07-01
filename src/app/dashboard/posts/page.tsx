"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function PostsManagementPage() {
  const router = useRouter();
  const [lessonsPosts, setLessonsPosts] = useState<any[]>([]);
  const [methodsPosts, setMethodsPosts] = useState<any[]>([]);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCodeField, setPostCodeField] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [editorMode, setEditorMode] = useState<'word' | 'html'>('word');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<'lessons' | 'methodologies'>('lessons');
  
  // View Modal State


  const [role, setRole] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => { if (typeof window !== 'undefined') return sessionStorage.getItem('posts_searchQuery') || ''; return ''; });
  const [filterType, setFilterType] = useState(() => { if (typeof window !== 'undefined') return sessionStorage.getItem('posts_filterType') || 'all'; return 'all'; });
  const [filterTag, setFilterTag] = useState(() => { if (typeof window !== 'undefined') return sessionStorage.getItem('posts_filterTag') || 'all'; return 'all'; });
  
  // Sorting State
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [tagGroups, setTagGroups] = useState<any[]>([]);

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);

    if (currentRole !== 'admin') return; // Only admin can access

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appTags) setAvailableTags(data.appTags);
        if (data.appTagGroups) setTagGroups(data.appTagGroups);
      }
    });

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, collectionName: 'lessons', ...doc.data() }));
      setLessonsPosts(data);
    });

    const unsubMethods = onSnapshot(collection(db, 'methodologies'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, collectionName: 'methodologies', ...doc.data() }));
      setMethodsPosts(data);
    });

    return () => {
      unsubSettings();
      unsubLessons();
      unsubMethods();
    };
  }, []);

  const handleDelete = async (id: string, collName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("តើអ្នកពិតជាចង់លុបផុសនេះមែនទេ?")) {
      await deleteDoc(doc(db, collName, id));
    }
  };

  const openEditModal = (post: any) => {
    setTitle(post.title);
    setContent(post.content);
    setSelectedTags(post.tags || []);
    setPostCodeField(post.postCode || '');
    setEditingId(post.id);
    setEditingCollection(post.collectionName);
    setEditorMode(post.editorMode || 'word');
    setIsEditorOpen(true);
  };

  const openReadModal = (post: any) => { router.push(`/dashboard/view/${post.postCode || post.id}`); };

  const handleSave = async () => {
    if (!title) return alert("សូមបញ្ចូលចំណងជើង!");
    if (!postCodeField) return alert("សូមបញ្ចូលលេខកូដ (ID)!");
    
    // Check uniqueness across collections
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
      editorMode,
      tags: selectedTags,
      postCode: postCodeField
    };

    if (editingId) {
      await updateDoc(doc(db, editingCollection, editingId), postData);
    }
    
    setIsEditorOpen(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <svg style={{marginLeft: '4px', opacity: 0.3}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>;
    }
    if (sortDirection === 'asc') {
      return <svg style={{marginLeft: '4px'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>;
    }
    return <svg style={{marginLeft: '4px'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>;
  };


  useEffect(() => {
    sessionStorage.setItem('posts_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('posts_filterType', filterType);
  }, [filterType]);

  useEffect(() => {
    sessionStorage.setItem('posts_filterTag', filterTag);
  }, [filterTag]);
  const allPosts = [...lessonsPosts, ...methodsPosts];

  const postCodeCounts = allPosts.reduce((acc: any, post) => {
    if (post.postCode) {
      acc[post.postCode] = (acc[post.postCode] || 0) + 1;
    }
    return acc;
  }, {});

  const filteredAndSortedPosts = allPosts
    .filter(post => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = post.title.toLowerCase().includes(searchLower) || (post.postCode && post.postCode.toString().includes(searchLower));
      const matchesType = filterType === 'all' || post.collectionName === filterType;
      const matchesTag = filterTag === 'all' || (post.tags && post.tags.includes(Number(filterTag)));
      return matchesSearch && matchesType && matchesTag;
    })
    .sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });


  useEffect(() => {
    sessionStorage.setItem('posts_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('posts_filterType', filterType);
  }, [filterType]);

  useEffect(() => {
    sessionStorage.setItem('posts_filterTag', filterTag);
  }, [filterTag]);
  if (role !== 'admin') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>អ្នកគ្មានសិទ្ធិចូលមើលទំព័រនេះទេ។</div>;
  }

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', 
    color: 'var(--text-secondary)', 
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none'
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>គ្រប់គ្រងផុស</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>ទំព័រសម្រាប់ Admin គ្រប់គ្រងមេរៀន និង វិធីសាស្ត្រទាំងអស់</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="ស្វែងរកតាមចំណងជើង ឬ លេខកូដ..." 
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
            <option value="all">ប្រភេទទាំងអស់</option>
            <option value="lessons">មេរៀន</option>
            <option value="methodologies">វិធីសាស្ត្រ</option>
          </select>
          <select 
            className="input-field" 
            value={filterTag} 
            onChange={e => setFilterTag(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)' }}
          >
            <option value="all">ស្លាកទាំងអស់</option>
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ ...thStyle, cursor: 'default' }}>សកម្មភាព</th>
              <th style={thStyle} onClick={() => handleSort('postCode')}>
                <div style={{display: 'flex', alignItems: 'center'}}>លេខកូដ {renderSortIcon('postCode')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('collectionName')}>
                <div style={{display: 'flex', alignItems: 'center'}}>ប្រភេទ {renderSortIcon('collectionName')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('title')}>
                <div style={{display: 'flex', alignItems: 'center'}}>ចំណងជើង {renderSortIcon('title')}</div>
              </th>
              <th style={{ ...thStyle, cursor: 'default' }}>ស្លាក (Tags)</th>
              <th style={thStyle} onClick={() => handleSort('author')}>
                <div style={{display: 'flex', alignItems: 'center'}}>អ្នកនិពន្ធ {renderSortIcon('author')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('timestamp')}>
                <div style={{display: 'flex', alignItems: 'center'}}>កាលបរិច្ឆេទ {renderSortIcon('timestamp')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPosts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  រកមិនឃើញទិន្នន័យឡើយ!
                </td>
              </tr>
            ) : (
              filteredAndSortedPosts.map(post => (
                <tr key={post.id + post.collectionName} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button onClick={() => openReadModal(post)} className="btn" style={{ padding: '0.35rem', background: 'var(--main-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} title="មើល">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      <button onClick={() => openEditModal(post)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }} title="កែប្រែ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={(e) => handleDelete(post.id, post.collectionName, e)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="លុប">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: postCodeCounts[post.postCode] > 1 ? 'var(--danger)' : 'var(--accent-primary)' }}>
                    #{post.postCode || 'N/A'}
                    {postCodeCounts[post.postCode] > 1 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>ស្ទួន</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      background: post.collectionName === 'lessons' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: post.collectionName === 'lessons' ? '#3b82f6' : '#ef4444', 
                      padding: '0.15rem 0.4rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {post.collectionName === 'lessons' ? 'មេរៀន' : 'វិធីសាស្ត្រ'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.title}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap' }}>
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
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                    {post.author}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                    {new Date(post.timestamp).toLocaleDateString('km-KH')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>កែប្រែផុស</h2>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                របៀបសរសេរ៖ {editorMode === 'word' ? 'Word Style' : 'HTML Style'}
              </span>
            </div>
            
            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ចំណងជើង</label>
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

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>ស្លាកពាក្យ (Tags)</label>
                {availableTags.length === 0 ? (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>មិនទាន់មានស្លាកពាក្យនៅឡើយទេ។ (គ្រប់គ្រងស្លាកពាក្យក្នុងទំព័រ Settings)</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--main-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedTags(prev => prev.filter(id => id !== tag.id));
                                    } else {
                                      setSelectedTags(prev => [...prev, tag.id]);
                                    }
                                  }}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '20px',
                                    border: isSelected ? `1.5px solid ${tag.color}` : '1.5px solid var(--border-color)',
                                    background: isSelected ? `${tag.color}15` : 'transparent',
                                    color: isSelected ? tag.color : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: isSelected ? 600 : 500,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>អត្ថបទ</label>
                {editorMode === 'word' ? (
                  <div style={{ background: 'var(--main-bg)', borderRadius: '8px', overflow: 'hidden' }}>
                    <ReactQuill 
                      theme="snow" 
                      value={content} 
                      onChange={setContent}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'align': [] }],
                          ['link', 'image', 'video'],
                          ['clean']
                        ],
                      }}
                      style={{ height: '350px', background: 'var(--main-bg)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                ) : (
                  <textarea 
                    className="input-field" 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    style={{ height: '350px', fontFamily: 'monospace', fontSize: '1rem', background: 'var(--main-bg)' }}
                    placeholder="<p>សរសេរកូដ HTML នៅទីនេះ...</p>"
                  />
                )}
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--modal-bg)' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsEditorOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: '150px' }}>រក្សាទុក (Update)</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
