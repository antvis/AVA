import * as G2Plot from '@antv/g2plot';
import { G2PlotConfigs } from '../interface';

/**
 * g2plot render function
 * @param container chart container
 * @param configs custom g2plot configs
 * @returns g2plot instance
 */
export function g2plotRender(container: string | HTMLElement, configs: G2PlotConfigs) {
  const { chartType, data, channelConfigs } = configs;
  // console.log('chartType, data, channelConfigs: ', chartType, data, channelConfigs);
  // @ts-ignore
  const plot = new G2Plot[chartType](container, { data, ...channelConfigs });
  plot.render();
  return plot;
}

/**
 * g2 render function
 * @param container chart container
 * @param configs custom g2plot configs
 * @returns g2 instance
 */
export function g2Render(container: string | HTMLElement, configs: G2PlotConfigs) {
  return g2plotRender(container, configs).chart;
}
