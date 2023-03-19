import { Mark } from '@antv/g2';

import { TimeSeriesOutlierInfo, InsightInfo } from '../../types';

import { insight2ChartStrategy } from './chartStrategy';

const BASELINE = 'baseline';
const INTERVAL = 'interval';
const OUTLIER = 'outlier';

export const timeSeriesOutlierStrategyAugmentedMarksStrategy = (
  insight: InsightInfo<TimeSeriesOutlierInfo>,
  patterns: TimeSeriesOutlierInfo[]
): Mark[] => {
  const { baselines, thresholds } = patterns[0];
  const outlierIndexes = patterns.map((pattern) => pattern.index);
  const {
    data: chartData,
    dimensions: [{ fieldName: dimensionName }],
    measures: [{ fieldName: measureName }],
  } = insight;
  const data = chartData.map((datum, index) => {
    const baseline = baselines[index];
    const interval = [baseline - Math.abs(thresholds[0]), baseline + thresholds[1]];
    return {
      [dimensionName]: datum[dimensionName],
      baseline,
      interval,
      ...(outlierIndexes.includes(index) ? { [OUTLIER]: datum[measureName] } : undefined),
    };
  });

  const baselineMark: Mark = {
    type: 'line',
    data,
    encode: {
      x: dimensionName,
      y: BASELINE,
    },
    style: {
      lineWidth: 2,
      stroke: '#ffa45c',
    },
    tooltip: {
      title: '',
      items: [{ name: BASELINE, channel: 'y' }],
    },
  };

  const intervalMark: Mark = {
    type: 'area',
    data,
    encode: {
      x: dimensionName,
      y: INTERVAL,
    },
    style: {
      fillOpacity: 0.3,
      fill: '#ffd8b8',
    },
    tooltip: {
      title: '',
      items: [
        (d, i, data, column) => ({
          name: INTERVAL,
          value: `${column.y.value[i as number]}-${column.y1.value[i as number]}`,
          color: '#ffd8b8',
        }),
      ],
    },
  };

  const outlierMark: Mark = {
    type: 'point',
    data,
    encode: {
      x: dimensionName,
      y: OUTLIER,
      shape: 'point',
      size: 3,
    },
    style: {
      fill: '#f4664a',
    },
    tooltip: {
      title: '',
      items: [{ name: OUTLIER, channel: 'y' }],
    },
  };

  return [baselineMark, intervalMark, outlierMark];
};

export const timeSeriesOutlierStrategy = (
  insight: InsightInfo<TimeSeriesOutlierInfo>,
  patterns: TimeSeriesOutlierInfo[]
): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  const augmentedMarks = timeSeriesOutlierStrategyAugmentedMarksStrategy(insight, patterns);
  return [chartMark, ...augmentedMarks];
};
