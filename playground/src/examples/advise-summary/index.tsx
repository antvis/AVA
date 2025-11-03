import React, { useState } from 'react';

import { Input, Button, Space, Card, message } from 'antd';
import { Advisor } from '@antv/ava';

// 渲染器已在 App.tsx 中全局绑定，这里直接使用
const advisor = new Advisor({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
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
      if (parsedData) {
        const advises = await advisor.advise({ data: parsedData });
        advisor.render({
          container: '#chart',
          spec: advises[0].charts[0].spec,
        });
      }
    } catch (_e) {
      // 忽略错误，仅用于验证 advisor.render
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
