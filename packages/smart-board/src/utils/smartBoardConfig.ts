import { Chart } from '../interfaces';
import { InsightInfo, PatternInfo } from '../../../lite-insight';

export interface ConfigObj {
  id?: string;
  type: string;
  data: any;
  config: {
    xField?: string;
    yField?: string;
    seriesField?: string;
    isStack?: boolean;
    isGroup?: boolean;
    colorField?: string;
    angleField?: string;
  };
  score?: number;
}

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
  };

  const { breakdowns } = Chart;
  const { measures } = Chart;

  switch (Chart.chartType) {
    case 'column_chart': {
      chartType = 'Column';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: breakdowns[0],
          yField: measures[0],
        },
        score: Chart.score,
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
          xField: breakdowns[0],
          yField: measures[0],
          seriesField: breakdowns[1],
          isGroup: true,
        },
        score: Chart.score,
      };
      break;
    case 'stack_column_chart':
      chartType = 'Column';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          xField: breakdowns[0],
          yField: measures[0],
          seriesField: breakdowns[1],
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
          xField: breakdowns[0],
          yField: measures[0],
          seriesField: breakdowns[1] || '',
        },
        score: Chart.score,
      };
      break;
    case 'pie_chart':
      chartType = 'Pie';
      chartConfig = {
        id: Chart.id,
        type: chartType,
        data,
        config: {
          colorField: breakdowns[0],
          angleField: measures[0],
        },
        score: Chart.score,
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
      subspaces: item.subspaces,
      breakdowns: item.breakdowns,
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
