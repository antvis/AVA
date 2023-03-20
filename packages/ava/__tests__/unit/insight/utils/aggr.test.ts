import {
  AggregatorMap,
  aggregate,
  aggregateWithMeasures,
  aggregateWithSeries,
} from '../../../../src/insight/utils/aggregate';

const data = [
  { gender: 'M', count: 40, class: 'class1', grade: 'grade1', score: 7 },
  { gender: 'F', count: 30, class: 'class1', grade: 'grade1', score: 6 },
  { gender: 'M', count: 35, class: 'class2', grade: 'grade1', score: 8 },
  { gender: 'F', count: 45, class: 'class2', grade: 'grade1', score: 9 },
  { gender: 'M', count: 20, class: 'class3', grade: 'grade1', score: 10 },
  { gender: 'F', count: 35, class: 'class3', grade: 'grade1', score: 8 },
  { gender: 'M', count: 30, class: 'class1', grade: 'grade2', score: 7 },
  { gender: 'F', count: 40, class: 'class1', grade: 'grade2', score: 5 },
  { gender: 'M', count: 25, class: 'class2', grade: 'grade2', score: 9 },
  { gender: 'F', count: 32, class: 'class2', grade: 'grade2', score: 8 },
  { gender: 'M', count: 28, class: 'class3', grade: 'grade2', score: 10 },
  { gender: 'F', count: 36, class: 'class3', grade: 'grade2', score: 9 },
];
describe('Aggregation', () => {
  test('SUM aggregation', () => {
    expect(AggregatorMap.SUM(data, 'count')).toStrictEqual(396);
  });
  test('MEAN aggregation', () => {
    expect(AggregatorMap.MEAN(data, 'count')).toStrictEqual(33);
  });
  test('MAX aggregation', () => {
    expect(AggregatorMap.MAX(data, 'count')).toStrictEqual(45);
  });
  test('MIN aggregation', () => {
    expect(AggregatorMap.MIN(data, 'count')).toStrictEqual(20);
  });
  test('COUNT aggregation', () => {
    expect(AggregatorMap.COUNT(data, 'gender')).toStrictEqual(12);
  });
  test('COUNT_DISTINCT aggregation', () => {
    expect(AggregatorMap.COUNT_DISTINCT(data, 'gender')).toStrictEqual(2);
  });

  test('aggregation', () => {
    expect(
      aggregate(data, 'grade', [
        { fieldName: 'count', method: 'SUM' },
        { fieldName: 'score', method: 'MEAN' },
      ])
    ).toEqual([
      { count: 205, grade: 'grade1', score: 8 },
      { count: 191, grade: 'grade2', score: 8 },
    ]);
  });

  test('aggregation with expandingField', () => {
    expect(aggregateWithSeries(data, 'grade', { fieldName: 'count', method: 'SUM' }, 'class')).toEqual([
      { class: 'class1', count: 70, grade: 'grade1' },
      { class: 'class2', count: 80, grade: 'grade1' },
      { class: 'class3', count: 55, grade: 'grade1' },
      { class: 'class1', count: 70, grade: 'grade2' },
      { class: 'class2', count: 57, grade: 'grade2' },
      { class: 'class3', count: 64, grade: 'grade2' },
    ]);
  });

  test('aggregation with blending measures', () => {
    expect(
      aggregateWithMeasures(data, 'grade', [
        { fieldName: 'count', method: 'SUM' },
        { fieldName: 'score', method: 'MEAN' },
      ])
    ).toEqual([
      { grade: 'grade1', measureName: 'count', value: 205 },
      { grade: 'grade1', measureName: 'score', value: 8 },
      { grade: 'grade2', measureName: 'count', value: 191 },
      { grade: 'grade2', measureName: 'score', value: 8 },
    ]);
  });
});
