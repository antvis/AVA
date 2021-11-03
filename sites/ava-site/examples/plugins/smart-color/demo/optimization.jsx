import React from 'react';
import ReactDOM from 'react-dom';
import { FireFilled } from '@ant-design/icons';
import { paletteOptimization, colorToHex } from '@antv/smart-color';

const fontSize = '60px';

const palette = {
  name: 'color4',
  semantic: null,
  type: 'categorical',
  colors: [
    { model: 'rgb', value: { r: 101, g: 120, b: 155 } },
    { model: 'rgb', value: { r: 91, g: 143, b: 249 } },
    { model: 'rgb', value: { r: 97, g: 221, b: 170 } },
    { model: 'rgb', value: { r: 246, g: 189, b: 22 } },
  ],
};

const paletteOpt = paletteOptimization(palette, {
  locked: [true],
  simulationType: 'grayscale',
});

const App = () => {
  const paletteColors = palette.colors.map((item, id) => {
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

  const paletteOptColors = paletteOpt.colors.map((item, id) => {
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
        Seed Colors: <br /> {paletteColors}{' '}
      </div>
      <div>
        {' '}
        Optimized Colors: <br /> {paletteOptColors}{' '}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
