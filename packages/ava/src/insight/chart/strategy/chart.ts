import { Mark } from '@antv/g2';

import { InsightInfo } from '../../types';
import { PIE_RADIUS_STYLE } from '../constants';

export const insight2ChartStrategy = (insight: Omit<InsightInfo, 'visualizationSpecs'>): Mark => {
  const { data, patterns, dimensions, measures } = insight;
  const { type: insightType } = patterns[0];
  const commonSpec: Mark = {
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
      type: 'interval',
      encode: {
        color: dimensions[0].fieldName,
        y: measures[0].fieldName,
      },
      transform: [{ type: 'stackY' }],
      coordinate: {
        type: 'theta',
        innerRadius: PIE_RADIUS_STYLE.innerRadius,
        outerRadius: PIE_RADIUS_STYLE.outerRadius,
      },
      tooltip: {
        items: [{ field: dimensions[0].fieldName }, { field: measures[0].fieldName }],
      },
    };
  }

  // line
  if (insightType === 'trend' || insightType === 'time_series_outlier' || insightType === 'change_point') {
    return {
      ...commonSpec,
      type: 'line',
      style: {
        lineWidth: 2,
      },
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
