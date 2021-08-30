import { Chart } from '../../../src/interfaces';

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
 * Adaptor from chart info to G2Plot config.
 *
 * TODO: deprecated this function once antv-spec to G2Plot adaptor is done.
 */
export function chartInfo2Config(Chart: Chart, data: any): ConfigObj {
  let chartType = '';
  let chartConfig: ConfigObj = {
    id: Chart.id,
    type: chartType,
    data: Chart.data,
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
