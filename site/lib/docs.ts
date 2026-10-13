export const docs = [
  {
    "slug": "introduction",
    "title": "Introduction to AVA",
    "group": "Overview",
    "description": "AI-native visual analytics, from question to insight."
  },
  {
    "slug": "quickstart",
    "title": "Installation & Quickstart",
    "group": "Get started",
    "description": "Install AVA and go from your first dataset to a visual answer."
  },
  {
    "slug": "configuration",
    "title": "Model configuration",
    "group": "Get started",
    "description": "Connect an OpenAI-compatible provider, AI Gateway, or an AI SDK model."
  },
  {
    "slug": "browser",
    "title": "Browser usage",
    "group": "Get started",
    "description": "Use the JavaScript engine without bundling Node.js dependencies."
  },
  {
    "slug": "data/sources",
    "title": "Data sources",
    "group": "Working with data",
    "description": "Load inline data, local or remote files, and database tables."
  },
  {
    "slug": "data/schema",
    "title": "Schema & metadata",
    "group": "Working with data",
    "description": "Inspect tables, field types, indexes, and relationships."
  },
  {
    "slug": "data/profiling",
    "title": "Data profiling",
    "group": "Working with data",
    "description": "Compute statistics without an LLM request and enrich analysis context."
  },
  {
    "slug": "analysis/overview",
    "title": "Analyze data",
    "group": "Analysis",
    "description": "Turn a natural language question into a bounded data result and summary."
  },
  {
    "slug": "analysis/strategies",
    "title": "Analysis strategies",
    "group": "Analysis",
    "description": "Choose direct execution, iterative reasoning, or selected profile context."
  },
  {
    "slug": "analysis/queries",
    "title": "Translate & query",
    "group": "Analysis",
    "description": "Generate executable code separately from running it."
  },
  {
    "slug": "analysis/suggestions",
    "title": "Query suggestions",
    "group": "Analysis",
    "description": "Discover questions worth asking about the loaded dataset."
  },
  {
    "slug": "visualization/overview",
    "title": "Generate visualizations",
    "group": "Visualization",
    "description": "Turn an analysis result or your own rows into a chart."
  },
  {
    "slug": "visualization/chart-specs",
    "title": "Chart specifications",
    "group": "Visualization",
    "description": "Recommend a chart with the model, then render an existing spec locally."
  },
  {
    "slug": "engines/overview",
    "title": "Engine overview",
    "group": "Execution engines",
    "description": "Choose where data is loaded and how generated queries are executed."
  },
  {
    "slug": "engines/duckdb",
    "title": "DuckDB",
    "group": "Execution engines",
    "description": "Run SQL analysis against inline data, files, and attached databases."
  },
  {
    "slug": "engines/javascript",
    "title": "JavaScript",
    "group": "Execution engines",
    "description": "Execute JavaScript against an in-memory dataset in Node.js or the browser."
  },
  {
    "slug": "engines/python",
    "title": "Python",
    "group": "Execution engines",
    "description": "Use pandas through local Python or an executor supplied by your application."
  },
  {
    "slug": "engines/remote",
    "title": "Supabase & ClickHouse",
    "group": "Execution engines",
    "description": "Discover schemas and execute queries in a remote database."
  },
  {
    "slug": "reference/events",
    "title": "Events & lifecycle",
    "group": "Reference",
    "description": "Observe data loading, model work, query execution, and cleanup."
  },
  {
    "slug": "reference/cli",
    "title": "Command-line interface",
    "group": "Reference",
    "description": "Explore datasets from the terminal using persistent local sessions."
  },
  {
    "slug": "reference/architecture",
    "title": "Architecture & source map",
    "group": "Reference",
    "description": "Understand how the public API connects to the implementation."
  }
] as const;

export type Doc = (typeof docs)[number];

export function docHref(slug: string) {
  return slug === 'introduction' ? '/documentation/' : `/documentation/${slug}/`;
}

export const legacyDocs: Record<string, string> = {
  "installation": "quickstart",
  "quick-start-node": "quickstart",
  "quick-start-browser": "browser",
  "architecture": "reference/architecture",
  "api-reference": "reference/architecture",
  "examples": "analysis/overview",
  "configuration": "configuration",
  "best-practices": "quickstart"
};
