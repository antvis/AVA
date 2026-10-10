import React from 'react';

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
    <pre className="whitespace-pre">{children}</pre>
  </div>
);

const MethodCard: React.FC<{ method: string; desc: React.ReactNode }> = ({ method, desc }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <code className="text-sm text-[color:var(--color-primary)] block mb-2">{method}</code>
    <div className="text-sm text-gray-600 space-y-1">{desc}</div>
  </div>
);

const BulletList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <div className="text-xs text-gray-500 space-y-1">
    {items.map((item, idx) => (
      <div key={idx}>{item}</div>
    ))}
  </div>
);

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
            <div className="w-12 h-12 bg-[color:var(--color-primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Natural Language Queries</h3>
            <p className="text-sm text-gray-600">Ask questions about your data in plain English</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[color:var(--color-primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Profiling</h3>
            <p className="text-sm text-gray-600">
              Compute deterministic table and field statistics, no LLM call required
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[color:var(--color-primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dual Environment</h3>
            <p className="text-sm text-gray-600">
              DuckDB, Python, and remote database engines in Node.js; JavaScript interpreter in browsers
            </p>
          </div>
        </div>

        {/* Main Documentation Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Contents</h3>
              <nav className="space-y-2 text-sm">
                <a href="#installation" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Installation</a>
                <a href="#quick-start-node" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Quick Start (Node.js)</a>
                <a href="#quick-start-browser" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Quick Start (Browser)</a>
                <a href="#architecture" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Architecture</a>
                <a href="#api-reference" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">API Reference</a>
                <a href="#examples" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Examples</a>
                <a href="#configuration" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Configuration</a>
                <a href="#best-practices" className="block text-gray-600 hover:text-[color:var(--color-primary)] transition-colors py-1">Best Practices</a>
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
                <CodeBlock>{`# npm
npm install @antv/ava

# yarn
yarn add @antv/ava

# pnpm
pnpm add @antv/ava`}</CodeBlock>
                <p className="text-sm text-gray-500">
                  In browser environments, always import from <code className="bg-gray-100 px-1 rounded text-xs">@antv/ava/browser</code> so the
                  Node-only engines are not bundled.
                </p>
              </div>
            </section>

            {/* Quick Start — Node.js */}
            <section id="quick-start-node" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Quick Start (Node.js)
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  A complete end-to-end flow in Node.js: load data → profile the dataset → get suggested
                  queries → analyze → visualize:
                </p>
                <CodeBlock>{`import { AVA } from '@antv/ava';

// Initialize with LLM config
// engine: { type: 'duckdb' } is the default; no need to specify
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
});

// Load data from various sources — all through ava.load({ type, options })
await ava.load({ type: 'csv-file', options: { path: 'data/companies.csv' } });
await ava.load({ type: 'json', options: { data: [{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }] } });
await ava.load({ type: 'text', options: { text: '杭州 100，上海 200，北京 300' } });

// Profile the loaded dataset (no LLM call)
const profile = await ava.profile();
console.log(profile.tables[0].metrics.row_count);

// Get AI-suggested queries
const suggestions = await ava.suggest(5); // default: 3
console.log(suggestions[0]);
// { query: "What is the average GDP by city?", score: 0.95, reason: "..." }

// Ask questions in natural language
const result = await ava.analyze('What is the average GDP by city?');
console.log(result.text, result.data, result.sql);

// Generate visualization from analysis result
const viz = await ava.visualize(result);
console.log(viz?.syntax); // chart syntax for GPT-Vis

// Clean up
ava.dispose();`}</CodeBlock>
              </div>
            </section>

            {/* Quick Start — Browser */}
            <section id="quick-start-browser" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🧭</span>
                Quick Start (Browser)
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  In the browser, AVA uses a lightweight JavaScript interpreter engine and supports inline
                  data sources only (no file system or database access):
                </p>
                <CodeBlock>{`import { AVA } from '@antv/ava/browser';

const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  engine: { type: 'javascript' },
});

// Browser supports inline data sources only
await ava.load({ type: 'json', options: { data: [{ city: '杭州', gdp: 18753 }] } });
await ava.load({ type: 'csv', options: { csv: 'city,gdp\\n杭州,18753\\n上海,43214' } });

const result = await ava.analyze('What is the total GDP?');
const viz = await ava.visualize(result);

ava.dispose();`}</CodeBlock>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                Architecture
              </h2>
              <div className="space-y-6">
                <p className="text-gray-600">
                  AVA uses a modular pipeline architecture with a pluggable engine registry:
                </p>
                <div className="bg-gradient-to-r from-[color:var(--color-primary)]/10 to-transparent rounded-lg p-6 border-l-4 border-[color:var(--color-primary)]">
                  <div className="space-y-3 text-sm">
                    {[
                      ['Data Module', <>Load from multiple sources (inline CSV/JSON/text, local or remote files, or databases) via <code className="bg-white px-1 rounded">load</code></>],
                      ['Metadata Extract', 'Type inference and structural schema'],
                      ['Engine Registry', <>Pluggable analysis engines — DuckDB, JavaScript interpreter, Python, Supabase, ClickHouse</>],
                      ['Analysis Module', 'Generate &amp; execute query'],
                      ['LLM Summary', 'Natural language response'],
                      ['Visualization Module (Optional)', 'Chart generation with type detection and recommendation'],
                    ].map(([title, desc], idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <div className="ml-4 border-l-2 border-[color:var(--color-primary)]/30 h-6"></div>}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary)] text-white flex items-center justify-center font-semibold shrink-0">{idx + 1}</div>
                          <div>
                            <div className="font-semibold text-gray-800">{title}</div>
                            <div className="text-gray-600">{desc}</div>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-semibold text-gray-800">Engine Registry</p>
                  <p>
                    Engines are registered by the entry point, so the core <code className="bg-gray-100 px-1 rounded">AVA</code> class never
                    imports any engine implementation directly. This keeps Node-only engines (DuckDB, Python,
                    Supabase, ClickHouse) out of browser bundles:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><span className="font-medium text-gray-800">Node.js</span> (<code className="bg-gray-100 px-1 rounded text-xs">@antv/ava</code>): registers <code className="bg-gray-100 px-1 rounded text-xs">duckdb</code>, <code className="bg-gray-100 px-1 rounded text-xs">python</code>, <code className="bg-gray-100 px-1 rounded text-xs">clickhouse</code>, <code className="bg-gray-100 px-1 rounded text-xs">supabase</code>, and <code className="bg-gray-100 px-1 rounded text-xs">javascript</code> engines</li>
                    <li><span className="font-medium text-gray-800">Browser</span> (<code className="bg-gray-100 px-1 rounded text-xs">@antv/ava/browser</code>): registers only the <code className="bg-gray-100 px-1 rounded text-xs">javascript</code> engine</li>
                  </ul>
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
                  <MethodCard
                    method="new AVA(config: AVAConfig)"
                    desc={
                      <ul className="list-disc list-inside space-y-1">
                        <li><code className="text-[color:var(--color-primary)]">llm</code> — required model config <code>{'{ model, apiKey, baseURL? }'}</code></li>
                        <li><code className="text-[color:var(--color-primary)]">engine</code> — optional engine selection: <code>{`{ type: 'duckdb' }`}</code> (default, Node.js), <code>{`{ type: 'python' }`}</code>, <code>{`{ type: 'javascript' }`}</code> (browser-compatible), <code>{`{ type: 'supabase' }`}</code>, <code>{`{ type: 'clickhouse' }`}</code></li>
                      </ul>
                    }
                  />
                </div>

                {/* Data Loading */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Loading</h3>
                  <div className="space-y-3">
                    <MethodCard
                      method="load(config: { type, options })"
                      desc={
                        <>
                          <p>Load any data source. Returns the dataset <code>Schema</code> (<code>{'{ tables: TableSchema[] }'}</code>; a source may expose multiple tables, e.g. a MySQL database).</p>
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            <li><b>Inline</b>: <code>&apos;csv&apos;</code> <code>{'{ csv }'}</code>, <code>&apos;json&apos;</code> <code>{'{ data }'}</code>, <code>&apos;text&apos;</code> <code>{'{ text }'}</code> (extracts data from unstructured text using LLM)</li>
                            <li><b>Files</b> (Node.js only): <code>&apos;csv-file&apos;</code>, <code>&apos;json-file&apos;</code>, <code>&apos;parquet&apos;</code>, <code>&apos;excel&apos;</code> (one view per sheet) — with <code>{'{ path, headers? }'}</code> (local path or http(s) URL)</li>
                            <li><b>Databases</b> (Node.js only): <code>&apos;mysql&apos;</code>, <code>&apos;postgresql&apos;</code>, <code>&apos;mongodb&apos;</code> — all tables/collections are auto-discovered and exposed</li>
                          </ul>
                        </>
                      }
                    />
                  </div>
                </div>

                {/* Data Profiling */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Profiling</h3>
                  <MethodCard
                    method="profile(options?: ProfileOptions)"
                    desc={
                      <>
                        <p>Compute statistics for the loaded dataset without calling the LLM.</p>
                        <BulletList
                          items={[
                            <>Default metrics: <code className="bg-white px-1 rounded">row_count</code>, <code className="bg-white px-1 rounded">null_count</code>, <code className="bg-white px-1 rounded">distinct_count</code>, <code className="bg-white px-1 rounded">top_values</code>, <code className="bg-white px-1 rounded">min</code>, <code className="bg-white px-1 rounded">max</code>, <code className="bg-white px-1 rounded">mean</code></>,
                            <>Pass <code className="bg-white px-1 rounded">metrics</code> to replace the defaults; <code className="bg-white px-1 rounded">metrics: []</code> returns the enriched schema without scanning data</>,
                            <>Other built-ins: <code className="bg-white px-1 rounded">duplicate_count</code>, <code className="bg-white px-1 rounded">min_length</code>, <code className="bg-white px-1 rounded">max_length</code>, <code className="bg-white px-1 rounded">sum</code>, <code className="bg-white px-1 rounded">stddev</code>, <code className="bg-white px-1 rounded">median</code></>,
                            <><code className="bg-white px-1 rounded">top_values</code> accepts <code>limit</code> (default 3) and <code>maxDistinctRatio</code> (default 0.5)</>,
                          ]}
                        />
                      </>}
                  />
                </div>

                {/* Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis</h3>
                  <MethodCard
                    method="analyze(query: string, config?: AnalysisConfig)"
                    desc={
                      <>
                        <p>Analyze data with a natural language query.</p>
                        <BulletList
                          items={[
                            <><code className="bg-white px-1 rounded">config.strategy</code> — <code>&apos;direct&apos;</code> (default) or <code>{`{ type: 'loop', maxSteps? }`}</code> for iterative multi-step analysis (<code>maxSteps</code> defaults to 12)</>,
                            <>Returns <code className="bg-white px-1 rounded">{'{ query, text, data, sql? }'}</code> — <code>sql</code> is the executed DuckDB SQL (DuckDB engine only)</>,
                          ]}
                        />
                      </>
                    }
                  />
                </div>

                {/* Visualization */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Visualization</h3>
                  <MethodCard
                    method="visualize(analysisResult)"
                    desc={
                      <>
                        <p>Generate chart output from an analysis result. Must be called after <code>analyze()</code>.</p>
                        <BulletList
                          items={[
                            <>Returns <code className="bg-white px-1 rounded">{'{ chartType, syntax, html } | null'}</code> (<code>null</code> when no visualization intent or usable data)</>,
                            <><code className="bg-white px-1 rounded">syntax</code> — GPT-Vis chart syntax, <code className="bg-white px-1 rounded">html</code> — standalone HTML that renders the chart</>,
                          ]}
                        />
                      </>
                    }
                  />
                </div>

                {/* Suggest */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Query Suggestions</h3>
                  <MethodCard
                    method="suggest(count?: number)"
                    desc={
                      <>
                        <p>Get AI-recommended analysis queries based on dataset characteristics (default: 3).</p>
                        <BulletList
                          items={[
                            <>Returns an array of <code className="bg-white px-1 rounded">{'{ query, score, reason }'}</code>, sorted by score descending (score ranges 0–1)</>,
                          ]}
                        />
                      </>
                    }
                  />
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
                <div className="border-l-4 border-[color:var(--color-primary)] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Focused Profiling</h4>
                  <CodeBlock>{`// Request only the metrics you need
const profile = await ava.profile({
  metrics: ['row_count', 'null_count', 'distinct_count', { id: 'top_values', limit: 5 }],
});
console.log(profile.tables[0].fields[0].logicalType);`}</CodeBlock>
                </div>
                <div className="border-l-4 border-[color:var(--color-primary)] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Query Suggestions → Analysis</h4>
                  <CodeBlock>{`const suggestions = await ava.suggest(5);
console.log(suggestions[0]);
// { query: "What is the average GDP by city?", score: 0.95, reason: "..." }

// Use the top suggested query for analysis
const result = await ava.analyze(suggestions[0].query);`}</CodeBlock>
                </div>
                <div className="border-l-4 border-[color:var(--color-primary)] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Load a Remote CSV</h4>
                  <CodeBlock>{`// path also accepts http(s) URLs, e.g. OSS signed URLs (Node.js)
await ava.load({
  type: 'csv-file',
  options: { path: 'https://example.com/data.csv', headers: { Authorization: 'Bearer xxx' } },
});`}</CodeBlock>
                </div>
                <div className="border-l-4 border-[color:var(--color-primary)] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Connect a Database (Node.js)</h4>
                  <CodeBlock>{`// Every table is auto-discovered and exposed to the LLM
await ava.load({
  type: 'mysql',
  options: { host: 'localhost', database: 'mydb', user: 'root', password: 'secret' },
});
const result = await ava.analyze('Compare revenue by region');`}</CodeBlock>
                </div>
                <div className="border-l-4 border-[color:var(--color-primary)] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Iterative Multi-Step Analysis</h4>
                  <CodeBlock>{`// Let AVA run an iterative analysis loop instead of a single direct query
const result = await ava.analyze('Find the fastest growing product categories', {
  strategy: { type: 'loop', maxSteps: 6 },
});`}</CodeBlock>
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
                <p className="text-gray-600">AVA works with any OpenAI-compatible LLM provider:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">OpenAI</div>
                    <div className="font-mono text-xs text-gray-600 space-y-1">
                      <div>model: &apos;gpt-4&apos;</div>
                      <div>baseURL: &apos;https://api.openai.com/v1&apos;</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Custom Provider</div>
                    <div className="font-mono text-xs text-gray-600 space-y-1">
                      <div>model: &apos;ling-1t&apos;</div>
                      <div>baseURL: &apos;your-llm-api.com&apos;</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Engine Selection</div>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    <li><code>duckdb</code> — default in Node.js: in-memory DuckDB, LLM generates SQL</li>
                    <li><code>python</code> — LLM generates and executes Python (pandas) analysis (Node.js only)</li>
                    <li><code>javascript</code> — sandboxed JavaScript interpreter, browser-compatible</li>
                    <li><code>supabase</code> / <code>clickhouse</code> — remote SQL execution (Node.js only)</li>
                  </ul>
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
                  'Use @antv/ava/browser in browser environments to avoid bundling Node.js dependencies',
                  'Always call ava.dispose() when done to free resources',
                  'Wrap async calls in try-catch blocks for error handling',
                  'Validate data format before loading',
                  'Never expose API keys in client-side code',
                ].map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-[color:var(--color-primary)] mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{practice}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="bg-gradient-to-r from-[color:var(--color-primary)]/10 to-transparent rounded-xl p-8 border border-[color:var(--color-primary)]/20">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="https://github.com/antvis/AVA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[color:var(--color-primary)] hover:underline">
                  <span>→</span> GitHub Repository
                </a>
                <a href="https://github.com/antvis/AVA/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[color:var(--color-primary)] hover:underline">
                  <span>→</span> Report Issues
                </a>
                <a href="https://antv.vision/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[color:var(--color-primary)] hover:underline">
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