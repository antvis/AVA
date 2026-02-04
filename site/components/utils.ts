import type { LLMConfig } from '@antv/ava';

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

// RFC 4180 compliant CSV parser for browser
import type { DataRow } from './types';

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
