"use client";
import { useRouter } from 'next/navigation';

export default function ToolsMenuPage() {
  const router = useRouter();

  const tools = [
    {
      id: 'randomizer',
      title: 'កង់រង្វិល និងបែងចែកក្រុម',
      description: 'ឧបករណ៍ជ្រើសរើសសិស្សដោយចៃដន្យតាមរយៈកង់រង្វិល និងបែងចែកសិស្សជាក្រុមដោយស្វ័យប្រវត្តិ។',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary-color)' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2v20"></path>
          <path d="M2 12h20"></path>
          <path d="M4.93 4.93l14.14 14.14"></path>
          <path d="M4.93 19.07L19.07 4.93"></path>
          <circle cx="12" cy="12" r="3" fill="var(--main-bg)"></circle>
        </svg>
      ),
      path: '/dashboard/tools/randomizer',
      color: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.3)'
    },
    {
      id: 'gemini-tts',
      title: 'អានអក្សរ (Gemini AI)',
      description: 'បំប្លែងអត្ថបទទៅជាសំឡេងដ៏រស់រវើកដូចមនុស្សពិតៗ ប្រើប្រាស់សេវាកម្ម Google Gemini (ឥតគិតថ្លៃ)។',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#8b5cf6' }}>
          <path d="M12 2v20M17 5v14M22 8v8M7 5v14M2 8v8"/>
        </svg>
      ),
      path: '/dashboard/tools/gemini-tts',
      color: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.3)'
    },
    {
      id: 'vocab-builder',
      title: 'បង្កើតបញ្ជីពាក្យ (Vocab Builder)',
      description: 'ស្វែងរកអត្ថន័យ ថ្នាក់ពាក្យ ពាក្យន័យដូច និងឧទាហរណ៍ដោយស្វ័យប្រវត្តិ។',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#10b981' }}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      path: '/dashboard/tools/vocab-builder',
      color: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)'
    },
    // Future tools can be added here
  ];

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-primary)' }}>ឧបករណ៍ (Tools)</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
          បណ្តុំកម្មវិធីជំនួយបន្ថែមសម្រាប់ការគ្រប់គ្រង និងការបង្រៀន
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => router.push(tool.path)}
            style={{
              background: 'var(--panel-bg)',
              border: `1px solid ${tool.border}`,
              borderRadius: '20px',
              padding: '2rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = tool.border;
            }}
          >
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '16px',
              background: tool.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem'
            }}>
              {tool.icon}
            </div>
            
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
              {tool.title}
            </h2>
            
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {tool.description}
            </p>

            <div style={{ 
              marginTop: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--primary-color)',
              fontWeight: 600,
              paddingTop: '1rem'
            }}>
              ចូលប្រើប្រាស់ 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
