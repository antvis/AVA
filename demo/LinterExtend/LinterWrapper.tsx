import React from 'react';
import { Rule } from '../../packages/chart-linter/src';
import { prettyJSON } from '../utils';
import { Spin } from 'antd';
import styles from './index.module.less';

interface Props {
  violatedRules: Rule[][];
}

export const LinterWrapper = (props: Props) => {
  const { violatedRules } = props;

  return (
    <div className={styles.linterWrapper}>
      <Spin spinning={!violatedRules?.length}>
        <textarea
          className={styles.codeTextarea}
          value={violatedRules?.length ? prettyJSON(violatedRules) : ''}
          readOnly
          style={{ background: 'bisque' }}
        />
      </Spin>
    </div>
  );
};
