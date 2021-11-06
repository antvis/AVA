import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SketchPicker } from 'react-color';
import { FireFilled } from '@ant-design/icons';
import { colorSimulation, colorToHex, hexToColor } from '@antv/smart-color';

const fontSize = '60px';

const simMethod = 'achromatomaly';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

const App = () => {
  const [colorPick, setColorPick] = useState(colorToHex(color));
  const [colorSim, setColorSim] = useState(colorSimulation(color, simMethod));

  const handleColorChange = (colorChosen) => {
    setColorPick(colorChosen.hex);
  };

  useEffect(() => {
    setColorSim(colorSimulation(hexToColor(colorPick), simMethod));
  }, [colorPick]);

  const oriShape = (
    <span>
      <SketchPicker color={colorPick} onChange={handleColorChange} />
      <span>Selected Color: {colorPick}</span>
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
      <div> Simulation Method: {simMethod} </div>
      <div>
        {' '}
        Simulated Color: <br /> {simShape}{' '}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
