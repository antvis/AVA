import { Mark } from '@antv/g2';

import { TrendInfo, InsightInfo } from '../../types';

import { lineMarkStrategy } from './commonMarks';
import { insight2ChartStrategy } from './chartStrategy';

export const trendAugmentedMarksStrategy = (insight: InsightInfo<TrendInfo>, patterns: TrendInfo[]): Mark[] => {
  const {
    data: chartData,
    dimensions: [{ fieldName: dimensionName }],
  } = insight;

  const points = chartData.map((datum, index) => {
    const {
      regression: { points },
    } = patterns[0];
    const point = points[index];
    return [datum[dimensionName], point] as [number, number];
  });

  const {
    regression: {
      equation: [m, c],
    },
  } = patterns[0];

  const regressionLineMark = lineMarkStrategy({ points }, { label: `y=${m.toFixed(2)}x+${c.toFixed(2)}` });

  return [regressionLineMark];
};

export const trendStrategy = (insight: InsightInfo<TrendInfo>, patterns: TrendInfo[]): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = trendAugmentedMarksStrategy(insight, patterns);
  return [chart, ...augmentedMarks];
};
