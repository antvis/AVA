import DataFrame from '../../../src/dataset/data-frame';
import * as analyzer from '../../../src/analyzer';

describe('DataFrame info', () => {
  test('1D: basic type', () => {
    const df = new DataFrame(1);
    const info = df.info();
    expect(info).toStrictEqual([
      {
        count: 1,
        distinct: 1,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [1],
        valueMap: { '1': 1 },
        minimum: 1,
        maximum: 1,
        mean: 1,
        percentile5: 1,
        percentile25: 1,
        percentile50: 1,
        percentile75: 1,
        percentile95: 1,
        sum: 1,
        variance: 0,
        standardDeviation: 0,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: '0',
      },
    ]);
  });

  test('1D: array', () => {
    const df = new DataFrame([1, 2, 3]);
    const info = df.info();
    expect(info).toStrictEqual([
      {
        count: 3,
        distinct: 3,
        type: 'integer',
        recommendation: 'integer',
        missing: 0,
        rawData: [1, 2, 3],
        valueMap: { '1': 1, '2': 1, '3': 1 },
        minimum: 1,
        maximum: 3,
        mean: 2,
        percentile5: 1,
        percentile25: 1,
        percentile50: 2,
        percentile75: 3,
        percentile95: 3,
        sum: 6,
        variance: 0.6666666666666666,
        standardDeviation: 0.816496580927726,
        zeros: 0,
        levelOfMeasurements: ['Interval', 'Discrete'],
        name: '0',
      },
    ]);
  });

  test('1D: object', () => {
    const df = new DataFrame({ a: 1, b: 2, c: 3 });
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 1,
      distinct: 1,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1],
      valueMap: { '1': 1 },
      minimum: 1,
      maximum: 1,
      mean: 1,
      percentile5: 1,
      percentile25: 1,
      percentile50: 1,
      percentile75: 1,
      percentile95: 1,
      sum: 1,
      variance: 0,
      standardDeviation: 0,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    });
  });

  test('2D: array', () => {
    const df = new DataFrame([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: '0',
    });
  });

  test('2D: object array', () => {
    const df = new DataFrame(
      [
        { a: 1, b: 4, c: 7 },
        { a: 2, b: 5, c: 8 },
        { a: 3, b: 6, c: 9 },
      ],
      { columns: ['a', 'c'] }
    );

    const infos = df.info();
    const info = infos[0] as analyzer.NumberFieldInfo & { name: String };

    expect(info.count).toBe(3);
    expect(info.distinct).toBe(3);
    expect(info.type).toBe('integer');
    expect(info.recommendation).toBe('integer');
    expect(info.missing).toBe(0);
    expect(info.rawData).toStrictEqual([1, 2, 3]);
    expect(info.valueMap).toStrictEqual({ '1': 1, '2': 1, '3': 1 });
    expect(info.minimum).toBe(1);
    expect(info.maximum).toBe(3);
    expect(info.mean).toBe(2);
    expect(info.percentile5).toBe(1);
    expect(info.percentile25).toBe(1);
    expect(info.percentile50).toBe(2);
    expect(info.percentile75).toBe(3);
    expect(info.percentile95).toBe(3);
    expect(info.sum).toBe(6);
    expect(info.variance).toBe(0.6666666666666666);
    expect(info.standardDeviation).toBe(0.816496580927726);
    expect(info.zeros).toBe(0);
    expect(info.levelOfMeasurements).toStrictEqual(['Interval', 'Discrete']);
    expect(info.name).toBe('a');
  });

  test('2D: array object', () => {
    const df = new DataFrame({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });
    const infos = df.info();
    expect(infos[0]).toStrictEqual({
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    });
  });
});
