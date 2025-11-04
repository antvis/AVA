import React from 'react';

import ReactDOM from 'react-dom/client';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';
import { Spec } from '../../../packages/ava/src/bind';

export const render = (container: string, spec: Spec) => {
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;

  const { type, ...chartProps } = spec;
  const VISComps = DEFAULT_CHART_COMPONENTS;
  const Comp = VISComps[type] as React.ComponentType<any>;

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

export const cleanAndFormatJSON = (jsonStr: string): string => {
  let cleaned = jsonStr.trim();
  // 如果整个字符串被引号包裹（常见的复制粘贴问题），去掉外层引号
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
    // 处理转义的引号
    cleaned = cleaned.replace(/\\"/g, '"');
  }
  return cleaned;
};

export const formatJSON = (data: string, setData: React.Dispatch<React.SetStateAction<string>>) => {
  try {
    const cleaned = cleanAndFormatJSON(data);
    const parsedData = JSON.parse(cleaned);
    const formatted = JSON.stringify(parsedData, null, 2);
    setData(formatted);
  } catch (error) {
    console.error(`无法格式化 JSON: ${(error as Error).message}`);
  }
};
