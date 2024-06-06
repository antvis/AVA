import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';
import { PagList, JSONView } from 'antv-site-demo-rc';
import { Advisor } from '@antv/ava';

// contants

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

// usage
const myChartAdvisor = new Advisor();

const App = () => {
  const [results, setResults] = useState();

  useEffect(() => {
    myChartAdvisor.adviseAsync({ data: defaultData }).then((results) => {
      setResults(results);
    });
    const { dataProps, data: filteredData } = myChartAdvisor.dataAnalyzer.execute({ data: defaultData }) || {};
    myChartAdvisor.specGenerator.execute({
      dataProps,
      data: filteredData,
      chartTypeRecommendations: [{ chartType: 'pie_chart' }],
    });
    // console.log('advices', advices)
  }, []);

  return (
    <PagList
      data={results}
      renderItem={(item) => <JSONView json={item} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />}
    />
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
