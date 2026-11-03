import en from '../../../messages/en.json';
import zh from '../../../messages/zh.json';
import type { Locale } from '../../../lib/i18n';
import type { DualAxesConfig } from '@antv/gpt-vis';
import type { Message, ToolStep } from '../types';

import { MONTHLY_SALES } from '../constants';

/** One result set for the chart and its inspectable data table. */
export const ARTIFACT_DATA = MONTHLY_SALES.map(({ month, revenue, gross_profit }) => ({
  month: new Date(month).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
  revenue_k: revenue / 1000,
  gross_profit_k: gross_profit / 1000,
  margin_pct: Number(((100 * gross_profit) / revenue).toFixed(1)),
}));

export const CHART_CONFIG = {
  type: 'dual-axes',
  categories: ARTIFACT_DATA.map((row) => row.month),
  series: [
    { type: 'column', axisYTitle: 'Revenue ($k)', data: ARTIFACT_DATA.map((row) => row.revenue_k) },
    { type: 'line', axisYTitle: 'Gross margin (%)', data: ARTIFACT_DATA.map((row) => row.margin_pct) },
  ],
  axisXTitle: '2026',
  theme: 'default',
  style: { palette: ['#7ce2ff', '#f28e82'], backgroundColor: 'transparent', startAtZero: true },
} satisfies DualAxesConfig;

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
      { text: 'recommend() selects dual-axes and generates a GPT-Vis JSON config.' },
      { text: 'viz() wraps the config in HTML; visualize() returns chartType, config and html.' },
      { text: 'Revenue columns ($k) + gross-margin line (%), with labeled axes starting at zero.' },
    ],
  },
];

export const PRESET_MESSAGES: Message[] = [
  { role: 'user', text: en.Demo.question, attachments: ['monthly-sales-2026.csv'] },
  {
    role: 'assistant',
    steps: RUN_STEPS,
    text: en.Demo.summary,
    artifact: {
      id: 'demo-growth-quality',
      title: 'growth-quality.html',
      description: en.Demo.description,
      report: {
        question: en.Demo.question,
        answer: en.Demo.answer,
        insight: en.Demo.insight,
        limitations: en.Demo.limitations,
      },
      config: CHART_CONFIG,
      code: ARTIFACT_SQL,
      data: ARTIFACT_DATA,
    },
  },
];

export function getDemoMessages(locale: Locale): Message[] {
  if (locale === 'en') return PRESET_MESSAGES;
  const text = zh.Demo;
  const steps = CHINESE_STEPS;
  const data = ARTIFACT_DATA.map((row, i) => ({ ...row, month: `${String(i + 1).padStart(2, '0')}月` }));
  const config = {
    ...CHART_CONFIG,
    categories: data.map((row) => row.month),
    series: CHART_CONFIG.series.map((series, i) => ({ ...series, axisYTitle: i === 0 ? text.revenue : text.margin })),
  };
  return [
    { ...PRESET_MESSAGES[0], text: text.question },
    {
      ...PRESET_MESSAGES[1],
      text: text.summary,
      steps: RUN_STEPS.map((step, i) => ({
        ...step,
        label: steps[i].label,
        chip: steps[i].chip ?? step.chip,
        detail: steps[i].detail.map((line) => ({ text: line })),
      })),
      artifact: {
        ...PRESET_MESSAGES[1].artifact!,
        description: text.description,
        report: { question: text.question, answer: text.answer, insight: text.insight, limitations: text.limitations },
        config,
        data,
        code: ARTIFACT_SQL.replace(
          "strftime(CAST(month AS DATE), '%b')",
          "strftime(CAST(month AS DATE), '%m') || '月'"
        ),
      },
    },
  ];
}

const CHINESE_STEPS: { label: string; chip?: string; detail: string[] }[] = [
  {
    label: '读取月度销售数据',
    detail: [
      'monthly-sales-2026.csv → DuckDB 视图 data',
      '共 9 条月度记录，覆盖 2026 年 1—9 月；收入和毛利单位为美元。',
    ],
  },
  {
    label: '检查结构与数据质量',
    detail: [
      'month: DATE · revenue: BIGINT · gross_profit: BIGINT',
      '9 个月份互不重复，无缺失值，各月收入均为正。',
      '将统计结果加入上下文，供后续分析使用。',
    ],
  },
  {
    label: '把业务问题转成 SQL',
    detail: [
      '使用直接分析策略，结合表结构与统计信息生成查询。',
      '按月份比较收入、毛利与毛利率，并保留时间顺序。',
      '毛利率按总毛利 ÷ 总收入计算，不直接平均百分比。',
    ],
  },
  {
    label: '执行只读查询',
    chip: 'DuckDB · 返回 9 行',
    detail: [
      '收入从 1 月的 12 万美元增长到 9 月的 26 万美元。',
      '7 月收入 23.8 万美元，毛利 4.522 万美元，毛利率 19%。',
      '同时返回 SQL 和查询结果，方便核对。',
    ],
  },
  {
    label: '关注增长背后的盈利变化',
    chip: '收入增长，未必带来同等的利润增长',
    detail: [
      '6 月到 7 月：收入增长 13.3%，毛利下降 2.1%，毛利率下降 3 个百分点。',
      '9 月毛利率恢复至 27%，仍比 1 月低 3 个百分点。',
      '这些数字提示了排查方向，但不能直接归因于折扣或成本。',
    ],
  },
  {
    label: '生成双轴图',
    detail: [
      'recommend() 选择 dual-axes，并生成 GPT-Vis JSON 配置。',
      'viz() 将配置渲染为 HTML；visualize() 返回 chartType、config 和 html。',
      '柱形展示收入（千美元），折线展示毛利率（%），两侧坐标轴均从零开始。',
    ],
  },
];
