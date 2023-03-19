import '@testing-library/jest-dom/extend-expect';
import { isEqual, isNil } from 'lodash';

import { getInsights } from '../../../src';
import {
  ChangePointInfo,
  InsightsResult,
  MajorityInfo,
  TimeSeriesOutlierInfo,
  TrendInfo,
} from '../../../src/insight/types';

// 趋势类

/**
 * 比较TimeSeriesOutlierInfo或ChangePointInfo是否符合期望
 * - 目前只看info类型和突变点或outlier位置是否相同
 * */
const isCloseToOutlierOrChangePointInfo = ({
  expectInfo,
  realInfo,
}:
  | {
      expectInfo: ChangePointInfo;
      realInfo: ChangePointInfo;
    }
  | {
      expectInfo: TimeSeriesOutlierInfo;
      realInfo: TimeSeriesOutlierInfo;
    }) => {
  return realInfo?.index === expectInfo?.index && realInfo?.type === expectInfo?.type;
};

/** 比对TrendInfo是否符合期望
 * - 只看趋势类型（increasing/decreasing）是否相同以及显著性水平的差异在期望范围内
 * */
const isCloseToTrendInfo = ({ expectInfo, realInfo }: { expectInfo: TrendInfo; realInfo: TrendInfo }) => {
  return realInfo?.trend === expectInfo?.trend && realInfo?.significance - expectInfo?.significance < 0.01;
};

// 分布类
/** 比对MajorityInfo是否符合期望
 * - 只看趋势类型（increasing/decreasing）是否相同以及显著性水平的差异在期望范围内
 * */
const isCloseToMajorityInfo = ({ expectInfo, realInfo }: { expectInfo: MajorityInfo; realInfo: MajorityInfo }) => {
  return (
    realInfo?.index === expectInfo?.index &&
    realInfo?.significance - expectInfo?.significance < 0.01 &&
    realInfo?.x === expectInfo?.x &&
    realInfo?.y === expectInfo?.y
  );
};

/**
 * @todo 补充剩余类型
 */

expect.extend({
  toBeIncludeInsights(received: InsightsResult['insights'], argument: InsightsResult['insights']) {
    // 检验计算得到的insight是否包含预期的几个类型
    const reject = argument
      .map((expectInsight) => {
        const { dimensions, measures, patterns, subspace } = expectInsight;
        // 先筛选出subSpace，dimension，measure都相同的insight
        const sameSpaceInsights = received?.filter(
          (receivedInsight) =>
            isEqual(receivedInsight.dimensions, dimensions) &&
            isEqual(receivedInsight.measures, measures) &&
            isEqual(receivedInsight.subspace, subspace)
        );
        if (sameSpaceInsights.length === 0) return false;
        // 筛选出相同类型的info
        const samePatterns = patterns.map((expectPattern) => {
          // 原则上sameSpaceInsights最多只有一个元素，找到info类型能匹配得上的
          const matchPattern = sameSpaceInsights[0].patterns?.find(
            (receivedInfo) => receivedInfo.type === expectPattern.type
          );
          // 检测相同类型的info中的信息符合要求
          if (isNil(matchPattern)) return false;
          const { type } = matchPattern;
          if (type === 'trend')
            return isCloseToTrendInfo({
              expectInfo: expectPattern as TrendInfo,
              realInfo: matchPattern,
            });
          if (type === 'change_point')
            return isCloseToOutlierOrChangePointInfo({
              expectInfo: expectPattern as ChangePointInfo,
              realInfo: matchPattern,
            });
          if (type === 'time_series_outlier')
            return isCloseToOutlierOrChangePointInfo({
              expectInfo: expectPattern as TimeSeriesOutlierInfo,
              realInfo: matchPattern,
            });
          if (type === 'majority')
            return isCloseToMajorityInfo({
              expectInfo: expectPattern as MajorityInfo,
              realInfo: matchPattern,
            });
          return false;
        });
        // 期望的pattern是否都存在于筛选出的insight中的pattern中
        return !samePatterns.includes(false);
      })
      .includes(false);
    return {
      message: () => `expect to include ${argument}`,
      pass: !reject,
    };
  },
});

