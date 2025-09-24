import { MAX_SOFT_RULE_COEFFICIENT } from './constants';

import type { RuleModule, Info } from '../types';

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
    return applyChartTypes.includes(info.chartType) && hasCanvasLayout(info);
  },
  validator: (args): number => {
    let result = 1;
    const { chartType, preferences } = args;

    if (hasCanvasLayout(args)) {
      if (
        preferences.canvasLayout === 'portrait' &&
        ['bar_chart', 'grouped_bar_chart', 'stacked_bar_chart', 'percent_stacked_bar_chart'].includes(chartType)
      ) {
        result = MAX_SOFT_RULE_COEFFICIENT * 0.5;
      } else if (
        preferences.canvasLayout === 'landscape' &&
        ['column_chart', 'grouped_column_chart', 'stacked_column_chart', 'percent_stacked_column_chart'].includes(
          chartType
        )
      ) {
        result = MAX_SOFT_RULE_COEFFICIENT * 0.5;
      }
    }

    return result;
  },
};
