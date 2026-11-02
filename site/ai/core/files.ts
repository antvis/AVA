import { readSheet } from 'read-excel-file/browser';
import type { AIDataset } from './types';

const excelDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatExcelDate = (value: Date): string => {
  const parts = excelDateFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
};

// Parse Excel worksheets into data records.
export const parseExcel = async (arrayBuffer: ArrayBuffer): Promise<AIDataset['rows']> => {
  const jsonData = await readSheet(arrayBuffer);

  if (jsonData.length < 2) return [];

  const headers = (jsonData[0] as any[]).map((h) => (h !== null && h !== undefined ? String(h).trim() : ''));
  const result: AIDataset['rows'] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rowData: AIDataset['rows'][number] = {};
    headers.forEach((header, index) => {
      const val = row[index];
      if (val === undefined || val === null) {
        rowData[header] = '';
      } else if (typeof val === 'number') {
        rowData[header] = val;
      } else if (typeof val === 'boolean') {
        rowData[header] = val;
      } else if (val instanceof Date) {
        rowData[header] = formatExcelDate(val);
      } else {
        const strVal = String(val).trim();
        const num = Number(strVal);
        rowData[header] = !isNaN(num) && strVal !== '' ? num : strVal;
      }
    });
    result.push(rowData);
  }

  return result;
};

// Parse CSV rows, preserving the existing upload behavior.
export const parseCSV = (csvContent: string): AIDataset['rows'] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse a CSV line handling quoted values with commas
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, ''));
  const data: AIDataset['rows'] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map((v) => v.replace(/^["']|["']$/g, ''));
    if (values.length === headers.length) {
      const row: AIDataset['rows'][number] = {};
      headers.forEach((header, index) => {
        const val = values[index];
        // Try to convert to number
        const num = Number(val);
        row[header] = !isNaN(num) && val !== '' ? num : val;
      });
      data.push(row);
    }
  }

  return data;
};
