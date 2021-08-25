import React, { useRef, useEffect } from 'react';
import * as G2Plot from '@antv/g2plot';
import { Plot } from '@antv/g2plot';
import { ChartType } from '../../../../packages/insight/src';

interface PlotProps {
  data: any[];
  chartType: ChartType;
  caption?: string;
  schema: any;
}

const g2plotTypeMap = {
  column_chart: 'Column',
  line_chart: 'Line',
};

export const PlotRender = React.memo((props: PlotProps) => {
  const { data, schema, chartType, caption } = props;
  const container = useRef<HTMLDivElement>(null);
  const plotRef = useRef<Plot<any>>();

  useEffect(() => {
    const plotType = g2plotTypeMap[chartType];
    const plot = new (G2Plot as any)[plotType](container.current, { data, ...schema });
    plot.render();
    plotRef.current = plot;
  }, [chartType]);

  useEffect(() => {
    if (plotRef.current) {
      plotRef.current?.update({ data, ...schema });
      plotRef.current?.render();
    }
  }, [data, schema]);

  return (
    <div style={{ height: '400px', width: '600px', margin: '24px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{ height: '32px', lineHeight: '32px', fontSize: 16, fontWeight: 500, marginBottom: 24, marginLeft: 24 }}
      >
        {caption}
      </div>
      <div style={{ flex: 1 }} ref={container}></div>
    </div>
  );
});
