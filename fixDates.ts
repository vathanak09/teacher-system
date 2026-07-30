import fs from 'fs';
import { studentService } from './src/services/db/index';

async function run() {
  console.log('Fixing enrollment dates again...');
  try {
    const logData = fs.readFileSync('C:\\Users\\Vathanak-MSI\\.gemini\\antigravity\\brain\\e4f3f710-7d3a-4798-8c85-d312e615f810\\.system_generated\\tasks\\task-13203.log', 'utf8');
    const lines = logData.split('\n');
    
    // Fetch all students to see who has 06
    const students = await studentService.getAll();
    const map = new Map();
    for (const s of students) map.set(s.id, s);

    let updatedCount = 0;
    
    for (const line of lines) {
      const match = line.match(/Updating student ([a-zA-Z0-9]+) .*?: (.*?) \-> (.*?)$/);
      if (match) {
        const studentId = match[1];
        const originalDateStr = match[2].trim();
        
        let day = '01';
        
        if (originalDateStr.includes('/')) {
           const parts = originalDateStr.split('/');
           if (parts.length === 3) {
             if (parts[0] === '6' || Number(parts[0]) > 12) {
                day = parts[1].padStart(2, '0');
             } else {
                day = parts[0].padStart(2, '0');
             }
           }
        } else if (originalDateStr.includes('-')) {
           const parts = originalDateStr.split('-');
           if (parts.length === 3) {
              if (parts[0].length === 4) {
                 day = parts[2].substring(0, 2);
              } else {
                 day = parts[0].padStart(2, '0');
              }
           }
        }
        
        const correctedDate = `2026-07-${day}`;
        const student = map.get(studentId);
        if (student && student.enrollDate === '2026-07-06' && correctedDate !== '2026-07-06') {
           console.log(`Refixing student ${studentId}: original ${originalDateStr} -> ${correctedDate}`);
           await studentService.update(studentId, { enrollDate: correctedDate });
           updatedCount++;
        }
      }
    }
    
    console.log(`Done! Fixed ${updatedCount} students.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
