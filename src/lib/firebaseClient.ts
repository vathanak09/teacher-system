import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Main Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Secondary Firebase App (Student DB)
const studentFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_API_KEY || "AIzaSyC0pAz8FcgoTpqd01hiYNS5VKdeg2tJxr4",
  authDomain: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_AUTH_DOMAIN || "student-list-c866b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_PROJECT_ID || "student-list-c866b",
  storageBucket: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_STORAGE_BUCKET || "student-list-c866b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_MESSAGING_SENDER_ID || "787865105415",
  appId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_APP_ID || "1:787865105415:web:4895fbc276406ee92d26a2",
  measurementId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_MEASUREMENT_ID || "G-W7P8TFLNFH"
};

const studentApp = getApps().find(a => a.name === 'StudentApp') || initializeApp(studentFirebaseConfig, 'StudentApp');

// Initialize Firestore with offline persistence capabilities
let db: ReturnType<typeof getFirestore>;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  });
} catch (e) {
  // Fallback if offline persistence fails or is already initialized
  db = getFirestore(app);
}

// Initialize Student Firestore
let studentDb: ReturnType<typeof getFirestore>;

try {
  studentDb = initializeFirestore(studentApp, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  }, 'StudentApp'); // Ensure uniquely named initialization
} catch (e) {
  studentDb = getFirestore(studentApp);
}

export { app, db, studentApp, studentDb };
