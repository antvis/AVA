import { G2ChartSpec } from '../../../advisor/types';
import { InsightInfo } from '../../types';

export const insight2ChartStrategy = (insight: Omit<InsightInfo, 'visualizationSpecs'>): G2ChartSpec => {
  const { data, patterns, dimensions, measures } = insight;
  const { type: insightType } = patterns[0];
  const commonSpec: G2ChartSpec = {
    data,
    encode: {
      x: dimensions[0].fieldName,
      y: measures[0].fieldName,
    },
  };
  // pie
  if (insightType === 'majority') {
    return {
      ...commonSpec,
      type: 'pie',
      transform: [{ type: 'stackY' }],
      coordinate: { type: 'theta' },
    };
  }

  // line
  if (insightType === 'trend' || insightType === 'time_series_outlier' || insightType === 'change_point') {
    return {
      ...commonSpec,
      type: 'line',
    };
  }

  // bar
  if (insightType === 'category_outlier' || insightType === 'low_variance') {
    return {
      ...commonSpec,
      type: 'interval',
    };
  }

  // scatter
  if (insightType === 'correlation') {
    return {
      ...commonSpec,
      type: 'point',
    };
  }
  return null;
};
