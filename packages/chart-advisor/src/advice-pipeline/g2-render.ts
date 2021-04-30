import { G2PlotConfig } from './interface';

/**
 * g2plot render function
 * @public
 */
export async function g2plotRender(container: string | HTMLElement, data: any, libConfigs: G2PlotConfig) {
  const { type, configs } = libConfigs;

  const containerDOM = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerDOM) return null;

  const G2Plot = await import(/* webpackChunkName: "g2plot" */ '@antv/g2plot');
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
 * @public
 */
export async function g2Render(container: string | HTMLElement, data: any, configs: G2PlotConfig) {
  const g2plotIns = await g2plotRender(container, data, configs);
  return g2plotIns?.chart;
}
