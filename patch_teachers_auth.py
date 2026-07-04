import sys

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 1. State for User ID and Users
    old_state = "const [role, setRole] = useState('');"
    new_state = """const [role, setRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [linkedUserIdField, setLinkedUserIdField] = useState('');"""

    if old_state in code:
        code = code.replace(old_state, new_state)
    else:
        print("Failed to find state injection point")

    # 2. Effects
    old_effect = """useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const teachersData: any[] = [];
      snapshot.forEach((doc) => {
        teachersData.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teachersData);
    });

    return () => unsubscribe();
  }, [router]);"""
    new_effect = """useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || '';
    setRole(currentRole);
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    
    if (currentRole !== 'admin' && currentRole !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appUsers) {
          setAppUsers(data.appUsers.filter((u: any) => u.role === 'admin' || u.role === 'teacher'));
        }
      }
    });

    const unsubscribe = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const teachersData: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (currentRole === 'admin' || data.linkedUserId === userId || data.fullName === userName) {
          teachersData.push({ id: docSnap.id, ...data });
        }
      });
      setTeachers(teachersData);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [router]);"""

    if old_effect in code:
        code = code.replace(old_effect, new_effect)
    else:
        print("Failed to find effect injection point")

    # 3. Form Reset
    old_reset = """setStatusField('កំពុងបង្រៀន');
    setTelegramEnabled(false);"""
    new_reset = """setStatusField('កំពុងបង្រៀន');
    setLinkedUserIdField('');
    setTelegramEnabled(false);"""
    
    if old_reset in code:
        code = code.replace(old_reset, new_reset)
    else:
        print("Failed to find reset injection point")

    # 4. Form Edit Load
    old_edit_load = """setStatusField(teacher.status);
    setTelegramEnabled(!!teacher.contacts?.telegram);"""
    new_edit_load = """setStatusField(teacher.status);
    setLinkedUserIdField(teacher.linkedUserId || '');
    setTelegramEnabled(!!teacher.contacts?.telegram);"""

    if old_edit_load in code:
        code = code.replace(old_edit_load, new_edit_load)
    else:
        print("Failed to find edit load injection point")

    # 5. Form Save
    old_save = """status: statusField,
      contacts: {"""
    new_save = """status: statusField,
      linkedUserId: role === 'admin' ? linkedUserIdField : (teacherEditId ? (teachers.find(t=>t.id===teacherEditId)?.linkedUserId || currentUserId) : currentUserId),
      contacts: {"""
      
    if old_save in code:
        code = code.replace(old_save, new_save)
    else:
        print("Failed to find save injection point")

    # 6. Modal JSX for Linked User (Admin only)
    old_jsx_status = """<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ស្ថានភាព</label>
                  <select value={statusField} onChange={e => setStatusField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="កំពុងបង្រៀន">កំពុងបង្រៀន</option>
                    <option value="ឈប់បង្រៀន">ឈប់បង្រៀន</option>
                  </select>
                </div>"""
                
    new_jsx_status = """<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ស្ថានភាព</label>
                  <select value={statusField} onChange={e => setStatusField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="កំពុងបង្រៀន">កំពុងបង្រៀន</option>
                    <option value="ឈប់បង្រៀន">ឈប់បង្រៀន</option>
                  </select>
                </div>
                {role === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ភ្ជាប់ជាមួយគណនី (Linked User)</label>
                    <select value={linkedUserIdField} onChange={e => setLinkedUserIdField(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">-- មិនទាន់ភ្ជាប់ --</option>
                      {appUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                )}"""
                
    if old_jsx_status in code:
        code = code.replace(old_jsx_status, new_jsx_status)
    else:
        print("Failed to find JSX status injection point")

    # 7. Disable actions for teachers who shouldn't see 'delete' ? Or maybe they can?
    # Usually users can delete their own. Let's leave delete button as is, since they can only see their own anyway.

    # 8. Create new button - if admin, always show. If teacher, only show if they haven't created one?
    # Actually, let's keep the add button available.

    # Write changes
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Done")

patch_file("src/app/dashboard/teachers/page.tsx")
