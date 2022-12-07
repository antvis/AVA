import React from 'react';

import { getThemeColor } from '../../theme';
import { useSvgWrapper } from '../hooks/useSvgWrapper';

import { useLineCompute } from './useLineCompute';

import type { ThemeStylesProps } from '../../types';

const LINEAR_FILL_COLOR_ID = 'wsc-line-fill';

export const SingleLineChart: React.FC<{ data: number[] } & ThemeStylesProps> = ({
  data,
  size = 'normal',
  theme = 'light',
}) => {
  const [Svg, fontSize] = useSvgWrapper(size);
  const { width, height, linePath, polygonPath } = useLineCompute(fontSize, data);
  return (
    <Svg width={width} height={height}>
      <defs>
        <linearGradient x1="50%" y1="0%" x2="50%" y2="122.389541%" id={LINEAR_FILL_COLOR_ID}>
          <stop stopColor={getThemeColor('colorLineStroke', theme)} offset="0%" />
          <stop stopColor="#FFFFFF" stopOpacity="0" offset="100%" />
        </linearGradient>
      </defs>
      {linePath && <path d={linePath} stroke={getThemeColor('colorLineStroke', theme)} fill="transparent" />}
      {polygonPath && <polygon points={polygonPath} fill={`url(#${LINEAR_FILL_COLOR_ID})`} />}
    </Svg>
  );
};
