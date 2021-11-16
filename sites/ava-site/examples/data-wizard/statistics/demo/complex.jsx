import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Divider, Select, Input } from 'antd';
import { statistics } from '@antv/data-wizard';

const { Option } = Select;
const { TextArea } = Input;

const data1 = [{ n: 1 }, { n: 2 }];
const data2 = [
  {
    dim: 1,
    n: 1,
  },
  {
    dim: 2,
    n: 2,
    m: 2,
  },
  {
    dim: 3,
    n: 3,
    k: 3,
  },
  {
    dim: 2,
    n: 4,
    p: 4,
  },
];

const targetMeasure1 = 'n';
const targetMeasure2 = 'dim';

const methods = ['minBy', 'maxBy', 'sumBy', 'meanBy', 'countBy', 'groupBy', 'aggregate'];

const App = () => {
  const [method, setMethod] = useState(methods[0]);

  const onChange = (value) => {
    setMethod(value);
  };

  return (
    <div>
      <h3>Statistical Method</h3>
      <Select style={{ width: '300px' }} defaultValue={methods[0]} onChange={onChange}>
        {methods.map((m) => (
          <Option key={m}>{m}</Option>
        ))}
      </Select>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flexBasis: '300px' }}>
          <h3>Data</h3>
          <TextArea
            style={{ resize: 'none', height: '100px', border: '2px solid #eee', padding: '20px' }}
            value={method !== 'aggregate' ? JSON.stringify(data1) : JSON.stringify(data2)}
          />
        </div>
        <div style={{ flexBasis: '300px' }}>
          <h3>Result</h3>
          <TextArea
            style={{ resize: 'none', height: '100px', border: '2px solid #eee', padding: '20px' }}
            value={
              method !== 'aggregate'
                ? JSON.stringify(statistics[method](data1, targetMeasure1))
                : JSON.stringify(statistics[method](data2, targetMeasure2, targetMeasure1))
            }
          />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
