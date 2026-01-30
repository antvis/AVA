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
 */
export async function loadObject(data: any[]): Promise<any[]> {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  if (data.length === 0) {
    return [];
  }
  
  // Validate that all items are objects
  if (!data.every(item => typeof item === 'object' && item !== null)) {
    throw new Error('All items in the array must be objects');
  }
  
  return data;
}

/**
 * Load data from URL
 */
export async function loadURL(
  url: string, 
  transform?: (response: any) => any[]
): Promise<any[]> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Apply transform function if provided, otherwise use data directly
    const result = transform ? transform(data) : data;
    
    // Ensure result is an array
    if (!Array.isArray(result)) {
      throw new Error('Transform function must return an array');
    }
    
    return result;
  } catch (error) {
    throw new Error(
      `Failed to load data from URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract structured data from text using LLM
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

  try {
    // Extract JSON from response (handle cases where LLM adds extra text)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON array from LLM response');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(data)) {
      throw new Error('LLM did not return an array');
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to parse structured data from text: ${error instanceof Error ? error.message : String(error)}`
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
