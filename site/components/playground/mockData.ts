import type { DualAxesConfig } from '@antv/gpt-vis';
import type { Message, ToolStep, ToolDiff, ToolDiffLine } from './types';

// Illustrative monthly source data; the playground replays a demo, not a live analysis.
const MONTHLY_SALES = [
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

/** One result set for the chart and its inspectable data table. */
export const ARTIFACT_DATA = MONTHLY_SALES.map(({ month, revenue, gross_profit }) => ({
  month: new Date(month).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
  revenueK: revenue / 1000,
  grossProfitK: gross_profit / 1000,
  marginPct: Number(((100 * gross_profit) / revenue).toFixed(1)),
}));

export const CHART_CONFIG = {
  type: 'dual-axes',
  categories: ARTIFACT_DATA.map((row) => row.month),
  series: [
    { type: 'column', axisYTitle: 'Revenue ($k)', data: ARTIFACT_DATA.map((row) => row.revenueK) },
    { type: 'line', axisYTitle: 'Gross margin (%)', data: ARTIFACT_DATA.map((row) => row.marginPct) },
  ],
  title: 'Revenue & gross margin',
  axisXTitle: '2026',
  theme: 'default',
  style: { palette: ['#0891b2', '#e88245'], backgroundColor: '#ffffff', startAtZero: true },
} satisfies DualAxesConfig;

/** Native GPT-Vis syntax, matching the format returned by ava.recommend(). */
export const CHART_SYNTAX = [
  'vis dual-axes',
  `title "${CHART_CONFIG.title}"`,
  `axisXTitle "${CHART_CONFIG.axisXTitle}"`,
  `theme ${CHART_CONFIG.theme}`,
  'categories',
  ...CHART_CONFIG.categories.map((month) => `  - ${month}`),
  'series',
  ...CHART_CONFIG.series.flatMap((series) => [
    `  - type ${series.type}`,
    `    axisYTitle "${series.axisYTitle}"`,
    '    data',
    ...series.data.map((value) => `      - ${value}`),
  ]),
  'style',
  `  backgroundColor ${CHART_CONFIG.style.backgroundColor}`,
  '  startAtZero true',
  '  palette',
  ...CHART_CONFIG.style.palette.map((color) => `    - ${color}`),
].join('\n');

/** DuckDB file sources are registered as the `data` view. */
export const ARTIFACT_SQL = [
  'SELECT',
  "  strftime(CAST(month AS DATE), '%b') AS month,",
  '  ROUND(SUM(revenue) / 1000.0, 2) AS revenue_k,',
  '  ROUND(SUM(gross_profit) / 1000.0, 2) AS gross_profit_k,',
  '  ROUND(100.0 * SUM(gross_profit)',
  '    / NULLIF(SUM(revenue), 0), 1) AS margin_pct',
  'FROM data',
  "WHERE CAST(month AS DATE) >= DATE '2026-01-01'",
  "  AND CAST(month AS DATE) < DATE '2026-10-01'",
  'GROUP BY CAST(month AS DATE)',
  'ORDER BY CAST(month AS DATE);',
].join('\n');

const RUN_STEPS: ToolStep[] = [
  {
    icon: 'read',
    label: 'Loaded monthly sales',
    chip: 'ava.source({ type: "csv-file", … })',
    mono: true,
    detail: [
      { text: 'monthly-sales-2026.csv → DuckDB view: data' },
      { text: '9 monthly records · Jan–Sep 2026 · revenue and gross_profit in USD.' },
    ],
  },
  {
    icon: 'read',
    label: 'Inspected schema & data quality',
    chip: 'ava.schema() · ava.profile()',
    mono: true,
    detail: [
      { text: 'month: DATE · revenue: BIGINT · gross_profit: BIGINT' },
      { text: '9 distinct months; no missing values; revenue is positive throughout.' },
      { text: 'The profile is passed into analysis as context.' },
    ],
  },
  {
    icon: 'think',
    label: 'Translated the question into SQL',
    chip: 'ava.analyze(question)',
    mono: true,
    detail: [
      { text: 'Direct strategy: translate the question using the schema and profile.' },
      { text: 'Compare monthly revenue, gross profit and gross margin; retain time order.' },
      { text: 'Margin = SUM(gross_profit) / SUM(revenue), not an average of percentages.' },
    ],
  },
  {
    icon: 'run',
    label: 'Executed read-only SQL',
    chip: 'DuckDB · 9 result rows',
    mono: true,
    detail: [
      { text: 'Revenue grows from $120k in January to $260k in September.' },
      { text: 'July: $238k revenue, $45.22k gross profit, 19% gross margin.' },
      { text: 'Returned query results and SQL for inspection.' },
    ],
  },
  {
    icon: 'think',
    label: 'Summarized the growth trade-off',
    chip: 'Revenue ↑ does not always mean profit ↑',
    detail: [
      { text: 'Jun → Jul: revenue +13.3%, but gross profit −2.1%; margin falls 3 pp.' },
      { text: 'Sep: gross margin recovers to 27%, still 3 pp below January.' },
      { text: 'Monthly totals show where to investigate, not whether discounts or costs caused it.' },
    ],
  },
  {
    icon: 'write',
    label: 'Created a dual-axis visualization',
    chip: 'ava.visualize(result)',
    mono: true,
    detail: [
      { text: 'recommend() selects dual-axes and generates native GPT-Vis syntax.' },
      { text: 'viz() wraps the syntax in HTML; visualize() returns chartType, syntax and html.' },
      { text: 'Revenue columns ($k) + gross-margin line (%), with labeled axes starting at zero.' },
    ],
  },
];

const ASSISTANT_TEXT = `Revenue more than doubled, but profitability did not improve at the same pace.\n\n- **Growth:** $120k → $260k revenue from Jan to Sep (**+116.7%**).\n- **Watch July:** revenue rose **13.3%** from June, yet gross profit fell **2.1%**. Gross margin hit **19%**, the period low.\n- **Recovery:** September reached **27% margin** and **$70.2k gross profit**; margin was still 3 percentage points below January.\n\n**Next step:** inspect July’s discounts, product mix and unit costs before scaling the same sales tactics. These totals flag the issue, but do not establish its cause.`;

const RUN_DIFF_LINES: Record<string, ToolDiffLine[]> = {
  'analysis.sql': ARTIFACT_SQL.split('\n').map((text) => ({ text, tone: 'add' })),
  'growth-quality.vis': CHART_SYNTAX.split('\n')
    .slice(0, 6)
    .map((text) => ({ text, tone: 'add' })),
};

const RUN_DIFFS: ToolDiff[] = [
  { file: 'analysis.sql', add: ARTIFACT_SQL.split('\n').length },
  { file: 'growth-quality.vis', add: CHART_SYNTAX.split('\n').length },
];

const QUESTION =
  'Is our revenue growth profitable? Compare monthly revenue and gross margin for Jan–Sep 2026, flag the weakest month, and show the trend in a dual-axis chart.';

export const PRESET_MESSAGES: Message[] = [
  { role: 'user', text: QUESTION, attachments: ['monthly-sales-2026.csv'] },
  {
    role: 'assistant',
    steps: RUN_STEPS,
    diffs: RUN_DIFFS,
    diffLines: RUN_DIFF_LINES,
    text: ASSISTANT_TEXT,
    artifact: {
      title: 'growth-quality.html',
      description: 'Revenue & gross margin · Jan–Sep 2026 · Dual Axes',
      chart: true,
    },
  },
];

export const ARTIFACT_METRICS = [
  { label: 'Revenue growth', value: '+116.7%', detail: 'Jan → Sep' },
  { label: 'Lowest margin', value: '19%', detail: 'July · period low' },
  { label: 'Margin recovery', value: '+8 pp', detail: 'Jul → Sep' },
];

export const PROMPT_SOURCES = [
  { key: 'attach', name: 'Add data files', desc: 'CSV, Excel, JSON or Parquet', glyph: 'clip', attach: true },
  { key: 'data', name: 'Monthly sales', desc: 'monthly-sales-2026.csv · 9 rows', glyph: 'chart' },
  { key: 'schema', name: 'Data schema', desc: 'Fields and types · ava.schema()', glyph: 'layers' },
  { key: 'profile', name: 'Data profile', desc: 'Statistics and missing values · ava.profile()', glyph: 'chart' },
];

export const PROMPT_COMMANDS = [
  { key: 'suggest', name: '/suggest', desc: 'Suggest questions about the loaded data' },
  { key: 'analyze', name: '/analyze', desc: 'Translate, execute and summarize a question' },
  { key: 'visualize', name: '/visualize', desc: 'Create a chart from analysis results' },
  { key: 'profile', name: '/profile', desc: 'Inspect column statistics and data quality' },
];

export const PROMPT_MODELS = [
  { key: 'configured', name: 'Configured LLM', tag: 'Custom' },
  { key: 'demo', name: 'Demo playback', tag: 'Preview' },
];

export const ATTACH_FILES = ['monthly-sales-2026.csv', 'product-margins.xlsx', 'order-lines.parquet'];
export const DICTATION_TEXT = QUESTION;
export const SESSION = { name: 'AVA · Growth quality', path: 'Demo dataset · Jan–Sep 2026' };
export const CHART_CAPTION = 'Illustrative data · Revenue ($k, left) · Gross margin (%, right)';
