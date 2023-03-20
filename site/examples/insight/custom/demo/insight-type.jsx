import React, { useState, useEffect, createRef } from 'react';

import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getInsights } from '@antv/ava';
import { ChartView } from 'antv-site-demo-rc';

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
            // 只提取categoryOutlier类型的洞察
            // extract categoryOutlier
            insightTypes: ['category_outlier'],
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
            result.insights.map((insight) => {
              return insight.visualizationSpecs?.map((spec) => {
                const { chartSpec } = spec;
                return chartSpec ? (
                  <ChartView
                    chartRef={createRef()}
                    spec={chartSpec}
                    style={{
                      height: 480,
                    }}
                  />
                ) : null;
              });
            })}
        </div>
      </Spin>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
