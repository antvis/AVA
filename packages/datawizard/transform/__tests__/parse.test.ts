import { RowData } from '../src/util/helper';
import { parse } from '../src/parse';

const data1: RowData[] = [
  { id: 1, name: 'nameI', type: 'A', gender: 'female', DOB: '1987-03-21', weight: 80, height: 160 },
  { id: 2, name: 'nameII', type: 'B', gender: 'female', DOB: '1991-04-27', weight: 90, height: 180 },
  { id: 3, name: 'nameIII', type: 'B', gender: 'female', DOB: '1990-05-15', weight: 60, height: 160 },
  { id: 4, name: 'nameIV', type: 'A', gender: 'female', DOB: '1982-02-09', weight: 40, height: 150 },
  { id: 5, name: 'nameV', type: 'B', gender: 'female', DOB: '1994-07-03', weight: 50, height: 155 },
  { id: 6, name: 'nameVI', type: 'A', gender: 'male', DOB: '1982-10-23', weight: 70, height: 165 },
  { id: 7, name: 'nameVII', type: 'A', gender: 'male', DOB: '1971-03-05', weight: 85, height: 185 },
  { id: 8, name: 'nameVIII', type: 'C', gender: 'male', DOB: '1978-12-12', weight: 75, height: 160 },
  { id: 9, name: 'nameIX', type: 'A', gender: 'male', DOB: '1995-08-01', weight: 65, height: 170 },
  { id: 10, name: 'nameX', type: 'C', gender: 'male', DOB: '1980-03-12', weight: 70, height: 165 },
];

// classic
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: ['gender'],
      actions: [
        {
          type: 'sum',
          field: 'weight',
          as: 'sum_weight',
        },
        {
          type: 'avg',
          field: 'height',
          as: 'avg_height',
        },
      ],
    })
  ).toEqual([
    { gender: 'female', sum_weight: 320, avg_height: 161 },
    { gender: 'male', sum_weight: 365, avg_height: 169 },
  ]);
});

// multi groupBy
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: ['gender', 'type'],
      actions: [
        {
          type: 'max',
          field: 'weight',
          as: 'max_weight',
        },
        {
          type: 'min',
          field: 'height',
          as: 'min_height',
        },
      ],
    })
  ).toEqual([
    { gender: 'female', type: 'A', max_weight: 80, min_height: 150 },
    { gender: 'female', type: 'B', max_weight: 90, min_height: 155 },
    { gender: 'male', type: 'A', max_weight: 85, min_height: 165 },
    { gender: 'male', type: 'C', max_weight: 75, min_height: 160 },
  ]);
});

// no groupBy
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: [],
      actions: [
        {
          type: 'countd',
          field: 'type',
          as: 'countd_type',
        },
      ],
    })
  ).toEqual([{ countd_type: 3 }]);
});

// no as
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: [],
      actions: [
        {
          type: 'countd',
          field: 'type',
          as: '',
        },
        {
          type: 'median',
          field: 'weight',
          as: null,
        },
        {
          type: 'min',
          field: 'height',
          as: null,
        },
      ],
    })
  ).toEqual([{ type: 3, weight: 70, height: 150 }]);
});

// count
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: ['type'],
      actions: [
        {
          type: 'count',
          field: 'id',
          as: 'c1',
        },
        {
          type: 'count',
          field: 'name',
          as: '',
        },
        {
          type: 'count',
          field: '',
          as: null,
        },
      ],
    })
  ).toEqual([
    { type: 'A', c1: 5, name: 5, new_field: 5 },
    { type: 'B', c1: 3, name: 3, new_field: 3 },
    { type: 'C', c1: 2, name: 2, new_field: 2 },
  ]);
});

// Conversions: toString, toFloat, toInt
test('parse', () => {
  expect(
    parse(
      [
        { id: 1, kpi: '3.25', height: '10.5' },
        { id: 2, kpi: '3.5', height: '10' },
        { id: 3, kpi: '3.75', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'toString',
            field: 'id',
            as: null,
          },
          {
            type: 'toFloat',
            field: 'kpi',
            as: null,
          },
          {
            type: 'toInt',
            field: 'height',
            as: 'size',
          },
        ],
      }
    )
  ).toEqual([
    { id: '1', kpi: 3.25, height: '10.5', size: 10 },
    { id: '2', kpi: 3.5, height: '10', size: 10 },
    { id: '3', kpi: 3.75, height: 9.5, size: 9 },
  ]);
});

// toString with groupBy
test('parse', () => {
  expect(
    parse(data1, {
      groupBy: [],
      actions: [
        {
          type: 'toString',
          field: 'id',
          as: null,
        },
      ],
    })
  ).toEqual([{ id: '1' }]);
});

