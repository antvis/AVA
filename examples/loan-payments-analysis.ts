/**
 * Loan Payments Dataset Analysis Example
 * 
 * This example demonstrates analyzing a loan payments dataset:
 * 1. Loading the loans_payments.csv file
 * 2. Analyzing loan status and payment patterns
 * 3. Exploring customer demographics
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
    // Load loan payments data from CSV
    await ava.loadCSV('../data/loans_payments.csv');
    console.log('✓ Loan payments data loaded successfully\n');

    // Example 1: Loan status distribution
    console.log('Query 1: What is the distribution of loan status?');
    const response1 = await ava.analysis('What is the distribution of loan status?');
    console.log('Response:', response1);
    console.log('\n---\n');

    // Example 2: Average loan amount by education
    console.log('Query 2: What is the average principal by education level?');
    const response2 = await ava.analysis('What is the average principal by education level?');
    console.log('Response:', response2);
    console.log('\n---\n');

    // Example 3: Gender analysis
    console.log('Query 3: How many loans by gender?');
    const response3 = await ava.analysis('How many loans by gender?');
    console.log('Response:', response3);
    console.log('\n---\n');

    // Example 4: Age analysis
    console.log('Query 4: What is the average age of borrowers?');
    const response4 = await ava.analysis('What is the average age of borrowers?');
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
