import { ckb, ckbDict, LEVEL_OF_MEASUREMENTS } from '../../src';

describe('integration - use CKB', () => {
  const neoDiagram = {
    id: 'neo_diagram',
    name: 'Neo Diagram',
    alias: ['Neo Chart'],
    family: ['Others'],
    def: 'A magic chart invented by Neo.',
    purpose: ['Comparison'],
    coord: [],
    category: ['Diagram'],
    shape: ['Lines'],
    dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
    channel: ['Position'],
    recRate: 'Not Recommend',
  };

  const CHART_TYPE_AMOUNT = 80;

  test('api - ckb: basic', () => {
    // return object
    const myCkb = ckb();
    const keys = Object.keys(myCkb);
    expect(!!myCkb).toBe(true);
    expect(keys.includes('pie_chart'));
    expect(keys.length).toBe(CHART_TYPE_AMOUNT);
  });

  test('api - ckb: custom && exclude && include', () => {
    const myCkb = ckb({
      exclude: ['pie_chart'],
      include: ['line_chart', 'pie_chart'],
      custom: {
        neo_diagram: neoDiagram,
      },
    });
    expect(Object.keys(myCkb).length).toBe(2);
    expect(myCkb).toHaveProperty('line_chart');
    expect(myCkb).toHaveProperty('neo_diagram');
  });

  test('api - ckbDict: returns translation list', () => {
    // return object
    const cn = ckbDict('zh-CN');
    expect(!!cn).toBe(true);
    expect(Object.keys(cn)).toEqual(['concepts', 'chartTypes']);
    expect(cn.concepts.lom.Nominal).toBe('无序名词');
  });

  test('constants', () => {
    expect(LEVEL_OF_MEASUREMENTS).toEqual(['Nominal', 'Ordinal', 'Interval', 'Discrete', 'Continuous', 'Time']);
  });
});
