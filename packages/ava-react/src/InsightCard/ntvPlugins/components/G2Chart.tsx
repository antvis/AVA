import React, { useEffect, useRef } from 'react';

import { Chart, G2Spec } from '@antv/g2';

import { INSIGHT_CARD_PREFIX_CLS } from '../../constants';

export const G2Chart = ({ spec, height, width }: { spec: G2Spec; height?: number; width?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<Chart>(null);
  useEffect(() => {
    if (!chartRef?.current) {
      chartRef.current = new Chart({ container: containerRef?.current, autoFit: true });
      chartRef.current.options({
        width: containerRef.current?.clientWidth,
        height: containerRef.current?.clientHeight,
        ...spec,
      });
    } else {
      chartRef.current.options({
        width: containerRef.current?.clientWidth,
        height: containerRef.current?.clientHeight,
        ...spec,
      });
    }
    chartRef.current.render();
  }, [spec]);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.options({
        width: containerRef.current?.clientWidth,
        height: containerRef.current?.clientHeight,
      });
      chartRef.current?.render();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={`${INSIGHT_CARD_PREFIX_CLS}-chart-container`}>
      <div ref={containerRef} style={{ height, width }} />
    </div>
  );
};
