import { CHART_PURPOSE } from '../constants/advisor';

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

export type UiConfig = {
  palette?: string[];
  width?: number;
  height?: number;
  /** Overall chart style */
  theme?: 'default' | 'dark' | 'academy';
  backgroundColor?: string;
  /** Applicable charts: line, area, radar */
  lineWidth?: number;
};

// todo: to declare
export type Renderer = any;
