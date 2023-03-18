import { Mark } from '@antv/g2';

import { PointPatternInfo } from '../../../types';
import { TEXT_STYLE } from '../../constants';
import { TextMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const textMarkStrategy = (patterns: PointPatternInfo[], textConfig?: TextMarkConfig): Mark => {
  const { style, label } = textConfig || {};
  const { measure, dimension } = patterns[0];
  const data = patterns.map((pattern) => ({
    [dimension]: pattern.x,
    [measure]: pattern.y,
  }));
  return {
    type: 'text',
    data,
    style: {
      text: label ? (d) => label(d) : (d) => `${d.x}, ${measure}: ${d.y}`,
      ...TEXT_STYLE,
      ...style,
    },
  };
};
