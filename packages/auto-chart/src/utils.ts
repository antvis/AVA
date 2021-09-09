import Thumbnails from '@antv/thumbnails';
import { ChartID } from '@antv/knowledge';

export const prefixCls = '__AUTO_CHART__';
export const customChartType = ['kpi_panel', 'table'];
export function getThumbnailURL(chartId: ChartID) {
  if (Thumbnails[chartId]?.svgCode) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(Thumbnails[chartId]?.svgCode as string)}`;
  };
  return 'https://gw.alipayobjects.com/zos/antfincdn/lP6YFnCEjy/nochartimg.svg';
};
