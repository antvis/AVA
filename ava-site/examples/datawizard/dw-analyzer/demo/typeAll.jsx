import React from 'react';
import ReactDOM from 'react-dom';
import { Divider } from 'antd';
import { typeAll } from '@antv/dw-analyzer';
import ReactJson from 'react-json-view';

const App = () => {
  const data = [
    { x: 1, y: 1, z: 1 },
    { x: 2, y: 4, z: 4 },
    { x: 3, y: 6, z: 9 },
    { x: 4, y: 8, z: 16 },
    { x: 5, y: 10, z: 25 },
  ];
  const fieldInfo = typeAll(data);

  const style = {
    border: '2px solid #eee',
    padding: '2px 5px',
  };
  return (
    <div>
      <h3>Data</h3>
      <table style={{ width: '100%' }}>
        <tr>
          {fieldInfo.map((info) => (
            <th key={info.name} style={style}>
              {info.name}
            </th>
          ))}
        </tr>
        {data.map((row, index) => (
          <tr key={index}>
            {fieldInfo.map((info) => (
              <td style={style} key={info.name}>
                {row[info.name]}
              </td>
            ))}
          </tr>
        ))}
      </table>
      <Divider />
      <h3>Field Information</h3>
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        <ReactJson src={fieldInfo} collapsed={1} />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
