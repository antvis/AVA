import { InsightInfo } from '@antv/ava';

import { timeSeriesData } from './mockData';

export const trendInsightData: InsightInfo = {
  subspace: [],
  dimensions: [{ fieldName: 'year' }],
  measures: [
    {
      fieldName: 'pop',
      method: 'SUM',
    },
  ],
  data: timeSeriesData,
  patterns: [
    {
      trend: 'increasing',
      significance: 0.9999734542412102,
      regression: {
        r2: 1,
        points: [
          2081915132.65, 2374084399.83, 2666253667.01, 2958422934.19, 3250592201.37, 3542761468.55, 3834930735.73,
          4127100002.91, 4419269270.09, 4711438537.27, 5003607804.45,
        ],
        equation: [292169267.18, 2081915132.65],
      },
      type: 'trend',
      dimension: 'year',
      measure: 'pop',
    },
  ],
};
