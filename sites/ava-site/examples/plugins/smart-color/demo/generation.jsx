import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SketchPicker } from 'react-color';
import { FireFilled } from '@ant-design/icons';
import { paletteGeneration, colorToHex, hexToColor } from '@antv/smart-color';

const fontSize = '60px';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

const App = () => {
  const [colorPick, setColorPick] = useState(colorToHex(color));
  const colorNums = 7;

  const [outputColor, setOutputColor] = useState(
    paletteGeneration('monochromatic', {
      color,
      count: colorNums,
      tendency: 'shade',
    })
  );

  const handleColorChange = (colorChosen) => {
    setColorPick(colorChosen.hex);
  };

  useEffect(() => {
    setOutputColor(
      paletteGeneration('monochromatic', {
        color: hexToColor(colorPick),
        count: colorNums,
        tendency: 'shade',
      })
    );
  }, [colorPick]);

  const baseShape = (
    <span>
      <SketchPicker color={colorPick} onChange={handleColorChange} />
      <span>Selected Color: {colorPick}</span>
    </span>
  );

  const genShape = outputColor.colors.map((item, id) => {
    const currentColor = colorToHex(item);

    return (
      <span
        key={id}
        style={{ flexDirection: 'column', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <FireFilled style={{ fontSize, color: currentColor }} />
        {currentColor}
      </span>
    );
  });

  return (
    <div>
      <div>
        {' '}
        Seed Color: <br /> {baseShape}{' '}
      </div>
      <div>
        {' '}
        Generated Colors: <br /> {genShape}{' '}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
