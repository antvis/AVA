import { isInlineData, isUrlData } from 'vega-lite/src/data';
import { FlowFunction, isObjArr } from '../utils';
import { G2PlotConfigs } from '../interface';

/**
 * spec.data -> config.data
 */
export const data: FlowFunction<Partial<G2PlotConfigs>> = async (spec, tmpCfgs) => {
  const CatchError = Promise.reject('data is not exist');
  const { data } = spec;
  if (!data) return CatchError;

  if (isInlineData(data)) {
    const { values } = data;
    if (isObjArr(values)) {
      tmpCfgs.data = values as object[];
      return Promise.resolve(tmpCfgs);
    }
  }

  if (isUrlData(data)) {
    const { url } = data;
    const res = await fetch(url);
    const json = await res.json();
    tmpCfgs.data = json;
    return Promise.resolve(tmpCfgs);
  }

  return CatchError;
};
