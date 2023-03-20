import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { Empty, Row, Spin } from 'antd';
import cx from 'classnames';
import { isFunction } from 'lodash';
import { getInsights } from '@antv/ava';

import { copyToClipboard, NarrativeTextVis, NtvPluginManager, TextExporter } from '../NarrativeTextVis';

import { generateNarrativeVisSpec } from './utils/specGenerator';
import { Title } from './Title';
import { Toolbar } from './Toolbar';
import { insightCardPresetPlugins } from './ntvPlugins';
import { INSIGHT_CARD_PREFIX_CLS } from './constants';

import type { Tool } from './Toolbar/types';
import type { InsightCardProps, InsightCardInfo, InsightDataStatus } from './types';

import './index.less';

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
  customContentSpec,
}: InsightCardProps) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const { measures = [], dimensions = [] } = defaultInsightInfo;
  const [currentInsightInfo, setCurrentInsightInfo] = useState<InsightCardInfo>(defaultInsightInfo);
  const [dataStatus, setDataStatus] = useState<InsightDataStatus>('SUCCESS');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pluginManager = useRef<NtvPluginManager>(new NtvPluginManager([...insightCardPresetPlugins, ...extraPlugins]));

  const ref = useRef<HTMLDivElement>(null);

  const calculateAndSetInsightPatterns = useCallback(() => {
    const { allData } = autoInsightOptions;
    setDataStatus('RUNNING');
    try {
      const { insights } = getInsights(allData, {
        measures,
        dimensions,
        // todo 待 getInsights 支持传入 subspace 后增加传入 subspace
        ...autoInsightOptions,
      });
      setCurrentInsightInfo(insights[0]);
    } catch (err) {
      setErrorMessage('');
    }
    setDataStatus('SUCCESS');
  }, [measures, dimensions, autoInsightOptions]);

  useEffect(() => {
    // if patterns or visualizationSpecs is not empty, do not need generate insight patterns
    if (defaultInsightInfo.patterns || defaultInsightInfo.visualizationSpecs) {
      setCurrentInsightInfo(defaultInsightInfo);
      return;
    }
    // if patterns and visualizationSpecs are empty, use autoInsightOptions to generate insight patterns
    if (autoInsightOptions) {
      calculateAndSetInsightPatterns();
    }
  }, [defaultInsightInfo, autoInsightOptions]);

  const contentSpec = useMemo(() => {
    const defaultSpec = generateNarrativeVisSpec(currentInsightInfo);
    const customSpec = isFunction(customContentSpec)
      ? customContentSpec?.(currentInsightInfo, defaultSpec)
      : customContentSpec;
    return customSpec ?? defaultSpec;
  }, [currentInsightInfo]);

  useEffect(() => {
    onCardExpose?.(currentInsightInfo, ref.current);
  }, []);

  useEffect(() => {
    onChange?.(currentInsightInfo, contentSpec);
  }, [currentInsightInfo, contentSpec]);

  const onClickCopy = async () => {
    if (ref?.current) {
      const textExporter = new TextExporter([...insightCardPresetPlugins, ...extraPlugins]);
      const html = await textExporter.getNarrativeHtml(ref.current);
      const plainText = contentSpec ? textExporter.getNarrativeText(contentSpec) : '';
      copyToClipboard(html, plainText);
      onCopy?.(currentInsightInfo, ref.current);
    }
  };

  const defaultFootTools: Tool[] = [
    {
      type: 'copy',
      onClick: onClickCopy,
    },
    {
      type: 'export',
    },
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
    <div className={cx(className, prefixCls)} style={styles} ref={ref}>
      <Title
        title={title}
        measures={measures}
        dimensions={dimensions}
        patterns={currentInsightInfo.patterns}
        headerTools={headerTools}
      />
      {/* content */}
      <Spin spinning={dataStatus === 'RUNNING'}>
        {dataStatus === 'SUCCESS' && contentSpec ? (
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
    </div>
  );
};
