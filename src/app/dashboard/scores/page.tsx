"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { classService, studentService, scoreService, settingsService } from '@/services/db';
import SortDropdown from '@/components/SortDropdown';



const COLORS = [
    { id: 'blue', value: '#3b82f6', label: 'ខៀវ' },
    { id: 'indigo', value: '#6366f1', label: 'ខៀវចាស់' },
    { id: 'purple', value: '#8b5cf6', label: 'ស្វាយ' },
    { id: 'pink', value: '#ec4899', label: 'ផ្កាឈូក' },
    { id: 'red', value: '#ef4444', label: 'ក្រហម' },
    { id: 'orange', value: '#f97316', label: 'ទឹកក្រូច' },
    { id: 'yellow', value: '#eab308', label: 'លឿង' },
    { id: 'green', value: '#22c55e', label: 'បៃតង' },
    { id: 'teal', value: '#14b8a6', label: 'ខៀវបៃតង' },
    { id: 'slate', value: '#64748b', label: 'ប្រផេះ' }
];

const ICONS = [
    { id: 'book', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, label: 'សៀវភៅ' },
    { id: 'monitor', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'កុំព្យូទ័រ' },
    { id: 'music', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>, label: 'តន្ត្រី' },
    { id: 'science', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>, label: 'វិទ្យាសាស្រ្ត' },
    { id: 'globe', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'សកលលោក' },
    { id: 'pen-tool', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>, label: 'គំនូរ' },
    { id: 'activity', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>, label: 'សកម្មភាព' },
    { id: 'language', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, label: 'ភាសា' },
    { id: 'calculator', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>, label: 'គណិតវិទ្យា' },
    { id: 'cpu', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>, label: 'បច្ចេកវិទ្យា' },
    { id: 'mic', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>, label: 'និយាយ' },
    { id: 'star', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, label: 'ពូកែ' },
    { id: 'award', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>, label: 'រង្វាន់' },
    { id: 'users', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, label: 'ក្រុម' },
    { id: 'sun', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, label: 'ព្រឹក' }
];


