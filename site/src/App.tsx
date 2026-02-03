import { useState, useRef, useCallback, useEffect } from 'react';

// Types for the application
interface LLMConfig {
  model: string;
  apiKey: string;
  baseURL: string;
}

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface AnalysisResult {
  text: string;
  data?: DataRow[];
  visualizationHTML?: string;
}

// Default LLM config
const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'ling-1t',
  apiKey: '',
  baseURL: 'https://api.tbox.cn/api/llm/v1',
};

// Load LLM config from localStorage
const loadLLMConfig = (): LLMConfig => {
  try {
    const saved = localStorage.getItem('ava-llm-config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load LLM config:', e);
  }
  return DEFAULT_LLM_CONFIG;
};

// Save LLM config to localStorage
const saveLLMConfig = (config: LLMConfig) => {
  localStorage.setItem('ava-llm-config', JSON.stringify(config));
};

// Simple CSV parser for browser
const parseCSV = (csvContent: string): DataRow[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const data: DataRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length === headers.length) {
      const row: DataRow = {};
      headers.forEach((header, index) => {
        const val = values[index];
        // Try to convert to number
        const num = Number(val);
        row[header] = !isNaN(num) && val !== '' ? num : val;
      });
      data.push(row);
    }
  }
  
  return data;
};

// Extract structured data from text using LLM
const extractDataFromText = async (text: string, config: LLMConfig): Promise<DataRow[]> => {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You are a data extraction assistant. Extract structured data from the text and return it as a JSON array of objects.
The text may contain data in various formats. Your task is to:
1. Identify the structure and pattern in the data
2. Extract all data points
3. Return a JSON array where each element is an object with appropriate key-value pairs
4. Ensure all objects have the same keys (columns)
5. Use meaningful key names based on the context
Return ONLY the JSON array, no additional text or explanation.`
        },
        {
          role: 'user',
          content: text
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const result = await response.json();
  const responseText = result.choices[0]?.message?.content || '';
  
  // Try parsing the entire response first
  try {
    const data = JSON.parse(responseText);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // If direct parsing fails, try to extract JSON array from response
  }

  // Extract JSON array using regex
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON array from LLM response');
  }
  
  try {
    const data = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(data)) {
      throw new Error('LLM did not return an array');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse extracted JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Analyze data using LLM
const analyzeData = async (
  data: DataRow[],
  query: string,
  config: LLMConfig
): Promise<AnalysisResult> => {
  const dataStr = JSON.stringify(data, null, 2);
  
  // First, analyze the data
  const analysisResponse = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You are a data analysis assistant. Analyze the provided data based on the user's query.
First, write JavaScript code to process the data and get the result.
Then, provide a clear summary of the findings.

Return your response in the following JSON format:
{
  "code": "// JavaScript code to process the data (data variable is available)",
  "summary": "Clear explanation of the analysis result"
}

Only return valid JSON, no other text.`
        },
        {
          role: 'user',
          content: `Data:\n${dataStr}\n\nQuery: ${query}`
        }
      ],
    }),
  });

  if (!analysisResponse.ok) {
    throw new Error(`API request failed: ${analysisResponse.statusText}`);
  }

  const analysisResult = await analysisResponse.json();
  const analysisText = analysisResult.choices[0]?.message?.content || '';
  
  let analysisData: DataRow[] = [];
  let summary = '';
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary = parsed.summary || analysisText;
      
      if (parsed.code) {
        try {
          // Execute the code safely
          const fn = new Function('data', `
            ${parsed.code}
            return typeof result !== 'undefined' ? result : data;
          `);
          const result = fn(data);
          analysisData = Array.isArray(result) ? result : [result];
        } catch {
          analysisData = data;
        }
      }
    } else {
      summary = analysisText;
      analysisData = data;
    }
  } catch {
    summary = analysisText;
    analysisData = data;
  }

  // Check if visualization is needed
  const visCheckResponse = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `Determine if the user's query needs a visualization.
If yes, return one of these chart types: line, column, bar, pie, area, scatter
If no visualization is needed, return "none"
Only return the chart type or "none", nothing else.`
        },
        {
          role: 'user',
          content: query
        }
      ],
    }),
  });

  const visCheckResult = await visCheckResponse.json();
  const chartType = visCheckResult.choices[0]?.message?.content?.trim().toLowerCase() || 'none';
  
  let visualizationHTML: string | undefined;
  
  if (chartType !== 'none' && ['line', 'column', 'bar', 'pie', 'area', 'scatter'].includes(chartType)) {
    // Generate visualization
    const visResponse = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `You are a GPT-Vis visualization expert. Generate a complete HTML file with GPT-Vis syntax.

## Chart Type: ${chartType}

## GPT-Vis Syntax Examples:

### Line Chart
\`\`\`
vis line
data
  - time 2020
    value 100
  - time 2021
    value 120
title Trend
\`\`\`

### Column Chart
\`\`\`
vis column
data
  - category A
    value 30
  - category B
    value 50
title Comparison
\`\`\`

### Pie Chart
\`\`\`
vis pie
data
  - category A
    value 30
  - category B
    value 50
title Distribution
\`\`\`

### Bar Chart
\`\`\`
vis bar
data
  - category Item1
    value 100
  - category Item2
    value 200
title Comparison
\`\`\`

## HTML Template:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
    #container { width: 100%; height: 400px; background: white; border-radius: 8px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    const gptVis = new GPTVis.GPTVis({ container: '#container' });
    const visSyntax = \`[GPT-Vis syntax here]\`;
    gptVis.render(visSyntax);
  </script>
</body>
</html>

Generate a complete HTML file with the correct GPT-Vis syntax for the data. Return ONLY the HTML code.`
          },
          {
            role: 'user',
            content: `Data:\n${JSON.stringify(analysisData.slice(0, 20), null, 2)}\n\nQuery: ${query}`
          }
        ],
      }),
    });

    const visResult = await visResponse.json();
    let visHTML: string = visResult.choices[0]?.message?.content || '';
    
    // Clean up the HTML if it's wrapped in code blocks
    if (visHTML.includes('```html')) {
      const match = visHTML.match(/```html\s*([\s\S]*?)```/);
      if (match) {
        visHTML = match[1].trim();
      }
    } else if (visHTML.includes('```')) {
      const match = visHTML.match(/```\s*([\s\S]*?)```/);
      if (match) {
        visHTML = match[1].trim();
      }
    }
    visualizationHTML = visHTML;
  }

  return {
    text: summary,
    data: analysisData,
    visualizationHTML,
  };
};

