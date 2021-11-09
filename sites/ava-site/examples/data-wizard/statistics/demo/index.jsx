import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Divider, Select, Input } from 'antd';
import { statistics } from '@antv/data-wizard';

const { Option } = Select;
const { TextArea } = Input;

const data1 = [1, 2, 3, 999, 201, 519, 10];
const data2 = [500, 120, 299, 2, 19, 1997, 2019];
const methods = [
  'min',
  'minIndex',
  'max',
  'maxIndex',
  'sum',
  'valid',
  'missing',
  'valueMap',
  'distinct',
  'median',
  'quartile',
  'mean',
  'geometricMean',
  'harmonicMean',
  'variance',
  'standardDeviation',
  'coefficientOfVariance',
  'covariance',
  'pearson',
];

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
            value={`${JSON.stringify(data1)}\n${JSON.stringify(data2)}`}
          />
        </div>
        <div style={{ flexBasis: '300px' }}>
          <h3>Result</h3>
          <TextArea
            style={{ resize: 'none', height: '100px', border: '2px solid #eee', padding: '20px' }}
            value={
              method !== 'covariance' && method !== 'pearson'
                ? `${JSON.stringify(statistics[method](data1))}\n${JSON.stringify(statistics[method](data2))}`
                : JSON.stringify(statistics[method](data1, data2))
            }
          />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
