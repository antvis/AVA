import type { LLMConfig } from '@antv/ava';
import * as XLSX from 'xlsx';

// Default LLM config
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'ling-1t',
  apiKey: '',
  baseURL: 'https://api.tbox.cn/api/llm/v1',
};

// Load LLM config from localStorage
export const loadLLMConfig = (): LLMConfig => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return DEFAULT_LLM_CONFIG;
  }

  try {
    const saved = localStorage.getItem('ava-llm-config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load LLM config:', e);
  }
  return DEFAULT_LLM_CONFIG;
};

// Save LLM config to localStorage
export const saveLLMConfig = (config: LLMConfig) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ava-llm-config', JSON.stringify(config));
  }
};

// Application state persistence
import type { DataRow } from './types';
import type { AnalysisResponse } from '@antv/ava';

export interface AppState {
  data: DataRow[];
  textInput: string;
  query: string;
  analysisResult: AnalysisResponse | null;
}

// Load application state from localStorage
export const loadAppState = (): Partial<AppState> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const saved = localStorage.getItem('ava-app-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate basic structure to prevent security issues
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          data: Array.isArray(parsed.data) ? parsed.data : undefined,
          textInput: typeof parsed.textInput === 'string' ? parsed.textInput : undefined,
          query: typeof parsed.query === 'string' ? parsed.query : undefined,
          analysisResult: parsed.analysisResult || undefined,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load app state:', e);
  }
  return {};
};

// Maximum size for serialized data in localStorage (bytes)
// localStorage has a ~5MB total quota; reserve most of it for other keys
const MAX_DATA_SERIALIZED_SIZE = 3 * 1024 * 1024; // 3MB

// Save application state to localStorage
// Large datasets are not persisted here — they are already stored in
// IndexedDB via the AVA instance, so duplicating them in localStorage
// would exceed its quota and cause QuotaExceededError.
export const saveAppState = (state: Partial<AppState>) => {
  if (typeof window === 'undefined') return;
  try {
    const currentState = loadAppState();
    const newState = { ...currentState, ...state };

    // Skip persisting data if it exceeds the size limit
    const dataToStore: Partial<AppState> = { ...newState };
    if (dataToStore.data && dataToStore.data.length > 50) {
      // Estimate the serialized size by sampling the first 50 rows
      // instead of serializing the entire dataset, which could be
      // expensive in CPU and memory for large arrays.
      const sampleLength = JSON.stringify(dataToStore.data.slice(0, 50)).length;
      const estimatedTotalSize = (sampleLength / 50) * dataToStore.data.length;
      if (estimatedTotalSize > MAX_DATA_SERIALIZED_SIZE) {
        delete dataToStore.data;
      }
    }

    localStorage.setItem('ava-app-state', JSON.stringify(dataToStore));
  } catch (e) {
    console.error('Failed to save app state:', e);
  }
};

// Parse Excel file (.xlsx, .xls) to DataRow array
export const parseExcel = (arrayBuffer: ArrayBuffer): DataRow[] => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

  if (jsonData.length < 2) return [];

  const headers = (jsonData[0] as any[]).map((h) => (h !== null && h !== undefined ? String(h).trim() : ''));
  const result: DataRow[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rowData: DataRow = {};
    headers.forEach((header, index) => {
      const val = row[index];
      if (val === undefined || val === null) {
        rowData[header] = '';
      } else if (typeof val === 'number') {
        rowData[header] = val;
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

// RFC 4180 compliant CSV parser for browser
export const parseCSV = (csvContent: string): DataRow[] => {
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

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
  const data: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map(v => v.replace(/^["']|["']$/g, ''));
    if (values.length === headers.length) {
      const row: DataRow = {};
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
