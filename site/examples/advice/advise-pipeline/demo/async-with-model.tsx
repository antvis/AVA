import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView } from 'antv-site-demo-rc';
import { Advisor, ModelGeneratePlugin, ModelRecommendPlugin } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor(
  {},
  {
    plugins: [
      new ModelGeneratePlugin({
        select: (input) => {
          return input?.[ModelGeneratePlugin.MODEL_RESULT_KEY];
        },
      }),
      new ModelRecommendPlugin({
        request: async (input) => {
          try {
            // 这里模拟模型调用
            const res = {
              chartConfigs: [
                {
                  chartType: '模型输出',
                  encode: { x: {} },
                  log: {
                    data: input?.data,
                  },
                },
              ],
            };
            return res;
          } catch (e) {
            // console.error(e);
          }
          return { chartConfigs: [] };
        },
        request2: async (input) => {
          // 这里 input 是规则输出的图表配置
          return {
            chartConfigs: [
              {
                chartType: '模型规则融合的输出',
                encode: {},
                log: {
                  ruleResult: input?.chartConfigs,
                },
              },
            ],
          };
        },
      }),
    ],
  }
);

const App = () => {
  const [results, setResults] = useState();
  useEffect(() => {
    myChartAdvisor.adviseAsync({ data: defaultData }).then((results) => {
      setResults(results);
    });
  }, []);

  return <JSONView json={results?.[0]} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />;
};

ReactDOM.render(<App />, document.getElementById('container'));
