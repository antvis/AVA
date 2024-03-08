import React from 'react';

import { getThemeColor } from '../../theme';
import { useSvgWrapper } from '../hooks/useSvgWrapper';

import { getArcPath } from './getArcPath';

import type { ThemeStylesProps } from '../../types';

export const ProportionChart: React.FC<{ data: number } & ThemeStylesProps> = ({
  data,
  size = 'normal',
  theme = 'light',
}) => {
  const [Svg, fontSize] = useSvgWrapper(size);
  const r = fontSize / 2;
  return (
    <Svg width={fontSize} height={fontSize}>
      <circle cx={r} cy={r} r={r} fill={getThemeColor({ colorToken: 'colorProportionShadow', theme })} />
      {data >= 1 ? (
        <circle cx={r} cy={r} r={r} fill={getThemeColor({ colorToken: 'colorProportionFill', theme })} />
      ) : (
        <path d={getArcPath(fontSize, data)} fill={getThemeColor({ colorToken: 'colorProportionFill', theme })} />
      )}
    </Svg>
  );
};
