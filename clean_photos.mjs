import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCjnEE5_5WyDxj_9kFcaCkW_-jN_hZ-YOg',
  authDomain: 'managesys-9c469.firebaseapp.com',
  projectId: 'managesys-9c469',
  storageBucket: 'managesys-9c469.firebasestorage.app',
  messagingSenderId: '324438333613',
  appId: '1:324438333613:web:ee2d53a8c871e10fc2ce24'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const querySnapshot = await getDocs(collection(db, 'students'));
  let count = 0;
  for (const document of querySnapshot.docs) {
    const data = document.data();
    if (data.photo && data.photo.includes('1SvTDHG3zdMHxOkER5Tii3Ac0alK3EqHi')) {
      console.log(`Updating student ${document.id} - ${data.fullName}`);
      await updateDoc(doc(db, 'students', document.id), {
        photo: ''
      });
      count++;
    }
  }
  console.log(`Updated ${count} students.`);
  process.exit(0);
}
run();
