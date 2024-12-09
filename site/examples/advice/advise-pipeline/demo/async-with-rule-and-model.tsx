import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView } from 'antv-site-demo-rc';
import { Advisor, ModelGeneratePlugin, ModelRecommendPlugin, Advice } from '@antv/ava';

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
          return {
            advices: input?.[ModelGeneratePlugin.MODEL_RULE_RESULT_KEY]?.chartConfigs,
            log: ['自定义日志输出'],
          };
        },
      }),
      new ModelRecommendPlugin({
        type: ModelRecommendPlugin.TYPE.RULE_MODEL,
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
