"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentService, paymentService, classService } from '@/services/db';

export default function PaymentsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentDuration, setPaymentDuration] = useState('1'); // months
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState('');

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubStudents = studentService.subscribeAll(setStudents);

    const unsubPayments = paymentService.subscribeAll(setPayments);

    const unsubClasses = classService.subscribeAll(setClassesData);

    return () => { unsubStudents(); unsubPayments(); unsubClasses(); };
  }, [router]);

  // Utility to add months to a date
  const addMonths = (dateString: string, months: number) => {
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  };

  const getStatusInfo = (nextDateStr: string | null) => {
    if (!nextDateStr) return { label: 'មិនទាន់បង់ / Unpaid', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', code: 'overdue' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextDateStr);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'ហួសកំណត់ / Overdue', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', code: 'overdue' };
    if (diffDays === 0) return { label: 'ដល់ថ្ងៃបង់ / Due Today', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', code: 'due_today' };
    if (diffDays <= 5) return { label: 'ជិតដល់ថ្ងៃ / Due Soon', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', code: 'due_soon' };
    return { label: 'បានបង់ / Paid', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', code: 'paid' };
  };

  // Process data
  const augmentedStudents = students.map(s => {
    const sClasses = classesData.filter(c => c.studentIds && c.studentIds.includes(s.id));
    const sClassName = sClasses.length > 0 ? sClasses.map(c => c.classCode || c.className).join(', ') : (s.className || 'គ្មានថ្នាក់');
    
    const sPayments = payments.filter(p => p.studentId === s.id).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    const lastPayment = sPayments.length > 0 ? sPayments[0] : null;
    
    const nextDate = s.nextPaymentDate || (lastPayment ? lastPayment.validUntil : null);
    const statusInfo = getStatusInfo(nextDate);

    return {
      ...s,
      computedClass: sClassName,
      lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
      nextPaymentDate: nextDate,
      statusInfo
    };
  });

  const classOptions = Array.from(new Set(augmentedStudents.map(s => s.computedClass).filter(Boolean)));

  const filteredStudents = augmentedStudents.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.englishName && s.englishName.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          s.studentId.includes(searchQuery);
    const matchesClass = classFilter === 'all' || s.computedClass === classFilter;
    const matchesStatus = statusFilter === 'all' || s.statusInfo.code === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Stats
  const totalPaid = augmentedStudents.filter(s => s.statusInfo.code === 'paid').length;
  const totalOverdue = augmentedStudents.filter(s => s.statusInfo.code === 'overdue').length;
  const totalDueSoon = augmentedStudents.filter(s => s.statusInfo.code === 'due_soon' || s.statusInfo.code === 'due_today').length;

  // Handlers
  const openPaymentModal = (student: any) => {
    setSelectedStudentId(student.id);
    setPaymentAmount(student.fee ? student.fee.toString() : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentDuration('1');
    setPaymentMethod('Cash');
    setIsPaymentModalOpen(true);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dur = e.target.value;
    setPaymentDuration(dur);
    const student = students.find(s => s.id === selectedStudentId);
    if (student && student.fee && dur !== 'custom') {
      setPaymentAmount((Number(student.fee) * Number(dur)).toString());
    }
  };

  const submitPayment = async () => {
    if (!selectedStudentId || !paymentAmount || !paymentDate || !paymentDuration) {
      alert('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!');
      return;
    }

    const student = augmentedStudents.find(s => s.id === selectedStudentId);
    if (!student) return;

    let nextDate = '';
    const durNum = Number(paymentDuration);
    if (!isNaN(durNum)) {
      // If student is overdue, calculate next payment from TODAY (or the day they paid).
      // If student is paying in advance, calculate from their EXISTING nextPaymentDate.
      let baseDate = paymentDate;
      if (student.nextPaymentDate && new Date(student.nextPaymentDate) > new Date(paymentDate)) {
        baseDate = student.nextPaymentDate;
      }
      nextDate = addMonths(baseDate, durNum);
    }

    const paymentRecord = {
      studentId: selectedStudentId,
      amount: Number(paymentAmount),
      paymentDate,
      validFrom: paymentDate,
      validUntil: nextDate,
      paymentMethod,
      receiverName: localStorage.getItem('userName') || 'Admin',
      createdAt: new Date().toISOString()
    };

    try {
      await paymentService.add(paymentRecord);
      await studentService.update(selectedStudentId, {
        nextPaymentDate: nextDate
      });
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error("Error saving payment: ", error);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ។');
    }
  };

  if (role !== 'admin') return null;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          គ្រប់គ្រងការបង់ប្រាក់សិស្ស
        </h1>
        <button onClick={() => window.print()} className="btn" style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          បោះពុម្ពរបាយការណ៍
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>សិស្សបានបង់ (Paid)</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{totalPaid}</span>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>ជិតដល់ថ្ងៃ (Due Soon)</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{totalDueSoon}</span>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>ជំពាក់ / ហួសថ្ងៃ (Overdue)</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{totalOverdue}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="ស្វែងរកឈ្មោះ ឬ អត្តលេខ..." 
          className="input-field"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '250px' }}
        />
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">គ្រប់ស្ថានភាពទាំងអស់</option>
          <option value="paid">បានបង់ (Paid)</option>
          <option value="due_soon">ជិតដល់ថ្ងៃ (Due Soon)</option>
          <option value="due_today">ដល់ថ្ងៃបង់ (Due Today)</option>
          <option value="overdue">ជំពាក់ (Overdue)</option>
        </select>
        <select className="input-field" value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">គ្រប់ថ្នាក់ទាំងអស់</option>
          {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-md)' }}>
        <table className="table-responsive" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>អត្តលេខ</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ឈ្មោះសិស្ស</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ថ្នាក់</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>តម្លៃសិក្សា</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>បង់ចុងក្រោយ</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ត្រូវបង់បន្ទាប់</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ស្ថានភាព</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{student.studentId}</td>
                <td style={{ padding: '1rem', fontWeight: 600, fontSize: '1.05rem' }}>{student.fullName}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.computedClass}</td>
                <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{student.fee ? `${student.fee} K` : 'N/A'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.lastPaymentDate || 'N/A'}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{student.nextPaymentDate || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                    background: student.statusInfo.bg, color: student.statusInfo.color 
                  }}>
                    {student.statusInfo.label}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setHistoryStudentId(student.id); setIsHistoryModalOpen(true); }} className="btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '0.4rem 0.6rem' }} title="ប្រវត្តិបង់ប្រាក់">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <button onClick={() => openPaymentModal(student)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                      បង់ប្រាក់
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>គ្មានទិន្នន័យ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--modal-bg)', width: '90%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>កត់ត្រាការបង់ប្រាក់</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>សិស្ស</label>
                <select className="input-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled>
                  {augmentedStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>)}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>កាលបរិច្ឆេទបង់</label>
                  <input type="date" className="input-field" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>រយៈពេលបង់</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="input-field" value={paymentDuration === 'custom' ? 'custom' : paymentDuration} onChange={handleDurationChange} style={{ flex: 1 }}>
                      <option value="1">១ ខែ</option>
                      <option value="3">៣ ខែ</option>
                      <option value="6">៦ ខែ</option>
                      <option value="12">១ ឆ្នាំ (១២ ខែ)</option>
                      <option value="custom">ផ្សេងៗ...</option>
                    </select>
                    {paymentDuration === 'custom' || isNaN(Number(paymentDuration)) ? (
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="ខែ" 
                        value={paymentDuration === 'custom' ? '' : paymentDuration} 
                        onChange={e => setPaymentDuration(e.target.value)} 
                        style={{ width: '80px' }} 
                        min="1"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>ចំនួនទឹកប្រាក់ (រៀល/ពាន់)</label>
                  <input type="number" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>វិធីសាស្ត្របង់ប្រាក់</label>
                  <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="Cash">សាច់ប្រាក់ (Cash)</option>
                    <option value="ABA">ABA Bank</option>
                    <option value="Acleda">Acleda Bank</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsPaymentModalOpen(false)} className="btn" style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>បោះបង់</button>
              <button onClick={submitPayment} className="btn btn-primary" style={{ boxShadow: 'var(--shadow-glow)' }}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--modal-bg)', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>ប្រវត្តិបង់ប្រាក់សិស្ស</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {payments.filter(p => p.studentId === historyStudentId).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (
                <div key={p.id} style={{ background: 'var(--main-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>ថ្ងៃបង់៖ <strong style={{ color: 'var(--text-primary)' }}>{p.paymentDate}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>ទឹកប្រាក់៖ <strong style={{ color: '#10b981' }}>{p.amount} K</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>វិធីសាស្ត្រ៖ <strong style={{ color: 'var(--text-primary)' }}>{p.paymentMethod}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>សុពលភាព៖ <strong style={{ color: 'var(--accent-primary)' }}>{p.validUntil || 'N/A'}</strong></div>
                </div>
              ))}
              {payments.filter(p => p.studentId === historyStudentId).length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>មិនទាន់មានប្រវត្តិបង់ប្រាក់</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setIsHistoryModalOpen(false)} className="btn" style={{ background: 'var(--main-bg)', border: '1px solid var(--border-color)' }}>បិទ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
