import { hasSubset } from '../../utils';

import { MAX_SOFT_RULE_COEFFICIENT } from './constants';

import type { RuleModule } from '../types';

const applyChartTypes = ['pie_chart', 'donut_chart'];

export const diffPieSector: RuleModule = {
  id: 'diff-pie-sector',
  type: 'SOFT',
  docs: {
    lintText: 'The difference between sectors of a pie chart should be large enough.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.includes(chartType);
  },
  validator: (args): number => {
    let result = 1;
    const { dataProps } = args;

    if (dataProps) {
      const intervalField = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

      if (intervalField && intervalField.sum && intervalField.rawData) {
        const { sum } = intervalField;
        const scale = 1 / sum;
        const scaledSamples = intervalField.rawData.map((v: number) => v * scale);

        const scaledProduct = scaledSamples.reduce((a: number, c: number) => a * c);

        const count = intervalField.rawData.length;
        const maxProduct = (1 / count) ** count;

        // Math.abs(maxProduct - Math.abs(scaledProduct)) / maxProduct 这个值 小于 0.5 会被认为有点问题
        result = MAX_SOFT_RULE_COEFFICIENT * 0.2 * (Math.abs(maxProduct - Math.abs(scaledProduct)) / maxProduct);
      }
    }
    result = result < 1 / MAX_SOFT_RULE_COEFFICIENT ? 1 / MAX_SOFT_RULE_COEFFICIENT : result;
    return result;
  },
};
