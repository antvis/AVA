import { useEffect, useRef } from 'react';

import { G2Spec, render } from '@antv/g2';

export const Chart = ({ id, spec }: any) => {
  const containerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      const container = document.getElementById('container');
      const style = getComputedStyle(container);
      const demoSpec: G2Spec = {
        width: parseInt(style.width),
        height: parseInt(style.height),
        type: 'interval',
        data: [
          { genre: 'Sports', sold: 275 },
          { genre: 'Strategy', sold: 115 },
          { genre: 'Action', sold: 120 },
          { genre: 'Shooter', sold: 350 },
          { genre: 'Other', sold: 150 },
        ],
        encode: {
          x: 'genre',
          y: 'sold',
        },
      };
      const node = render(demoSpec);
      containerRef.current.appendChild(node);
    }
  }, []);

  return <div ref={container} id={id} style={{ width: '100%', height: 200, margin: 'auto' }}></div>;
};
