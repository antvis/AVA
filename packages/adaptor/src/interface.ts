/** part of g2plot v2 chart type */
export type G2PlotChartType = 'Line' | 'Area' | 'Column' | 'Bar' | 'Pie' | 'Rose' | 'Scatter' | 'Histogram' | 'Heatmap';

/** chart data, object array */
export type DataSet = Record<string, any>;

/** part of g2plot v2 main configs for vis channels */
export type Channels = 'xField' | 'yField' | 'seriousField' | 'colorField' | 'angleField' | 'colorField';

/**
 * chart configs for render g2plot chart
 */
export interface G2PlotConfigs {
  chartType: G2PlotChartType;
  data: DataSet[];
  channelConfigs: Partial<Record<Channels, any>>;
}
