import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView } from 'antv-site-demo-rc';
import { Advisor, ModelPlugin, Advice } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor(
  {},
  {
    plugins: [
      new ModelPlugin({
        types: [ModelPlugin.TYPE.MODEL, ModelPlugin.TYPE.RULE_MODEL],
        request: async ({ input, output }) => {
          try {
            // 这里模拟模型调用
            const res = {
              chartConfigs: [
                {
                  chartType: '规则&模型输出',
                  encode: { x: {} },
                  log: {
                    desc: '方法的参数如下',
                    input,
                    output,
                  },
                },
              ],
            };
            return res;
          } catch (e) {
            // console.error(e);
          }
          return { chartConfigs: output.chartConfigs };
        },
        select: (payload, keys) => {
          return {
            advices: payload?.[keys.RULE_MODEL].chartConfigs,
            log: payload,
          };
        },
      }),
    ],
  }
);

const App = () => {
  const [results, setResults] = useState<Advice[]>();
  useEffect(() => {
    myChartAdvisor.adviseAsync({ data: defaultData }).then((advices) => {
      setResults(advices);
    });
  }, []);

  return <JSONView json={results?.[0]} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />;
};

ReactDOM.render(<App />, document.getElementById('container'));
