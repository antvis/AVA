import { RuleModule } from '../concepts/rule';

export const landscapeOrPortrait: RuleModule = {
  id: 'landscape-or-portrait',
  type: 'SOFT',
  chartTypes: [
    'bar_chart',
    'grouped_bar_chart',
    'stacked_bar_chart',
    'percent_stacked_bar_chart',
    'column_chart',
    'grouped_column_chart',
    'stacked_column_chart',
    'percent_stacked_column_chart',
  ],
  docs: {
    lintText: 'Recommend column charts for landscape layout and bar charts for portrait layout.',
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType, preferences } = args;

    if (dataProps && chartType && preferences && preferences.canvasLayout) {
      if (
        preferences.canvasLayout === 'portrait' &&
        ['bar_chart', 'grouped_bar_chart', 'stacked_bar_chart', 'percent_stacked_bar_chart'].includes(chartType)
      ) {
        result = 1;
      } else if (
        preferences.canvasLayout === 'landscape' &&
        ['column_chart', 'grouped_column_chart', 'stacked_column_chart', 'percent_stacked_column_chart'].includes(
          chartType
        )
      ) {
        result = 1;
      }
    }

    return result;
  },
};
