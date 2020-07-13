/**
 * @author yuxi
 * advisor option to plot config and render by different adaptor
 */

import * as G2Plot from '@antv/g2plot';
import { Chart } from '@antv/g2';

// import { Advice, specToLibConfig, } from './advisor';
import { ChartLibrary } from './chartLibMapping';

type RenderFn = (dom: HTMLElement, data: any[], configs: any, type: any) => void;

const g2plotRender: RenderFn = (dom, data, type, configs) => {
  // @ts-ignore
  const chart = new G2Plot[type](dom, {
    data,
    ...configs,
  });
  chart.render();
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
};

export function adaptRender(dom: HTMLElement, data: any[], libraryName: ChartLibrary, libConfig: any) {
  const { type, configs } = libConfig;
  // console.log('configs: ', configs, type);

  switch (libraryName) {
    case 'G2Plot':
      g2plotRender(dom, data, configs, type);
      return;
    case 'G2':
      g2Render(dom, data, configs, type);
      return;
    default:
      g2plotRender(dom, data, configs, type);
  }
}
