import React, { useEffect, useState } from 'react';

import { Input, Button, Space, Card, message } from 'antd';
import { AVA, bindRenderer } from '../../../../src';
import { render } from '../../utils';

// 创建 ava 实例并为该实例绑定渲染器
const ava = new AVA({
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

const AdviseSummary: React.FC = () => {
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
      parsedData = data;
    }
    // 尝试调用 advise，但无论成功与否都渲染兜底图
    message.loading('正在生成图表建议...', 0);
    try {
      const input = typeof parsedData !== 'string' ? JSON.stringify(parsedData) : parsedData;
      const dataShards = await ava.extract(input);
      const advises = await ava.advise(dataShards);
      ava.render('#chart', advises[0].charts[0].spec);
    } catch (_e) {
      // 忽略错误，仅用于验证 ava.render
      // eslint-disable-next-line no-console
      console.log(_e);
    } finally {
      message.destroy();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Advise Summary Demo" style={{ marginBottom: '20px' }}>
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
          <Button type="primary" onClick={advise}>
            生成图表建议
          </Button>
          <div>
            <h3>图表展示：</h3>
            <div
              id="chart"
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

export default AdviseSummary;
