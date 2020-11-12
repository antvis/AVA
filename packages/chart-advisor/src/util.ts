import { ChartID } from '@antv/knowledge';
import { CLASS_PREFIX } from './style';
import { G2PLOT_TYPE_MAPPING } from './advice-pipeline';

/**
 * 随机生成一个唯一ID
 */
export function uuid() {
  return `${'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | (0 & 0x3)).toString(16))}`;
}

export function getElementDisplay(item: HTMLElement) {
  return getComputedStyle(item, null).display;
}

export function getPosition(target: HTMLElement): { top: number; left: number } {
  const { top, left } = target.getBoundingClientRect();
  return {
    top: top + window.scrollY,
    left: left + window.scrollX,
  };
}

/**
 * @deprecated
 * when config panel rebuild
 */
export function translate(term: ChartID | string): string {
  return G2PLOT_TYPE_MAPPING[term as ChartID] || term;
}

export function createLayer(container: HTMLElement): HTMLDivElement {
  if (!['relative', 'absolute', 'fixed'].includes(getComputedStyle(container).position)) {
    container.style.position = 'relative';
  }
  const layer = document.createElement('div');
  layer.style.height = '100%';
  layer.style.width = '100%';
  layer.style.position = 'absolute';
  layer.style.top = '0px';
  layer.style.left = '0px';
  layer.style.pointerEvents = 'none';
  container.appendChild(layer);
  return layer;
}

export function DEFAULT_FEEDBACK(feedback: string): (container: HTMLDivElement) => void {
  return function fn(container: HTMLDivElement) {
    const content = document.createElement('div');
    content.className = `${CLASS_PREFIX}no_data_content`;
    content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <img src="https://gw.alipayobjects.com/zos/basement_prod/9a59280d-8f23-4234-b5cf-02956a91b6ff.svg" />
    </div>
    <div>${feedback}</div>
  `;
    container.appendChild(content);
  };
}
