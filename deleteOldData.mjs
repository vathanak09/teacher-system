import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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

async function deleteCollection(collectionName) {
  console.log(`Deleting ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  console.log(`Found ${snapshot.docs.length} documents in ${collectionName} to delete.`);
  
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
    count++;
  }
  console.log(`Successfully deleted ${count} documents from ${collectionName}.\n`);
}

async function run() {
  try {
    const collectionsToDelete = [
      'students',
      'classes',
      'courses',
      'payments',
      'teachingRecords',
      'tasks',
      'attendance',
      'teachers'
    ];
    
    for (const col of collectionsToDelete) {
      await deleteCollection(col);
    }
    console.log("Deletion complete!");
    process.exit(0);
  } catch (error) {
    console.error("Deletion failed:", error);
    process.exit(1);
  }
}

run();
