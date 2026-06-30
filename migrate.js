const fs = require('fs');

const run = () => {
  const filePath = 'src/app/dashboard/settings/page.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add firebase imports
  if (!content.includes('import { db }')) {
    content = content.replace('import { useRouter } from \
ext/navigation\;', 
                              'import { useRouter } from \
ext/navigation\;\nimport { db } from \@/lib/firebaseClient\;\nimport { doc, onSnapshot, setDoc } from \irebase/firestore\;'.replace(/\/g, "'"));
  }

  const newUseEffect = \useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTagGroups(data.appTagGroups || [
          { id: 1, name: '????????????' },
          { id: 2, name: '?????????' }
        ]);
        setTags(data.appTags || [
          { id: 1, name: '?????????', color: '#8b5cf6', groupId: 2 },
          { id: 2, name: '????????????', color: '#3b82f6', groupId: 2 },
          { id: 3, name: '??????????', color: '#10b981', groupId: 1 }
        ]);
        setUsers(data.appUsers || []);
        setSchoolName(data.schoolName || '??????????????????????');
        setLevels(data.appStudentLevels || ['???????????????', '?????????????????', '???????????????']);
        setShifts(data.appStudentShifts || ['????????', '???????', '????????', '????-???????']);
        setAddresses(data.appStudentAddresses || ['???????', '??????', '?????', '????????']);
        setTransports(data.appStudentTransports || ['Bus', 'Personal', '?????', '???']);
      } else {
        // Initialize defaults in Firebase
        setDoc(doc(db, 'settings', 'global'), {
          appTagGroups: [
            { id: 1, name: '????????????' },
            { id: 2, name: '?????????' }
          ],
          appTags: [
            { id: 1, name: '?????????', color: '#8b5cf6', groupId: 2 },
            { id: 2, name: '????????????', color: '#3b82f6', groupId: 2 },
            { id: 3, name: '?????????2', color: '#10b981', groupId: 1 }
          ],
          appUsers: [],
          schoolName: '??????????????????????',
          appStudentLevels: ['???????????????', '?????????????????', '???????????????'],
          appStudentShifts: ['????????', '???????', '????????', '????-???????'],
          appStudentAddresses: ['???????', '??????', '?????', '????????'],
          appStudentTransports: ['Bus', 'Personal', '?????', '???']
        });
      }
    });
    return () => unsub();
  }, [router]);\;

  // Find the exact chunk and replace it
  const startIdx = content.indexOf('useEffect(() => {');
  const endIdx = content.indexOf('  }, [router]);') + 15;
  content = content.substring(0, startIdx) + newUseEffect + content.substring(endIdx);

  if (!content.includes('const updateSettings =')) {
    content = content.replace(newUseEffect, newUseEffect + \\n\n  const updateSettings = async (updates: any) => {\n    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });\n  };\);
  }

  // Replace localStorage.setItem calls
  content = content.replace(/localStorage\.setItem\(\s*'appTagGroups'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appTagGroups:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appTags'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appTags:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appUsers'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appUsers:  });');
  content = content.replace(/localStorage\.setItem\(\s*'schoolName'\s*,\s*(.*?)\s*\);/g, 'updateSettings({ schoolName:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appStudentLevels'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appStudentLevels:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appStudentShifts'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appStudentShifts:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appStudentAddresses'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appStudentAddresses:  });');
  content = content.replace(/localStorage\.setItem\(\s*'appStudentTransports'\s*,\s*JSON\.stringify\((.*?)\)\s*\);/g, 'updateSettings({ appStudentTransports:  });');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Rewrite successful');
};
run();
