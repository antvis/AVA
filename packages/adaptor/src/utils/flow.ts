import { TopLevelSpec } from 'vega-lite';
import { G2PlotConfigs } from '../interface';

export type FlowFunction<T> = (spec: TopLevelSpec, configs: Partial<G2PlotConfigs>) => Promise<T>;

/**
 * handle vega-lite spec workflow
 * @param flows transfer partial of G2PlotConfigs
 * @returns return all required configs of G2PlotConfigs
 */
export function flow(...flows: FlowFunction<Partial<G2PlotConfigs>>[]): FlowFunction<G2PlotConfigs> {
  return (spec, configs) =>
    flows.reduce((promise, f) => promise.then((configs) => f(spec, configs)), Promise.resolve(configs)) as Promise<
      G2PlotConfigs
    >;
}
