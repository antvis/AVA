import { RowData } from '../src/util/helper';
import { Dataset, extractors, compositeExtractor } from '../src';

const data1: RowData[] = [
  { date: '2020-01-01', quarter: 'Q1', team: 'A', population: 3, salary_cost: 6, revenue: 15 },
  { date: '2020-01-01', quarter: 'Q1', team: 'B', population: 7, salary_cost: 14, revenue: 35 },
  { date: '2020-01-01', quarter: 'Q1', team: 'C', population: 10, salary_cost: 20, revenue: 50 },
  { date: '2020-02-01', quarter: 'Q1', team: 'A', population: 4, salary_cost: 8, revenue: 20 },
  { date: '2020-02-01', quarter: 'Q1', team: 'B', population: 7, salary_cost: 14, revenue: 50 },
  { date: '2020-02-01', quarter: 'Q1', team: 'C', population: 10, salary_cost: 20, revenue: 50 },
  { date: '2020-03-01', quarter: 'Q1', team: 'A', population: 4, salary_cost: 6, revenue: 15 },
  { date: '2020-03-01', quarter: 'Q1', team: 'B', population: 10, salary_cost: 20, revenue: 35 },
  { date: '2020-03-01', quarter: 'Q1', team: 'C', population: 10, salary_cost: 20, revenue: 30 },
  { date: '2020-04-01', quarter: 'Q2', team: 'A', population: 8, salary_cost: 10, revenue: 35 },
  { date: '2020-04-01', quarter: 'Q2', team: 'B', population: 10, salary_cost: 20, revenue: 40 },
  { date: '2020-04-01', quarter: 'Q2', team: 'C', population: 10, salary_cost: 20, revenue: 35 },
  { date: '2020-05-01', quarter: 'Q2', team: 'A', population: 8, salary_cost: 14, revenue: 40 },
  { date: '2020-05-01', quarter: 'Q2', team: 'B', population: 10, salary_cost: 20, revenue: 37 },
  { date: '2020-05-01', quarter: 'Q2', team: 'C', population: 12, salary_cost: 24, revenue: 40 },
  { date: '2020-06-01', quarter: 'Q2', team: 'A', population: 11, salary_cost: 20, revenue: 22 },
  { date: '2020-06-01', quarter: 'Q2', team: 'B', population: 13, salary_cost: 30, revenue: 28 },
  { date: '2020-06-01', quarter: 'Q2', team: 'C', population: 15, salary_cost: 30, revenue: 32 },
  { date: '2020-07-01', quarter: 'Q3', team: 'A', population: 11, salary_cost: 20, revenue: 38 },
  { date: '2020-07-01', quarter: 'Q3', team: 'B', population: 13, salary_cost: 30, revenue: 42 },
  { date: '2020-07-01', quarter: 'Q3', team: 'C', population: 16, salary_cost: 29, revenue: 43 },
  { date: '2020-08-01', quarter: 'Q3', team: 'A', population: 11, salary_cost: 20, revenue: 38 },
  { date: '2020-08-01', quarter: 'Q3', team: 'B', population: 15, salary_cost: 31, revenue: 47 },
  { date: '2020-08-01', quarter: 'Q3', team: 'C', population: 16, salary_cost: 29, revenue: 48 },
  { date: '2020-09-01', quarter: 'Q3', team: 'A', population: 12, salary_cost: 22, revenue: 20 },
  { date: '2020-09-01', quarter: 'Q3', team: 'B', population: 15, salary_cost: 31, revenue: 32 },
  { date: '2020-09-01', quarter: 'Q3', team: 'C', population: 17, salary_cost: 31, revenue: 35 },
  { date: '2020-10-01', quarter: 'Q4', team: 'A', population: 14, salary_cost: 30, revenue: 39 },
  { date: '2020-10-01', quarter: 'Q4', team: 'B', population: 15, salary_cost: 28, revenue: 39 },
  { date: '2020-10-01', quarter: 'Q4', team: 'C', population: 20, salary_cost: 37, revenue: 52 },
  { date: '2020-11-01', quarter: 'Q4', team: 'A', population: 14, salary_cost: 26, revenue: 70 },
  { date: '2020-11-01', quarter: 'Q4', team: 'B', population: 17, salary_cost: 30, revenue: 80 },
  { date: '2020-11-01', quarter: 'Q4', team: 'C', population: 20, salary_cost: 36, revenue: 100 },
  { date: '2020-12-01', quarter: 'Q4', team: 'A', population: 10, salary_cost: 14, revenue: 20 },
  { date: '2020-12-01', quarter: 'Q4', team: 'B', population: 14, salary_cost: 16, revenue: 24 },
  { date: '2020-12-01', quarter: 'Q4', team: 'C', population: 30, salary_cost: 66, revenue: 40 },
];

