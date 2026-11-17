"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  classService,
  scheduleService,
  studentService,
  teacherService,
} from '@/services/db';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import { useConfirm } from '@/components/ConfirmDialog';
import { AppIcon } from '@/components/AppIcons';
import { doesClassBelongToTeacher } from '@/components/dashboard/dashboardMetrics';
import ScheduleTimetable from '@/components/schedule/ScheduleTimetable';
import {
  CellEditorModal,
  RowsEditorModal,
  ScheduleFormModal,
} from '@/components/schedule/ScheduleModals';
import {
  SHIFT_ORDER,
  SHIFT_PRESETS,
  ScheduleCellContent,
  ScheduleRecord,
  ScheduleTimeRow,
  ShiftType,
  WEEK_DAYS,
  WeekDayKey,
  clonePresetRows,
  doesStudentBelongToClass,
  normalizeScheduleRecord,
} from '@/components/schedule/scheduleModel';

export default function SchedulePage() {
  const confirmDialog = useConfirm();

  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [teacherProfileId, setTeacherProfileId] = useState('');

  const [rawSchedules, setRawSchedules] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Navigation
  const [activeShiftTab, setActiveShiftTab] = useState<'all' | ShiftType>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [showAllStacked, setShowAllStacked] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRecord | null>(null);
  const [formDefaultShift, setFormDefaultShift] = useState<ShiftType>('morning');

  const [cellModalState, setCellModalState] = useState<{
    schedule: ScheduleRecord;
    row: ScheduleTimeRow;
    dayKey: WeekDayKey;
    currentCell?: ScheduleCellContent;
  } | null>(null);

  const [rowsModalSchedule, setRowsModalSchedule] = useState<ScheduleRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserName = localStorage.getItem('userName') || '';
    const savedProfileId = localStorage.getItem('teacherProfileId') || '';

    setRole(currentRole);
    setUserId(currentUserId);
    setUserName(currentUserName);
    setTeacherProfileId(savedProfileId);

    const unsubs: (() => void)[] = [];

    unsubs.push(
      scheduleService.subscribeAll((data) => {
        setRawSchedules(data);
        setIsLoading(false);
      })
    );
    unsubs.push(classService.subscribeAll(setAllClasses));
    unsubs.push(teacherService.subscribeAll(setAllTeachers));

    if (currentRole === 'student') {
      unsubs.push(studentService.subscribeAll(setAllStudents));
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  const myTeacherProfile = useMemo(() => {
    if (!isTeacher) return null;
    return (
      allTeachers.find(
        (t) =>
          (teacherProfileId && t.id === teacherProfileId) ||
          (userId && t.linkedUserId === userId) ||
          (userName && t.fullName === userName)
      ) || null
    );
  }, [isTeacher, allTeachers, teacherProfileId, userId, userName]);

  const myTeacherClasses = useMemo(() => {
    if (isAdmin) return allClasses;
    if (!isTeacher) return [];
    return allClasses.filter((cls) =>
      doesClassBelongToTeacher(cls, myTeacherProfile, userId, userName, teacherProfileId)
    );
  }, [isAdmin, isTeacher, allClasses, myTeacherProfile, userId, userName, teacherProfileId]);

  const myTeacherClassIdSet = useMemo(
    () => new Set(myTeacherClasses.map((c) => c.id)),
    [myTeacherClasses]
  );

  // Match logged-in student profile -> classes (if student account)
  const myStudentProfile = useMemo(() => {
    if (!isStudent || allStudents.length === 0) return null;
    const cleanName = userName.trim().toLowerCase();
    const cleanId = userId.trim().toLowerCase();
    return (
      allStudents.find(
        (s) =>
          (cleanName &&
            (String(s.fullName || '').trim().toLowerCase() === cleanName ||
              String(s.englishName || '').trim().toLowerCase() === cleanName)) ||
          (cleanId && String(s.studentId || '').trim().toLowerCase() === cleanId)
      ) || null
    );
  }, [isStudent, allStudents, userName, userId]);

  const myStudentClasses = useMemo(() => {
    if (!isStudent || !myStudentProfile) return [];
    return allClasses.filter((cls) => doesStudentBelongToClass(myStudentProfile, cls));
  }, [isStudent, myStudentProfile, allClasses]);

  const myStudentClassIdSet = useMemo(
    () => new Set(myStudentClasses.map((c) => c.id)),
    [myStudentClasses]
  );

  const classMap = useMemo(() => {
    const m = new Map<string, any>();
    allClasses.forEach((c) => m.set(c.id, c));
    return m;
  }, [allClasses]);

  const schedules = useMemo(() => {
    const list = rawSchedules.map(normalizeScheduleRecord);
    const shiftRank = (s: ShiftType) => SHIFT_ORDER.indexOf(s);
    return list.sort((a, b) => {
      const sr = shiftRank(a.shiftType) - shiftRank(b.shiftType);
      if (sr !== 0) return sr;
      return String(b.updatedAt || b.createdAt || '').localeCompare(
        String(a.updatedAt || a.createdAt || '')
      );
    });
  }, [rawSchedules]);

  // Role-scoped schedules:
  // Admin: all schedules
  // Teacher: schedules created by self OR assigned to any of their classes OR unassigned templates?
  // Note: Showing schedules created by teacher OR assigned to their classes, AND allowing filter if needed.
  const roleScopedSchedules = useMemo(() => {
    if (isAdmin) return schedules;
    if (isTeacher) {
      return schedules.filter((sch) => {
        const createdBySelf =
          (userId && sch.createdById === userId) ||
          (userName && sch.createdByName === userName);
        const assignedToMine = sch.assignedClassIds.some((cid) =>
          myTeacherClassIdSet.has(cid)
        );
        return createdBySelf || assignedToMine;
      });
    }
    if (isStudent) {
      if (myStudentClassIdSet.size > 0) {
        return schedules.filter((sch) =>
          sch.assignedClassIds.some((cid) => myStudentClassIdSet.has(cid))
        );
      }
      // If student user isn't linked by name to a student roster row, only show assigned schedules when class selected
      return schedules.filter((sch) => sch.assignedClassIds.length > 0);
    }
    return [];
  }, [
    schedules,
    isAdmin,
    isTeacher,
    isStudent,
    userId,
    userName,
    myTeacherClassIdSet,
    myStudentClassIdSet,
  ]);

  const shiftCounts = useMemo(() => {
    const counts: Record<'all' | ShiftType, number> = {
      all: roleScopedSchedules.length,
      morning: 0,
      afternoon: 0,
      evening_parttime: 0,
    };
    roleScopedSchedules.forEach((sch) => {
      counts[sch.shiftType] = (counts[sch.shiftType] || 0) + 1;
    });
    return counts;
  }, [roleScopedSchedules]);

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return roleScopedSchedules.filter((sch) => {
      if (activeShiftTab !== 'all' && sch.shiftType !== activeShiftTab) {
        return false;
      }
      if (
        selectedClassFilter !== 'all' &&
        !sch.assignedClassIds.includes(selectedClassFilter)
      ) {
        return false;
      }
      if (!q) return true;

      if (
        sch.title.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.createdByName.toLowerCase().includes(q)
      ) {
        return true;
      }

      const matchesClass = sch.assignedClassIds.some((cid) => {
        const c = classMap.get(cid);
        if (!c) return false;
        return `${c.classCode || ''} ${c.className || ''} ${c.teacherName || ''}`
          .toLowerCase()
          .includes(q);
      });
      if (matchesClass) return true;

      // Also search inside timetable subjects/notes
      return Object.values(sch.cells || {}).some((rowDays) =>
        Object.values(rowDays || {}).some(
          (cell) =>
            cell &&
            `${cell.subject || ''} ${cell.teacherNote || ''}`
              .toLowerCase()
              .includes(q)
        )
      );
    });
  }, [roleScopedSchedules, activeShiftTab, selectedClassFilter, searchQuery, classMap]);

  // Keep an active schedule selected automatically
  useEffect(() => {
    if (filteredSchedules.length === 0) {
      setSelectedScheduleId(null);
      return;
    }
    if (
      !selectedScheduleId ||
      !filteredSchedules.some((s) => s.id === selectedScheduleId)
    ) {
      setSelectedScheduleId(filteredSchedules[0].id);
    }
  }, [filteredSchedules, selectedScheduleId]);

  const activeSchedule = useMemo(
    () => filteredSchedules.find((s) => s.id === selectedScheduleId) || filteredSchedules[0] || null,
    [filteredSchedules, selectedScheduleId]
  );

  const canEditSchedule = (sch: ScheduleRecord): boolean => {
    if (isAdmin) return true;
    if (!isTeacher) return false;
    if (userId && sch.createdById === userId) return true;
    if (userName && sch.createdByName === userName) return true;
    return sch.assignedClassIds.some((cid) => myTeacherClassIdSet.has(cid));
  };

  const canDeleteSchedule = (sch: ScheduleRecord): boolean => {
    if (isAdmin) return true;
    if (!isTeacher) return false;
    return Boolean(
      (userId && sch.createdById === userId) ||
        (userName && sch.createdByName === userName)
    );
  };

  const filterableClasses = useMemo(() => {
    if (isAdmin) return allClasses;
    if (isTeacher) return myTeacherClasses;
    if (isStudent && myStudentClasses.length > 0) return myStudentClasses;
    return allClasses;
  }, [isAdmin, isTeacher, isStudent, allClasses, myTeacherClasses, myStudentClasses]);

  const openCreateModal = (presetShift?: ShiftType) => {
    setEditingSchedule(null);
    setFormDefaultShift(
      presetShift || (activeShiftTab !== 'all' ? activeShiftTab : 'morning')
    );
    setIsFormModalOpen(true);
  };

  const openEditInfoModal = (sch: ScheduleRecord) => {
    setEditingSchedule(sch);
    setFormDefaultShift(sch.shiftType);
    setIsFormModalOpen(true);
  };

  const handleSaveScheduleForm = async (payload: {
    title: string;
    shiftType: ShiftType;
    description: string;
    assignedClassIds: string[];
    resetRowsToShiftPreset: boolean;
  }) => {
    try {
      if (editingSchedule) {
        const updatePayload: any = {
          title: payload.title,
          shiftType: payload.shiftType,
          description: payload.description,
          assignedClassIds: payload.assignedClassIds,
          updatedByName: userName || role,
        };
        if (payload.resetRowsToShiftPreset) {
          updatePayload.rows = clonePresetRows(payload.shiftType);
        }
        await scheduleService.update(editingSchedule.id, updatePayload);
        showToast('បានរក្សាទុកព័ត៌មាន & Assign ថ្នាក់រៀនដោយជោគជ័យ!');
      } else {
        const newId = await scheduleService.add({
          title: payload.title,
          shiftType: payload.shiftType,
          description: payload.description,
          assignedClassIds: payload.assignedClassIds,
          rows: clonePresetRows(payload.shiftType),
          cells: {},
          createdById: userId,
          createdByName: userName || (isAdmin ? 'Admin' : 'គ្រូបង្រៀន'),
          createdByRole: role,
          updatedByName: userName || role,
        });
        setActiveShiftTab(payload.shiftType);
        setSelectedScheduleId(newId);
        showToast('បានបង្កើតកាលវិភាគថ្មីដោយជោគជ័យ!');
      }
    } catch (err) {
      console.error('Failed to save schedule:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកកាលវិភាគ!');
    }
  };

  const handleSaveCellDays = async (
    rowId: string,
    targetDays: WeekDayKey[],
    content: ScheduleCellContent | null
  ) => {
    const targetSchedule = cellModalState?.schedule;
    if (!targetSchedule) return;

    const nextCells: Record<string, Partial<Record<WeekDayKey, ScheduleCellContent>>> = {
      ...(targetSchedule.cells || {}),
    };
    const rowCells: Partial<Record<WeekDayKey, ScheduleCellContent>> = {
      ...(nextCells[rowId] || {}),
    };

    targetDays.forEach((dKey) => {
      if (content) {
        rowCells[dKey] = content;
      } else {
        delete rowCells[dKey];
      }
    });

    if (Object.keys(rowCells).length > 0) {
      nextCells[rowId] = rowCells;
    } else {
      delete nextCells[rowId];
    }

    try {
      await scheduleService.update(targetSchedule.id, {
        cells: nextCells,
        updatedByName: userName || role,
      });
      showToast('បានរក្សាទុកខ្លឹមសារកាលវិភាគ!');
    } catch (err) {
      console.error('Failed to save cell:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកខ្លឹមសារ!');
    }
  };

  const handleSaveRows = async (nextRows: ScheduleTimeRow[]) => {
    if (!rowsModalSchedule) return;
    try {
      await scheduleService.update(rowsModalSchedule.id, {
        rows: nextRows,
        updatedByName: userName || role,
      });
      showToast('បានកែប្រែជួរម៉ោងដោយជោគជ័យ!');
    } catch (err) {
      console.error('Failed to save rows:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកជួរម៉ោង!');
    }
  };

  const handleDuplicateSchedule = async (sch: ScheduleRecord) => {
    try {
      const clonedAssignIds = isAdmin
        ? sch.assignedClassIds
        : sch.assignedClassIds.filter((cid) => myTeacherClassIdSet.has(cid));
      const newId = await scheduleService.add({
        title: `${sch.title} (ចម្លង)`,
        shiftType: sch.shiftType,
        description: sch.description,
        assignedClassIds: clonedAssignIds,
        rows: sch.rows.map((r) => ({ ...r })),
        cells: JSON.parse(JSON.stringify(sch.cells || {})),
        createdById: userId,
        createdByName: userName || (isAdmin ? 'Admin' : 'គ្រូបង្រៀន'),
        createdByRole: role,
        updatedByName: userName || role,
      });
      setSelectedScheduleId(newId);
      showToast('បានចម្លងកាលវិភាគថ្មី!');
    } catch (err) {
      console.error('Failed to duplicate schedule:', err);
      alert('មានបញ្ហាក្នុងការចម្លងកាលវិភាគ!');
    }
  };

  const handleDeleteSchedule = async (sch: ScheduleRecord) => {
    if (!canDeleteSchedule(sch)) return;
    const confirmed = await confirmDialog(
      `តើអ្នកពិតជាចង់លុបកាលវិភាគ "${sch.title}" មែនទេ?`
    );
    if (!confirmed) return;

    try {
      await scheduleService.delete(sch.id);
      showToast('បានលុបកាលវិភាគ!');
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('មានបញ្ហាក្នុងការលុបកាលវិភាគ!');
    }
  };

  const classFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'គ្រប់ថ្នាក់រៀនទាំងអស់' },
      ...filterableClasses.map((cls) => {
        const code = cls.classCode || cls.className || 'ថ្នាក់';
        const suffix =
          cls.classCode && cls.className && cls.classCode !== cls.className
            ? ` (${cls.className})`
            : '';
        return {
          value: cls.id,
          label: `${code}${suffix}`,
          sublabel: [cls.shift, cls.teacherName].filter(Boolean).join(' • '),
        };
      }),
    ],
    [filterableClasses]
  );

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 11000,
            background: '#059669',
            color: '#ffffff',
            padding: '0.68rem 1.05rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(5, 150, 105, 0.35)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <AppIcon name="check-circle" size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.9rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(59, 130, 246, 0.25)',
              }}
            >
              <AppIcon name="calendar" size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                កាលវិភាគសិក្សា (ច័ន្ទ – សុក្រ)
              </h1>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isStudent
                  ? 'កាលវិភាគសិក្សាប្រចាំសប្តាហ៍សម្រាប់ថ្នាក់រៀនរបស់អ្នក'
                  : 'បែងចែកតាមវេនព្រឹក វេនរសៀល និងវេនល្ងាច / Part-time • អាចកែខ្លឹមសារ និង Assign ច្រើនថ្នាក់បាន'}
              </p>
            </div>
          </div>
        </div>

        {(isAdmin || isTeacher) && (
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary"
            style={{
              padding: '0.62rem 1.15rem',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 8px 18px rgba(59, 130, 246, 0.28)',
            }}
          >
            <AppIcon name="plus" size={18} />
            <span>បង្កើតកាលវិភាគថ្មី</span>
          </button>
        )}
      </div>

      {/* Shift Category Tabs (Separate Full-time Morning, Full-time Afternoon, Evening / Part-time) */}
      <div className="no-print schedule-shift-tabs">
        <button
          type="button"
          onClick={() => setActiveShiftTab('all')}
          className="glass-panel"
          style={{
            padding: '0.72rem 0.88rem',
            borderRadius: '14px',
            border:
              activeShiftTab === 'all'
                ? '2px solid var(--accent-primary)'
                : '1px solid var(--border-color)',
            background:
              activeShiftTab === 'all' ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.86rem', color: activeShiftTab === 'all' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
              <AppIcon name="layers" size={15} />
              <span>ទាំងអស់</span>
            </span>
            <span
              style={{
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                background: activeShiftTab === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeShiftTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {shiftCounts.all}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            គ្រប់វេនសិក្សាទាំង ៣
          </span>
        </button>

        {SHIFT_ORDER.map((sKey) => {
          const meta = SHIFT_PRESETS[sKey];
          const active = activeShiftTab === sKey;
          return (
            <button
              key={sKey}
              type="button"
              onClick={() => setActiveShiftTab(sKey)}
              className="glass-panel"
              style={{
                padding: '0.72rem 0.88rem',
                borderRadius: '14px',
                border: active
                  ? `2px solid ${meta.color}`
                  : '1px solid var(--border-color)',
                background: active ? meta.bg : 'var(--card-bg)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    color: active ? meta.color : 'var(--text-primary)',
                  }}
                >
                  <AppIcon name={meta.iconName} size={15} />
                  <span>{meta.shortLabel}</span>
                </span>
                <span
                  style={{
                    padding: '0.12rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: active ? meta.color : 'var(--bg-secondary)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {shiftCounts[sKey]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700 }}>{meta.timeSpan}</span>
                <span>{meta.modeTag}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className="no-print glass-panel"
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <div style={{ flex: '1 1 230px', position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          >
            <AppIcon name="search" size={15} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកកាលវិភាគ ឈ្មោះថ្នាក់ គ្រូ ឬមុខវិជ្ជា..."
            style={{
              width: '100%',
              padding: '0.52rem 0.75rem 0.52rem 2.2rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--main-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ minWidth: '215px', flex: '0 1 260px' }}>
          <CustomSelectDropdown
            value={selectedClassFilter}
            onChange={setSelectedClassFilter}
            searchable={filterableClasses.length > 5}
            searchPlaceholder="ស្វែងរកថ្នាក់រៀន..."
            placeholder="ត្រងតាមថ្នាក់រៀន"
            style={{
              padding: '0.48rem 0.75rem',
              borderRadius: '10px',
              background: 'var(--main-bg)',
            }}
            options={classFilterOptions}
          />
        </div>

        {filteredSchedules.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllStacked((v) => !v)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: showAllStacked
                ? '1.5px solid var(--accent-primary)'
                : '1px solid var(--border-color)',
              background: showAllStacked
                ? 'rgba(59, 130, 246, 0.12)'
                : 'var(--main-bg)',
              color: showAllStacked ? 'var(--accent-primary)' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <AppIcon name="layers" size={14} />
            <span>{showAllStacked ? 'បង្ហាញតែ ១ តារាង' : `បង្ហាញទាំង ${filteredSchedules.length} តារាង`}</span>
          </button>
        )}
      </div>

      {/* Student Unmatched Info Banner */}
      {isStudent && myStudentProfile && myStudentClasses.length > 0 && (
        <div
          className="no-print"
          style={{
            padding: '0.7rem 1rem',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#047857',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <AppIcon name="graduation-cap" size={16} />
          <span>
            សិស្ស៖ {myStudentProfile.fullName} • ថ្នាក់៖{' '}
            {myStudentClasses.map((c) => c.className || c.classCode).join(', ')}
          </span>
        </div>
      )}

      {/* Loading / Empty States / Quick Preset Starter */}
      {isLoading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          កំពុងផ្ទុកកាលវិភាគ...
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '2rem 1.35rem',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="calendar" size={28} />
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              មិនទាន់មានកាលវិភាគសម្រាប់ការជ្រើសរើសនេះទេ
            </h2>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
              {isStudent
                ? 'ថ្នាក់រៀនរបស់អ្នកមិនទាន់ត្រូវបាន Assign កាលវិភាគនៅឡើយទេ។ សូមសាកសួរគ្រូបង្រៀន ឬ Admin។'
                : 'ជ្រើសរើសគំរូម៉ោងសិក្សាខាងក្រោម ដើម្បីបង្កើតតារាងកាលវិភាគ ច័ន្ទ–សុក្រ ភ្លាមៗ និង Assign ឱ្យថ្នាក់រៀនបានច្រើនថ្នាក់។'}
            </p>
          </div>

          {(isAdmin || isTeacher) && (
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.85rem',
                textAlign: 'left',
              }}
            >
              {SHIFT_ORDER.map((sKey) => {
                const meta = SHIFT_PRESETS[sKey];
                return (
                  <div
                    key={sKey}
                    style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      background: 'var(--bg-secondary)',
                      border: `1.5px solid ${meta.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: meta.color, fontSize: '0.92rem' }}>
                          <AppIcon name={meta.iconName} size={16} />
                          <span>{meta.shortLabel}</span>
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: meta.bg, color: meta.color }}>
                          {meta.timeSpan}
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {meta.defaultRows.map((r) => (
                          <li key={r.id}>
                            <strong style={{ color: 'var(--text-primary)' }}>{r.timeLabel}</strong>: {r.slotLabel}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCreateModal(sKey)}
                      style={{
                        width: '100%',
                        padding: '0.52rem 0.75rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: meta.color,
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <AppIcon name="plus" size={15} />
                      <span>បង្កើតតាមគំរូ {meta.shortLabel}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Clickable Schedule Cards Switcher (shown when not stacked or > 1 schedule) */}
          {!showAllStacked && filteredSchedules.length > 1 && (
            <div className="no-print schedule-cards-grid">
              {filteredSchedules.map((sch) => {
                const meta = SHIFT_PRESETS[sch.shiftType] || SHIFT_PRESETS.morning;
                const isSelected = activeSchedule?.id === sch.id;
                const classLabels = sch.assignedClassIds
                  .map((cid) => classMap.get(cid))
                  .filter(Boolean)
                  .map((c) => c.classCode || c.className);

                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => setSelectedScheduleId(sch.id)}
                    className="glass-panel"
                    style={{
                      padding: '0.82rem 0.95rem',
                      borderRadius: '14px',
                      border: isSelected
                        ? `2px solid ${meta.color}`
                        : '1px solid var(--border-color)',
                      background: isSelected ? meta.bg : 'var(--card-bg)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.38rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 800, color: meta.color }}>
                        <AppIcon name={meta.iconName} size={13} />
                        <span>{meta.shortLabel} • {meta.timeSpan}</span>
                      </span>
                      <span style={{ fontSize: '0.71rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {sch.assignedClassIds.length} ថ្នាក់
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      {sch.title}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {classLabels.length > 0
                        ? `ថ្នាក់៖ ${classLabels.slice(0, 4).join(', ')}${classLabels.length > 4 ? ` (+${classLabels.length - 4})` : ''}`
                        : 'មិនទាន់ Assign ថ្នាក់'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active or Stacked Monday-Friday Timetables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(showAllStacked ? filteredSchedules : activeSchedule ? [activeSchedule] : []).map(
              (sch) => (
                <ScheduleTimetable
                  key={sch.id}
                  schedule={sch}
                  classMap={classMap}
                  canEdit={canEditSchedule(sch)}
                  canDelete={canDeleteSchedule(sch)}
                  onCellClick={(row, dayKey, currentCell) =>
                    setCellModalState({ schedule: sch, row, dayKey, currentCell })
                  }
                  onEditInfoAndClasses={() => openEditInfoModal(sch)}
                  onEditRows={() => setRowsModalSchedule(sch)}
                  onDuplicate={() => handleDuplicateSchedule(sch)}
                  onDelete={() => handleDeleteSchedule(sch)}
                />
              )
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <ScheduleFormModal
        isOpen={isFormModalOpen}
        editingSchedule={editingSchedule}
        defaultShiftType={formDefaultShift}
        assignableClasses={isAdmin ? allClasses : myTeacherClasses}
        allClasses={allClasses}
        isAdmin={isAdmin}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveScheduleForm}
      />

      <CellEditorModal
        isOpen={Boolean(cellModalState)}
        row={cellModalState?.row || null}
        initialDayKey={cellModalState?.dayKey || 'mon'}
        initialCell={cellModalState?.currentCell}
        onClose={() => setCellModalState(null)}
        onSaveDays={handleSaveCellDays}
      />

      <RowsEditorModal
        isOpen={Boolean(rowsModalSchedule)}
        shiftType={rowsModalSchedule?.shiftType || 'morning'}
        initialRows={rowsModalSchedule?.rows || []}
        onClose={() => setRowsModalSchedule(null)}
        onSaveRows={handleSaveRows}
      />
    </div>
  );
}
