import { Spec } from '@antv/gpt-vis';

import { CHART_NAME, CHART_PURPOSE } from '../constants/advisor';

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
  container: string;
  type: CHART_NAME;
  encode: {
    [property: string]: string[];
  };
  /** AntV-spec */
  spec: Spec;
  data: Data;
  metas: Meta[];
}

export type Renderer = (params: RenderParams) => void;

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
