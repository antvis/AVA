import React, { useRef, useState, useLayoutEffect } from 'react';
import { getElementFontSize, DEFAULT_FONT_SIZE } from './getElementFontSize';

type SvgReactFC = React.FC<React.SVGProps<SVGSVGElement>>;

export const useSvgWrapper = () => {
  const ele = useRef(null);
  const [size, setSize] = useState<number>(DEFAULT_FONT_SIZE);
  useLayoutEffect(() => {
    if (ele.current) {
      setSize(getElementFontSize(ele.current, DEFAULT_FONT_SIZE));
    }
  }, []);
  const Svg: SvgReactFC = ({ children, ...otherProps }) => {
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
  return [Svg, size] as [SvgReactFC, number];
};
