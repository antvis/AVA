import React from 'react';

import { CopyOutlined, ExportOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { INSIGHT_CARD_PREFIX_CLS } from '../constants';

import type { BaseIconButtonProps, DefaultToolType } from './types';

export const BaseIconButton: React.FC<BaseIconButtonProps> = ({ icon, onClick, description }) => {
  return (
    <Tooltip title={description} overlayClassName={`${INSIGHT_CARD_PREFIX_CLS}-icon-button-tooltip`}>
      <Button
        icon={icon}
        className={`${INSIGHT_CARD_PREFIX_CLS}-icon-button`}
        onClick={onClick}
        type="text"
        size="small"
      />
    </Tooltip>
  );
};

/** default tool for copy */
const defaultCopyButton = () => {
  return {
    type: 'copy',
    description: 'copy',
    icon: <CopyOutlined />,
  };
};

const defaultExportButton = () => {
  return {
    type: 'export',
    description: 'export',
    icon: <ExportOutlined />,
  };
};

export const getDefaultTool = (type: DefaultToolType) => {
  const toolsFunctionMap = {
    copy: defaultCopyButton,
    export: defaultExportButton,
  };
  return toolsFunctionMap[type]?.();
};
