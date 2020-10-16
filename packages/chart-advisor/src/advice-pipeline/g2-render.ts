import * as G2Plot from '@antv/g2plot';
import { G2PlotConfig } from './interface';

/**
 * g2plot render function
 * @beta
 */
export function g2plotRender(container: string | HTMLElement, data: any, libConfigs: G2PlotConfig) {
  const { type, configs } = libConfigs;

  const containerDOM = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerDOM) return null;

  // @ts-ignore
  const plot = new G2Plot[type](containerDOM, {
    data,
    height: containerDOM.clientHeight ? containerDOM.clientHeight : 300,
    autoFit: true,
    ...configs,
  });
  plot.render();
  return plot;
}

/**
 * g2 render function
 * @beta
 */
export function g2Render(container: string | HTMLElement, data: any, configs: G2PlotConfig) {
  return g2plotRender(container, data, configs)?.chart;
}
