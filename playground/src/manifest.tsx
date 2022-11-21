import React from 'react';

import { EyeOutlined, GiftOutlined, RobotOutlined, DatabaseOutlined, FontSizeOutlined } from '@ant-design/icons';

import CKBList from './DevPlayground/CKBList';
import Data from './DevPlayground/Data';
import LiteInsight from './DevPlayground/LiteInsight';
import ChartAdvisor from './DevPlayground/ChartAdvisor';
import NtvDemo from './DevPlayground/NTV';

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
    {
      id: 'Data',
      name: 'Data',
      contentComp: Data,
      icon: <DatabaseOutlined />,
    },
    {
      id: 'ChartAdvisor',
      name: 'Advisor',
      contentComp: ChartAdvisor,
      icon: <RobotOutlined />,
    },
    {
      id: 'LiteInsight',
      name: 'Insight',
      contentComp: LiteInsight,
      icon: <GiftOutlined />,
    },
  ],
  avaReactDemos: [
    {
      id: 'ntv',
      name: 'ntv',
      contentComp: NtvDemo,
      icon: <FontSizeOutlined />,
    },
  ],
};

export default manifest;
