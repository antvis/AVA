import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { Empty, message, Row, Spin } from 'antd';
import cx from 'classnames';
import { isFunction } from 'lodash';
import { getInsights } from '@antv/ava';

import { copyToClipboard, NarrativeTextVis, NtvPluginManager, TextExporter } from '../NarrativeTextVis';

import { generateContentVisSpec } from './utils/specGenerator';
import { Title } from './Title';
import { Toolbar } from './Toolbar';
import { insightCardPresetPlugins } from './ntvPlugins';
import { EXPORT_DATA_LABEL, INSIGHT_CARD_PREFIX_CLS } from './constants';
import { Container } from './styled/container';
import { defaultMoreButton } from './Toolbar/defaultTools';

import type { InsightInfo } from '@antv/ava';
import type { Tool } from './Toolbar/types';
import type { InsightCardProps, InsightCardInfo, InsightDataStatus } from './types';

export const InsightCard: React.FC<InsightCardProps> = ({
  className,
  styles,
  insightInfo: defaultInsightInfo,
  headerTools = [],
  footerTools,
  title,
  extraPlugins = [],
  onCardExpose,
  onChange,
  onCopy,
  autoInsightOptions,
  visualizationOptions,
  customContentSpec,
}: InsightCardProps) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const { measures = [], dimensions = [] } = defaultInsightInfo || {};
  const [currentInsightInfo, setCurrentInsightInfo] = useState<InsightCardInfo>(defaultInsightInfo);
  const [dataStatus, setDataStatus] = useState<InsightDataStatus>('SUCCESS');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pluginManager = useRef<NtvPluginManager>(new NtvPluginManager([...insightCardPresetPlugins, ...extraPlugins]));

  const ref = useRef<HTMLDivElement>(null);

  const calculateAndSetInsightPatterns = useCallback(() => {
    const { allData, ...restOptions } = autoInsightOptions;
    setDataStatus('RUNNING');
    try {
      const { insights } = getInsights(allData, {
        measures,
        dimensions,
        // todo 待 getInsights 支持传入 subspace 后增加传入 subspace
        ...restOptions,
      });
      setCurrentInsightInfo(insights[0]);
    } catch (err) {
      setErrorMessage('');
    }
    setDataStatus('SUCCESS');
  }, [measures, dimensions, autoInsightOptions]);

  useEffect(() => {
    // if patterns or visualizationSpecs is not empty, do not need generate insight patterns
    if (defaultInsightInfo?.patterns) {
      setCurrentInsightInfo(defaultInsightInfo);
      return;
    }
    // if patterns and visualizationSpecs are empty, use autoInsightOptions to generate insight patterns
    if (autoInsightOptions) {
      calculateAndSetInsightPatterns();
    }
  }, [defaultInsightInfo, autoInsightOptions]);

  const contentSpec = useMemo(() => {
    if (!currentInsightInfo?.patterns)
      return isFunction(customContentSpec) ? customContentSpec?.(currentInsightInfo) : customContentSpec;

    const defaultSpec = generateContentVisSpec(currentInsightInfo as InsightInfo, visualizationOptions);
    const customSpec = isFunction(customContentSpec)
      ? customContentSpec?.(currentInsightInfo, defaultSpec)
      : customContentSpec;
    return customSpec ?? defaultSpec;
  }, [currentInsightInfo, customContentSpec]);

  useEffect(() => {
    onCardExpose?.(currentInsightInfo, ref.current);
  }, []);

  useEffect(() => {
    onChange?.(currentInsightInfo, contentSpec);
  }, [currentInsightInfo, contentSpec]);

  const onCopySuccess = () => {
    message.success(visualizationOptions?.lang === 'zh-CN' ? '复制成功' : 'Copy Success');
  };

  const onClickCopy = async () => {
    if (ref?.current) {
      const textExporter = new TextExporter([...insightCardPresetPlugins, ...extraPlugins]);
      const html = await textExporter.getNarrativeHtml(ref.current);
      const plainText = contentSpec ? textExporter.getNarrativeText(contentSpec) : '';
      copyToClipboard(html, plainText, onCopySuccess);
      onCopy?.(currentInsightInfo, ref.current);
    }
  };

  const defaultFootTools: Tool[] = [
    {
      type: 'copy',
      onClick: onClickCopy,
    },
    defaultMoreButton({
      items: [
        { key: 'insightInfo', label: EXPORT_DATA_LABEL[visualizationOptions?.lang || 'en-US'].insightInfo },
        { key: 'spec', label: EXPORT_DATA_LABEL[visualizationOptions?.lang || 'en-US'].insightInfo },
      ],
      onClick: (menuInfo) => {
        if (menuInfo.key === 'insightInfo') {
          const insightInfoString = JSON.stringify(currentInsightInfo);
          copyToClipboard(insightInfoString, insightInfoString, onCopySuccess);
        }
        if (menuInfo.key === 'spec') {
          const specString = JSON.stringify(contentSpec);
          copyToClipboard(specString, specString, onCopySuccess);
        }
      },
    }),
  ];

  if (!footerTools) {
    // eslint-disable-next-line no-param-reassign
    footerTools = defaultFootTools;
  }

  const renderFooter = () => {
    return (
      footerTools && (
        <Row className={`${prefixCls}-footer`} justify="end">
          <Toolbar tools={footerTools} data={currentInsightInfo} />
        </Row>
      )
    );
  };

  return (
    <Container className={cx(className, prefixCls)} style={styles} ref={ref}>
      <Title
        title={title}
        measures={measures}
        dimensions={dimensions}
        patterns={currentInsightInfo?.patterns}
        headerTools={headerTools}
      />
      {/* content */}
      <Spin spinning={dataStatus === 'RUNNING'}>
        {dataStatus === 'SUCCESS' && !!contentSpec ? (
          <>
            <div className={`${prefixCls}-insight-result-container`}>
              <NarrativeTextVis spec={contentSpec} size="small" pluginManager={pluginManager.current} />
            </div>
            {renderFooter()}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ height: 24 }}
            description={dataStatus !== 'RUNNING' ? 'no insights found' : ''}
          />
        )}
      </Spin>
      {dataStatus === 'ERROR' && <p>{errorMessage}</p>}
    </Container>
  );
};
