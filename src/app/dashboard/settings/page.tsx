"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { settingsService } from '@/services/db';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import { useConfirm } from '@/components/ConfirmDialog';

type SettingsTab = 'school' | 'users' | 'studentOptions' | 'tags';
type OptionCategoryKey = 'gender' | 'level' | 'shift' | 'status' | 'address' | 'transport';
type StudentOption = { id: string; detail1?: string; detail2?: string };

const OPTION_CATEGORIES: {
  key: OptionCategoryKey;
  label: string;
  subLabel: string;
  firestoreKey: string;
  placeholderMain: string;
  placeholderDetail1: string;
  placeholderDetail2: string;
}[] = [
  {
    key: 'level',
    label: 'កម្រិតសិក្សា',
    subLabel: 'Level',
    firestoreKey: 'appStudentLevels',
    placeholderMain: 'ឧ. L1, Level 1, កម្រិតបឋម...',
    placeholderDetail1: 'ឈ្មោះពេញ / ពណ៌នា',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  },
  {
    key: 'shift',
    label: 'វេនសិក្សា',
    subLabel: 'Shift',
    firestoreKey: 'appStudentShifts',
    placeholderMain: 'ឧ. វេនព្រឹក, 7:30-8:30...',
    placeholderDetail1: 'ម៉ោងសិក្សា',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  },
  {
    key: 'gender',
    label: 'ភេទ',
    subLabel: 'Gender',
    firestoreKey: 'appStudentGenders',
    placeholderMain: 'ឧ. ប្រុស, ស្រី...',
    placeholderDetail1: 'អក្សរកាត់ / English',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  },
  {
    key: 'status',
    label: 'ស្ថានភាពសិស្ស',
    subLabel: 'Status',
    firestoreKey: 'appStudentStatuses',
    placeholderMain: 'ឧ. កំពុងសិក្សា, ព្យួរការសិក្សា...',
    placeholderDetail1: 'ការពណ៌នា',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  },
  {
    key: 'address',
    label: 'អាសយដ្ឋាន',
    subLabel: 'Address',
    firestoreKey: 'appStudentAddresses',
    placeholderMain: 'ឧ. ភ្នំពេញ, កណ្ដាល...',
    placeholderDetail1: 'តំបន់ / ស្រុក',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  },
  {
    key: 'transport',
    label: 'មធ្យោបាយធ្វើដំណើរ',
    subLabel: 'Transport',
    firestoreKey: 'appStudentTransports',
    placeholderMain: 'ឧ. Bus, ម៉ូតូ, កង់...',
    placeholderDetail1: 'ការពណ៌នា',
    placeholderDetail2: 'កំណត់ចំណាំផ្សេងៗ'
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('tags');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const normalizeOptions = (arr: any[]): StudentOption[] =>
    (arr || []).map(item => (typeof item === 'string' ? { id: item } : item));

  // Student Options States
  const [levels, setLevels] = useState<StudentOption[]>([]);
  const [shifts, setShifts] = useState<StudentOption[]>([]);
  const [addresses, setAddresses] = useState<StudentOption[]>([]);
  const [transports, setTransports] = useState<StudentOption[]>([]);
  const [genders, setGenders] = useState<StudentOption[]>([]);
  const [statuses, setStatuses] = useState<StudentOption[]>([]);

  const [activeOptionCategory, setActiveOptionCategory] = useState<OptionCategoryKey>('level');
  const [optionSearch, setOptionSearch] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionDetail1, setNewOptionDetail1] = useState('');
  const [newOptionDetail2, setNewOptionDetail2] = useState('');

  // Edit Option Modal States
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editOptionOriginalId, setEditOptionOriginalId] = useState<string | null>(null);
  const [editOptionValue, setEditOptionValue] = useState('');
  const [editOptionDetail1, setEditOptionDetail1] = useState('');
  const [editOptionDetail2, setEditOptionDetail2] = useState('');

  // Tag Group States
  const [tagGroups, setTagGroups] = useState<any[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupEditId, setGroupEditId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');

  // Tag States
  const [tags, setTags] = useState<any[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagEditId, setTagEditId] = useState<number | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [tagGroupId, setTagGroupId] = useState<number | string>('');

  const tagColors = [
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Orange', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Indigo', hex: '#6366f1' }
  ];

  // User States
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [userNameField, setUserNameField] = useState('');
  const [userUsernameField, setUserUsernameField] = useState('');
  const [userPasswordField, setUserPasswordField] = useState('');
  const [userRoleField, setUserRoleField] = useState('student');
  const [showModalPassword, setShowModalPassword] = useState(false);

  // School Info States
  const [schoolName, setSchoolName] = useState('សាលាអន្តរជាតិប្រេនស្តម');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    const cachedTab = sessionStorage.getItem('settings_activeTab') as SettingsTab | null;
    if (cachedTab && ['school', 'users', 'studentOptions', 'tags'].includes(cachedTab)) {
      setActiveTab(cachedTab);
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    sessionStorage.setItem('settings_activeTab', tab);
  };

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsub = settingsService.subscribeOne('global', (data) => {
      if (data) {
        setTagGroups(data.appTagGroups || [
          { id: 1, name: 'កម្រិតថ្នាក់' },
          { id: 2, name: 'មុខវិជ្ជា' }
        ]);
        setTags(data.appTags || [
          { id: 1, name: 'ភាសាបរទេស', color: '#8b5cf6', groupId: 2 },
          { id: 2, name: 'បច្ចេកវិទ្យា', color: '#3b82f6', groupId: 2 },
          { id: 3, name: 'ថ្នាក់ទី១២', color: '#10b981', groupId: 1 }
        ]);
        setUsers(data.appUsers || []);
        setSchoolName(data.schoolName || 'សាលាអន្តរជាតិប្រេនស្តម');
        setLevels(normalizeOptions(data.appStudentLevels || ['កម្រិតបឋមសិក្សា', 'កម្រិតមធ្យមសិក្សា', 'កម្រិតវិទ្យាល័យ']));
        setShifts(normalizeOptions(data.appStudentShifts || ['វេនព្រឹក', 'វេនរសៀល', 'វេនល្ងាច', 'សៅរ៍-អាទិត្យ']));
        setAddresses(normalizeOptions(data.appStudentAddresses || ['ភ្នំពេញ', 'កណ្ដាល', 'តាកែវ', 'កំពង់ចាម']));
        setTransports(normalizeOptions(data.appStudentTransports || ['Bus', 'Personal', 'ម៉ូតូ', 'កង់']));
        setGenders(normalizeOptions(data.appStudentGenders || ['ប្រុស', 'ស្រី']));
        setStatuses(normalizeOptions(data.appStudentStatuses || ['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'បោះបង់ការសិក្សា']));
      } else {
        settingsService.add({
          appTagGroups: [
            { id: 1, name: 'កម្រិតថ្នាក់' },
            { id: 2, name: 'មុខវិជ្ជា' }
          ],
          appTags: [
            { id: 1, name: 'ភាសាបរទេស', color: '#8b5cf6', groupId: 2 },
            { id: 2, name: 'បច្ចេកវិទ្យា', color: '#3b82f6', groupId: 2 },
            { id: 3, name: 'ថ្នាក់ទី១២', color: '#10b981', groupId: 1 }
          ],
          appUsers: [],
          schoolName: 'សាលាអន្តរជាតិប្រេនស្តម',
          appStudentLevels: normalizeOptions(['កម្រិតបឋមសិក្សា', 'កម្រិតមធ្យមសិក្សា', 'កម្រិតវិទ្យាល័យ']),
          appStudentShifts: normalizeOptions(['វេនព្រឹក', 'វេនរសៀល', 'វេនល្ងាច', 'សៅរ៍-អាទិត្យ']),
          appStudentAddresses: normalizeOptions(['ភ្នំពេញ', 'កណ្ដាល', 'តាកែវ', 'កំពង់ចាម']),
          appStudentTransports: normalizeOptions(['Bus', 'Personal', 'ម៉ូតូ', 'កង់']),
          appStudentGenders: normalizeOptions(['ប្រុស', 'ស្រី']),
          appStudentStatuses: normalizeOptions(['កំពុងសិក្សា', 'ព្យួរការសិក្សា', 'បោះបង់ការសិក្សា'])
        }, 'global');
      }
    });
    return () => unsub();
  }, [router]);

  const updateSettings = async (updates: any) => {
    await settingsService.add(updates, 'global');
  };

  // Helper to get/set option arrays uniformly
  const getOptionsList = (key: OptionCategoryKey): StudentOption[] => {
    const map: Record<OptionCategoryKey, StudentOption[]> = {
      gender: genders,
      level: levels,
      shift: shifts,
      status: statuses,
      address: addresses,
      transport: transports
    };
    return map[key];
  };

  const saveOptionsList = async (key: OptionCategoryKey, updated: StudentOption[]) => {
    const setters: Record<OptionCategoryKey, (v: StudentOption[]) => void> = {
      gender: setGenders,
      level: setLevels,
      shift: setShifts,
      status: setStatuses,
      address: setAddresses,
      transport: setTransports
    };
    const cat = OPTION_CATEGORIES.find(c => c.key === key)!;
    setters[key](updated);
    await updateSettings({ [cat.firestoreKey]: updated });
  };

  // Quick Add Option
  const handleAddOption = async () => {
    const val = newOptionValue.trim();
    if (!val) return;
    const current = getOptionsList(activeOptionCategory);
    if (current.some(x => x.id === val)) {
      alert(`"${val}" មានរួចហើយនៅក្នុងបញ្ជី!`);
      return;
    }
    const newObj: StudentOption = {
      id: val,
      detail1: newOptionDetail1.trim(),
      detail2: newOptionDetail2.trim()
    };
    await saveOptionsList(activeOptionCategory, [...current, newObj]);
    setNewOptionValue('');
    setNewOptionDetail1('');
    setNewOptionDetail2('');
    showToast(`បានបន្ថែម "${val}" ដោយជោគជ័យ!`);
  };

  // Edit Option Modal
  const handleOpenEditOptionModal = (opt: StudentOption) => {
    setEditOptionOriginalId(opt.id);
    setEditOptionValue(opt.id);
    setEditOptionDetail1(opt.detail1 || '');
    setEditOptionDetail2(opt.detail2 || '');
    setIsOptionModalOpen(true);
  };

  const handleSaveEditedOption = async () => {
    const val = editOptionValue.trim();
    if (!val || !editOptionOriginalId) {
      alert('សូមបំពេញតម្លៃគោល!');
      return;
    }
    const current = getOptionsList(activeOptionCategory);
    if (val !== editOptionOriginalId && current.some(x => x.id === val)) {
      alert(`"${val}" មានរួចហើយនៅក្នុងបញ្ជី!`);
      return;
    }
    const updatedObj: StudentOption = {
      id: val,
      detail1: editOptionDetail1.trim(),
      detail2: editOptionDetail2.trim()
    };
    const updated = current.map(x => (x.id === editOptionOriginalId ? updatedObj : x));
    await saveOptionsList(activeOptionCategory, updated);
    setIsOptionModalOpen(false);
    setEditOptionOriginalId(null);
    showToast('បានកែប្រែជម្រើសដោយជោគជ័យ!');
  };

  const handleDeleteOption = async (val: string) => {
    if (!(await confirmDialog(`តើអ្នកពិតជាចង់លុប "${val}" មែនទេ?`))) return;
    const current = getOptionsList(activeOptionCategory);
    const updated = current.filter(x => x.id !== val);
    await saveOptionsList(activeOptionCategory, updated);
    showToast(`បានលុប "${val}"!`);
  };

  // Tag Group CRUD Functions
  const handleOpenAddGroup = () => {
    setGroupEditId(null);
    setGroupName('');
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupEditId(group.id);
    setGroupName(group.name);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      alert('សូមបំពេញឈ្មោះក្រុមស្លាកពាក្យ!');
      return;
    }
    const updatedGroups = groupEditId
      ? tagGroups.map(g => (g.id === groupEditId ? { ...g, name: groupName.trim() } : g))
      : [...tagGroups, { id: Date.now(), name: groupName.trim() }];
    setTagGroups(updatedGroups);
    await updateSettings({ appTagGroups: updatedGroups });
    setIsGroupModalOpen(false);
    showToast(groupEditId ? 'បានកែប្រែក្រុមស្លាកពាក្យ!' : 'បានបង្កើតក្រុមស្លាកពាក្យថ្មី!');
  };

  const handleDeleteGroup = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirmDialog('តើអ្នកពិតជាចង់លុបក្រុមស្លាកពាក្យនេះមែនទេ? (ស្លាកពាក្យនៅក្នុងក្រុមនេះនឹងត្រូវប្តូរទៅជាគ្មានក្រុម)'))) return;
    const updatedGroups = tagGroups.filter(g => g.id !== id);
    const updatedTags = tags.map(t => (t.groupId === id ? { ...t, groupId: null } : t));
    setTagGroups(updatedGroups);
    setTags(updatedTags);
    if (selectedGroupFilter === String(id)) setSelectedGroupFilter('all');
    await updateSettings({ appTagGroups: updatedGroups, appTags: updatedTags });
    showToast('បានលុបក្រុមស្លាកពាក្យ!');
  };

  // Tag CRUD Functions
  const handleOpenAddTag = () => {
    setTagEditId(null);
    setTagName('');
    setTagColor('#3b82f6');
    setTagGroupId(
      selectedGroupFilter !== 'all' && selectedGroupFilter !== 'ungrouped'
        ? selectedGroupFilter
        : ''
    );
    setIsTagModalOpen(true);
  };

  const handleOpenEditTag = (tag: any) => {
    setTagEditId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagGroupId(tag.groupId || '');
    setIsTagModalOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      alert('សូមបំពេញឈ្មោះស្លាកពាក្យ!');
      return;
    }
    const parsedGroupId = tagGroupId ? Number(tagGroupId) : null;
    const updatedTags = tagEditId
      ? tags.map(t => (t.id === tagEditId ? { ...t, name: tagName.trim(), color: tagColor, groupId: parsedGroupId } : t))
      : [...tags, { id: Date.now(), name: tagName.trim(), color: tagColor, groupId: parsedGroupId }];
    setTags(updatedTags);
    await updateSettings({ appTags: updatedTags });
    setIsTagModalOpen(false);
    showToast(tagEditId ? 'បានកែប្រែស្លាកពាក្យ!' : 'បានបន្ថែមស្លាកពាក្យថ្មី!');
  };

  const handleDeleteTag = async (id: number) => {
    if (!(await confirmDialog('តើអ្នកពិតជាចង់លុបស្លាកពាក្យនេះមែនទេ?'))) return;
    const updatedTags = tags.filter(t => t.id !== id);
    setTags(updatedTags);
    await updateSettings({ appTags: updatedTags });
    showToast('បានលុបស្លាកពាក្យ!');
  };

  // User CRUD Functions
  const handleOpenAddUser = () => {
    setUserEditId(null);
    setUserNameField('');
    setUserUsernameField('');
    setUserPasswordField('');
    setUserRoleField('student');
    setShowModalPassword(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setUserEditId(user.id);
    setUserNameField(user.name);
    setUserUsernameField(user.username);
    setUserPasswordField(user.password);
    setUserRoleField(user.role);
    setShowModalPassword(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userNameField.trim() || !userUsernameField.trim() || !userPasswordField.trim() || !userRoleField) {
      alert('សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!');
      return;
    }
    const duplicate = users.find(u => u.username === userUsernameField.trim() && u.id !== userEditId);
    if (duplicate) {
      alert('ឈ្មោះគណនីនេះមានរួចហើយ! សូមជ្រើសរើសឈ្មោះផ្សេង។');
      return;
    }

    const updated = userEditId
      ? users.map(u =>
          u.id === userEditId
            ? { id: userEditId, name: userNameField.trim(), username: userUsernameField.trim(), password: userPasswordField, role: userRoleField }
            : u
        )
      : [...users, { id: Date.now().toString(), name: userNameField.trim(), username: userUsernameField.trim(), password: userPasswordField, role: userRoleField }];

    setUsers(updated);
    await updateSettings({ appUsers: updated });
    setIsUserModalOpen(false);
    showToast(userEditId ? 'បានកែប្រែគណនីដោយជោគជ័យ!' : 'បានបង្កើតគណនីថ្មីដោយជោគជ័យ!');
  };

  const handleDeleteUser = async (id: string) => {
    if (!(await confirmDialog('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?'))) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await updateSettings({ appUsers: updated });
    showToast('បានលុបគណនី!');
  };

  // School Info Functions
  const handleSaveSchoolInfo = async () => {
    if (!schoolName.trim()) {
      alert('សូមបំពេញឈ្មោះសាលារៀន!');
      return;
    }
    await updateSettings({ schoolName: schoolName.trim() });
    localStorage.setItem('schoolName', schoolName.trim());
    showToast('រក្សាទុកព័ត៌មានសាលារៀនដោយជោគជ័យ!');
  };

  if (role !== 'admin') return null;

  // Derived data for Tags
  const ungroupedTagCount = tags.filter(t => !t.groupId || !tagGroups.some(g => g.id === t.groupId)).length;
  const filteredTags = tags.filter(tag => {
    const matchesSearch = (tag.name || '').toLowerCase().includes(tagSearch.toLowerCase());
    const matchesGroup =
      selectedGroupFilter === 'all' ||
      (selectedGroupFilter === 'ungrouped' && (!tag.groupId || !tagGroups.some(g => g.id === tag.groupId))) ||
      String(tag.groupId) === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  // Derived data for Users
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Derived data for Student Options
  const currentCategoryMeta = OPTION_CATEGORIES.find(c => c.key === activeOptionCategory)!;
  const currentCategoryOptions = getOptionsList(activeOptionCategory);
  const filteredCategoryOptions = currentCategoryOptions.filter(opt => {
    const q = optionSearch.toLowerCase();
    return (
      (opt.id || '').toLowerCase().includes(q) ||
      (opt.detail1 || '').toLowerCase().includes(q) ||
      (opt.detail2 || '').toLowerCase().includes(q)
    );
  });

  const tabs: { key: SettingsTab; label: string; badge?: number; icon: React.ReactNode }[] = [
    {
      key: 'studentOptions',
      label: 'កំណត់ទម្រង់សិស្ស',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      )
    },
    {
      key: 'users',
      label: 'អ្នកប្រើប្រាស់ (Users)',
      badge: users.length,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      key: 'tags',
      label: 'ស្លាកពាក្យ & ក្រុម',
      badge: tags.length,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      )
    },
    {
      key: 'school',
      label: 'ព័ត៌មានសាលា',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 10000,
            background: '#10b981',
            color: 'white',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>ការកំណត់ប្រព័ន្ធ (Settings)</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', marginBottom: 0 }}>
          គ្រប់គ្រងទម្រង់សិស្ស គណនីអ្នកប្រើប្រាស់ ស្លាកពាក្យ និងព័ត៌មានសាលារៀន
        </p>
      </div>

      {/* Modern Pill Tab Navigation */}
      <div
        className="glass-panel"
        style={{
          padding: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                flex: '1 1 180px',
                padding: '0.75rem 1rem',
                borderRadius: '9px',
                border: 'none',
                background: isActive ? 'var(--primary-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(59,130,246,0.12)',
                    color: isActive ? 'white' : 'var(--accent-primary)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENT FORM OPTIONS (Master-Detail UI) */}
      {activeTab === 'studentOptions' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Column: Categories */}
          <div className="glass-panel" style={{ flex: '1 1 260px', maxWidth: '320px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>
              ប្រភេទជម្រើសទម្រង់សិស្ស
            </div>
            {OPTION_CATEGORIES.map(cat => {
              const count = getOptionsList(cat.key).length;
              const isSelected = activeOptionCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveOptionCategory(cat.key);
                    setOptionSearch('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '9px',
                    border: `1px solid ${isSelected ? 'var(--primary-color)' : 'transparent'}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{cat.subLabel}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      background: isSelected ? 'var(--primary-color)' : 'var(--main-bg)',
                      color: isSelected ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Category Editor & List */}
          <div className="glass-panel" style={{ flex: '3 1 520px', padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  {currentCategoryMeta.label} ({currentCategoryMeta.subLabel})
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  មានសរុប {currentCategoryOptions.length} ជម្រើស — បន្ថែម ឬកែប្រែភ្លាមៗនៅខាងក្រោម
                </p>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder={`ស្វែងរកក្នុង ${currentCategoryMeta.label}...`}
                value={optionSearch}
                onChange={e => setOptionSearch(e.target.value)}
                style={{ width: '240px', background: 'var(--main-bg)', padding: '0.5rem 0.85rem' }}
              />
            </div>

            {/* Inline Quick-Add Box */}
            <div
              style={{
                background: 'var(--main-bg)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}
            >
              <div style={{ flex: '2 1 180px' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  តម្លៃថ្មី (Main) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newOptionValue}
                  onChange={e => setNewOptionValue(e.target.value)}
                  placeholder={currentCategoryMeta.placeholderMain}
                  onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                  style={{ padding: '0.6rem 0.8rem' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ព័ត៌មានលម្អិត ១
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newOptionDetail1}
                  onChange={e => setNewOptionDetail1(e.target.value)}
                  placeholder={currentCategoryMeta.placeholderDetail1}
                  onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                  style={{ padding: '0.6rem 0.8rem' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ព័ត៌មានលម្អិត ២
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newOptionDetail2}
                  onChange={e => setNewOptionDetail2(e.target.value)}
                  placeholder={currentCategoryMeta.placeholderDetail2}
                  onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                  style={{ padding: '0.6rem 0.8rem' }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddOption}
                disabled={!newOptionValue.trim()}
                style={{ padding: '0.62rem 1.25rem', whiteSpace: 'nowrap' }}
              >
                + បន្ថែម
              </button>
            </div>

            {/* Option List */}
            {filteredCategoryOptions.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--main-bg)', borderRadius: '10px' }}>
                {optionSearch ? 'រកមិនឃើញទិន្នន័យដែលត្រូវគ្នាទេ។' : 'មិនទាន់មានជម្រើសនៅឡើយទេ។'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredCategoryOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex-between"
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--main-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{opt.id}</div>
                        {(opt.detail1 || opt.detail2) && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {opt.detail1}
                            {opt.detail1 && opt.detail2 ? ' • ' : ''}
                            {opt.detail2}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleOpenEditOptionModal(opt)}
                        className="btn"
                        style={{ padding: '0.4rem 0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="កែប្រែ"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        កែប្រែ
                      </button>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="btn"
                        style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }}
                        title="លុប"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div>
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              <input
                type="text"
                className="input-field"
                placeholder="ស្វែងរកឈ្មោះ ឬ Username..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ minWidth: '220px', maxWidth: '300px', background: 'var(--main-bg)', padding: '0.55rem 0.9rem' }}
              />
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `ទាំងអស់ (${users.length})` },
                  { key: 'admin', label: `Admin (${users.filter(u => u.role === 'admin').length})` },
                  { key: 'teacher', label: `គ្រូ (${users.filter(u => u.role === 'teacher').length})` },
                  { key: 'student', label: `សិស្ស (${users.filter(u => u.role === 'student').length})` }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setUserRoleFilter(f.key)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${userRoleFilter === f.key ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      background: userRoleFilter === f.key ? 'var(--primary-color)' : 'var(--main-bg)',
                      color: userRoleFilter === f.key ? 'white' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleOpenAddUser} style={{ whiteSpace: 'nowrap' }}>
              + បង្កើតគណនីថ្មី
            </button>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden', overflowX: 'auto' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '1rem 1.25rem' }}>ឈ្មោះ</th>
                    <th style={{ padding: '1rem 1.25rem' }}>ឈ្មោះគណនី</th>
                    <th style={{ padding: '1rem 1.25rem' }}>លេខសម្ងាត់</th>
                    <th style={{ padding: '1rem 1.25rem' }}>តួនាទី</th>
                    <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        រកមិនឃើញគណនីអ្នកប្រើប្រាស់ទេ!
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isRevealed = !!revealedPasswords[user.id];
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600 }}>{user.name}</td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <code style={{ background: 'var(--main-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{user.username}</code>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <code>{isRevealed ? user.password : '••••••'}</code>
                              <button
                                onClick={() => setRevealedPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                                title={isRevealed ? 'លាក់លេខសម្ងាត់' : 'បង្ហាញលេខសម្ងាត់'}
                              >
                                {isRevealed ? (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                  </svg>
                                ) : (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'teacher' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: user.role === 'admin' ? '#ef4444' : user.role === 'teacher' ? '#3b82f6' : '#10b981',
                                fontWeight: 600
                              }}
                            >
                              {user.role === 'admin' ? 'អ្នកគ្រប់គ្រង' : user.role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស'}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleOpenEditUser(user)} className="btn" style={{ padding: '0.4rem 0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }} title="កែប្រែ">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                កែប្រែ
                              </button>
                              <button onClick={() => handleDeleteUser(user.id)} className="btn" style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAGS & GROUPS */}
      {activeTab === 'tags' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Column 1: Tag Groups */}
          <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                ក្រុមស្លាកពាក្យ
              </h2>
              <button className="btn btn-primary" onClick={handleOpenAddGroup} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                + បង្កើតក្រុម
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedGroupFilter('all')}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '8px',
                  border: `1px solid ${selectedGroupFilter === 'all' ? 'var(--primary-color)' : 'transparent'}`,
                  background: selectedGroupFilter === 'all' ? 'rgba(59, 130, 246, 0.1)' : 'var(--main-bg)',
                  color: selectedGroupFilter === 'all' ? 'var(--primary-color)' : 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>ទាំងអស់</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{tags.length}</span>
              </button>

              {tagGroups.map(group => {
                const count = tags.filter(t => t.groupId === group.id).length;
                const isSelected = selectedGroupFilter === String(group.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupFilter(String(group.id))}
                    className="flex-between"
                    style={{
                      padding: '0.65rem 0.9rem',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--main-bg)',
                      border: `1px solid ${isSelected ? 'var(--primary-color)' : 'transparent'}`,
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)' }}>{group.name}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({count})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={e => handleOpenEditGroup(group, e)} className="btn" style={{ padding: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center' }} title="កែប្រែ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={e => handleDeleteGroup(group.id, e)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {ungroupedTagCount > 0 && (
                <button
                  onClick={() => setSelectedGroupFilter('ungrouped')}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    border: `1px solid ${selectedGroupFilter === 'ungrouped' ? 'var(--primary-color)' : 'transparent'}`,
                    background: selectedGroupFilter === 'ungrouped' ? 'rgba(59, 130, 246, 0.1)' : 'var(--main-bg)',
                    color: selectedGroupFilter === 'ungrouped' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>គ្មានក្រុម</span>
                  <span style={{ fontSize: '0.8rem' }}>{ungroupedTagCount}</span>
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Tags */}
          <div className="glass-panel" style={{ flex: '2 1 520px', padding: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                ស្លាកពាក្យ ({filteredTags.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ស្វែងរក Tag..."
                  value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  style={{ width: '190px', background: 'var(--main-bg)', padding: '0.45rem 0.75rem' }}
                />
                <button className="btn btn-primary" onClick={handleOpenAddTag} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  + បង្កើត Tag
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredTags.map(tag => {
                const group = tagGroups.find(g => g.id === tag.groupId);
                return (
                  <div key={tag.id} className="flex-between" style={{ padding: '0.7rem 0.9rem', background: 'var(--main-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ background: tag.color, color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.88rem', fontWeight: 500 }}>
                        {tag.name}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        ក្រុម៖ <b>{group ? group.name : 'គ្មានក្រុម'}</b>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => handleOpenEditTag(tag)} className="btn" style={{ padding: '0.35rem 0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }} title="កែប្រែ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        កែប្រែ
                      </button>
                      <button onClick={() => handleDeleteTag(tag.id)} className="btn" style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center' }} title="លុប">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredTags.length === 0 && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--main-bg)', borderRadius: '8px' }}>
                  មិនមានស្លាកពាក្យនៅក្នុងក្រុមនេះទេ។
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL INFO */}
      {activeTab === 'school' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            កំណត់ព័ត៌មានសាលារៀន
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ឈ្មោះសាលារៀន (ភាសាខ្មែរ)</label>
            <input
              type="text"
              className="input-field"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="វាយបញ្ចូលឈ្មោះសាលារៀន..."
              style={{ background: 'var(--main-bg)', padding: '0.85rem' }}
            />
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: 'var(--main-bg)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>ការបង្ហាញជាក់ស្តែង (Preview)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{schoolName || 'ឈ្មោះសាលារៀន'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ប្រព័ន្ធគ្រប់គ្រង</div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveSchoolInfo} style={{ width: '100%', padding: '0.85rem' }}>
            រក្សាទុកការផ្លាស់ប្តូរ
          </button>
        </div>
      )}

      {/* EDIT STUDENT OPTION MODAL */}
      {isOptionModalOpen && (
        <div
          onClick={() => setIsOptionModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal"
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>កែប្រែជម្រើស ({currentCategoryMeta.label})</h2>

            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>តម្លៃគោល (Main) *</label>
              <input
                type="text"
                className="input-field"
                value={editOptionValue}
                onChange={e => setEditOptionValue(e.target.value)}
                placeholder={currentCategoryMeta.placeholderMain}
              />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>ព័ត៌មានលម្អិត ១ (ស្រេចចិត្ត)</label>
              <input
                type="text"
                className="input-field"
                value={editOptionDetail1}
                onChange={e => setEditOptionDetail1(e.target.value)}
                placeholder={currentCategoryMeta.placeholderDetail1}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>ព័ត៌មានលម្អិត ២ (ស្រេចចិត្ត)</label>
              <input
                type="text"
                className="input-field"
                value={editOptionDetail2}
                onChange={e => setEditOptionDetail2(e.target.value)}
                placeholder={currentCategoryMeta.placeholderDetail2}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsOptionModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveEditedOption}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* TAG GROUP MODAL */}
      {isGroupModalOpen && (
        <div
          onClick={() => setIsGroupModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal"
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{groupEditId ? 'កែប្រែក្រុមស្លាកពាក្យ' : 'បង្កើតក្រុមស្លាកពាក្យថ្មី'}</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះក្រុម (Group Name)</label>
              <input type="text" className="input-field" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="ឧ. មុខវិជ្ជា, ថ្នាក់សិក្សា..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsGroupModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveGroup}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* TAG MODAL */}
      {isTagModalOpen && (
        <div
          onClick={() => setIsTagModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal"
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{tagEditId ? 'កែប្រែស្លាកពាក្យ' : 'បន្ថែមស្លាកពាក្យថ្មី'}</h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះស្លាកពាក្យ (Tag Name)</label>
              <input type="text" className="input-field" value={tagName} onChange={e => setTagName(e.target.value)} placeholder="ឧ. កម្រិតដំបូង, Programming..." />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ក្រុមស្លាកពាក្យ (Tag Group)</label>
              <CustomSelectDropdown
                value={String(tagGroupId ?? '')}
                onChange={setTagGroupId}
                emptyOptionLabel="-- គ្មានក្រុម (Ungrouped) --"
                searchable={tagGroups.length > 6}
                options={tagGroups.map(g => ({ value: String(g.id), label: g.name }))}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ពណ៌ស្លាកពាក្យ (Badge Color)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {tagColors.map(c => (
                  <div
                    key={c.hex}
                    onClick={() => setTagColor(c.hex)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: c.hex, cursor: 'pointer',
                      border: tagColor === c.hex ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                      transform: tagColor === c.hex ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
              <input type="color" value={tagColor} onChange={e => setTagColor(e.target.value)} style={{ width: '100%', height: '40px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsTagModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveTag}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div
          onClick={() => setIsUserModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel animate-fade-in settings-modal"
            style={{ padding: '2rem', background: 'var(--modal-bg)' }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{userEditId ? 'កែប្រែគណនី' : 'បង្កើតគណនីថ្មី'}</h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះពេញ</label>
              <input type="text" className="input-field" value={userNameField} onChange={e => setUserNameField(e.target.value)} placeholder="ឧ. សុខ ម៉េង" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ឈ្មោះគណនី (Username)</label>
              <input type="text" className="input-field" value={userUsernameField} onChange={e => setUserUsernameField(e.target.value)} placeholder="Username សម្រាប់ Login" />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>លេខសម្ងាត់ (Password)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showModalPassword ? 'text' : 'password'}
                  className="input-field"
                  value={userPasswordField}
                  onChange={e => setUserPasswordField(e.target.value)}
                  placeholder="បញ្ចូលលេខសម្ងាត់..."
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                  title={showModalPassword ? 'លាក់' : 'បង្ហាញ'}
                >
                  {showModalPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>តួនាទី</label>
              <CustomSelectDropdown
                value={userRoleField}
                onChange={setUserRoleField}
                searchable={false}
                options={[
                  { value: 'student', label: 'សិស្ស (Student)' },
                  { value: 'teacher', label: 'គ្រូបង្រៀន (Teacher)' },
                  { value: 'admin', label: 'អ្នកគ្រប់គ្រង (Admin)' },
                ]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setIsUserModalOpen(false)}>បោះបង់</button>
              <button className="btn btn-primary" onClick={handleSaveUser}>រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
