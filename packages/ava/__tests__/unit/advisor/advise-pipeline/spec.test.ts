import { DataFrame } from '../../../../src/data';
import { getChartTypeSpec } from '../../../../src/advisor/advise-pipeline/spec-mapping';
import { BasicDataPropertyForAdvice } from '../../../../src/advisor/ruler';

describe('chart mapping with 「nominal-numerical」 data', () => {
  const data = [
    { price: 100, type: 'A' },
    { price: 120, type: 'B' },
    { price: 150, type: 'C' },
  ];
  const dataFrame = new DataFrame(data);

  test('pie_chart', () => {
    const chartMapping = getChartTypeSpec('pie_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        color: 'type',
        y: 'price',
      },
      transform: [{ type: 'stackY' }],
      coordinate: { type: 'theta' },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('donut_chart', () => {
    const chartMapping = getChartTypeSpec('donut_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        color: 'type',
        y: 'price',
      },
      transform: [{ type: 'stackY' }],
      coordinate: { type: 'theta', innerRadius: 0.6 },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('bar_chart', () => {
    const chartMapping = getChartTypeSpec('bar_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
      },
      coordinate: {
        transform: [{ type: 'transpose' }],
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('column_chart', () => {
    const chartMapping = getChartTypeSpec('column_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「time-numerical」 time data', () => {
  const data = [
    { price: 520, year: 2005 },
    { price: 600, year: 2006 },
    { price: 1500, year: 2007 },
  ];
  const dataFrame = new DataFrame(data);

  test('line_chart', () => {
    const chartMapping = getChartTypeSpec('line_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'line',
      data,
      encode: {
        x: 'year',
        y: 'price',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('step_line_chart', () => {
    const chartMapping = getChartTypeSpec('step_line_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'line',
      data,
      encode: {
        x: 'year',
        y: 'price',
        shape: 'hvh',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('area_chart', () => {
    const chartMapping = getChartTypeSpec('area_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'area',
      data,
      encode: {
        x: 'year',
        y: 'price',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「nominal-numerical-nominal」 data', () => {
  const data = [
    { price: 520, type: 'A', country: 'China' },
    { price: 620, type: 'A', country: 'Japan' },
    { price: 920, type: 'A', country: 'USA' },
    { price: 600, type: 'B', country: 'China' },
    { price: 700, type: 'B', country: 'Japan' },
    { price: 500, type: 'B', country: 'USA' },
  ];
  const dataFrame = new DataFrame(data);

  test('grouped_bar_chart', () => {
    const chartMapping = getChartTypeSpec('grouped_bar_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'dodgeX' }],
      coordinate: {
        transform: [{ type: 'transpose' }],
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('stcked_bar_chart', () => {
    const chartMapping = getChartTypeSpec('stacked_bar_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }],
      coordinate: {
        transform: [{ type: 'transpose' }],
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('percent_stcked_bar_chart', () => {
    const chartMapping = getChartTypeSpec(
      'percent_stacked_bar_chart',
      data,
      dataFrame.info() as BasicDataPropertyForAdvice[]
    );
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
      coordinate: {
        transform: [{ type: 'transpose' }],
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('grouped_column_chart', () => {
    const chartMapping = getChartTypeSpec(
      'grouped_column_chart',
      data,
      dataFrame.info() as BasicDataPropertyForAdvice[]
    );
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'dodgeX' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('stacked_column_chart', () => {
    const chartMapping = getChartTypeSpec(
      'stacked_column_chart',
      data,
      dataFrame.info() as BasicDataPropertyForAdvice[]
    );
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('percent_stacked_column_chart', () => {
    const chartMapping = getChartTypeSpec(
      'percent_stacked_column_chart',
      data,
      dataFrame.info() as BasicDataPropertyForAdvice[]
    );
    const expectMapping = {
      type: 'interval',
      data,
      encode: {
        x: 'type',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「time-numerical-nominal」 data', () => {
  const data = [
    { price: 520, year: 2006, country: 'China' },
    { price: 620, year: 2007, country: 'China' },
    { price: 920, year: 2008, country: 'China' },
    { price: 600, year: 2006, country: 'USA' },
    { price: 700, year: 2007, country: 'USA' },
    { price: 500, year: 2008, country: 'USA' },
  ];
  const dataFrame = new DataFrame(data);

  test('line_chart', () => {
    const chartMapping = getChartTypeSpec('line_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'line',
      data,
      encode: {
        x: 'year',
        y: 'price',
        color: 'country',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('stacked_area_chart', () => {
    const chartMapping = getChartTypeSpec('stacked_area_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'area',
      data,
      encode: {
        x: 'year',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });

  test('percent_stacked_area_chart', () => {
    const chartMapping = getChartTypeSpec(
      'percent_stacked_area_chart',
      data,
      dataFrame.info() as BasicDataPropertyForAdvice[]
    );
    const expectMapping = {
      type: 'area',
      data,
      encode: {
        x: 'year',
        y: 'price',
        color: 'country',
      },
      transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「numerical-numerical-nominal」 data', () => {
  const data = [
    { x: 520, y: 100, country: 'China' },
    { x: 620, y: 2008, country: 'China' },
    { x: 920, y: 300, country: 'China' },
    { x: 600, y: 30, country: 'USA' },
    { x: 700, y: 80, country: 'USA' },
    { x: 500, y: 70, country: 'USA' },
  ];
  const dataFrame = new DataFrame(data);

  test('scatter_plot', () => {
    const chartMapping = getChartTypeSpec('scatter_plot', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'point',
      data,
      encode: {
        x: 'x',
        y: 'y',
        color: 'country',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「numerical-numerical-numerical-nominal」 data', () => {
  const data = [
    { size: 520, x: 100, country: 'China', y: 1 },
    { size: 620, x: 2008, country: 'China', y: 2 },
    { size: 920, x: 300, country: 'China', y: 3 },
    { size: 600, x: 30, country: 'USA', y: 4 },
    { size: 700, x: 80, country: 'USA', y: 5 },
    { size: 500, x: 70, country: 'USA', y: 6 },
  ];
  const dataFrame = new DataFrame(data);

  test('bubble_chart', () => {
    const chartMapping = getChartTypeSpec('bubble_chart', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'point',
      data,
      encode: {
        x: 'x',
        y: 'y',
        size: 'size',
        color: 'country',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「numerical」 data', () => {
  const data = [{ x: 100 }, { x: 2008 }, { x: 300 }, { x: 30 }, { x: 80 }, { x: 70 }];
  const dataFrame = new DataFrame(data);

  test('histogram', () => {
    const chartMapping = getChartTypeSpec('histogram', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'rect',
      data,
      encode: {
        x: 'x',
      },
      transform: [{ type: 'binX', y: 'count' }],
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});

describe('chart mapping with 「nominal-nominal-numerical」 data', () => {
  const data = [
    { type: 'A', country: 'China', opacity: 0.1 },
    { type: 'B', country: 'USA', opacity: 0.2 },
    { type: 'C', country: 'Japan', opacity: 0.3 },
  ];
  const dataFrame = new DataFrame(data);

  test('heatmap', () => {
    const chartMapping = getChartTypeSpec('heatmap', data, dataFrame.info() as BasicDataPropertyForAdvice[]);
    const expectMapping = {
      type: 'cell',
      data,
      encode: {
        x: 'type',
        y: 'country',
        color: 'opacity',
      },
    };
    expect(chartMapping).toEqual(expectMapping);
  });
});
