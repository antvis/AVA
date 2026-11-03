import type { ToolStep } from './types';

// ── Limits and defaults ────────────────────────────────────────

export const MAX_TOOL_DETAIL_LENGTH = 12_000;
export const MAX_UPLOAD_SIZE_MB = 25;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const DATASET_PREVIEW_ROWS = 5;
export const DATASET_PREVIEW_COLUMNS = 8;
export const DEFAULT_DATASET_NAME = 'monthly-sales-2026.csv';

// ── Tool steps ────────────────────────────────────────

export const TOOL_STEPS: Record<string, Omit<ToolStep, 'detail'>> = {
  source: { icon: 'read', label: 'Load dataset', chip: 'ava.source()', mono: true },
  schema: { icon: 'read', label: 'Inspect schema', chip: 'ava.schema()', mono: true },
  profile: { icon: 'read', label: 'Inspect data quality', chip: 'ava.profile()', mono: true },
  semantic: { icon: 'read', label: 'Read semantics', chip: 'ava.semantic()', mono: true },
  analyze: { icon: 'run', label: 'Analyze data', chip: 'ava.analyze(query)', mono: true },
  visualize: { icon: 'write', label: 'Create visualization', chip: 'ava.visualize(result)', mono: true },
  suggest: { icon: 'think', label: 'Suggest analysis questions', chip: 'ava.suggest(3)', mono: true },
};

// ── Prompt options ────────────────────────────────────────

export const PROMPT_SOURCES = (t: (key: string) => string) => [
  { key: 'attach', name: t('sourceAttach'), desc: t('sourceFormats'), glyph: 'clip', attach: true },
  { key: 'data', name: t('sourceMonthlySales'), desc: t('sourceMonthlySalesDetail'), glyph: 'chart' },
  { key: 'schema', name: t('sourceSchema'), desc: t('sourceSchemaDetail'), glyph: 'layers' },
  { key: 'profile', name: t('sourceProfile'), desc: t('sourceProfileDetail'), glyph: 'chart' },
];

export const PROMPT_COMMANDS = (t: (key: string) => string) => [
  { key: 'analyze', name: '/analyze', desc: t('commandAnalyze') },
  { key: 'source', name: '/source', desc: t('commandSource') },
  { key: 'schema', name: '/schema', desc: t('commandSchema') },
  { key: 'profile', name: '/profile', desc: t('commandProfile') },
  { key: 'semantic', name: '/semantic', desc: t('commandSemantic') },
  { key: 'visualize', name: '/visualize', desc: t('commandVisualize') },
  { key: 'suggest', name: '/suggest', desc: t('commandSuggest') },
];

export const PROMPT_MODELS = (t: (key: string) => string) => [
  { key: 'configured', name: t('modelConfigured'), tag: t('modelCustom') },
  { key: 'demo', name: t('modelDemo'), tag: t('modelPreview') },
];

export const ATTACH_FILES = ['monthly-sales-2026.csv', 'product-margins.xlsx', 'order-lines.parquet'];

// ── Sample dataset ────────────────────────────────────────

// Shared sample dataset for the demo and interactive AI chat.
export const MONTHLY_SALES = [
  { month: '2026-01-01', revenue: 120000, gross_profit: 36000 },
  { month: '2026-02-01', revenue: 135000, gross_profit: 41850 },
  { month: '2026-03-01', revenue: 148000, gross_profit: 44400 },
  { month: '2026-04-01', revenue: 166000, gross_profit: 46480 },
  { month: '2026-05-01', revenue: 182000, gross_profit: 47320 },
  { month: '2026-06-01', revenue: 210000, gross_profit: 46200 },
  { month: '2026-07-01', revenue: 238000, gross_profit: 45220 },
  { month: '2026-08-01', revenue: 225000, gross_profit: 51750 },
  { month: '2026-09-01', revenue: 260000, gross_profit: 70200 },
];

// ── Skill installation ────────────────────────────────────────

export const INSTALL_COMMANDS = 'npm install -g @antv/ava@4\nnpx --yes skills add antvis/AVA --skill ava --yes';
