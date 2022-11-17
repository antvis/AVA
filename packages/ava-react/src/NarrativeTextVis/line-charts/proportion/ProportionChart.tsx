import React from 'react';

import { seedToken } from '../../theme';
import { useSvgWrapper } from '../hooks/useSvgWrapper';

import { getArcPath } from './getArcPath';

export const ProportionChart: React.FC<{ data: number }> = ({ data }) => {
  const [Svg, size] = useSvgWrapper();
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <circle cx={r} cy={r} r={r} fill={seedToken.colorProportionShadow} />
      {data >= 1 ? (
        <circle cx={r} cy={r} r={r} fill={seedToken.colorProportionFill} />
      ) : (
        <path d={getArcPath(size, data)} fill={seedToken.colorProportionFill} />
      )}
    </Svg>
  );
};
