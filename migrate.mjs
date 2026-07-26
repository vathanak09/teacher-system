import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Load env from .env.local manually
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/^['"](.*)['"]$/, '$1'); // remove quotes
      process.env[key] = value;
    }
  });
}

// Old DB
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// New DB
const studentFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_API_KEY || "AIzaSyC0pAz8FcgoTpqd01hiYNS5VKdeg2tJxr4",
  authDomain: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_AUTH_DOMAIN || "student-list-c866b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_PROJECT_ID || "student-list-c866b",
  storageBucket: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_STORAGE_BUCKET || "student-list-c866b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_MESSAGING_SENDER_ID || "787865105415",
  appId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_APP_ID || "1:787865105415:web:4895fbc276406ee92d26a2",
  measurementId: process.env.NEXT_PUBLIC_STUDENT_FIREBASE_MEASUREMENT_ID || "G-W7P8TFLNFH"
};
const studentApp = initializeApp(studentFirebaseConfig, 'StudentApp');
const studentDb = getFirestore(studentApp);

async function migrateCollection(collectionName) {
  console.log(`Migrating ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  console.log(`Found ${snapshot.docs.length} documents in ${collectionName}.`);
  
  let count = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    await setDoc(doc(studentDb, collectionName, docSnap.id), data);
    count++;
  }
  console.log(`Successfully migrated ${count} documents for ${collectionName}.\n`);
}

async function run() {
  try {
    const collectionsToMigrate = [
      'students',
      'classes',
      'courses',
      'payments',
      'teachingRecords',
      'tasks',
      'attendance',
      'teachers'
    ];
    
    for (const col of collectionsToMigrate) {
      await migrateCollection(col);
    }
    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
