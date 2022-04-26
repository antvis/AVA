import { hasSubset } from '../../utils';

import type { RuleModule } from '../interface';

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
    let result = 0;
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

        result = Math.abs(maxProduct - Math.abs(scaledProduct)) / maxProduct;
      }
    }

    return result;
  },
};
