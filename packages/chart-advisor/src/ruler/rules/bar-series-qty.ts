import { hasSubset } from '../../utils';
import { RuleModule } from '../concepts/rule';

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
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;
    if (dataProps && chartType) {
      const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const seriesQty = field4Series && field4Series.count ? field4Series.count : 0;
      // TODO limit for this rule
      if (seriesQty >= 2 && seriesQty <= 20) {
        result = 1;
      } else if (seriesQty > 20) {
        result = 20 / seriesQty;
      }
    }
    return result;
  },
};
