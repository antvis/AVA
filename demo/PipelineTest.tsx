import React, { useRef, useEffect } from 'react';
import * as G2Plot from '@antv/g2plot';
import { DataSamples } from './data-samples';
import { dataToDataProps, dataPropsToSpecs, specToLibConfig } from '../packages/chart-advisor/src/index';
import { prettyJSON, JSONToTable } from './utils';

export function PipelineTest() {
  const datasample = DataSamples.ForChartType('percent_stacked_bar_chart');

  const dataProps = dataToDataProps(datasample);
  const specs = dataPropsToSpecs(dataProps);
  const libConfigs = specs.map((spec) => specToLibConfig(spec, 'G2Plot')).filter((e) => e.type && e.configs);

  const { type, configs } = libConfigs[0];
  // @ts-ignore
  const ChartConstructor = G2Plot[type];
  const chartdom = useRef(null);
  useEffect(() => {
    const chart = new ChartConstructor(chartdom.current, {
      data: datasample,
      ...configs,
    });
    chart.render();
  });

  const dataInJSON = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '45%' }}>
      <h3>Data in JSON</h3>
      <textarea style={{ height: '100%', overflowY: 'scroll' }} defaultValue={prettyJSON(datasample)} />
    </div>
  );

  const dataInTable = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '45%' }}>
      <h3>Data in Table</h3>
      <div style={{ height: '100%', overflowY: 'scroll' }}>{JSONToTable(datasample)}</div>
    </div>
  );

  return (
    <>
      {/* data */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON}
        {dataInTable}
      </div>
      {/* data props */}
      <div>
        <h3>data props</h3>

        {[dataProps].map((dataProps) => {
          console.log('🍎 dataProps');
          console.log(dataProps);
          return `check console for '🍎 dataProps'`;
        })}
      </div>
      {/* specs */}
      <div>
        <h3>specs</h3>
        {[specs].map((specs) => {
          console.log('💬 specs');
          console.log(specs);
          return `check console for '💬 specs'`;
        })}
      </div>
      {/* lib config */}
      <div>
        <h3>lib config (G2Plot)</h3>
        {[libConfigs].map((libConfigs) => {
          console.log('📝 libConfigs');
          console.log(libConfigs);
          return `check console for '📝 libConfigs'`;
        })}
      </div>
      {/* chart */}
      <div>
        <h3>chart top1</h3>
        <div ref={chartdom}></div>
      </div>
    </>
  );
}
