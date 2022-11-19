import React, { useState } from 'react';

import { Divider, Input, Alert } from 'antd';
import ReactJson from 'react-json-view';

import { DataFrame } from '../../../../packages/ava/lib';

const { TextArea } = Input;

const Data: React.FC = () => {
  const [data, setData] = useState([
    { city: 'Shanghai', population: 24281400 },
    { city: 'Chengdu', population: 20938000 },
    { city: 'Hangzhou', population: 11936010 },
    { city: 'Beijing', population: 21893000 },
    { city: 'Chongqing', population: 30170000 },
    { city: 'Changsha', population: 10047914 },
    { city: 'Wuhan', population: 11212000 },
    { city: 'Nanchang', population: 6255000 },
    { city: 'Lanzhou', population: 3319200 },
    { city: 'Guangzhou', population: 18676600 },
  ]);
  const [textAreaValue, setTextAreaValue] = useState(JSON.stringify(data));
  const [errorMessage, setErrorMessage] = useState('');
  const df = new DataFrame(data);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          height: '32px',
        }}
      >
        <h1 style={{ marginBottom: 0 }}>Data</h1>
        {errorMessage ? <Alert message={errorMessage} style={{ padding: '4px' }} type="error" closable /> : null}
      </div>
      <TextArea
        style={{ resize: 'none', height: '120px' }}
        value={textAreaValue}
        onChange={(e) => {
          const newValue = e.target.value;
          try {
            const newData = JSON.parse(newValue);
            setData(newData);
            setErrorMessage('');
          } catch {
            setErrorMessage('Please input standard JSON');
          } finally {
            setTextAreaValue(newValue);
          }
        }}
      />
      <Divider />
      <h1>Field Information (df.info())</h1>
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        <ReactJson src={df.info()} collapsed={1} />
      </div>
    </div>
  );
};

export default <Data />;
