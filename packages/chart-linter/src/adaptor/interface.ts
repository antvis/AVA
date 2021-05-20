import { ExtendedChannel } from 'vega-lite/build/src/channel';
import { Mark } from 'vega-lite/build/src/mark';
import { InlineData } from 'vega-lite/build/src/data';
import { LineOptions, ColumnOptions, BarOptions, HistogramOptions } from '@antv/g2plot';

/**
 * @public
 */
export type G2PlotChartType = 'line' | 'column' | 'bar' | 'histogram';

/**
 * @public
 */
export type G2PlotOptions = Partial<Record<keyof (LineOptions & ColumnOptions & BarOptions & HistogramOptions), any>>;

/**
 * @public
 */
export interface G2PlotConfig {
  type: G2PlotChartType;
  options: G2PlotOptions;
}

/**
 * @public
 */
export type SpecEncoding = Partial<Record<ExtendedChannel, any>>;

/**
 * @public
 */
export interface Specification {
  mark: Mark;
  encoding: SpecEncoding;
  data: InlineData;
}
