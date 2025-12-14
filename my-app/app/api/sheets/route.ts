import { NextRequest, NextResponse } from 'next/server';
import { extractGoogleSheetId, parseGoogleSheetData } from '@/lib/excel-parser';
import { verifyAdminSession } from '@/lib/auth';

// Fetch data from Google Sheets (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Google Sheets URL is required' }, { status: 400 });
    }

    const sheetId = extractGoogleSheetId(url);
    if (!sheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    // Fetch sheet data using Google Sheets API v4
    // The sheet must be published to the web or shared publicly
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey || apiKey === 'your_google_api_key_here') {
      // Fallback: Try to fetch as CSV (requires sheet to be published)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch Google Sheet. Make sure it is published to the web.' },
          { status: 400 }
        );
      }

      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => {
        // Parse CSV properly handling quoted values
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of row) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      });

      const results = parseGoogleSheetData(rows);
      return NextResponse.json({ results });
    }

    // Use Google Sheets API
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${apiKey}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Sheets API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Google Sheet. Check if the sheet is accessible.' },
        { status: 400 }
      );
    }

    const data = await response.json();
    const results = parseGoogleSheetData(data.values || []);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return NextResponse.json({ error: 'Failed to process Google Sheet' }, { status: 500 });
  }
}
