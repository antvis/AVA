import { Mark } from '@antv/g2';
import { isFunction } from 'lodash';

import { PointPatternInfo } from '../../../types';
import { TEXT_STYLE } from '../../constants';
import { TextMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const textMarkStrategy = (patterns: PointPatternInfo[], textConfig?: TextMarkConfig): Mark => {
  const { style, label, formatter } = textConfig || {};
  const { measure, dimension } = patterns[0];
  const data = patterns.map((pattern) => {
    const customLabel = isFunction(label) ? label(pattern) : label;
    const value = isFunction(formatter) ? formatter(pattern.y) : pattern.y;
    return {
      [dimension]: pattern.x,
      [measure]: pattern.y,
      label: customLabel ?? `${pattern.x}\n${value}`,
    };
  });

  return {
    type: 'text',
    data,
    encode: {
      x: dimension,
      y: measure,
      text: 'label',
    },
    style: {
      ...TEXT_STYLE,
      ...style,
    },
  };
};
