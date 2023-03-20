import '@testing-library/jest-dom/extend-expect';
import { isEqual, isNil } from 'lodash';

import { getInsights } from '../../../src';
import {
  ChangePointInfo,
  LowVarianceInfo,
  MajorityInfo,
  TimeSeriesOutlierInfo,
  TrendInfo,
  CategoryOutlierInfo,
  CorrelationInfo,
  InsightInfo,
  PatternInfo,
  HomogeneousPatternInfo,
} from '../../../src/insight/types';

const isCloseToNumber = (expect: number = 0, real: number = 0) => {
  return Math.abs(real - expect) < 0.01;
};
// Trend

/**
 * Check if TimeSeriesOutlierInfo or ChangePointInfo meets expectations
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

/**
 * Check if TrendInfo meets expectations
 * */
const isCloseToTrendInfo = ({ expectInfo, realInfo }: { expectInfo: TrendInfo; realInfo: TrendInfo }) => {
  return realInfo?.trend === expectInfo?.trend && isCloseToNumber(expectInfo?.significance, realInfo?.significance);
};

// Distribution
/**
 * Check if MajorityInfo or CategoryOutlierInfo meets expectations
 * */
const isCloseToMajorityOrCategoryOutlierInfo = ({
  expectInfo,
  realInfo,
}:
  | {
      expectInfo: CategoryOutlierInfo;
      realInfo: CategoryOutlierInfo;
    }
  | {
      expectInfo: MajorityInfo;
      realInfo: MajorityInfo;
    }) => {
  return (
    realInfo?.index === expectInfo?.index &&
    isCloseToNumber(expectInfo?.significance, realInfo?.significance) &&
    realInfo?.x === expectInfo?.x &&
    realInfo?.y === expectInfo?.y
  );
};

/**
 * Check if LowVarianceInfo meets expectations
 * */
const isCloseToLowVarianceInfo = ({
  expectInfo,
  realInfo,
}: {
  expectInfo: LowVarianceInfo;
  realInfo: LowVarianceInfo;
}) => {
  return (
    realInfo?.type === expectInfo?.type &&
    isCloseToNumber(expectInfo?.significance, realInfo?.significance) &&
    realInfo?.mean === expectInfo?.mean
  );
};

// Multiple metrics
/**
 * Check if CorrelationInfo meets expectations
 * */
const isCloseToCorrelationInfo = ({
  expectInfo,
  realInfo,
}: {
  expectInfo: CorrelationInfo;
  realInfo: CorrelationInfo;
}) => {
  return (
    realInfo?.type === expectInfo?.type &&
    isCloseToNumber(expectInfo?.pcorr, realInfo?.pcorr) &&
    isCloseToNumber(expectInfo?.significance, realInfo?.significance) &&
    isEqual(realInfo?.measures, expectInfo?.measures)
  );
};

/**
 *
 */
const isCloseToHomogeneousInfo = ({
  expectInfo,
  realInfo,
}: {
  expectInfo: HomogeneousPatternInfo;
  realInfo: HomogeneousPatternInfo;
}) => {
  return (
    expectInfo?.type === realInfo?.type &&
    expectInfo?.insightType === realInfo?.insightType &&
    isEqual(realInfo?.commonSet, expectInfo?.commonSet) &&
    isEqual(realInfo?.exceptions, expectInfo?.exceptions) &&
    isCloseToNumber(expectInfo?.significance, realInfo?.significance)
  );
};