export default function ScoresPage() {
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [teacherProfileId, setTeacherProfileId] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]); // Global live students
  const [scores, setScores] = useState<any[]>([]); // Snapshot score records for the selected month/class
  const [allScores, setAllScores] = useState<any[]>([]); // Global scores for computing progress
  const [selectedClassIdsFilter, setSelectedClassIdsFilter] = useState<string[]>([]);
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const [classSearchFilter, setClassSearchFilter] = useState('');
  const classFilterRef = useRef<HTMLDivElement>(null);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scoreSortConfig, setScoreSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scoreSortConfig');
      if (saved) return JSON.parse(saved);
    }
    return { key: 'fullName', direction: 'asc' };
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedScoreMonth');
      if (saved) return saved;
    }
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  useEffect(() => {
    if (scoreSortConfig) localStorage.setItem('scoreSortConfig', JSON.stringify(scoreSortConfig));
  }, [scoreSortConfig]);

  useEffect(() => {
    if (selectedMonth) localStorage.setItem('selectedScoreMonth', selectedMonth);
  }, [selectedMonth]);
  
  // Settings
  const [settings, setSettings] = useState<any>({
    maxSubjects: 1,
    gradeA: 90,
    gradeB: 80,
    gradeC: 70,
    gradeD: 60,
    gradeE: 50,
    coefficientType: 'auto',
    customMaxScore: 250
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);

  const computedScores = useMemo(() => {
    let maxTotalScore = 0;
    if (settings.coefficientType !== 'custom') {
      maxTotalScore = Math.max(...scores.map(s => parseFloat(s.totalScore) || 0));
      if (maxTotalScore <= 0) maxTotalScore = 50; // fallback
    }
    
    let currentCoeff = 1;
    if (settings.coefficientType === 'custom') {
      currentCoeff = (Number(settings.customMaxScore) || 250) / 50;
    } else {
      currentCoeff = (maxTotalScore + 5) / 50;
    }
    if (currentCoeff <= 0) currentCoeff = 1;

    const mapped = scores.map(s => {
      const total = parseFloat(s.totalScore) || 0;
      let avg = total / currentCoeff;
      
      const avgPercentage = (avg / 50) * 100;
      let grade = 'F';
      if (avgPercentage >= (settings.gradeA || 90)) grade = 'A';
      else if (avgPercentage >= (settings.gradeB || 80)) grade = 'B';
      else if (avgPercentage >= (settings.gradeC || 70)) grade = 'C';
      else if (avgPercentage >= (settings.gradeD || 60)) grade = 'D';
      else if (avgPercentage >= (settings.gradeE || 50)) grade = 'E';
      
      return {
        ...s,
        dynAverage: s.totalScore === '' ? '' : avg.toFixed(2),
        dynGrade: s.totalScore === '' ? '' : grade,
        dynRemarks: s.totalScore === '' ? '' : calculateRemarks(grade),
        avgNum: s.totalScore === '' ? -1 : avg
      };
    });
    
    const scored = [...mapped].filter(s => s.avgNum !== -1);
    scored.sort((a, b) => b.avgNum - a.avgNum);
    
    let currentRank = 1;
    let currentAvg = -1;
    const ranks: Record<string, number> = {};
    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      if (s.avgNum !== currentAvg) {
        currentRank = i + 1;
        currentAvg = s.avgNum;
      }
      ranks[s.id as string] = currentRank;
    }
    
    return {
      currentCoeff,
      maxTotalScore,
      rows: mapped.map(s => ({
        ...s,
        dynRank: ranks[s.id] || ''
      }))
    };
  }, [scores, settings]);

  useEffect(() => {
    if (scores.length === 0) return;
    const timer = setTimeout(() => {
      const updates: Promise<void>[] = [];
      scores.forEach(s => {
        const computed = computedScores.rows.find(r => r.id === s.id);
        if (computed) {
          let needsUpdate = false;
          const toUpdate: any = {};
          if (s.average !== computed.dynAverage) { toUpdate.average = computed.dynAverage; needsUpdate = true; }
          if (s.grade !== computed.dynGrade) { toUpdate.grade = computed.dynGrade; needsUpdate = true; }
          if (s.remarks !== computed.dynRemarks) { toUpdate.remarks = computed.dynRemarks; needsUpdate = true; }
          if (s.rank !== computed.dynRank?.toString()) { toUpdate.rank = computed.dynRank?.toString(); needsUpdate = true; }
          
          if (needsUpdate && s.id) {
            updates.push(scoreService.update(s.id, toUpdate));
          }
        }
      });
      if (updates.length > 0) Promise.all(updates);
    }, 2000);
    return () => clearTimeout(timer);
  }, [computedScores, scores]);
