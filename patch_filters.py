import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    success = True
    # 1. State
    if "const [filterTag, setFilterTag] = useState('all');" in code:
        code = code.replace(
            "const [filterTag, setFilterTag] = useState('all');",
            "const [filterTagsByGroup, setFilterTagsByGroup] = useState<Record<number, string>>({});"
        )
    elif "const [filterTag, setFilterTag] = useState<string>('all');" in code:
         code = code.replace(
            "const [filterTag, setFilterTag] = useState<string>('all');",
            "const [filterTagsByGroup, setFilterTagsByGroup] = useState<Record<number, string>>({});"
        )
    else:
        print(f'State replacement failed in {filepath}')
        success = False

    # 2. Filter Logic
    old_logic1 = """const matchesTag = filterTag === 'all' || (post.tags && post.tags.includes(Number(filterTag)));
      
      return matchesSearch && matchesFilter && matchesTag;"""
    
    old_logic2 = """const matchesTag = filterTag === 'all' || (post.tags && post.tags.includes(Number(filterTag)));
        
        return matchesSearch && matchesFilter && matchesTag;"""

    new_logic = """const matchesGroupTags = Object.keys(filterTagsByGroup).every(groupId => {
        const tagId = filterTagsByGroup[Number(groupId)];
        if (!tagId || tagId === 'all') return true;
        return post.tags && post.tags.includes(Number(tagId));
      });
      
      return matchesSearch && matchesFilter && matchesGroupTags;"""
      
    if old_logic1 in code:
        code = code.replace(old_logic1, new_logic)
    elif old_logic2 in code:
        code = code.replace(old_logic2, new_logic)
    else:
         print(f'Logic replacement failed in {filepath}')
         success = False

    # 3. JSX replacement
    old_jsx = """{/* Tag Filter */}
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
          </select>"""
          
    new_jsx = """{/* Dynamic Tag Group Filters */}
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
          })}"""
          
    if old_jsx in code:
        code = code.replace(old_jsx, new_jsx)
    else:
        print(f'JSX replacement failed in {filepath}')
        success = False

    if success:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f'Successfully patched {filepath}')

patch_file('src/app/dashboard/lessons/page.tsx')
patch_file('src/app/dashboard/methodologies/page.tsx')
