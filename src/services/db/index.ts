import { FirebaseDataService } from './FirebaseDataService';
import { studentDb } from '@/lib/firebaseClient';

// Export pre-configured instances for each collection

// OLD DATABASE (Posts, Settings, etc)
export const lessonService = new FirebaseDataService<any>('lessons');
export const methodologyService = new FirebaseDataService<any>('methodologies');
export const settingsService = new FirebaseDataService<any>('settings');
export const postService = new FirebaseDataService<any>('posts');
export const resourceService = new FirebaseDataService<any>('resources');
export const messageService = new FirebaseDataService<any>('messages');

// NEW DATABASE (Student & Class Management)
export const studentService = new FirebaseDataService<any>('students', studentDb);
export const teacherService = new FirebaseDataService<any>('teachers', studentDb);
export const classService = new FirebaseDataService<any>('classes', studentDb);
export const courseService = new FirebaseDataService<any>('courses', studentDb);
export const paymentService = new FirebaseDataService<any>('payments', studentDb);
export const teachingRecordService = new FirebaseDataService<any>('teachingRecords', studentDb);
export const taskService = new FirebaseDataService<any>('tasks', studentDb);
export const attendanceService = new FirebaseDataService<any>('attendance', studentDb);

