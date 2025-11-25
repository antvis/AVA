// 趋势类 trend
export { default as ChangePointNarrativeStrategy } from './changePoint';
export { default as TimeSeriesOutlierNarrativeStrategy } from './timeSeriesOutlier';
export { default as TrendNarrativeStrategy } from './trend';

// 分布类 distribute
export { default as MajorityNarrativeStrategy } from './majority';
export { default as LowVarianceNarrativeStrategy } from './lowVariance';
export { default as CategoryNarrativeStrategy } from './categoryOutlier';

// 多指标 multi metric
export { default as CorrelationNarrativeStrategy } from './correlation';

// 共性/例外 homogeneous
export { default as CommonnessNarrativeStrategy } from './commonness';
export { default as ExceptionNarrativeStrategy } from './exception';
