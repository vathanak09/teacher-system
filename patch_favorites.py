import sys

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. State addition
    old_state = "const [searchQuery, setSearchQuery] = useState('');"
    new_state = """const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');"""
  
    # 2. handleShare
    old_excerpt = """const getExcerpt = (html: string) => {"""
    new_excerpt = """const handleShare = (e: React.MouseEvent, postCode: string | undefined, id: string) => {
    e.stopPropagation();
    const code = postCode || id;
    const url = `${window.location.origin}/p/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link ត្រូវបានចម្លង: ' + url);
    });
  };

  const getExcerpt = (html: string) => {"""

    # 3. View Mode Toggle
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

    # 4. Post Card Rendering
    old_grid = """<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => ("""
    new_grid = """<div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: viewMode === 'grid' ? 'row' : 'column', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none', gap: '1.5rem' }}>
          {filteredAndSortedPosts.map(post => ("""

    # 5. Share Button inside actions
    old_actions = """<div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{post.title}</h3>
                  {userId && (
                    <button 
                      onClick={(e) => toggleLike(e, post)} 
                      className="btn" 
                      style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '1.25rem', color: post.likes?.includes(userId) ? '#ef4444' : '#ccc', lineHeight: 1 }} 
                      title={post.likes?.includes(userId) ? "ដកចេញពីការពេញចិត្ត" : "បន្ថែមទៅការពេញចិត្ត"}
                    >"""
    new_actions = """<div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{post.title}</h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={(e) => handleShare(e, post.postCode, post.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none' }} title="Share">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                    {userId && (
                      <button 
                        onClick={(e) => toggleLike(e, post)} 
                        className="btn" 
                        style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '1.25rem', color: post.likes?.includes(userId) ? '#ef4444' : '#ccc', lineHeight: 1 }} 
                        title={post.likes?.includes(userId) ? "ដកចេញពីការពេញចិត្ត" : "បន្ថែមទៅការពេញចិត្ត"}
                      >"""

    # Fix the matching of button closing tag
    old_button_close = """                    )}
                    </button>
                  )}
                </div>"""
    new_button_close = """                    )}
                      </button>
                    )}
                  </div>
                </div>"""

    replacements = [
        (old_state, new_state, "state"),
        (old_excerpt, new_excerpt, "excerpt/share method"),
        (old_toggle, new_toggle, "toggle buttons"),
        (old_grid, new_grid, "grid wrapper"),
        (old_actions, new_actions, "post actions opening"),
        (old_button_close, new_button_close, "post actions closing")
    ]

    for old, new, desc in replacements:
        if old in code:
            code = code.replace(old, new)
        else:
            print(f"Failed to find {desc} in {filepath}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Patched {filepath}")

patch_file("src/app/dashboard/favorites/page.tsx")
