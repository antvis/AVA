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
  'mean',
  'geometricMean',
  'harmonicMean',
  'median',
  'quartile',
  'quantile, percent75',
  'variance',
  'standardDeviation',
  'coefficientOfVariance',
  'covariance',
  'pearson',
  'valid',
  'missing',
  'valueMap',
  'distinct',
];

const App = () => {
  const [method, setMethod] = useState(methods[0]);

  const onChange = (value) => {
    setMethod(value);
  };

  const getData = () => {
    if (method === 'covariance' || method === 'pearson') {
      return `${JSON.stringify(data1)}\n${JSON.stringify(data2)}`;
    }
    return `${JSON.stringify(data1)}`;
  };

  const getValue = () => {
    if (method === 'covariance' || method === 'pearson') {
      return JSON.stringify(statistics[method](data1, data2));
    }
    if (method === 'quantile, percent75') {
      return `${JSON.stringify(statistics.quantile(data1, 75))}`;
    }
    return `${JSON.stringify(statistics[method](data1))}`;
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
            value={getData()}
          />
        </div>
        <div style={{ flexBasis: '300px' }}>
          <h3>Result</h3>
          <TextArea
            style={{ resize: 'none', height: '100px', border: '2px solid #eee', padding: '20px' }}
            value={getValue()}
          />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
