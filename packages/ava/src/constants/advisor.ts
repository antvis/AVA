export enum CHART_NAME {
  line = 'line',
  column = 'column',
  pie = 'pie',
  bar = 'bar',
  area = 'area',
  scatter = 'scatter',
  multiple = 'multiple',
  kpiChart = 'kpiChart',
  spreadsheetPro = 'spreadsheetPro',
  funnel = 'funnel',
  sankey = 'sankey',
  radar = 'radar',
  progress = 'progress',
  table = 'table',
}

// 模型编码图表名与真实图表名映射
export const MODEL_ENCODEED_CHART_NAME_MAP = {
  l: CHART_NAME.line,
  c: CHART_NAME.column,
  p: CHART_NAME.pie,
  b: CHART_NAME.bar,
  a: CHART_NAME.area,
  s: CHART_NAME.scatter,
  m: CHART_NAME.multiple,
  k: CHART_NAME.kpiChart,
  sp: CHART_NAME.spreadsheetPro,
  f: CHART_NAME.funnel,
  sa: CHART_NAME.sankey,
  r: CHART_NAME.radar,
  pr: CHART_NAME.progress,
  t: CHART_NAME.table,
};
