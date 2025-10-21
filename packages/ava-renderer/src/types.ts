import type { AdviseChart, Data, Meta, RenderParams } from '@antv/ava';

export type RenderChartParams = {
  encode: AdviseChart['encode'];
  data: Data;
  metasMap: Record<string, Meta>;
  uiConfig?: RenderParams['uiConfig'];
};
