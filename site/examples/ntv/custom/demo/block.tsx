import React, { useRef, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Line } from '@antv/g2plot';
import { NarrativeTextVis, NtvPluginManager, createCustomBlockFactory } from '@antv/ava-react';

import type { NtvTypes } from '@antv/ava-react';

const SALES_BY_AREA = [
  { month: '2020-01', value: 2681567, count: 1 },
  { month: '2020-02', value: 4137415, count: 1234 },
  { month: '2020-03', value: 4684506 },
  { month: '2020-04', value: 2447301 },
  { month: '2020-05', value: 815039 },
  { month: '2020-06', value: 1303124 },
];

const textSpec: NtvTypes.NarrativeTextSpec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            { type: 'entity', value: '销量', metadata: { entityType: 'metric_name' } },
            { type: 'text', value: ' ' },
            { type: 'entity', value: '1.23亿', metadata: { entityType: 'metric_value' } },
            { type: 'text', value: '，环比昨日' },
            {
              type: 'entity',
              value: '50万',
              metadata: { entityType: 'delta_value', assessment: 'positive' },
            },
            { type: 'text', value: '。' },
          ],
          styles: {
            marginBottom: 24,
          },
        },
        // step1: 自定义块级元素 customType metadata
        {
          customType: 'line',
          value: {
            data: SALES_BY_AREA,
            padding: 'auto',
            xField: 'month',
            yField: 'value',
          },
        },
      ],
    },
  ],
};

const LineChart = ({ config }) => {
  const container = useRef();
  useEffect(() => {
    if (container.current) {
      const line = new Line(container.current, config);
      line.render();
    }
  }, [config]);
  return <div ref={container}></div>;
};

const pluginManager = new NtvPluginManager([
  // step2: 通过 createCustomBlockFactory 声明自定义元素的表现方式
  createCustomBlockFactory({
    key: 'line',
    render(metadata) {
      if (metadata?.value) return <LineChart config={metadata.value}></LineChart>;
      return null;
    },
  }),
]);

const App = () => {
  return (
    <>
      <NarrativeTextVis
        spec={textSpec}
        // step3: 将插件传入组件
        pluginManager={pluginManager}
      />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
