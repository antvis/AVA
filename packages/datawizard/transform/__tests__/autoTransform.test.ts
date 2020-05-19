import { autoTransform } from '../src/autoTransform';

test('autoTransform', () => {
  expect(
    autoTransform([
      { gender: 'Male', height: 180 },
      { gender: 'Female', height: 165 },
      { gender: 'Male', height: 170 },
    ]).schemas
  ).toEqual([
    {
      groupBy: ['gender'],
      actions: [
        {
          type: 'sum',
          field: 'height',
          as: 'SUM(height)',
        },
      ],
    },
  ]);
});

test('autoTransform', () => {
  expect(
    autoTransform([
      { gender: 'Male', height: 180 },
      { gender: 'Female', height: 165 },
      { gender: 'Male', height: 170 },
    ]).result
  ).toEqual([
    { gender: 'Male', 'SUM(height)': 350 },
    { gender: 'Female', 'SUM(height)': 165 },
  ]);
});

test('autoTransform', () => {
  expect(
    autoTransform(
      [
        { gender: 'Male', height: 180 },
        { gender: 'Female', height: 165 },
        { gender: 'Male', height: 170 },
      ],
      'underline'
    ).schemas
  ).toEqual([
    {
      groupBy: ['gender'],
      actions: [
        {
          type: 'sum',
          field: 'height',
          as: 'SUM_height',
        },
      ],
    },
  ]);
});

test('autoTransform', () => {
  expect(
    autoTransform(
      [
        { gender: 'Male', height: 180 },
        { gender: 'Female', height: 165 },
        { gender: 'Male', height: 170 },
      ],
      'underline'
    ).result
  ).toEqual([
    { gender: 'Male', SUM_height: 350 },
    { gender: 'Female', SUM_height: 165 },
  ]);
});

test('autoTransform', () => {
  const data = [
    { date1: '2019-12-01 08:00:00', count1: 379.44, type1: 'HOTEL1' },
    { date1: '2019-12-01 08:00:00', count1: 140.24, type1: 'GAME1' },
    { date1: '2019-12-01 08:00:00', count1: 407.84, type1: 'PLAIN1' },
    { date1: '2019-12-01 08:00:00', count1: 624.99, type1: 'DIGITAL1' },
    { date1: '2019-12-08 08:00:00', count1: 610.2, type1: 'HOTEL1' },
    { date1: '2019-12-08 08:00:00', count1: 6.6, type1: 'GAME1' },
    { date1: '2019-12-08 08:00:00', count1: 440.54, type1: 'PLAIN1' },
    { date1: '2019-12-08 08:00:00', count1: 308.34, type1: 'DIGITAL1' },
    { date1: '2019-12-15 08:00:00', count1: 647.41, type1: 'HOTEL1' },
    { date1: '2019-12-15 08:00:00', count1: 21.58, type1: 'GAME1' },
    { date1: '2019-12-15 08:00:00', count1: 904.91, type1: 'PLAIN1' },
    { date1: '2019-12-15 08:00:00', count1: 851.28, type1: 'DIGITAL1' },
    { date1: '2019-12-22 08:00:00', count1: 599.93, type1: 'HOTEL1' },
    { date1: '2019-12-22 08:00:00', count1: 750.45, type1: 'GAME1' },
    { date1: '2019-12-22 08:00:00', count1: 945.67, type1: 'PLAIN1' },
    { date1: '2019-12-22 08:00:00', count1: 626.37, type1: 'DIGITAL1' },
    { date1: '2019-12-29 08:00:00', count1: 83.11, type1: 'HOTEL1' },
    { date1: '2019-12-29 08:00:00', count1: 403.6, type1: 'GAME1' },
    { date1: '2019-12-29 08:00:00', count1: 789.67, type1: 'PLAIN1' },
    { date1: '2019-12-29 08:00:00', count1: 850.6, type1: 'DIGITAL1' },
    { date1: '2020-01-05 08:00:00', count1: 334.24, type1: 'HOTEL1' },
    { date1: '2020-01-05 08:00:00', count1: 214.66, type1: 'GAME1' },
    { date1: '2020-01-05 08:00:00', count1: 901.88, type1: 'PLAIN1' },
    { date1: '2020-01-05 08:00:00', count1: 206.69, type1: 'DIGITAL1' },
    { date1: '2020-01-12 08:00:00', count1: 368.82, type1: 'HOTEL1' },
    { date1: '2020-01-12 08:00:00', count1: 719.22, type1: 'GAME1' },
    { date1: '2020-01-12 08:00:00', count1: 900.63, type1: 'PLAIN1' },
    { date1: '2020-01-12 08:00:00', count1: 649.94, type1: 'DIGITAL1' },
    { date1: '2020-01-19 08:00:00', count1: 797.56, type1: 'HOTEL1' },
    { date1: '2020-01-19 08:00:00', count1: 187.26, type1: 'GAME1' },
    { date1: '2020-01-19 08:00:00', count1: 229.12, type1: 'PLAIN1' },
    { date1: '2020-01-19 08:00:00', count1: 267.03, type1: 'DIGITAL1' },
    { date1: '2020-01-26 08:00:00', count1: 683.9, type1: 'HOTEL1' },
    { date1: '2020-01-26 08:00:00', count1: 549.96, type1: 'GAME1' },
    { date1: '2020-01-26 08:00:00', count1: 262.16, type1: 'PLAIN1' },
    { date1: '2020-01-26 08:00:00', count1: 265.62, type1: 'DIGITAL1' },
    { date1: '2020-02-02 08:00:00', count1: 456.68, type1: 'HOTEL1' },
    { date1: '2020-02-02 08:00:00', count1: 501.63, type1: 'GAME1' },
    { date1: '2020-02-02 08:00:00', count1: 640.06, type1: 'PLAIN1' },
    { date1: '2020-02-02 08:00:00', count1: 598.63, type1: 'DIGITAL1' },
    { date1: '2020-02-09 08:00:00', count1: 654.61, type1: 'HOTEL1' },
    { date1: '2020-02-09 08:00:00', count1: 924.48, type1: 'GAME1' },
    { date1: '2020-02-09 08:00:00', count1: 875.01, type1: 'PLAIN1' },
    { date1: '2020-02-09 08:00:00', count1: 57.06, type1: 'DIGITAL1' },
    { date1: '2020-02-16 08:00:00', count1: 768.87, type1: 'HOTEL1' },
    { date1: '2020-02-16 08:00:00', count1: 787.32, type1: 'GAME1' },
    { date1: '2020-02-16 08:00:00', count1: 582.22, type1: 'PLAIN1' },
    { date1: '2020-02-16 08:00:00', count1: 546.38, type1: 'DIGITAL1' },
    { date1: '2020-02-23 08:00:00', count1: 20.74, type1: 'HOTEL1' },
    { date1: '2020-02-23 08:00:00', count1: 100.86, type1: 'GAME1' },
    { date1: '2020-02-23 08:00:00', count1: 997.45, type1: 'PLAIN1' },
    { date1: '2020-02-23 08:00:00', count1: 916.24, type1: 'DIGITAL1' },
  ];

  expect(autoTransform(data, false).schemas).toEqual([
    {
      actions: [
        {
          type: 'sum',
          field: 'count1',
          as: 'count1',
        },
      ],
      groupBy: ['date1', 'type1'],
    },
  ]);
});
