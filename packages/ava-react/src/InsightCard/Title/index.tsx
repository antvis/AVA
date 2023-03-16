import React from 'react';

import cx from 'classnames';
import { isFunction } from 'lodash';

import { Toolbar } from '../Toolbar';
import { ALGORITHM_NAME_MAP, INSIGHT_CARD_PREFIX_CLS } from '../constants';

import type { InsightCardProps } from '../types';

import './index.less';

export type TitleProps = Pick<InsightCardProps, 'algorithms' | 'measures' | 'headerTools' | 'title'>;
export const Title: React.FC<TitleProps> = ({ title, algorithms, measures, headerTools }) => {
  const prefixCls = INSIGHT_CARD_PREFIX_CLS;
  const measureNames = measures?.map((measure) => measure.field).join(',');
  const analysisName = algorithms.map((algorithm) => ALGORITHM_NAME_MAP[algorithm]).join(',') ?? '';
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
