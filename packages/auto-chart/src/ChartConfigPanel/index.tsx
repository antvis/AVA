import React, { useState } from 'react';
import { prefixCls } from '../utils';

interface ChartConfigPanelProps {
  configDisplay: boolean;
};

interface ChartConfigBtnProps {
  containerHover: boolean;
  onClick: () => void;
};

export const ChartConfigPanel = ({ configDisplay }: ChartConfigPanelProps) => {
  return (
    <div className={`${prefixCls}configPanel`} style={{ display: configDisplay ? 'block' : 'none' }}>
      <div className={`${prefixCls}config_header`}>
        图表配置
      </div>
      <div className={`${prefixCls}config_conttent`}>
        配置内容
      </div>
      <div>
        拷贝配置
      </div>
    </div>
  );
};


export const ChartConfigBtn = ({ containerHover, onClick }: ChartConfigBtnProps) => {
  return (
    <div className={`${prefixCls}config_btn ${prefixCls}config_develop`} style={{ display: containerHover ? 'block' : 'none'}} onClick={onClick}>
      <img src="https://gw.alipayobjects.com/zos/antfincdn/zKMUjshkQt/config.png" />
    </div>
  );
};