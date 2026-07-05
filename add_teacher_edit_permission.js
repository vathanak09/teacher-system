const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/classes/page.tsx', 'utf8');

// Normalize line endings to \n for matching
content = content.replace(/\r\n/g, '\n');

const stateOld = `  const [autoImportStudents, setAutoImportStudents] = useState(false);`;
const stateNew = `  const [autoImportStudents, setAutoImportStudents] = useState(false);
  const [allowTeacherEdit, setAllowTeacherEdit] = useState(false);`;
content = content.replace(stateOld, stateNew);

const openAddOld = `    setTargetLevelsField([]);
    setTargetShiftsField([]);
    setAutoImportStudents(false);`;
const openAddNew = `    setTargetLevelsField([]);
    setTargetShiftsField([]);
    setAutoImportStudents(false);
    setAllowTeacherEdit(false);`;
content = content.replace(openAddOld, openAddNew);

const openEditOld = `    setTargetLevelsField(c.targetLevels || []);
    setTargetShiftsField(c.targetShifts || []);
    setAutoImportStudents(false);
    setIsClassModalOpen(true);`;
const openEditNew = `    setTargetLevelsField(c.targetLevels || []);
    setTargetShiftsField(c.targetShifts || []);
    setAutoImportStudents(false);
    setAllowTeacherEdit(c.allowTeacherEdit || false);
    setIsClassModalOpen(true);`;
content = content.replace(openEditOld, openEditNew);

const saveClassOld = `      description: descriptionField,
      targetLevels: targetLevelsField,
      targetShifts: targetShiftsField,
      studentIds: baseStudentIds,
    };`;
const saveClassNew = `      description: descriptionField,
      targetLevels: targetLevelsField,
      targetShifts: targetShiftsField,
      studentIds: baseStudentIds,
      allowTeacherEdit: allowTeacherEdit,
    };`;
content = content.replace(saveClassOld, saveClassNew);

const saveUIOld = `                </div>
              </div>
            </form>
          </div>
        </div>
      )}`;
const saveUINew = `                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allowTeacherEdit} onChange={e => setAllowTeacherEdit(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>អនុញ្ញាតឱ្យគ្រូកែប្រែព័ត៌មានសិស្ស</span>
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}`;
content = content.replace(saveUIOld, saveUINew);


const reqEditOld = `  const handleRequestStudentEdit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editStudentData || !viewingClass) return;
      
      const originalStudent = allStudents.find(s => s.id === editStudentData.id);
      
      let changedFields = [];
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
      };
      
      try {
        await addDoc(collection(db, 'messages'), msg);
        alert('សំណើកែប្រែព័ត៌មានសិស្សត្រូវបានបញ្ជូនទៅកាន់ Admin ដោយជោគជ័យ!');
        setIsEditStudentModalOpen(false);
        setEditStudentData(null);
      } catch (error) {
        console.error("Error sending request:", error);
        alert("មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ សូមព្យាយាមម្តងទៀត។");
      }
    };`;

const reqEditNew = `  const handleRequestStudentEdit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editStudentData || !viewingClass) return;

      const hasEditPermission = role === 'admin' || viewingClass.allowTeacherEdit;

      if (hasEditPermission) {
        try {
          await updateDoc(doc(db, 'students', editStudentData.id), editStudentData);
          alert('ព័ត៌មានសិស្សត្រូវបានរក្សាទុកដោយជោគជ័យ!');
          setIsEditStudentModalOpen(false);
          setEditStudentData(null);
        } catch (error) {
          console.error("Error updating student:", error);
          alert("មានបញ្ហាក្នុងការរក្សាទុក។ សូមព្យាយាមម្តងទៀត។");
        }
        return;
      }
      
      const originalStudent = allStudents.find(s => s.id === editStudentData.id);
      
      let changedFields = [];
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
      };
      
      try {
        await addDoc(collection(db, 'messages'), msg);
        alert('សំណើកែប្រែព័ត៌មានសិស្សត្រូវបានបញ្ជូនទៅកាន់ Admin ដោយជោគជ័យ!');
        setIsEditStudentModalOpen(false);
        setEditStudentData(null);
      } catch (error) {
        console.error("Error sending request:", error);
        alert("មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ សូមព្យាយាមម្តងទៀត។");
      }
    };`;
content = content.replace(reqEditOld, reqEditNew);


const editStudentUIOld = `                  <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ស្នើសុំកែប្រែទៅ Admin
                  </button>`;
const editStudentUINew = `                  {(role === 'admin' || viewingClass?.allowTeacherEdit) ? (
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                      រក្សាទុកព័ត៌មាន
                    </button>
                  ) : (
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                      ស្នើសុំកែប្រែទៅ Admin
                    </button>
                  )}`;
content = content.replace(editStudentUIOld, editStudentUINew);


content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/classes/page.tsx', content, 'utf8');
console.log('Fixed correctly with teacher edit permission.');
