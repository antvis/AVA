import React from 'react';
import { getArcPath } from './getArcPath';
import { useSvgWrapper } from '../hooks/useSvgWrapper';

const PROPORTION_SHADOW_COLOR = '#CDDDFD';
const PROPORTION_FILL_COLOR = '#3471F9';

export const ProportionChart: React.FC<{ data: number }> = ({ data }) => {
  const [Svg, size] = useSvgWrapper();
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <circle cx={r} cy={r} r={r} fill={PROPORTION_SHADOW_COLOR} />
      {data >= 1 ? (
        <circle cx={r} cy={r} r={r} fill={PROPORTION_FILL_COLOR} />
      ) : (
        <path d={getArcPath(size, data)} fill={PROPORTION_FILL_COLOR} />
      )}
    </Svg>
  );
};
