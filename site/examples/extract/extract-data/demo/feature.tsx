/* eslint-disable import/no-unresolved */
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button } from 'antd';
import { Advisor } from '@antv/ava';

const advisor = new Advisor({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const App = () => {
  const [input, setInput] = useState(
    `
    [
      {
        "category": "Q1",
        "value": 200,
        "group": "公司 A"
      },
      {
        "category": "Q1",
        "value": 180,
        "group": "公司 B"
      },
      {
        "category": "Q2",
        "value": 250,
        "group": "公司 A"
      },
      {
        "category": "Q2",
        "value": 230,
        "group": "公司 B"
      },
      {
        "category": "Q3",
        "value": 300,
        "group": "公司 A"
      },
      {
        "category": "Q3",
        "value": 280,
        "group": "公司 B"
      },
      {
        "category": "Q4",
        "value": 350,
        "group": "公司 A"
      },
      {
        "category": "Q4",
        "value": 330,
        "group": "公司 B"
      }
    ]
  `.trim()
  );
  const [reslut, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    setLoading(true);
    const result = await advisor.extract(input);
    setResult(result);
    setLoading(false);
  }, [loading]);

  return (
    <div>
      <h3>输入内容：</h3>
      <Input.TextArea style={{ height: '300px' }} value={input} onChange={(e) => setInput(e.target.value)} />
      <Button onClick={handleExtract} loading={loading}>
        提取
      </Button>
      <h3>提取结果：</h3>
      <pre>
        <code lang="json">{JSON.stringify(reslut, null, 2)}</code>
      </pre>
    </div>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = ReactDOM.createRoot(mountNode);
  root.render(<App />);
}
