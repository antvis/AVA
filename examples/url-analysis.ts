/**
 * URL Data Analysis Example
 * 
 * This example demonstrates loading data from a URL:
 * 1. Fetching data from a remote endpoint
 * 2. Using a transform function to extract the relevant data
 * 3. Analyzing the data
 */

import { AVA } from '../src';

async function main() {
  // Initialize AVA with LLM configuration
  const ava = new AVA({
    llm: {
      model: 'ling-1t',
      apiKey: process.env.API_KEY || 'YOUR_API_KEY',
      baseURL: 'https://api.tbox.cn/api/llm/v1',
    },
  });

  try {
    // Example 1: Load data from a public API without transform
    // This example uses a JSON placeholder API (replace with your actual API)
    const apiUrl = 'https://jsonplaceholder.typicode.com/users';
    
    await ava.loadURL(apiUrl);
    console.log('✓ Data loaded successfully from URL\n');

    // Query the data
    console.log('Query: How many users are there and what are their cities?');
    const response1 = await ava.analysis('How many users are there and what are their cities?');
    console.log('Response:', response1);
    console.log('\n---\n');

    // Example 2: Load data with transform function
    // Create a new AVA instance for the second example
    const ava2 = new AVA({
      llm: {
        model: 'ling-1t',
        apiKey: process.env.API_KEY || 'YOUR_API_KEY',
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      },
    });

    // Transform function to extract and reshape data
    await ava2.loadURL(apiUrl, (response) => {
      // Extract only the fields we need
      return response.map((user: any) => ({
        name: user.name,
        email: user.email,
        city: user.address?.city,
        company: user.company?.name,
      }));
    });
    
    console.log('✓ Data loaded and transformed from URL\n');

    console.log('Query: List all companies');
    const response2 = await ava2.analysis('List all unique companies');
    console.log('Response:', response2);

    // Clean up second instance
    ava2.dispose();
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
