import React from 'react';

import ReactDOM from 'react-dom';
import { NarrativeTextVis } from '@antv/ava-react';

import type { NestedParagraphSpec } from '@antv/ava-react';

const { NestedParagraph } = NarrativeTextVis;

const spec: NestedParagraphSpec = {
  children: [
    { type: 'normal', phrases: [{ type: 'text', value: '智能分析报告' }] },
    {
      key: '省份1',
      children: [
        { type: 'normal', phrases: [{ type: 'text', value: '省份1的overview表现...' }] },
        { key: '城市1', children: [{ type: 'normal', phrases: [{ type: 'text', value: '城市1xxx' }] }] },
        { key: '城市2', children: [{ type: 'normal', phrases: [{ type: 'text', value: '城市2xxx' }] }] },
      ],
      metadata: {},
    },
    {
      key: '省份2',
      children: [
        { type: 'normal', phrases: [{ type: 'text', value: '省份2的overview表现...' }] },
        { key: '城市3', children: [{ type: 'normal', phrases: [{ type: 'text', value: '城市3xxx' }] }] },
        { key: '城市4', children: [{ type: 'normal', phrases: [{ type: 'text', value: '城市4xxx' }] }] },
      ],
    },
  ],
};

ReactDOM.render(<NestedParagraph spec={spec} />, document.getElementById('container'));
