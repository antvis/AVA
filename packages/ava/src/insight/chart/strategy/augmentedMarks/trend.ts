import { Mark } from '@antv/g2';

import { lineMarkStrategy } from '../commonMarks';
import { insight2ChartStrategy } from '../chart';
import { InsightInfo, TrendInfo } from '../../../types';

export const trendAugmentedMarksStrategy = (insight: InsightInfo<TrendInfo>): Mark[] => {
  const {
    data: chartData,
    dimensions: [{ fieldName: dimensionName }],
    patterns,
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

  const lineData = points.map((point) => ({ x: point[0], y: point[1] }));

  const regressionLineMark = lineMarkStrategy({ points: lineData }, { label: `y=${m.toFixed(2)}x+${c.toFixed(2)}` });

  return [regressionLineMark];
};

export const trendStrategy = (insight: InsightInfo<TrendInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = trendAugmentedMarksStrategy(insight);
  return [chart, ...augmentedMarks];
};
