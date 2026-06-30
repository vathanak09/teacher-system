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

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

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

export { app, db };
