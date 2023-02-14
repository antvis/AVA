import React, { useState, useEffect } from 'react';

import { Skeleton, Switch } from 'antd';
// import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

import { NarrativeTextVis } from '../../../../packages/ava-react/src';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSmall, setIsSmall] = useState(false);
  const [spec, setSpec] = useState({});
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>(['0', '0-1', '1-0']);

  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('collapsedKeys: ', collapsedKeys);
  }, [collapsedKeys]);

  return (
    <>
      <Switch checked={isSmall} onChange={setIsSmall} checkedChildren="Small" unCheckedChildren="Normal" />
      {loading ? <Skeleton active /> : <NarrativeTextVis spec={spec} size={isSmall ? 'small' : 'normal'} />}
      <NarrativeTextVis
        spec={{
          sections: [
            {
              paragraphs: [
                {
                  type: 'bullets',
                  isOrder: true,
                  key: 'bullet',
                  bullets: new Array(3).fill(0).map((_, outIndex) => ({
                    type: 'bullet-item',
                    key: `${outIndex}`,
                    phrases: [
                      {
                        type: 'text',
                        value: `这是第 ${outIndex + 1} 个`,
                      },
                    ],
                    subBullet: {
                      type: 'bullets',
                      isOrder: false,
                      bullets: new Array(2).fill(0).map((_, innerIndex) => ({
                        type: 'bullet-item',
                        key: `${outIndex}-${innerIndex}`,
                        phrases: [
                          {
                            type: 'text',
                            value: `${outIndex + 1} - ${innerIndex + 1}`,
                          },
                        ],
                        subBullet: {
                          type: 'bullets',
                          isOrder: true,
                          bullets: new Array(2).fill(0).map((_, threeIndex) => ({
                            type: 'bullet-item',
                            key: `${outIndex}-${innerIndex}-${threeIndex}`,
                            phrases: [
                              {
                                type: 'text',
                                value: `hhhhhh ${outIndex + 1} - ${innerIndex + 1} - ${threeIndex}`,
                              },
                            ],
                          })),
                        },
                      })),
                    },
                  })),
                },
              ],
            },
          ],
        }}
        showCollapse={{
          // 调试代码注释
          showBulletsLine: false,
          // switcherIcon: (collapsed) => (!collapsed ? <MinusOutlined /> : <PlusOutlined />),
          collapsedKeys,
          onCollapsed: setCollapsedKeys,
        }}
        size={isSmall ? 'small' : 'normal'}
      />
    </>
  );
};

export default <App />;
