import React from 'react';

import { CopyOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Tooltip, Dropdown } from 'antd';

import { INSIGHT_CARD_PREFIX_CLS } from '../constants';
import { IconButton } from '../styled/iconButton';

import type { BaseIconButtonProps, DefaultToolType } from './types';
import type { DropdownProps } from 'antd';

export const BaseIconButton: React.FC<BaseIconButtonProps> = ({ icon, onClick, description }) => {
  return (
    <Tooltip
      title={description}
      overlayClassName={`${INSIGHT_CARD_PREFIX_CLS}-icon-button-tooltip`}
      overlayStyle={{ fontSize: '12px' }}
    >
      <IconButton>
        <Button
          icon={icon}
          className={`${INSIGHT_CARD_PREFIX_CLS}-icon-button`}
          onClick={onClick}
          type="text"
          size="small"
        />
      </IconButton>
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

export const defaultMoreButton = (props: DropdownProps['menu'] = {}) => {
  const { items, onClick } = props;
  return {
    type: 'others',
    description: '',
    icon: (
      <Dropdown menu={{ items, onClick }}>
        <MoreOutlined />
      </Dropdown>
    ),
  };
};

export const getDefaultTool = (type: DefaultToolType) => {
  const toolsFunctionMap = {
    copy: defaultCopyButton,
    others: defaultMoreButton,
  };
  return toolsFunctionMap[type]?.();
};
