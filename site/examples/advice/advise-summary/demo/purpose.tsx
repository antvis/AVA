import React, { useState, useCallback } from 'react';

import { Input } from 'antd';
import ReactDOM from 'react-dom';
import { Advisor } from '@antv/ava';

const advisor = new Advisor({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const App = () => {
  const [chart, setChart] = useState<React.ReactElement>(null);
  const [purpose] = useState(`
    看不同年份的贡献占比:
    ${JSON.stringify([
      { date: '1999', value: 9 },
      { date: '2000', value: 2 },
      { date: '2001', value: 3 },
      { date: '2002', value: 5 },
      { date: '2003', value: 9 },
    ])}
  `);
  const advise = useCallback(async () => {
    const res = await advisor.advise({ purpose });
    const newChart = advisor.render({
      chartConfig: res.adviseCharts[0],
      data: res.data,
      metas: res.metas,
      uiConfig: {
        theme: 'academy',
        backgroundColor: '#eee',
        lineWidth: 5,
      },
    });

    setChart(newChart);
  }, [purpose]);

  return (
    <div>
      <Input value={purpose} type="textarea" />
      <button onClick={advise}>advise</button>
      <div>{chart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
