import React from 'react';

import { isFunction } from 'lodash';

import { INSIGHT_CARD_PREFIX_CLS } from '../constants';

import { DEFAULT_TOOLS } from './constants';
import { BaseIconButton, getDefaultTool } from './defaultTools';

import type { DefaultToolType, ToolbarProps } from './types';

export const Toolbar = ({ tools = [], data }: ToolbarProps) => {
  const getDefaultIconProps = (type: DefaultToolType) => {
    if (DEFAULT_TOOLS.includes(type)) {
      return getDefaultTool(type);
    }
    return null;
  };
  const toolButtons = tools?.map((tool) => {
    if (tool?.type) {
      const { type, icon, description, onClick } = tool;
      const onClickIconButton: React.MouseEventHandler<HTMLElement> = (event) => {
        onClick?.(event, type, data);
      };

      const defaultIconProps = getDefaultIconProps(type as DefaultToolType);

      const customProps = {
        icon: isFunction(icon) ? icon(type, data) : icon,
        description: isFunction(description) ? description(type, data) : description,
      };
      const iconButtonProps = {
        icon: customProps.icon ?? defaultIconProps?.icon,
        description: customProps.description ?? defaultIconProps?.description,
        onClick: onClickIconButton,
      };
      return <BaseIconButton {...iconButtonProps} key={type} />;
    }
    return tool;
  });

  return tools.length ? (
    <div className={`${INSIGHT_CARD_PREFIX_CLS}-toolbar`} style={{ display: 'inline-block' }}>
      {toolButtons}
    </div>
  ) : null;
};
