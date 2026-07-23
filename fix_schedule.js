const fs = require('fs');
const content = "use client";
export default function SchedulePage() {
  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem', opacity: 0.8 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>កាលវិភាគ (Schedule)</h2>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6 }}>កំពុងរៀបចំ និងអភិវឌ្ឍន៍មុខងារនេះ។ <br/> វានឹងរួចរាល់សម្រាប់ការប្រើប្រាស់ក្នុងពេលឆាប់ៗនេះ។</p>
    </div>
  );
}
;
fs.writeFileSync('src/app/dashboard/schedule/page.tsx', content, 'utf8');
