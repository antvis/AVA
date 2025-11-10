import { computeAllowedChartIds } from '../../../src/utils/advise';
import { CHARTS } from '../../../src/ckb';

describe('computeAllowedChartIds', () => {
  it('returns all chart ids by default', () => {
    const out = computeAllowedChartIds();
    expect(out).toEqual(Object.keys(CHARTS));
  });

  it('filters by includes only', () => {
    const includes = ['line', 'bar'];
    const out = computeAllowedChartIds(includes);
    const expected = Object.keys(CHARTS).filter((id) => includes.includes(id));
    expect(out).toEqual(expected);
  });

  it('filters by excludes only', () => {
    const excludes = ['pie', 'radar'];
    const out = computeAllowedChartIds(undefined, excludes);
    const expected = Object.keys(CHARTS).filter((id) => !excludes.includes(id));
    expect(out).toEqual(expected);
  });

  it('applies includes then excludes', () => {
    const includes = ['bar', 'line', 'pie'];
    const excludes = ['pie'];
    const out = computeAllowedChartIds(includes, excludes);
    const expected = Object.keys(CHARTS)
      .filter((id) => includes.includes(id))
      .filter((id) => !excludes.includes(id));
    expect(out).toEqual(expected);
  });

  it('treats empty includes as all', () => {
    const out = computeAllowedChartIds([], ['line']);
    const expected = Object.keys(CHARTS).filter((id) => id !== 'line');
    expect(out).toEqual(expected);
  });

  it('ignores invalid ids in includes', () => {
    const includes = ['line', 'not-a-chart-id'];
    const out = computeAllowedChartIds(includes);
    const expected = Object.keys(CHARTS).filter((id) => id === 'line');
    expect(out).toEqual(expected);
  });

  it('ignores invalid ids in excludes', () => {
    const excludes = ['not-a-chart-id', 'pie'];
    const out = computeAllowedChartIds(undefined, excludes);
    const expected = Object.keys(CHARTS).filter((id) => id !== 'pie');
    expect(out).toEqual(expected);
  });

  it('handles duplicate ids in excludes', () => {
    const excludes = ['pie', 'pie'];
    const out = computeAllowedChartIds(undefined, excludes);
    const expected = Object.keys(CHARTS).filter((id) => id !== 'pie');
    expect(out).toEqual(expected);
  });
});
