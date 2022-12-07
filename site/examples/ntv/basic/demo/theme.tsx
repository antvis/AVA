import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Form, Radio, Descriptions, Skeleton } from 'antd';
import { NarrativeTextVis } from '@antv/ava-react';
import insertCss from 'insert-css';

import type { NarrativeTextVisProps } from '@antv/ava-react';

insertCss(`
  .ntv-dark-desc .ant-descriptions-item-label{
    color: rgba(255, 255, 255, 0.45);
  }

  .ntv-dark-desc.ant-descriptions-bordered .ant-descriptions-item-label {
    background-color: transparent;
  }
`);

const { Phrase } = NarrativeTextVis;

const themeOptions = ['light', 'dark'].map((item) => ({ label: item, value: item }));

const App = () => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<NarrativeTextVisProps['theme']>('dark');
  const [spec, setSpec] = useState({});

  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Form.Item label="theme">
        <Radio.Group
          options={themeOptions}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />
      </Form.Item>
      <div style={{ backgroundColor: theme === 'dark' ? '#000' : '#fff', padding: 24 }}>
        <Descriptions className={theme === 'dark' ? 'ntv-dark-desc' : ''} bordered column={2} size="small">
          <Descriptions.Item label="指标名 metric_name">
            <Phrase
              spec={{
                type: 'entity',
                value: 'DAU',
                metadata: {
                  entityType: 'metric_name',
                },
              }}
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
                    264, 417, 438, 887, 309, 397, 550, 575, 563, 430, 525, 592, 492, 467, 513, 546, 983, 340, 539, 243,
                    226, 192,
                  ],
                },
              }}
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
              theme={theme}
            />
          </Descriptions.Item>
        </Descriptions>
        {loading ? <Skeleton active /> : <NarrativeTextVis spec={spec} theme={theme} />}
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
