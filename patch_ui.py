import sys

def patch_page(filepath, prefix=""):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Update Post Code generation (make it 4-digit number)
    old_gen1 = "return 'L-' + Math.random().toString(36).substring(2, 8).toUpperCase();"
    old_gen2 = "return 'M-' + Math.random().toString(36).substring(2, 8).toUpperCase();"
    new_gen = "return Math.floor(1000 + Math.random() * 9000).toString();"
    
    if old_gen1 in code:
        code = code.replace(old_gen1, new_gen)
    if old_gen2 in code:
        code = code.replace(old_gen2, new_gen)

    # 2. Update filtering logic to include postCode search
    old_filter = """    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());"""
    new_filter = """    .filter(post => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = post.title.toLowerCase().includes(searchLower) || (post.postCode && post.postCode.toString().includes(searchLower));"""
    if old_filter in code:
        code = code.replace(old_filter, new_filter)

    # 3. Compact UI tweaks
    # Padding
    code = code.replace("padding: '1.5rem', flex: 1", "padding: '1rem', flex: 1")
    # Title margin bottom
    code = code.replace("marginBottom: '1rem' }}>\n                  {post.tags", "marginBottom: '0.75rem' }}>\n                  {post.postCode && (\n                    <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>\n                      #{post.postCode}\n                    </span>\n                  )}\n                  {post.tags")
    # Excerpt margin bottom
    code = code.replace("marginBottom: '1.5rem' }}>\n                  {getExcerpt(post.content)}", "marginBottom: '0.75rem' }}>\n                  {getExcerpt(post.content)}")
    # Author & date inline
    code = code.replace("flexDirection: 'column', gap: '0.25rem' }}>", "flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem' }}>")
    code = code.replace("gap: '0.5rem' }}>\n                      <svg width=\"14\"", "gap: '0.35rem' }}>\n                      <svg width=\"14\"")
    
    # 4. Remove placeholder 'L-XXXXXX' / 'M-XXXXXX' to just 'XXXX'
    code = code.replace("placeholder=\"L-XXXXXX\"", "placeholder=\"XXXX\"")
    code = code.replace("placeholder=\"M-XXXXXX\"", "placeholder=\"XXXX\"")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Patched {filepath}")

patch_page("src/app/dashboard/lessons/page.tsx")
patch_page("src/app/dashboard/methodologies/page.tsx")
patch_page("src/app/dashboard/favorites/page.tsx")
