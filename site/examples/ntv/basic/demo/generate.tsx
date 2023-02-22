/* eslint-disable no-template-curly-in-string */
import React from 'react';

import ReactDOM from 'react-dom';
import { generateTextSpec } from '@antv/ava';
import { NarrativeTextVis } from '@antv/ava-react';

ReactDOM.render(
  <NarrativeTextVis
    spec={generateTextSpec({
      structures: [
        {
          template: '${measureName}是${measureValue}，排名前三的城市是&{city}。',
          variableMetaMap: {
            measureName: {
              varType: 'metric_name',
            },
            measureValue: {
              varType: 'metric_value',
            },
          },
        },
      ],
      structureTemps: [
        {
          templateId: 'city',
          template: '${.name}(${.value})',
          useVariable: 'top3',
          separator: '、',
          variableMetaMap: {
            '.name': {
              varType: 'dim_value',
            },
            '.value': {
              varType: 'metric_value',
            },
          },
        },
      ],
      variable: {
        measureName: '单价',
        measureValue: 1.23,
        top3: [
          {
            name: '北京',
            value: 1000,
          },
          {
            name: '上海',
            value: 800,
          },
          {
            name: '杭州',
            value: 600,
          },
        ],
      },
    })}
  />,
  document.getElementById('container')
);
