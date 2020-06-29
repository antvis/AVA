import React, { useState, useEffect } from 'react';
import { AVAChart } from './Charts';
import { dataInTable, dataInJSON } from '../utils';
import { insightsFromData, Insight } from '../../packages/chart-advisor/src';
import ReactJson from 'react-json-view';
import { RowData } from '../../packages/datawizard/transform/src';
import { insightSamples } from '../data-samples';

import { INSIGHT_TYPES } from '../../packages/chart-advisor';

const sampleGetters: { name: string; getter: Function }[] = [];

INSIGHT_TYPES.forEach((t) => {
  const sample = insightSamples.find((s) => s.insights && s.insights.includes(t));
  if (sample && sample.data) {
    const data = sample.data;
    sampleGetters.push({
      name: t,
      getter: () => {
        return data;
      },
    });
  }
});

export function FindInsightTest() {
  const dataFromSampleName = (sampleName: string): RowData[] => {
    const selectedGetter = sampleGetters.find((g) => g.name === sampleName);
    if (!selectedGetter) return [];

    const sampleData = selectedGetter.getter();
    return sampleData as RowData[];
  };

  const [insights, setInsights] = useState<Insight[]>([]);
  const [sampleName, setSampleName] = useState<string>('CategoryOutliers'); //xxx: sampleGetters[0].name
  const [dataSource, setDataSource] = useState<RowData[]>(dataFromSampleName(sampleName));

  useEffect(() => {
    if (dataSource.length > 0) {
      insightsFromData(dataSource).then((insights) => {
        console.log('🉑🉑🉑🉑 insights');
        console.log(insights);
        setInsights(insights);
      });
    }
  }, [dataSource]);

  useEffect(() => {
    setDataSource(dataFromSampleName(sampleName));
  }, [sampleName]);

  const genTitle = (insight: Insight): string => {
    const { fields } = insight;
    return fields.join(' and ');
  };

  const genDesc = (insight: Insight): string => {
    // todo: rename insights
    return insight.type;
  };

  const genOptions = (insight: Insight): any => {
    const options: any = { title: genTitle(insight), description: genDesc(insight) };

    if (insight.present && insight.present.type) {
      const config: any = { type: insight.present.type };
      if (insight.present.encoding) {
        config.configs = insight.present.encoding;
      }
      options.config = config;
    }
    return options;
  };

  return (
    <>
      {/* data */}
      <label>Sample Data:</label>
      <select
        name="sampledata"
        id="sampledata"
        value={sampleName}
        onChange={(e) => {
          setSampleName(e.target.value);
        }}
      >
        {sampleGetters.map((g) => (
          <option value={g.name} key={g.name}>
            {g.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', minHeight: '200px', maxHeight: '300px' }}>
        {dataInJSON(dataSource)}
        {dataInTable(dataSource)}
      </div>
      {/* insights */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          minHeight: '200px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <ReactJson src={insights} displayDataTypes={false} />
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
        {insights.slice(0, 20).map((insight) => (
          <div style={{ width: '480px', height: '420px' }} key={`${insight.type}-${insight.fields.join('-')}`}>
            <AVAChart
              dataSource={insight.present && insight.present.data ? insight.present.data : dataSource}
              fields={insight.present && insight.present.fields ? insight.present.fields : insight.fields}
              options={genOptions(insight)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
