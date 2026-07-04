import sys

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # 5. Update user profile renderer in sidebar
    old_profile = """<div className="user-profile">
            <div className="avatar">{userName?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }}>{userName}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{roleKhmer}</div>
            </div>
          </div>"""
    
    new_profile = """<div className="user-profile" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Link href="/dashboard/teachers" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
              {userPhoto ? (
                <img src={userPhoto} alt={userName || ''} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold' }}>{userName?.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }}>{userName}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{roleKhmer}</div>
              </div>
            </Link>
          </div>"""

    if old_profile in code:
        code = code.replace(old_profile, new_profile)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
        print("Done")
    else:
        print("Failed to replace user profile section")

patch_file("src/app/dashboard/layout.tsx")
