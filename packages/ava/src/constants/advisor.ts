export enum CHART_NAME {
  line = 'line',
  column = 'column',
  pie = 'pie',
  bar = 'bar',
  area = 'area',
  scatter = 'scatter',
  dualAxes = 'dualAxes',
  kpiChart = 'kpiChart',
  spreadsheetPro = 'spreadsheetPro',
  funnel = 'funnel',
  sankey = 'sankey',
  radar = 'radar',
  liquid = 'liquid',
  table = 'table',
  wordCloud = 'wordCloud',
  treemap = 'treemap',
  histogram = 'histogram',
}

// 图表缩写和全称映射
export const ABBR_AND_FULL_CHART_NAME_MAP = {
  l: CHART_NAME.line,
  c: CHART_NAME.column,
  p: CHART_NAME.pie,
  b: CHART_NAME.bar,
  a: CHART_NAME.area,
  s: CHART_NAME.scatter,
  d: CHART_NAME.dualAxes,
  k: CHART_NAME.kpiChart,
  sp: CHART_NAME.spreadsheetPro,
  f: CHART_NAME.funnel,
  sa: CHART_NAME.sankey,
  r: CHART_NAME.radar,
  li: CHART_NAME.liquid,
  t: CHART_NAME.table,
  w: CHART_NAME.wordCloud,
  tr: CHART_NAME.treemap,
  h: CHART_NAME.histogram,
};

// 图表全称和缩写映射
export const FULL_AND_ABBR_CHART_NAME_MAP = Object.keys(ABBR_AND_FULL_CHART_NAME_MAP).reduce(
  (acc, key) => ({ ...acc, [ABBR_AND_FULL_CHART_NAME_MAP[key]]: key }),
  {}
);

export enum CHART_PURPOSE {
  Comparison = 'Comparison', // 对比
  Trend = 'Trend', // 趋势
  Distribution = 'Distribution', // 分布
  Rank = 'Rank', // 排名
  Proportion = 'Proportion', // 占比
  Number = 'Number', // 数值
  Progress = 'Progress', // 进度
  Relation = 'Relation', // 关系
  Flow = 'Flow', // 流程
  Geography = 'Geography', // 地理
  Table = 'Table', // 表格
}

export const CHART_PURPOSE_NAME_MAP = {
  [CHART_PURPOSE.Comparison]: '对比',
  [CHART_PURPOSE.Trend]: '趋势',
  [CHART_PURPOSE.Distribution]: '分布',
  [CHART_PURPOSE.Rank]: '排名',
  [CHART_PURPOSE.Proportion]: '占比',
  [CHART_PURPOSE.Number]: '数值',
  [CHART_PURPOSE.Progress]: '进度',
  [CHART_PURPOSE.Relation]: '关系',
  [CHART_PURPOSE.Flow]: '流程',
  [CHART_PURPOSE.Geography]: '地理',
  [CHART_PURPOSE.Table]: '表格',
};
