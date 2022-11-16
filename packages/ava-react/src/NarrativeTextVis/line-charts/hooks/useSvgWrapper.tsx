import React, { useRef, useState, useLayoutEffect } from 'react';

import { seedToken } from '../../theme';

import { getElementFontSize } from './getElementFontSize';

import type { PropsWithChildren } from 'react';

type SvgProps = PropsWithChildren<React.SVGProps<SVGSVGElement>>;

export const useSvgWrapper = () => {
  const ele = useRef(null);
  const [size, setSize] = useState<number>(seedToken.fontSizeBase);
  useLayoutEffect(() => {
    if (ele.current) {
      setSize(getElementFontSize(ele.current, seedToken.fontSizeBase));
    }
  }, []);
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
  return [Svg, size] as const;
};
