import React from 'react';

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbfc] to-white">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <img 
              src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" 
              alt="AVA Logo" 
              className="w-20 h-20"
            />
            <h1 className="text-5xl font-bold text-gray-800">AVA</h1>
          </div>
          <p className="text-2xl text-gray-600 mb-4">AI-Native Visual Analytics</p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            A technology framework designed for more convenient visual analytics, powered by AI
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#78d3f8]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Natural Language</h3>
            <p className="text-sm text-gray-600">Ask questions about your data in plain English</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#78d3f8]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">LLM-Powered</h3>
            <p className="text-sm text-gray-600">Leverages large language models for intelligent analysis</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#78d3f8]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Processing</h3>
            <p className="text-sm text-gray-600">Auto-switches between in-memory and SQLite based on data size</p>
          </div>
        </div>

        {/* Main Documentation Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Contents</h3>
              <nav className="space-y-2 text-sm">
                <a href="#installation" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Installation</a>
                <a href="#quick-start" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Quick Start</a>
                <a href="#architecture" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Architecture</a>
                <a href="#api-reference" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">API Reference</a>
                <a href="#examples" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Examples</a>
                <a href="#configuration" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Configuration</a>
                <a href="#best-practices" className="block text-gray-600 hover:text-[#78d3f8] transition-colors py-1">Best Practices</a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Installation */}
            <section id="installation" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Installation
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">Install AVA using your preferred package manager:</p>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-400 mb-2"># npm</div>
                  <div>npm install @antv/ava</div>
                  <div className="text-gray-400 mt-4 mb-2"># yarn</div>
                  <div>yarn add @antv/ava</div>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Quick Start
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">Get started with AVA in just a few lines of code:</p>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre">{`import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  sqlThreshold: 1024 * 1024 * 2, // 2MB threshold
});

// Load data
await ava.loadObject([
  { city: 'Hangzhou', gdp: 18753 },
  { city: 'Shanghai', gdp: 43214 }
]);

// Ask questions
const result = await ava.analysis(
  'What is the average GDP?'
);
console.log(result.text);
// Optionally access: result.code, result.sql, 
// or result.visualizationHTML

// Clean up
ava.dispose();`}</pre>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                Architecture
              </h2>
              <div className="space-y-6">
                <p className="text-gray-600">AVA uses a modular pipeline architecture:</p>
                <div className="bg-gradient-to-r from-[#78d3f8]/10 to-transparent rounded-lg p-6 border-l-4 border-[#78d3f8]">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#78d3f8] text-white flex items-center justify-center font-semibold">1</div>
                      <div>
                        <div className="font-semibold text-gray-800">Data Module</div>
                        <div className="text-gray-600">Load from CSV, JSON, URL, or text</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-[#78d3f8]/30 h-6"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#78d3f8] text-white flex items-center justify-center font-semibold">2</div>
                      <div>
                        <div className="font-semibold text-gray-800">Metadata Extract</div>
                        <div className="text-gray-600">Type inference and statistics</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-[#78d3f8]/30 h-6"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#78d3f8] text-white flex items-center justify-center font-semibold">3</div>
                      <div>
                        <div className="font-semibold text-gray-800">Size Check</div>
                        <div className="text-gray-600">&lt;10MB: JavaScript | ≥10MB: SQLite</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-[#78d3f8]/30 h-6"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#78d3f8] text-white flex items-center justify-center font-semibold">4</div>
                      <div>
                        <div className="font-semibold text-gray-800">Analysis Module</div>
                        <div className="text-gray-600">Generate & execute code/SQL</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-[#78d3f8]/30 h-6"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#78d3f8] text-white flex items-center justify-center font-semibold">5</div>
                      <div>
                        <div className="font-semibold text-gray-800">LLM Summary</div>
                        <div className="text-gray-600">Natural language response</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                API Reference
              </h2>
              <div className="space-y-8">
                {/* Constructor */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Constructor</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <code className="text-sm text-[#78d3f8]">new AVA(options: AVAOptions)</code>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-mono">llm</span>
                        <span className="text-gray-600">— LLM configuration (model, apiKey, baseURL)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-mono">sqlThreshold</span>
                        <span className="text-gray-600">— Size threshold for SQLite (default: 10MB)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Loading */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Loading</h3>
                  <div className="space-y-3">
                    {[
                      { method: 'loadCSV(content: string)', desc: 'Load data from CSV string' },
                      { method: 'loadObject(data: object[])', desc: 'Load data from array of objects' },
                      { method: 'loadURL(url: string, transform?: Function)', desc: 'Load data from URL' },
                      { method: 'loadText(text: string)', desc: 'Extract data from unstructured text' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <code className="text-sm text-[#78d3f8] block mb-2">{item.method}</code>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <code className="text-sm text-[#78d3f8] block mb-2">analysis(query: string)</code>
                    <p className="text-sm text-gray-600 mb-3">Analyze data with natural language query</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="font-semibold mb-2">Returns object with:</div>
                      <div>• <code className="bg-white px-1 rounded">text</code> — Natural language summary of the analysis</div>
                      <div>• <code className="bg-white px-1 rounded">code</code> — JavaScript code used (if applicable)</div>
                      <div>• <code className="bg-white px-1 rounded">sql</code> — SQL query used (if applicable)</div>
                      <div>• <code className="bg-white px-1 rounded">visualizationHTML</code> — Interactive chart HTML (if applicable)</div>
                    </div>
                  </div>
                </div>

                {/* Suggest */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Query Suggestions</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <code className="text-sm text-[#78d3f8] block mb-2">suggest(count?: number)</code>
                    <p className="text-sm text-gray-600 mb-3">Get AI-recommended analysis queries based on dataset characteristics (default: 3)</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="font-semibold mb-2">Returns array of objects with:</div>
                      <div>• <code className="bg-white px-1 rounded">query</code> — Suggested analysis question</div>
                      <div>• <code className="bg-white px-1 rounded">score</code> — Meaningfulness score (0-1)</div>
                      <div>• <code className="bg-white px-1 rounded">reason</code> — Explanation for the suggestion</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Examples */}
            <section id="examples" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Usage Examples
              </h2>
              <div className="space-y-6">
                <div className="border-l-4 border-[#78d3f8] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Query Suggestions</h4>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre">{`await ava.loadObject([
  { city: 'Hangzhou', gdp: 18753 },
  { city: 'Shanghai', gdp: 43214 }
]);

// Get 5 suggested queries
const suggestions = await ava.suggest(5);
console.log(suggestions[0]);
// { query: "What is the average GDP?", 
//   score: 0.95, 
//   reason: "Reveals economic patterns" }

// Use suggested query for analysis
const result = await ava.analysis(suggestions[0].query);`}</pre>
                  </div>
                </div>
                <div className="border-l-4 border-[#78d3f8] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Browser File Upload</h4>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre">{`const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const content = await file.text();
  await ava.loadCSV(content);
  const result = await ava.analysis('Show trends');
});`}</pre>
                  </div>
                </div>
                <div className="border-l-4 border-[#78d3f8] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">API Data Analysis</h4>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre">{`await ava.loadURL(
  'https://api.example.com/sales',
  (response) => response.data.items
);
const result = await ava.analysis('Compare by region');`}</pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Configuration */}
            <section id="configuration" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Configuration
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">AVA supports multiple LLM providers:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">OpenAI</div>
                    <div className="font-mono text-xs text-gray-600 space-y-1">
                      <div>model: 'gpt-4'</div>
                      <div>baseURL: 'api.openai.com/v1'</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Custom Provider</div>
                    <div className="font-mono text-xs text-gray-600 space-y-1">
                      <div>model: 'ling-1t'</div>
                      <div>baseURL: 'your-llm-api.com'</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section id="best-practices" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Best Practices
              </h2>
              <div className="space-y-3">
                {[
                  'Always call ava.dispose() when done to free resources',
                  'Wrap async calls in try-catch blocks for error handling',
                  'Validate data format before loading',
                  'Set sqlThreshold based on expected data sizes',
                  'Never expose API keys in client-side code',
                ].map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-[#78d3f8] mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{practice}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="bg-gradient-to-r from-[#78d3f8]/10 to-transparent rounded-xl p-8 border border-[#78d3f8]/20">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="https://github.com/antvis/AVA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#78d3f8] hover:underline">
                  <span>→</span> GitHub Repository
                </a>
                <a href="https://github.com/antvis/AVA/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#78d3f8] hover:underline">
                  <span>→</span> Report Issues
                </a>
                <a href="https://antv.vision/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#78d3f8] hover:underline">
                  <span>→</span> AntV Community
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documentation;