expect.extend({
  toBeIncludeInsights(
    received: InsightInfo<PatternInfo | HomogeneousPatternInfo>[],
    argument: InsightInfo<PatternInfo | HomogeneousPatternInfo>[]
  ) {
    // Check whether the calculated insight contains the expected contents
    const reject = argument
      ?.map((expectInsight) => {
        const { dimensions, measures, patterns, subspace } = expectInsight;
        // Filter out insights with the same subSpace, dimension and measure
        const sameSpaceInsights = received?.filter(
          (receivedInsight) =>
            isEqual(receivedInsight.dimensions, dimensions) &&
            isEqual(receivedInsight.measures, measures) &&
            isEqual(receivedInsight.subspace, subspace)
        );
        if (sameSpaceInsights.length === 0) return false;
        // Filter out the same type of info
        const samePatterns = patterns.map((expectPattern) => {
          // sameSpaceInsights has at most one element, find the pattern that can match the expected pattern
          const matchPattern = sameSpaceInsights[0].patterns?.find(
            (receivedInfo) => receivedInfo.type === expectPattern.type
          );
          if (isNil(matchPattern)) return false;
          const { type } = matchPattern;
          // Check whether different types of info meet expectations
          switch (type) {
            case 'trend':
              return isCloseToTrendInfo({
                expectInfo: expectPattern as TrendInfo,
                realInfo: matchPattern,
              });
            case 'change_point':
              return isCloseToOutlierOrChangePointInfo({
                expectInfo: expectPattern as ChangePointInfo,
                realInfo: matchPattern,
              });
            case 'time_series_outlier':
              return isCloseToOutlierOrChangePointInfo({
                expectInfo: expectPattern as TimeSeriesOutlierInfo,
                realInfo: matchPattern,
              });
            case 'majority':
              return isCloseToMajorityOrCategoryOutlierInfo({
                expectInfo: expectPattern as MajorityInfo,
                realInfo: matchPattern,
              });
            case 'low_variance':
              return isCloseToLowVarianceInfo({
                expectInfo: expectPattern as LowVarianceInfo,
                realInfo: matchPattern,
              });
            case 'category_outlier':
              return isCloseToMajorityOrCategoryOutlierInfo({
                expectInfo: expectPattern as CategoryOutlierInfo,
                realInfo: matchPattern,
              });
            case 'correlation':
              return isCloseToCorrelationInfo({
                expectInfo: expectPattern as CorrelationInfo,
                realInfo: matchPattern,
              });
            case 'commonness':
              return isCloseToHomogeneousInfo({
                expectInfo: expectPattern as HomogeneousPatternInfo,
                realInfo: matchPattern,
              });
            case 'exception':
              return isCloseToHomogeneousInfo({
                expectInfo: expectPattern as HomogeneousPatternInfo,
                realInfo: matchPattern,
              });
            default:
              return false;
          }
        });
        // Whether the expected pattern exists in the pattern in the filtered insight
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
      dimensions: [{ fieldName: 'year' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'value', method: 'SUM' }],
        dimensions: [{ fieldName: 'year' }],
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
      dimensions: [{ fieldName: 'year' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'value', method: 'SUM' }],
        dimensions: [{ fieldName: 'year' }],
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
    // data showing a increasing trend
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
      dimensions: [{ fieldName: 'year' }],
    });
    expect(increasingResult.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'increasingValue', method: 'SUM' }],
        dimensions: [{ fieldName: 'year' }],
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

    // data showing a decreasing trend
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
      dimensions: [{ fieldName: 'year' }],
    });
    expect(decreasingResult.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'decreasingValue', method: 'SUM' }],
        dimensions: [{ fieldName: 'year' }],
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
});

describe('test for distribution insight', () => {
  const dataWithMajorityAndOutlier = [
    { product: 'apple', yield: 160 },
    { product: 'banana', yield: 10 },
    { product: 'watermelon', yield: 5 },
    { product: 'orange', yield: 1 },
    { product: 'eggplant', yield: 2 },
    { product: 'egg', yield: 4 },
    { product: 'celery', yield: 9 },
    { product: 'mango', yield: 7 },
    { product: 'persimmon', yield: 8.5 },
    { product: 'tomato', yield: 5 },
  ];
  // 主要因素
  test('Majority', async () => {
    const result = getInsights(dataWithMajorityAndOutlier, {
      insightTypes: ['majority'],
      dimensions: [{ fieldName: 'product' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'yield', method: 'SUM' }],
        dimensions: [{ fieldName: 'product' }],
        subspace: [],
        patterns: [
          {
            type: 'majority',
            index: 0,
            significance: 0.75,
            x: 'apple',
            y: 160,
          },
        ],
      },
    ]);
  });
  // 分布均匀
  test('low variance', async () => {
    const data = [
      { product: 'apple', yield: 160, price: 5 },
      { product: 'banana', yield: 10, price: 5.1 },
      { product: 'watermelon', yield: 5, price: 5 },
      { product: 'orange', yield: 1, price: 5 },
      { product: 'eggplant', yield: 2, price: 5.5 },
      { product: 'egg', yield: 4, price: 5.7 },
      { product: 'celery', yield: 9, price: 5 },
      { product: 'mango', yield: 7, price: 5.2 },
      { product: 'persimmon', yield: 8.5, price: 5 },
      { product: 'tomato', yield: 5, price: 5 },
    ];
    const result = getInsights(data, {
      insightTypes: ['low_variance'],
      dimensions: [{ fieldName: 'product' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'price', method: 'SUM' }],
        dimensions: [{ fieldName: 'product' }],
        subspace: [],
        patterns: [
          {
            type: 'low_variance',
            significance: 0.95,
            mean: 5.15,
          },
        ],
      },
    ]);
  });
  // 异常值
  test('category outlier', async () => {
    const result = getInsights(dataWithMajorityAndOutlier, {
      insightTypes: ['category_outlier'],
      dimensions: [{ fieldName: 'product' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'yield', method: 'SUM' }],
        dimensions: [{ fieldName: 'product' }],
        subspace: [],
        patterns: [
          {
            type: 'category_outlier',
            significance: 0.998,
            index: 0,
            x: 'apple',
            y: 160,
          },
        ],
      },
    ]);
  });
});

