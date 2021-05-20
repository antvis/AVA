import * as G2Plot from '@antv/g2plot';

const firstUpperCase = (str: string) => {
  return str.replace(/[a-z]/, (lowerCase) => lowerCase.toUpperCase());
};

/**
 * g2plot render function
 * @public
 */
export function g2plotRender(container: string | HTMLElement, type: string, options: any) {
  const containerDOM = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerDOM) return null;

  // @ts-ignore
  const plot = new G2Plot[firstUpperCase(type)](containerDOM, {
    height: containerDOM.clientHeight ? containerDOM.clientHeight : 300,
    ...options,
  });
  plot.render();
  return plot;
}
