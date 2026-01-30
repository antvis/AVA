/**
 * Data module for loading and processing data
 */

import * as fs from 'fs';

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { FieldMetadata, DatasetInfo, LLMConfig } from '../types';

/**
 * Load CSV file and parse it into structured data
 */
export async function loadCSV(filePath: string): Promise<any[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false,
  });
  
  return records;
}

/**
 * Load data from JSON object array
 * @param data - Array of objects to be analyzed
 * @returns Promise resolving to the validated data array
 * @throws Error if data is not an array or contains non-object items
 * @example
 * ```typescript
 * const data = [
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 25 }
 * ];
 * const result = await loadObject(data);
 * ```
 */
export async function loadObject(data: any[]): Promise<any[]> {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  if (data.length === 0) {
    return [];
  }
  
  // Validate that all items are plain objects (not arrays or null)
  if (!data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    throw new Error('All items in the array must be plain objects');
  }
  
  return data;
}

/**
 * Load data from URL
 * @param url - URL to fetch data from
 * @param transform - Optional function to transform the response data
 * @returns Promise resolving to the data array
 * @throws Error if fetch fails, response is not JSON, or transform doesn't return an array
 * @example
 * ```typescript
 * // Simple usage
 * const data = await loadURL('https://api.example.com/data');
 * 
 * // With transform function
 * const data = await loadURL('https://api.example.com/users', 
 *   (response) => response.users.map(u => ({ name: u.name, age: u.age }))
 * );
 * ```
 */
export async function loadURL(
  url: string, 
  transform?: (response: any) => any[]
): Promise<any[]> {
  let response;
  let data;
  
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Failed to fetch from URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }
  
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Response is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  
  // Apply transform function if provided, otherwise use data directly
  const result = transform ? transform(data) : data;
  
  // Ensure result is an array
  if (!Array.isArray(result)) {
    throw new Error('Result must be an array. Use transform function to extract array from response.');
  }
  
  return result;
}

/**
 * Extract structured data from text using LLM
 * @param text - Text to extract structured data from
 * @param llmConfig - LLM configuration for data extraction
 * @returns Promise resolving to extracted structured data as array of objects
 * @throws Error if LLM fails to extract data or returns invalid JSON
 * @example
 * ```typescript
 * const llmConfig = { model: 'gpt-4', apiKey: 'key', baseURL: 'url' };
 * const data = await loadText('Beijing 100, Shanghai 200, Hangzhou 300', llmConfig);
 * // Returns: [{ city: 'Beijing', value: 100 }, ...]
 * ```
 */
export async function loadText(text: string, llmConfig: LLMConfig): Promise<any[]> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a data extraction assistant. Extract structured data from the following text and return it as a JSON array of objects.

The text may contain data in various formats (comma-separated, space-separated, tabular, etc.). Your task is to:
1. Identify the structure and pattern in the data
2. Extract all data points
3. Return a JSON array where each element is an object with appropriate key-value pairs
4. Ensure all objects have the same keys (columns)
5. Use meaningful key names based on the context

Text to analyze:
${text}

Return ONLY the JSON array, no additional text or explanation. The response must be valid JSON that can be parsed directly.`;

  const { text: responseText } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Try parsing the entire response first
  try {
    const data = JSON.parse(responseText);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // If direct parsing fails, try to extract JSON array from response
  }

  // Extract JSON array using non-greedy regex
  const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON array from LLM response');
  }
  
  try {
    const data = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(data)) {
      throw new Error('LLM did not return an array');
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to parse extracted JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Infer field type from sample values
 */
function inferFieldType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v != null && v !== '');
  
  if (nonNullValues.length === 0) return 'string';
  
  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => typeof v === 'number' || !Number.isNaN(Number(v)));
  if (allNumbers) return 'number';
  
  // Check if all values are booleans
  const allBooleans = nonNullValues.every(v => 
    typeof v === 'boolean' || 
    v === 'true' || 
    v === 'false' ||
    v === 'TRUE' ||
    v === 'FALSE'
  );
  if (allBooleans) return 'boolean';
  
  // Check if values look like dates
  const allDates = nonNullValues.every(v => {
    if (typeof v === 'string') {
      const date = new Date(v);
      return !Number.isNaN(date.getTime());
    }
    return false;
  });
  if (allDates) return 'date';
  
  return 'string';
}

/**
 * Extract metadata from data
 */
export function extractMetadata(data: any[]): DatasetInfo {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      fields: [],
      sizeInBytes: 0,
    };
  }
  
  const fields: FieldMetadata[] = [];
  const columns = Object.keys(data[0]);
  
  for (const col of columns) {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v != null && v !== '');
    const uniqueValues = new Set(values);
    
    fields.push({
      name: col,
      type: inferFieldType(values),
      samples: nonNullValues.slice(0, 5),
      uniqueCount: uniqueValues.size,
      nullCount: values.length - nonNullValues.length,
    });
  }
  
  // Estimate size in bytes
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf-8');
  
  return {
    rowCount: data.length,
    columnCount: columns.length,
    fields,
    sizeInBytes,
  };
}

/**
 * Format dataset info as a string for LLM context
 */
export function formatDatasetInfo(info: DatasetInfo): string {
  let result = 'Dataset Info:\n';
  result += `- Rows: ${info.rowCount}\n`;
  result += `- Columns: ${info.columnCount}\n`;
  result += `- Size: ${(info.sizeInBytes / 1024).toFixed(2)} KB\n`;
  result += '\nFields:\n';
  
  for (const field of info.fields) {
    result += `- ${field.name} (${field.type}): `;
    result += `${field.uniqueCount} unique values`;
    if (field.nullCount > 0) {
      result += `, ${field.nullCount} nulls`;
    }
    if (field.samples && field.samples.length > 0) {
      result += `\n  Sample values: ${field.samples.slice(0, 3).join(', ')}`;
    }
    result += '\n';
  }
  
  return result;
}
