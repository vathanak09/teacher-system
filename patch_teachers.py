import sys

with open("src/app/dashboard/teachers/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. State
old_state = "const [statusField, setStatusField] = useState('កំពុងបង្រៀន');"
new_state = """const [statusField, setStatusField] = useState('កំពុងបង្រៀន');
  // Contacts
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookLink, setFacebookLink] = useState('');
  const [otherContactEnabled, setOtherContactEnabled] = useState(false);
  const [otherContactLabel, setOtherContactLabel] = useState('');
  const [otherContactLink, setOtherContactLink] = useState('');"""

# 2. handleOpenAddTeacher
old_add = """setStatusField('កំពុងបង្រៀន');
    setIsTeacherModalOpen(true);"""
new_add = """setStatusField('កំពុងបង្រៀន');
    setTelegramEnabled(false);
    setTelegramLink('');
    setFacebookEnabled(false);
    setFacebookLink('');
    setOtherContactEnabled(false);
    setOtherContactLabel('');
    setOtherContactLink('');
    setIsTeacherModalOpen(true);"""

# 3. handleOpenEditTeacher
old_edit = """setStatusField(teacher.status);
    setIsTeacherModalOpen(true);"""
new_edit = """setStatusField(teacher.status);
    setTelegramEnabled(!!teacher.contacts?.telegram);
    setTelegramLink(teacher.contacts?.telegram || '');
    setFacebookEnabled(!!teacher.contacts?.facebook);
    setFacebookLink(teacher.contacts?.facebook || '');
    setOtherContactEnabled(!!teacher.contacts?.other?.link);
    setOtherContactLabel(teacher.contacts?.other?.label || '');
    setOtherContactLink(teacher.contacts?.other?.link || '');
    setIsTeacherModalOpen(true);"""

# 4. handleSaveTeacher
old_save = """status: statusField,
    };"""
new_save = """status: statusField,
      contacts: {
        telegram: telegramEnabled ? telegramLink : '',
        facebook: facebookEnabled ? facebookLink : '',
        other: otherContactEnabled ? { label: otherContactLabel, link: otherContactLink } : null
      }
    };"""

# 5. Table Header
old_header = """<th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះខ្មែរ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អក្សរឡាតាំង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>មុខវិជ្ជា</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ទូរស័ព្ទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>"""
new_header = """<th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខរៀង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្ត លេខ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះខ្មែរ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឡាតាំង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Contacts</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>"""

# 6. Table Body Start
old_row = """<td style={{ padding: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%'"""
new_row = """<td style={{ padding: '1rem' }}>{index + 1}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%'"""

# 7. Table Body Middle (Replace subject with phone and append contacts)
old_middle = """<td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', fontSize: '0.875rem' }}>{teacher.subject}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.phone}</td>
                  <td style={{ padding: '1rem' }}>"""

new_middle = """<td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {teacher.contacts?.telegram && (
                        <a href={teacher.contacts.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }} title="Telegram">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2L2 11.5L8.5 14L10 21.5L13.5 17L18.5 21L21.5 2Z" /></svg>
                        </a>
                      )}
                      {teacher.contacts?.facebook && (
                        <a href={teacher.contacts.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }} title="Facebook">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                      )}
                      {teacher.contacts?.other?.link && (
                        <a href={teacher.contacts.other.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} title={teacher.contacts.other.label || 'Link'}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>"""

# 8. Modal Contacts Input
old_footer = """<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>"""
new_footer = """<div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>ទំនាក់ទំនង (Contacts)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} /> Telegram
                    </label>
                    {telegramEnabled && (
                      <input type="url" className="input-field" placeholder="https://t.me/username" value={telegramLink} onChange={e => setTelegramLink(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={facebookEnabled} onChange={(e) => setFacebookEnabled(e.target.checked)} /> Facebook
                    </label>
                    {facebookEnabled && (
                      <input type="url" className="input-field" placeholder="https://facebook.com/username" value={facebookLink} onChange={e => setFacebookLink(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={otherContactEnabled} onChange={(e) => setOtherContactEnabled(e.target.checked)} /> ផ្សេងៗ
                    </label>
                    {otherContactEnabled && (
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px', flexWrap: 'wrap' }}>
                        <input type="text" className="input-field" placeholder="ឈ្មោះ (ឧ. Line)" value={otherContactLabel} onChange={e => setOtherContactLabel(e.target.value)} style={{ width: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                        <input type="url" className="input-field" placeholder="Link URL" value={otherContactLink} onChange={e => setOtherContactLink(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>"""

to_replace = [
    (old_state, new_state, "state"),
    (old_add, new_add, "handleOpenAddTeacher"),
    (old_edit, new_edit, "handleOpenEditTeacher"),
    (old_save, new_save, "handleSaveTeacher"),
    (old_header, new_header, "table header"),
    (old_row, new_row, "table row start"),
    (old_middle, new_middle, "table middle"),
    (old_footer, new_footer, "modal footer")
]

for o, n, desc in to_replace:
    if o in code:
        code = code.replace(o, n)
        print("Replaced", desc)
    else:
        print("FAILED TO FIND:", desc)

with open("src/app/dashboard/teachers/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Done")
