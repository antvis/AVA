import React, { useState } from 'react';

import ReactDOM from 'react-dom';
import { Form, Radio } from 'antd';
import { NarrativeTextVis } from '@antv/ava-react';

import type { NtvTypes, NarrativeTextVisProps } from '@antv/ava-react';

const spec: NtvTypes.NarrativeTextSpec = {
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
          ],
        },
        {
          type: 'bullets',
          isOrder: true,
          bullets: [
            ...[
              ['数金服务', '3.23亿', '40.12%'],
              ['民生服务', '1.23亿', '20.12%'],
            ].map<NtvTypes.BulletItemSpec>((item) => ({
              type: 'bullet-item',
              phrases: [
                { type: 'entity', value: item[0], metadata: { entityType: 'dim_value' } },
                { type: 'text', value: ' ' },
                { type: 'entity', value: item[1], metadata: { entityType: 'metric_value' } },
                { type: 'text', value: '（占比 ' },
                { type: 'entity', value: item[2], metadata: { entityType: 'proportion' } },
                { type: 'text', value: ' ）。' },
              ],
            })),
            {
              type: 'bullet-item',
              phrases: [{ type: 'text', value: '...' }],
            },
          ],
        },
      ],
    },
  ],
};

const sizeOptions = ['small', 'normal'].map((item) => ({ label: item, value: item }));

const App = () => {
  const [size, setSize] = useState<NarrativeTextVisProps['size']>('small');
  return (
    <>
      <Form.Item label="size">
        <Radio.Group
          options={sizeOptions}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />
      </Form.Item>
      <NarrativeTextVis spec={spec} size={size} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
