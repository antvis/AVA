import React from 'react';
import ReactDOM from 'react-dom';
import { FireFilled } from '@ant-design/icons';
import { paletteGeneration, colorToHex } from '@antv/smart-color';

const fontSize = '60px';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

const outputColor = paletteGeneration('monochromatic', {
  color,
  count: 7,
  tendency: 'shade',
});

const App = () => {
  const baseColor = colorToHex(color);
  const baseShape = (
    <span style={{ flexDirection: 'column', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
      <FireFilled style={{ fontSize, color: baseColor }} />
      {baseColor}
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
