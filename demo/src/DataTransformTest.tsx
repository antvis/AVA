import React, { useRef, useEffect } from 'react';
import { dataInJSON, dataInTable } from './utils';
import { autoChart } from '../packages/chart-advisor/src';
import { autoTransform } from '../packages/datawizard/transform/src';

export function DataTransformTest() {
  const datasample = [
    { name: 'Alice', gender: 'Male', height: 180 },
    { name: 'Bob', gender: 'Female', height: 165 },
    { name: 'Carol', gender: 'Male', height: 170 },
  ];

  const chosenColumns = datasample.map((e) => {
    return { gender: e.gender, height: e.height };
  });

  const { result: aggChosenColumns, schemas } = autoTransform(chosenColumns);

  const chartdom1 = useRef(null);
  const chartdom2 = useRef(null);
  const chartdom3 = useRef(null);

  useEffect(() => {
    // @ts-ignore
    autoChart(chartdom1.current, datasample);
    // @ts-ignore
    autoChart(chartdom2.current, chosenColumns);
    // @ts-ignore
    autoChart(chartdom3.current, aggChosenColumns);
  });

  return (
    <>
      {/* data */}
      <h3>Original Data</h3>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', height: '200px' }}>
        {dataInJSON(datasample)}
        {dataInTable(datasample)}
        <div style={{ width: '30%' }} ref={chartdom1}></div>
      </div>
      {/* data after column selecting */}
      <h3>Chosen Columns</h3>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', height: '200px' }}>
        {dataInJSON(chosenColumns)}
        {dataInTable(chosenColumns)}
        <div style={{ width: '30%' }} ref={chartdom2}></div>
      </div>
      {/* charts */}
      <h3>Aggregated Chosen Columns</h3>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', height: '200px' }}>
        {dataInJSON(aggChosenColumns)}
        {dataInTable(aggChosenColumns)}
        <div style={{ width: '30%' }} ref={chartdom3}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', height: '200px' }}>
        {dataInJSON(schemas, 'Schema')}
      </div>
    </>
  );
}