test('dataset', () => {
  const dataset = new Dataset(data1);

  expect(dataset.dataset === data1).toBe(true);
  expect(dataset.measures.map((m) => m.name)).toEqual(['population', 'salary_cost', 'revenue']);
  expect(dataset.dimensions.map((d) => d.name)).toEqual(['date', 'quarter', 'team']);
  expect(dataset.measureTitles).toEqual(['population', 'salary_cost', 'revenue']);
  expect(dataset.dimensionTitles).toEqual(['date', 'quarter', 'team']);
});

test('subspace', () => {
  const dataset = new Dataset(data1);

  const subspace1 = dataset.subspace(['*', '*', 'A']);
  expect(subspace1.dataset.length).toBe(12);

  const siblingGroup1 = dataset.siblingGroup(subspace1, 'team');
  expect(siblingGroup1.dataset.length).toBe(36);

  const siblingGroup2 = dataset.siblingGroup(dataset.subspace(['2020-10-01', '*', 'C']), 'team');
  expect(siblingGroup2.dataset.length).toBe(3);
});

test('extractor', () => {
  const dataset = new Dataset(data1);

  const siblingGroup1 = dataset.siblingGroup(dataset.subspace(['2020-10-01', 'Q4', 'C']), 'team');
  expect(extractors.rank(siblingGroup1)).toEqual([
    [3, 2, 1],
    [2, 3, 1],
    [2, 2, 1],
  ]);
  expect(extractors.percent(siblingGroup1).map((m) => m.map((v) => Number(v.toFixed(2))))).toEqual([
    [0.29, 0.31, 0.41],
    [0.32, 0.29, 0.39],
    [0.3, 0.3, 0.4],
  ]);

  const siblingGroup2 = dataset.siblingGroup(dataset.subspace(['*', '*', 'A']), 'quarter');
  const result2 = compositeExtractor(siblingGroup2, { agg: 'sum', measure: 'population' });
  expect(result2.map((e) => e.population)).toEqual([11, 27, 34, 38]);

  const siblingGroup3 = dataset.siblingGroup(dataset.subspace(['2020-01-01', '*', 'A']), 'quarter');
  const result3 = compositeExtractor(siblingGroup3, { agg: 'sum', measure: 'population' });
  expect(result3).toStrictEqual([{ date: '2020-01-01', quarter: 'Q1', team: 'A', population: 3 }]);

  const result4 = compositeExtractor(siblingGroup2, { agg: 'sum', measure: 'population' }, [
    { extractor: 'percent', dimension: 'quarter' },
    { extractor: 'rank', dimension: 'quarter' },
  ]);
  expect(result4).toStrictEqual([
    { quarter: 'Q1', team: 'A', population_percent_rank: 4 },
    { quarter: 'Q2', team: 'A', population_percent_rank: 3 },
    { quarter: 'Q3', team: 'A', population_percent_rank: 2 },
    { quarter: 'Q4', team: 'A', population_percent_rank: 1 },
  ]);
});
