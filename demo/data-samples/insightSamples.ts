import { DataSample } from './interfaces';

export const insightSamples: DataSample[] = [
  {
    insights: ['Monotonicity'],
    data: [
      { date: '1970-01-01', sex: 0, weight: 10 },
      { date: '1970-01-01', sex: 1, weight: 20 },
      { date: '1980-01-01', sex: 0, weight: 30 },
      { date: '1980-01-01', sex: 1, weight: 40 },
      { date: '1990-01-01', sex: 0, weight: 60 },
      { date: '1990-01-01', sex: 1, weight: 10 },
    ],
  },
  {
    insights: ['Correlation'],
    data: [
      { x: 10, y: 12 },
      { x: 20, y: 25 },
      { x: 30, y: 33 },
      { x: 40, y: 42 },
      { x: 50, y: 57 },
      { x: 60, y: 60 },
      { x: 70, y: 78 },
      { x: 80, y: 82 },
    ],
  },
  {
    insights: ['MajorFactors'],
    data: [
      { AA: 'X', BB: 'Y', CC: 'Z' },
      { AA: 'X', BB: 'Y', CC: 'Z' },
      { AA: 'Y', BB: 'Z', CC: 'X' },
      { AA: 'X', BB: 'Z', CC: 'X' },
      { AA: 'X', BB: 'Y', CC: 'Y' },
      { AA: 'Y', BB: 'Y', CC: 'Y' },
      { AA: 'X', BB: 'X', CC: 'Z' },
      { AA: 'X', BB: 'Y', CC: 'X' },
      { AA: 'X', BB: 'Y', CC: 'Y' },
      { AA: 'X', BB: 'Y', CC: 'Z' },
    ],
  },
  {
    insights: ['OverallTrends'],
    data: [
      { date: '2020-01-01', GDP: 80 },
      { date: '2020-01-02', GDP: 123 },
      { date: '2020-01-03', GDP: 134 },
      { date: '2020-01-04', GDP: 145 },
      { date: '2020-01-05', GDP: 110 },
      { date: '2020-01-06', GDP: 156 },
      { date: '2020-01-07', GDP: 152 },
      { date: '2020-01-08', GDP: 162 },
      { date: '2020-01-09', GDP: 167 },
      { date: '2020-01-10', GDP: 190 },
      { date: '2020-01-11', GDP: 189 },
      { date: '2020-01-12', GDP: 200 },
    ],
  },
];
