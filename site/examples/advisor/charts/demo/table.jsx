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

const ava = new AVA({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const sampleQuery = '某公司员工信息表：张三-技术部-25岁-8000元，李四-销售部-28岁-7500元，王五-人事部-30岁-7000元，用表格展示员工基本信息';

const App = () => {
  const [query, setQuery] = useState(sampleQuery);
  const [isAdvising, setIsAdvising] = useState(false);

  useEffect(() => {
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
        <Input.TextArea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="请输入图表数据" />
        <Button onClick={advise} disabled={isAdvising} loading={isAdvising}>advise</Button>
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