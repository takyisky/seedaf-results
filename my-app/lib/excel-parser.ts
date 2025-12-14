import * as XLSX from 'xlsx';
import type { ResultEntry } from '@/types';

export function parseExcelFile(buffer: ArrayBuffer): ResultEntry[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });
  const jsonData = rawData as unknown[][];

  if (jsonData.length < 2) {
    throw new Error('Excel file must have at least a header row and one data row');
  }

  // First row is the header (column names)
  const headers = jsonData[0] as string[];
  const results: ResultEntry[] = [];

  // Process remaining rows as data
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[];
    if (!row || row.length === 0 || row.every(cell => cell === '')) {
      continue; // Skip empty rows
    }

    const entry: ResultEntry = {
      position: i,
      name: '',
    };

    // Map each column to its header
    headers.forEach((header, index) => {
      const value = row[index];
      const headerLower = String(header).toLowerCase().trim();

      if (headerLower === 'position' || headerLower === 'pos' || headerLower === '#') {
        entry.position = Number(value) || i;
      } else if (headerLower === 'name' || headerLower === 'rider' || headerLower === 'athlete') {
        entry.name = String(value || '');
      } else if (headerLower === 'time' || headerLower === 'finish time') {
        entry.time = String(value || '');
      } else if (headerLower === 'team') {
        entry.team = String(value || '');
      } else if (headerLower === 'category' || headerLower === 'cat') {
        entry.category = String(value || '');
      } else if (header && value !== undefined && value !== '') {
        // Store any other columns dynamically
        entry[String(header)] = String(value);
      }
    });

    // Only add if we have at least a name
    if (entry.name) {
      results.push(entry);
    }
  }

  return results;
}

export function parseGoogleSheetData(data: unknown[][]): ResultEntry[] {
  if (!data || data.length < 2) {
    throw new Error('Google Sheet must have at least a header row and one data row');
  }

  const headers = data[0] as string[];
  const results: ResultEntry[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || row.every(cell => cell === '' || cell === null)) {
      continue;
    }

    const entry: ResultEntry = {
      position: i,
      name: '',
    };

    headers.forEach((header, index) => {
      const value = row[index];
      const headerLower = String(header).toLowerCase().trim();

      if (headerLower === 'position' || headerLower === 'pos' || headerLower === '#') {
        entry.position = Number(value) || i;
      } else if (headerLower === 'name' || headerLower === 'rider' || headerLower === 'athlete') {
        entry.name = String(value || '');
      } else if (headerLower === 'time' || headerLower === 'finish time') {
        entry.time = String(value || '');
      } else if (headerLower === 'team') {
        entry.team = String(value || '');
      } else if (headerLower === 'category' || headerLower === 'cat') {
        entry.category = String(value || '');
      } else if (header && value !== undefined && value !== '') {
        entry[String(header)] = String(value);
      }
    });

    if (entry.name) {
      results.push(entry);
    }
  }

  return results;
}

export function extractGoogleSheetId(url: string): string | null {
  // Extract sheet ID from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
