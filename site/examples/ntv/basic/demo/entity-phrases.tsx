import React from 'react';

import ReactDOM from 'react-dom';
import { Descriptions } from 'antd';
import { NarrativeTextVis } from '@antv/ava-react';

const { Phrase } = NarrativeTextVis;

const App = () => (
  <div style={{ marginBottom: 48 }}>
    <Descriptions bordered column={2} size="small">
      <Descriptions.Item label="指标名 metric_name">
        <Phrase
          spec={{
            type: 'entity',
            value: 'DAU',
            metadata: {
              entityType: 'metric_name',
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="指标值 metric_value">
        <Phrase
          spec={{
            type: 'entity',
            value: '90.1w',
            metadata: {
              entityType: 'metric_value',
              origin: 901632.11,
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="其他指标 other_metric_value">
        <Phrase
          spec={{
            type: 'entity',
            value: '30%',
            metadata: {
              entityType: 'other_metric_value',
              origin: 0.30012,
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="差值 delta_value">
        <Phrase
          spec={{
            type: 'entity',
            value: '100.33',
            metadata: {
              entityType: 'delta_value',
              assessment: 'positive',
              detail: ['120.12', '220.45'],
              origin: 100.33456,
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="比率 ratio_value">
        <Phrase
          spec={{
            type: 'entity',
            value: '30%',
            metadata: {
              entityType: 'ratio_value',
              assessment: 'negative',
              origin: 0.30012,
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="贡献度 contribute_ratio">
        <Phrase
          spec={{
            type: 'entity',
            value: '20%',
            metadata: {
              entityType: 'contribute_ratio',
              origin: 0.2000077,
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="趋势描述 trend_desc">
        <Phrase
          spec={{
            type: 'entity',
            value: 'periodic',
            metadata: {
              entityType: 'trend_desc',
              detail: [
                264, 417, 438, 887, 309, 397, 550, 575, 563, 430, 525, 592, 492, 467, 513, 546, 983, 340, 539, 243, 226,
                192,
              ],
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="维度值 dim_value">
        <Phrase
          spec={{
            type: 'entity',
            value: '北京',
            metadata: {
              entityType: 'dim_value',
              detail: {
                left: '城市',
                op: '=',
                right: '北京',
              },
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="时间描述 time_desc">
        <Phrase
          spec={{
            type: 'entity',
            value: '2021-10-11',
            metadata: {
              entityType: 'time_desc',
            },
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label="占比 proportion">
        <Phrase
          spec={{
            type: 'entity',
            value: '30%',
            metadata: {
              entityType: 'proportion',
              origin: 0.30012,
            },
          }}
        />
      </Descriptions.Item>
    </Descriptions>
  </div>
);

ReactDOM.render(<App />, document.getElementById('container'));
