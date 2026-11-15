import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      spreadsheetId,
      dueSheetName = 'សិស្សដល់ថ្ងៃនិងលើសថ្ងៃ',
      paidSheetName = 'សិស្សបង់រួច',
      dueRows = [],
      paidRows = [],
    } = data;

    if (!process.env.GOOGLE_CREDENTIALS_JSON) {
      return NextResponse.json(
        { error: 'Missing Google credentials in environment variables.' },
        { status: 500 }
      );
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Missing spreadsheet ID.' }, { status: 400 });
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    let existingSheets: any[] = [];
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
      existingSheets = spreadsheetInfo.data.sheets || [];
    } catch (e: any) {
      if (e.code === 403 || e.status === 403) {
        return NextResponse.json(
          {
            error: `Permission Denied! សូម Share Google Sheet របស់អ្នកជា Editor ទៅកាន់: ${
              credentials.client_email || 'service account'
            }`,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'រកមិនឃើញ Google Sheet ទេ។ សូមពិនិត្យ Link ឬ Spreadsheet ID ម្តងទៀត!' },
        { status: 400 }
      );
    }

    async function getOrCreateSheet(title: string) {
      const cleanTitle = (title || '').trim();
      const found = existingSheets.find((s) => s.properties?.title === cleanTitle);
      if (found) {
        return {
          sheetId: found.properties?.sheetId ?? 0,
          title: found.properties?.title || cleanTitle,
        };
      }

      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: cleanTitle } } }],
        },
      });
      const newSheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
      const created = { sheetId: newSheetId, title: cleanTitle };
      existingSheets.push({ properties: { sheetId: newSheetId, title: cleanTitle } });
      return created;
    }

    const dueHeaders = [
      'លេខរៀង',
      'អត្តលេខសិស្ស',
      'ឈ្មោះសិស្ស',
      'ភេទ',
      'វេនសិក្សា',
      'វគ្គ',
      'ចំនួនខែដែលត្រូវបង់ឬលើស',
      'ថ្ងៃខែឆ្នាំត្រូវបង់ប្រាក់',
      'ចំនួនប្រាក់ត្រូវបង់',
      'ចំនួនថ្ងៃដែលលើស',
      'លេខបន្ទប់និងឈ្មោះគ្រូបង្រៀន',
    ];

    const paidHeaders = [
      'លេខវិក្កយបត្រ',
      'អត្តលេខសិស្ស',
      'ឈ្មោះសិស្ស',
      'ភេទ',
      'វេនសិក្សា',
      'វគ្គសិក្សា',
      'ថ្ងៃខួបចូលរៀន',
      'ថ្ងៃខែ ឆ្នាំ បង់ប្រាក់ បន្ទាប់',
      'សុពលភាពនៃការរៀន',
      'លេខបន្ទប់និងឈ្មោះគ្រូបង្រៀន',
    ];

    const dueSheetInfo = await getOrCreateSheet(dueSheetName);
    const paidSheetInfo = await getOrCreateSheet(paidSheetName);

    const dueValues = [dueHeaders, ...(Array.isArray(dueRows) ? dueRows : [])];
    const paidValues = [paidHeaders, ...(Array.isArray(paidRows) ? paidRows : [])];

    const targets = [
      {
        info: dueSheetInfo,
        clearRange: `'${dueSheetInfo.title}'!A:K`,
        writeRange: `'${dueSheetInfo.title}'!A1:K${dueValues.length}`,
        values: dueValues,
        headerColor: { red: 0.82, green: 0.24, blue: 0.22 },
      },
      {
        info: paidSheetInfo,
        clearRange: `'${paidSheetInfo.title}'!A:J`,
        writeRange: `'${paidSheetInfo.title}'!A1:J${paidValues.length}`,
        values: paidValues,
        headerColor: { red: 0.06, green: 0.55, blue: 0.41 },
      },
    ];

    const formatRequests: any[] = [];

    for (const target of targets) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: target.clearRange,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: target.writeRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: target.values },
      });

      formatRequests.push(
        {
          repeatCell: {
            range: { sheetId: target.info.sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: target.headerColor,
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields:
              'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId: target.info.sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        }
      );
    }

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: formatRequests },
      });
    } catch (e) {
      console.warn('Header formatting skipped:', e);
    }

    return NextResponse.json({
      success: true,
      dueCount: dueRows.length,
      paidCount: paidRows.length,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    });
  } catch (error: any) {
    console.error('Google Sheets Payment Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
