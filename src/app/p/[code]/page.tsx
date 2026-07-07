"use client";

import { useEffect, useState, use } from 'react';
import { settingsService, lessonService, methodologyService } from '@/services/db';

export default function PublicPostPage(props: { params: Promise<{ code: string }> }) {
  const params = use(props.params);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'));
    }
  }, []);

  useEffect(() => {
    // 1. Fetch tags from settings
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getById('global');
        if (data && data.appTags) setAvailableTags(data.appTags);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    fetchSettings();

    // 2. Fetch the post across collections
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      
      const collectionsToSearch = ['lessons', 'methodologies'];
      let foundPost = null;

      try {
        const checkColl = async (service: any, collName: string) => {
          let docs = await service.getByQuery('postCode', '==', params.code as string);
          if (docs.length > 0) return { ...docs[0], id: docs[0].id, collectionName: collName };
          let d = await service.getById(params.code as string);
          if (d) return { ...d, id: d.id, collectionName: collName };
          return null;
        };

        foundPost = await checkColl(lessonService, 'lessons');
        if (!foundPost) {
          foundPost = await checkColl(methodologyService, 'methodologies');
        }

        if (foundPost) {
          setPost(foundPost);
        } else {
          setError("មិនអាចស្វែងរកទិន្នន័យឃើញទេ។ ផុសប្រហែលជាត្រូវបានលុប ឬលេខកូដមិនត្រឹមត្រូវ។");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.code]);

  const handleLike = async () => {
    if (!userId || !post) {
      alert("សូមចូលគណនីជាមុនសិន ដើម្បីអាចបញ្ចេញមតិ ឬ Like បាន!");
      return;
    }
    const currentLikes = post.likes || [];
    const hasLiked = currentLikes.includes(userId);
    const newLikes = hasLiked 
      ? currentLikes.filter((id: string) => id !== userId)
      : [...currentLikes, userId];
    
    // Update local state optimistically
    setPost({ ...post, likes: newLikes });
    
    // Update backend
    try {
      if (post.collectionName === 'lessons') {
        await lessonService.update(post.id, { likes: newLikes });
      } else {
        await methodologyService.update(post.id, { likes: newLikes });
      }
    } catch (err) {
      console.error("Error updating likes", err);
      setPost({ ...post, likes: currentLikes });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>កំពុងទាញយកទិន្នន័យ...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color)" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>រកមិនឃើញទេ!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleDateString('km-KH') : '';

  return (
    <div className="public-page-wrapper" style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        
        {/* Header */}
        <div className="dashboard-header-panel" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
          
          <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', margin: '0 0 1rem 0', color: 'var(--text-primary)', lineHeight: 1.3, paddingRight: '2.5rem' }}>
            {post.title}
          </h1>

          <button 
            onClick={handleLike} 
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: post.likes?.includes(userId) ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-main)', border: '1px solid var(--border-color)', cursor: 'pointer', color: post.likes?.includes(userId) ? '#f43f5e' : 'var(--text-secondary)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
            title={post.likes?.includes(userId) ? "Unlike" : "Like"}
          >
            {post.likes?.includes(userId) ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(244,63,94,0.3))" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            )}
          </button>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {post.postCode && (
              <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                ID: {post.postCode}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {post.author || 'Admin'}
            </div>
            
            {dateStr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {dateStr}
              </div>
            )}

            {post.tags && post.tags.length > 0 && post.tags.map((tagId: number) => {
              const tagObj = availableTags.find((t: any) => t.id === tagId);
              return (
                <span key={tagId} style={{ background: tagObj ? `${tagObj.color}15` : 'rgba(0,0,0,0.05)', color: tagObj?.color || 'var(--text-secondary)', border: `1px solid ${tagObj ? tagObj.color + '30' : 'var(--border-color)'}`, padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 }}>
                  {tagObj ? tagObj.name : `Tag ${tagId}`}
                </span>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="post-content-container" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
          {post.editorMode === 'html' ? (
            <iframe 
              srcDoc={`<head><meta name="viewport" content="width=device-width, initial-scale=1"><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&family=Battambang:wght@100;300;400;700;900&family=Suwannaphum:wght@100;300;400;700;900&family=Hanuman:wght@100;300;400;700;900&display=swap'); body { font-family: 'Kantumruy Pro', 'Battambang', 'Inter', sans-serif; }</style></head>${post.content}`}
              style={{ width: '100%', minHeight: '85vh', border: 'none', background: 'transparent' }} 
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="HTML Content"
            />
          ) : (
            <div className="ql-editor rich-text-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          )}
        </div>
        
      </div>
    </div>
  );
}
