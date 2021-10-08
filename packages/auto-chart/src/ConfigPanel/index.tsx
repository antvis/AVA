import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Editor, defaultConfigs } from '@antv/g2plot-schemas';
import { Button, message } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import { withDrag, DragRefProps } from '../DragHoc';
import { prefixCls, getElePosition } from '../utils';
import { intl, Language } from '../i18n';
import getSchema from './getSchema';
import { processConfig, copyConfig, shake, getOption } from './utils';
import '@antv/g2plot-schemas/lib/editor/index.less';

interface ChartConfigPanelProps {
  language: Language;
  configDisplay: boolean;
  chartType?: string;
  configs?: any;
  cancopydata?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onConfigChange?: (config: any, configTrans: any) => void;
  onClose?: () => void;
}

interface ChartConfigBtnProps {
  isActive: boolean;
  onClick: () => void;
}

// eslint-disable-next-line react/display-name
const ChartConfigPanel = forwardRef((props: ChartConfigPanelProps, ref: DragRefProps) => {
  const { chartType, configs, cancopydata = false, language, configDisplay = false, containerRef } = props;
  const configsMerge = configs || getOption(chartType);
  const schema = getSchema(chartType, language);
  const { data, ...config } = shake(configsMerge, defaultConfigs[chartType]);
  const dragContainer = useRef<HTMLDivElement>(null);
  const dragHandler = useRef<HTMLDivElement>(null);

  const onConfigChange = (values) => {
    const newData = processConfig(values);
    props.onConfigChange(values, newData);
  };

  const onConfigClose = () => {
    props.onClose();
  };

  useEffect(() => {
    if (configDisplay) {
      if (containerRef) {
        const elePosition = getElePosition(containerRef.current, dragContainer.current);
        dragContainer.current.style.left = elePosition.left;
        dragContainer.current.style.top = elePosition.top;
      };
      dragContainer.current.style.display = 'block';
    };
    if (!configDisplay && dragContainer) {
      dragContainer.current.style.display = 'none';
    };
  }, [configDisplay]);

  useImperativeHandle(ref, () => {
    return {
      dragContainer: dragContainer.current,
      dragHandler: dragHandler.current,
    };
  });

  return (
    <div className={`${prefixCls}dev_panel`} ref={dragContainer}>
      <div className={`${prefixCls}config_panel`}>
        <div data-id="mask" className={`${prefixCls}dev_mask`}></div>
        <div className={`${prefixCls}config_header`} ref={dragHandler}>
          {intl.get('ChartConfig', language)}
          <img src="https://gw.alipayobjects.com/zos/antfincdn/5mKWpRQ053/close.png" onClick={onConfigClose}></img>
        </div>
        <div className={`${prefixCls}config_content`}>
          <Editor schema={schema} data={configsMerge} lang={language} onChange={onConfigChange} />
        </div>
        <div className={`${prefixCls}config_footer`}>
          {cancopydata === true && (
            <CopyToClipboard
              text={JSON.stringify(data)}
              onCopy={() => {
                message.success(intl.get('CopySuccess', language));
              }}
            >
              <Button style={{ marginRight: 16 }} type="primary">
                {intl.get('CopyData', language)}
              </Button>
            </CopyToClipboard>
          )}
          <CopyToClipboard
            text={JSON.stringify({ configs: copyConfig(config), type: chartType })}
            onCopy={() => {
              message.success(intl.get('CopySuccess', language));
            }}
          >
            <Button type="primary">{intl.get('CopyConfig', language)}</Button>
          </CopyToClipboard>
        </div>
      </div>
    </div>
  );
});

const dragChartConfigPanel = withDrag(ChartConfigPanel);

export { dragChartConfigPanel as ChartConfigPanel };
export const ChartConfigBtn = ({ isActive, onClick }: ChartConfigBtnProps) => {
  return (
    <div
      className={`${prefixCls}config_btn ${prefixCls}config_develop`}
      style={{ display: isActive ? 'block' : 'none' }}
      onClick={onClick}
    >
      <img src="https://gw.alipayobjects.com/zos/antfincdn/zKMUjshkQt/config.png" />
    </div>
  );
};
