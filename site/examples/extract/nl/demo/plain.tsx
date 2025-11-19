/* eslint-disable import/no-unresolved */
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, Space, Card } from 'antd';
import { JsonView } from 'react-json-view-lite';
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const CARD_STYLE = {
  width: '100%',
  maxHeight: '500px',
  overflow: 'auto',
};

const INPUT_DATA =
  '2021 年公司不同部门的预算分配，研发部 50 百万美元，市场部 40 百万美元，销售部 60 百万美元，行政部 20 百万美元';

const App = () => {
  const [input, setInput] = useState(INPUT_DATA);
  const [reslut, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    setLoading(true);
    const result = await ava.extract(input);
    setResult(result);
    setLoading(false);
  }, [loading]);

  return (
    <Space style={{ width: '100%' }} direction="vertical" size="middle">
      <Card
        style={CARD_STYLE}
        title="输入内容："
        actions={[
          <Button key="run" type="primary" onClick={handleExtract} loading={loading}>
            提取
          </Button>,
        ]}
      >
        <Input.TextArea readOnly style={{ height: '300px' }} value={input} onChange={(e) => setInput(e.target.value)} />
      </Card>
      <Card style={CARD_STYLE} title="提取结果：">
        <JsonView data={reslut} />
      </Card>
    </Space>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = ReactDOM.createRoot(mountNode);
  root.render(<App />);
}
