
import React, { useState, useEffect } from 'react';
import { AVAChart } from './insights';
import { dataInTable, dataInJSON } from '../utils';
import { getMappingForLib, Channels } from '../../packages/chart-advisor/src';
import {insightsFromDataset, Insight} from '../../packages/chart-advisor/src/perception'
import { RowData } from '../../packages/datawizard/transform/src';
import { perceptualSamples } from '../data-samples';

const sampleGetters: { name: string; getter: Function }[] = [];

perceptualSamples.forEach((s: any) => {
  sampleGetters.push({
    name: s.name,
    getter: () => {
      return s.data;
    },
  });
});

export function PerceptualTest() {
  const dataFromSampleName = (sampleName: string): RowData[] => {
    const selectedGetter = sampleGetters.find((g) => g.name === sampleName);
    if (!selectedGetter) return [];

    const sampleData = selectedGetter.getter();
    return sampleData as RowData[];
  };

  const initSample = 'Iris';

  const [insights, setInsights] = useState<Insight[]>([]);
  const [sampleName, setSampleName] = useState<string>(initSample); //xxx: sampleGetters[0].name
  const [dataSource, setDataSource] = useState<RowData[]>(dataFromSampleName(sampleName));

  useEffect(() => {
    if (dataSource.length > 0) {
      insightsFromDataset(dataSource).then((insights) => {
        console.log('🉑 perceptual insights');
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
    return `${insight.type}${insight.description ? '\n' : null}${insight.description ? insight.description : null}`;
  };

  const genOptions = (insight: Insight): any => {
    const options: any = { title: genTitle(insight), description: genDesc(insight) };

    if (insight.present && insight.present.type) {
      const { typeMapping, configMapping } = getMappingForLib('G2Plot');
      const config: any = { type: typeMapping[insight.present.type] };

      if (insight.present.encoding) {
        const configs: any = {};

        for (const [key, value] of Object.entries(insight.present.encoding)) {
          const configMapForType = configMapping[insight.present.type];
          if (configMapForType) {
            const channel = configMapForType[key as keyof Channels];
            if (channel) {
              configs[channel] = value;
            }
          }
        }

        config.configs = configs;

        const defaultConfigs = {
          title: {
            visible: !!genTitle(insight),
            text: genTitle(insight),
          },
          description: {
            visible: !!genDesc(insight),
            text: genDesc(insight),
          },
        };

        if (insight.present && insight.present.configs) {
          config.configs = { ...defaultConfigs, ...config.configs, ...insight.present.configs };
        }
      }
      options.config = config;
    }

    if (insight.present && insight.present.purpose) {
      options.purpose = insight.present.purpose[0] || insight.present.purpose;
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
      {/* <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          minHeight: '200px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <ReactJson src={insights} displayDataTypes={false} />
      </div> */}
      {/* insights charts */}
      <h3>Insights Dashboard</h3>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {insights.slice(0, 40).map((insight, index) => (
          <div style={{ width: '480px', height: '420px' }} key={`${insight.type}-${insight.fields.join('-')}-${index}`}>
            {/* <AutoChart
              data={insight.present && insight.present.data ? insight.present.data : dataSource}
              fields={insight.present && insight.present.fields ? insight.present.fields : insight.fields}
            /> */}
            <AVAChart
              insight={insight}
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
