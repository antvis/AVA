import { Mark } from '@antv/g2';
import { isFunction } from 'lodash';

import { PointPatternInfo } from '../../../types';
import { TEXT_STYLE } from '../../constants';
import { TextMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const textMarkStrategy = (patterns: PointPatternInfo[], textConfig?: TextMarkConfig): Mark => {
  const { style, label, formatter } = textConfig || {};
  const { measure, dimension } = patterns[0];
  const data = patterns.map((pattern) => ({
    [dimension]: pattern.x,
    [measure]: pattern.y,
  }));
  const customLabel = isFunction(label) ? (d) => label(d) : label;
  return {
    type: 'text',
    data,
    style: {
      text: label
        ? customLabel
        : (d) => {
            const value = isFunction(formatter) ? formatter(d.y) : d.y;
            return `${d.x}, ${measure}: ${value}`;
          },
      ...TEXT_STYLE,
      ...style,
    },
  };
};
