import React from 'react';
import { Rule } from '../../packages/chart-linter/src';
import { prettyJSON } from '../utils';
import { Spin } from 'antd';

interface Props {
  violatedRules: Rule[][];
}

export const LinterWrapper = (props: Props) => {
  const { violatedRules } = props;

  return (
    <div className="linter-wrapper">
      <Spin spinning={!violatedRules?.length}>
        <textarea
          className="code-textarea"
          value={violatedRules?.length ? prettyJSON(violatedRules) : ''}
          readOnly
          style={{ background: 'bisque' }}
        />
      </Spin>
    </div>
  );
};
