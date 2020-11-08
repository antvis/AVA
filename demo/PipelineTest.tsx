import React, { useEffect } from 'react';
import Thumbnails from '@antv/thumbnails';
import { View, parse } from 'vega';
import { compile } from 'vega-lite';

import { ChartID, CHART_ID_OPTIONS } from '../packages/knowledge';
import {
  dataToDataProps,
  dataPropsToAdvices,
  Advice,
  specToLibConfig,
  g2plotRender,
} from '../packages/chart-advisor/src';
import { DataSamples } from './data-samples';
import { prettyJSON } from './utils';

import './table.less';

const allPipelines = CHART_ID_OPTIONS.map((t) => {
  const data = DataSamples.ForChartType(t);
  const dataProps = dataToDataProps(data);
  const specs = dataPropsToAdvices(dataProps);
  const typeSpec = specs.find((s) => s.type === t);

  let libConfig = null;
  if (typeSpec) {
    libConfig = specToLibConfig(typeSpec);
  }

  return {
    chartType: t,
    data,
    dataProps,
    specs,
    typeSpec: typeSpec ? typeSpec.spec : null,
    libConfig,
  };
});

export const PipelineTest = () => {
  // render after mount
  useEffect(() => {
    allPipelines.forEach(({ chartType, typeSpec, data, libConfig }) => {
      if (typeSpec) {
        new View(parse(compile({ ...typeSpec, data: { values: data } } as any).spec))
          .initialize(document.getElementById(`vl-${chartType}`)!)
          .runAsync();
      }

      if (libConfig) {
        g2plotRender(`g2-${chartType}`, data, libConfig);
      }
    });
  }, []);

  return (
    <table className="pipeline-table">
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
        {allPipelines.map((pipeline, i) => (
          <tr key={pipeline.chartType}>
            <th>{i + 1}</th>
            <td>
              {Thumbnails[pipeline.chartType] ? (
                <>
                  <img width="100" src={Thumbnails[pipeline.chartType]?.url} />
                  <br />
                </>
              ) : null}
              {pipeline.chartType}
            </td>
            <td>
              <textarea value={prettyJSON(pipeline.data)} className="data-json" />
            </td>
            <td>
              <ul>
                {pipeline.dataProps.map((d) => (
                  <li key={`${pipeline.chartType}-${d.name}`}>{`${d.name} - ${d.levelOfMeasurements}`}</li>
                ))}
              </ul>
            </td>
            <td>
              <ul>
                {pipeline.specs.map((s, sIdx) => (
                  <li
                    key={`${pipeline.chartType}-${sIdx}`}
                    style={
                      s.type === pipeline.chartType && !isFirstAdvise(pipeline.chartType, pipeline.specs)
                        ? { color: 'red' }
                        : {}
                    }
                  >{`${s.type} - ${s.score}`}</li>
                ))}
              </ul>
            </td>
            <td>
              <div id={`vl-${pipeline.chartType}`}></div>
            </td>
            <td>
              <div id={`g2-${pipeline.chartType}`}></div>
            </td>
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
  return true;
}
