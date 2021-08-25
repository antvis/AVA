/** Subspace Array */
type Subspace = {
  dimension: string;
  value: string;
}[];

/** Insight Type */
type InsightType =
  | 'outlier'
  | 'trend'
  | 'extreme'
  | 'proportion'
  | 'distribution'
  | 'rank'
  | 'categorization'
  | 'difference'
  | 'value'
  | 'association';

/** Chart Type */
type ChartType = 'line_chart' | 'column_chart' | 'pie_chart' | 'grouped_column_chart' | 'stack_column_chart';

export interface InputChart {
  id?: string;
  data: string;
  subspaces: Subspace[] | [];
  breakdowns: string[];
  measures: string[];
  fieldInfo?: any;
  insightType?: InsightType;
  score?: number; // The insight score
  chartType?: ChartType;
  chartSchema?: any; // antv-spec
  description?: string[];
}

export interface Chart {
  id: string;
  data: string;
  subspaces: Subspace[] | [];
  breakdowns: string[];
  measures: string[];
  fieldInfo?: any;
  insightType?: InsightType;
  score?: number; // The insight score
  chartType?: ChartType;
  chartSchema?: any; // antv-spec
  nodeValue?: number;
  description?: string[];
}

/** The information of chart list */
export type ChartListInfo = InputChart[];

/** The link of chart graph */
export interface link {
  source: string;
  target: string;
  weight: number;
  description: string[];
}

/** The chart graph */
export interface ChartGraph {
  nodes: Chart[];
  links: link[];
}

/** The chart cluster */
export type ChartCluster = Record<string, number>;

/** The chart order */
export type ChartOrder = Record<string, number>;
