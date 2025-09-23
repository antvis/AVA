import { hasSubset } from '../../utils';

import { MAX_SOFT_RULE_COEFFICIENT } from './constants';

import type { RuleModule } from '../types';

const applyChartTypes = [
  'bar_chart',
  'grouped_bar_chart',
  'stacked_bar_chart',
  'percent_stacked_bar_chart',
  'column_chart',
  'grouped_column_chart',
  'stacked_column_chart',
  'percent_stacked_column_chart',
];

export const barSeriesQty: RuleModule = {
  id: 'bar-series-qty',
  type: 'SOFT',
  docs: {
    lintText: 'Bar chart should has proper number of bars or bar groups.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.includes(chartType);
  },
  validator: (args): number => {
    let result = 1;
    const { dataProps, chartType } = args;
    if (dataProps && chartType) {
      const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const seriesQty = field4Series && field4Series.count ? field4Series.count : 0;

      if (seriesQty > 20) {
        result = 20 / seriesQty;
      }
    }
    result = result < 1 / MAX_SOFT_RULE_COEFFICIENT ? 1 / MAX_SOFT_RULE_COEFFICIENT : result;
    return result;
  },
};
