import { G2PlotOptions, G2PlotChartType, G2PlotConfig, SpecEncoding, Specification } from '../interface';
import { Channel } from 'vega-lite/build/src/channel';
import { Mark } from 'vega-lite/build/src/mark';
import { get, has, set } from 'lodash';

/**
 * @public
 */
export function libConfigToSpec(libConfig: G2PlotConfig, libName?: 'G2Plot'): Specification | null {
  switch (libName) {
    case 'G2Plot':
      return g2plotAdaptor(libConfig);
    default:
      return g2plotAdaptor(libConfig);
  }
}

/**
 * @public
 */
function g2plotAdaptor(libConfig: G2PlotConfig): Specification | null {
  const TYPE_MARK_MAPPING: Partial<Record<G2PlotChartType, Mark>> = {
    line: 'line',
    column: 'bar',
    bar: 'bar',
    histogram: 'bar',
  };

  const { type, options } = libConfig;

  // step1: transform G2Plot type to specification type
  const mark = TYPE_MARK_MAPPING[type];

  if (!mark || !options) return null;

  // step2: transform common config
  const encoding: SpecEncoding = {};

  const CHANNEL_MAPPING: Partial<Record<keyof G2PlotOptions, Channel>> = {
    xField: 'x',
    yField: 'y',
    seriesField: 'color',
  };

  Object.keys(options).forEach((c) => {
    const channel = CHANNEL_MAPPING[c as keyof G2PlotOptions] as Channel;
    if (channel) {
      encoding[channel] = {
        field: options[c as keyof G2PlotOptions],
      };
      if (mark === 'line') {
        if (channel === 'x') encoding[channel].type = 'temporal';
        if (channel === 'y') encoding[channel].type = 'quantitative';
      } else if (mark === 'bar') {
        if (channel === 'x') encoding[channel].type = type === 'column' ? 'nominal' : 'quantitative';
        if (channel === 'y') encoding[channel].type = type === 'column' ? 'quantitative' : 'nominal';
      }
    }
  });

  const CHANNEL_ENCODING_MAPPING: Record<string, string> = {
    'yAxis.min': 'y.scale.domainMin',
    'yAxis.minLimit': 'y.scale.domainMin',
  };

  Object.keys(CHANNEL_ENCODING_MAPPING).forEach((key) => {
    if (has(options, key)) {
      set(encoding, CHANNEL_ENCODING_MAPPING[key], get(options, key));
    }
  });

  // step3: handle special config
  // column and bar
  if (mark === 'bar') {
    if (type === 'column') {
      if (options.isGroup) {
        encoding.column = {
          field: options.xField,
        };
        encoding.x = {
          ...encoding.x,
          ...{
            field: encoding.color?.field,
            title: '',
          },
        };
      }
      if (options.isPercent) {
        encoding.y.stack = 'normalize';
      }
    } else if (type === 'bar') {
      if (options.isGroup) {
        encoding.row = {
          field: options.yField,
        };
        encoding.y = {
          ...encoding.y,
          ...{
            field: encoding.color?.field,
            title: '',
          },
        };
      }
      if (options.isPercent) {
        encoding.x.stack = 'normalize';
      }
    }
  }
  // histogram
  if (options.binField) {
    encoding.x = {
      bin: true,
      field: options.binField,
    };
    encoding.y = {
      aggregate: 'count',
    };
  }

  // step4: transform data
  const specData = {
    values: options.data || [],
  };

  return { mark, encoding, data: specData };
}
