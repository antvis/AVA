/**
 * Unit tests for src/interpreter/stat.ts
 */

import { describe, it, expect } from 'vitest';

import { stat } from '../../src/interpreter/stat';

const data = [
  { region: 'east', revenue: 100 },
  { region: 'east', revenue: 200 },
  { region: 'west', revenue: 300 },
];

describe('interpreter/stat', () => {
  it('groupBy groups rows by key', () => {
    const grouped = stat.groupBy(data, 'region');
    expect(grouped.east).toHaveLength(2);
    expect(grouped.west).toHaveLength(1);
  });

  it('computes aggregations', () => {
    expect(stat.sum(data, 'revenue')).toBe(600);
    expect(stat.avg(data, 'revenue')).toBe(200);
    expect(stat.max(data, 'revenue')).toBe(300);
    expect(stat.min(data, 'revenue')).toBe(100);
    expect(stat.count(data)).toBe(3);
    expect(stat.median(data, 'revenue')).toBe(200);
    expect(stat.distinct(data, 'region')).toEqual(['east', 'west']);
  });

  it('sortBy sorts rows', () => {
    const sorted = stat.sortBy(data, 'revenue', 'desc');
    expect(sorted[0].revenue).toBe(300);
  });

  it('first/last return boundary elements', () => {
    expect(stat.first(data).revenue).toBe(100);
    expect(stat.last(data).revenue).toBe(300);
  });
});
