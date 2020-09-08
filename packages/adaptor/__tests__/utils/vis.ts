import { View, parse } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { g2Adaptor, g2plotRender, G2PlotConfigs } from '../../src';
import { createWrapper } from './';

/**
 * use vega-lite spec to render plots，for compare with g2plot
 * @param container
 * @param spec vega-lite spec
 */
export function drawWithVegaLiteSpec(container: string | HTMLElement, spec: TopLevelSpec) {
  var div = typeof container === 'string' ? document.getElementById(container) : container;
  if (div) new View(parse(compile(spec).spec)).initialize(div).runAsync();
}

/**
 * create unit test dom and render plots using vega-lite and g2plot
 * | -------------------- |
 * |        title         |
 * | -------------------  |
 * | vega-lite |  g2plot  |
 * | -------------------  |
 * @param spec vega-lite spec
 * @param title unit test title
 */
export async function initCharts(spec: TopLevelSpec, title: string = '') {
  const [wrapperDiv, mainDiv] = createWrapper(title);
  wrapperDiv.style.border = '1px dashed #666';
  mainDiv.style.display = 'flex';
  mainDiv.style.height = '280px';

  const [vlDiv, vlDom] = createWrapper('', mainDiv);
  vlDiv.style.flex = '1';
  vlDiv.style.width = '0';
  drawWithVegaLiteSpec(vlDom, spec);

  const [g2Div, g2Dom] = createWrapper('', mainDiv);
  g2Div.style.flex = '1';
  g2Div.style.width = '0';
  g2Dom.style.height = '100%';

  const g2plotConfigs = await g2Adaptor(spec);
  g2plotRender(g2Dom, g2plotConfigs as G2PlotConfigs);
  return g2plotConfigs;
}
