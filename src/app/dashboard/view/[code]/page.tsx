"use client";

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import 'react-quill-new/dist/quill.snow.css';

export default function DashboardPostViewPage(props: { params: Promise<{ code: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch tags from settings
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appTags) setAvailableTags(data.appTags);
        }
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
        for (const coll of collectionsToSearch) {
          // First check by postCode
          const q = query(collection(db, coll), where('postCode', '==', params.code));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0];
            foundPost = { id: docData.id, collectionName: coll, ...docData.data() };
            break;
          }

          // If not found by postCode, check if the code matches document ID
          const docRef = doc(db, coll, params.code);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundPost = { id: docSnap.id, collectionName: coll, ...docSnap.data() };
            break;
          }
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

  if (loading) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>កំពុងទាញយកទិន្នន័យ...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>រកមិនឃើញទេ!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => router.back()} className="btn">ត្រលប់ក្រោយ</button>
        </div>
      </div>
    );
  }

  const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleDateString('km-KH') : '';

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Back button */}
      <button 
        onClick={() => router.back()} 
        className="btn" 
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--main-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        ត្រលប់ក្រោយ
      </button>

      {/* Header */}
      <div className="glass-panel dashboard-header-panel">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {post.title}
          </h1>
          {post.postCode && (
            <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              ID: {post.postCode}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {post.author || 'Admin'}
          </div>
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {dateStr}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              background: post.collectionName === 'lessons' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
              color: post.collectionName === 'lessons' ? '#3b82f6' : '#ef4444', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              fontWeight: 600 
            }}>
              {post.collectionName === 'lessons' ? 'មេរៀន' : 'វិធីសាស្ត្រ'}
            </span>
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {post.tags.map((tagId: number) => {
              const tagObj = availableTags.find((t: any) => t.id === tagId);
              return (
                <span key={tagId} style={{ background: tagObj ? `${tagObj.color}15` : 'rgba(0,0,0,0.05)', color: tagObj?.color || 'var(--text-secondary)', border: `1px solid ${tagObj ? tagObj.color + '30' : 'var(--border-color)'}`, padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 500 }}>
                  {tagObj ? tagObj.name : `Tag ${tagId}`}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="glass-panel post-content-container">
        {post.editorMode === 'html' ? (
          <iframe 
            srcDoc={`<head><meta name="viewport" content="width=device-width, initial-scale=1"><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&family=Battambang:wght@100;300;400;700;900&family=Suwannaphum:wght@100;300;400;700;900&family=Hanuman:wght@100;300;400;700;900&display=swap'); body { font-family: 'Kantumruy Pro', 'Battambang', 'Inter', sans-serif; }</style></head>${post.content}`}
            style={{ width: '100%', minHeight: '85vh', border: 'none', background: 'transparent' }} 
            sandbox="allow-scripts allow-same-origin allow-popups"
            title="HTML Content"
          />
        ) : (
          <div 
            className="ql-editor rich-text-content" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            style={{ padding: 0, lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-primary)' }} 
          />
        )}
      </div>
      
    </div>
  );
}
