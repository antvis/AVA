import React, { useState, useRef, useEffect } from 'react';
import { DataSamples } from './data-samples';
import {
  dataToDataProps,
  dataPropsToSpecs,
  specToLibConfig,
  ChartLibrary,
  adaptRender,
} from '../packages/chart-advisor/src/index';
import { prettyJSON, JSONToTable } from './utils';
import { ChartID } from '../packages/chart-advisor/node_modules/@antv/knowledge/typings/knowledge';

// test for different adaptor
const CHART_LIB: ChartLibrary = 'G2';

const chartTypes: ChartID[] = ['grouped_bar_chart', 'scatter_plot', 'line_chart'];

export function PipelineTest() {
  const [chartType, setChartType] = useState<ChartID>(chartTypes[0]);
  const datasample = DataSamples.ForChartType(chartType);

  const dataProps = dataToDataProps(datasample);
  console.log('dataProps: ', dataProps);
  const specs = dataPropsToSpecs(dataProps);
  const libConfigs = specs.map((spec) => specToLibConfig(spec, CHART_LIB)).filter((e) => e.type && e.configs);

  const chartdom = useRef(null);
  const curChartIns = useRef<any>();

  useEffect(() => {
    // G2 or G2Plot destroy
    if (curChartIns.current) curChartIns.current.destroy();

    curChartIns.current = adaptRender(chartdom.current!, datasample, CHART_LIB, libConfigs[0]);
  }, [chartType]);

  const dataInJSON = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '45%' }}>
      <h3>Data in JSON</h3>
      <textarea style={{ height: '100%', overflowY: 'scroll' }} value={prettyJSON(datasample)} />
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
      <select
        value={chartType}
        onChange={(e) => {
          setChartType(e.target.value as ChartID);
        }}
      >
        {chartTypes.map((item) => (
          <option value={item}>{item}</option>
        ))}
      </select>
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
        <h3>lib config ({CHART_LIB})</h3>
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
