/**
 * URL data loading functionality
 */

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
