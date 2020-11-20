import { LevelOfMeasurement as LOM, ChartID } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { Preferences, ChartRuleConfigMap } from '../rules';
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
  /**
   * 是否应用设计规则
   */
  refine?: boolean;
  /**
   * 自定义调整规则
   */
  chartRuleConfigs?: ChartRuleConfigMap;
}

/**
 * return type of data to data props, describe data column
 * @beta
 */
export type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });

// type Bin = { binned: boolean; step: number };

/**
 * @beta
 */
export type VegaLiteEncodeingSpecification = Partial<
  Record<
    EncodingKey,
    {
      field?: string;
      type?: EncodingType;
      bin?: boolean;
      aggregate?: Aggregation;
      stack?: StackType;
      scale?: any;
      domain?: any;
    }
  >
>;

/**
 * @beta
 */
export interface SingleViewSpec {
  mark: { type: Mark; [record: string]: any };
  encoding: VegaLiteEncodeingSpecification;
}

// subset of vega-lte spec
/**
 * @beta
 */
export type VegaLiteSubsetSpec = SingleViewSpec | { layer: SingleViewSpec[] };

/**
 * @beta
 */
export type Specification = SingleViewSpec;

/**
 * return type of data props to spec
 * @beta
 */
export interface Advice {
  type: ChartID;
  spec: Specification | null;
  score: number;
}

/**
 * @beta
 */
export type ChartLibrary = 'G2Plot' | 'G2';

/**
 * @public
 */
export type G2PlotChartType = 'Line' | 'Area' | 'Column' | 'Bar' | 'Pie' | 'Rose' | 'Scatter' | 'Histogram' | 'Heatmap';

/**
 * @public
 */
export interface G2PlotConfig {
  type: G2PlotChartType;
  configs: Record<string, any>;
}
