import React, { useRef, useState, useLayoutEffect } from 'react';

import { seedToken } from '../../theme';

import { getElementFontSize } from './getElementFontSize';

import type { PropsWithChildren } from 'react';
import type { SizeType } from '../../types';

type SvgProps = PropsWithChildren<React.SVGProps<SVGSVGElement>>;

export const useSvgWrapper = (size: SizeType = 'normal') => {
  const ele = useRef(null);
  const [fontSize, setFontSize] = useState<number>(seedToken.fontSizeBase);
  useLayoutEffect(() => {
    if (size) {
      setFontSize(size === 'normal' ? seedToken.fontSizeBase : seedToken.fontSizeSmall);
    } else if (ele.current) {
      setFontSize(getElementFontSize(ele.current, seedToken.fontSizeBase));
    }
  }, [size]);
  const Svg = ({ children, ...otherProps }: SvgProps) => {
    return (
      <svg
        style={{
          margin: '0px 4px',
          transform: 'translate(0px, 0.125em)',
        }}
        ref={ele}
        {...otherProps}
      >
        {children}
      </svg>
    );
  };
  return [Svg, fontSize] as const;
};
