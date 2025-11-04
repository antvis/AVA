import React, { useState, useCallback } from 'react';

import { JSONView } from 'antv-site-demo-rc';
import ReactDOM from 'react-dom';
import { Advisor } from '@antv/ava';

const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const TREE_DATA = {
  id: 1,
  name: '公司总部',
  departments: [
    {
      id: 2,
      name: '技术部',
      departments: [
        { id: 5, name: '前端组' },
        { id: 6, name: '后端组' },
        { id: 7, name: '测试组' },
      ],
    },
    {
      id: 3,
      name: '产品部',
      departments: [
        { id: 8, name: '产品经理' },
        { id: 9, name: 'UX 设计' },
        { id: 10, name: '数据分析' },
      ],
    },
    {
      id: 4,
      name: '运营部',
      departments: [
        { id: 11, name: '市场推广' },
        { id: 12, name: '用户运营' },
        { id: 13, name: '客服支持' },
      ],
    },
  ],
};

const App = () => {
  const [chart, setChart] = useState<React.ReactElement>(null);
  const [data] = useState(TREE_DATA);
  const advise = useCallback(async () => {
    const res = await advisor.advise({ data });
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
  }, [data]);

  return (
    <div>
      <JSONView json={data} />
      <button onClick={advise}>advise</button>
      <div>{chart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
