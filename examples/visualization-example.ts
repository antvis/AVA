/**
 * Visualization Example
 * 
 * This example demonstrates AVA's visualization capabilities:
 * 1. Loading data from a JSON object
 * 2. Analyzing with a visualization-intent query
 * 3. Generating GPT-Vis HTML visualization code
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
    // Prepare data
    const data = [
      { city: '杭州', population: 1220, gdp: 18753 },
      { city: '上海', population: 2489, gdp: 43214 },
      { city: '北京', population: 2189, gdp: 40269 },
      { city: '深圳', population: 1768, gdp: 32387 },
      { city: '广州', population: 1868, gdp: 28839 },
    ];

    // Load data from JSON object
    await ava.loadObject(data);
    console.log('✓ Data loaded successfully\n');

    // Example 1: Query with visualization intent
    console.log('Query: 绘制各城市GDP的柱状图');
    const response = await ava.analysis('绘制各城市GDP的柱状图');
    
    console.log('Response Text:', response.text);
    console.log('\nVisualization Generated:', response.visualizationHTML ? 'Yes' : 'No');
    
    // Save visualization HTML if generated
    if (response.visualizationHTML) {
      const outputPath = path.join(__dirname, '../output-visualization.html');
      fs.writeFileSync(outputPath, response.visualizationHTML);
      console.log(`\n✓ Visualization HTML saved to: ${outputPath}`);
      console.log('Open this file in a browser to view the visualization.');
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    // Clean up resources
    ava.dispose();
  }
}

// Run the example
main();
