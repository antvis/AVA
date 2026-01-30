/**
 * Heart Disease Dataset Analysis Example
 * 
 * This example demonstrates analyzing a heart disease dataset:
 * 1. Loading the heart.csv file
 * 2. Analyzing patient demographics and health metrics
 * 3. Exploring heart disease patterns
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
    // Load heart disease data from CSV
    await ava.loadCSV('../data/heart.csv');
    console.log('✓ Heart disease data loaded successfully\n');

    // Example 1: Age analysis
    console.log('Query 1: What is the average age of patients?');
    const response1 = await ava.analysis('What is the average age of patients?');
    console.log('Response:', response1);
    console.log('\n---\n');

    // Example 2: Gender distribution
    console.log('Query 2: How many patients with heart disease by gender?');
    const response2 = await ava.analysis('How many patients with heart disease by gender?');
    console.log('Response:', response2);
    console.log('\n---\n');

    // Example 3: Disease prevalence
    console.log('Query 3: What percentage of patients have heart disease?');
    const response3 = await ava.analysis('What percentage of patients have heart disease?');
    console.log('Response:', response3);
    console.log('\n---\n');

    // Example 4: Cholesterol analysis
    console.log('Query 4: What is the average cholesterol level for patients with heart disease?');
    const response4 = await ava.analysis('What is the average cholesterol level for patients with heart disease?');
    console.log('Response:', response4);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
