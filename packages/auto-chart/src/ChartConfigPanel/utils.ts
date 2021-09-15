import { isEqual, deepMix } from '@antv/util';
import { defaultConfigs } from '@antv/g2plot-schemas';

export function processConfig(config: any) {
  const resetConfig = {...config };
  delete resetConfig.height;
  delete resetConfig.width;
  if (config && config.trendline && config.trendline.visible === false) {
    // set trendline visible === false
    resetConfig.trendline = false;
  };
  return resetConfig;
};

export function copyConfig(config: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { width, height, trendline, ...rest } = config;
  if (trendline && trendline.visible === false) {
    // set trendline visible === false
    rest.trendline = undefined;
  } else if (trendline && trendline.visible === true) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { visible, ...r } = trendline;
    rest.trendline = r;
  };
  return rest;
};

/**
 * remove default config
 * @param configs
 * @param defaultCfgs
 */

 export function shake(configs: any, defaultCfgs: any) {
  const result: any = {};
  if (!defaultCfgs) return configs;
  Object.entries(configs).forEach(([key, value]) => {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const newValue = shake(value, defaultCfgs[key]);
      if (Object.keys(newValue).length !== 0) result[key] = newValue;
    } else if (Array.isArray(value)) {
      if (!isEqual(configs[key], defaultCfgs[key])) {
        result[key] = value;
      }
    } else if (configs[key] !== defaultCfgs[key]) {
      result[key] = value;
    }
  });
  return result;
};

/**
 * get default config
 * @param chartType
 */
export function getOption(chartType: string) {
  const options = defaultConfigs[chartType];
  delete options.heigth;
  delete options.width;
  return deepMix({}, options);
};

