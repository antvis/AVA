import React, { useEffect, useRef } from 'react';

import { render } from '@antv/g2';

export const Chart = ({ id, spec }: any) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = document.getElementById('container');
      const style = container ? getComputedStyle(container) : undefined;
      const size = style
        ? {
            width: parseInt(style.width, 10),
            height: parseInt(style.height, 10),
          }
        : {};
      const node = render({
        ...size,
        ...spec,
        // theme:'classic'
      });
      containerRef.current.appendChild(node);
    }
  }, []);
  // @ts-ignore 待 g2 确认渲染方式
  return <div ref={containerRef} id={id} style={{ width: '100%', height: 200, margin: 'auto' }}></div>;
};
