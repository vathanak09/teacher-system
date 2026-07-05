const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/messages/page.tsx', 'utf8');
content = content.replace(/\r\n/g, '\n');

const stateOld = `  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);`;
const stateNew = `  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [selectedChanges, setSelectedChanges] = useState<{[msgId: string]: string[]}>({});`;
content = content.replace(stateOld, stateNew);

const handlerInsertPoint = `  const handleDelete = async (msgId: string) => {`;
const newHandler = `  const handleToggleChange = (msgId: string, key: string) => {
    setSelectedChanges(prev => {
      const current = prev[msgId] || [];
      if (current.includes(key)) {
        return { ...prev, [msgId]: current.filter(k => k !== key) };
      }
      return { ...prev, [msgId]: [...current, key] };
    });
  };

  const handleApproveEditRequest = async (msg: any) => {
    if (!msg.editRequestData || !msg.editRequestData.studentId) return;
    
    const selectedKeys = selectedChanges[msg.id] || [];
    if (selectedKeys.length === 0) {
      alert('សូមជ្រើសរើសព័ត៌មានយ៉ាងហោចណាស់មួយដើម្បីអនុម័ត!');
      return;
    }

    const updates: any = {};
    msg.editRequestData.changes.forEach((c: any) => {
      if (selectedKeys.includes(c.key)) {
        updates[c.key] = c.newVal;
      }
    });

    try {
      await updateDoc(doc(db, 'students', msg.editRequestData.studentId), updates);
      
      // Update the message to indicate it was approved
      await updateDoc(doc(db, 'messages', msg.id), {
        isApproved: true,
        approvedAt: new Date().toISOString()
      });
      
      alert('ព័ត៌មានត្រូវបានកែប្រែដោយជោគជ័យ!');
    } catch (error) {
      console.error("Error approving edit request", error);
      alert('មានបញ្ហាក្នុងការរក្សាទុក។ សូមព្យាយាមម្តងទៀត។');
    }
  };

  const handleDelete = async (msgId: string) => {`;
content = content.replace(handlerInsertPoint, newHandler);

const renderOld = `            <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              {msg.text}
            </div>

            {role === 'admin' && msg.senderId !== userId && (
              <div style={{ marginTop: '1rem' }}>`;
const renderNew = `            <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              {msg.type === 'student_edit_request' ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-color)' }}>
                    សំណើកែប្រែព័ត៌មានសិស្ស៖ {msg.editRequestData?.studentName} (ID: {msg.editRequestData?.studentIdCode})
                  </div>
                  {msg.isApproved && (
                    <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', marginBottom: '1rem', fontWeight: 600 }}>
                      ✓ សំណើត្រូវបានអនុម័តរួចរាល់
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {msg.editRequestData?.changes?.map((change: any, i: number) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--modal-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: msg.isApproved ? 'default' : 'pointer', opacity: msg.isApproved ? 0.7 : 1 }}>
                        <input 
                          type="checkbox" 
                          disabled={msg.isApproved}
                          checked={msg.isApproved || (selectedChanges[msg.id] || []).includes(change.key)}
                          onChange={() => handleToggleChange(msg.id, change.key)}
                          style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem', accentColor: 'var(--primary-color)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{change.label}</div>
                          <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{change.oldVal || 'ទទេ'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>→</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{change.newVal || 'ទទេ'}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {role === 'admin' && !msg.isApproved && (
                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        onClick={() => handleApproveEditRequest(msg)} 
                        disabled={(selectedChanges[msg.id] || []).length === 0}
                        style={{ padding: '0.75rem 1.5rem', background: (selectedChanges[msg.id] || []).length > 0 ? 'var(--primary-color)' : 'var(--bg-secondary)', color: (selectedChanges[msg.id] || []).length > 0 ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: (selectedChanges[msg.id] || []).length > 0 ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                      >
                        អនុម័តការកែប្រែជ្រើសរើស (Approve Selected)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>{msg.text}</>
              )}
            </div>

            {role === 'admin' && msg.senderId !== userId && (
              <div style={{ marginTop: '1rem' }}>`;
content = content.replace(renderOld, renderNew);

// Need to select all checkboxes initially when the message loads! Let's do it on initial click/render, or just let Admin select them manually.
// Actually, it's better to select all checkboxes by default when the message is viewed. We can use useEffect to set selectedChanges when messages load.
const effectOld = `  useEffect(() => {
    if (!userId) return;`;
const effectNew = `  useEffect(() => {
    if (messages.length > 0) {
      const initialSelected: {[id: string]: string[]} = {};
      messages.forEach(m => {
        if (m.type === 'student_edit_request' && m.editRequestData && m.editRequestData.changes) {
          initialSelected[m.id] = m.editRequestData.changes.map((c: any) => c.key);
        }
      });
      setSelectedChanges(prev => ({ ...initialSelected, ...prev }));
    }
  }, [messages.length]);

  useEffect(() => {
    if (!userId) return;`;
content = content.replace(effectOld, effectNew);

content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/messages/page.tsx', content, 'utf8');
console.log('Updated messages page.');
