import React from 'react';

import cx from 'classnames';
import { isFunction, uniq } from 'lodash';

import { Toolbar } from '../Toolbar';
import { ALGORITHM_NAME_MAP, INSIGHT_CARD_PREFIX_CLS } from '../constants';

import type { InsightCardProps, InsightCardInfo } from '../types';

import './index.less';

export type TitleProps = Pick<InsightCardProps, 'headerTools' | 'title'> &
  Pick<InsightCardInfo, 'measures' | 'dimensions' | 'patterns'>;
export const Title: React.FC<TitleProps> = ({ title, patterns, measures, headerTools }) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const insightTypes = uniq(patterns?.map((pattern) => pattern.type) ?? []);
  const measureNames = uniq(measures?.map((measure) => measure.fieldName)).join(',');
  const analysisName = insightTypes.map((algorithm) => ALGORITHM_NAME_MAP[algorithm]).join(',') ?? '';
  const defaultTitle = (
    <div>
      <span className={`${prefixCls}-measure-name`}>{measureNames}</span>
      <span className={cx(`${prefixCls}-analysis-tag`)}>{analysisName}</span>
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
