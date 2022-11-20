import React, { useRef, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Pie } from '@antv/g2plot';
import { NarrativeTextVis } from '@antv/ava-react';
import { get } from 'lodash';
import insertCss from 'insert-css';

import type { NtvTypes } from '@antv/ava-react';

insertCss(`
  .hover-g2plot-pie {
    cursor: pointer;
    margin-bottom: 2px;
  }
  .hover-g2plot-pie:hover {
    background-color: #EEF7FF;
  }
`);

const data = [
  { city: '北京', mau: 1000, rc: +0.12 },
  { city: '上海', mau: 800, rc: -0.22 },
  { city: '广州', mau: 600, rc: +0.02 },
];

const textSpec: NtvTypes.NarrativeTextSpec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [{ type: 'text', value: '各城市数据表现是:' }],
        },
        {
          type: 'bullets',
          isOrder: true,
          bullets: data.map((item) => ({
            type: 'bullet-item',
            className: 'hover-g2plot-pie',
            phrases: [
              { type: 'entity', value: item.city, metadata: { entityType: 'dim_value' } },
              { type: 'text', value: ' 的 ' },
              { type: 'entity', value: 'MAU', metadata: { entityType: 'metric_name' } },
              { type: 'text', value: ' 是 ' },
              { type: 'entity', value: `${item.mau}`, metadata: { entityType: 'metric_value' } },
              { type: 'text', value: ' 环比 ' },
              {
                type: 'entity',
                value: `${Math.abs(item.rc) * 100}%`,
                metadata: { entityType: 'ratio_value', assessment: item.rc > 0 ? 'positive' : 'negative' },
              },
              { type: 'text', value: '。' },
            ],
          })),
        },
      ],
    },
  ],
};

const App = () => {
  const chartContainerRef = useRef();
  const chartRef = useRef<Pie>();

  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = new Pie(chartContainerRef.current, {
        data,
        angleField: 'mau',
        colorField: 'city',
        padding: 20,
      });
      chartRef.current.render();
    }
  }, []);

  const onMouseEnterParagraph = (spec) => {
    if (chartRef.current) {
      const type = get(spec, 'phrases[0].value');
      chartRef.current.setState('selected', (datum: any) => datum.city === type);
      chartRef.current.setState('selected', (datum: any) => datum.city !== type, false);
    }
  };
  const onMouseLeaveParagraph = () => {
    if (chartRef.current) {
      chartRef.current.setState('selected', () => true, false);
    }
  };
  return (
    <>
      <NarrativeTextVis
        spec={textSpec}
        onMouseEnterParagraph={onMouseEnterParagraph}
        onMouseLeaveParagraph={onMouseLeaveParagraph}
      />
      <div ref={chartContainerRef}></div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
