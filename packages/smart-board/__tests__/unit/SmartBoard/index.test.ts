import { ChartListInfo, SmartBoard } from '../../../src';

describe('init SmartBoard instance', () => {
  const cars = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/cars.json';
  const chartSample1: ChartListInfo = [
    {
      id: 'chart_1',
      data: cars,
      subspaces: [],
      breakdowns: ['Origin'],
      measures: ['Horsepower'],
      fieldInfo: {
        Origin: {
          dataType: 'string',
        },
        Horsepower: {
          dataType: 'number',
        },
      },
      insightType: 'outlier',
      score: 0.5,
      chartType: 'column_chart',
    },
    {
      id: 'chart_2',
      data: cars,
      subspaces: [],
      breakdowns: ['Year'],
      measures: ['Acceleration'],
      insightType: 'trend',
      score: 0.7,
      chartType: 'line_chart',
    },
    {
      id: 'chart_3',
      data: cars,
      subspaces: [],
      breakdowns: ['Origin'],
      measures: ['Miles_per_Gallon'],
      insightType: 'proportion',
      score: 0.6,
      chartType: 'pie_chart',
    },
  ];

  const sb = new SmartBoard(chartSample1);

  const expectGraph = {
    nodes: chartSample1,
    links: [
      {
        source: 'chart_1',
        target: 'chart_3',
        weight: 0.3333333333333333,
        description: ['SAME_DIMENSION'],
      },
    ],
  };

  test('chartGraph', () => {
    const cg = sb.chartGraph;
    expect(cg).toStrictEqual(expectGraph);
  });

  const expectOrderByIS = { chart_1: 2, chart_2: 0, chart_3: 1 };
  test('chartOrder by insight score', () => {
    const co = sb.chartOrder('byInsightScore');
    expect(co).toStrictEqual(expectOrderByIS);
  });

  const expectOrderByCC = { chart_1: 1, chart_2: 2, chart_3: 0 };
  test('chartOrder by cluster', () => {
    const co = sb.chartOrder('byCluster');
    expect(co).toStrictEqual(expectOrderByCC);
  });

  const expectCluster = { chart_1: 0, chart_2: 1, chart_3: 0 };
  test('chartCluster', () => {
    const cc = sb.chartCluster();
    expect(cc).toStrictEqual(expectCluster);
  });
});
