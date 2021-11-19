import { ChartAntVSpec } from '@antv/antv-spec';
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

export const barWithoutAxisMin: RuleModule = {
  id: 'bar-without-axis-min',
  type: 'DESIGN',
  docs: {
    lintText: 'It is not recommended to set the minimum value of axis for the bar or column chart.',
    fixText: 'Remove the minimum value config of axis.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  optimizer: (_, chartSpec: ChartAntVSpec): object => {
    const { layer } = chartSpec;
    if (layer?.[0]?.encoding?.y?.axis?.min) {
      const fixedLayer = JSON.parse(JSON.stringify(layer));
      fixedLayer[0].encoding.y.axis.min = 0;
      return { layer: fixedLayer };
    }
    return {};
  },
};
