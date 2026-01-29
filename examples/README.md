# AVA v4 Examples

This directory contains example scripts demonstrating how to use AVA v4.

## Prerequisites

1. Install dependencies:
```bash
cd packages/ava
npm install
npm run build
```

2. Set your OpenAI API key:
```bash
export OPENAI_API_KEY='your-api-key-here'
```

## Examples

### Basic Usage

Demonstrates basic data loading and analysis:

```bash
npm install -g ts-node
ts-node examples/basic-usage.ts
```

This example shows:
- Loading data from CSV files
- Asking natural language questions
- Getting AI-powered analysis results

## Creating Sample Data

Create a sample CSV file at `data/companies.csv`:

```csv
company,region,revenue
Acme Corp,California,25000
Tech Inc,New York,18000
Data Co,California,32000
Cloud Services,Texas,22000
AI Solutions,California,28000
Web Services,New York,19000
Mobile Apps,Texas,15000
```

## API Key Configuration

You can configure the API key in several ways:

1. Environment variable:
```bash
export OPENAI_API_KEY='your-key'
```

2. Directly in code:
```typescript
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: 'your-key',
  },
});
```

## Using Different Models

AVA supports any OpenAI-compatible model:

```typescript
// Use GPT-3.5 for faster, cheaper responses
const ava = new AVA({
  llm: {
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Use a custom OpenAI-compatible endpoint
const ava = new AVA({
  llm: {
    model: 'custom-model',
    apiKey: process.env.API_KEY,
    baseURL: 'https://your-api-endpoint.com/v1',
  },
});
```

## Large Dataset Example

For datasets larger than 10KB, AVA automatically uses SQLite:

```typescript
// Large dataset will be automatically stored in SQLite
await ava.loadCSV('data/large-dataset.csv');

// Queries work the same way
const result = await ava.analysis('What are the top 10 categories by sales?');
```

## Custom Threshold

You can customize when to switch to SQLite:

```typescript
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  sqliteThreshold: 50 * 1024, // Use SQLite for datasets > 50KB
});
```
