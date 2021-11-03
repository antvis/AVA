import React from 'react';
import ReactDOM from 'react-dom';
import { paletteOptimization } from '@antv/smart-color';

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

paletteOptimization(palette, {
  locked: [true],
  simulationType: 'grayscale',
});

const App = () => {};

ReactDOM.render(<App />, document.getElementById('container'));
