import React from 'react';

import ReactDOM from 'react-dom';
import { NarrativeTextVis } from '@antv/ava-react';

import type { NarrativeTextSpec } from '@antv/ava-react';

const spec: NarrativeTextSpec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            { type: 'entity', value: 'DAU', metadata: { entityType: 'metric_name' } },
            { type: 'text', value: ' ' },
            { type: 'entity', value: '1.23亿', metadata: { entityType: 'metric_value', origin: 123077.34 } },
            { type: 'text', value: '，环比昨日 ' },
            { type: 'entity', value: '80万', metadata: { entityType: 'delta_value', assessment: 'positive' } },
            { type: 'text', value: '（' },
            { type: 'entity', value: '2.3%', metadata: { entityType: 'ratio_value', assessment: 'positive' } },
            { type: 'text', value: '）。' },
            { type: 'text', value: '最近 3 个动态 7 天' },
            {
              type: 'entity',
              value: '趋势上涨',
              metadata: {
                entityType: 'trend_desc',
                detail: [1, 2, 6, 18, 24, 48],
              },
            },
            { type: 'text', value: '。' },
            { type: 'text', value: '按垂直行业分：' },
            {
              type: 'text',
              value:
                'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque, reprehenderit modi aspernatur nemo sapiente, quasi, alias possimus cum quidem eos consequatur. Repellat eius incidunt iste nobis ipsum veniam ad hic.',
            },
          ],
          indents: [
            { type: 'first-line', length: '2em' },
            { type: 'left', length: '20%' },
            { type: 'right', length: '20%' },
          ],
        },
      ],
    },
  ],
};

ReactDOM.render(<NarrativeTextVis spec={spec} />, document.getElementById('container'));
