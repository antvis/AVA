import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Skeleton, Card } from 'antd';
import { PlotCard } from 'antv-site-demo-rc';
import { getInsights } from '@antv/ava';
import { NarrativeTextVis } from '@antv/ava-react';

import type { InsightTypes } from '@antv/ava';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<InsightTypes.InsightsResult>();

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const insightResult = getInsights(data, {
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            // 洞察结果中会增加对应的可视化展示方案（基于g2plot）
            // the corresponding visualization scheme will be added to the insight results (based on g2plot)
            visualization: {
              summaryType: 'schema',
            },
          });
          setResult(insightResult);
          setLoading(false);
        }
      });
  }, []);

  return (
    <>
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {result?.insights &&
            result?.insights.slice(0, 3).map((item, index) => {
              const { data, visualizationSchemas } = item;
              const { chartType, chartSchema, insightSummaries, caption } = visualizationSchemas[0];
              return (
                <Card key={index} style={{ marginBottom: 12 }}>
                  <PlotCard chartType={chartType} data={data} caption={caption} schema={chartSchema} height={400} />
                  {insightSummaries.map((summary, idx) => (
                    <NarrativeTextVis.Paragraph key={idx} spec={{ type: 'normal', phrases: summary }} />
                  ))}
                </Card>
              );
            })}
        </>
      )}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
