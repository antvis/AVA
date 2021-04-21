import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { autoChart } from '@antv/chart-advisor';

const data = [
  { type: '石油', value: 1200 },
  { type: '电子', value: 250 },
  { type: '机械', value: 180 },
  { type: '食物', value: 150 },
  { type: '服饰', value: 100 },
];

const chartRuleConfigs = {
  'series-qty-limit': {
    weight: 1, // custom weight from 0.8 to 1
  },
};

const App = () => {
  const originalRef = useRef(null);
  const customizedRef = useRef(null);

  useEffect(() => {
    if (originalRef.current) {
      autoChart(originalRef.current, data, { title: 'Official Recommend' });
    }
    if (customizedRef.current) {
      autoChart(customizedRef.current, data, { title: 'Customized Rules', chartRuleConfigs });
    }
  });

  return (
    <div style={{ display: 'flex' }}>
      <div id="original" ref={originalRef} style={{ flex: 1 }}></div>
      <div id="customized" ref={customizedRef} style={{ flex: 1 }}></div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
