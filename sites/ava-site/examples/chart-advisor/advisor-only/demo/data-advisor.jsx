import React from 'react';
import ReactDOM from 'react-dom';
import { PagList, JSONView } from 'antv-site-demo-rc';

// import
import { Advisor } from '@antv/chart-advisor';

// contants

const defaultData = [
  { year: '2007', sales: 28 },
  { year: '2008', sales: 55 },
  { year: '2009', sales: 43 },
  { year: '2010', sales: 91 },
  { year: '2011', sales: 81 },
  { year: '2012', sales: 53 },
  { year: '2013', sales: 19 },
  { year: '2014', sales: 87 },
  { year: '2015', sales: 52 },
];

// usage
const myAdvisor = new Advisor();
const advices = myAdvisor.advise({ data: defaultData });

const App = () => (
  <PagList
    data={advices}
    renderItem={(item) => <JSONView json={item} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />}
  />
);

ReactDOM.render(<App />, document.getElementById('container'));
