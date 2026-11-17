import { FirebaseDataService } from './FirebaseDataService';
import { RtdbDataService } from './RtdbDataService';
import { studentDb, studentRtdb } from '@/lib/firebaseClient';

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
