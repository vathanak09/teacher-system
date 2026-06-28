"use client";
import { useEffect, useState } from 'react';

const icons = [
  { id: 'book', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
  { id: 'clipboard', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> },
  { id: 'users', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { id: 'calendar', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
  { id: 'chart', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg> },
  { id: 'file', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> },
  { id: 'cap', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> },
  { id: 'star', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
  { id: 'link', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> }
];

const colors = [
  { id: 'blue', bg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
  { id: 'green', bg: 'linear-gradient(135deg, #10b981, #3b82f6)' },
  { id: 'orange', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { id: 'purple', bg: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
  { id: 'pink', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { id: 'teal', bg: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' },
];

export default function ScoresPage() {
  const [role, setRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book');
  const [selectedColor, setSelectedColor] = useState('blue');

  const defaultLinks = [
    { id: 1, title: 'បញ្ចូលពិន្ទុ ថ្នាក់ទី១២A', url: '#', icon: 'book', color: 'blue' },
    { id: 2, title: 'បញ្ចូលពិន្ទុ ថ្នាក់ទី១១B', url: '#', icon: 'clipboard', color: 'purple' }
  ];

  const [links, setLinks] = useState(defaultLinks);

  useEffect(() => { 
    setRole(localStorage.getItem('userRole') || ''); 
    const savedLinks = localStorage.getItem('scoreLinks');
    if (savedLinks) {
      try {
        setLinks(JSON.parse(savedLinks));
      } catch (e) {}
    }
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setNewTitle('');
    setNewUrl('');
    setSelectedIcon('book');
    setSelectedColor('blue');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, link: any) => {
    e.preventDefault(); // Prevent navigating to the URL
    setEditId(link.id);
    setNewTitle(link.title);
    setNewUrl(link.url);
    setSelectedIcon(link.icon);
    setSelectedColor(link.color || 'blue');
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if(confirm('តើអ្នកពិតជាចង់លុបទម្រង់នេះមែនទេ?')) {
      const updatedLinks = links.filter(l => l.id !== id);
      setLinks(updatedLinks);
      localStorage.setItem('scoreLinks', JSON.stringify(updatedLinks));
    }
  };

  const handleSave = () => {
    if (newTitle && newUrl) {
      let updatedLinks;
      if (editId) {
        updatedLinks = links.map(l => 
          l.id === editId ? { ...l, title: newTitle, url: newUrl, icon: selectedIcon, color: selectedColor } : l
        );
      } else {
        updatedLinks = [...links, { id: Date.now(), title: newTitle, url: newUrl, icon: selectedIcon, color: selectedColor }];
      }
      setLinks(updatedLinks);
      localStorage.setItem('scoreLinks', JSON.stringify(updatedLinks));
      setIsModalOpen(false);
    } else {
      alert('សូមបំពេញ ចំណងជើង និងតំណលីងអោយបានត្រឹមត្រូវ!');
    }
  };

  const renderIcon = (iconId: string) => {
    const iconObj = icons.find(i => i.id === iconId);
    return iconObj ? iconObj.svg : icons[0].svg;
  };

  const renderColor = (colorId: string) => {
    const colorObj = colors.find(c => c.id === colorId);
    return colorObj ? colorObj.bg : colors[0].bg;
  };

  return (
    <>
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>បញ្ចូលពិន្ទុសិស្ស</h1>
        {role === 'admin' && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            + បន្ថែមទម្រង់បញ្ចូលពិន្ទុ
          </button>
        )}
      </div>
      
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។ នេះជាតំណភ្ជាប់ទៅកាន់កម្មវិធីបញ្ចូលពិន្ទុ។
      </p>

      <div className="grid-cards">
        {links.map(link => (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', position: 'relative' }}>
            <div className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', height: '100%', position: 'relative' }}>
              
              {role === 'admin' && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={(e) => handleOpenEdit(e, link)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, link.id)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--danger)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              )}

              <div style={{ background: renderColor(link.color || 'blue'), color: 'white', padding: '1.25rem', borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}>
                {renderIcon(link.icon)}
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{link.title}</h3>
              <span style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: 500 }}>ចូលទៅកាន់កម្មវិធី &rarr;</span>
            </div>
          </a>
        ))}
      </div>
    </div>

    {isModalOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '2rem', background: 'var(--main-bg)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>
            {editId ? 'កែប្រែទម្រង់បញ្ចូលពិន្ទុ' : 'បន្ថែមទម្រង់បញ្ចូលពិន្ទុថ្មី'}
          </h2>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ចំណងជើង</label>
            <input 
              type="text" 
              className="input-field" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              placeholder="ឧ. បញ្ចូលពិន្ទុ ថ្នាក់ទី៩C" 
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>តំណលីង (URL)</label>
            <input 
              type="url" 
              className="input-field" 
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)} 
              placeholder="https://..." 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ពណ៌ (Color)</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <div 
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: color.bg,
                    border: selectedColor === color.id ? '3px solid var(--text-primary)' : '2px solid transparent',
                    boxShadow: 'var(--shadow-sm)',
                    transform: selectedColor === color.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ជ្រើសរើស Logo / Icon</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {icons.map(icon => (
                <div 
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedIcon === icon.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: selectedIcon === icon.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedIcon === icon.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {icon.svg}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              className="btn" 
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
              onClick={() => setIsModalOpen(false)}
            >
              បោះបង់
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              រក្សាទុក
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
