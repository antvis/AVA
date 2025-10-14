import React, { useState } from 'react';

import ReactDOM from 'react-dom';
import { NarrativeTextVis } from '@antv/ava-react';
// import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

import type { NarrativeTextSpec } from '@antv/ava-react';

const spec: NarrativeTextSpec = {
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
};

const App = () => {
  // 只有当子节点输入自定义 key 才可以有受控效果
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>(['0', '0-1', '1-0']);
  return (
    <NarrativeTextVis
      spec={spec}
      showCollapse={{
        // 试试打开以下属性
        // showBulletsLine: false,
        // switcherIcon: (collapsed) => (!collapsed ? <MinusOutlined /> : <PlusOutlined />),
        collapsedKeys,
        onCollapsed: setCollapsedKeys,
      }}
    />
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
