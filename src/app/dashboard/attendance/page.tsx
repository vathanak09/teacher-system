"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { classService, teacherService, studentService, attendanceService } from '@/services/db';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import MultiSortDropdown, { SortRule } from '@/components/MultiSortDropdown';
import { CLASS_COLORS, CLASS_ICONS } from '@/constants/classAppearance';
import { convertDriveImageLink } from '@/utils/driveLink';
import { AppIcon } from '@/components/AppIcons';
import AttendancePrintModal from '@/components/attendance/AttendancePrintModal';

const DEFAULT_ATTENDANCE_SORTS: SortRule[] = [
  { field: 'level', order: 'asc' },
  { field: 'fullName', order: 'asc' },
];

function getClassStudentIds(cls: any): string[] {
  if (!cls) return [];
  if (Array.isArray(cls.studentIds)) return cls.studentIds;
  if (Array.isArray(cls.studentsData)) return cls.studentsData.map((s: any) => s.id);
  return [];
}

export default function AttendancePage() {
  const [role, setRole] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [classSearchFilterInput, setClassSearchFilterInput] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Date selection
  const nowRef = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(nowRef.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(nowRef.getFullYear());

  // Attendance Records: { [studentId]: { [day]: 'present' | 'absent' | 'permission' } }
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<number, string>>>({});
  const [unlockedDay, setUnlockedDay] = useState(nowRef.getDate());
  const [unlockedDayInput, setUnlockedDayInput] = useState(String(nowRef.getDate()));
  const [sortRules, setSortRules] = useState<SortRule[]>(DEFAULT_ATTENDANCE_SORTS);
  const [scrollNonce, setScrollNonce] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const stickyNameThRef = useRef<HTMLTableCellElement>(null);
  const dayHeaderRefs = useRef<Record<number, HTMLTableCellElement | null>>({});
  const router = useRouter();

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    setRole(currentRole);

    if (currentRole !== 'admin' && currentRole !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    const unsubscribeClasses = classService.subscribeAll((data) => {
      const teacherProfileId = localStorage.getItem('teacherProfileId') || '';
      if (currentRole === 'admin') {
        setClasses(data);
      } else {
        setClasses(
          data.filter(
            (c: any) =>
              c.teacherId === teacherProfileId ||
              c.teacherId === currentUserId ||
              c.teacherName === currentUserName
          )
        );
      }
    });

    const unsubscribeTeachers = teacherService.subscribeAll(setTeachers);
    const unsubscribeStudents = studentService.subscribeAll(setStudents);

    return () => {
      unsubscribeClasses();
      unsubscribeTeachers();
      unsubscribeStudents();
    };
  }, [router]);

  // Load attendance data when class/month/year changes
  useEffect(() => {
    if (!selectedClassId) return;

    const docId = `${selectedClassId}_${selectedYear}_${selectedMonth}`;
    const loadAttendance = async () => {
      try {
        const doc = await attendanceService.getById(docId);
        if (doc && doc.records) {
          setAttendanceRecords(doc.records);
        } else {
          setAttendanceRecords({});
        }
      } catch (error) {
        console.error('Error loading attendance', error);
        setAttendanceRecords({});
      }
    };
    loadAttendance();
  }, [selectedClassId, selectedMonth, selectedYear]);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

  // Auto-scroll attendance table horizontally to today's column when opening a class or tapping Today
  useEffect(() => {
    if (!selectedClassId) return;

    const timer = window.setTimeout(() => {
      const container = tableScrollRef.current;
      if (!container) return;

      const today = new Date();
      const maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const isCurrentMonthYear =
        selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1;
      const targetDay = isCurrentMonthYear
        ? Math.min(maxDay, today.getDate())
        : Math.min(maxDay, unlockedDay);

      const targetTh = dayHeaderRefs.current[targetDay];
      if (!targetTh) return;

      const stickyWidth = stickyNameThRef.current ? stickyNameThRef.current.offsetWidth : 130;
      const availableWidth = Math.max(60, container.clientWidth - stickyWidth);
      const desiredOffset = stickyWidth + Math.max(12, Math.floor((availableWidth - targetTh.offsetWidth) / 2));
      const nextScrollLeft = Math.max(0, targetTh.offsetLeft - desiredOffset);

      container.scrollTo({ left: nextScrollLeft, behavior: 'smooth' });
    }, 80);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedMonth, selectedYear, scrollNonce]);

  const resolveClassStudents = (cls: any, recordsMap?: Record<string, Record<number, string>>) => {
    if (!cls) return [];
    const classStudentIds = getClassStudentIds(cls);
    return students.filter((s) => {
      const inClass = classStudentIds.includes(s.id) || s.className === cls.className;
      if (!inClass) return false;
      if (s.status !== 'ឈប់រៀន') return true;
      // Preserve student row in historical months only if attendance data was already recorded for them
      const rec = recordsMap?.[s.id];
      return Boolean(rec && Object.values(rec).some((v) => v));
    });
  };

  const markAllPresent = async (day: number) => {
    if (day !== unlockedDay) return;
    if (role !== 'admin' && role !== 'teacher') return;

    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass) return;

    const classStudents = resolveClassStudents(selectedClass, attendanceRecords);
    if (classStudents.length === 0) return;

    const newRecords = { ...attendanceRecords };
    let changed = false;

    const allPresent = classStudents.every((s) => attendanceRecords[s.id]?.[day] === 'present');
    classStudents.forEach((student) => {
      newRecords[student.id] = { ...(newRecords[student.id] || {}) };
      const newValue = allPresent ? '' : 'present';
      if (newRecords[student.id][day] !== newValue) {
        newRecords[student.id][day] = newValue;
        changed = true;
      }
    });

    if (changed) {
      setAttendanceRecords(newRecords);
      const docId = `${selectedClassId}_${selectedYear}_${selectedMonth}`;
      try {
        await attendanceService.add(
          {
            classId: selectedClassId,
            year: selectedYear,
            month: selectedMonth,
            records: newRecords,
            updatedAt: new Date().toISOString(),
          },
          docId
        );
      } catch (error) {
        console.error('Error saving bulk attendance', error);
      }
    }
  };

  const handleAttendanceChange = async (studentId: string, day: number, value: string) => {
    if (role !== 'admin' && role !== 'teacher') return;

    const newRecords = { ...attendanceRecords };
    newRecords[studentId] = { ...(newRecords[studentId] || {}) };
    newRecords[studentId][day] = value;

    setAttendanceRecords(newRecords);

    const docId = `${selectedClassId}_${selectedYear}_${selectedMonth}`;
    try {
      await attendanceService.add(
        {
          classId: selectedClassId,
          year: selectedYear,
          month: selectedMonth,
          records: newRecords,
          updatedAt: new Date().toISOString(),
        },
        docId
      );
    } catch (error) {
      console.error('Error saving attendance', error);
    }
  };

  const availableShifts = useMemo(() => {
    const shifts = new Set<string>();
    classes.forEach((c) => {
      if (c.shift) shifts.add(c.shift);
    });
    return Array.from(shifts);
  }, [classes]);

  const renderClassList = () => {
    const q = classSearchFilterInput.trim().toLowerCase();
    const filteredClasses = classes.filter((c) => {
      if (shiftFilter !== 'all' && c.shift !== shiftFilter) return false;
      if (!q) return true;
      return (
        (c.className || '').toLowerCase().includes(q) ||
        (c.classCode || '').toLowerCase().includes(q) ||
        (c.teacherName || '').toLowerCase().includes(q)
      );
    });

    const grouped: Record<string, any[]> = {};
    filteredClasses.forEach((c) => {
      const teacherName = c.teacherName || 'មិនទាន់កំណត់';
      if (!grouped[teacherName]) grouped[teacherName] = [];
      grouped[teacherName].push(c);
    });

    const teacherKeys = Object.keys(grouped);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {teacherKeys.map((teacherName) => {
          const groupClasses = grouped[teacherName];
          const matchedTeacher = teachers.find(
            (t) =>
              t.fullName === teacherName ||
              groupClasses.some((c) => c.teacherId && (c.teacherId === t.id || c.teacherId === t.linkedUserId))
          );
          const teacherPhoto = matchedTeacher?.photo ? convertDriveImageLink(matchedTeacher.photo) : '';

          return (
            <section key={teacherName}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  marginBottom: '0.95rem',
                  paddingBottom: '0.6rem',
                  borderBottom: '2px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--accent-gradient)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {teacherPhoto ? (
                      <img src={teacherPhoto} alt={teacherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      teacherName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.1 }}>គ្រូបង្រៀន</div>
                    <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {teacherName}
                    </h2>
                  </div>
                </div>

                <span
                  style={{
                    padding: '0.25rem 0.7rem',
                    borderRadius: '999px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {groupClasses.length} ថ្នាក់
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
                  gap: '1rem',
                }}
              >
                {groupClasses.map((c) => {
                  const IconComp = CLASS_ICONS.find((i) => i.id === c.icon)?.icon || CLASS_ICONS[0].icon;
                  const colorHex = CLASS_COLORS.find((co) => co.id === c.color)?.value || CLASS_COLORS[0].value;
                  const activeStudents = resolveClassStudents(c);
                  const totalStudents = activeStudents.length > 0
                    ? activeStudents.length
                    : getClassStudentIds(c).length;
                  const femaleCount = activeStudents.filter((s) => s.gender === 'ស្រី').length;
                  const maleCount = Math.max(0, activeStudents.length - femaleCount);

                  return (
                    <div
                      key={c.id}
                      className="glass-panel glass-panel-hoverable animate-scale-in"
                      onClick={() => setSelectedClassId(c.id)}
                      style={{
                        padding: '1.15rem',
                        cursor: 'pointer',
                        borderStyle: 'solid',
                        borderWidth: '1.5px 1.5px 1.5px 6px',
                        borderColor: `var(--border-color) var(--border-color) var(--border-color) ${colorHex}`,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.9rem',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                      }}
                    >
                      {/* Background Watermark */}
                      <div
                        style={{
                          position: 'absolute',
                          right: '-8px',
                          top: '-8px',
                          opacity: 0.055,
                          transform: 'scale(3.6)',
                          color: colorHex,
                          pointerEvents: 'none',
                        }}
                      >
                        {IconComp}
                      </div>

                      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: `${colorHex}18`,
                            color: colorHex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {IconComp}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '1.14rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {c.className || c.classCode}
                            </h3>
                            {c.classCode && (
                              <span
                                style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'var(--bg-secondary)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: 'var(--text-secondary)',
                                  flexShrink: 0,
                                }}
                              >
                                {c.classCode}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                            {c.academicYear || '2026-2027'} • {c.shift || 'N/A'}
                            {c.level ? ` • ${c.level}` : ''}
                          </div>

                          {c.time && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              ម៉ោង៖ {c.time}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Student Breakdown + Action Cue */}
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          paddingTop: '0.65rem',
                          borderTop: '1px dashed var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.78rem', fontWeight: 600 }}>
                          <span style={{ padding: '0.18rem 0.55rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                            សរុប {totalStudents}
                          </span>
                          {activeStudents.length > 0 && (
                            <>
                              <span style={{ padding: '0.18rem 0.5rem', borderRadius: '999px', background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
                                ស្រី {femaleCount}
                              </span>
                              <span style={{ padding: '0.18rem 0.5rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                                ប្រុស {maleCount}
                              </span>
                            </>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: colorHex,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <span>ស្រង់វត្តមាន</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {teacherKeys.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            មិនមានថ្នាក់រៀនសម្រាប់បង្ហាញទេ។
          </div>
        )}
      </div>
    );
  };

  const renderAttendanceTable = () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass) return null;

    const baseStudents = resolveClassStudents(selectedClass, attendanceRecords);
    const days = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    const classShiftFallback = String(selectedClass.shift || '').trim();

    const studentsWithStats = baseStudents.map((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let permissionCount = 0;
      daysArray.forEach((day) => {
        const status = attendanceRecords[student.id]?.[day];
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'permission') permissionCount++;
      });
      const displayShift = String(student.shift || classShiftFallback).trim();
      return {
        ...student,
        displayShift,
        presentCount,
        absentCount,
        permissionCount,
      };
    });

    const classStudents = [...studentsWithStats].sort((a, b) => {
      const activeRules = sortRules.length > 0 ? sortRules : DEFAULT_ATTENDANCE_SORTS;
      for (const { field, order } of activeRules) {
        let comparison = 0;
        if (field === 'absentCount' || field === 'presentCount' || field === 'permissionCount') {
          comparison = (Number(a[field]) || 0) - (Number(b[field]) || 0);
        } else if (field === 'level') {
          const aLvl = String(a.level || '').trim();
          const bLvl = String(b.level || '').trim();
          if (!aLvl && bLvl) comparison = 1;
          else if (aLvl && !bLvl) comparison = -1;
          else comparison = aLvl.localeCompare(bLvl, 'en', { numeric: true });
        } else if (field === 'shift') {
          const aSh = String(a.displayShift || '').trim();
          const bSh = String(b.displayShift || '').trim();
          if (!aSh && bSh) comparison = 1;
          else if (aSh && !bSh) comparison = -1;
          else comparison = aSh.localeCompare(bSh, 'km', { numeric: true });
        } else if (field === 'studentId') {
          comparison = String(a.studentId || '').localeCompare(String(b.studentId || ''), 'en', {
            numeric: true,
          });
        } else if (field === 'fullName') {
          comparison = String(a.fullName || a.name || '').localeCompare(
            String(b.fullName || b.name || ''),
            'km'
          );
        } else {
          comparison = String(a[field] || '').localeCompare(String(b[field] || ''), 'km', {
            numeric: true,
          });
        }
        if (comparison !== 0) {
          return order === 'asc' ? comparison : -comparison;
        }
      }
      return String(a.fullName || a.name || '').localeCompare(
        String(b.fullName || b.name || ''),
        'km'
      );
    });

    // Count absentees per day for day-column header badges
    const dailyAbsentCounts: Record<number, number> = {};
    let totalMonthPresent = 0;
    let totalMonthAbsent = 0;
    let totalMonthPermission = 0;

    daysArray.forEach((day) => {
      let dayAbsent = 0;
      classStudents.forEach((st) => {
        const status = attendanceRecords[st.id]?.[day];
        if (status === 'absent') {
          dayAbsent++;
          totalMonthAbsent++;
        } else if (status === 'present') {
          totalMonthPresent++;
        } else if (status === 'permission') {
          totalMonthPermission++;
        }
      });
      dailyAbsentCounts[day] = dayAbsent;
    });

    const femaleCount = classStudents.filter((s) => s.gender === 'ស្រី').length;
    const maleCount = classStudents.length - femaleCount;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header & Date Controls */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.15rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.28rem', color: 'var(--text-primary)' }}>
              ថ្នាក់៖ <span style={{ color: 'var(--primary-color)' }}>{selectedClass.className}</span>
            </h2>
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.86rem' }}>
              គ្រូ៖ {selectedClass.teacherName || 'មិនទាន់កំណត់'}
              {selectedClass.shift ? ` • ${selectedClass.shift}` : ''}
              {selectedClass.time ? ` • ${selectedClass.time}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Unlock Day Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'var(--main-bg)',
                padding: '0.25rem 0.45rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, unlockedDay - 1);
                  setUnlockedDay(next);
                  setUnlockedDayInput(String(next));
                }}
                style={stepperBtnStyle}
                aria-label="ថ្ងៃមុន"
              >
                -
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '46px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, lineHeight: 1 }}>
                  Unlock ថ្ងៃ
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="no-spinner"
                  value={unlockedDayInput}
                  onChange={(e) => setUnlockedDayInput(e.target.value)}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      const clamped = Math.min(days, Math.max(1, val));
                      setUnlockedDay(clamped);
                      setUnlockedDayInput(String(clamped));
                    } else {
                      setUnlockedDayInput(String(unlockedDay));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  style={{
                    width: '36px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: 'var(--primary-color)',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(days, unlockedDay + 1);
                  setUnlockedDay(next);
                  setUnlockedDayInput(String(next));
                }}
                style={stepperBtnStyle}
                aria-label="ថ្ងៃបន្ទាប់"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const td = today.getDate();
                  setSelectedMonth(today.getMonth() + 1);
                  setSelectedYear(today.getFullYear());
                  setUnlockedDay(td);
                  setUnlockedDayInput(String(td));
                  setScrollNonce((n) => n + 1);
                }}
                style={{
                  marginLeft: '0.2rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '7px',
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--primary-color)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="កំណត់ទៅថ្ងៃនេះ"
              >
                ថ្ងៃនេះ
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CustomSelectDropdown
                value={String(selectedMonth)}
                onChange={(v) => setSelectedMonth(Number(v))}
                searchable={false}
                menuMinWidth={130}
                style={{ padding: '0.42rem 0.7rem', background: 'var(--main-bg)', width: 'auto', minWidth: '95px' }}
                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `ខែ ${i + 1}` }))}
              />
              <CustomSelectDropdown
                value={String(selectedYear)}
                onChange={(v) => setSelectedYear(Number(v))}
                searchable={false}
                menuMinWidth={110}
                style={{ padding: '0.42rem 0.7rem', background: 'var(--main-bg)', width: 'auto', minWidth: '88px' }}
                options={[nowRef.getFullYear() - 1, nowRef.getFullYear(), nowRef.getFullYear() + 1].map((y) => ({
                  value: String(y),
                  label: String(y),
                }))}
              />
            </div>

            <MultiSortDropdown
              options={[
                { value: 'level', label: 'វគ្គសិក្សា' },
                { value: 'fullName', label: 'ឈ្មោះសិស្ស' },
                { value: 'shift', label: 'វេនសិក្សា' },
                { value: 'studentId', label: 'អត្តលេខ' },
                { value: 'gender', label: 'ភេទ' },
                { value: 'absentCount', label: 'អវត្តមាន' },
                { value: 'presentCount', label: 'មករៀន' },
              ]}
              rules={sortRules}
              defaultRules={DEFAULT_ATTENDANCE_SORTS}
              onChange={setSortRules}
            />
          </div>
        </div>

        {/* Roster Pills + Compact Legend Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.84rem', fontWeight: 600 }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.22rem 0.65rem', borderRadius: '999px' }}>
              សរុប {classStudents.length} នាក់
            </span>
            <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.22rem 0.65rem', borderRadius: '999px' }}>
              ស្រី {femaleCount} នាក់
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.22rem 0.65rem', borderRadius: '999px' }}>
              ប្រុស {maleCount} នាក់
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><AppIcon name="check" size={12} strokeWidth={2.8} /></span>
              មករៀន
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><AppIcon name="x" size={12} strokeWidth={2.8} /></span>
              អវត្តមាន
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>P</span>
              ច្បាប់
            </span>
          </div>
        </div>

        {/* Compact Attendance Table (Modeled after Scores Table) */}
        <div
          ref={tableScrollRef}
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            overflowX: 'auto',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.45rem 0.45rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  ល.រ
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  អត្តលេខ
                </th>
                <th
                  ref={stickyNameThRef}
                  style={{
                    padding: '0.45rem 0.65rem',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    border: '1px solid var(--border-color)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    background: 'var(--modal-bg, var(--bg-secondary))',
                    boxShadow: '2px 0 6px rgba(0,0,0,0.06)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ឈ្មោះសិស្ស
                </th>
                <th style={{ padding: '0.45rem 0.4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  ភេទ
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  វគ្គសិក្សា
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  វេនសិក្សា
                </th>

                {daysArray.map((day) => {
                  const date = new Date(selectedYear, selectedMonth - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isUnlocked = day === unlockedDay;
                  const dayAbsentCount = dailyAbsentCounts[day] || 0;

                  return (
                    <th
                      key={day}
                      className="att-day-col"
                      ref={(el) => {
                        dayHeaderRefs.current[day] = el;
                      }}
                      onClick={() => markAllPresent(day)}
                      title={
                        `${isUnlocked ? 'ចុចដើម្បីដាក់/ដកវត្តមានទាំងអស់ • ' : 'ថ្ងៃជាប់សោរ • '}ថ្ងៃទី ${day}` +
                        (dayAbsentCount > 0 ? ` (អវត្តមាន ${dayAbsentCount} នាក់)` : '')
                      }
                      style={{
                        padding: '0.28rem 0.15rem',
                        textAlign: 'center',
                        minWidth: '33px',
                        width: '33px',
                        verticalAlign: 'bottom',
                        border: '1px solid var(--border-color)',
                        background: isUnlocked
                          ? 'rgba(59, 130, 246, 0.14)'
                          : isWeekend
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'var(--bg-secondary)',
                        color: isUnlocked ? 'var(--primary-color)' : isWeekend ? '#ef4444' : 'var(--text-primary)',
                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                        boxShadow: isUnlocked ? 'inset 0 2.5px 0 var(--primary-color)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                        {dayAbsentCount > 0 ? (
                          <span
                            style={{
                              minWidth: '16px',
                              height: '15px',
                              padding: '0 3px',
                              borderRadius: '999px',
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              lineHeight: '15px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {dayAbsentCount}
                          </span>
                        ) : (
                          <span style={{ height: '15px', display: 'inline-block' }} />
                        )}
                        <span style={{ fontSize: '0.8rem', fontWeight: isUnlocked ? 800 : 600, opacity: isUnlocked ? 1 : 0.78 }}>
                          {day}
                        </span>
                      </div>
                    </th>
                  );
                })}

                <th style={{ padding: '0.25rem', textAlign: 'center', color: '#10b981', verticalAlign: 'bottom', height: '72px', minWidth: '38px', border: '1px solid var(--border-color)' }}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontSize: '0.78rem', fontWeight: 700 }}>
                    មករៀន
                  </div>
                </th>
                <th style={{ padding: '0.25rem', textAlign: 'center', color: '#ef4444', verticalAlign: 'bottom', height: '72px', minWidth: '38px', border: '1px solid var(--border-color)' }}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontSize: '0.78rem', fontWeight: 700 }}>
                    អវត្តមាន
                  </div>
                </th>
                <th style={{ padding: '0.25rem', textAlign: 'center', color: '#f59e0b', verticalAlign: 'bottom', height: '72px', minWidth: '38px', border: '1px solid var(--border-color)' }}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', fontSize: '0.78rem', fontWeight: 700 }}>
                    ច្បាប់
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => (
                <tr key={student.id} className="table-row-hover">
                  <td style={{ padding: '0.32rem 0.45rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '0.32rem 0.5rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                    {student.studentId || '-'}
                  </td>
                  <td
                    style={{
                      padding: '0.32rem 0.65rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      zIndex: 9,
                      background: 'var(--modal-bg, var(--main-bg))',
                      boxShadow: '2px 0 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {student.fullName || student.name || ''}
                  </td>
                  <td
                    style={{
                      padding: '0.32rem 0.4rem',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: student.gender === 'ស្រី' ? '#ec4899' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {student.gender || '-'}
                  </td>
                  <td
                    style={{
                      padding: '0.28rem 0.45rem',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {student.level ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.12rem 0.48rem',
                          borderRadius: '999px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#2563eb',
                          fontWeight: 700,
                        }}
                      >
                        {student.level}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '0.28rem 0.45rem',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {student.displayShift ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.12rem 0.48rem',
                          borderRadius: '999px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#7c3aed',
                          fontWeight: 700,
                        }}
                      >
                        {student.displayShift}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>

                  {daysArray.map((day) => {
                    const date = new Date(selectedYear, selectedMonth - 1, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isUnlocked = day === unlockedDay;
                    const status = attendanceRecords[student.id]?.[day] || '';

                    let btnBg = isUnlocked ? 'rgba(59, 130, 246, 0.05)' : 'transparent';
                    let btnColor = 'inherit';
                    let btnBorder = isUnlocked ? '1px dashed rgba(59, 130, 246, 0.35)' : '1px solid transparent';
                    let symbol: React.ReactNode = null;

                    if (status === 'present') {
                      btnBg = 'rgba(16, 185, 129, 0.16)';
                      btnColor = '#10b981';
                      btnBorder = '1px solid rgba(16, 185, 129, 0.25)';
                      symbol = <AppIcon name="check" size={13} strokeWidth={2.8} />;
                    } else if (status === 'absent') {
                      btnBg = 'rgba(239, 68, 68, 0.16)';
                      btnColor = '#ef4444';
                      btnBorder = '1px solid rgba(239, 68, 68, 0.28)';
                      symbol = <AppIcon name="x" size={13} strokeWidth={2.8} />;
                    } else if (status === 'permission') {
                      btnBg = 'rgba(245, 158, 11, 0.16)';
                      btnColor = '#d97706';
                      btnBorder = '1px solid rgba(245, 158, 11, 0.28)';
                      symbol = 'P';
                    }

                    const cycleStatus = () => {
                      if (!isUnlocked) return;
                      let next = '';
                      if (!status) next = 'present';
                      else if (status === 'present') next = 'absent';
                      else if (status === 'absent') next = 'permission';
                      else next = '';
                      handleAttendanceChange(student.id, day, next);
                    };

                    return (
                      <td
                        key={day}
                        className="att-day-col"
                        style={{
                          padding: '0.16rem 0.12rem',
                          textAlign: 'center',
                          border: '1px solid var(--border-color)',
                          background: isUnlocked
                            ? 'rgba(59, 130, 246, 0.06)'
                            : isWeekend
                              ? 'rgba(239, 68, 68, 0.04)'
                              : 'transparent',
                        }}
                      >
                        <button
                          type="button"
                          onClick={cycleStatus}
                          disabled={!isUnlocked}
                          style={{
                            width: '27px',
                            height: '27px',
                            padding: 0,
                            border: btnBorder,
                            borderRadius: '7px',
                            background: btnBg,
                            color: btnColor,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: isUnlocked ? 'pointer' : 'not-allowed',
                            opacity: isUnlocked ? 1 : 0.72,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            touchAction: 'manipulation',
                            transition: 'transform 0.1s ease',
                          }}
                        >
                          {symbol}
                        </button>
                      </td>
                    );
                  })}

                  <td style={{ padding: '0.25rem', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#10b981', border: '1px solid var(--border-color)' }}>
                    {student.presentCount > 0 ? student.presentCount : '-'}
                  </td>
                  <td style={{ padding: '0.25rem', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', border: '1px solid var(--border-color)' }}>
                    {student.absentCount > 0 ? student.absentCount : '-'}
                  </td>
                  <td style={{ padding: '0.25rem', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#f59e0b', border: '1px solid var(--border-color)' }}>
                    {student.permissionCount > 0 ? student.permissionCount : '-'}
                  </td>
                </tr>
              ))}
              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={9 + days} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Monthly Attendance Summary Card */}
        {classStudents.length > 0 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--card-bg)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>
                សរុបមករៀន៖ <strong style={{ color: '#10b981' }}>{totalMonthPresent}</strong> ដង
              </span>
              <span>
                អវត្តមាន៖ <strong style={{ color: '#ef4444' }}>{totalMonthAbsent}</strong> ដង
              </span>
              <span>
                ច្បាប់៖ <strong style={{ color: '#f59e0b' }}>{totalMonthPermission}</strong> ដង
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              * ចុចលើលេខថ្ងៃ Unlock ដើម្បីដាក់/ដកវត្តមានទាំងអស់ • រក្សាទុកស្វ័យប្រវត្តិ (Auto-save)
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container animate-fade-in">
      <div
        className="flex-between"
        style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {selectedClassId && (
            <button
              type="button"
              onClick={() => setSelectedClassId(null)}
              className="btn"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.5rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--text-primary)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>ថយក្រោយ</span>
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              បញ្ជីវត្តមាន (Attendance)
            </h1>
            {!selectedClassId && (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                ជ្រើសរើសថ្នាក់រៀនដើម្បីស្រង់វត្តមានប្រចាំខែ
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 280px', justifyContent: 'flex-end' }}>
          {!selectedClassId && (
            <>
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះថ្នាក់ កូដ ឬគ្រូ..."
                value={classSearchFilterInput}
                onChange={(e) => setClassSearchFilterInput(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  padding: '0.52rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />

              {availableShifts.length > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShiftFilter('all')}
                    style={shiftChipStyle(shiftFilter === 'all')}
                  >
                    ទាំងអស់
                  </button>
                  {availableShifts.map((shift) => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setShiftFilter(shift)}
                      style={shiftChipStyle(shiftFilter === shift)}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            disabled={classes.length === 0}
            onClick={() => setIsPrintModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.52rem 1rem',
              borderRadius: '10px',
              fontSize: '0.86rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
            title="រៀបចំបញ្ជីវត្តមាន និងបញ្ជីពិន្ទុព្រីនលើក្រដាស A4 តាមថ្នាក់រៀន"
          >
            <AppIcon name="printer" size={16} style={{ color: '#ffffff' }} />
            <span>Print បញ្ជីវត្តមាន &amp; ពិន្ទុ (A4)</span>
          </button>
        </div>
      </div>

      {selectedClassId ? renderAttendanceTable() : renderClassList()}

      {/* Printable A4 Attendance List & Score List Modal */}
      <AttendancePrintModal
        isOpen={isPrintModalOpen}
        classes={classes}
        students={students}
        initialClassId={selectedClassId}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}

const stepperBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '7px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  touchAction: 'manipulation',
};

function shiftChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.42rem 0.78rem',
    borderRadius: '999px',
    border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
    background: active ? 'var(--primary-color)' : 'var(--card-bg)',
    color: active ? '#ffffff' : 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    touchAction: 'manipulation',
  };
}
