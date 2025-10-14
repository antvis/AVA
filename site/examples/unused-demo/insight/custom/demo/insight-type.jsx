import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getInsights } from '@antv/ava';
import { InsightCard } from '@antv/ava-react';

const App = () => {
  const [result, setResult] = useState({});
  const [loading, setLoading] = useState(true);

  const getMyInsights = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const insightResult = getInsights(data, {
            limit: 10,
            measures: [
              { fieldName: 'life_expect', method: 'MEAN' },
              { fieldName: 'pop', method: 'SUM' },
              { fieldName: 'fertility', method: 'MEAN' },
            ],
            visualization: true,
            // 提取time_series_outlier、trend类型的洞察
            // extract time_series_outlier and trend
            insightTypes: ['time_series_outlier', 'trend'],
          });
          setResult(insightResult);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    getMyInsights();
  }, []);

  return (
    <>
      <h2 style={{ borderBottom: '1px solid #e9e9e9' }}>Insight list</h2>
      <Spin spinning={loading} style={{ marginTop: 80 }}>
        <div style={{ width: '100%' }}>
          {result.insights &&
            result.insights.map((insight, index) => {
              return <InsightCard insightInfo={insight} key={index} />;
            })}
        </div>
      </Spin>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
