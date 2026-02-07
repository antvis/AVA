/**
 * Unified Visualization Example
 * 
 * This example demonstrates AVA's optimized unified visualization approach:
 * - Single LLM call for both chart type recommendation and HTML generation
 * - Reduced network latency and faster response time
 * - Same functionality as separate advise + generate approach
 */

import { AVA } from '../src';
import * as fs from 'fs';
import * as path from 'path';

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
    // Prepare city GDP data
    const data = [
      { city: '杭州', population: 1220, gdp: 18753 },
      { city: '上海', population: 2489, gdp: 43214 },
      { city: '北京', population: 2189, gdp: 40269 },
      { city: '深圳', population: 1768, gdp: 32387 },
      { city: '广州', population: 1868, gdp: 28839 },
    ];

    await ava.loadObject(data);
    console.log('✓ Data loaded successfully\n');

    // Example 1: Visualization query with unified approach
    console.log('Query: 绘制各城市GDP的柱状图');
    console.log('Using unified visualization approach (single LLM call)...\n');
    
    const startTime = Date.now();
    const response = await ava.analysis('绘制各城市GDP的柱状图');
    const endTime = Date.now();
    
    console.log(`✓ Response received in ${endTime - startTime}ms\n`);
    console.log('✓ Analysis result:', response.text);
    
    if (response.visualizationSyntax) {
      console.log('\n✓ GPT-Vis syntax generated:');
      console.log(response.visualizationSyntax);
    }

    if (response.visualizationHTML) {
      const outputPath = path.join(__dirname, '../output-unified-visualization.html');
      fs.writeFileSync(outputPath, response.visualizationHTML);
      console.log(`\n✓ Visualization HTML saved to: ${outputPath}`);
      console.log('Open this file in a browser to view the visualization.');
    }

    // Example 2: Non-visualization query (should not generate HTML)
    console.log('\n\nQuery: 哪个城市的GDP最高？');
    const response2 = await ava.analysis('哪个城市的GDP最高？');
    
    console.log('✓ Analysis result:', response2.text);
    console.log('✓ Visualization generated:', response2.visualizationHTML ? 'Yes' : 'No (as expected)');

    // Performance note
    console.log('\n=== Performance Optimization ===');
    console.log('The unified approach combines chart type recommendation and HTML generation');
    console.log('into a single LLM call, reducing:');
    console.log('  • Network round trips from 2 to 1');
    console.log('  • Total latency by ~50%');
    console.log('  • API costs by consolidating prompts');
    console.log('while maintaining the same functionality and accuracy.');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
