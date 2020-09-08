import { G2PlotConfigs } from '../interface';
import { FlowFunction } from '../utils';

/**
 * spec.mark -> config.chartType (geometry)
 */
export const mark: FlowFunction<Partial<G2PlotConfigs>> = (spec, tmpCfgs) => {
  // @ts-ignore
  const { mark } = spec;
  let chartType = '';
  switch (mark) {
    case 'bar':
      chartType = 'Column';
      break;
    default:
      return Promise.reject('the mark is not supported by vega-lite');
      break;
  }
  // @ts-ignore
  tmpCfgs.chartType = chartType;
  return Promise.resolve(tmpCfgs);
};
