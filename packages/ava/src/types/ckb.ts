import { StatisticsFeatureKey } from './data';

export enum Operator {
  GreaterThan = 'greaterThan',
  LessThan = 'lessThan',
  Equals = 'equals',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThanOrEqual = 'lessThanOrEqual',
  NotEquals = 'notEquals',
}
// 图表属性要求定义

export interface ChartPropertyRequirement {
  min: number;
  max: number;
  dataType: string[];
  desc: string;
  optional: boolean;
}
// 图表库定义

export interface ChartLibrary {
  [chartType: string]: {
    /** 中文名 */
    chartName: string;
    /** 英文名 */
    type: string;
    /** 缩写的英文名 */
    abbrType: string;
    /** 别名 */
    alias?: string;
    /** 图表分类，趋势、分布、占比等 */
    category: string[];
    /** 图表功能 */
    chartFunction: string;
    /** 图表描述 */
    def: string;
    /** 适用场景 */
    useCase: string[];
    /** 不适用场景 */
    nonUseCase: string[];
    /** 图表字段 */
    fields: {
      [property: string]: ChartPropertyRequirement;
    };
    /** 字段特征的限制条件 */
    limits?: Partial<
      Record<
        StatisticsFeatureKey,
        {
          /** 字段特征的限制数值，比如维值数 */
          number: number;
          /** 操作符，大于、小于等 */
          operator: Operator;
          /** 参与运算的字段 */
          params: Record<string, string[]>;
          /** 限制原因 */
          reason: string;
        }
      >
    >;
  };
}
