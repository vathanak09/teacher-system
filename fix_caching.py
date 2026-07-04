import sys
import re

def fix_cache(filepath, page_name):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Define variables to cache
    variables = {
        'searchQuery': "''",
        'viewMode': "'grid'",
        'filterAuthor': "'all'",
        'sortBy': "'newest'",
        'filterType': "'all'",
        'filterTag': "'all'",
    }

    # 1. Revert to standard useState
    for var, default in variables.items():
        # Match standard or messed up useState
        pattern = r'const \[' + var + r', set' + var[0].upper() + var[1:] + r'\] = useState(?:<.*?>)?\(.*?\);'
        replacement = f"const [{var}, set{var[0].upper() + var[1:]}] = useState({default});"
        if var == 'viewMode' and 'viewMode' in code:
            replacement = f"const [{var}, set{var[0].upper() + var[1:]}] = useState<'grid' | 'list'>('grid');"
        
        code = re.sub(pattern, replacement, code)
        
        # Remove the injected useEffect from previous patch
        effect_pattern = r'  useEffect\(\(\) => \{\s*sessionStorage\.setItem\(\'' + page_name + r'_' + var + r'\', ' + var + r'\);\s*\}, \[' + var + r'\]\);'
        code = re.sub(effect_pattern, '', code)
        
    # 2. Add the correct useEffect for caching
    # Find the end of state declarations, maybe right before `useEffect(() => { const unsub = onSnapshot`
    # Let's just insert it after `const [isMounted, setIsMounted] = useState(false);` if it exists, or just after router.
    
    cache_logic = "\n  // --- Caching Logic ---\n  useEffect(() => {\n"
    for var in variables.keys():
        if f"const [{var}," in code:
            cache_logic += f"    const cached_{var} = sessionStorage.getItem('{page_name}_{var}');\n"
            cache_logic += f"    if (cached_{var} !== null) set{var[0].upper() + var[1:]}(cached_{var} as any);\n"
    cache_logic += "  }, []);\n\n"
    
    for var in variables.keys():
        if f"const [{var}," in code:
            cache_logic += f"  useEffect(() => {{ sessionStorage.setItem('{page_name}_{var}', {var}); }}, [{var}]);\n"
            
    cache_logic += "  // ----------------------\n"

    # Inject right after `const router = useRouter();`
    if "const router = useRouter();" in code:
        code = code.replace("const router = useRouter();", "const router = useRouter();\n" + cache_logic)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Fixed caching in {filepath}")

fix_cache("src/app/dashboard/lessons/page.tsx", "lessons")
fix_cache("src/app/dashboard/methodologies/page.tsx", "methodologies")
fix_cache("src/app/dashboard/favorites/page.tsx", "favorites")
fix_cache("src/app/dashboard/posts/page.tsx", "posts")
