import * as React from 'react';
import { DataSamples } from './data-samples';
import { dataToDataProps, dataPropsToSpecs, specToLibConfig } from '../packages/chart-advisor';

function prettyJSON(json: any) {
  return JSON.stringify(
    json,
    function(_, v) {
      for (const p in v) {
        if (v[p] instanceof Object) {
          return v;
        }
      }
      return JSON.stringify(v, null, 1);
    },
    2
  )
    .replace(/\\n/g, '')
    .replace(/\\/g, '')
    .replace(/"\[/g, '[')
    .replace(/\]"/g, ']')
    .replace(/"\{/g, '{')
    .replace(/\}"/g, ' }');
}

function JSONToTable(jsonArray: any) {
  if (!Array.isArray(jsonArray)) {
    return <div>Data is NOT array!</div>;
  }

  if (jsonArray.length === 0) {
    return <div>Data array is empty!</div>;
  }

  const fields = Object.keys(jsonArray[0]);

  return (
    <table className="columnTable">
      <thead>
        <tr>
          {fields.map((fieldTitle) => {
            return <th key={fieldTitle}>{fieldTitle}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {jsonArray.map((row, index) => (
          <tr key={index}>
            {fields.map((field) => (
              <td key={field}>{`${row[field]}`}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PipelineTest() {
  const datasample = DataSamples.ForChartType('percent_stacked_bar_chart');

  const dataProps = dataToDataProps(datasample);
  const specs = dataPropsToSpecs(dataProps);
  const libConfigs = specs.map((spec) => specToLibConfig(spec, 'G2Plot')).filter((e) => Object.keys(e).length > 0);

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
    </>
  );
}