// Header Component
const Header: React.FC<{ onOpenConfig: () => void }> = ({ onOpenConfig }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#78d3f8] to-[#4ec4ef] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-800">AVA ChartGenie</span>
        <span className="text-lg">📊</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#78d3f8] hover:bg-[#78d3f8]/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          LLM Config
        </button>
        <a
          href="https://github.com/antvis/AVA"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </div>
    </div>
  </header>
);

// LLM Config Modal
const ConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">LLM Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              value={localConfig.model}
              onChange={e => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
              placeholder="e.g., ling-1t, gpt-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
              placeholder="Your API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
            <input
              type="text"
              value={localConfig.baseURL}
              onChange={e => setLocalConfig({ ...localConfig, baseURL: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all"
              placeholder="https://api.example.com/v1"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-[#78d3f8] hover:bg-[#4ec4ef] text-white rounded-xl transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Import Section
const DataImport: React.FC<{
  onDataLoaded: (data: DataRow[]) => void;
  llmConfig: LLMConfig;
}> = ({ onDataLoaded, llmConfig }) => {
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    if (!llmConfig.apiKey) {
      setError('Please configure your LLM API key first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await extractDataFromText(textInput, llmConfig);
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const data = parseCSV(content);
      if (data.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">1</span>
        <h2 className="text-lg font-semibold text-gray-800">Import your data</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Paste raw data</label>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste CSV, JSON or plain text data..."
            className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all text-sm text-gray-700 placeholder-[#78d3f8]/60"
          />
          <button
            onClick={handleTextSubmit}
            disabled={isLoading || !textInput.trim()}
            className="mt-3 px-4 py-2 bg-[#78d3f8] hover:bg-[#4ec4ef] disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Extract Data'}
          </button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Upload spreadsheets</label>
          <div
            className="h-32 border-2 border-dashed border-[#78d3f8]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#78d3f8]/60 hover:bg-[#78d3f8]/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-[#78d3f8] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drag & Drop Excel or CSV</p>
            <p className="text-xs text-[#78d3f8] mt-1">Maximum file size: 25MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-4 py-2 bg-white border border-gray-200 hover:border-[#78d3f8] text-gray-700 text-sm rounded-lg transition-colors"
          >
            Browse Files
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

// Data Preview Table
const DataPreview: React.FC<{ data: DataRow[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, 10);

  const formatValue = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Check if it looks like a percentage
      if (Math.abs(value) <= 1 && String(value).includes('.')) {
        return `${(value * 100).toFixed(0)}%`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const getValueColor = (value: string | number | boolean | null): string => {
    if (typeof value === 'number') {
      if (value > 0 && Math.abs(value) <= 1) return 'text-green-500';
      if (value < 0) return 'text-red-500';
    }
    if (typeof value === 'string') {
      if (value.startsWith('+')) return 'text-green-500';
      if (value.startsWith('-')) return 'text-red-500';
    }
    return 'text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">2</span>
          <h2 className="text-lg font-semibold text-gray-800">Structured Data Preview</h2>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map(col => (
                <th key={col} className="text-left py-3 px-4 font-medium text-[#78d3f8]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                {columns.map(col => (
                  <td key={col} className={`py-3 px-4 ${getValueColor(row[col])}`}>
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 10 && (
        <p className="mt-4 text-sm text-gray-400 text-center">
          Showing 10 of {data.length} rows
        </p>
      )}
    </div>
  );
};

// Visualization Section
const Visualization: React.FC<{
  data: DataRow[];
  llmConfig: LLMConfig;
}> = ({ data, llmConfig }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!query.trim() || data.length === 0) return;
    if (!llmConfig.apiKey) {
      setError('Please configure your LLM API key first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeData(data, query, llmConfig);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, data, llmConfig]);

  // Update iframe content when visualization changes
  useEffect(() => {
    if (result?.visualizationHTML && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(result.visualizationHTML);
        doc.close();
      }
    }
  }, [result?.visualizationHTML]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-6 h-6 bg-[#78d3f8]/20 text-[#78d3f8] text-sm font-semibold rounded-full">3</span>
        <h2 className="text-lg font-semibold text-gray-800">Visualize with AI</h2>
      </div>

      {/* Query Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="Create a trend line comparing North America and Europe sales growth"
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78d3f8]/50 focus:border-[#78d3f8] transition-all text-sm"
          disabled={data.length === 0}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !query.trim() || data.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-[#78d3f8] hover:bg-[#4ec4ef] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Preview Area */}
      <div className="min-h-[400px] border-2 border-dashed border-[#78d3f8]/20 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {result ? (
          result.visualizationHTML ? (
            <iframe
              ref={iframeRef}
              className="w-full h-[400px] border-0"
              title="Visualization"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 rounded-lg p-4">
                {result.text}
              </pre>
            </div>
          )
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <div className="relative mb-4">
              {/* Background bars */}
              <div className="flex items-end gap-2 opacity-30">
                <div className="w-8 h-16 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-24 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-20 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-28 bg-[#78d3f8] rounded-t-lg" />
                <div className="w-8 h-22 bg-[#78d3f8] rounded-t-lg" />
              </div>
              {/* Sparkle icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                ✨
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Chart Preview</h3>
            <p className="text-sm text-center max-w-xs">
              Your generated interactive chart will appear here after clicking 'Generate'
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-[#78d3f8]">
              <span>🎨 Customize</span>
              <span>📤 Share</span>
              <span>{'</>'} Embed</span>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Summary */}
      {result && !result.visualizationHTML && result.text && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Summary</h4>
          <p className="text-sm text-gray-600">{result.text}</p>
        </div>
      )}
    </div>
  );
};

// Footer
const Footer: React.FC = () => (
  <footer className="text-center py-8 text-gray-400 text-sm">
    © 2024 AVA ChartGenie Workspace. Built for designers and data nerds 🚀
  </footer>
);

// Main App Component
function App() {
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(loadLLMConfig);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [data, setData] = useState<DataRow[]>([]);

  const handleSaveConfig = (config: LLMConfig) => {
    setLLMConfig(config);
    saveLLMConfig(config);
  };

  const handleDataLoaded = (newData: DataRow[]) => {
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-[#f8fbfc]">
      <Header onOpenConfig={() => setIsConfigOpen(true)} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            AI Chart Generator <span>✨</span>
          </h1>
          <p className="text-gray-500">
            Turn messy data into beautiful visualizations in seconds
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <DataImport onDataLoaded={handleDataLoaded} llmConfig={llmConfig} />
          <DataPreview data={data} />
          <Visualization data={data} llmConfig={llmConfig} />
        </div>
      </main>

      <Footer />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

export default App;
