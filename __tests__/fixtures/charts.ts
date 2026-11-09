import type { GPTVisConfig } from '@antv/gpt-vis';
import type { ChartType } from '../../src/types';

/** Shared runtime and compile-time examples checked against the installed renderer. */
export const charts: { [T in Exclude<ChartType, 'summary'>]: Omit<Extract<GPTVisConfig, { type?: T }>, 'type'> } = {
  column: {
    data: [
      { category: 'Jan', value: 10 },
      { category: 'Feb', value: 20 },
    ],
  },
  bar: {
    data: [
      { category: 'Jan', value: 10 },
      { category: 'Feb', value: 20 },
    ],
  },
  line: {
    data: [
      { time: 'Jan', value: 10 },
      { time: 'Feb', value: 20 },
    ],
  },
  area: {
    data: [
      { time: 'Jan', value: 10 },
      { time: 'Feb', value: 20 },
    ],
  },
  pie: {
    data: [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
    ],
  },
  scatter: {
    data: [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ],
  },
  histogram: { data: [1, 2, 3, 4, 5] },
  boxplot: { data: [1, 2, 3, 6].map((value) => ({ category: 'A', value })) },
  violin: { data: [1, 2, 3, 6].map((value) => ({ category: 'A', value })) },
  radar: {
    data: [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 },
      { name: 'C', value: 15 },
    ],
  },
  funnel: {
    data: [
      { category: 'Browse', value: 100 },
      { category: 'Buy', value: 10 },
    ],
  },
  waterfall: {
    data: [
      { category: 'Start', value: 10 },
      { category: 'Change', value: -2 },
      { category: 'Subtotal', isIntermediateTotal: true },
      { category: 'Total', isTotal: true },
    ],
  },
  liquid: { percent: 0.5 },
  'word-cloud': {
    data: [
      { text: 'Hello', value: 10 },
      { text: 'World', value: 20 },
    ],
  },
  venn: {
    data: [
      { sets: ['A'], value: 10 },
      { sets: ['B'], value: 8 },
      { sets: 'A,B', value: 3 },
    ],
  },
  treemap: {
    data: [
      {
        name: 'Root',
        value: 10,
        children: [
          { name: 'A', value: 6 },
          { name: 'B', value: 4 },
        ],
      },
    ],
  },
  sankey: {
    data: [
      { source: 'A', target: 'B', value: 10 },
      { source: 'B', target: 'C', value: 10 },
    ],
  },
  table: { data: [{ original: 'value' }] },
  'dual-axes': { categories: ['Jan', 'Feb'], series: [{ type: 'line', data: [10, 20] }] },
};
