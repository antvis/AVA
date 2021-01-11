import { LevelOfMeasurement as LOM, ChartID } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { Preferences, ChartRuleConfigMap } from '../rules';
import { Mark, EncodingType, EncodingKey, Aggregation, StackType } from './vega-lite';

/**
 * @public
 */
export interface AdvisorOptions {
  /**
   * 分析目的 对应 ckb purpose
   * Comparison -- 比较
   * Trend -- 趋势
   * Distribution -- 分布
   * Rank -- 排行
   * Proportion -- 比例
   * Composition -- 组成
   */
  purpose?: string;
  /**
   * 偏好设置
   */
  preferences?: Preferences;
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
 * @public
 */
export type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });

// type Bin = { binned: boolean; step: number };

/**
 * @public
 */
export type VegaLiteEncodingSpecification = Partial<
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
      ticks?: any;
    }
  >
>;

/**
 * @public
 */
export interface SingleViewSpec {
  mark: { type: Mark; [record: string]: any };
  encoding: VegaLiteEncodingSpecification;
}

// subset of vega-lte spec
/**
 * @public
 */
export type VegaLiteSubsetSpec = SingleViewSpec | { layer: SingleViewSpec[] };

/**
 * @public
 */
export type Specification = SingleViewSpec;

/**
 * @public
 */
export interface TableDataCfg {
  rows: string[];
  values: string[];
  columns: string[];
}

/**
 * return type of data props to spec
 * @public
 */
export interface Advice {
  type: ChartID;
  // 如果有推荐有效图表，必须提规范信息，可能是 vegalite spec 也可能是 custom spec（用于 指标卡和交叉表）
  spec: Specification | TableDataCfg | null;
  score: number;
}

/**
 * @public
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
