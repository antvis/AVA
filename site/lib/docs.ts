import { localeHref, type Locale } from './i18n';
import zh from '../messages/zh.json';

export const docs = [
  {
    slug: 'introduction',
    title: 'Introduction to AVA',
    group: 'Get started',
    description: 'AI-native visual analytics, from question to insight.',
  },
  {
    slug: 'agent-skill',
    title: 'Agent Skill',
    group: 'Get started',
    description: 'Give your agent data analysis tools, from the first question to a shareable chart.',
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
    description: 'Load inline data, files, database tables, and data from online services.',
  },
  {
    slug: 'data/schema',
    title: 'Inspect your data',
    group: 'Working with data',
    description: 'Let AVA discover the structure, inspect statistics when useful, then add business meaning.',
  },
  {
    slug: 'data/semantic',
    title: 'Define data semantics',
    group: 'Working with data',
    description: 'Write business definitions, model mappings, and reusable measures, with a worked sales example.',
  },
  {
    slug: 'data/online-services/feishu-bitable',
    title: 'Lark Base',
    group: 'Working with data',
    description: 'Create an app, grant document access, and load data from Lark Base with an illustrated guide.',
  },
  {
    slug: 'data/online-services/tencent-smartsheet',
    title: 'Tencent Docs SmartSheet',
    group: 'Working with data',
    description: 'Connect a Tencent Docs SmartSheet to AVA.',
  },
  {
    slug: 'data/online-services/github',
    title: 'GitHub',
    group: 'Working with data',
    description: 'Connect a GitHub repository to AVA.',
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
    description: 'Choose direct queries or iterative reasoning.',
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
    slug: 'engines/javascript',
    title: 'JavaScript',
    group: 'Execution engines',
    description: 'Execute JavaScript against an in-memory dataset in Node.js or the browser.',
  },
  {
    slug: 'engines/custom',
    title: 'Custom engines',
    description: 'Implement an engine in your application and register it with the SDK.',
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
    title: 'Events',
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
    description: 'Evaluation results for data context and analysis strategies.',
  },
  {
    slug: 'reference/architecture',
    title: 'Architecture & source map',
    group: 'More resources',
    description: 'Understand how the public API connects to the implementation.',
  },
] as const;

export type Doc = { slug: (typeof docs)[number]['slug']; title: string; group: string; description: string };

const legacyFeishuSlug = 'data/feishu-bitable';

export function docStaticParams() {
  return [...docs.slice(1).map((doc) => doc.slug), legacyFeishuSlug].map((slug) => ({ slug: slug.split('/') }));
}

export function findDoc(slug: string) {
  const canonical = slug === legacyFeishuSlug ? 'data/online-services/feishu-bitable' : slug;
  return docs.find((doc) => doc.slug === canonical);
}

export function localizedDoc(doc: Doc, locale: Locale): Doc {
  if (locale === 'en') return doc;
  const groups: Record<string, string> = {
    'Get started': '开始使用',
    'Working with data': '理解与接入数据',
    'Analysis & visualization': '分析与可视化',
    'Advanced usage': '进阶使用',
    'Execution engines': '执行引擎',
    'API Reference': 'API 参考',
    'More resources': '更多资源',
  };
  const translated = zh.chapters[doc.slug.replaceAll('/', '_') as keyof typeof zh.chapters];
  return { ...doc, ...translated, group: groups[doc.group] };
}

export function docHref(slug: string, locale: Locale = 'en') {
  return localeHref(slug === 'introduction' ? '/documentation/' : `/documentation/${slug}/`, locale);
}
