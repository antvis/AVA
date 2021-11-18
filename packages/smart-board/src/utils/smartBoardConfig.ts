import { InsightInfo, PatternInfo } from '@antv/lite-insight';
import { Chart, ConfigObj } from '../interfaces';

/**
 * Get smart-board config.
 */
export function smartBoardConfig(Chart: Chart, data: any): ConfigObj {
  let chartType = '';
  let chartConfig: ConfigObj = {
    id: Chart.id,
    type: chartType,
    data,
    config: {},
    score: Chart.score,
    description: Chart.description,
  };

  const { dimensions } = Chart;
  const { measures } = Chart;

  switch (Chart.chartType) {
    case 'column_chart': {
      chartType = 'Column';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: dimensions[0],
          yField: measures[0],
        },
        score: Chart.score,
        description: Chart.description,
      };
      break;
    }
    case 'grouped_column_chart':
      chartType = 'Column';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: dimensions[0],
          yField: measures[0],
          seriesField: dimensions[1],
          isGroup: true,
        },
        score: Chart.score,
        description: Chart.description,
      };
      break;
    case 'stack_column_chart':
      chartType = 'Column';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: dimensions[0],
          yField: measures[0],
          seriesField: dimensions[1],
          isStack: true,
        },
        score: Chart.score,
      };
      break;
    case 'line_chart':
      chartType = 'Line';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: dimensions[0],
          yField: measures[0],
          seriesField: dimensions[1] || '',
        },
        score: Chart.score,
        description: Chart.description,
      };
      break;
    case 'pie_chart':
      chartType = 'Pie';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          colorField: dimensions[0],
          angleField: measures[0],
        },
        score: Chart.score,
        description: Chart.description,
      };
      break;
    default:
      break;
  }
  return chartConfig;
}

const insightTransfer = [
  {
    insight: 'category_outlier',
    board: 'outlier',
  },
  {
    insight: 'trend',
    board: 'trend',
  },
  {
    insight: 'change_point',
    board: 'difference',
  },
  {
    insight: 'time_series_outlier',
    board: 'outlier',
  },
  {
    insight: 'majority',
    board: 'extreme',
  },
  {
    insight: 'low_variance',
    board: 'distribution',
  },
];

export function insights2Board(insights: InsightInfo<PatternInfo>[]) {
  return insights?.map((item) => {
    return {
      data: item.data,
      subspace: item.subspace,
      dimensions: item.dimensions,
      measures: item.measures?.map((measure) => {
        return measure.field;
      }),
      score: item.score,
      chartType: item.visualizationSchemas?.[0]?.chartType,
      chartSchema: item.visualizationSchemas?.[0]?.chartSchema,
      description: item.visualizationSchemas?.[0]?.caption,
      insightType: insightTransfer.filter((type) => {
        return type.insight === item.patterns?.[0]?.type;
      })?.[0]?.board,
    };
  });
}
