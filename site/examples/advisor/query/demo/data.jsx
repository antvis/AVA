import React, { useState, useEffect } from 'react';
import { Input, Button, message, Space } from 'antd';
import ReactDOM from 'react-dom';
import { AVA, bindRenderer } from '@antv/ava';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';

const { createRoot } = ReactDOM;

export const render = (container, spec) => {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
  if (!mount) return;

  const { type, ...chartProps } = spec;
  const VISComps = DEFAULT_CHART_COMPONENTS;
  const Comp = VISComps[type];

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  const chartElement = React.createElement(Comp, chartProps);
  const root = createRoot(mount);
  root.render(chartElement);
};

// 创建 ava 实例
const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const sampleQuery = `[
  {"year": 2017, "revenue": 8540000000, "employeeSatisfaction": 7.2},
  {"year": 2018, "revenue": 9320000000, "employeeSatisfaction": 7.5},
  {"year": 2019, "revenue": 10010000000, "employeeSatisfaction": 7.8},
  {"year": 2020, "revenue": 10860000000, "employeeSatisfaction": 8},
  {"year": 2021, "revenue": 11550000000, "employeeSatisfaction": 8.2}
]`;

const App = () => {
  const [query, setQuery] = useState(sampleQuery);
  const [isAdvising, setIsAdvising] = useState(false);

  useEffect(() => {
    // 为ava实例绑定渲染器;
    bindRenderer(render);
  }, []);

  const advise = async () => {
    if (isAdvising) return;
    setIsAdvising(true);
    const hide = message.loading('正在生成图表建议...', 0);
    try {
      const advises = await ava.advise(query);
      ava.render('#chart', advises[0].charts[0].spec);
    } finally {
      hide();
      setIsAdvising(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Input.TextArea
          value={query}
          rows={7}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="请输入图表数据"
        />
        <Button onClick={advise} disabled={isAdvising} loading={isAdvising}>
          advise
        </Button>
        <div id="chart" />
      </Space>
    </div>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = createRoot(mountNode);
  root.render(<App />);
}
