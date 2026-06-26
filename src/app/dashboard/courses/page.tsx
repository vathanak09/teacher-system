"use client";
export default function CoursesPage() {
  const courses = [
    { id: 1, name: 'គណិតវិទ្យា ថ្នាក់ទី១២', teacher: 'លោកគ្រូ សុខ', progress: 75, status: 'កំពុងសិក្សា' },
    { id: 2, name: 'រូបវិទ្យា កម្រិតមូលដ្ឋាន', teacher: 'អ្នកគ្រូ នារី', progress: 40, status: 'កំពុងសិក្សា' },
    { id: 3, name: 'ភាសាអង់គ្លេស', teacher: 'Mr. John', progress: 100, status: 'បញ្ចប់' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '1rem' }}>វគ្គសិក្សា (Courses)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>បញ្ជីវគ្គសិក្សាទាំងអស់ដែលអ្នកកំពុងចូលរួម។</p>
      <div className="grid-cards">
        {courses.map(course => (
          <div key={course.id} className="glass-panel glass-panel-hoverable" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{course.name}</h3>
              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: course.progress === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: course.progress === 100 ? 'var(--success)' : 'var(--accent-primary)' }}>
                {course.status}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>បង្រៀនដោយ៖ {course.teacher}</p>
            <div>
              <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span>វឌ្ឍនភាព (Progress)</span>
                <span>{course.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${course.progress}%`, height: '100%', background: course.progress === 100 ? 'var(--success)' : 'var(--accent-primary)', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.5rem' }}>ចូលមើលមេរៀន</button>
          </div>
        ))}
      </div>
    </div>
  );
}
