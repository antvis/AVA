import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Divider, Input } from 'antd';
import { type } from '@antv/dw-analyzer';
import ReactJson from 'react-json-view';

const { TextArea } = Input;

const App = () => {
  const [data, setData] = useState([1, 2, 3, 4, 5]);
  const fieldInfo = type(data);
  return (
    <div>
      <h3>Data</h3>
      <TextArea
        name="data"
        value={data}
        onChange={(e) => {
          setData(e.target.value.split(','));
        }}
      ></TextArea>
      <Divider />
      <h3>Field Information</h3>
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        <ReactJson src={fieldInfo} collapsed={1} />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
