import type { ChartSpec } from '../../../common/types';
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

export const barWithoutAxisMin: RuleModule = {
  id: 'bar-without-axis-min',
  type: 'DESIGN',
  docs: {
    lintText: 'It is not recommended to set the minimum value of axis for the bar or column chart.',
    fixText: 'Remove the minimum value config of axis.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.includes(chartType);
  },
  optimizer: (_, chartSpec: ChartSpec): object => {
    const { scale } = chartSpec;
    if (!scale) return {};
    const xMin = scale.x?.domainMin;
    const yMin = scale.y?.domainMin;
    if (xMin || yMin) {
      const newScale = JSON.parse(JSON.stringify(scale));
      if (xMin) newScale.x.domainMin = 0;
      if (yMin) newScale.y.domainMin = 0;
      return { scale: newScale };
    }
    return {};
  },
};
