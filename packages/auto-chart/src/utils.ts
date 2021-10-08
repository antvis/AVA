import React from 'react';
// TODO @antv/thumbnails will update
import Thumbnails from '@antv/thumbnails';
import type { ChartID } from '@antv/knowledge';

export const prefixCls = '__AUTO_CHART__';
export const customChartType = ['kpi_panel', 'table'];
export function getThumbnailURL(chartId: ChartID) {
  if (Thumbnails[chartId]?.svgCode) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(Thumbnails[chartId]?.svgCode as string)}`;
  }
  return 'https://gw.alipayobjects.com/zos/antfincdn/lP6YFnCEjy/nochartimg.svg';
}

export function uuid() {
  return `uuid${'-xxxx-xxx'.replace(/x/g, () => (Math.random() * 16).toString(16))}`;
}

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
      target.style.left = `${pageX - shiftX}px`;
      target.style.top = `${pageY - shiftY}px`;
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
}

export function getElePosition(containerRef: React.MutableRefObject<HTMLDivElement>, dragContainer: React.MutableRefObject<HTMLDivElement>): { left: string; top: string } {
  const left = containerRef.current.offsetLeft;
  const top = containerRef.current.offsetTop;
  const boxWidth = containerRef.current.offsetWidth;
  const boxHeight = containerRef.current.offsetHeight;
  const dragWidth = dragContainer.current.offsetWidth;
  const dragHeight = dragContainer.current.offsetHeight;
  const wWidth = document.body.clientWidth;
  const wHeight = document.body.clientHeight;
  const dragLeftMax = left + boxWidth / 2;
  const dragLeftMin = left - dragWidth + boxWidth / 2;
  const dragTopMax = top + boxHeight / 2;
  const dragTopMin = top - dragHeight + boxHeight / 2;
  let dragLeft;
  let dragTop;
  if (dragLeftMax + dragWidth > wWidth) {
    dragLeft = dragLeftMin < 0 ? wWidth - dragWidth : dragLeftMin;
  } else {
    dragLeft = dragLeftMax;
  }
  if (dragTopMax + dragHeight > wHeight) {
    dragTop = dragTopMin < 0 ? wHeight - dragHeight : dragTopMin;
  } else {
    dragTop = dragTopMax;
  };
  return {
    left: `${dragLeft}px`,
    top: `${dragTop}px`
  };
}
