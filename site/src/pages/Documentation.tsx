import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const documentationContent = `
# AVA - AI-Native Visual Analytics

AVA (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics. The first **A** has multiple meanings: AI native, Automated, Augmented, and **VA** stands for Visual Analytics.

## 🚀 Features

AVA is a fundamental shift from rule-based analytics to AI-native capabilities:

- **Natural Language Queries**: Ask questions about your data in plain English
- **LLM-Powered Analysis**: Leverages large language models for intelligent data analysis
- **Smart Data Handling**: Automatically chooses between in-memory processing and SQLite based on data size
- **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules
- **Browser & Node.js Compatible**: Runs seamlessly in both browser and server environments

## 📖 Quick Start

\`\`\`typescript
import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  sqlThreshold: 1024 * 1024 * 2, // Threshold for switching to SQLite
});

// Load data from various sources in Node.js
await ava.loadCSV('data/companies.csv');

// Load CSV from file input in browser
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const csvContent = await file.text();
await ava.loadCSV(csvContent);

// or load from JSON object
await ava.loadObject([{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }]);

// or load from URL
await ava.loadURL('https://api.example.com/data', (response) => response.data);

// or extract from text
await ava.loadText('杭州 100，上海 200，北京 300');

// Ask questions in natural language
const result = await ava.analysis('What is the average revenue by region?');
console.log(result);

// Clean up
ava.dispose();
\`\`\`

## 🏗️ Architecture

AVA uses a modular pipeline architecture that processes user queries through distinct stages:

1. **Data Module** - Load from multiple sources:
   - CSV File (\`loadCSV\`)
   - JSON Object (\`loadObject\`)
   - URL (\`loadURL\`)
   - Text (\`loadText\` + LLM)

2. **Metadata Extract** - Type inference and statistics

3. **Size Check** - Determines processing strategy
   - < 10KB: JavaScript Helpers
   - ≥ 10KB: SQLite Storage

4. **Analysis Module** - Generate & Execute Code/SQL

5. **LLM Summary** - Natural Language Response

6. **Visualization** (Optional) - Chart recommendations

## 📚 API Reference

### AVA Constructor

\`\`\`typescript
new AVA(options: AVAOptions)
\`\`\`

**Options:**
- \`llm\`: LLM configuration object
  - \`model\`: Model name (e.g., 'ling-1t', 'gpt-4')
  - \`apiKey\`: Your API key
  - \`baseURL\`: API base URL
- \`sqlThreshold\`: Size threshold in bytes for switching to SQLite (default: 10MB)

### Data Loading Methods

#### loadCSV(content: string)
Load data from CSV content string.

\`\`\`typescript
await ava.loadCSV(csvString);
\`\`\`

#### loadObject(data: object[])
Load data from an array of objects.

\`\`\`typescript
await ava.loadObject([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
]);
\`\`\`

#### loadURL(url: string, transform?: Function)
Load data from a URL with optional transform function.

\`\`\`typescript
await ava.loadURL('https://api.example.com/data', 
  (response) => response.data
);
\`\`\`

#### loadText(text: string)
Extract structured data from unstructured text using LLM.

\`\`\`typescript
await ava.loadText('Sales: Q1 $100k, Q2 $150k, Q3 $200k');
\`\`\`

### Analysis Methods

#### analysis(query: string)
Analyze data based on natural language query.

\`\`\`typescript
const result = await ava.analysis('What is the total revenue?');
// Returns: { text: string, code?: string, sql?: string, visualizationHTML?: string }
\`\`\`

**Response Object:**
- \`text\`: Natural language summary of the analysis
- \`code\`: JavaScript code used for analysis (if applicable)
- \`sql\`: SQL query used for analysis (if applicable)
- \`visualizationHTML\`: HTML for interactive chart (if applicable)

### Cleanup

#### dispose()
Clean up resources and close database connections.

\`\`\`typescript
ava.dispose();
\`\`\`

## 💡 Usage Examples

### Example 1: Simple Data Analysis

\`\`\`typescript
const ava = new AVA({ llm: config });

await ava.loadObject([
  { product: 'A', sales: 100, region: 'North' },
  { product: 'B', sales: 150, region: 'South' },
  { product: 'A', sales: 200, region: 'South' }
]);

const result = await ava.analysis('What are the top selling products?');
console.log(result.text);
\`\`\`

### Example 2: CSV File Analysis

\`\`\`typescript
// In browser
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const content = await file.text();
  
  await ava.loadCSV(content);
  const result = await ava.analysis('Show me trends over time');
  
  // Display visualization
  if (result.visualizationHTML) {
    document.getElementById('chart').innerHTML = result.visualizationHTML;
  }
});
\`\`\`

### Example 3: API Data Analysis

\`\`\`typescript
await ava.loadURL(
  'https://api.example.com/sales',
  (response) => response.data.items
);

const result = await ava.analysis('Compare sales by region');
console.log(result.text);
\`\`\`

## 🔧 Configuration

### LLM Configuration

AVA supports multiple LLM providers. Configure your preferred provider:

\`\`\`typescript
// OpenAI
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1'
  }
});

// Custom LLM Provider
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: process.env.CUSTOM_API_KEY,
    baseURL: 'https://api.custom-provider.com/v1'
  }
});
\`\`\`

### Performance Tuning

Adjust the SQL threshold based on your use case:

\`\`\`typescript
// For memory-constrained environments
const ava = new AVA({
  llm: config,
  sqlThreshold: 1024 * 1024 * 1 // 1MB
});

// For high-performance environments
const ava = new AVA({
  llm: config,
  sqlThreshold: 1024 * 1024 * 100 // 100MB
});
\`\`\`

## 🌟 Best Practices

1. **Always dispose instances**: Call \`ava.dispose()\` when done to free resources
2. **Handle errors**: Wrap async calls in try-catch blocks
3. **Validate data**: Ensure data is properly formatted before loading
4. **Use appropriate thresholds**: Set \`sqlThreshold\` based on expected data sizes
5. **Secure API keys**: Never expose API keys in client-side code

## 📦 Installation

\`\`\`bash
npm install @antv/ava
\`\`\`

or

\`\`\`bash
yarn add @antv/ava
\`\`\`

## 🔗 Links

- [GitHub Repository](https://github.com/antvis/AVA)
- [Report Issues](https://github.com/antvis/AVA/issues)
- [AntV Community](https://antv.vision/)

## 📄 License

MIT
`;

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fbfc]">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="prose prose-slate max-w-none prose-headings:text-gray-800 prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-[#78d3f8] prose-a:no-underline hover:prose-a:underline prose-code:text-[#78d3f8] prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-strong:text-gray-800 prose-ul:text-gray-600 prose-ol:text-gray-600 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {documentationContent}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documentation;
