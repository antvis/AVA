import React from 'react';

import type { ReactNode } from 'react';
import type { InsightData } from '../types';
import type { DEFAULT_TOOLS } from './constants';

export type Tool = {
  type: string;
  /** display icon */
  icon?: ReactNode | ((type: string, data?: InsightData) => ReactNode);
  /** tool description, if assigned, it will show as a tooltip when icon is hovered */
  description?: ReactNode | ((type: string, data?: InsightData) => ReactNode);
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