const [isCoeffModalOpen, setIsCoeffModalOpen] = useState(false);
  const clearDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const parseCSVLine = (str: string) => {
        let ret = [], keep = false, col = "";
        for(let i=0; i<str.length; i++) {
          if(str[i] === '"') keep = !keep;
          else if(str[i] === ',' && !keep) { ret.push(col.trim()); col = ""; }
          else col += str[i];
        }
        ret.push(col.trim());
        return ret;
      };

      const rows = text.split('\n').map(parseCSVLine);
      if (rows.length < 2) return;

      const headers = rows[0];
      const idIndex = headers.findIndex(h => h.includes('អត្តលេខ'));
      const quizIndex = headers.findIndex(h => h.toLowerCase().includes('quiz'));
      const exerciseIndex = headers.findIndex(h => h.toLowerCase().includes('exercise'));
      const speakingIndex = headers.findIndex(h => h.toLowerCase().includes('speaking'));
      const homeworkIndex = headers.findIndex(h => h.toLowerCase().includes('homework'));
      const testIndex = headers.findIndex(h => h.toLowerCase().includes('test'));

      if (idIndex === -1) {
        alert('រកមិនឃើញជួរឈរ អត្តលេខ នៅក្នុងឯកសារ Excel ទេ!');
        return;
      }

      let updatedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;

        const studentId = row[idIndex];
        if (!studentId) continue;

        const existingScore = scores.find(s => s.studentIdCode === studentId);
        if (existingScore) {
          const updatedScore = { ...existingScore };
          if (quizIndex !== -1 && row[quizIndex] !== undefined) updatedScore.quiz = row[quizIndex];
          if (exerciseIndex !== -1 && row[exerciseIndex] !== undefined) updatedScore.exercise = row[exerciseIndex];
          if (speakingIndex !== -1 && row[speakingIndex] !== undefined) updatedScore.speaking = row[speakingIndex];
          if (homeworkIndex !== -1 && row[homeworkIndex] !== undefined) updatedScore.homework = row[homeworkIndex];
          if (testIndex !== -1 && row[testIndex] !== undefined) updatedScore.test = row[testIndex];
          
          await scoreService.update(updatedScore.id, updatedScore);
          updatedCount++;
        }
      }
      
      alert(`បានបញ្ចូលពិន្ទុជោគជ័យចំនួន ${updatedCount} នាក់!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clearDropdownRef.current && !clearDropdownRef.current.contains(event.target as Node)) {
        setIsClearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearColumn = async (columnKey: string, columnName: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបពិន្ទុ ${columnName} ទាំងអស់មែនទេ?`)) return;
    setIsClearDropdownOpen(false);
    
    const updatedScores = scores.map(s => {
      let currentRec = { ...s, [columnKey]: '' };
      const SCORE_FIELDS = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
      let total = 0;
      let hasAnyValue = false;
      SCORE_FIELDS.forEach(sub => {
        const val = currentRec[sub];
        if (val && !isNaN(parseFloat(val))) {
          total += parseFloat(val);
          hasAnyValue = true;
        }
      });
      
      if (hasAnyValue) {
        currentRec.totalScore = total.toString();
        let divisor = 1;
        if (settings.coefficientType === 'custom') {
          divisor = (Number(settings.customMaxScore) || 250) / 50;
        } else {
          divisor = Number(settings.maxSubjects) || 1;
        }
        if (divisor <= 0) divisor = 1;
        const avgNum = total / divisor;
        currentRec.average = avgNum.toFixed(2).replace(/\.00$/, '');
        
        let g = 'F';
        if (avgNum >= settings.gradeA) g = 'A';
        else if (avgNum >= settings.gradeB) g = 'B';
        else if (avgNum >= settings.gradeC) g = 'C';
        else if (avgNum >= settings.gradeD) g = 'D';
        else if (avgNum >= settings.gradeE) g = 'E';
        currentRec.grade = g;
        
        let r = '';
        if (g === 'A') r = 'ល្អណាស់';
        else if (g === 'B') r = 'ល្អ';
        else if (g === 'C') r = 'ល្អបង្គួរ';
        else if (g === 'D') r = 'មធ្យម';
        else if (g === 'E') r = 'ខ្សោយ';
        else if (g === 'F') r = 'ខ្សោយណាស់';
        currentRec.remarks = r;
      } else {
        currentRec.totalScore = '';
        currentRec.average = '';
        currentRec.grade = '';
        currentRec.remarks = '';
      }
      return currentRec;
    });

    setScores(updatedScores);
    await Promise.all(updatedScores.map(s => scoreService.update(s.id, s)));
  };

  const handleClearAll = async () => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យបញ្ជីឈ្មោះទាំងអស់ក្នុងខែនេះមែនទេ?`)) return;
    setIsClearDropdownOpen(false);
    await Promise.all(scores.map(s => scoreService.delete(s.id)));
    setScores([]);
  };

  useEffect(() => { 
    setRole(localStorage.getItem('userRole') || ''); 
    setUserId(localStorage.getItem('userId') || '');
    setUserName(localStorage.getItem('userName') || '');
    setTeacherProfileId(localStorage.getItem('teacherProfileId') || '');
    
    // Fetch Settings
    const unsubSettings = settingsService.subscribeOne('scoreSettings', (data) => {
      if (data) {
        setSettings(data);
      }
    });

    const unsubClasses = classService.subscribeAll((data: any[]) => {
      const activeClasses = data.filter((c: any) => c.status !== 'បានបញ្ចប់');
      setClasses(activeClasses);
    });

    const unsubStudents = studentService.subscribeAll((data: any[]) => {
      setAllStudents(data);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubStudents();
    };
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const unsubScores = scoreService.subscribeAll((data: any[]) => {
        const filteredScores = data.filter((s: any) => s.classId === selectedClassId && s.month === selectedMonth);
        setScores(filteredScores);
      });

      return () => {
        unsubScores();
      };
    }
  }, [selectedClassId, selectedMonth]);

  // Derived filtered classes
  const displayClasses = role === 'admin' 
    ? classes 
    : classes.filter(c => c.teacherId === teacherProfileId || c.teacherId === userId || c.teacherName === userName);

    const calculateAutoGrade = (average: number) => {
    const avgPercentage = (average / 50) * 100;
    if (avgPercentage >= (settings.gradeA || 90)) return 'A';
    if (avgPercentage >= (settings.gradeB || 80)) return 'B';
    if (avgPercentage >= (settings.gradeC || 70)) return 'C';
    if (avgPercentage >= (settings.gradeD || 60)) return 'D';
    if (avgPercentage >= (settings.gradeE || 50)) return 'E';
    return 'F';
  };

    function calculateRemarks(grade: string) {
    switch (grade) {
      case 'A': return 'ល្អប្រសើរ';
      case 'B': return 'ល្អ';
      case 'C': return 'ល្អបង្គួរ';
      case 'D': return 'មធ្យម';
      case 'E': return 'មធ្យម';
      case 'F': return 'ខ្សោយ';
      default: return '';
    }
  };
const handleScoreChange = async (scoreRec: any, field: string, value: string) => {
    const updatedScore = { ...scoreRec, [field]: value };
    
    // Auto calculate if a subject changes
    const subjects = ['quiz', 'exercise', 'speaking', 'homework', 'test'];
    if (subjects.includes(field)) {
      let total = 0;
      let hasAnyValue = false;
      subjects.forEach(sub => {
        const val = updatedScore[sub];
        if (val && !isNaN(parseFloat(val))) {
          total += parseFloat(val);
          hasAnyValue = true;
        }
      });
      
      if (hasAnyValue) {
        updatedScore.totalScore = total.toString();
        let divisor = 1;
        if (settings.coefficientType === 'custom') {
          divisor = (Number(settings.customMaxScore) || 250) / 50;
        } else {
          divisor = Number(settings.maxSubjects) || 1;
        }
        if (divisor <= 0) divisor = 1;
        const avgNum = total / divisor;
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.totalScore = '';
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    // Auto Calculate Average & Grade if totalScore changes manually
    if (field === 'totalScore') {
      const totalNum = parseFloat(value);
      if (!isNaN(totalNum)) {
        const avgNum = totalNum / (Number(settings.maxSubjects) || 1);
        updatedScore.average = avgNum.toFixed(2).replace(/\.00$/, '');
        updatedScore.grade = calculateAutoGrade(avgNum);
        updatedScore.remarks = calculateRemarks(updatedScore.grade);
      } else {
        updatedScore.average = '';
        updatedScore.grade = '';
        updatedScore.remarks = '';
      }
    }

    if (updatedScore.id) {
      await scoreService.update(updatedScore.id, updatedScore);
    }
  };

  

  const handlePaste = async (e: React.ClipboardEvent, startStudentIndex: number, field: string) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const rows = pasteText.split(/\r?\n/);
    
    for (let i = 0; i < rows.length; i++) {
      const val = rows[i].trim();
      const studentIndex = startStudentIndex + i;
      if (studentIndex < scores.length && val !== '') {
        await handleScoreChange(scores[studentIndex], field, val);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.add(settings, 'scoreSettings');
    setIsSettingsModalOpen(false);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  useEffect(() => {
    if (selectedClassId && scores.length > 0 && selectedClass) {
      const timer = setTimeout(async () => {
        const totalStudents = scores.length;
        if (totalStudents === 0) return;
        
        const studentsWithScore = scores.filter(s => s.totalScore && s.totalScore !== '').length;
        const completionRate = studentsWithScore / totalStudents;
        const isCompleted = completionRate >= 0.8;
        
        let currentCompletedMonths = selectedClass.completedMonths || [];
        const hasMonth = currentCompletedMonths.includes(selectedMonth);
        
        if (isCompleted && !hasMonth) {
          await classService.update(selectedClassId, { completedMonths: [...currentCompletedMonths, selectedMonth] });
        } else if (!isCompleted && hasMonth) {
          const newCompleted = currentCompletedMonths.filter((m: string) => m !== selectedMonth);
          await classService.update(selectedClassId, { completedMonths: newCompleted });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scores, selectedClassId, selectedClass, selectedMonth]);

  const importStudentsFromClass = async () => {
    if (!selectedClass) return;
    
    // Find all live students that belong to this class
    const classStudentIds = selectedClass.studentIds || (selectedClass.studentsData ? selectedClass.studentsData.map((s: any) => s.id) : []);
    const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
    
    let importedCount = 0;
    
    for (const student of classStudents) {
      // Check if they already exist in this month's score snapshot
      const exists = scores.some(scoreRec => scoreRec.studentId === student.id);
      
      if (!exists) {
        await scoreService.add({
          classId: selectedClass.id,
          studentId: student.id, // Reference to original student
          month: selectedMonth,
          
          // Snapshot info
          studentIdCode: student.studentId || '',
          fullName: student.fullName || '',
          gender: student.gender || '',
          
          // Subject Scores
          quiz: '',
          exercise: '',
          speaking: '',
          homework: '',
          test: '',

          // Summary Score fields (always empty by default)
          totalScore: '',
          average: '',
          rank: '',
          grade: '',
          remarks: ''
        });
        importedCount++;
      }
    }
    
    if (importedCount > 0) {
      alert(`បានទាញយកសិស្សចំនួន ${importedCount} នាក់ដោយជោគជ័យ!`);
    } else {
      alert('មិនមានសិស្សថ្មីសម្រាប់ទាញយកទេ!');
    }
  };

  const removeScoreRecord = async (scoreId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបសិស្សនេះចេញពីបញ្ជីពិន្ទុខែនេះមែនទេ? (វាមិនប៉ះពាល់ដល់បញ្ជីសិស្សក្នុងថ្នាក់ទេ)')) {
      await scoreService.delete(scoreId);
    }
  };

  const exportToCSV = () => {
    if (scores.length === 0) return;
    const headers = ['អត្តលេខ', 'ឈ្មោះសិស្ស', 'ភេទ', 'Quiz', 'Exercise', 'Speaking', 'Homework', 'Test', 'ពិន្ទុសរុប', 'មធ្យមភាគ', 'និទ្ទេស', 'ចំណាត់ថ្នាក់', 'មូលវិចារណ៍'];
    const csvContent = [
      headers.join(','),
      ...scores.map(s => [
        `"${s.studentIdCode || ''}"`,
        `"${s.fullName || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.quiz || ''}"`,
        `"${s.exercise || ''}"`,
        `"${s.speaking || ''}"`,
        `"${s.homework || ''}"`,
        `"${s.test || ''}"`,
        `"${s.totalScore || ''}"`,
        `"${s.average || ''}"`,
        `"${s.grade || ''}"`,
        `"${s.rank || ''}"`,
        `"${s.remarks || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scores_${selectedClass?.className}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!selectedClassId) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>បញ្ចូលពិន្ទុ (Scores)</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
            />
          </div>
        </div>
        
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          សូមជ្រើសរើសថ្នាក់ដែលអ្នកចង់បញ្ចូលពិន្ទុ។
        </p>

        <div className="grid-cards">
          {displayClasses.map(c => {
            // Count live students for this class
            const classStudentIds = c.studentIds || (c.studentsData ? c.studentsData.map((s: any) => s.id) : []);
            const classStudents = allStudents.filter((s: any) => classStudentIds.includes(s.id) && s.status !== 'ឈប់រៀន');
            const total = classStudents.length;
            const female = classStudents.filter(s => s.gender === 'ស្រី').length;
            const male = total - female;
            
            const isCompleted = (c.completedMonths || []).includes(selectedMonth);

            return (
              <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="glass-panel glass-panel-hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ 
                  background: `${COLORS.find(col => col.id === c.color)?.value || '#3b82f6'}15`, 
                  color: COLORS.find(col => col.id === c.color)?.value || '#3b82f6', 
                  padding: '1.25rem', 
                  borderRadius: '20px', 
                  fontSize: '2.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '80px', 
                  height: '80px' 
                }}>
                  {ICONS.find(i => i.id === c.icon)?.icon || '📚'}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.className}</h3>
                
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  សរុប <b>{total}</b> &nbsp;&nbsp; ស្រី <b>{female}</b> / ប្រុស <b>{male}</b>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem', color: isCompleted ? '#3b82f6' : '#ef4444' }}>
                  {isCompleted ? 'បញ្ចូលរួចរាល់✔' : 'មិនទាន់បញ្ចូលx'}
                </div>
              </div>
            );
          })}
          {displayClasses.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>មិនមានថ្នាក់រៀនទេ</div>
          )}
        </div>

        {isSettingsModalOpen && (
          <div onClick={() => setIsSettingsModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '2rem', background: 'var(--modal-bg)', width: '90%', maxWidth: '500px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0' }}>កំណត់ការគណនាពិន្ទុ</h2>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>ចំនួនមុខវិជ្ជាសរុប (សម្រាប់ចែកមធ្យមភាគ)</label>
                  <input type="number" className="input-field" value={settings.maxSubjects || 1} onChange={e => setSettings({...settings, maxSubjects: parseInt(e.target.value)})} min="1" required />
                </div>
                
                <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1rem' }}>កំណត់និទ្ទេស (ភាគរយមធ្យមភាគ)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស A (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeA || 90} onChange={e => setSettings({...settings, gradeA: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស B (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeB || 80} onChange={e => setSettings({...settings, gradeB: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស C (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeC || 70} onChange={e => setSettings({...settings, gradeC: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស D (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeD || 60} onChange={e => setSettings({...settings, gradeD: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem' }}>និទ្ទេស E (≥)</label>
                    <input type="number" className="input-field" value={settings.gradeE || 50} onChange={e => setSettings({...settings, gradeE: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn" onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>បោះបង់</button>
                  <button type="submit" className="btn btn-primary">រក្សាទុក</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const snapshotTotal = scores.length;
  const snapshotFemale = scores.filter(s => s.gender === 'ស្រី').length;
  const snapshotMale = snapshotTotal - snapshotFemale;

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem', maxWidth: '100vw', overflowX: 'auto' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn" onClick={() => setSelectedClassId(null)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem' }}>
             &larr; ថយក្រោយ
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ថ្នាក់៖ {selectedClass?.className}</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 500 }}>ខែ/ឆ្នាំ៖</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
            />
          </div>
          
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>បញ្ជីសិស្សក្នុងថ្នាក់</h3>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>សរុប {snapshotTotal} នាក់</span>
            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ស្រី {snapshotFemale} នាក់</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '500' }}>ប្រុស {snapshotMale} នាក់</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={importStudentsFromClass}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            title="ទាញយកបញ្ជីឈ្មោះសិស្សពីថ្នាក់ចូលក្នុងខែនេះ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>

          <button 
            onClick={() => setIsCoeffModalOpen(true)}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
            title="កំណត់មេគុណសម្រាប់មធ្យមភាគ"
          >
            🔢 មេគុណ: {computedScores.currentCoeff}
          </button>
          <SortDropdown 
            options={[
              { value: 'studentIdCode', label: 'អត្តលេខ' },
              { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
              { value: 'gender', label: 'ភេទ' },
              { value: 'totalScore', label: 'ពិន្ទុសរុប' },
              { value: 'average', label: 'មធ្យមភាគ' },
              { value: 'rank', label: 'ចំណាត់ថ្នាក់' }
            ]}
            sortBy={scoreSortConfig?.key || 'fullName'}
            sortOrder={scoreSortConfig?.direction || 'asc'}
            onSortChange={(by, order) => {
              setScoreSortConfig({ key: by, direction: order });
            }}
          />

          <div style={{ position: 'relative' }} ref={clearDropdownRef}>
            <button 
              onClick={() => setIsClearDropdownOpen(!isClearDropdownOpen)} 
              className="btn" 
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
              title="លុបទិន្នន័យតាមជួរឈរ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              លុបទិន្នន័យ
            </button>
            
            {isClearDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                background: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 50, padding: '0.5rem 0',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ជ្រើសរើសជួរឈរត្រូវលុប</div>
                {[
                  { key: 'quiz', label: 'Quiz' },
                  { key: 'exercise', label: 'Exercise' },
                  { key: 'speaking', label: 'Speaking' },
                  { key: 'homework', label: 'Homework' },
                  { key: 'test', label: 'Test' }
                ].map(col => (
                  <div 
                    key={col.key}
                    onClick={() => handleClearColumn(col.key, col.label)}
                    style={{
                      padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: 'var(--danger)', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    លុប {col.label}
                  </div>
                ))}

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <div 
                  onClick={handleClearAll}
                  style={{
                    padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--danger)', transition: 'background 0.2s', fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  លុបទាំងអស់ (Clear All)
                </div>
              </div>
            )}
          </div>

          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            បញ្ចូល (Import)
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />

          <button onClick={exportToCSV} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            ទាញយក Excel
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', overflowX: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ល.រ</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>អត្តលេខ</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-secondary)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>ឈ្មោះសិស្ស</th>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ភេទ</th>
              
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Quiz</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Exercise</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Speaking</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Homework</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>Test</div>
              </th>

              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontWeight: 'bold' }}>ពិន្ទុសរុប</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '50px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0 auto" }}>មធ្យមភាគ</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>និទ្ទេស</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '45px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>ចំណាត់ថ្នាក់</div>
              </th>
              <th style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'bottom', height: '100px', minWidth: '80px', border: '1px solid var(--border-color)' }}>
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>មូលវិចារណ៍</div>
              </th>
              <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>ផ្សេងៗ</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const sortedScores = [...computedScores.rows].sort((a: any, b: any) => {
                if (!scoreSortConfig) {
                  // Default: Female first, then Name
                  if (a.gender === 'ស្រី' && b.gender !== 'ស្រី') return -1;
                  if (a.gender !== 'ស្រី' && b.gender === 'ស្រី') return 1;
                  return (a.fullName || '').localeCompare(b.fullName || '', 'km');
                }
                const { key, direction } = scoreSortConfig;
                const aVal = (a[key] || '').toString();
                const bVal = (b[key] || '').toString();
                
                let comparison = 0;
                if (!isNaN(Number(aVal)) && !isNaN(Number(bVal)) && aVal !== '' && bVal !== '') {
                  comparison = Number(aVal) - Number(bVal);
                } else {
                  comparison = aVal.localeCompare(bVal, 'km');
                }
                return direction === 'asc' ? comparison : -comparison;
              });

              return sortedScores.map((scoreRec, index) => {
                const studentMaster = allStudents.find(s => s.studentIdCode === scoreRec.studentIdCode);
                const displayFullName = studentMaster ? studentMaster.fullName : scoreRec.fullName;
                const displayGender = studentMaster ? studentMaster.gender : scoreRec.gender;
                return (
                  <tr key={scoreRec.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{index + 1}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{scoreRec.studentIdCode || 'N/A'}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 9, background: 'var(--main-bg)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>{displayFullName}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: displayGender === 'ស្រី' ? '#ec4899' : 'var(--text-primary)', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}>{displayGender}</td>
                    
                    {/* New Subject Columns */}
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="number" step="any" value={scoreRec.quiz || ""}
                        onChange={(e) => handleScoreChange(scoreRec, 'quiz', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'quiz')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="number" step="any" value={scoreRec.exercise || ""}
                        onChange={(e) => handleScoreChange(scoreRec, 'exercise', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'exercise')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="number" step="any" value={scoreRec.speaking || ""}
                        onChange={(e) => handleScoreChange(scoreRec, 'speaking', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'speaking')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="number" step="any" value={scoreRec.homework || ""}
                        onChange={(e) => handleScoreChange(scoreRec, 'homework', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'homework')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>
                    <td style={{ padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="number" step="any" value={scoreRec.test || ""}
                        onChange={(e) => handleScoreChange(scoreRec, 'test', e.target.value)}
                        onPaste={(e) => handlePaste(e, index, 'test')}
                        style={{ width: '45px', padding: '0.25rem 0', textAlign: 'center', borderRadius: '4px', border: '1px solid transparent', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                        placeholder=""
                      />
                    </td>

                    {/* Total Score */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)', width: '70px', minWidth: '70px' }}>
                      {scoreRec.totalScore || '-'}
                    </td>
                    
                    {/* Average */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
                      {scoreRec.dynAverage || '-'}
                    </td>

                    {/* Grade */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981', border: '1px solid var(--border-color)' }}>
                      {scoreRec.dynGrade || "-"}
                    </td>

                    {/* Rank */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b', border: '1px solid var(--border-color)' }}>
                      {scoreRec.dynRank || "-"}
                    </td>

                    {/* Remarks */}
                    <td style={{ padding: '0.2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', minWidth: '80px' }}>
                      {scoreRec.dynRemarks || '-'}
                    </td>

                    <td style={{ padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <button 
                        onClick={() => removeScoreRecord(scoreRec.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1.2rem' }}
                        title="លុបចេញពីខែនេះ"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              });
            })()}
            {scores.length === 0 && (
              <tr>
                <td colSpan={15} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  មិនមានសិស្សក្នុងខែនេះទេ។ <br/><br/>
                  សូមចុចប៊ូតុង <b>"+"</b> នៅខាងលើដើម្បីទាញយកបញ្ជីឈ្មោះពីថ្នាក់រៀន។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        * គន្លឹះ៖ លោកអ្នកអាច Copy (Ctrl+C) ទិន្នន័យពី Excel រួច Paste (Ctrl+V) ចូលក្នុងប្រអប់ណាមួយ វាអានជាជួរស្វ័យប្រវត្តិ។ រាល់ការវាយបញ្ចូលនឹង Save ចូលប្រព័ន្ធដោយស្វ័យប្រវត្តិ។
      </p>
      {isCoeffModalOpen && (
          <div onClick={() => setIsCoeffModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div onClick={(e) => e.stopPropagation()} className="glass-panel animate-scale-in" style={{ padding: '2rem', background: 'var(--modal-bg)', width: '90%', maxWidth: '400px', borderRadius: '16px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>កំណត់មេគុណ (Coefficient)</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                មេគុណនឹងត្រូវបានប្រើប្រាស់សម្រាប់ចែកពិន្ទុសរុប ដើម្បីស្វែងរកមធ្យមភាគ។
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={settings.coefficientType !== 'custom'}
                    onChange={() => {
                      const newSettings = {...settings, coefficientType: 'auto'};
                      setSettings(newSettings);
                      settingsService.update('scoreSettings', newSettings);
                    }} 
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1. ផ្អែកតាមពិន្ទុអតិបរមាក្នុងបញ្ជី</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>មេគុណ = (ពិន្ទុសរុបអតិបរមា + 5) ចែកនឹង ៥០</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="coeffType" 
                    checked={settings.coefficientType === 'custom'}
                    style={{ marginTop: '0.25rem' }}
                    onChange={() => {
                      const newSettings = {...settings, coefficientType: 'custom'};
                      setSettings(newSettings);
                      settingsService.update('scoreSettings', newSettings);
                    }} 
                  />
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>2. កំណត់ពិន្ទុអតិបរមាខ្លួនឯង</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>មេគុណ = ពិន្ទុអតិបរមា ចែកនឹង ៥០</div>
                    {settings.coefficientType === 'custom' && (
                      <input 
                        type="number" 
                        value={settings.customMaxScore || 250} 
                        onChange={e => {
                          const newSettings = {...settings, customMaxScore: parseFloat(e.target.value)};
                          setSettings(newSettings);
                          settingsService.update('scoreSettings', newSettings);
                        }}
                        placeholder="ឧ. 250"
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
                      />
                    )}
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsCoeffModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>បិទ / រក្សាទុក</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
