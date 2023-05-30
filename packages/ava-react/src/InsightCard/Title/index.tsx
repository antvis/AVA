import React from 'react';

import cx from 'classnames';
import { isFunction, uniq } from 'lodash';

import { Toolbar } from '../Toolbar';
import { ALGORITHM_NAME_MAP, ALGORITHM_NAME_MAP_ZH, INSIGHT_CARD_PREFIX_CLS } from '../constants';
import { MeasureName, Tag as StyledTag } from '../styled/tag';

import type { InsightCardProps, InsightCardInfo } from '../types';

export type TitleProps = Pick<InsightCardProps, 'headerTools' | 'title' | 'visualizationOptions'> &
  Pick<InsightCardInfo, 'measures' | 'dimensions' | 'patterns'>;
export const Title: React.FC<TitleProps> = ({ title, patterns, measures, headerTools, visualizationOptions }) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const insightTypes = uniq(patterns?.map((pattern) => pattern.type) ?? []);
  const measureNames = uniq(measures?.map((measure) => measure.fieldName)).join(',');
  const algorithmNameMap = visualizationOptions?.lang === 'zh-CN' ? ALGORITHM_NAME_MAP_ZH : ALGORITHM_NAME_MAP;
  const analysisName = insightTypes.map((algorithm) => algorithmNameMap[algorithm]).join(',') ?? '';
  const defaultTitle = (
    <div>
      <MeasureName className={`${prefixCls}-measure-name`}>{measureNames}</MeasureName>
      <StyledTag className={cx(`${prefixCls}-analysis-tag`)}>{analysisName}</StyledTag>
    </div>
  );
  const customTitle = title && isFunction(title) ? title(defaultTitle) : title;

  return (
    <div className={`${prefixCls}-title`}>
      {customTitle ?? defaultTitle}
      {!!headerTools?.length && (
        <div className={`${prefixCls}-title-tools`}>
          <Toolbar tools={headerTools} />
        </div>
      )}
    </div>
  );
};
