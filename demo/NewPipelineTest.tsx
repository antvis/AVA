import React, { useEffect } from 'react';
import Thumbnails from '@antv/thumbnails';
import { View, parse } from 'vega';
import { compile } from 'vega-lite';

import { CKBJson, ChartID } from '../packages/knowledge';
import { dataToDataProps, dataPropsToSpecs, Advice } from '../packages/chart-advisor/src';
import { DataSamples } from './data-samples';
import { prettyJSON } from './utils';

import './table.less';

const Wiki = CKBJson('en-US', true);
const allTypes = Object.keys(Wiki) as ChartID[];

const allPipelines = allTypes.map((t) => {
  const data = DataSamples.ForChartType(t);
  const dataProps = dataToDataProps(data);
  const specs = dataPropsToSpecs(dataProps);
  const typeSpec = specs.find((s) => s.type === t);

  return {
    chartType: t,
    data,
    dataProps,
    specs,
    typeSpec: typeSpec ? typeSpec.spec : null,
  };
});

export const NewPipelineTest = () => {
  // render after mount
  useEffect(() => {
    allPipelines.forEach(({ chartType, typeSpec, data }) => {
      if (typeSpec) {
        new View(parse(compile({ ...typeSpec, data: { values: data } } as any).spec))
          .initialize(document.getElementById(`vl-${chartType}`)!)
          .runAsync();
      }
    });
  }, []);

  return (
    <table className="pipline-table">
      <thead>
        <tr>
          <th>index</th>
          <th>chart type</th>
          <th>data(json)</th>
          <th>data props</th>
          <th>specs</th>
          <th>vega-lite</th>
          <th>g2</th>
        </tr>
      </thead>
      <tbody>
        {allPipelines.map((pipline, i) => (
          <tr key={pipline.chartType}>
            <th>{i + 1}</th>
            <td>
              {Thumbnails[pipline.chartType] ? (
                <>
                  <img width="200" src={Thumbnails[pipline.chartType]?.url} />
                  <br />
                </>
              ) : null}
              {pipline.chartType}
            </td>
            <td>
              <textarea value={prettyJSON(pipline.data)} className="data-json" />
            </td>
            <td>
              <ul>
                {pipline.dataProps.map((d) => (
                  <li key={`${pipline.chartType}-${d.name}`}>{`${d.name} - ${d.levelOfMeasurements}`}</li>
                ))}
              </ul>
            </td>
            <td>
              <ul>
                {pipline.specs.map((s, sIdx) => (
                  <li
                    key={`${pipline.chartType}-${sIdx}`}
                    style={
                      s.type === pipline.chartType && !isFirstAdvise(pipline.chartType, pipline.specs)
                        ? { color: 'red' }
                        : {}
                    }
                  >{`${s.type} - ${s.score}`}</li>
                ))}
              </ul>
            </td>
            <td>
              <div id={`vl-${pipline.chartType}`}></div>
            </td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

function isFirstAdvise(chartType: ChartID, spec: Advice[]) {
  let cacheScore: number;
  for (let i = 0; i < spec.length; i++) {
    if (i === 0) cacheScore = spec[i].score;
    if (spec[i].type === chartType) {
      return spec[i].score >= cacheScore!;
    }
    cacheScore = spec[i].score;
  }
}
