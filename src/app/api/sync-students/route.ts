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

    // Ensure the spreadsheet exists and we can access it
    let targetSheetId = 0;
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetData = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === 'Students' || s.properties?.title === 'សិស្ស');
      if (sheetData && sheetData.properties?.sheetId !== undefined && sheetData.properties?.sheetId !== null) {
        targetSheetId = sheetData.properties.sheetId || 0;
      } else {
        // Fallback to first sheet if "Students" or "សិស្ស" is not found
        const firstSheet = spreadsheetInfo.data.sheets?.[0];
        if (firstSheet && firstSheet.properties?.sheetId !== undefined) {
           targetSheetId = firstSheet.properties.sheetId || 0;
        }
      }
    } catch (e: any) {
      if (e.code === 403 || e.status === 403) {
        return NextResponse.json({ error: 'Permission Denied! Please share your Google Sheet with: bsis-936@high-magpie-503702-t0.iam.gserviceaccount.com (Set as Editor)' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Could not find the Google Sheet. Please check the Link or ID.' }, { status: 400 });
    }

    // Determine target tab name based on what we matched
    let targetTabName = 'Students';
    try {
       const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
       const matchedSheet = spreadsheetInfo.data.sheets?.find(s => s.properties?.sheetId === targetSheetId);
       if (matchedSheet && matchedSheet.properties?.title) {
           targetTabName = matchedSheet.properties.title;
       }
    } catch(e) {}

    // Prepare data
    const values: any[][] = [];
    
    // Header Row
    values.push([
      'ល.រ', 'អត្តលេខ', 'ឈ្មោះពេញ', 'ឈ្មោះអង់គ្លេស', 'ភេទ',
      'កម្រិតសិក្សា', 'វេន', 'ថ្នាក់', 'ថ្ងៃចូលរៀន', 'ថ្លៃសិក្សា',
      'ថ្ងៃបង់បន្ទាប់', 'ស្ថានភាពបង់ប្រាក់', 'ស្ថានភាព', 'ឈ្មោះគ្រូ',
      'ថ្ងៃកំណើត', 'អាសយដ្ឋាន', 'ទីតាំង', 'មធ្យោបាយ', 'អ្នកទំនាក់ទំនង',
      'ឪពុក', 'ម្តាយ', 'លេខទូរស័ព្ទ'
    ]);

    let globalIndex = 1;

    for (const s of studentsData) {
      values.push([
        globalIndex++,
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

    // Clear existing data in target tab first
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${targetTabName}'!A:V`,
      });
    } catch(e) {
      // Ignore if sheet is empty or error
    }

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${targetTabName}'!A1:V`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });

    // Format the header row
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: targetSheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 22
                }
              }
            },
            {
              repeatCell: {
                range: {
                  sheetId: targetSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.1, green: 0.5, blue: 0.3 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            }
          ]
        }
      });
    } catch(e) {
      // Ignore formatting errors if they occur
    }

    return NextResponse.json({ success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
