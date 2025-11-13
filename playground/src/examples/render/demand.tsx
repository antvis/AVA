import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom/client';
import { Input, Button, Space, Card, message } from 'antd';
import { Advisor, bindRenderer } from '../../../../src';
import { Line, Area, Bar, Pie } from '@antv/gpt-vis';
import { cleanAndFormatJSON, formatJSON } from '../../utils';

// GPT-Vis 按需引用
const demandRender = (container: string, spec: any) => {
  const { type, ...chartProps } = spec;
  const chartType = type as 'line' | 'area' | 'bar' | 'pie';
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;
  const VISComps = {
    line: Line,
    area: Area,
    bar: Bar,
    pie: Pie,
  };
  const Comp = VISComps[chartType] as React.ComponentType<any>;

  if (!Comp) {
    message.error(`不支持的图表类型: ${chartType}`);
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  mount.innerHTML = '';

  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const sampleData = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderDemand: React.FC = () => {
  const [data, setData] = useState(JSON.stringify(sampleData, null, 2));

  useEffect(() => {
    bindRenderer(demandRender as any);
  }, []);

  const render = async () => {
    try {
      const cleaned = cleanAndFormatJSON(data);
      const parsedData = JSON.parse(cleaned);
      advisor.render('#img-chart', parsedData);
    } catch (error) {
      message.error(`请输入有效的 JSON 格式数据: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="按需引用 GPT-Vis 图表" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h3>输入图表数据：</h3>
            <Input.TextArea
              value={data}
              onChange={(e) => {
                setData(e.target.value);
              }}
              placeholder="请输入图表数据（JSON 格式）"
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <Space>
            <Button onClick={() => formatJSON(data, setData)}>格式化 JSON</Button>
            <Button type="primary" onClick={render}>
              生成图表
            </Button>
          </Space>
          <div>
            <h3>图表展示：</h3>
            <div
              id="img-chart"
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '20px',
                minHeight: '400px',
              }}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default RenderDemand;
