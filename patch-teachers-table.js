
const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/teachers/page.tsx', 'utf8');

const oldHeader = \<th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្តលេខ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះខ្មែរ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អក្សរឡាតាំង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>មុខវិជ្ជា</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ទូរស័ព្ទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>\;

const newHeader = \<th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខរៀង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>រូបថត</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>អត្ត លេខ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឈ្មោះខ្មែរ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ឡាតាំង</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ភេទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>លេខទូរស័ព្ទ</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Contacts</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ស្ថានភាព</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>សកម្មភាព</th>\;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/app/dashboard/teachers/page.tsx', code, 'utf8');
console.log('Patched headers');

