import { G2PlotOptions, G2PlotChartType, G2PlotConfig, Specification } from '../interface';
import { Channel } from 'vega-lite/build/src/channel';

/**
 * @public
 */
export function specToLibConfig(spec: Specification, libName?: 'G2Plot'): G2PlotConfig | null {
  switch (libName) {
    case 'G2Plot':
      return g2plotAdaptor(spec);
    default:
      return g2plotAdaptor(spec);
  }
}

/**
 * @public
 */
function g2plotAdaptor(spec: Specification): G2PlotConfig | null {
  const { mark, encoding, data } = spec;

  if (!mark || !encoding || !data) return null;

  // step1: transform specification type to G2Plot type
  let type: G2PlotChartType = 'line';
  if (mark === 'line') {
    type = 'line';
  } else if (mark === 'bar') {
    if (encoding.x?.type === 'nominal' && encoding.y?.type === 'quantitative') {
      type = 'column';
    } else if (encoding.x?.type === 'quantitative' && encoding.y?.type === 'nominal') {
      type = 'bar';
    }
  }

  // step2: transform common config
  const options: G2PlotOptions = {};

  const OPTIONS_MAPPING: Partial<Record<Channel, keyof G2PlotOptions>> = {
    x: 'xField',
    y: 'yField',
    color: 'seriesField',
  };
  Object.keys(encoding).forEach((e) => {
    const key = OPTIONS_MAPPING[e as Channel] as keyof G2PlotOptions;
    const channel = encoding[e as Channel];
    if (key && channel && channel.field) {
      options[key] = channel.field;
    }
  });

  // step3: handle special config
  // column and bar
  if (mark === 'bar') {
    if (type === 'column') {
      // group
      if (encoding.column?.field && encoding.x.field === encoding.color?.field) {
        options.isGroup = true;
        options.xField = encoding.column.field;
      }
      // percent
      if (encoding.y.stack === 'normalize') {
        options.isPercent = true;
      }
    } else if (type === 'bar') {
      // group
      if (encoding.row?.field && encoding.y.field === encoding.color?.field) {
        options.isGroup = true;
        options.yField = encoding.row.field;
      }
      // percent
      if (encoding.x?.stack === 'normalize') {
        options.isPercent = true;
      }
    }
    // stack
    if (options.seriesField) {
      options.isStack = true;
    }
  }
  // histogram
  if (encoding.x?.bin && encoding.x.field && encoding.y?.aggregate === 'count') {
    type = 'histogram';
    options.xField = undefined;
    options.binField = encoding.x.field;
  }

  // step4: transform data
  options.data = data.values || [];

  return { type, options };
}
