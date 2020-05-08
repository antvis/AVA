import React, { useRef, useEffect } from 'react';
import { dataInTable, dataInJSON } from './utils';
import { insightsFromData } from '../packages/chart-advisor/src/insight';
import { autoChart } from '../packages/chart-advisor/src';
import { RowData } from '../packages/datawizard/transform/typings/dw-transform';

function filterDataByFields(data: RowData[], fields: string[]): RowData[] {
  return data.map((row) => {
    const newRow: RowData = {};
    fields.forEach((field) => {
      newRow[field] = row[field];
    });
    return newRow;
  });
}

export function FindInsightTest() {
  const datasample = [
    { A: 43, B: 99, C: 87, D: 57, E: 60 },
    { A: 21, B: 65, C: 56, D: 80, E: 83 },
    { A: 25, B: 79, C: 69, D: 75, E: 78 },
    { A: 42, B: 75, C: 63, D: 60, E: 63 },
    { A: 57, B: 87, C: 77, D: 43, E: 46 },
    { A: 59, B: 81, C: 78, D: 40, E: 43 },
  ];

  const insights = insightsFromData(datasample);

  const charts = insights.map((_) => useRef(null));

  useEffect(() => {
    for (let i = 0; i < charts.length; i++) {
      // @ts-ignore
      autoChart(charts[i].current, filterDataByFields(datasample, insights[i].fields));
    }
  });

  return (
    <>
      {/* data */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON(datasample)}
        {dataInTable(datasample)}
      </div>
      {/* insights */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON(insights, 'insights found:')}
      </div>
      {/* insights charts */}
      <h3>Insights Dashboard</h3>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {charts.map((chart, index) => (
          <div key={index} style={{ width: '30%' }} ref={chart}></div>
        ))}
      </div>
    </>
  );
}
