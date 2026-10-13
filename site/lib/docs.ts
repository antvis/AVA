export const docs = [
  {
    slug: 'introduction',
    title: 'Introduction to AVA',
    group: 'Get started',
    description: 'AI-native visual analytics, from question to insight.',
  },
  {
    slug: 'quickstart',
    title: 'Installation & Quickstart',
    group: 'Get started',
    description: 'Install AVA and go from your first dataset to a visual answer.',
  },
  {
    slug: 'data/sources',
    title: 'Data sources',
    group: 'Working with data',
    description: 'Load inline data, local or remote files, and database tables.',
  },
  {
    slug: 'data/schema',
    title: 'Understand your data',
    group: 'Working with data',
    description: 'Inspect schema and relationships, then compute profiling metrics.',
  },
  {
    slug: 'analysis/overview',
    title: 'Analyze data',
    group: 'Analysis & visualization',
    description: 'Turn a natural language question into a bounded data result and summary.',
  },
  {
    slug: 'analysis/strategies',
    title: 'Analysis strategies',
    group: 'Analysis & visualization',
    description: 'Choose direct queries, iterative reasoning, or selected profile context.',
  },
  {
    slug: 'visualization/overview',
    title: 'Generate visualizations',
    group: 'Analysis & visualization',
    description: 'Turn an analysis result or your own rows into a chart.',
  },
  {
    slug: 'configuration',
    title: 'Model configuration',
    group: 'Advanced usage',
    description: 'Connect an OpenAI-compatible provider, AI Gateway, or an AI SDK model.',
  },
  {
    slug: 'browser',
    title: 'Browser usage',
    group: 'Advanced usage',
    description: 'Use the JavaScript engine without bundling Node.js dependencies.',
  },
  {
    slug: 'engines/overview',
    title: 'Engine overview',
    group: 'Execution engines',
    description: 'Choose where data is loaded and how generated queries are executed.',
  },
  {
    slug: 'engines/duckdb',
    title: 'DuckDB',
    group: 'Execution engines',
    description: 'Run SQL analysis against inline data, files, and attached databases.',
  },
  {
    slug: 'engines/javascript',
    title: 'JavaScript',
    group: 'Execution engines',
    description: 'Execute JavaScript against an in-memory dataset in Node.js or the browser.',
  },
  {
    slug: 'engines/python',
    title: 'Python',
    group: 'Execution engines',
    description: 'Use pandas through local Python or an executor supplied by your application.',
  },
  {
    slug: 'engines/remote',
    title: 'Supabase & ClickHouse',
    group: 'Execution engines',
    description: 'Discover schemas and execute queries in a remote database.',
  },
  {
    slug: 'engines/custom',
    title: 'Custom engines',
    description: 'Implement and register a new engine inside the AVA source.',
    group: 'Execution engines',
  },
  {
    slug: 'reference/api',
    title: 'AVA API',
    description: 'Method signatures, complete input tables, defaults, and returned values.',
    group: 'API Reference',
  },
  {
    slug: 'reference/events',
    title: 'Events & lifecycle',
    group: 'API Reference',
    description: 'Observe data loading, model work, query execution, and cleanup.',
  },
  {
    slug: 'reference/cli',
    title: 'Command-line interface',
    group: 'More resources',
    description: 'Explore datasets from the terminal using persistent local sessions.',
  },
  {
    slug: 'reference/benchmarks',
    title: 'Benchmarks',
    group: 'More resources',
    description: 'Evaluation results on DataBench, BIRD, and Spider2-Lite, with instructions to run your own tests.',
  },
  {
    slug: 'reference/architecture',
    title: 'Architecture & source map',
    group: 'More resources',
    description: 'Understand how the public API connects to the implementation.',
  },
] as const;

export type Doc = (typeof docs)[number];

export function docHref(slug: string) {
  return slug === 'introduction' ? '/documentation/' : `/documentation/${slug}/`;
}
