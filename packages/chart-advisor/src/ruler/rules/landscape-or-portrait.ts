import { RuleModule, Info } from '../concepts/rule';

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

function hasCanvasLayout({ chartType, dataProps, preferences }: Info): boolean {
  return !!(dataProps && chartType && preferences && preferences.canvasLayout);
}

export const landscapeOrPortrait: RuleModule = {
  id: 'landscape-or-portrait',
  type: 'SOFT',
  docs: {
    lintText: 'Recommend column charts for landscape layout and bar charts for portrait layout.',
  },
  trigger: (info) => {
    return applyChartTypes.indexOf(info.chartType) !== -1 && hasCanvasLayout(info);
  },
  validator: (args): number => {
    let result = 0;
    const { chartType, preferences } = args;

    if (hasCanvasLayout(args)) {
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
