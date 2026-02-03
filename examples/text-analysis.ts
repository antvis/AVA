/**
 * Text Data Analysis Example
 * 
 * This example demonstrates extracting structured data from unstructured text:
 * 1. Using loadText() to extract structured data using AI
 * 2. Analyzing the extracted data
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
    // Example 1: Simple comma-separated data
    console.log('Example 1: Extracting data from simple text\n');
    
    const text1 = '杭州 100，上海 200，北京 300';
    await ava.loadText(text1);
    console.log('✓ Data extracted from text:', text1, '\n');

    console.log('Query: What is the total?');
    const response1 = await ava.analysis('What is the sum of all values?');
    console.log('Response:', response1.text);
    console.log('\n---\n');

    // Example 2: More complex text with multiple fields
    const ava2 = new AVA({
      llm: {
        model: 'ling-1t',
        apiKey: process.env.API_KEY || 'YOUR_API_KEY',
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      },
    });

    console.log('Example 2: Extracting data from narrative text\n');
    
    const text2 = `
      公司销售报告：
      第一季度，华东区销售额 1500 万，完成率 95%
      第二季度，华东区销售额 1800 万，完成率 102%
      第一季度，华南区销售额 1200 万，完成率 88%
      第二季度，华南区销售额 1600 万，完成率 98%
    `;
    
    await ava2.loadText(text2);
    console.log('✓ Data extracted from narrative text\n');

    console.log('Query: Which region and quarter had the best completion rate?');
    const response2 = await ava2.analysis('Which region and quarter had the best completion rate?');
    console.log('Response:', response2.text);
    console.log('\n---\n');

    // Example 3: Tabular text
    const ava3 = new AVA({
      llm: {
        model: 'ling-1t',
        apiKey: process.env.API_KEY || 'YOUR_API_KEY',
        baseURL: 'https://api.tbox.cn/api/llm/v1',
      },
    });

    console.log('Example 3: Extracting data from tabular text\n');
    
    const text3 = `
      Product    Price   Stock
      Laptop     5999    50
      Phone      3999    120
      Tablet     2999    80
      Watch      1999    200
    `;
    
    await ava3.loadText(text3);
    console.log('✓ Data extracted from tabular text\n');

    console.log('Query: What is the total value of all inventory?');
    const response3 = await ava3.analysis('Calculate the total inventory value (price times stock for each product)');
    console.log('Response:', response3.text);

    // Clean up additional instances
    ava2.dispose();
    ava3.dispose();
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
