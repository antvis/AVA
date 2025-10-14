/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { NarrativeTextVis, NtvPluginManager, createRatioValue, createDeltaValue } from '@antv/ava-react';

const POS_COLOR = '#269075';
const NEG_COLOR = '#f4664a';

const plugins = [
  createRatioValue({
    encoding: {
      // 修改默认着色
      color: (text, { assessment }) =>
        assessment === 'negative' ? NEG_COLOR : assessment === 'positive' ? POS_COLOR : '',
      // 修改比率左侧的标记为上下箭头
      prefix: (text, { assessment }) => (assessment === 'positive' ? '↑' : assessment === 'negative' ? '↓' : ''),
    },
  }),
  createDeltaValue({
    encoding: {
      // 修改差值左侧的标记为上下箭头
      color: (text, { assessment }) =>
        assessment === 'negative' ? NEG_COLOR : assessment === 'positive' ? POS_COLOR : '',
      // 修改默认着色
      prefix: (text, { assessment }) => (assessment === 'positive' ? '↑' : assessment === 'negative' ? '↓' : ''),
    },
  }),
];

const pluginManager = new NtvPluginManager(plugins);

const App = () => {
  const [booking, setSpec] = useState({});
  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then(setSpec);
  }, []);
  return (
    <>
      <NarrativeTextVis spec={booking} pluginManager={pluginManager} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
