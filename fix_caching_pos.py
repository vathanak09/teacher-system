import sys
import re

def fix_cache_position(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Extract the caching logic
    cache_logic_match = re.search(r'(  // --- Caching Logic ---.*?  // ----------------------\n)', code, flags=re.DOTALL)
    if not cache_logic_match:
        return
    
    cache_logic = cache_logic_match.group(1)
    
    # Remove it from its current position
    code = code.replace(cache_logic, '')
    
    # Insert it right before the first standard useEffect (which is usually the fetch data useEffect)
    # E.g., `useEffect(() => {\n    const currentRole`
    
    insert_pattern = r'(  useEffect\(\(\) => \{)'
    # ensure we only insert it once
    if "const currentRole" in code or "const unsub" in code:
        code = re.sub(insert_pattern, cache_logic + r'\n\1', code, count=1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Fixed caching position in {filepath}")

fix_cache_position("src/app/dashboard/lessons/page.tsx")
fix_cache_position("src/app/dashboard/methodologies/page.tsx")
fix_cache_position("src/app/dashboard/favorites/page.tsx")
fix_cache_position("src/app/dashboard/posts/page.tsx")
