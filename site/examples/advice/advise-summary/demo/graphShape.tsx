import React, { useState, useCallback } from 'react';

import ReactDOM from 'react-dom';
import { Input } from 'antd';
import { Advisor } from '@antv/ava';
import { renderChart } from '@antv/ava-renderer';

const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const GRAPH_DATA = {
  nodes: [
    { name: 'A', label: 'Start', type: 'source' },
    { name: 'B', label: 'Task 1', type: 'process' },
    { name: 'C', label: 'Task 2', type: 'process' },
    { name: 'D', label: 'Task 3', type: 'process' },
    { name: 'E', label: 'Task 4', type: 'process' },
    { name: 'F', label: 'Task 5', type: 'process' },
    { name: 'G', label: 'Task 6', type: 'process' },
    { name: 'H', label: 'End', type: 'sink' },
  ],
  edges: [
    { f: 'A', t: 'B' },
    { f: 'A', t: 'C' },
    { f: 'B', t: 'D' },
    { f: 'B', t: 'E' },
    { f: 'C', t: 'F' },
    { f: 'D', t: 'G' },
    { f: 'E', t: 'G' },
    { f: 'F', t: 'G' },
    { f: 'G', t: 'H' },
    { f: 'F', t: 'H' },
  ],
};

const App = () => {
  const [chart, setChart] = useState<React.ReactElement>(null);
  const [data] = useState(GRAPH_DATA);
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
      <Input.TextArea value={data} />
      <button onClick={advise}>advise</button>
      <div>{chart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
