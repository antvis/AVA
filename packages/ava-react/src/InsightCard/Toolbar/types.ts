import React from 'react';

import type { ReactNode } from 'react';
import type { InsightData } from '../types';
import type { DEFAULT_TOOLS } from './constants';

export type Tool = {
  /** 工具按钮的 key */
  type: string;
  /** 工具按钮显示的 icon */
  icon?: ReactNode | ((type: string, data?: InsightData) => ReactNode);
  /** 工具按钮的描述，hover 到 icon 时显示的提示信息 */
  description?: ReactNode | ((type: string, data?: InsightData) => ReactNode);
  /** 点击工具按钮后的回调 */
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>, type: string, data?: InsightData) => void;
};

export type ToolbarProps = {
  tools: Tool[];
  data?: InsightData;
};

export type DefaultToolType = (typeof DEFAULT_TOOLS)[number];
export type BaseIconButtonProps = {
  icon: ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  description?: ReactNode;
};
