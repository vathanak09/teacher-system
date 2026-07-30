"use client";
import React, { useState, useEffect } from 'react';
import { resourceService } from '@/services/db';

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentUser, setCurrentUser] = useState({ id: '', role: '', name: '' });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#6366f1'); // Default primary color

  const colorOptions = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
  ];

  useEffect(() => {
    // Get user info
    const role = localStorage.getItem('userRole') || '';
    const id = localStorage.getItem('userId') || '';
    const name = localStorage.getItem('userName') || '';
    setCurrentUser({ id, role, name });

    // Fetch resources
    const unsub = resourceService.subscribeAll(data => {
      // Sort by createdAt descending locally if no order specified
      const sorted = [...data].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setResources(sorted);
    });

    return () => unsub();
  }, []);

  const handleOpenModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setColor('#6366f1');
    setIsModalOpen(true);
  };

  const handleEdit = (res: any) => {
    setEditingId(res.id);
    setTitle(res.title || '');
    setDescription(res.description || '');
    setUrl(res.url || '');
    setColor(res.color || '#6366f1');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    
    setIsSubmitting(true);
    try {
      // Ensure URL has http:// or https://
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      if (editingId) {
        // Update existing
        await resourceService.update(editingId, {
          title,
          description,
          url: formattedUrl,
          color,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add new
        const newResource = {
          title,
          description,
          url: formattedUrl,
          color,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          createdAt: new Date().toISOString()
        };
        await resourceService.add(newResource);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('មានបញ្ហាក្នុងការរក្សាទុកធនធាន។');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, createdBy: string) => {
    // Only admin or the creator can delete
    if (currentUser.role !== 'admin' && currentUser.id !== createdBy) {
      alert('អ្នកគ្មានសិទ្ធិលុបធនធាននេះទេ!');
      return;
    }
    
    if (confirm('តើអ្នកពិតជាចង់លុបធនធាននេះមែនទេ?')) {
      try {
        await resourceService.delete(id);
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('មានបញ្ហាក្នុងការលុបធនធាន។');
      }
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-primary)' }}>ធនធាន (Resources)</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
            បណ្តុំគេហទំព័រ និងឯកសារជំនួយសម្រាប់ការបង្រៀន
          </p>
        </div>
        
        {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
          <button onClick={handleOpenModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            បន្ថែមធនធានថ្មី
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '1rem' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          <h3 style={{ color: 'var(--text-secondary)', margin: 0 }}>មិនទាន់មានធនធានទេ</h3>
          <p style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>សូមចុចប៊ូតុង "បន្ថែមធនធានថ្មី" ដើម្បីចែករំលែក Website ។</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {resources.map(res => (
            <div key={res.id} style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderTop: `4px solid ${res.color || '#6366f1'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }} className="resource-card">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `${res.color || '#6366f1'}15`, color: res.color || '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                
                {(currentUser.role === 'admin' || currentUser.id === res.createdBy) && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(res)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                      title="កែប្រែធនធាននេះ"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(res.id, res.createdBy)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                      title="លុបធនធាននេះ"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                )}
              </div>
              
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: 1.4 }}>
                {res.title}
              </h3>
              
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                {res.description || 'មិនមានការពិពណ៌នា...'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {res.createdByName || 'មិនស្គាល់'}
                </span>
                <a 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: `${res.color || '#6366f1'}15`, color: res.color || 'var(--primary-color)', padding: '0.5rem 1rem', textDecoration: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  ចូលមើល
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Resource Modal */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)}  style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div onClick={(e) => e.stopPropagation()}  style={{
            background: 'var(--modal-bg)',
            width: '100%', maxWidth: '500px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {editingId ? 'កែប្រែធនធាន' : 'បន្ថែមធនធានថ្មី'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>ចំណងជើង <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="ឧ. គេហទំព័រ Kahoot!"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>ការពិពណ៌នា</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field"
                  placeholder="សរសេរពណ៌នាខ្លីៗពីអត្ថប្រយោជន៍ ឬរបៀបប្រើប្រាស់..."
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>តំណរភ្ជាប់ (Link URL) <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://kahoot.com"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>ជ្រើសរើសពណ៌កាត</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {colorOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: c, border: 'none', cursor: 'pointer',
                        boxShadow: color === c ? `0 0 0 3px var(--panel-bg), 0 0 0 5px ${c}` : 'none',
                        transition: 'all 0.1s'
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, padding: '0.75rem' }}>
                  បោះបង់
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', background: color, borderColor: color }}>
                  {isSubmitting ? 'កំពុងរក្សាទុក...' : (editingId ? 'កែប្រែ' : 'រក្សាទុក')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .resource-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important;
        }
      `}</style>
    </div>
  );
}
