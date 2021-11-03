import React from 'react';
import ReactDOM from 'react-dom';
import { FireFilled } from '@ant-design/icons';
import { colorSimulation, colorToHex } from '@antv/smart-color';

const fontSize = '60px';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

const colorSim = colorSimulation(color, 'achromatomaly');

const App = () => {
  const oriColor = colorToHex(color);
  const oriShape = (
    <span style={{ flexDirection: 'column', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
      <FireFilled style={{ fontSize, color: oriColor }} />
      {oriColor}
    </span>
  );

  const simColor = colorToHex(colorSim);
  const simShape = (
    <span style={{ flexDirection: 'column', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
      <FireFilled style={{ fontSize, color: simColor }} />
      {simColor}
    </span>
  );

  return (
    <div>
      <div>
        {' '}
        Seed Color: <br /> {oriShape}{' '}
      </div>
      <div>
        {' '}
        Simulated Color: <br /> {simShape}{' '}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
