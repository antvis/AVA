import { LevelOfMeasurement as LOM, ChartID } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { Preferences } from '../rules';
import { Mark, EncodingType, EncodingKey, Aggregation } from './vega-lite';

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

interface SingleViewSpec {
  mark: { type: Mark; [record: string]: any };
  encoding: Partial<
    Record<EncodingKey, { field?: string; type?: EncodingType; bin?: boolean; aggregate?: Aggregation }>
  >;
}

/**
 * subset of vega-lte spec
 * @beta
 */
export type VegaLiteSubsetSpec = SingleViewSpec | { layer: SingleViewSpec[] };

/**
 * return type of data props to spec
 * @beta
 */
export interface Advice {
  type: ChartID;
  spec: VegaLiteSubsetSpec | null;
  score: number;
}
