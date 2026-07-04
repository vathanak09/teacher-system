import sys

def patch_page(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Add filter by Tag state
    old_state = "const [filterType, setFilterType] = useState('all');"
    new_state = """const [filterType, setFilterType] = useState('all');
  const [filterTag, setFilterTag] = useState('all');"""
    if old_state in code:
        code = code.replace(old_state, new_state)

    # 2. Add Tag filter UI
    old_filter_ui = """<select 
            className="input-field" 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            style={{ width: 'auto', background: 'var(--main-bg)' }}
          >
            <option value="all">ប្រភេទទាំងអស់</option>
            <option value="lessons">មេរៀន</option>
            <option value="methodologies">វិធីសាស្ត្រ</option>
          </select>"""
    new_filter_ui = old_filter_ui + """
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
          </select>"""
    if old_filter_ui in code:
        code = code.replace(old_filter_ui, new_filter_ui)

    # 3. Update filtering logic + postCode counts
    old_filter_logic = """const allPosts = [...lessonsPosts, ...methodsPosts];

  const filteredAndSortedPosts = allPosts
    .filter(post => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = post.title.toLowerCase().includes(searchLower) || (post.postCode && post.postCode.toString().includes(searchLower));
      const matchesType = filterType === 'all' || post.collectionName === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));"""
    
    new_filter_logic = """const allPosts = [...lessonsPosts, ...methodsPosts];

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
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));"""
    if old_filter_logic in code:
        code = code.replace(old_filter_logic, new_filter_logic)

    # 4. Update Table header
    old_th = """<th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ចំណងជើង</th>"""
    new_th = """<th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ចំណងជើង</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ស្លាក (Tags)</th>"""
    if old_th in code:
        code = code.replace(old_th, new_th)

    # 5. Update Table Body & Padding
    old_tr = """<td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    #{post.postCode || 'N/A'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: post.collectionName === 'lessons' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: post.collectionName === 'lessons' ? '#3b82f6' : '#ef4444', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {post.collectionName === 'lessons' ? 'មេរៀន' : 'វិធីសាស្ត្រ'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {post.title}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {post.author}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(post.timestamp).toLocaleDateString('km-KH')}
                  </td>
                  <td style={{ padding: '1rem' }}>"""
                  
    new_tr = """<td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: postCodeCounts[post.postCode] > 1 ? 'var(--danger)' : 'var(--accent-primary)' }}>
                    #{post.postCode || 'N/A'}
                    {postCodeCounts[post.postCode] > 1 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>ស្ទួន</span>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <span style={{ 
                      background: post.collectionName === 'lessons' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: post.collectionName === 'lessons' ? '#3b82f6' : '#ef4444', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {post.collectionName === 'lessons' ? 'មេរៀន' : 'វិធីសាស្ត្រ'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 1rem', fontWeight: 500 }}>
                    {post.title}
                  </td>
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '200px' }}>
                      {post.tags && post.tags.map((tagId: number) => {
                        const t = availableTags.find((tg: any) => tg.id === tagId);
                        if (!t) return null;
                        return (
                          <span key={tagId} style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30`, padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                            {t.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                    {post.author}
                  </td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                    {new Date(post.timestamp).toLocaleDateString('km-KH')}
                  </td>
                  <td style={{ padding: '0.5rem 1rem' }}>"""
                  
    if old_tr in code:
        code = code.replace(old_tr, new_tr)

    # Change all `padding: '1rem'` inside th to `padding: '0.75rem 1rem'`
    code = code.replace("padding: '1rem', color: 'var(--text-secondary)'", "padding: '0.75rem 1rem', color: 'var(--text-secondary)'")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Patched " + filepath)

patch_page("src/app/dashboard/posts/page.tsx")
