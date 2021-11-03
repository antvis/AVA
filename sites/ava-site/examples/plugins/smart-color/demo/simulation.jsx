import React from 'react';
import ReactDOM from 'react-dom';
import { colorSimulation } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorSimulation(color, 'achromatomaly');

const App = () => {};

ReactDOM.render(<App />, document.getElementById('container'));
