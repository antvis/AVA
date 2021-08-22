import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import CKBList from './demos/CKBList';

export interface Demo {
  id: string;
  name: string;
  contentComp: React.ReactNode; // TODO: ts type for ContentPage rc
  icon: React.ReactNode;
}

interface Manifest {
  demos: Demo[];
}

// set your manifest here:
const manifest: Manifest = {
  demos: [
    {
      id: 'CKBList',
      name: 'CKBList',
      contentComp: CKBList,
      icon: <EyeOutlined />,
    },
  ],
};

export default manifest;
