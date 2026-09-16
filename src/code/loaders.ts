/**
 * Data loaders: parse csv / object / url / text inputs into in-memory object arrays
 */

// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * Load CSV file and parse it into structured data
 * @param filePathOrContent - In Node.js: path to CSV file. In browser: CSV content string
 * @returns Promise resolving to array of objects where each object represents a CSV row
 * @throws Error if file cannot be read or CSV parsing fails
 * @example
 * ```typescript
 * // Node.js
 * const data = await loadCSV('./data/companies.csv');
 *
 * // Browser
 * const file = document.querySelector('input[type="file"]').files[0];
 * const content = await file.text();
 * const data = await loadCSV(content);
 * // Returns: [{ company: 'A', region: 'East', revenue: 100 }, ...]
 * ```
 */
export async function loadCSV(filePathOrContent: string): Promise<any[]> {
  let content: string;

  // Check if running in Node.js environment and input looks like a file path
  // Path patterns: starts with ./ ../ / drive letter (Windows) or UNC path
  const looksLikeFilePath = /^(\.\/|\.\.\/|\/|[a-zA-Z]:[\\/]|\\\\)/.test(filePathOrContent);

  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node && looksLikeFilePath) {
    // Node.js: read from file system
    const fs = await import('fs/promises');
    content = await fs.readFile(filePathOrContent, 'utf-8');
  } else {
    // Browser or content string: use as-is
    content = filePathOrContent;
  }

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
