/**
 * Companies Dataset Analysis Example
 * 
 * This example demonstrates analyzing a companies dataset:
 * 1. Loading the companies.csv file
 * 2. Analyzing revenue and company metrics by region
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
    // Load data from CSV
    await ava.loadCSV('../data/companies.csv');
    console.log('✓ Data loaded successfully\n');

    // Example 1: Simple aggregation
    console.log('Query 1: What is the max revenue by region?');
    const response1 = await ava.analysis('What is the max revenue by region?');
    console.log('Response:', response1.text);
    console.log('\n---\n');

    // Example 2: Average calculation
    console.log('Query 2: What is the average revenue by region?');
    const response2 = await ava.analysis('What is the average revenue by region?');
    console.log('Response:', response2.text);
    console.log('\n---\n');

    // Example 3: Sorting
    console.log('Query 3: Show top 5 companies by revenue');
    const response3 = await ava.analysis('Show top 5 companies by revenue');
    console.log('Response:', response3.text);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
