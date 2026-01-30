/**
 * JSON Object Analysis Example
 * 
 * This example demonstrates loading data directly from a JSON object array:
 * 1. Loading data using loadObject()
 * 2. Analyzing the data with natural language queries
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
    // Prepare data as JSON object array
    const data = [
      { city: '杭州', population: 1220, gdp: 18753 },
      { city: '上海', population: 2489, gdp: 43214 },
      { city: '北京', population: 2189, gdp: 40269 },
      { city: '深圳', population: 1768, gdp: 32387 },
      { city: '广州', population: 1868, gdp: 28839 },
    ];

    // Load data from JSON object
    await ava.loadObject(data);
    console.log('✓ Data loaded successfully from JSON object\n');

    // Example 1: Find city with highest GDP
    console.log('Query 1: Which city has the highest GDP?');
    const response1 = await ava.analysis('Which city has the highest GDP?');
    console.log('Response:', response1);
    console.log('\n---\n');

    // Example 2: Calculate average population
    console.log('Query 2: What is the average population of these cities?');
    const response2 = await ava.analysis('What is the average population of these cities?');
    console.log('Response:', response2);
    console.log('\n---\n');

    // Example 3: Sort by GDP per capita
    console.log('Query 3: Sort cities by GDP per capita (GDP/population)');
    const response3 = await ava.analysis('Sort cities by GDP per capita, calculated as GDP divided by population');
    console.log('Response:', response3);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
