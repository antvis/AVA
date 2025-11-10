import { CHART_PURPOSE } from '../constants/advisor';

// We should export Spec and Renderer type here to avoid circular dependency between ava and gpt-vis.
// TODO: import type { Spec } from '@antv/gpt-vis';
export type Spec = any;

export type Renderer = (container: string, spec: Spec) => void;

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
  container: string;
  /** AntV-spec */
  spec: Spec;
}

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
