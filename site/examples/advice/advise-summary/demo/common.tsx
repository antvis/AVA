import React, { useState } from 'react';

import ReactDOM from 'react-dom';
import { Input, Button } from 'antd';
import { Advisor } from '@antv/ava';
import { render } from '@antv/gpt-vis';

Advisor.bindRenderer(render);
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

const App = () => {
  const [data, setData] = useState(sampleData);

  const advise = async () => {
    const res = await advisor.advise({ data });
    const finalRes = res[0];
    advisor.render({
      container: '#chart',
      spec: finalRes.adviseCharts[0].spec,
    });
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

ReactDOM.render(<App />, document.getElementById('container'));
