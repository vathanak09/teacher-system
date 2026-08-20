import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { spreadsheetId, studentsData, paymentsData } = data;

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

    // 1. Process Students Tab
    const studentSheetInfo = await getOrCreateSheet('សិស្ស', ['Students', 'បញ្ជីសិស្ស', 'ទិន្នន័យសិស្ស']);
    const studentValues: any[][] = [];
    studentValues.push([
      'ល.រ', 'អត្តលេខ', 'ឈ្មោះពេញ', 'ឈ្មោះអង់គ្លេស', 'ភេទ',
      'កម្រិតសិក្សា', 'វេន', 'ថ្នាក់', 'ថ្ងៃចូលរៀន', 'ថ្លៃសិក្សា',
      'ថ្ងៃបង់បន្ទាប់', 'ស្ថានភាពបង់ប្រាក់', 'ស្ថានភាព', 'ឈ្មោះគ្រូ',
      'ថ្ងៃកំណើត', 'អាសយដ្ឋាន', 'ទីតាំង', 'មធ្យោបាយ', 'អ្នកទំនាក់ទំនង',
      'ឪពុក', 'ម្តាយ', 'លេខទូរស័ព្ទ'
    ]);

    let studentIndex = 1;
    for (const s of studentsData || []) {
      studentValues.push([
        studentIndex++,
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
        s.paymentStatus || '',
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
      ]);
    }

    // 2. Process Payments Tab
    const paymentSheetInfo = await getOrCreateSheet('ការបង់ប្រាក់', ['Payments', 'បង់ប្រាក់']);
    const paymentValues: any[][] = [];
    paymentValues.push([
      'ល.រ', 'អត្តលេខសិស្ស', 'ឈ្មោះសិស្ស', 'ថ្ងៃបង់ប្រាក់', 'ចំនួនទឹកប្រាក់', 'ប្រភេទ', 'អ្នកទទួល', 'ចំណាំ'
    ]);

    let paymentIndex = 1;
    for (const p of paymentsData || []) {
      const student = (studentsData || []).find((s:any) => s.id === p.studentId);
      paymentValues.push([
        paymentIndex++,
        student?.studentId || '',
        student?.fullName || '',
        p.paymentDate || '',
        p.amount || '',
        p.type || '',
        p.receiver || '',
        p.note || ''
      ]);
    }

    // Write to sheets
    try {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${studentSheetInfo.title}'!A:V` });
    } catch(e) {}
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${studentSheetInfo.title}'!A1:V`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: studentValues }
    });

    if (studentSheetInfo.title !== paymentSheetInfo.title) {
      try {
        await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${paymentSheetInfo.title}'!A:H` });
      } catch(e) {}
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${paymentSheetInfo.title}'!A1:H`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: paymentValues }
      });
    }

    // Format headers
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId: studentSheetInfo.sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.1, green: 0.5, blue: 0.3 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            },
            ...(studentSheetInfo.title !== paymentSheetInfo.title ? [{
              repeatCell: {
                range: { sheetId: paymentSheetInfo.sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.8, green: 0.4, blue: 0.1 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            }] : [])
          ]
        }
      });
    } catch(e) {}

    return NextResponse.json({ success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
