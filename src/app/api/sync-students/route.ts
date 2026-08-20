import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { spreadsheetId, studentsData } = data;

    if (!process.env.GOOGLE_CREDENTIALS_JSON) {
      return NextResponse.json({ error: 'Missing Google credentials in environment variables.' }, { status: 500 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Missing spreadsheet ID.' }, { status: 400 });
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets || [];

    // Helper to find or create sheet
    async function getOrCreateSheet(title: string, fallbackTitles: string[]) {
      let sheet = existingSheets.find(s => s.properties?.title === title || (s.properties?.title && fallbackTitles.includes(s.properties.title)));
      if (sheet) {
        return { sheetId: sheet.properties?.sheetId || 0, title: sheet.properties?.title || title };
      }
      
      // Try to create it
      try {
        const response = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title } } }]
          }
        });
        const newSheetId = response.data.replies?.[0].addSheet?.properties?.sheetId || 0;
        return { sheetId: newSheetId, title };
      } catch (e) {
        // Fallback to first sheet
        return { sheetId: existingSheets[0]?.properties?.sheetId || 0, title: existingSheets[0]?.properties?.title || 'Sheet1' };
      }
    }

    const studentHeaders = [
      'ល.រ', 'អត្តលេខ', 'ឈ្មោះពេញ', 'ឈ្មោះអង់គ្លេស', 'ភេទ',
      'កម្រិតសិក្សា', 'វេន', 'ថ្នាក់', 'ថ្ងៃចូលរៀន', 'ថ្លៃសិក្សា',
      'ថ្ងៃបង់បន្ទាប់', 'ស្ថានភាពបង់ប្រាក់', 'ស្ថានភាព', 'ឈ្មោះគ្រូ',
      'ថ្ងៃកំណើត', 'អាសយដ្ឋាន', 'ទីតាំង', 'មធ្យោបាយ', 'អ្នកទំនាក់ទំនង',
      'ឪពុក', 'ម្តាយ', 'លេខទូរស័ព្ទ'
    ];

    const generateStudentRow = (s: any, index: number) => {
      const paymentStatus = s.statusInfo?.label || s.paymentStatus || '';
      return [
        index,
        s.studentId || '',
        s.fullName || '',
        s.englishName || '',
        s.gender || '',
        s.level || '',
        s.shift || '',
        s.className || '',
        s.enrollDate || '',
        s.fee || '',
        s.nextPaymentDate || '',
        paymentStatus,
        s.status || '',
        s.teacherName || '',
        s.dob || '',
        s.address || '',
        s.location || '',
        s.transport || '',
        s.contact || '',
        s.father || '',
        s.mother || '',
        s.phoneNum || ''
      ];
    };

    // 1. Process Students Tab (All Students)
    const studentSheetInfo = await getOrCreateSheet('សិស្ស', ['Students', 'បញ្ជីសិស្ស']);
    const studentValues: any[][] = [studentHeaders];
    let studentIndex = 1;
    for (const s of studentsData || []) {
      studentValues.push(generateStudentRow(s, studentIndex++));
    }

    // 2. Process Due Students Tab (ដល់ថ្ងៃបង់ប្រាក់)
    const dueSheetInfo = await getOrCreateSheet('ដល់ថ្ងៃបង់ប្រាក់', ['Due', 'ជំពាក់', 'ដល់ថ្ងៃបង់']);
    const dueValues: any[][] = [studentHeaders];
    let dueIndex = 1;
    for (const s of studentsData || []) {
      const pStatus = s.statusInfo?.label || '';
      if (pStatus !== 'បានបង់') {
        dueValues.push(generateStudentRow(s, dueIndex++));
      }
    }

    // 3. Process Paid Students Tab (បង់ប្រាក់រួច)
    const paidSheetInfo = await getOrCreateSheet('បង់ប្រាក់រួច', ['Paid', 'បានបង់']);
    const paidValues: any[][] = [studentHeaders];
    let paidIndex = 1;
    for (const s of studentsData || []) {
      const pStatus = s.statusInfo?.label || '';
      if (pStatus === 'បានបង់') {
        paidValues.push(generateStudentRow(s, paidIndex++));
      }
    }

    // Write to sheets
    const sheetsToUpdate = [
      { info: studentSheetInfo, values: studentValues, cols: 'A:V', endCol: 'V' },
      { info: dueSheetInfo, values: dueValues, cols: 'A:V', endCol: 'V' },
      { info: paidSheetInfo, values: paidValues, cols: 'A:V', endCol: 'V' }
    ];

    const uniqueSheets = new Set();
    
    for (const sheet of sheetsToUpdate) {
      if (uniqueSheets.has(sheet.info.title)) continue;
      uniqueSheets.add(sheet.info.title);

      try {
        await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${sheet.info.title}'!${sheet.cols}` });
      } catch(e) {}
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheet.info.title}'!A1:${sheet.endCol}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sheet.values }
      });
    }

    // Format headers
    const formatRequests = [];
    uniqueSheets.clear();

    const colors = [
      { red: 0.1, green: 0.5, blue: 0.3 }, // Greenish for students
      { red: 0.8, green: 0.2, blue: 0.2 }, // Reddish for due
      { red: 0.1, green: 0.4, blue: 0.8 }  // Blueish for paid
    ];

    let colorIdx = 0;
    for (const sheet of sheetsToUpdate) {
      if (uniqueSheets.has(sheet.info.title)) continue;
      uniqueSheets.add(sheet.info.title);

      formatRequests.push({
        repeatCell: {
          range: { sheetId: sheet.info.sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: colors[colorIdx % 3],
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      });
      colorIdx++;
    }

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: formatRequests
        }
      });
    } catch(e) {}

    return NextResponse.json({ success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
