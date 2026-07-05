const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');
content = content.replace(/\r\n/g, '\n');

const reqOld = `      let changedFields = [];
      if (originalStudent) {
        const fieldsToCheck = [
          { key: 'fullName', label: 'ឈ្មោះពេញ' }, { key: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
          { key: 'gender', label: 'ភេទ' }, { key: 'level', label: 'កម្រិតសិក្សា' }, { key: 'shift', label: 'វេន' },
          { key: 'enrollDate', label: 'ថ្ងៃចូលរៀន' }, { key: 'fee', label: 'ថ្លៃសិក្សា' },
          { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' }, { key: 'address', label: 'អាសយដ្ឋាន' },
          { key: 'location', label: 'ទីតាំង' }, { key: 'transport', label: 'មធ្យោបាយ' },
          { key: 'photo', label: 'រូបថត' }, { key: 'status', label: 'ស្ថានភាព' },
          { key: 'contact', label: 'អ្នកទំនាក់ទំនង' }, { key: 'father', label: 'ឈ្មោះឪពុក' },
          { key: 'mother', label: 'ឈ្មោះម្តាយ' }, { key: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
        ];
        
        for (const field of fieldsToCheck) {
          if (String(originalStudent[field.key] || '') !== String(editStudentData[field.key] || '')) {
            changedFields.push(\`- \${field.label}: [ចាស់]: \${originalStudent[field.key] || 'ទទេ'} -> [ថ្មី]: **\${editStudentData[field.key] || 'ទទេ'}**\`);
          }
        }
      }
      
      const changesText = changedFields.length > 0 
        ? \`មានព័ត៌មានដែលបានកែប្រែ៖\\n\${changedFields.join('\\n')}\`
        : 'មិនមានព័ត៌មានត្រូវបានកែប្រែទេប៉ុន្តែបានស្នើសុំពិនិត្យមើល។';

      const msg = {
        text: \`សួស្តី Admin សូមជួយកែប្រែព័ត៌មានសិស្សខាងក្រោម៖ \\n\${editStudentData.fullName} (អត្តលេខ: \${editStudentData.studentId})\\n\\n\${changesText}\`,
        senderId: userId,
        senderName: userName,
        senderRole: role,
        receiverId: 'admin',
        isRead: false,
        createdAt: new Date().toISOString()
      };`;

const reqNew = `      let changedFieldsText = [];
      let changesData = [];
      if (originalStudent) {
        const fieldsToCheck = [
          { key: 'fullName', label: 'ឈ្មោះពេញ' }, { key: 'englishName', label: 'ឈ្មោះអង់គ្លេស' },
          { key: 'gender', label: 'ភេទ' }, { key: 'level', label: 'កម្រិតសិក្សា' }, { key: 'shift', label: 'វេន' },
          { key: 'enrollDate', label: 'ថ្ងៃចូលរៀន' }, { key: 'fee', label: 'ថ្លៃសិក្សា' },
          { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត' }, { key: 'address', label: 'អាសយដ្ឋាន' },
          { key: 'location', label: 'ទីតាំង' }, { key: 'transport', label: 'មធ្យោបាយ' },
          { key: 'photo', label: 'រូបថត' }, { key: 'status', label: 'ស្ថានភាព' },
          { key: 'contact', label: 'អ្នកទំនាក់ទំនង' }, { key: 'father', label: 'ឈ្មោះឪពុក' },
          { key: 'mother', label: 'ឈ្មោះម្តាយ' }, { key: 'phoneNum', label: 'លេខទូរស័ព្ទ' }
        ];
        
        for (const field of fieldsToCheck) {
          if (String(originalStudent[field.key] || '') !== String(editStudentData[field.key] || '')) {
            changedFieldsText.push(\`- \${field.label}: [ចាស់]: \${originalStudent[field.key] || 'ទទេ'} -> [ថ្មី]: **\${editStudentData[field.key] || 'ទទេ'}**\`);
            changesData.push({
              key: field.key,
              label: field.label,
              oldVal: originalStudent[field.key] || '',
              newVal: editStudentData[field.key] || ''
            });
          }
        }
      }
      
      const changesText = changedFieldsText.length > 0 
        ? \`មានព័ត៌មានដែលបានកែប្រែ៖\\n\${changedFieldsText.join('\\n')}\`
        : 'មិនមានព័ត៌មានត្រូវបានកែប្រែទេប៉ុន្តែបានស្នើសុំពិនិត្យមើល។';

      const msg = {
        text: \`សួស្តី Admin សូមជួយកែប្រែព័ត៌មានសិស្សខាងក្រោម៖ \\n\${editStudentData.fullName} (អត្តលេខ: \${editStudentData.studentId})\\n\\n\${changesText}\`,
        senderId: userId,
        senderName: userName,
        senderRole: role,
        receiverId: 'admin',
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'student_edit_request',
        editRequestData: {
          studentId: editStudentData.id,
          studentName: editStudentData.fullName,
          studentIdCode: editStudentData.studentId,
          changes: changesData
        }
      };`;

content = content.replace(reqOld, reqNew);
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Updated classes page message payload.');
