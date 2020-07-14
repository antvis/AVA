/**
 * @author yuxi
 * advisor option to plot config and render by different adaptor
 */

import * as G2Plot from '@antv/g2plot';
import { Chart } from '@antv/g2';

import { ChartLibrary } from './chartLibMapping';

type RenderFn = (dom: HTMLElement, data: any[], configs: any, type: any) => void;

const g2plotRender: RenderFn = (dom, data, configs, type) => {
  // @ts-ignore
  const chart = new G2Plot[type](dom, {
    data,
    ...configs,
  });
  chart.render();
  return chart;
};

const g2Render: RenderFn = (dom, data, configs) => {
  const chart = new Chart({
    container: dom,
    height: 600,
    autoFit: true,
    options: {
      data,

      // priority config geometries
      geometries: configs.geometries,
    },
  });
  chart.render();
  return chart;
};

export function adaptRender(dom: HTMLElement, data: any[], libraryName: ChartLibrary, libConfig: any) {
  const { type, configs } = libConfig;
  switch (libraryName) {
    case 'G2Plot':
      return g2plotRender(dom, data, configs, type);
    case 'G2':
      return g2Render(dom, data, configs, type);
    default:
      return g2plotRender(dom, data, configs, type);
  }
}
