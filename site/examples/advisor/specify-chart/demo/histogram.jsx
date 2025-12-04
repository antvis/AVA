import React, { useState, useEffect } from 'react';
import { Input, Button, message, Space } from 'antd';
import ReactDOM from 'react-dom';
import { AVA, bindRenderer } from '@antv/ava';
import { render } from '@antv/gpt-vis';

const { createRoot } = ReactDOM;

// 创建 ava 实例
const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const sampleQuery =
  '用直方图展示某学校学生每周阅读时间（单位：小时），阅读时间在 0-10 小时之间，将其划分为 5 个区间，数据如下：`[3, 7, 2, 8, 5]`。';

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
        <Input.TextArea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="请输入图表数据" />
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
