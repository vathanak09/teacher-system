"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { classService, settingsService, studentService } from '@/services/db';
import { convertDriveImageLink } from '@/utils/driveLink';
import CustomDatePicker from './CustomDatePicker';
import CustomSelectDropdown from './CustomSelectDropdown';
import ImageUploadBox from './ImageUploadBox';
import { AppIcon } from './AppIcons';

export interface StudentQuickEditModalProps {
  student: any | null;
  allStudents: any[];
  classesData: any[];
  onSaved?: (studentName: string) => void;
  onError?: (message: string) => void;
  onClose: () => void;
}

function toSelectOptions(list: string[], currentVal?: string) {
  const unique = Array.from(
    new Set([...(list || []), ...(currentVal ? [currentVal] : [])].filter(Boolean))
  );
  return unique.map((item) => ({ value: item, label: item }));
}

function convertDriveUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
}

export default function StudentQuickEditModal({
  student,
  allStudents,
  classesData,
  onSaved,
  onError,
  onClose,
}: StudentQuickEditModalProps) {
  // Part 1 & Part 2 Fields (Identical to /dashboard/students Edit Student Modal)
  const [studentIdField, setStudentIdField] = useState('');
  const [studentFullNameField, setStudentFullNameField] = useState('');
  const [studentEnglishNameField, setStudentEnglishNameField] = useState('');
  const [studentGenderField, setStudentGenderField] = useState('');
  const [studentLevelField, setStudentLevelField] = useState('');
  const [studentShiftField, setStudentShiftField] = useState('');
  const [studentEnrollDateField, setStudentEnrollDateField] = useState('');
  const [studentFeeField, setStudentFeeField] = useState('');
  const [studentClassIdField, setStudentClassIdField] = useState('');
  const [initialStudentClassId, setInitialStudentClassId] = useState('');
  const [studentClassNameField, setStudentClassNameField] = useState('');
  const [studentTeacherField, setStudentTeacherField] = useState('');

  const [studentDobField, setStudentDobField] = useState('');
  const [studentAddressField, setStudentAddressField] = useState('');
  const [studentLocationField, setStudentLocationField] = useState('');
  const [studentTransportField, setStudentTransportField] = useState('');
  const [studentPhotoField, setStudentPhotoField] = useState('');
  const [studentStatusField, setStudentStatusField] = useState('កំពុងសិក្សា');
  const [studentContactField, setStudentContactField] = useState('');
  const [studentFatherField, setStudentFatherField] = useState('');
  const [studentMotherField, setStudentMotherField] = useState('');
  const [studentPhoneNumField, setStudentPhoneNumField] = useState('');

  const [showPart1, setShowPart1] = useState(true);
  const [showPart2, setShowPart2] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Options loaded from settings/global (identical to /dashboard/students)
  const [levelOptions, setLevelOptions] = useState<string[]>([
    'កម្រិតបឋមសិក្សា',
    'កម្រិតមធ្យមសិក្សា',
    'កម្រិតវិទ្យាល័យ',
  ]);
  const [shiftOptions, setShiftOptions] = useState<string[]>([
    'វេនព្រឹក',
    'វេនរសៀល',
    'វេនល្ងាច',
    'សៅរ៍-អាទិត្យ',
  ]);
  const [addressOptions, setAddressOptions] = useState<string[]>([
    'ភ្នំពេញ',
    'កណ្ដាល',
    'តាកែវ',
    'កំពង់ចាម',
  ]);
  const [transportOptions, setTransportOptions] = useState<string[]>([
    'Bus',
    'Personal',
    'ម៉ូតូ',
    'កង់',
  ]);
  const [genderOptions, setGenderOptions] = useState<string[]>(['ប្រុស', 'ស្រី']);
  const [statusOptions, setStatusOptions] = useState<string[]>([
    'កំពុងសិក្សា',
    'ព្យួរការសិក្សា',
    'ឈប់រៀន',
  ]);

  useEffect(() => {
    const unsubSettings = settingsService.subscribeOne('global', (data) => {
      if (!data) return;
      if (data.appStudentLevels) {
        setLevelOptions(
          data.appStudentLevels.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
      if (data.appStudentShifts) {
        setShiftOptions(
          data.appStudentShifts.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
      if (data.appStudentAddresses) {
        setAddressOptions(
          data.appStudentAddresses.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
      if (data.appStudentTransports) {
        setTransportOptions(
          data.appStudentTransports.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
      if (data.appStudentGenders) {
        setGenderOptions(
          data.appStudentGenders.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
      if (data.appStudentStatuses) {
        setStatusOptions(
          data.appStudentStatuses.map((opt: any) => (typeof opt === 'string' ? opt : opt.id))
        );
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!student) return;
    setStudentIdField(student.studentId || '');
    setStudentFullNameField(student.fullName || '');
    setStudentEnglishNameField(student.englishName || '');
    setStudentGenderField(student.gender || '');
    setStudentLevelField(student.level || '');
    setStudentShiftField(student.shift || '');
    setStudentEnrollDateField(student.enrollDate || '');
    setStudentFeeField(
      student.fee !== undefined && student.fee !== null ? String(student.fee) : '120'
    );

    const matchedClass =
      classesData.find((c: any) => c.studentIds && c.studentIds.includes(student.id)) ||
      classesData.find(
        (c: any) =>
          (c.classCode || c.className) && (c.classCode || c.className) === student.className
      );
    const matchedClassId = matchedClass ? matchedClass.id : '';
    setStudentClassIdField(matchedClassId);
    setInitialStudentClassId(matchedClassId);
    setStudentClassNameField(student.className || '');
    setStudentTeacherField(student.teacherName || '');

    setStudentDobField(student.dob || '');
    setStudentAddressField(student.address || '');
    setStudentLocationField(student.location || '');
    setStudentTransportField(student.transport || '');
    setStudentPhotoField(student.photo || '');
    setStudentStatusField(student.status || 'កំពុងសិក្សា');
    setStudentContactField(student.contact || '');
    setStudentFatherField(student.father || '');
    setStudentMotherField(student.mother || '');
    setStudentPhoneNumField(student.phoneNum || '');
    setShowPart1(true);
    setShowPart2(true);
    setIsUploadSuccess(false);
  }, [student, classesData]);

  if (!student || typeof document === 'undefined') return null;

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setIsUploadSuccess(false);
      const { compressImage } = await import('@/utils/imageCompressor');
      const { uploadStudentPhoto } = await import('@/services/db/StorageService');
      const compressedBlob = await compressImage(file, 300, 1024);

      const sName = studentEnglishNameField || studentFullNameField || 'student';
      const sId = studentIdField || 'no_id';
      const formattedName = `${sId}_${sName}`.replace(/\s+/g, '_');

      const url = await uploadStudentPhoto(compressedBlob, formattedName);
      setStudentPhotoField(url);
      setIsUploadSuccess(true);
      setTimeout(() => setIsUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to upload photo', err);
      onError?.('បរាជ័យក្នុងការបញ្ចូលរូបថត។');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveStudent = async () => {
    if (
      !studentIdField.trim() ||
      !studentFullNameField.trim() ||
      !studentEnglishNameField.trim() ||
      !studentGenderField ||
      !studentLevelField ||
      !studentShiftField ||
      !studentEnrollDateField ||
      studentFeeField.trim() === ''
    ) {
      onError?.('សូមបំពេញរាល់ព័ត៌មានសិក្សានៅផ្នែកទី១ ឱ្យបានគ្រប់ជ្រុងជ្រោយ (មិនអាចរំលងបានឡើយ)!');
      return;
    }

    const isDuplicate = allStudents.some(
      (s: any) =>
        s.studentId?.toLowerCase() === studentIdField.trim().toLowerCase() &&
        s.id !== student.id
    );
    if (isDuplicate) {
      onError?.(
        'អត្តលេខនេះមានរួចហើយក្នុងប្រព័ន្ធ! សូមបញ្ចូលអត្តលេខផ្សេង (Student ID must be unique).'
      );
      return;
    }

    setIsSaving(true);
    try {
      const directPhotoUrl = convertDriveUrl(studentPhotoField);
      const selectedClass = classesData.find((c: any) => c.id === studentClassIdField);
      const resolvedClassName = selectedClass
        ? selectedClass.classCode || selectedClass.className || ''
        : initialStudentClassId
          ? ''
          : studentClassNameField;
      const resolvedTeacherName = selectedClass
        ? selectedClass.teacherName || ''
        : initialStudentClassId
          ? ''
          : studentTeacherField;

      const studentData = {
        studentId: studentIdField,
        fullName: studentFullNameField,
        englishName: studentEnglishNameField,
        gender: studentGenderField,
        level: studentLevelField,
        shift: studentShiftField,
        enrollDate: studentEnrollDateField,
        fee:
          studentFeeField.trim() !== '' && !Number.isNaN(Number(studentFeeField))
            ? Number(studentFeeField)
            : 0,
        className: resolvedClassName,
        teacherName: resolvedTeacherName,
        dob: studentDobField,
        address: studentAddressField,
        location: studentLocationField,
        transport: studentTransportField,
        photo: directPhotoUrl,
        status: studentStatusField,
        contact: studentContactField,
        father: studentFatherField,
        mother: studentMotherField,
        phoneNum: studentPhoneNumField,
      };

      await studentService.update(student.id, studentData);

      if (studentClassIdField !== initialStudentClassId) {
        if (initialStudentClassId) {
          const prevClass = classesData.find((c: any) => c.id === initialStudentClassId);
          if (prevClass) {
            const updatedPrevIds = (prevClass.studentIds || []).filter(
              (id: string) => id !== student.id
            );
            await classService.update(prevClass.id, { studentIds: updatedPrevIds });
          }
        }
        if (selectedClass) {
          const currentIds = selectedClass.studentIds || [];
          if (!currentIds.includes(student.id)) {
            await classService.update(selectedClass.id, {
              studentIds: [...currentIds, student.id],
            });
          }
        }
      }

      onSaved?.(studentFullNameField);
      onClose();
    } catch (err) {
      console.error('Error updating student:', err);
      onError?.('មានបញ្ហាក្នុងការរក្សាទុកព័ត៌មានសិស្ស!');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 25000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-fade-in post-read-modal"
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--modal-bg)',
          padding: '2rem',
          paddingBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0 }}>កែប្រែព័ត៌មានសិស្ស</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
            }}
            title="បិទ"
          >
            <AppIcon name="x" size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Part 1 Header Toggle */}
          <div
            onClick={() => setShowPart1(!showPart1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '1rem',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AppIcon name="graduation-cap" size={18} style={{ color: '#6366f1' }} /> ផ្នែកទី១៖
              ព័ត៌មានសិក្សា (Student ID ដល់ Fee)
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <AppIcon name={showPart1 ? 'chevron-down' : 'chevron-right'} size={15} />{' '}
              {showPart1 ? 'លាក់ (Hide)' : 'បង្ហាញ (Show)'}
            </span>
          </div>

          {showPart1 && (
            <div
              className="animate-fade-in"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  អត្តលេខ (Student ID) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentIdField}
                  onChange={(e) => setStudentIdField(e.target.value)}
                  placeholder="ឧ. BS0001"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ឈ្មោះពេញ (Khmer Name) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentFullNameField}
                  onChange={(e) => setStudentFullNameField(e.target.value)}
                  placeholder="ឧ. លី តិចស្រេង"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ឈ្មោះឡាតាំង (English Name) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentEnglishNameField}
                  onChange={(e) => setStudentEnglishNameField(e.target.value)}
                  placeholder="ឧ. Ly Tichsreng"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ភេទ (Gender) *
                </label>
                <CustomSelectDropdown
                  value={studentGenderField}
                  onChange={setStudentGenderField}
                  searchable={false}
                  placeholder="-- ជ្រើសរើសភេទ --"
                  options={toSelectOptions(genderOptions, studentGenderField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  កម្រិតសិក្សា (Level) *
                </label>
                <CustomSelectDropdown
                  value={studentLevelField}
                  onChange={setStudentLevelField}
                  searchable={levelOptions.length > 6}
                  placeholder="-- ជ្រើសរើសកម្រិត --"
                  options={toSelectOptions(levelOptions, studentLevelField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  វេនសិក្សា (Shift) *
                </label>
                <CustomSelectDropdown
                  value={studentShiftField}
                  onChange={setStudentShiftField}
                  searchable={shiftOptions.length > 6}
                  placeholder="-- ជ្រើសរើសវេន --"
                  options={toSelectOptions(shiftOptions, studentShiftField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ថ្ងៃចូលរៀន (Enroll Date) *
                </label>
                <CustomDatePicker
                  selected={studentEnrollDateField}
                  onChange={(date) => setStudentEnrollDateField(date)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ថ្លៃសិក្សា (Fee) [1 = 1000៛] *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={studentFeeField}
                  onChange={(e) => setStudentFeeField(e.target.value)}
                  placeholder="ឧ. 120 (120,000៛)"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ថ្នាក់រៀន (Class)
                </label>
                <CustomSelectDropdown
                  value={studentClassIdField}
                  onChange={(classId) => {
                    setStudentClassIdField(classId);
                    const cls = classesData.find((c: any) => c.id === classId);
                    if (cls) {
                      setStudentClassNameField(cls.classCode || cls.className || '');
                      setStudentTeacherField(cls.teacherName || '');
                    } else {
                      setStudentClassNameField('');
                      setStudentTeacherField('');
                    }
                  }}
                  placeholder="-- ជ្រើសរើសថ្នាក់រៀន --"
                  emptyOptionLabel="-- មិនទាន់កំណត់ថ្នាក់ --"
                  searchPlaceholder="ស្វែងរកលេខថ្នាក់ ឬ ឈ្មោះគ្រូ..."
                  options={classesData.map((c: any) => {
                    const code = c.classCode || c.className || 'គ្មានលេខថ្នាក់';
                    const nameSuffix =
                      c.classCode && c.className && c.classCode !== c.className
                        ? ` (${c.className})`
                        : '';
                    return {
                      value: c.id,
                      label: `${code}${nameSuffix}`,
                      sublabel: `គ្រូ៖ ${c.teacherName || 'មិនទាន់កំណត់'}`,
                    };
                  })}
                />
              </div>
            </div>
          )}

          {/* Part 2 Header Toggle */}
          <div
            onClick={() => setShowPart2(!showPart2)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '1rem',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AppIcon name="home" size={18} style={{ color: '#8b5cf6' }} /> ផ្នែកទី២៖
              ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង (DOB ដល់ Phone Num)
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <AppIcon name={showPart2 ? 'chevron-down' : 'chevron-right'} size={15} />{' '}
              {showPart2 ? 'លាក់ (Hide)' : 'បង្ហាញ (Show)'}
            </span>
          </div>

          {showPart2 && (
            <div
              className="animate-fade-in"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ថ្ងៃខែឆ្នាំកំណើត (DOB)
                </label>
                <CustomDatePicker
                  selected={studentDobField}
                  onChange={(date) => setStudentDobField(date)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  អាសយដ្ឋាន (Address)
                </label>
                <CustomSelectDropdown
                  value={studentAddressField}
                  onChange={setStudentAddressField}
                  searchable={addressOptions.length > 6}
                  placeholder="-- ជ្រើសរើសអាសយដ្ឋាន --"
                  options={toSelectOptions(addressOptions, studentAddressField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ទីតាំង (Google Maps Link)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentLocationField}
                  onChange={(e) => setStudentLocationField(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  មធ្យោបាយធ្វើដំណើរ (Transport)
                </label>
                <CustomSelectDropdown
                  value={studentTransportField}
                  onChange={setStudentTransportField}
                  searchable={transportOptions.length > 6}
                  placeholder="-- ជ្រើសរើសមធ្យោបាយ --"
                  options={toSelectOptions(transportOptions, studentTransportField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  រូបថតសិស្ស (Photo URL)
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <ImageUploadBox
                    onFileSelect={handlePhotoUpload}
                    currentImage={
                      studentPhotoField ? convertDriveImageLink(studentPhotoField) : undefined
                    }
                    isUploading={isUploadingPhoto}
                    isUploadSuccess={isUploadSuccess}
                    shape="rect"
                    width="80px"
                    height="60px"
                    isActiveModal={Boolean(student)}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={studentPhotoField}
                    onChange={(e) => setStudentPhotoField(e.target.value)}
                    placeholder="បញ្ចូល Link ឬ Upload រូបថត"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ស្ថានភាពសិក្សា (Status)
                </label>
                <CustomSelectDropdown
                  value={studentStatusField}
                  onChange={setStudentStatusField}
                  searchable={false}
                  placeholder="-- ជ្រើសរើសស្ថានភាព --"
                  options={toSelectOptions(statusOptions, studentStatusField)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  អ្នកទំនាក់ទំនង (Social Media Link)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentContactField}
                  onChange={(e) => setStudentContactField(e.target.value)}
                  placeholder="https://t.me/username ឬ Link ផ្សេងៗ"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ឈ្មោះឪពុក (Father Name)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentFatherField}
                  onChange={(e) => setStudentFatherField(e.target.value)}
                  placeholder="ឧ. លី សុវណ្ណ"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  ឈ្មោះម្តាយ (Mother Name)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentMotherField}
                  onChange={(e) => setStudentMotherField(e.target.value)}
                  placeholder="ឧ. មាស សុខ"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                  លេខទូរស័ព្ទ (Phone Num)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentPhoneNumField}
                  onChange={(e) => setStudentPhoneNumField(e.target.value)}
                  placeholder="ឧ. 012345678"
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onClick={onClose}
          >
            បោះបង់
          </button>
          <button
            type="button"
            disabled={isSaving}
            className="btn btn-primary"
            onClick={handleSaveStudent}
            style={{ padding: '0.75rem 2rem' }}
          >
            {isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
