import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView } from 'antv-site-demo-rc';
import { Advisor } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor();

const App = () => {
  const [results, setResults] = useState();

  useEffect(() => {
    myChartAdvisor.adviseAsync2({ data: defaultData }).then((results) => {
      setResults(results);
    });
  }, []);

  return <JSONView json={results?.advices?.[0]} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />;
};

ReactDOM.render(<App />, document.getElementById('container'));
