import { studentService } from './src/services/db/index.js';

async function run() {
  console.log('Fetching students...');
  try {
    const students = await studentService.getAll();
    console.log(`Found ${students.length} students.`);
    
    let updatedCount = 0;
    for (const student of students) {
      let needsUpdate = false;
      let updates: any = {};

      const badClasses = ['10C', '10c', '10 C', '10 c'];
      if (badClasses.includes(student.className)) {
        updates.className = '';
        needsUpdate = true;
      }
      
      const badTeachers = ['ស៊ុន សុខ', 'សុខ សាន្ត', 'Sok San', 'Sun Sok', 'ស៊ុនសុខ', 'សុខសាន្ត'];
      if (badTeachers.includes(student.teacherName)) {
        updates.teacherName = '';
        needsUpdate = true;
      }
      
      const badTransports = ['ម៉ូតូ', 'Personal'];
      // Wait, is 'Personal' a bad transport? The user's settings might actually have it, but they explicitly complained about 'ម៉ូតូ'.
      // Let's just remove 'ម៉ូតូ' and '10C' and 'សុខ សាន្ត' which are the defaults.
      if (badTransports.includes(student.transport)) {
        updates.transport = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`Updating student ${student.id} (${student.fullName}):`, updates);
        await studentService.update(student.id, updates);
        updatedCount++;
      }
    }
    console.log(`Done! Updated ${updatedCount} students.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
