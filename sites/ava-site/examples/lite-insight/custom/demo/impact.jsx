import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getDataInsights } from '@antv/lite-insight';
import { InsightCard } from 'antv-site-demo-rc';

const App = () => {
  const [result, setResult] = useState({});
  const [loading, setLoading] = useState(true);

  const getInsights = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const insightResult = getDataInsights(data, {
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            visualization: true,
            // 自定义影响力（Impact）分数的计算指标
            // set the measures of the impact score
            impactMeasures: [
              { field: 'life_expect', method: 'COUNT' },
              { field: 'pop', method: 'COUNT' },
              { field: 'fertility', method: 'COUNT' },
            ],
            // 自定义影响力（Impact）分数在洞察分数中的权重（0 ~ 1）
            // adjust the calculation weight of the relevant factors (significance, impact) in the calculation of the insight score.
            impactWeight: 0.5,
          });
          setResult(insightResult);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    getInsights();
  }, []);

  return (
    <>
      <h2 style={{ borderBottom: '1px solid #e9e9e9' }}>Insight list</h2>
      <Spin spinning={loading} style={{ marginTop: 80 }}>
        <div style={{ width: '100%' }}>
          {result.insights &&
            result.insights.map((item, index) => <InsightCard key={index} insightInfo={item} height={400} />)}
        </div>
      </Spin>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
