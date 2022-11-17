import type { ChartSpec } from '../../../common/types';
import type { RuleModule } from '../type';

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
    const { layer } = chartSpec;
    const xMin = layer?.[0]?.encoding?.x?.axis?.min;
    const yMin = layer?.[0]?.encoding?.y?.axis?.min;
    if (xMin || yMin) {
      const fixedLayer = JSON.parse(JSON.stringify(layer));
      if (xMin) fixedLayer[0].encoding.x.axis.min = 0;
      if (yMin) fixedLayer[0].encoding.y.axis.min = 0;
      return { layer: fixedLayer };
    }
    return {};
  },
};
