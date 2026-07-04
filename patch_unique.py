import sys

def patch_page(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Update Imports
    old_import = "from 'firebase/firestore';"
    
    if "getDocs" not in code:
        code = code.replace(old_import, ", getDocs, query, where } from 'firebase/firestore';")

    # 2. Update handleSave
    old_sig = "const handleSave = () => {"
    new_sig = "const handleSave = async () => {"
    
    # We must ensure we only replace the specific check lines
    old_check1 = """    if (!title) return alert("សូមបញ្ចូលចំណងជើង!");
    const postData: any = {"""
    old_check2 = """    if (!title) return alert("សូមបញ្ចូលចំណងជើងវិធីសាស្ត្រ!");
    const postData: any = {"""
    
    new_check_template = """    if (!title) return alert("សូមបញ្ចូលចំណងជើង!");
    if (!postCodeField) return alert("សូមបញ្ចូលលេខកូដ (ID)!");
    
    // Check for uniqueness across lessons and methodologies
    const lessonsRef = collection(db, 'lessons');
    const methodsRef = collection(db, 'methodologies');
    const q1 = query(lessonsRef, where('postCode', '==', postCodeField));
    const q2 = query(methodsRef, where('postCode', '==', postCodeField));
    
    try {
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const isDuplicate = [...snap1.docs, ...snap2.docs].some(doc => doc.id !== editingId);
      if (isDuplicate) {
        return alert("លេខកូដនេះមានរួចហើយ សូមប្រើលេខកូដផ្សេង!");
      }
    } catch (error) {
      console.error("Error checking post code uniqueness", error);
      return alert("មានបញ្ហាក្នុងការត្រួតពិនិត្យលេខកូដ!");
    }

    const postData: any = {"""

    code = code.replace(old_sig, new_sig)
    
    if old_check1 in code:
        code = code.replace(old_check1, new_check_template)
    elif old_check2 in code:
        new_check_template_meth = new_check_template.replace('សូមបញ្ចូលចំណងជើង!', 'សូមបញ្ចូលចំណងជើងវិធីសាស្ត្រ!')
        code = code.replace(old_check2, new_check_template_meth)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Patched {filepath}")

patch_page("src/app/dashboard/lessons/page.tsx")
patch_page("src/app/dashboard/methodologies/page.tsx")
