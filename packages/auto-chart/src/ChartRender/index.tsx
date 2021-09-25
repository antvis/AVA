import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import type { ReactNode } from 'react';
import { specToG2Plot } from '@antv/antv-spec';
import * as G2Plot from '@antv/g2plot';
import { prefixCls } from '../utils';

interface ChartProps {
  title?: ReactNode;
  description?: ReactNode;
  spec?: any;
  mockConfig?: any;
  chartRef: React.MutableRefObject<any>;
}

export const Chart = ({ title, description, spec, chartRef, mockConfig }: ChartProps) => {
  const plotRef = useRef(null);
  const [chartType, setChartType] = useState<string>(null);
  const [plot, setPlot] = useState(null);
  useEffect(() => {
    if (spec) {
      const plot = specToG2Plot(spec, plotRef.current);
      setPlot(plot);
      setChartType(plot.constructor.name);
    }
  }, [spec]);

  useEffect(() => {
    if (mockConfig) {
      if (plot) plot.destroy();
      const g2plot = new (G2Plot as any)[mockConfig.config.type](plotRef.current, {
        ...mockConfig.config.configs,
        data: mockConfig.data,
      });
      g2plot.render();
      setPlot(g2plot);
      setChartType(g2plot.constructor.name);
    }
  }, [mockConfig]);

  useEffect(() => {
    if (spec === null && mockConfig === null) {
      setChartType(null);
      if (plot) plot.destroy();
      setPlot(null);
    }
  }, [spec, mockConfig]);

  useImperativeHandle(chartRef, () => {
    return {
      chartType,
      plot,
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
