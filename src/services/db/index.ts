import { FirebaseDataService } from './FirebaseDataService';

// Export pre-configured instances for each collection
export const lessonService = new FirebaseDataService<any>('lessons');
export const methodologyService = new FirebaseDataService<any>('methodologies');
export const studentService = new FirebaseDataService<any>('students');
export const teacherService = new FirebaseDataService<any>('teachers');
export const classService = new FirebaseDataService<any>('classes');
export const courseService = new FirebaseDataService<any>('courses');
export const messageService = new FirebaseDataService<any>('messages');
export const paymentService = new FirebaseDataService<any>('payments');
export const settingsService = new FirebaseDataService<any>('settings');
