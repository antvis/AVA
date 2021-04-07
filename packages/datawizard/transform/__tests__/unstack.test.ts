import { unstack } from '../src';
import { RowData } from '../src/util/helper';

const rows: RowData[] = [
  { d1: 'one', d2: 'a', m1: 1, m2: 3 },
  { d1: 'one', d2: 'b', m1: 2, m2: 4 },
  { d1: 'two', d2: 'a', m1: 5, m2: 6 },
  { d1: 'two', d2: 'b', m1: 7, m2: 8 },
];

test('basic', () => {
  expect(unstack(rows, 'd2', ['m1', 'm2'])).toEqual([
    { d1: 'one', m1_a: 1, m1_b: 2, m2_a: 3, m2_b: 4 },
    { d1: 'two', m1_a: 5, m1_b: 7, m2_a: 6, m2_b: 8 },
  ]);
});

test('measure used as dim', () => {
  expect(unstack(rows, 'd2', ['m1'])).toEqual([
    { d1: 'one', m1_a: 1, m2: 3 },
    { d1: 'one', m1_b: 2, m2: 4 },
    { d1: 'two', m1_a: 5, m2: 6 },
    { d1: 'two', m1_b: 7, m2: 8 },
  ]);
});

const rows2: RowData[] = [
  { d1: 'one', d2: 'a', m1: 1 },
  { d1: 'one', d2: 'b', m1: 2 },
  { d1: 'two', d2: 'a', m1: 5 },
  { d1: 'three', d2: 'b', m1: 7 },
];

test('can null', () => {
  expect(unstack(rows2, 'd2', ['m1'])).toEqual([
    { d1: 'one', m1_a: 1, m1_b: 2 },
    { d1: 'two', m1_a: 5 },
    { d1: 'three', m1_b: 7 },
  ]);
});
