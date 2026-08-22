import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { spreadsheetId, classesData, selectedMonth, monthExtra } = data;

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
      const sheetData = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === 'All Sheets');
      if (sheetData && sheetData.properties?.sheetId !== undefined && sheetData.properties?.sheetId !== null) {
        targetSheetId = sheetData.properties.sheetId || 0;
      }
    } catch (e: any) {
      if (e.code === 403 || e.status === 403) {
        return NextResponse.json({ error: 'Permission Denied! Please share your Google Sheet with: bsis-936@high-magpie-503702-t0.iam.gserviceaccount.com (Set as Editor)' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Could not find the Google Sheet. Please check the Link or ID.' }, { status: 400 });
    }

    // Prepare data
    const values: any[][] = [];
    
    // Header Row
    values.push([
      'ល.រ',
      'អត្តលេខ',
      'គោត្តនាម នឹងនាម',
      'ភេទ',
      'Quiz',
      'Exercise',
      'Speaking',
      'Homework',
      'Test',
      'សរុប',
      'មធ្យមភាគ',
      'ចំណាត់ថ្នាក់',
      'និទ្ទេស',
      'មូលវិចារណ៍',
      'លេខកូដថ្នាក់',
      'គ្រូបង្រៀន',
      'វេន',
      'វេនFull',
      'Eng_វេនFull',
      'ឈ្មោះសៀវភៅ',
      'English Name',
      'Level',
      'Eng_Gender',
      'Eng មូលវិចារណ៍',
      'Eng_Teacher Name',
      'Photo Link',
      'ឈ្មោះខែ',
      'Eng_ឈ្មោះខែ',
      'ថ្ងៃចេញ',
      'Eng_ថ្ងៃចេញ'
    ]);

    let globalIndex = 1;

    // Loop through all classes and their students
    for (const classItem of classesData) {
      const className = classItem.classInfo.classCode || '';
      const teacherName = classItem.classInfo.teacherName || '';

      if (classItem.scores && classItem.scores.length > 0) {
        classItem.scores.forEach((s: any) => {
          const isFirstRow = globalIndex === 1;
          values.push([
            globalIndex++,
            s.studentIdCode || '',
            s.fullName || (s.firstName + ' ' + s.lastName),
            s.gender || '',
            s.quiz || '',
            s.exercise || '',
            s.speaking || '',
            s.homework || '',
            s.test || '',
            s.totalScore || '',
            s.average || '',
            s.rank || '',
            s.grade || '',
            s.remarks || '',
            className,
            teacherName,
            s.shift || '',
            s.shiftFull || '',
            s.engShiftFull || '',
            s.bookName || '',
            s.englishName || '',
            s.level || '',
            s.engGender || '',
            s.engRemarks || '',
            s.engTeacherName || '',
            s.photo ? (s.photo.startsWith('http') ? s.photo : `https://drive.google.com/uc?export=view&id=${s.photo}`) : (s.photoLink || ''),
            isFirstRow ? (monthExtra?.monthKhmer || '') : '',
            isFirstRow ? (monthExtra?.monthEnglish || '') : '',
            isFirstRow ? (monthExtra?.issueDateKhmer || '') : '',
            isFirstRow ? (monthExtra?.issueDateEnglish || '') : ''
          ]);
        });
      }
    }

    // Spacer
    values.push([]);
    values.push([]);
    values.push(['របាយការណ៍ខែ៖', monthExtra?.monthKhmer || selectedMonth]);
    values.push(['ថ្ងៃខែឆ្នាំបញ្ចេញរបាយការណ៍៖', monthExtra?.issueDateKhmer || new Date().toLocaleDateString('km-KH')]);

    // Clear entire sheet first to avoid leftover columns and rows from previous syncs
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "'All Sheets'",
      });
    } catch(e) {
      try {
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: "'All Sheets'!A:ZZ",
        });
      } catch(e2) {}
    }

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'All Sheets'!A1",
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
                  endIndex: 30
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
                    backgroundColor: { red: 0.2, green: 0.2, blue: 0.5 },
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
