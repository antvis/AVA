import React, { useState } from 'react';

import ReactDOM from 'react-dom';
import { Input } from 'antd';
// import { Advisor } from '@antv/ava';
import { renderChart } from '@antv/ava-renderer';

// const advisor = new Advisor({
//   llm: {
//     appId: '202510APxPmo00551539',
//     authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
//   },
// });

const DEFAULT_DATA = {
  width: 600,
  height: 400,
  type: 'area',
  data: [
    { time: '1991', value: 3 },
    { time: '1992', value: 4 },
    { time: '1993', value: 3.5 },
    { time: '1994', value: 5 },
    { time: '1995', value: 4.9 },
    { time: '1996', value: 6 },
    { time: '1997', value: 7 },
    { time: '1998', value: 9 },
    { time: '1999', value: 13 },
  ],
  axisXTitle: 'Time',
  axisYTitle: 'Value',
  title: 'Area Chart',
};

const App = () => {
  // const [chart, setChart] = useState<React.ReactElement>(null);
  const [data, setData] = useState(DEFAULT_DATA);
  const [inputText, setInputText] = useState<string>(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  // const advise = useCallback(async () => {
  //   const res = await advisor.advise({ data });
  //   console.log('advise result:', res);
  //   const newChart = renderChart(data);
  //   setChart(newChart);
  // }, [data]);

  const visChart = renderChart(data);
  const dataText = {
    type: 'text',
    content: 'This is a simple text chart example.',
    width: 600,
    height: 400,
  };
  // 自定义图表
  const customChart = renderChart(dataText, {
    components: {
      text: ({ content }: { content: string }) => (
        <div style={{ fontSize: 24, textAlign: 'center', color: 'green' }}>{content}</div>
      ),
    },
    defaultRenderer: (params: any) => <div>默认渲染器：无法渲染该图表类型 {JSON.stringify(params)}</div>,
  });

  const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    try {
      const next = JSON.parse(val);
      setData(next);
      setError(null);
    } catch (_err) {
      setError('JSON 解析失败，请检查格式是否正确。');
    }
  };

  return (
    <div>
      <Input.TextArea
        value={inputText}
        onChange={onChangeText}
        autoSize={{ minRows: 8, maxRows: 15 }}
        placeholder="在此编辑图表配置 JSON，示例见默认内容"
      />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {/* <Button onClick={advise}>advise</Button> */}
      <div>{visChart}</div>
      <div style={{ fontSize: 18, margin: '20px 0' }}>自定义Chart: </div>
      <div>{customChart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
