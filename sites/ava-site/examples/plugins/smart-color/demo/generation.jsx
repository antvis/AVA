import React from 'react';
import ReactDOM from 'react-dom';
import { paletteGeneration } from '@antv/smart-color';

paletteGeneration('monochromatic', {
  color: {
    model: 'rgb',
    value: { r: 91, g: 143, b: 249 },
  },
  count: 7,
  tendency: 'shade',
});

const App = () => {};

ReactDOM.render(<App />, document.getElementById('container'));
