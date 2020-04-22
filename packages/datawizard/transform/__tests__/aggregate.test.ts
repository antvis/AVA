import { aggregate } from '../src';
import { RowData } from '../src/util/helper';

const rows: RowData[] = [
  { count: 1, type: 'A' },
  { count: 3, type: 'B' },
  { count: 4, type: 'B' },
  { count: 9, type: 'A' },
  { count: 8, type: 'B' },
  { count: 1, type: 'A' },
  { count: 2, type: 'A' },
  { count: 5, type: 'C' },
  { count: 0, type: 'A' },
  { count: 7, type: 'C' },
];

test('aggregate', () => {
  expect(
    aggregate(rows, {
      groupBy: 'type',
      as: ['count'],
      op: ['count'],
    })
  ).toEqual([
    { count: 5, type: 'A' },
    { count: 3, type: 'B' },
    { count: 2, type: 'C' },
  ]);
});

test('aggregate', () => {
  expect(
    aggregate(rows, {
      fields: ['count'],
      groupBy: 'type',
      as: ['sum'],
      op: ['sum'],
    })
  ).toEqual([
    { sum: 13, count: 1, type: 'A' },
    { sum: 15, count: 3, type: 'B' },
    { sum: 12, count: 5, type: 'C' },
  ]);
});

test('aggregate', () => {
  expect(
    aggregate([{ uid: 'a' }, { uid: 'a' }, { uid: 'b' }, { uid: 'c' }, { uid: 'a' }], {
      fields: ['uid'],
      as: ['count'],
      op: ['distinct'],
    })
  ).toEqual([{ count: 3, uid: 'a' }]);
});
