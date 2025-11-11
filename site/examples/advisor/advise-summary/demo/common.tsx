import React, { useState, useEffect } from 'react';
// import reactDomClient from 'react-dom/client';
import { Input, Button, message } from 'antd';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';
import ReactDOM from 'react-dom';

// eslint-disable-next-line import/no-unresolved
import { Advisor, bindRenderer } from '@antv/ava';
// @ts-ignore
const { createRoot } = ReactDOM;

export const render = (container: string, spec: any): React.ReactNode => {
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;

  const { type, ...chartProps } = spec;
  const VISComps = DEFAULT_CHART_COMPONENTS;
  const Comp = VISComps[type] as React.ComponentType<any>;

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  const chartElement = React.createElement(Comp, chartProps);
  const root = createRoot(mount);
  root.render(chartElement);
};

// 创建 advisor 实例并为该实例绑定渲染器
const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const sampleData = [
  { date: '1999', value: 9 },
  { date: '2000', value: 2 },
  { date: '2001', value: 3 },
  { date: '2002', value: 5 },
  { date: '2003', value: 9 },
];

const App = () => {
  const [data, setData] = useState(JSON.stringify(sampleData, null, 2));

  useEffect(() => {
    bindRenderer(render as any);
  }, []);

  const advise = async () => {
    // 安全解析数据，失败不抛错
    let parsedData: any = null;
    try {
      parsedData = JSON.parse(data);
    } catch (_e) {
      parsedData = null;
    }
    // 尝试调用 advise，但无论成功与否都渲染兜底图
    message.loading('正在生成图表建议...', 0);
    try {
      if (!advisor) {
        message.error('advisor instance not ready');
        return;
      }
      if (parsedData) {
        const dataShards = await advisor.extract({ purpose: '请根据数据生成图表建议', data: parsedData });
        const advises = await advisor.advise(dataShards);
        advisor.render('#chart', advises[0].charts[0].spec);
      }
    } catch (_e) {
      // 忽略错误，仅用于验证 advisor.render
      console.log(_e);
    } finally {
      message.destroy();
      render('#chart', {
        type: 'line',
        data: [
          { time: '2010', value: 100 },
          { time: '2011', value: 200 },
        ],
      });
    }
  };

  return (
    <div>
      <Input.TextArea
        value={JSON.stringify(data)}
        onChange={(e) => {
          setData(JSON.parse(e.target.value));
        }}
        placeholder="请输入图表数据"
      />
      <Button onClick={advise}>advise</Button>
      <div id="chart" />
    </div>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = createRoot(mountNode);
  root.render(<App />);
}
