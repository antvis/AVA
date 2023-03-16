import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Empty, Row, Spin } from 'antd';
import cx from 'classnames';

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
  algorithms = [],
  measures = [],
  insightId,
  headerTools = [],
  footerTools,
  title,
  extraPlugins = [],
  onCardExpose,
  onChange,
  onCopy,
  ...restData
}: InsightCardProps) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  // TODO @chenluli if patterns are empty, need to calculate according to algorithms. status and error message are for future use.
  const [dataStatus] = useState<InsightDataStatus>('SUCCESS');
  const [errorMessage] = useState<string>('');
  const pluginManager = useRef<NtvPluginManager>(new NtvPluginManager([...insightCardPresetPlugins, ...extraPlugins]));

  const insightData: InsightData = {
    measures,
    algorithms,
    insightId,
    ...restData,
  };

  const contentSpec = useMemo(() => {
    return generateNarrativeVisSpec(insightData);
  }, [algorithms, measures]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onCardExpose?.(insightData, ref.current);
  }, []);

  useEffect(() => {
    onChange?.(insightData);
  }, [insightData]);

  const onClickCopy = async () => {
    if (ref?.current) {
      const textExporter = new TextExporter([...insightCardPresetPlugins, ...extraPlugins]);
      const html = await textExporter.getNarrativeHtml(ref.current);
      const plainText = contentSpec ? textExporter.getNarrativeText(contentSpec) : '';
      copyToClipboard(html, plainText);
      onCopy?.(insightData, ref.current);
    }
  };

  const defaultFootTools: Tool[] = [
    {
      type: 'copy',
      onClick: onClickCopy,
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
          <Toolbar tools={footerTools} data={insightData} />
        </Row>
      )
    );
  };

  return (
    <div className={cx(className, prefixCls)} style={styles} ref={ref}>
      <Title title={title} algorithms={algorithms} measures={measures} headerTools={headerTools} />
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
