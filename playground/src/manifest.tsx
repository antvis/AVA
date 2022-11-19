import React from 'react';

import { EyeOutlined, GiftOutlined, RobotOutlined } from '@ant-design/icons';

import CKBList from './DevPlayground/CKBList';
// import Data from './DevPlayground/Data';
import LiteInsight from './DevPlayground/LiteInsight';
import ChartAdvisor from './DevPlayground/ChartAdvisor';

export interface Demo {
  id: string;
  name: string;
  contentComp: React.ReactNode; // TODO: ts type for ContentPage rc
  icon?: React.ReactNode;
  subTests?: Demo[];
}

interface Manifest {
  avaDemos: Demo[];
  avaReactDemos: Demo[];
}

// set your manifest here:
const manifest: Manifest = {
  avaDemos: [
    {
      id: 'CKBList',
      name: 'CKB',
      contentComp: CKBList,
      icon: <EyeOutlined />,
    },
    // {
    //   id: 'Data',
    //   name: 'Data',
    //   contentComp: Data,
    //   icon: <EyeOutlined />,
    // },
    {
      id: 'ChartAdvisor',
      name: 'Advisor',
      contentComp: ChartAdvisor,
      icon: <RobotOutlined />,
    },
    {
      id: 'LiteInsight',
      name: 'LiteInsight',
      contentComp: LiteInsight,
      icon: <GiftOutlined />,
    },
  ],
  avaReactDemos: [
    {
      id: 'ntv',
      name: 'ntv',
      contentComp: CKBList,
      icon: <EyeOutlined />,
    },
  ],
};

export default manifest;
