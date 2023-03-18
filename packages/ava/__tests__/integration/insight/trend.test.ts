import '@testing-library/jest-dom/extend-expect';

import { getInsights } from '../../../src';
import { ChangePointInfo, TimeSeriesOutlierInfo, TrendInfo } from '../../../src/insight/types';

expect.extend({
  toBeCloseToOutlierOrChangePointInfo(
    received: ChangePointInfo | TimeSeriesOutlierInfo,
    argument: ChangePointInfo | TimeSeriesOutlierInfo
  ) {
    // 只比对insight类型和突变/outlier的位置
    const pass = received?.index === argument?.index && received?.type === argument?.type;
    return {
      message: () => `information of change point or outlier expect to be ${argument}`,
      pass,
    };
  },
  toBeCloseToTrendInfo(received: TrendInfo, argument: TrendInfo) {
    // 只比对趋势类型（increasing/decreasing）是否相同以及显著性水平相近
    const pass = received?.trend === argument?.trend && received?.significance - argument?.significance < 0.01;
    return {
      message: () => `information of trend expect to be ${argument}`,
      pass,
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
    expect(result.insights[0]?.patterns?.[0] as ChangePointInfo).toBeCloseToOutlierOrChangePointInfo({
      type: 'change_point',
      index: 6,
      x: '2006',
      y: 9,
    });
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
    expect(result.insights[0]?.patterns?.[0] as TimeSeriesOutlierInfo).toBeCloseToOutlierOrChangePointInfo({
      type: 'time_series_outlier',
      index: 4,
      x: '2004',
      y: 7,
    });
  });

  test('trend', async () => {
    const increasingData = [
      { year: '2000', value: 1 },
      { year: '2001', value: 2 },
      { year: '2002', value: 3 },
      { year: '2003', value: 3 },
      { year: '2004', value: 5 },
      { year: '2005', value: 7 },
      { year: '2006', value: 6 },
      { year: '2007', value: 9 },
      { year: '2008', value: 9 },
      { year: '2009', value: 10 },
    ];
    const increasingResult = getInsights(increasingData, {
      insightTypes: ['trend'],
      dimensions: ['year'],
    });
    expect(increasingResult.insights[0]?.patterns?.[0] as TrendInfo).toBeCloseToTrendInfo({
      type: 'trend',
      trend: 'increasing',
      significance: 0.995,
    });

    const decreasingData = [
      { year: '2000', value: -1 },
      { year: '2001', value: 2 },
      { year: '2002', value: -3 },
      { year: '2003', value: -3.9 },
      { year: '2004', value: -5 },
      { year: '2005', value: -4 },
      { year: '2006', value: -5.6 },
      { year: '2007', value: -9 },
      { year: '2008', value: -7.9 },
      { year: '2009', value: -7 },
    ];
    const decreasingResult = getInsights(decreasingData, {
      insightTypes: ['trend'],
      dimensions: ['year'],
    });
    expect(decreasingResult.insights[0]?.patterns?.[0] as TrendInfo).toBeCloseToTrendInfo({
      type: 'trend',
      trend: 'decreasing',
      significance: 0.995,
    });
  });
});
