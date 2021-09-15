// TODO @antv/thumbnails will update
import Thumbnails from '@antv/thumbnails';
import type { ChartID } from '@antv/knowledge';

export const prefixCls = '__AUTO_CHART__';
export const customChartType = ['kpi_panel', 'table'];
export function getThumbnailURL(chartId: ChartID) {
  if (Thumbnails[chartId]?.svgCode) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(Thumbnails[chartId]?.svgCode as string)}`;
  };
  return 'https://gw.alipayobjects.com/zos/antfincdn/lP6YFnCEjy/nochartimg.svg';
};

/* eslint-disable no-param-reassign */
/**
 * let targetElement can drag itself
 * @param target - targetHtml
 * @param dragEle - can drag area
 */
 export function draggable(target: HTMLElement, dragEle: HTMLElement) {
  const handlers: ((event: MouseEvent) => void)[] = [];

  dragEle.onmousedown = (event: MouseEvent) => {
    const shiftX = event.clientX - dragEle.getBoundingClientRect().left;
    const shiftY = event.clientY - dragEle.getBoundingClientRect().top;
    function moveAt(pageX: number, pageY: number) {
      target.style.left = `${(pageX - shiftX)}px`;
      target.style.top = `${(pageY - shiftY)}px`;
    }

    moveAt(event.pageX, event.pageY);


    function onMouseMove(event: MouseEvent) {
      moveAt(event.pageX, event.pageY);
    }

    handlers.push(onMouseMove);

    // move the ball on mousemove
    document.addEventListener('mousemove', onMouseMove);

    // drop the ball, remove unneeded handlers
    dragEle.onmouseup = () => {
      handlers.forEach((item) => {
        document.removeEventListener('mousemove', item);
      });
      target.onmouseup = null;
    };
  };

  dragEle.ondragstart = () => {
    return false;
  };
};
