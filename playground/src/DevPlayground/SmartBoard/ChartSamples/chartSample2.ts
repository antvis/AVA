import { ChartListInfo } from '@antv/smart-board';

const gapminder = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/gapminder.json';

const chartSample2: ChartListInfo = [
  {
    data: gapminder,
    subspace: [],
    dimensions: ['country'],
    measures: ['fertility'],
    fieldInfo: {
      country: {
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
    data: gapminder,
    subspace: [],
    dimensions: ['year'],
    measures: ['pop'],
    insightType: 'distribution',
    score: 0.7,
    chartType: 'line_chart',
  },
  {
    data: gapminder,
    subspace: [],
    dimensions: ['cluster'],
    measures: ['fertility'],
    insightType: 'proportion',
    score: 0.6,
    chartType: 'pie_chart',
  },
  {
    data: gapminder,
    subspace: [],
    dimensions: ['country', 'cluster'],
    measures: ['pop'],
    insightType: 'extreme',
    score: 0.85,
    chartType: 'grouped_column_chart',
  },
  {
    data: gapminder,
    subspace: [],
    dimensions: ['year', 'country'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.2,
    chartType: 'line_chart',
  },
  {
    data: gapminder,
    subspace: [],
    dimensions: ['year'],
    measures: ['pop'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
];

export default chartSample2;
