import { aggregate } from '../src';
import { RowData } from '../src/util/helper';

const rows: RowData[] = [
  { quantity: 1, type: 'A' },
  { quantity: 3, type: 'B' },
  { quantity: 4, type: 'B' },
  { quantity: 9, type: 'A' },
  { quantity: 8, type: 'B' },
  { quantity: 1, type: 'A' },
  { quantity: 2, type: 'A' },
  { quantity: 5, type: 'C' },
  { quantity: 0, type: 'A' },
  { quantity: 7, type: 'C' },
];

test('aggregate', () => {
  expect(
    aggregate(rows, {
      groupBy: 'type',
      as: ['quantity'],
      op: ['count'],
    })
  ).toEqual([
    { quantity: 5, type: 'A' },
    { quantity: 3, type: 'B' },
    { quantity: 2, type: 'C' },
  ]);
});

test('aggregate', () => {
  expect(
    aggregate(rows, {
      fields: ['quantity'],
      groupBy: 'type',
      as: ['quantity_sum'],
      op: ['sum'],
    })
  ).toEqual([
    { quantity_sum: 13, quantity: 1, type: 'A' },
    { quantity_sum: 15, quantity: 3, type: 'B' },
    { quantity_sum: 12, quantity: 5, type: 'C' },
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
