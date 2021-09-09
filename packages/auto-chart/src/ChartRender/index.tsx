import React, { useEffect, useRef,  } from 'react';
import type { ReactNode } from 'react';
import { specToG2Plot } from '@antv/antv-spec';
import { prefixCls } from '../utils';

interface ChartProps {
  title?: ReactNode;
  description?: ReactNode;
  spec?: any;
};

export const Chart = ({ title, description, spec }: ChartProps) => {
  const chartRef = useRef(null);
  console.log(spec);
  useEffect(() => {
    if (spec) {
      specToG2Plot(spec, chartRef.current);
    };
  }, [spec]);

  return (
    <div className={`${prefixCls}canvas-layer`}>
      {title && <div className="canvas-title">{title}</div>}
      {description && <div className="canvas-description">{description}</div>}
      <div className="canvas-content">
        <div className="feedback-layer" ref={chartRef}></div>
      </div>
    </div>
  );
};
