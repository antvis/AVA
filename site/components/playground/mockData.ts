import type { Message, ToolStep, ToolDiff, ToolDiffLine } from './types';

const RUN_STEPS: ToolStep[] = [
  {
    icon: 'think',
    label: 'Thinking',
    chip: 'Planning the regional trend analysis…',
    detail: [{ text: 'Compare four regions across Jun–Sep on total sales.' }, { text: 'Keep profit in scope, but lead with the trend.' }],
  },
  {
    icon: 'read',
    label: 'Loaded sales dataset',
    chip: 'sales-2026.xlsx',
    mono: true,
    detail: [{ text: '12 rows · 4 columns — region, month, sales, profit' }, { text: 'Schema validated, no nulls in key fields.' }],
  },
  {
    icon: 'run',
    label: 'Wrote analysis program',
    chip: 'ava.analyze("regional trend")',
    mono: true,
    detailMono: true,
    detail: [
      { text: '+ const trend = groupBy(data, "region", sum("sales"))', tone: 'add' },
      { text: '+ const growth = delta(trend, "month")', tone: 'add' },
    ],
  },
  {
    icon: 'run',
    label: 'Executed javascript engine',
    chip: 'exit code 0',
    mono: true,
    detailMono: true,
    detail: [{ text: '✓ 48 records aggregated into 4 series' }, { text: '✓ chartable shape: month ÷ region stacked' }],
  },
  {
    icon: 'think',
    label: 'Selected chart type',
    chip: 'stacked bar, month × region',
    detail: [{ text: 'Monthly trend across regions reads best stacked.' }, { text: 'West dominates — call it out in the summary.' }],
  },
  {
    icon: 'write',
    label: 'Drafted report artifact',
    chip: 'regional-sales-report.md',
    mono: true,
    detail: [
      { text: '+ # Regional Sales Report — Jun–Sep 2026', tone: 'add' },
      { text: '+ West leads at 6,100 total sales, up strongly every month.', tone: 'add' },
    ],
  },
];

const RUN_DIFFS: ToolDiff[] = [
  { file: 'regional-sales-report.md', add: 18 },
  { file: 'chart-spec.json', add: 12 },
  { file: 'analysis.sql', add: 9 },
];

const RUN_DIFF_LINES: Record<string, ToolDiffLine[]> = {
  'regional-sales-report.md': [
    { text: '# Regional Sales Report — Jun–Sep 2026', tone: 'ctx' },
    { text: 'West leads at 6,100 total sales.', tone: 'add' },
    { text: 'South recovered from July, closed at 1,900.', tone: 'add' },
    { text: 'East grows steadily; North flattened.', tone: 'add' },
  ],
  'chart-spec.json': [
    { text: '"type": "bar",', tone: 'ctx' },
    { text: '"stack": true,', tone: 'add' },
    { text: '"encode": { "x": "month",', tone: 'add' },
    { text: '  "y": ["West","East","South","North"] }', tone: 'add' },
  ],
  'analysis.sql': [
    { text: 'SELECT region, month,', tone: 'ctx' },
    { text: '       SUM(sales) AS total_sales', tone: 'add' },
    { text: 'FROM sales_2026 GROUP BY 1, 2;', tone: 'add' },
  ],
};

const ASSISTANT_TEXT = `I analyzed the sales dataset (12 rows across 4 regions). Here's what stands out:\n\n- **West** is the clear leader — 6,100 in total sales, up strongly June→Sep.\n- **South** recovered from a July dip and closed at its highest point (1,900).\n- **East** shows healthy, steady growth every single month.\n- **North** flattened out in Aug–Sep after a fast start.\n\nI've saved the full report and chart as an artifact.`;

export const PRESET_MESSAGES: Message[] = [
  { role: 'user', text: 'Analyze the sales data and show me the regional trend.', attachments: ['sales-2026.xlsx'] },
  {
    role: 'assistant',
    steps: RUN_STEPS,
    diffs: RUN_DIFFS,
    diffLines: RUN_DIFF_LINES,
    text: ASSISTANT_TEXT,
    artifact: { title: 'regional-sales-report.md', description: 'Sales & profit by region, Jun–Sep 2026 · stacked bar trend', chart: true },
  },
];

/** The raw chart config — shared by the chart render and the data table. */
export const CHART_CONFIG = {
  type: 'bar',
  data: [
    { month: 'Jun', West: 1200, East: 900, South: 700, North: 1000 },
    { month: 'Jul', West: 1500, East: 1000, South: 600, North: 1400 },
    { month: 'Aug', West: 1600, East: 1100, South: 1000, North: 1450 },
    { month: 'Sep', West: 1800, East: 1250, South: 1900, North: 1450 },
  ],
  encode: { x: 'month', y: ['West', 'East', 'South', 'North'] },
  stack: true,
  axis: [{ orient: 'left', title: { visible: true, text: 'Sales' } }, { orient: 'bottom', grid: 'line' }],
};

/** The analysis SQL behind the artifact. */
export const ARTIFACT_SQL = [
  'SELECT region, month,',
  '       SUM(sales)  AS total_sales,',
  '       SUM(profit) AS total_profit',
  'FROM   sales_2026',
  'WHERE  month BETWEEN \'2026-06\' AND \'2026-09\'',
  'GROUP  BY region, month',
  'ORDER  BY month, region;',
].join('\n');

/** GPT-vis markdown syntax for a stacked bar chart. */
export const CHART_SYNTAX = ['```vis-chart', JSON.stringify(CHART_CONFIG, null, 2), '```'].join('\n');

export const PROMPT_SOURCES = [
  { key: 'attach', name: 'Add photos & files', desc: 'Upload from your computer', glyph: 'clip', attach: true },
  { key: 'data', name: 'Sales data', desc: 'sales-2026.xlsx · 12 rows', glyph: 'chart' },
  { key: 'docs', name: 'Docs knowledge base', desc: 'Analysis notes & reports', glyph: 'layers' },
  { key: 'web', name: 'Web search', desc: 'Real-time news and info', glyph: 'globe' },
];

export const PROMPT_COMMANDS = [
  { key: 'analyze', name: '/analyze', desc: 'Run a full analysis pass' },
  { key: 'chart', name: '/chart', desc: 'Visualize the current dataset' },
  { key: 'summarize', name: '/summarize', desc: 'Digest the thread so far' },
  { key: 'export', name: '/export', desc: 'Export the report artifact' },
];

export const PROMPT_MODELS = [
  { key: 'ava-2', name: 'AVA 2', tag: 'Flagship' },
  { key: 'ava-2-mini', name: 'AVA 2 mini', tag: 'Fast' },
];

export const ATTACH_FILES = ['sales-2026.xlsx', 'pos-export.csv', 'summer-menu.pdf'];
export const DICTATION_TEXT = 'Analyze the sales data and show me the regional trend';

export const SESSION = { name: 'AVA Agent Session', path: 'dataset: sales.csv' };

export const CHART_CAPTION = 'generated by ava.visualize · gpt-vis · stacked bar';
