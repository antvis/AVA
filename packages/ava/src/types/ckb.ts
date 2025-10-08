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
    chartName: string;
    fields: {
      [property: string]: ChartPropertyRequirement;
    };
    limits?: Partial<
      Record<
        StatisticsFeatureKey,
        {
          number: number; // 字段特征的限制数值，比如维值数
          operator: Operator; // 操作符，大于、小于等
          params: Record<string, string[]>; // 参与运算的字段
          reason: string; // 限制原因
        } // 字段特征的限制条件
      >
    >;
  };
}
