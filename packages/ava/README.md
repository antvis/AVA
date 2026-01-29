<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)


<h1 align="center">
<b>@antv/ava</b>
</h1>

<div align="center">
A framework for AI-native Visual Analytics.

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) 

</div>

## Introduction

AVA v4 is a complete rewrite focused on AI-native capabilities. It leverages Large Language Models (LLMs) to provide conversational data analysis and visualization.

[@antv/ava](https://www.npmjs.com/package/@antv/ava) contains three main modules:

* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data</span>: Data loading and processing. Supports CSV files with automatic type inference and metadata extraction.
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">analysis</span>: Natural language to code/SQL generation. Uses JavaScript helper functions for small datasets (<10KB) and SQLite for large datasets.
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">visualize</span>: AI-powered chart recommendation and generation (coming soon).


## Installation and Usage

Installation can be done via npm or the yarn package manager.

```shell
# npm
$ npm install @antv/ava --save

# yarn
$ yarn add @antv/ava
```

**Requirements:**
- Node.js >= 18.0.0
- An OpenAI-compatible API key

## Quick Start

```typescript
import { AVA } from '@antv/ava';

// Initialize AVA with LLM configuration
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: 'YOUR_OPENAI_API_KEY',
  },
});

// Load data
await ava.loadCSV('data/companies.csv');

// Ask questions in natural language
const response = await ava.analysis("What is the average revenue by region?");
console.log(response);
// Output: "Based on the data, the average revenue by region is:
// - California: $28,500
// - New York: $22,100
// - Texas: $19,800"
```

## Features

### 🤖 AI-Native Analysis

Ask questions in natural language and get intelligent answers:

```typescript
await ava.analysis("What is the max revenue by region?");
await ava.analysis("Show me the top 5 companies by revenue");
await ava.analysis("Calculate the growth rate compared to last year");
```

### 📊 Smart Data Handling

- **Small datasets (<10KB)**: Uses custom JavaScript helper functions for fast in-memory analysis
- **Large datasets (≥10KB)**: Automatically switches to SQLite for efficient querying

### 🔄 Automatic Type Inference

AVA automatically detects field types (number, string, date, boolean) and extracts metadata.

## API Documentation

### `new AVA(config: AVAConfig)`

Create a new AVA instance.

**Parameters:**
- `config.llm.model`: LLM model name (e.g., 'gpt-4', 'gpt-3.5-turbo')
- `config.llm.apiKey`: API key for the LLM provider
- `config.llm.baseURL` (optional): Custom API endpoint
- `config.sqliteThreshold` (optional): Size threshold for SQLite usage (default: 10KB)

### `await ava.loadCSV(filePath: string)`

Load a CSV file for analysis.

### `await ava.analysis(query: string): Promise<string>`

Analyze data using natural language query. Returns a human-readable summary.

### `ava.dispose()`

Clean up resources (close database connections, free memory).

## Architecture

AVA v4 uses a modular architecture:

```
┌─────────────────────────────────────┐
│           AVA Core                  │
├─────────────────────────────────────┤
│  Data Module                        │
│  - CSV Loading                      │
│  - Type Inference                   │
│  - Metadata Extraction              │
├─────────────────────────────────────┤
│  Analysis Module                    │
│  - Natural Language → Code/SQL      │
│  - danfojs Execution                │
│  - SQLite Query                     │
├─────────────────────────────────────┤
│  Visualize Module (Coming Soon)     │
│  - Chart Recommendation             │
│  - Spec Generation                  │
└─────────────────────────────────────┘
```

## Module Documentation

- [Data Module](./src/data/README.md) - Data loading and processing
- [Analysis Module](./src/analysis/README.md) - Query generation and execution

## Examples

See the `/examples` directory for more usage examples.

## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

More at [Wiki: Development](https://github.com/antvis/AVA/wiki/Development).
