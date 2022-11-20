import React from 'react';

import ReactDOM from 'react-dom';
import { Tooltip } from 'antd';
import { NarrativeTextVis, NtvPluginManager, createMetricName, createCustomPhraseFactory } from '@antv/ava-react';

import type { NtvTypes } from '@antv/ava-react';

const textSpec: NtvTypes.NarrativeTextSpec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            { type: 'text', value: '场景建议排序' },
            {
              type: 'custom',
              value: '场景A-xxx',
              metadata: {
                customType: 'scenes',
                level: 1,
                desc: '',
                owner: '张三',
                scenesType: '最佳情景',
              },
            },
            {
              type: 'custom',
              value: '场景B-yyy',
              metadata: {
                customType: 'scenes',
                level: 2,
              },
            },
            {
              type: 'custom',
              value: '场景C-zzz',
              metadata: {
                customType: 'scenes',
                level: 3,
              },
            },
          ],
        },
        {
          type: 'bullets',
          isOrder: true,
          bullets: [
            {
              type: 'bullet-item',
              phrases: [
                { type: 'text', value: '从整体看，有' },
                {
                  type: 'custom',
                  value: '1',
                  metadata: {
                    customType: 'anomaly',
                  },
                },
                { type: 'text', value: '个异常指标' },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                { type: 'text', value: '从' },
                {
                  type: 'entity',
                  value: '公司数',
                  metadata: {
                    entityType: 'metric_name',
                  },
                },
                { type: 'text', value: '上看，' },
                {
                  type: 'custom',
                  value: '场景B-yyy',
                  metadata: {
                    customType: 'scenes',
                    level: 2,
                  },
                },
                {
                  type: 'custom',
                  value: '8.1',
                  metadata: {
                    customType: 'anomaly',
                  },
                },
                { type: 'text', value: '低于标准，' },
                {
                  type: 'custom',
                  value: '场景C-zzz',
                  metadata: {
                    customType: 'scenes',
                    level: 3,
                  },
                },
                {
                  type: 'custom',
                  value: '9.3%',
                  metadata: {
                    customType: 'percent',
                  },
                },
                { type: 'text', value: '表现良好' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const plugins = [
  // 修改指标名的显示逻辑
  createMetricName({
    encoding: {
      bgColor: '#F8FAFC',
      color: '#424241',
      fontWeight: 600,
    },
    style: {
      padding: '0 6px',
    },
  }),
  createCustomPhraseFactory({
    key: 'anomaly',
    style: {
      backgroundColor: '#FEF5EF',
      color: '#D80D0B',
      padding: '0px 6px',
      margin: '0 4px',
    },
  }),
  createCustomPhraseFactory({
    key: 'percent',
    style: {
      backgroundColor: '#E6F6FF',
      color: '#2695FF',
      padding: '0px 6px',
      margin: '0 4px',
    },
  }),
  createCustomPhraseFactory({
    key: 'scenes',
    overwrite: (node, value, metadata) => {
      const content = (
        <span
          style={{
            margin: '0 2px',
            padding: '0px 6px',
            backgroundColor: '#F8F9F2',
          }}
        >
          {metadata?.level} {value}
        </span>
      );
      if (metadata?.scenesType) {
        return <Tooltip title={metadata?.scenesType}>{content}</Tooltip>;
      }
      return content;
    },
  }),
];

const pluginManager = new NtvPluginManager(plugins);

const App = () => {
  return (
    <>
      <NarrativeTextVis spec={textSpec} pluginManager={pluginManager} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
