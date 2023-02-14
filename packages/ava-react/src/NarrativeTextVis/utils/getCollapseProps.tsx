import React from 'react';

import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { isBoolean } from 'lodash';

import type { ExtensionProps, CollapseConfig } from '../types';

const defaultCollapseProps: CollapseConfig = {
  showBulletsLine: true,
  switcherIcon: (collapsed) => (collapsed ? <PlusCircleOutlined /> : <MinusCircleOutlined />),
};

export default function getCollapseProps(collapseProps: ExtensionProps['showCollapse']) {
  if (isBoolean(collapseProps)) {
    return collapseProps ? defaultCollapseProps : false;
  }
  return { ...defaultCollapseProps, ...collapseProps };
}
