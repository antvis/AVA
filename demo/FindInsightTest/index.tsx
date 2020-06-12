import React, { useState, useEffect } from 'react';
import { AVAChart } from './Charts';
import { dataInTable, dataInJSON } from '../utils';
import { insightsFromData, Insight } from '../../packages/chart-advisor/src/insight';
import ReactJson from 'react-json-view';
import { RowData } from '../../packages/datawizard/transform/src';
import { superstore } from '../data-samples';

export function FindInsightTest() {
  const [dataSource, setDataSource] = useState<RowData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    // fetch('https://vega.github.io/vega-datasets/data/cars.json')
    //   .then((res) => res.json())
    //   .then((res: RowData[]) => {
    //     setDataSource(res);
    //   });

    // test for monotonicity
    // setDataSource([
    //   { date: '1970-01-01', sex: 0, weight: 10 },
    //   { date: '1970-01-01', sex: 1, weight: 20 },
    //   { date: '1980-01-01', sex: 0, weight: 30 },
    //   { date: '1980-01-01', sex: 1, weight: 40 },
    //   { date: '1990-01-01', sex: 0, weight: 60 },
    //   { date: '1990-01-01', sex: 1, weight: 10 },
    // ]);

    setDataSource(superstore as RowData[]);
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
              dataSource={insight.present && insight.present.data ? insight.present.data : dataSource}
              fields={insight.present && insight.present.fields ? insight.present.fields : insight.fields}
              options={{ title: genTitle(insight), description: genDesc(insight) }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
