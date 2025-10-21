import React, { useState, useCallback } from 'react';

import ReactDOM from 'react-dom';
import { Input } from 'antd';
import { Advisor } from '@antv/ava';
import { renderChart } from '@antv/ava-renderer';

const advisor = new Advisor({
  llm: {
    appId: '202508APgb7V00506760',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const App = () => {
  const [chart, setChart] = useState<React.ReactElement>(null);
  const [data] = useState([
    { date: '1999', value: 9 },
    { date: '2000', value: 2 },
    { date: '2001', value: 3 },
    { date: '2002', value: 5 },
    { date: '2003', value: 9 },
  ]);
  const advise = useCallback(async () => {
    const res = await advisor.advise({ data });
    const newChart = renderChart({
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
  }, [data]);

  return (
    <div>
      <Input.TextArea value={JSON.stringify(data)} />
      <button onClick={advise}>advise</button>
      <div>{chart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
