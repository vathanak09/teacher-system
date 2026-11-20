import { FirebaseDataService } from './FirebaseDataService';
import { RtdbDataService } from './RtdbDataService';
import { studentDb, studentRtdb } from '@/lib/firebaseClient';
import { ref, update } from 'firebase/database';

// Export pre-configured instances for each collection

// PRIMARY FIRESTORE (Posts, Settings, Lessons, Methodologies, Resources)
export const lessonService = new FirebaseDataService<any>('lessons');
export const methodologyService = new FirebaseDataService<any>('methodologies');
export const settingsService = new FirebaseDataService<any>('settings');
export const postService = new FirebaseDataService<any>('posts');
export const resourceService = new FirebaseDataService<any>('resources');

// STUDENT FIRESTORE (Core rosters, classes, courses, main payments)
export const studentService = new FirebaseDataService<any>('students', studentDb);
export const teacherService = new FirebaseDataService<any>('teachers', studentDb);
export const classService = new FirebaseDataService<any>('classes', studentDb);
export const courseService = new FirebaseDataService<any>('courses', studentDb);
export const paymentService = new FirebaseDataService<any>('payments', studentDb);

// STUDENT REALTIME DATABASE (High-frequency operational data: scores, attendance, logs, tasks, monthly payments)
export const teachingRecordService = new RtdbDataService<any>('teachingRecords', studentRtdb);
export const taskService = new RtdbDataService<any>('tasks', studentRtdb);
export const monthlyPaymentService = new RtdbDataService<any>('monthlyPayments', studentRtdb);
export const attendanceService = new RtdbDataService<any>('attendance', studentRtdb);
export const scoreService = new RtdbDataService<any>('scores', studentRtdb);
export const scoreCoefficientService = new RtdbDataService<any>('scoreCoefficients', studentRtdb);
export const teacherTrackingService = new RtdbDataService<any>('teacherTracking', studentRtdb);
export const scheduleService = new RtdbDataService<any>('schedules', studentRtdb);
export const photoFrameTemplateService = new RtdbDataService<any>('photoFrameTemplates', studentRtdb);
export const photoFrameConfigService = new RtdbDataService<any>('photoFrameConfig', studentRtdb);

/**
 * Atomically updates a single teacher+week entry inside `teacherTracking/{monthKey}`
 * without touching other teachers' records or Admin's monthly metadata.
 */
export async function updateTeacherTrackingWeekEntry(
  monthKey: string,
  teacherId: string,
  weekKey: string,
  entry: Record<string, unknown>
): Promise<void> {
  if (!monthKey || !teacherId || !weekKey) return;
  const updates: Record<string, unknown> = {
    month: monthKey,
    updatedAt: new Date().toISOString(),
  };
  for (const [k, v] of Object.entries(entry)) {
    if (v !== undefined) {
      updates[`records/${teacherId}/${weekKey}/${k}`] = v;
    }
  }
  await update(ref(studentRtdb, `teacherTracking/${monthKey}`), updates);
}

/**
 * Performs an atomic multi-path patch against `teacherTracking/{monthKey}` so concurrent
 * teacher self-entries and Admin edits on different teachers/fields never overwrite each other.
 */
export async function patchTeacherTrackingMonth(
  monthKey: string,
  updatesMap: Record<string, unknown>
): Promise<void> {
  if (!monthKey) return;
  const cleanUpdates: Record<string, unknown> = {
    month: monthKey,
    updatedAt: new Date().toISOString(),
  };
  for (const [k, v] of Object.entries(updatesMap)) {
    if (v !== undefined) cleanUpdates[k] = v;
  }
  await update(ref(studentRtdb, `teacherTracking/${monthKey}`), cleanUpdates);
}
