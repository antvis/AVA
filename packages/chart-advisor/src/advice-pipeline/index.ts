// DO NOT remove this G2Plot import line, for the sake of api-extractor.
// https://github.com/microsoft/rushstack/issues/2140
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as G2Plot from '@antv/g2plot';

// interface
import { Advice, AdvisorOptions } from './interface';

// step 1: data -> data props
import { dataToDataProps } from './data-to-dataprops';

// step 2: data props -> vega lite specs
import { dataPropsToAdvices } from './dataprops-to-advices';

// step 3: vega lite spec -> lib config
// libconfig contain g2 g2plot, default g2plot
import { adviceToLibConfig, G2PLOT_TYPE_MAPPING } from './spec-to-libconfig';

// step 4: lib config -> chart render & return instance
// `chart-advisor` support g2 and g2plot render
// you can also use vegalite spec config to render 🌟
import { g2Render, g2plotRender } from './g2-render';

export { dataToDataProps, dataPropsToAdvices, adviceToLibConfig, g2Render, g2plotRender, G2PLOT_TYPE_MAPPING };
export * from './interface';
export * from './vega-lite';

// step 1 + step 2
/**
 * @beta
 */
export function dataToAdvices(data: any[], options?: AdvisorOptions, showLog = false): Advice[] {
  if (showLog) console.log('💠💠💠💠💠💠 data 💠💠💠💠💠💠');
  if (showLog) console.log(data);
  if (showLog) console.log('🍯🍯🍯🍯🍯🍯 options 🍯🍯🍯🍯🍯🍯');
  if (showLog) console.log(options);

  const dataProps = dataToDataProps(data);

  if (showLog) console.log('🔶🔶🔶🔶🔶🔶 dataset analysis 🔶🔶🔶🔶🔶🔶');
  if (showLog) console.log(dataProps);

  const adviceList: Advice[] = dataPropsToAdvices(dataProps, options);

  return adviceList;
}

// step 3 + step 4
// default render as g2plot
/**
 * @beta
 */
export function specRender(
  container: string | HTMLElement,
  data: any[],
  spec: Advice,
  libraryName: 'G2' | 'G2Plot' = 'G2Plot'
) {
  const libconfig = adviceToLibConfig(spec, libraryName);
  if (!libconfig) return null;
  return libraryName === 'G2Plot' ? g2plotRender(container, data, libconfig) : g2Render(container, data, libconfig);
}
