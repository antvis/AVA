import React, { useState, useEffect, useCallback, useRef } from 'react';

import ReactDOM from 'react-dom';
import { Spin, DatePicker, Select, message, Input } from 'antd';
import { RedditOutlined } from '@ant-design/icons';
import * as Charts from '@antv/g2plot';
import {
  NarrativeTextVis,
  NtvPluginManager,
  createCustomPhraseFactory,
  createCustomBlockFactory,
} from '@antv/ava-react';
import { isEqual } from 'lodash';
import moment from 'moment';
import Mock from 'mockjs';

import type { Plot } from '@antv/g2plot';
import type { NtvTypes } from '@antv/ava-react';

const DATE_FORMAT = 'YYYY.MM.DD';
const mockData = Array.from({ length: 100 }, (v, i) => ({
  date: moment().subtract(i, 'day').format(DATE_FORMAT),
  gmv: Mock.mock('@float(10, 100, 2, 2)'),
}));

// 模拟后端请求返回数据
function fetchData(compareDate = moment().subtract(1, 'week').format(DATE_FORMAT)) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseData = mockData[0];
      const compareData = mockData.find((item) => item.date === compareDate);
      const deltaValue = baseData.gmv - compareData.gmv;
      const ratioValue = deltaValue / baseData.gmv;
      function getAssessment(value) {
        return value > 0 ? 'positive' : 'negative';
      }
      resolve({
        sections: [
          {
            key: 'insight',
            paragraphs: [
              {
                type: 'normal',
                key: 'explain',
                phrases: [
                  { type: 'text', value: '当日 ' },
                  { type: 'entity', value: baseData.date, metadata: { entityType: 'time_desc' } },
                  { type: 'text', value: ' ' },
                  { type: 'entity', value: 'GMV', metadata: { entityType: 'metric_name' } },
                  { type: 'text', value: ' ' },
                  { type: 'entity', value: `${baseData.gmv} 万`, metadata: { entityType: 'metric_value' } },
                  { type: 'text', value: '，对比基准日期' },
                  {
                    type: 'custom',
                    value: compareDate,
                    metadata: {
                      customType: 'compare_date',
                      // 服务端告诉客户端只允许用户选择的时间范围
                      allowRange: [0, 30],
                    },
                  },
                  {
                    type: 'entity',
                    value: `${Math.abs(deltaValue).toFixed(2)} 万`,
                    metadata: { entityType: 'delta_value', assessment: getAssessment(deltaValue) },
                  },
                  { type: 'text', value: '（' },
                  {
                    type: 'entity',
                    value: `${(Math.abs(ratioValue) * 100).toFixed(2)}%`,
                    metadata: { entityType: 'ratio_value', assessment: getAssessment(ratioValue) },
                  },
                  { type: 'text', value: '）' },
                  { type: 'text', value: deltaValue > 0 ? '增加 ' : '减少 ' },
                  {
                    type: 'custom',
                    value: '',
                    metadata: { customType: 'gmv_trend_desc', options: ['明显', '平缓', '可忽略不计'] },
                  },
                  { type: 'text', value: '。主要影响因素是：' },
                  {
                    type: 'custom',
                    value: Mock.mock('@csentence(10, 20)'),
                    metadata: { customType: 'gmv_insight' },
                  },
                ],
              },
              {
                customType: 'plot',
                key: 'plot',
                // 服务端告诉前端可选的图表类型范围，用于切换
                chartTypes: ['Line', 'Scatter'],
                data: mockData,
              },
            ],
          },
        ],
      });
    }, 500);
  });
}

const Chart = ({ chartTypes, config }) => {
  const container = useRef();
  const plot = useRef<Plot<any>>();
  const prevConfig = useRef(config);
  const [chatType, setChartType] = useState(chartTypes[0]);

  useEffect(() => {
    if (container.current) {
      // 在局部刷新机制下，判断如果有 plot 需要比对 config 然后进行销毁
      if (plot.current) {
        if (isEqual(prevConfig.current, config)) return;
        plot?.current?.destroy();
      }
      plot.current = new Charts[chatType](container.current, config);
      prevConfig.current = config;
      plot.current.render();
    }
  }, [config]);

  // 如果是图表类型变化，必然重新渲染
  useEffect(() => {
    if (plot.current) plot?.current?.destroy();
    if (container.current) {
      plot.current = new Charts[chatType](container.current, config);
      plot.current.render();
    }
  }, [chatType]);

  return (
    <>
      <div style={{ textAlign: 'right', marginBottom: 12 }}>
        <Select
          bordered={false}
          value={chatType}
          style={{ width: 100 }}
          options={chartTypes.map((t) => ({ label: t, value: t }))}
          onChange={(value) => {
            setChartType(value);
          }}
        />
      </div>
      <div ref={container}></div>
    </>
  );
};

const App = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [textSpec, setTextSpec] = useState<NtvTypes.NarrativeTextSpec>({});
  const [pluginManager] = useState(new NtvPluginManager());

  const getTextSpecFormServer = useCallback((compareDate?: string) => {
    setLoading(true);
    fetchData(compareDate).then((spec) => {
      setTextSpec(spec);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getTextSpecFormServer();
    pluginManager.registerAll([
      createCustomBlockFactory({
        key: 'plot',
        render(metadata) {
          return (
            <Chart
              chartTypes={metadata.chartTypes}
              config={{
                data: metadata.data,
                padding: 'auto',
                xField: 'date',
                yField: 'gmv',
              }}
            />
          );
        },
      }),
      createCustomPhraseFactory({
        key: 'compare_date',
        overwrite: (node, value, metadata) => {
          const disabledDate = (current) => {
            if (!current) return false;
            const { allowRange } = metadata;
            return (
              current > moment().subtract(allowRange[0], 'day').endOf('day') ||
              current < moment().subtract(allowRange[1], 'day').endOf('day')
            );
          };
          return (
            // @ts-ignore
            <DatePicker
              style={{ width: '120px', textDecoration: 'underline' }}
              size="small"
              disabledDate={disabledDate}
              defaultValue={moment(value)}
              format={`(${DATE_FORMAT})`}
              onChange={(date) => getTextSpecFormServer(moment(date).format(DATE_FORMAT))}
              bordered={false}
            />
          );
        },
      }),
      createCustomPhraseFactory({
        key: 'gmv_trend_desc',
        overwrite: (node, value, metadata) => {
          return (
            <Select
              size="small"
              style={{ padding: 0 }}
              bordered={false}
              options={metadata.options.map((t) => ({ label: t, value: t }))}
              defaultValue={metadata.options[0]}
              dropdownMatchSelectWidth={false}
              onChange={(value) => {
                message.info(`用户希望描述为 ${value}`);
              }}
            />
          );
        },
      }),
      createCustomPhraseFactory({
        key: 'gmv_insight',
        overwrite: (node, value) => {
          return (
            <Input
              size="small"
              style={{ width: '200px', borderBottom: '1px dashed #ccc' }}
              bordered={false}
              defaultValue={value}
              placeholder="请输入洞见"
              prefix={<RedditOutlined style={{ opacity: 0.45 }} />}
            />
          );
        },
      }),
    ]);
  }, [getTextSpecFormServer]);

  return (
    <Spin spinning={loading}>
      <NarrativeTextVis spec={textSpec} pluginManager={pluginManager} />
    </Spin>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
