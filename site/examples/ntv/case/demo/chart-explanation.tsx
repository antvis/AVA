import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Skeleton } from 'antd';
import { getInsights } from '@antv/ava';
import { InsightCard } from '@antv/ava-react';

import type { InsightsResult } from '@antv/ava';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<InsightsResult>();

  useEffect(() => {
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
            visualization: false,
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
          {result?.insights?.map((insightInfo, index) => {
            // 基于 NTV 的 InsightCard 组件展示图表解读
            return <InsightCard insightInfo={insightInfo} styles={{ width: 400 }} key={index} />;
          })}
        </>
      )}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
