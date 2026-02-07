/**
 * Example: Using the suggest() method
 * 
 * This example demonstrates how to use the suggest() method
 * to get AI-recommended analysis queries based on your data.
 */

import { AVA } from '@antv/ava';

async function main() {
  // Initialize AVA with LLM config
  const ava = new AVA({
    llm: {
      model: 'ling-1t',
      apiKey: process.env.LING_1T_API_KEY || 'YOUR_API_KEY',
      baseURL: 'https://api.tbox.cn/api/llm/v1',
    },
  });

  // Load sample data
  await ava.loadObject([
    { city: '杭州', gdp: 18753, population: 1220 },
    { city: '上海', gdp: 43214, population: 2489 },
    { city: '北京', gdp: 35371, population: 2188 },
    { city: '深圳', gdp: 30664, population: 1768 },
    { city: '广州', gdp: 28839, population: 1868 },
  ]);

  console.log('Getting query suggestions...\n');

  // Get 5 suggested queries
  const queries = await ava.suggest(5);

  console.log('Suggested Analysis Queries:\n');
  queries.forEach((suggestion, index) => {
    console.log(`${index + 1}. Query: ${suggestion.query}`);
    console.log(`   Score: ${(suggestion.score * 100).toFixed(1)}%`);
    console.log(`   Reason: ${suggestion.reason}\n`);
  });

  // Use the top suggested query for analysis
  if (queries.length > 0) {
    console.log('\nAnalyzing with the top suggestion...\n');
    const result = await ava.analysis(queries[0].query);
    console.log('Analysis Result:');
    console.log(result.text);
  }

  // Clean up
  ava.dispose();
}

main().catch(console.error);
