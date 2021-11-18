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
  data: [];
  subspace: Subspace;
  dimensions: string[];
  measures: string[];
  dataUrl?: string;
  fieldInfo?: any;
  insightType?: InsightType;
  score?: number; // The insight score
  chartType?: ChartType;
  chartSchema?: any; // antv-spec
  description?: string | string[];
}

export interface Chart extends Omit<InputChart, 'id'> {
  id?: string;
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

export interface ConfigObj {
  id?: string;
  type: string;
  data: any;
  config: {
    xField?: string;
    yField?: string;
    seriesField?: string;
    isStack?: boolean;
    isGroup?: boolean;
    colorField?: string;
    angleField?: string;
  };
  score?: number;
  description?: string | string[];
}

export interface SmartBoardChartViewProps {
  chartID: string;
  chartInfo: any;
  clusterID?: string;
  interactionMode: string;
  hasInsight: boolean;
  hasLocked: boolean;
  changeConnectionID: (string: string) => void;
  quitResort: () => void;
}

export interface SmartBoardSamples {
  sampleNames: string[];
  initSampleIndex?: number;
}

export interface SmartBoardToolbarProps {
  changeMode: (d: any) => void;
  defaultMode?: string;
}

export interface SmartBoardSelectorProps {
  changeSampleIndex: (d: any) => void;
  samples: SmartBoardSamples;
}

export interface SmartBoardDashboardProps {
  chartList: ChartListInfo;
  chartGraph: ChartGraph;
  chartOrder: ChartOrder;
  chartCluster: ChartCluster;
  interactionMode?: string;
  hasInsight?: boolean;
}
