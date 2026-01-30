/**
 * JSON/Object data loading functionality
 */

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
