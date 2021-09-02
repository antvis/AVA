import { hasSubset } from '../../utils';
import { RuleModule } from '../concepts/rule';

const applyChartTypes = ['pie_chart', 'donut_chart', 'radar_chart', 'rose_chart'];

export const seriesQtyLimit: RuleModule = {
  id: 'series-qty-limit',
  type: 'SOFT',
  docs: {
    lintText: 'Some charts should has at most N series.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;
    let { limit } = args;

    if (!Number.isInteger(limit) || limit <= 0) {
      limit = 6;
      if (chartType === 'pie_chart' || chartType === 'donut_chart' || chartType === 'rose_chart') limit = 6;
      if (chartType === 'radar_chart') limit = 8;
    }

    if (dataProps) {
      const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const seriesQty = field4Series && field4Series.count ? field4Series.count : 0;
      if (seriesQty >= 2 && seriesQty <= limit) {
        result = 2 / seriesQty;
      }
    }
    return result;
  },
};
