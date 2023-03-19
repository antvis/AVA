import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import type { InsightCardProps, InsightData, InsightDataStatus } from './types';

import './index.less';

export const InsightCard: React.FC<InsightCardProps> = ({
  className,
  styles,
  insightInfo,
  headerTools = [],
  footerTools,
  title,
  extraPlugins = [],
  onCardExpose,
  onChange,
  onCopy,
  insightGenerateConfig,
  customContentSpecGenerator,
}: InsightCardProps) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const { measures = [], patterns: defaultPatterns, dimensions = [] } = insightInfo;
  const [insightPatterns, setInsightPatterns] = useState<InsightData['patterns']>(defaultPatterns);
  const [dataStatus, setDataStatus] = useState<InsightDataStatus>('SUCCESS');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pluginManager = useRef<NtvPluginManager>(new NtvPluginManager([...insightCardPresetPlugins, ...extraPlugins]));

  const contentSpec = useMemo(() => {
    const defaultSpec = generateNarrativeVisSpec(insightInfo);
    return isFunction(customContentSpecGenerator)
      ? customContentSpecGenerator?.(insightInfo, defaultSpec)
      : defaultSpec;
  }, [insightInfo]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (insightInfo.patterns) {
      setInsightPatterns(insightInfo.patterns);
    } else if (insightGenerateConfig && !insightInfo.visualizationSpecs) {
      const { allData, algorithms } = insightGenerateConfig;
      setDataStatus('RUNNING');
      try {
        const { insights } = getInsights(allData, {
          ...insightInfo,
          insightTypes: algorithms,
        });
        const patterns = [];
        insights.forEach((insight) => {
          patterns.push(...insight.patterns);
        });
        setInsightPatterns(patterns);
      } catch (err) {
        setErrorMessage('');
      }
      setDataStatus('SUCCESS');
    }
  }, [insightInfo]);

  useEffect(() => {
    onCardExpose?.(insightInfo, ref.current);
  }, []);

  useEffect(() => {
    onChange?.(
      {
        ...insightInfo,
        patterns: insightPatterns,
      },
      contentSpec
    );
  }, [insightPatterns, contentSpec]);

  const onClickCopy = async () => {
    if (ref?.current) {
      const textExporter = new TextExporter([...insightCardPresetPlugins, ...extraPlugins]);
      const html = await textExporter.getNarrativeHtml(ref.current);
      const plainText = contentSpec ? textExporter.getNarrativeText(contentSpec) : '';
      copyToClipboard(html, plainText);
      onCopy?.(insightInfo, ref.current);
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
          <Toolbar tools={footerTools} data={insightInfo} />
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
        patterns={insightPatterns}
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
