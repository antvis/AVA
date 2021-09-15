import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import type { ReactNode } from 'react';
import { specToG2Plot } from '@antv/antv-spec';
import { prefixCls } from '../utils';

interface ChartProps {
  title?: ReactNode;
  description?: ReactNode;
  spec?: any;
  chartRef: React.MutableRefObject<any>
};

export const Chart = ({ title, description, spec, chartRef }: ChartProps) => {
  const plotRef = useRef(null);
  const [chartType, setChartType] = useState<string>(null);
  const [plot, setPlot] = useState(null);
  useEffect(() => {
    if (spec) {
      const plot = specToG2Plot(spec, plotRef.current);
      setPlot(plot);
      setChartType(plot.constructor.name);
    };
  }, [spec]);

  useImperativeHandle(chartRef, () => {
    return {
      chartType,
      plot
    };
  });

  return (
    <div className={`${prefixCls}canvas-layer`}>
      {title && <div className="canvas-title">{title}</div>}
      {description && <div className="canvas-description">{description}</div>}
      <div className="canvas-content">
        <div className="feedback-layer" ref={plotRef}></div>
      </div>
    </div>
  );
};
