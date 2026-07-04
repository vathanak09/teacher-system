import sys

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. State additions
    old_state = "const [searchQuery, setSearchQuery] = useState('');"
    new_state = """const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [postCodeField, setPostCodeField] = useState('');"""
  
    # 2. Add generator and Share copy function
    old_helper = "// Helper function to strip HTML for preview"
    new_helper = """const generatePostCode = () => {
    return 'M-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleShare = (e: React.MouseEvent, postCode: string | undefined, id: string) => {
    e.stopPropagation();
    const code = postCode || id;
    const url = `${window.location.origin}/p/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link ត្រូវបានចម្លង: ' + url);
    });
  };

  // Helper function to strip HTML for preview"""

    # 3. openCreateModal
    old_open_create = """const openCreateModal = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setEditingId(null);"""
    new_open_create = """const openCreateModal = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setPostCodeField(generatePostCode());
    setEditingId(null);"""

    # 4. openEditModal
    old_open_edit = """const openEditModal = (post: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(post.title);
    setContent(post.content);
    setSelectedTags(post.tags || []);
    setEditingId(post.id);"""
    new_open_edit = """const openEditModal = (post: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(post.title);
    setContent(post.content);
    setSelectedTags(post.tags || []);
    setPostCodeField(post.postCode || '');
    setEditingId(post.id);"""

    # 5. handleSave
    old_save = """const postData = {
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
    }"""
    
    new_save = """const postData: any = {
      title,
      content,
      author: authorName,
      date: new Date().toLocaleDateString('km-KH'),
      timestamp: Date.now(),
      editorMode,
      tags: selectedTags,
      postCode: postCodeField
    };
    if (editingId) {
      updateDoc(doc(db, 'methodologies', editingId.toString()), postData);
    } else {
      postData.likes = [];
      addDoc(collection(db, 'methodologies'), postData);
    }"""
    
    # 6. Grid/List Toggle
    old_toggle = """<option value="title">តាមចំណងជើង (ក-ខ)</option>
          </select>
        </div>
      </div>"""
    new_toggle = """<option value="title">តាមចំណងជើង (ក-ខ)</option>
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
      </div>"""
      
    # 7. Post Card Rendering (Grid vs List + Share Button)
    old_grid = """<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => ("""
    new_grid = """<div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: viewMode === 'grid' ? 'row' : 'column', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => ("""
          
    # 8. Post Actions
    old_actions = """                  {(role === 'admin' || post.author === authorName) ? (
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
                  )}"""
    new_actions = """                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  </div>"""

    # 9. Add Input for postCode in Editor Modal
    old_title_input = """            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ចំណងជើង</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="វាយបញ្ចូលចំណងជើង..." 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--main-bg)' }}
              />
            </div>"""
    new_title_input = """            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                  placeholder="M-XXXXXX"
                  style={{ fontSize: '1.1rem', padding: '1rem', background: 'var(--main-bg)' }}
                />
              </div>
            </div>"""

    replacements = [
        (old_state, new_state, "state"),
        (old_helper, new_helper, "helper methods"),
        (old_open_create, new_open_create, "openCreateModal"),
        (old_open_edit, new_open_edit, "openEditModal"),
        (old_save, new_save, "handleSave"),
        (old_toggle, new_toggle, "toggle buttons"),
        (old_grid, new_grid, "grid wrapper"),
        (old_actions, new_actions, "post actions"),
        (old_title_input, new_title_input, "editor title field")
    ]

    for old, new, desc in replacements:
        if old in code:
            code = code.replace(old, new)
        else:
            print(f"Failed to find {desc} in {filepath}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Patched {filepath}")

patch_file("src/app/dashboard/methodologies/page.tsx")