describe('test for multiple metrics', () => {
  test('correlation', async () => {
    // data from https://stdlib.io/docs/api/latest/@stdlib/stats/pcorrtest
    const x = [0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0];
    const y = [1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4];
    const data = x.map((xi, i) => {
      return { index: i, x: xi, y: y[i] };
    });
    const result = getInsights(data, {
      insightTypes: ['correlation'],
      dimensions: [{ fieldName: 'index' }],
    });
    expect(result.insights).toBeIncludeInsights([
      {
        measures: [
          { fieldName: 'x', method: 'SUM' },
          { fieldName: 'y', method: 'SUM' },
        ],
        dimensions: [{ fieldName: 'index' }],
        subspace: [],
        patterns: [
          {
            type: 'correlation',
            significance: 0.795,
            pcorr: 0.795,
            measures: ['x', 'y'],
          },
        ],
      },
    ]);
  });

  test('homogeneous', async () => {
    const data1 = [
      { year: '2000', increasingValue: 1, country: 'abc' },
      { year: '2001', increasingValue: 2, country: 'abc' },
      { year: '2002', increasingValue: 3, country: 'abc' },
      { year: '2003', increasingValue: 3, country: 'abc' },
      { year: '2004', increasingValue: 5, country: 'abc' },
      { year: '2005', increasingValue: 7, country: 'abc' },
      { year: '2006', increasingValue: 6, country: 'abc' },
      { year: '2007', increasingValue: 9, country: 'abc' },
      { year: '2008', increasingValue: 9, country: 'abc' },
      { year: '2009', increasingValue: 10, country: 'abc' },
      { year: '2000', increasingValue: 1, country: 'jbk' },
      { year: '2001', increasingValue: 2, country: 'jbk' },
      { year: '2002', increasingValue: 3, country: 'jbk' },
      { year: '2003', increasingValue: 3, country: 'jbk' },
      { year: '2004', increasingValue: 5, country: 'jbk' },
      { year: '2005', increasingValue: 7, country: 'jbk' },
      { year: '2006', increasingValue: 6, country: 'jbk' },
      { year: '2007', increasingValue: 9, country: 'jbk' },
      { year: '2008', increasingValue: 9, country: 'jbk' },
      { year: '2009', increasingValue: 10, country: 'ike' },
      { year: '2000', increasingValue: 1, country: 'ike' },
      { year: '2001', increasingValue: 2, country: 'ike' },
      { year: '2002', increasingValue: 3, country: 'ike' },
      { year: '2003', increasingValue: 3, country: 'ike' },
      { year: '2004', increasingValue: 5, country: 'ike' },
      { year: '2005', increasingValue: 7, country: 'ike' },
      { year: '2006', increasingValue: 6, country: 'ike' },
      { year: '2007', increasingValue: 9, country: 'ike' },
      { year: '2008', increasingValue: 9, country: 'ike' },
      { year: '2009', increasingValue: 10, country: 'ike' },
      { year: '2009', increasingValue: 10, country: 'ike' },
      { year: '2000', increasingValue: 1, country: 'iuy' },
      { year: '2001', increasingValue: 2, country: 'iuy' },
      { year: '2002', increasingValue: 3, country: 'iuy' },
      { year: '2003', increasingValue: 3, country: 'iuy' },
      { year: '2004', increasingValue: 5, country: 'iuy' },
      { year: '2005', increasingValue: 7, country: 'iuy' },
      { year: '2006', increasingValue: 6, country: 'iuy' },
      { year: '2007', increasingValue: 9, country: 'iuy' },
      { year: '2008', increasingValue: 9, country: 'iuy' },
      { year: '2009', increasingValue: 10, country: 'iuy' },
    ];
    const result = getInsights(data1, {
      measures: [{ fieldName: 'increasingValue', method: 'SUM' }],
      homogeneous: true,
    });
    expect(result.homogeneousInsights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'increasingValue', method: 'SUM' }],
        dimensions: [{ fieldName: 'country' }, { fieldName: 'year' }],
        subspace: [],
        patterns: [
          {
            type: 'commonness',
            insightType: 'trend',
            commSet: ['abc', 'jbk', 'ike', 'iuy'],
            significance: 1,
            childPatterns: [
              {
                trend: 'increasing',
                significance: 0.999,
                type: 'trend',
                dimension: 'year',
                measure: 'increasingValue',
              },
            ],
          },
        ],
      },
    ]);
  });
});

describe('test for multiple insights', () => {
  test('trend and distribution insights', async () => {
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
      dimensions: [{ fieldName: 'year' }, { fieldName: 'country' }],
    });
    expect(multiPattensResult.insights).toBeIncludeInsights([
      {
        measures: [{ fieldName: 'export', method: 'SUM' }],
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
        measures: [{ fieldName: 'export', method: 'SUM' }],
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
        measures: [{ fieldName: 'humidity', method: 'SUM' }],
        dimensions: [{ fieldName: 'year' }],
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
