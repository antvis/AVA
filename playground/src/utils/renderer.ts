import React from 'react';

import ReactDOM from 'react-dom/client';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';

const render = (spec: any) => {
  const { type, ...chartProps } = spec;
  const VISComps = DEFAULT_CHART_COMPONENTS;
  const Comp = VISComps[type] as React.ComponentType<any>;

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  return React.createElement(Comp, chartProps);
};

// 适配 Advisor 的 RenderParams
export const chartRenderer = (params: any) => {
  const { container, spec } = params || {};
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;

  const chartElement = render(spec);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};
