import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCjnEE5_5WyDxj_9kFcaCkW_-jN_hZ-YOg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "managesys-9c469.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "managesys-9c469",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "managesys-9c469.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "324438333613",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:324438333613:web:ee2d53a8c871e10fc2ce24"
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
  measurementId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_MEASUREMENT_ID || "G-W7P8TFLNFH",
  databaseURL:
    process.env.NEXT_PUBLIC_STUDENT_FIREBASE_DATABASE_URL ||
    "https://student-list-c866b-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const studentApp = getApps().find(a => a.name === 'StudentApp') || initializeApp(studentFirebaseConfig, 'StudentApp');

// Initialize Firestore with multi-tab IndexedDB persistent cache in browser
// so page reloads serve cached docs immediately and only fetch server deltas.
function createFirestoreInstance(firebaseApp: FirebaseApp) {
  if (typeof window === "undefined") {
    return getFirestore(firebaseApp);
  }
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Fallback if already initialized during Next.js HMR or IndexedDB is unavailable
    return getFirestore(firebaseApp);
  }
}

const db = createFirestoreInstance(app);

// Initialize Student Firestore & Student Realtime Database (Hybrid)
const studentDb = createFirestoreInstance(studentApp);
const studentRtdb = getDatabase(studentApp, studentFirebaseConfig.databaseURL);

// Initialize Storage
const storage = getStorage(app);
const studentStorage = getStorage(studentApp);

export { app, db, storage, studentApp, studentDb, studentRtdb, studentStorage };
