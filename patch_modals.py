import sys
import re

def update_page(filepath, page_name):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Import useRouter
    if "import { useRouter } from 'next/navigation';" not in code:
        code = code.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useRouter } from 'next/navigation';")
        code = code.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\nimport { useRouter } from 'next/navigation';")

    # 2. Add router inside component
    if "const router = useRouter();" not in code:
        code = re.sub(r'(export default function [a-zA-Z]+\(\) {)', r'\1\n  const router = useRouter();', code)

    # 3. Replace Read Modal State
    modal_state = """  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);"""
    if modal_state in code:
        code = code.replace(modal_state, "")
        
    modal_state2 = """  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);"""
    if modal_state2 in code:
        code = code.replace(modal_state2, "")
        
    # 4. Update Filter States to use sessionStorage
    def replace_state(state_name, default_val):
        nonlocal code
        old_pattern = f"const [{state_name}, set{state_name[0].upper() + state_name[1:]}] = useState({default_val});"
        if default_val == "''":
            session_fallback = "|| ''"
        elif default_val == "'all'":
            session_fallback = "|| 'all'"
        elif default_val == "'grid'":
            session_fallback = "|| 'grid'"
        else:
            session_fallback = f"|| {default_val}"
            
        new_pattern = f"const [{state_name}, set{state_name[0].upper() + state_name[1:]}] = useState(() => {{ if (typeof window !== 'undefined') return sessionStorage.getItem('{page_name}_{state_name}') {session_fallback}; return {default_val}; }});"
        
        # Also need a useEffect to watch changes
        effect = f"""
  useEffect(() => {{
    sessionStorage.setItem('{page_name}_{state_name}', {state_name});
  }}, [{state_name}]);"""
        
        if old_pattern in code:
            code = code.replace(old_pattern, new_pattern)
            # inject effect before return
            code = re.sub(r'(  if \(!isMounted\))', effect + r'\n\1', code)
            code = re.sub(r'(  const allPosts)', effect + r'\n\1', code)
            code = re.sub(r'(  if \(role !== \'admin\')', effect + r'\n\1', code)

    replace_state('searchQuery', "''")
    replace_state('selectedTagFilter', "'all'")
    replace_state('viewMode', "'grid'")
    replace_state('filterType', "'all'")
    replace_state('filterTag', "'all'")

    # 5. Update openReadModal function
    # old: 
    # const openReadModal = (post: any) => { setSelectedPost(post); setIsReadModalOpen(true); };
    # new:
    # const openReadModal = (post: any) => { router.push(`/dashboard/view/${post.postCode || post.id}`); };
    code = re.sub(r'const openReadModal = \(.*?\).*?};', r'const openReadModal = (post: any) => { router.push(`/dashboard/view/${post.postCode || post.id}`); };', code, flags=re.DOTALL)

    # 6. Remove the Read Modal JSX
    code = re.sub(r'{/\*\s*READ MODAL\s*\*/}.*?{isReadModalOpen.*?</button>.*?</div>.*?</div>.*?</div>\s*\}', '', code, flags=re.DOTALL)
    code = re.sub(r'\{isReadModalOpen\s*&&\s*selected[a-zA-Z]+.*?</button>.*?</div>.*?</div>.*?</div>\s*\}', '', code, flags=re.DOTALL)


    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Patched {filepath}")

update_page("src/app/dashboard/lessons/page.tsx", "lessons")
update_page("src/app/dashboard/methodologies/page.tsx", "methodologies")
update_page("src/app/dashboard/favorites/page.tsx", "favorites")
update_page("src/app/dashboard/posts/page.tsx", "posts")
