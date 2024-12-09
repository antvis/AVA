import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView } from 'antv-site-demo-rc';
import { Advisor, AdvisorPlugin, Advice } from '@antv/ava';

class MyPlugin extends AdvisorPlugin<any, any> {
  constructor() {
    super('my-plugin');
  }

  apply = (pipeline) => {
    pipeline.stages.generateAsync.tapPromise('my-plugin-for-generate', async (input, config) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          config.dataStore.set('DEFAULT', { advices: input.DEFAULT?.chartConfigs?.filter((v) => v.score < 1) });
          resolve(null);
        }, 4000);
      });
    });
  };
}

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor(
  {},
  {
    plugins: [new MyPlugin()],
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
