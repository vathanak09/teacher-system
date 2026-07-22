const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...vParts] = line.split('=');
  const v = vParts.join('=');
  if(k && v) acc[k] = v.trim().replace(/^\"|\"$/g, '');
  return acc;
}, {});

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = getFirestore(app);

getDocs(collection(db, 'methodologies')).then(snap => {
  snap.forEach(doc => {
    const data = doc.data();
    if (String(data.postCode) === '5819') {
      console.log(JSON.stringify(data.content));
    }
  });
  process.exit(0);
});
