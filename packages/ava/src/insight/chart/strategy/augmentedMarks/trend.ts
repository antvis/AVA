import { LineMark, Mark } from '@antv/g2';

import { lineMarkStrategy } from '../commonMarks';
import { insight2ChartStrategy } from '../chart';
import { InsightInfo, TrendInfo } from '../../../types';
import { TrendMark } from '../../types';

export const trendAugmentedMarksStrategy = (insight: InsightInfo<TrendInfo>): TrendMark[] => {
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

  return [
    {
      trendLine: [regressionLineMark as LineMark],
    },
  ];
};

export const trendStrategy = (insight: InsightInfo<TrendInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const trendMarks = trendAugmentedMarksStrategy(insight);
  return [chart, ...trendMarks[0].trendLine];
};
