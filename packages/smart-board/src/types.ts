import type { Measure } from '@antv/lite-insight';

export type ConnectionType = 'SAME_DIMENSION' | 'SAME_MEASURE' | 'SAME_INSIGHT_TYPE';

/** Subspace Array */
export type Subspace = {
  dimension: string;
  value: string;
}[];

/** Insight Type */
export type InsightType =
  | 'category_outlier'
  | 'trend'
  | 'change_point'
  | 'time_series_outlier'
  | 'majority'
  | 'low_variance'
  | 'correlation';

/** Chart Type */
export type ChartType =
  | 'line_chart'
  | 'column_chart'
  | 'pie_chart'
  | 'grouped_column_chart'
  | 'stack_column_chart'
  | 'scatter_plot';

/** Input Data Type */
export type Datum = Record<string, string | number>;

export type SmartBoardType = 'insight' | 'advisor' | 'chart';

export interface InputChart {
  data: Datum[];
  id?: number | string;
  measures?: string[];
  dimensions?: string[];
  subspace?: Subspace;
  dataUrl?: string;
  fieldInfo?: any;
  insightType?: InsightType;
  score?: number; // The insight score
  chartType?: string | ChartType;
  chartScore?: number;
  chartSchema?: any; // antv-spec
  description?: string | string[];
}

export interface Chart extends Omit<InputChart, 'id'> {
  id?: string;
}

/** The information of chart list */
export type ChartListInfo = InputChart[];

/** The link of chart graph */
export interface Link {
  source: string;
  target: string;
  weight: number;
  description: string[];
}

/** The chart graph */
export interface ChartGraph {
  nodes: Chart[];
  links: Link[];
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

export interface DataToBoardProps {
  inputData: Datum[];
  measures?: Measure[];
  dimensions?: string[];
  insightTypeList?: InsightType[];
  insightNumber?: number;
}
