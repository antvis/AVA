import { ChartListInfo, SmartBoard } from '../../../src';

describe('init SmartBoard instance', () => {
  const cars: any = [
    {
      Name: 'chevrolet chevelle malibu',
      Miles_per_Gallon: 18,
      Cylinders: 8,
      Displacement: 307,
      Horsepower: 130,
      Weight_in_lbs: 3504,
      Acceleration: 12,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'buick skylark 320',
      Miles_per_Gallon: 15,
      Cylinders: 8,
      Displacement: 350,
      Horsepower: 165,
      Weight_in_lbs: 3693,
      Acceleration: 11.5,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'plymouth satellite',
      Miles_per_Gallon: 18,
      Cylinders: 8,
      Displacement: 318,
      Horsepower: 150,
      Weight_in_lbs: 3436,
      Acceleration: 11,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'amc rebel sst',
      Miles_per_Gallon: 16,
      Cylinders: 8,
      Displacement: 304,
      Horsepower: 150,
      Weight_in_lbs: 3433,
      Acceleration: 12,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'ford torino',
      Miles_per_Gallon: 17,
      Cylinders: 8,
      Displacement: 302,
      Horsepower: 140,
      Weight_in_lbs: 3449,
      Acceleration: 10.5,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'ford galaxie 500',
      Miles_per_Gallon: 15,
      Cylinders: 8,
      Displacement: 429,
      Horsepower: 198,
      Weight_in_lbs: 4341,
      Acceleration: 10,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'chevrolet impala',
      Miles_per_Gallon: 14,
      Cylinders: 8,
      Displacement: 454,
      Horsepower: 220,
      Weight_in_lbs: 4354,
      Acceleration: 9,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'plymouth fury iii',
      Miles_per_Gallon: 14,
      Cylinders: 8,
      Displacement: 440,
      Horsepower: 215,
      Weight_in_lbs: 4312,
      Acceleration: 8.5,
      Year: '1970-01-01',
      Origin: 'USA',
    },
    {
      Name: 'pontiac catalina',
      Miles_per_Gallon: 14,
      Cylinders: 8,
      Displacement: 455,
      Horsepower: 225,
      Weight_in_lbs: 4425,
      Acceleration: 10,
      Year: '1970-01-01',
      Origin: 'USA',
    },
  ];

  const chartSample1: ChartListInfo = [
    {
      id: 'chart_1',
      data: cars,
      subspace: [],
      dimensions: ['Origin'],
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
      subspace: [],
      dimensions: ['Year'],
      measures: ['Acceleration'],
      insightType: 'trend',
      score: 0.7,
      chartType: 'line_chart',
    },
    {
      id: 'chart_3',
      data: cars,
      subspace: [],
      dimensions: ['Origin'],
      measures: ['Miles_per_Gallon'],
      insightType: 'proportion',
      score: 0.6,
      chartType: 'pie_chart',
    },
  ];

  const sb = new SmartBoard(chartSample1);

  test('chartGraph', () => {
    const cg = sb.chartGraph;

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