describe('test for trend insight', () => {
  test('change point', async () => {
    const data = [
      { year: '2000', value: 0.3 },
      { year: '2001', value: 0.3 },
      { year: '2002', value: -0.5 },
      { year: '2003', value: 0.05 },
      { year: '2004', value: -0.2 },
      { year: '2005', value: 0.4 },
      { year: '2006', value: 9 },
      { year: '2007', value: 7 },
      { year: '2008', value: 8.5 },
      { year: '2009', value: 5 },
    ];
    const result = getInsights(data, {
      insightTypes: ['change_point'],
      dimensions: ['year'],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ field: 'value', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [],
        patterns: [
          {
            type: 'change_point',
            index: 6,
            x: '2006',
            y: 9,
          },
        ],
      },
    ]);
  });

  test('time series outlier', async () => {
    const data = [
      { year: '2000', value: 1 },
      { year: '2001', value: -1 },
      { year: '2002', value: 2 },
      { year: '2003', value: -2 },
      { year: '2004', value: 7 },
      { year: '2005', value: 3 },
      { year: '2006', value: -3 },
      { year: '2007', value: 0 },
      { year: '2008', value: 0 },
      { year: '2009', value: 1 },
    ];
    const result = getInsights(data, {
      insightTypes: ['time_series_outlier'],
      dimensions: ['year'],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ field: 'value', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [],
        patterns: [
          {
            type: 'time_series_outlier',
            index: 4,
            x: '2004',
            y: 7,
          },
        ],
      },
    ]);
  });

  test('trend', async () => {
    // 上升趋势
    const increasingData = [
      { year: '2000', increasingValue: 1 },
      { year: '2001', increasingValue: 2 },
      { year: '2002', increasingValue: 3 },
      { year: '2003', increasingValue: 3 },
      { year: '2004', increasingValue: 5 },
      { year: '2005', increasingValue: 7 },
      { year: '2006', increasingValue: 6 },
      { year: '2007', increasingValue: 9 },
      { year: '2008', increasingValue: 9 },
      { year: '2009', increasingValue: 10 },
    ];
    const increasingResult = getInsights(increasingData, {
      insightTypes: ['trend'],
      dimensions: ['year'],
    });
    expect(increasingResult.insights).toBeIncludeInsights([
      {
        measures: [{ field: 'increasingValue', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [],
        patterns: [
          {
            type: 'trend',
            trend: 'increasing',
            significance: 0.995,
          },
        ],
      },
    ]);

    // 下降趋势
    const decreasingData = [
      { year: '2000', decreasingValue: -1 },
      { year: '2001', decreasingValue: 2 },
      { year: '2002', decreasingValue: -3 },
      { year: '2003', decreasingValue: -3.9 },
      { year: '2004', decreasingValue: -5 },
      { year: '2005', decreasingValue: -4 },
      { year: '2006', decreasingValue: -5.6 },
      { year: '2007', decreasingValue: -9 },
      { year: '2008', decreasingValue: -7.9 },
      { year: '2009', decreasingValue: -7 },
    ];
    const decreasingResult = getInsights(decreasingData, {
      insightTypes: ['trend'],
      dimensions: ['year'],
    });
    expect(decreasingResult.insights).toBeIncludeInsights([
      {
        measures: [{ field: 'decreasingValue', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [],
        patterns: [
          {
            type: 'trend',
            trend: 'decreasing',
            significance: 0.995,
          },
        ],
      },
    ]);
  });

  test('multiple pattens', async () => {
    const multiPattensData = [
      { year: '2000', country: 'China', export: 10, humidity: 30 },
      { year: '2001', country: 'China', export: 11, humidity: 31 },
      { year: '2002', country: 'China', export: 13, humidity: 31 },
      { year: '2003', country: 'China', export: 20, humidity: 30 },
      { year: '2004', country: 'China', export: 15, humidity: 31 },
      { year: '2005', country: 'China', export: 18, humidity: 30 },
      { year: '2006', country: 'China', export: 22, humidity: 30 },
      { year: '2007', country: 'China', export: 20, humidity: 30 },
      { year: '2008', country: 'China', export: 29, humidity: 30 },
      { year: '2009', country: 'China', export: 33, humidity: 30 },
      { year: '2000', country: 'England', export: 21, humidity: 0.5 },
      { year: '2001', country: 'England', export: 21, humidity: 1.3 },
      { year: '2002', country: 'England', export: 23, humidity: 0.4 },
      { year: '2003', country: 'England', export: 23, humidity: 1 },
      { year: '2004', country: 'England', export: 19, humidity: 0.9 },
      { year: '2005', country: 'England', export: 20, humidity: 1.9 },
      { year: '2006', country: 'England', export: 22, humidity: 5 },
      { year: '2007', country: 'England', export: 19, humidity: 7 },
      { year: '2008', country: 'England', export: 19, humidity: 6 },
      { year: '2009', country: 'England', export: 20, humidity: 7 },
    ];
    const multiPattensResult = getInsights(multiPattensData, {
      dimensions: ['year', 'country'],
    });
    expect(multiPattensResult.insights).toBeIncludeInsights([
      {
        measures: [{ field: 'export', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [{ dimension: 'country', value: 'China' }],
        patterns: [
          {
            type: 'trend',
            trend: 'increasing',
            significance: 0.995,
          },
        ],
      },
      {
        measures: [{ field: 'export', method: 'SUM' }],
        dimensions: ['country'],
        subspace: [{ dimension: 'year', value: '2000' }],
        patterns: [
          {
            type: 'majority',
            dimension: 'country',
            measure: 'temperature',
            significance: 0.677,
            index: 1,
            x: 'England',
            y: 21,
          },
        ],
      },
      {
        measures: [{ field: 'humidity', method: 'SUM' }],
        dimensions: ['year'],
        subspace: [{ dimension: 'country', value: 'England' }],
        patterns: [
          {
            type: 'change_point',
            dimension: 'year',
            measure: 'humidity',
            significance: 0.91,
            index: 6,
            x: '2006',
            y: 5,
          },
        ],
      },
    ]);
  });
});