// multi transforms
test('parse', () => {
  expect(
    parse(
      [
        { id: 1, kpi: '3.25', height: '10.5' },
        { id: 2, kpi: '3.5', height: '10' },
        { id: 3, kpi: '3.75', height: 9.5 },
      ],
      [
        {
          actions: [
            {
              type: 'toFloat',
              field: 'kpi',
              as: null,
            },
            {
              type: 'toInt',
              field: 'height',
              as: 'size',
            },
          ],
        },
        {
          groupBy: ['size'],
          actions: [
            {
              type: 'max',
              field: 'kpi',
              as: null,
            },
          ],
        },
      ]
    )
  ).toEqual([
    { kpi: 3.5, size: 10 },
    { kpi: 3.75, size: 9 },
  ]);
});

// removeNull
test('parse', () => {
  expect(
    parse(
      [
        { id: '1', height: 10.5, weight: 60 },
        { id: '2', height: null, weight: 40 },
        { id: '3', height: 9.5, weight: null },
        { id: '', height: 9.5, weight: 80 },
        { id: '5', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'removeNull',
            field: 'id',
            as: null,
          },
        ],
      }
    )
  ).toEqual([
    { id: '1', height: 10.5, weight: 60 },
    { id: '2', height: null, weight: 40 },
    { id: '3', height: 9.5, weight: null },
    { id: '5', height: 9.5 },
  ]);
});

test('parse', () => {
  expect(
    parse(
      [
        { id: '1', height: 10.5, weight: 60 },
        { id: '2', height: null, weight: 40 },
        { id: '3', height: 9.5, weight: null },
        { id: '', height: 9.5, weight: 80 },
        { id: '5', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'removeNull',
            field: 'height',
            as: null,
          },
        ],
      }
    )
  ).toEqual([
    { id: '1', height: 10.5, weight: 60 },
    { id: '3', height: 9.5, weight: null },
    { id: '', height: 9.5, weight: 80 },
    { id: '5', height: 9.5 },
  ]);
});
test('parse', () => {
  expect(
    parse(
      [
        { id: '1', height: 10.5, weight: 60 },
        { id: '2', height: null, weight: 40 },
        { id: '3', height: 9.5, weight: null },
        { id: '', height: 9.5, weight: 80 },
        { id: '5', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'removeNull',
            field: 'weight',
            as: null,
          },
        ],
      }
    )
  ).toEqual([
    { id: '1', height: 10.5, weight: 60 },
    { id: '2', height: null, weight: 40 },
    { id: '', height: 9.5, weight: 80 },
  ]);
});

// fillNull byValue
test('parse', () => {
  expect(
    parse(
      [
        { id: '1', height: 10.5, weight: 60 },
        { id: '2', height: null, weight: 40 },
        { id: '3', height: 9.5, weight: null },
        { id: '', height: 9.5, weight: 80 },
        { id: '5', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'fillNull',
            field: 'id',
            as: null,
            options: {
              type: 'byValue',
              cfg: {
                value: '-1',
              },
            },
          },
        ],
      }
    )
  ).toEqual([
    { id: '1', height: 10.5, weight: 60 },
    { id: '2', height: null, weight: 40 },
    { id: '3', height: 9.5, weight: null },
    { id: '-1', height: 9.5, weight: 80 },
    { id: '5', height: 9.5 },
  ]);
});

// fillNull byAgg
test('parse', () => {
  expect(
    parse(
      [
        { id: 'a', height: 10.5, weight: 60 },
        { id: 'b', height: null, weight: 40 },
        { id: 'c', height: 9.5, weight: null },
        { id: '', height: 9.5, weight: 80 },
        { id: 'e', height: 9.5 },
      ],
      {
        actions: [
          {
            type: 'fillNull',
            field: 'id',
            as: null,
            options: {
              type: 'byAgg',
              cfg: {
                agg: 'avg',
              },
            },
          },
          {
            type: 'fillNull',
            field: 'weight',
            as: null,
            options: {
              type: 'byAgg',
              cfg: {
                agg: 'min',
              },
            },
          },
        ],
      }
    )
  ).toEqual([
    { id: 'a', height: 10.5, weight: 60 },
    { id: 'b', height: null, weight: 40 },
    { id: 'c', height: 9.5, weight: 40 },
    { id: NaN, height: 9.5, weight: 80 },
    { id: 'e', height: 9.5, weight: 40 },
  ]);
});

// fillNull bySmart
test('parse', () => {
  console.log(
    parse(
      [
        { id: 1, name: 'nameI', type: 'A', gender: 'female', DOB: '1987-03-21', weight: 80, height: 160 },
        { id: 2, name: 'nameII', type: 'B', gender: 'female', DOB: '1991-04-27', weight: 90, height: 180 },
        { id: 3, name: 'nameIII', type: 'B', gender: 'female', DOB: '1990-05-15', weight: 60, height: 160 },
        { id: 4, name: 'nameIV', type: 'A', gender: 'male', DOB: '1982-02-09', weight: 40, height: 150 },
        { id: null, name: '', type: '', gender: null, DOB: '' },
      ],
      {
        actions: [
          {
            type: 'fillNull',
            field: 'id',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'name',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'type',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'gender',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'DOB',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'weight',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
          {
            type: 'fillNull',
            field: 'height',
            as: null,
            options: {
              type: 'bySmart',
            },
          },
        ],
      }
    )[4]
  );
});
