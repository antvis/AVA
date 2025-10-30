import React from 'react';

import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';

import type { RenderParams } from '@antv/ava';

type ChartRegistry = Record<string, React.ComponentType<any>>;
const DEFAULT_REGISTRY: ChartRegistry = { ...DEFAULT_CHART_COMPONENTS };

export type RenderChartOptions = {
  components?: Partial<ChartRegistry>;
  defaultRenderer?: (params: RenderParams) => React.ReactNode;
};

export const renderChart = (params: RenderParams, options: RenderChartOptions = {}) => {
  const { type, ...chartProps } = params;
  const registry: ChartRegistry = { ...DEFAULT_REGISTRY, ...(options.components || {}) };
  const ChartComponent = registry[type];

  if (ChartComponent) return <ChartComponent {...chartProps} />;

  return options.defaultRenderer ? options.defaultRenderer(params) : <div>无可渲染图表：{type}</div>;
};
