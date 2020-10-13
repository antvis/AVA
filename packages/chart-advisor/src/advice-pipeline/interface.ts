import { LevelOfMeasurement as LOM, ChartID } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { Preferences } from '../rules';
import { Mark, EncodingType, EncodingKey, Aggregation, StackType } from './vega-lite';

/**
 * @public
 */
export interface AdvisorOptions {
  /**
   * 分析目的
   */
  purpose?: string;
  /**
   * 偏好设置
   */
  preferences?: Preferences;
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述
   */
  description?: string;
}

/**
 * return type of data to data props, describe data column
 * @beta
 */
export interface FieldInfo extends DWAnalyzer.FieldInfo {
  name: string;
  levelOfMeasurements: LOM[];
}

// type Bin = { binned: boolean; step: number };

export interface SingleViewSpec {
  mark: { type: Mark; [record: string]: any };
  encoding: Partial<
    Record<
      EncodingKey,
      {
        field?: string;
        type?: EncodingType;
        bin?: boolean;
        aggregate?: Aggregation;
        stack?: StackType;
      }
    >
  >;
}

// subset of vega-lte spec
type VegaLiteSubsetSpec = SingleViewSpec | { layer: SingleViewSpec[] };

/**
 * return type of data props to spec
 * @beta
 */
export interface Advice {
  type: ChartID;
  spec: VegaLiteSubsetSpec | null;
  score: number;
}

/**
 * @beta
 */
export type ChartLibrary = 'G2Plot' | 'G2' | 'echarts';

export type G2PlotChartType = 'Line' | 'Area' | 'Column' | 'Bar' | 'Pie' | 'Rose' | 'Scatter' | 'Histogram' | 'Heatmap';

/**
 * @public
 */
export interface G2PlotConfig {
  type: G2PlotChartType;
  configs: Record<string, any>;
}

export type EChartsConfig = any;
