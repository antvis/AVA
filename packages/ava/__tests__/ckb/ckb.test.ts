import { ckb } from '../../src/ckb';

describe('api - ckb', () => {
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

  const CHART_TYPE_AMOUNT = 52;

  test('ckb works without param', () => {
    // return object
    expect(!!ckb()).toBe(true);
  });

  test('default amount of chart types', () => {
    const myCkb = ckb();
    const keys = Object.keys(myCkb);
    expect(keys.length).toBe(CHART_TYPE_AMOUNT);
  });

  test('exclude only', () => {
    const myCkb = ckb({ exclude: ['pie_chart'] });
    expect(Object.keys(myCkb).length).toBe(CHART_TYPE_AMOUNT - 1);
    expect(!Object.keys(myCkb).includes('pie_chart'));
  });

  test('include only', () => {
    const myCkb = ckb({ include: ['line_chart', 'pie_chart'] });
    expect(Object.keys(myCkb).length).toBe(2);
    expect(Object.keys(myCkb).includes('line_chart'));
    expect(Object.keys(myCkb).includes('pie_chart'));
  });

  test('custom only', () => {
    const myCkb = ckb({
      custom: {
        neo_diagram: neoDiagram,
      },
    });
    expect(Object.keys(myCkb).length).toBe(CHART_TYPE_AMOUNT + 1);
    expect(myCkb).toHaveProperty('neo_diagram');
  });

  test('exclude && include', () => {
    const myCkb = ckb({
      exclude: ['line_chart'],
      include: ['pie_chart'],
    });
    expect(Object.keys(myCkb).length).toBe(1);
    expect(myCkb).toHaveProperty('pie_chart');
  });

  test('custom && exclude', () => {
    const myCkb = ckb({
      exclude: ['line_chart', 'pie_chart'],
      custom: {
        neo_diagram: neoDiagram,
      },
    });
    expect(Object.keys(myCkb).length).toBe(CHART_TYPE_AMOUNT - 2 + 1);
    expect(myCkb).toHaveProperty('neo_diagram');
  });

  test('custom && include', () => {
    const myCkb = ckb({
      include: ['line_chart', 'pie_chart'],
      custom: {
        neo_diagram: neoDiagram,
      },
    });
    expect(Object.keys(myCkb).length).toBe(3);
    expect(myCkb).toHaveProperty('line_chart');
    expect(myCkb).toHaveProperty('pie_chart');
    expect(myCkb).toHaveProperty('neo_diagram');
  });

  test('custom && exclude && include', () => {
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

  test('conflict of exclude and include', () => {
    const myCkb = ckb({ exclude: ['line_chart', 'pie_chart'], include: ['line_chart', 'pie_chart'] });
    expect(Object.keys(myCkb).length).toBe(0);
  });

  test('include nothing', () => {
    const myCkb = ckb({ include: [] });
    expect(Object.keys(myCkb).length).toBe(0);
  });

  test('include nothing - just use custom charts', () => {
    const myCkb = ckb({
      include: [],
      custom: {
        neo_diagram: neoDiagram,
      },
    });
    expect(Object.keys(myCkb).length).toBe(1);
    expect(myCkb).toHaveProperty('neo_diagram');
  });
});
