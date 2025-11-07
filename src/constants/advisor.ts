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
  graph = 'graph',
}

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
