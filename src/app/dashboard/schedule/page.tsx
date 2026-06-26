"use client";
export default function SchedulePage() {
  const schedule = [
    { time: '08:00 AM - 09:30 AM', subject: 'គណិតវិទ្យា', room: 'បន្ទប់ A101' },
    { time: '10:00 AM - 11:30 AM', subject: 'រូបវិទ្យា', room: 'បន្ទប់ B205' },
    { time: '01:00 PM - 02:30 PM', subject: 'ភាសាអង់គ្លេស', room: 'បន្ទប់ C304' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '1rem' }}>កាលវិភាគ (Schedule)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>កាលវិភាគប្រចាំថ្ងៃរបស់អ្នក។</p>
      
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {schedule.map((item, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            padding: '1.25rem 1.5rem', 
            borderBottom: idx === schedule.length - 1 ? 'none' : '1px solid var(--border-color)',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', minWidth: '150px' }}>{item.time}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.subject}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.room}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
