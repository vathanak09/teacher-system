"use client";
import { useEffect, useState } from 'react';
import { classService, studentService, messageService, taskService, teachingRecordService, postService } from '@/services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardPage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teachingRecords, setTeachingRecords] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => { 
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    setRole(currentRole); 
    setUserId(currentUserId);
    setUserName(currentUserName);
    
    // Subscriptions
    const unsubClasses = classService.subscribeAll(data => {
      const teacherProfileId = localStorage.getItem('teacherProfileId') || '';
      if (currentRole === 'admin') setClasses(data);
      else setClasses(data.filter((c: any) => c.teacherId === teacherProfileId || c.teacherId === currentUserId || c.teacherName === currentUserName));
    });
    
    const unsubStudents = studentService.subscribeAll(data => {
       setStudents(data);
    });
    
    const unsubMessages = messageService.subscribeAll(data => {
      if (currentRole === 'admin') {
         setMessages(data.filter((m: any) => m.receiverId === 'admin' || m.receiverId === 'all_teachers'));
      } else {
         setMessages(data.filter((m: any) => m.receiverId === currentUserId || m.receiverId === 'all_teachers'));
      }
    });
    
    const unsubTasks = taskService.subscribeAll(setTasks);
    const unsubRecords = teachingRecordService.subscribeAll(setTeachingRecords);
    const unsubPosts = postService.subscribeAll(setPosts);
    
    return () => {
      unsubClasses();
      unsubStudents();
      unsubMessages();
      unsubTasks();
      unsubRecords();
      unsubPosts();
    };
  }, []);

  // Filter students based on teacher's classes
  const myStudents = role === 'admin' ? students : students.filter(s => {
    return classes.some(c => (c.studentIds && c.studentIds.includes(s.id)) || s.className === c.className);
  });

  // Calculate Data for Charts
  const studentStatusCount = { active: 0, suspended: 0, dropped: 0 };
  myStudents.forEach(s => {
    if (s.status === 'ព្យួរការសិក្សា') studentStatusCount.suspended++;
    else if (s.status === 'ឈប់សិក្សា') studentStatusCount.dropped++;
    else studentStatusCount.active++;
  });
  
  const pieData = [
    { name: 'កំពុងសិក្សា', value: studentStatusCount.active, color: '#10b981' },
    { name: 'ព្យួរការសិក្សា', value: studentStatusCount.suspended, color: '#f59e0b' },
    { name: 'ឈប់សិក្សា', value: studentStatusCount.dropped, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Class Progress Data
  const classProgressData = classes.map(c => {
    let totalBookPages = 0;
    let totalTaughtPages = 0;
    if (c.books && c.books.length > 0) {
      const classRecords = teachingRecords.filter((r: any) => r.classId === c.id);
      c.books.forEach((b: any) => {
        if (b.totalPages > 0) {
          totalBookPages += b.totalPages;
          const bookRecords = classRecords.filter((r: any) => r.bookId === b.id);
          if (bookRecords.length > 0) {
            const maxPages = Math.max(...bookRecords.map((r: any) => Number(r.pages) || 0));
            totalTaughtPages += maxPages;
          }
        }
      });
    }
    const percent = totalBookPages > 0 ? Math.round((totalTaughtPages / totalBookPages) * 100) : 0;
    return {
      name: c.className || c.classCode,
      progress: percent > 100 ? 100 : percent
    };
  }).slice(0, 10); // Show max 10 classes in graph

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;
  
  // Filter relevant tasks
  const relevantTasks = role === 'admin' ? tasks : tasks.filter(t => {
     return classes.some(c => c.id === t.classId);
  });
  const pendingTasks = relevantTasks.filter(t => t.progress < 100);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>ផ្ទាំងគ្រប់គ្រង (Dashboard)</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងសាលា, {userName}</p>
        </div>
      </div>

      {/* Summary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>ថ្នាក់រៀនសរុប</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{classes.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>សិស្សសរុប</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{myStudents.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>សារមិនទាន់អាន</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: unreadMessagesCount > 0 ? '#8b5cf6' : 'var(--text-primary)' }}>{unreadMessagesCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>កិច្ចការមិនទាន់រួចរាល់</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: pendingTasks.length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{pendingTasks.length}</div>
        </div>
      </div>

      {/* Graphs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Bar Chart: Class Progress */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>វឌ្ឍនភាពនៃការបង្រៀន (Class Progress %)</h2>
          {classProgressData.length > 0 ? (
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: 'var(--modal-bg)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>មិនទាន់មានទិន្នន័យ</div>
          )}
        </div>

        {/* Pie Chart: Student Status */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>ស្ថានភាពសិស្ស (Student Status)</h2>
          {pieData.length > 0 ? (
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: 'var(--modal-bg)', color: 'var(--text-primary)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>មិនទាន់មានទិន្នន័យ</div>
          )}
        </div>
      </div>

      {/* Lists Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Messages List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>សារថ្មីៗ (Recent Messages)</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.slice(0, 5).map(msg => (
              <div key={msg.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: !msg.isRead ? '4px solid #8b5cf6' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{msg.title || msg.senderName}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(msg.createdAt).toLocaleDateString('km-KH')}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {messages.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>មិនមានសារថ្មីៗទេ</div>}
          </div>
        </div>

        {/* Tasks List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>កិច្ចការកំពុងអនុវត្ត (Ongoing Tasks)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingTasks.slice(0, 5).map(task => {
              const cls = classes.find(c => c.id === task.classId);
              return (
                <div key={task.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong>
                    <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px' }}>{cls?.className}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${task.progress}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{task.progress}%</span>
                  </div>
                </div>
              );
            })}
            {pendingTasks.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>មិនមានកិច្ចការដែលត្រូវអនុវត្តទេ</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
