import { CHART_PURPOSE } from '../constants/advisor';

import { AdviseChart } from './advisor';
import { Data, Meta } from './data';

export type TrendData = Array<{
  time: string;
  value: number;
  group?: string;
}>;

export type DistributionData = Array<{
  category: string;
  value: number;
  group?: string;
}>;

export type ComparisonData = Array<{
  name: string;
  value: number;
  group: number;
}>;

export type DataTypeMap = {
  [CHART_PURPOSE.Trend]: TrendData;
  [CHART_PURPOSE.Distribution]: DistributionData;
  [CHART_PURPOSE.Comparison]: ComparisonData;
};

export interface RenderParams {
  /** render DOM container */
  container: HTMLElement;
  chartConfig: AdviseChart;
  data: Data;
  metas: Meta[];
  uiConfig?: {
    /** chart color palette */
    palette?: string[];
    /** chart width */
    width?: number;
    /** chart height */
    height?: number;
    /** Overall chart style */
    theme?: 'default' | 'dark' | 'academy';
    backgroundColor?: string;
    /** Applicable charts: line, area, radar */
    lineWidth?: number;
  };
}

export type Renderer = (params: RenderParams) => any;
