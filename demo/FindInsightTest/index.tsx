import React, { useState, useEffect } from 'react';
import { AVAChart } from './Charts';
import { dataInTable, dataInJSON } from '../utils';
import { insightsFromData, Insight } from '../../packages/chart-advisor/src/insight';
import ReactJson from 'react-json-view';
import { RowData } from '../../packages/datawizard/transform/src';

export function FindInsightTest() {
  const [dataSource, setDataSource] = useState<RowData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    fetch('https://vega.github.io/vega-datasets/data/cars.json')
      .then((res) => res.json())
      .then((res: RowData[]) => {
        setDataSource(res);
      });
  }, []);
  useEffect(() => {
    if (dataSource.length > 0) {
      insightsFromData(dataSource).then((insights) => {
        console.log('🉑🉑🉑🉑 insights');
        console.log(insights);
        setInsights(insights);
      });
    }
  }, [dataSource]);

  const genTitle = (insight: Insight): string => {
    const { fields } = insight;
    return fields.join(' and ');
  };

  const genDesc = (insight: Insight): string => {
    // todo: rename insights
    return insight.type;
  };

  return (
    <>
      {/* data */}
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
              dataSource={dataSource}
              fields={insight.fields}
              options={{ title: genTitle(insight), description: genDesc(insight) }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
