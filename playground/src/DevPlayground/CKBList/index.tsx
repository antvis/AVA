import React from 'react';

import ReactJson from 'react-json-view';

import { ckb } from '../../../../packages/ava/lib';

import type { ReactJsonViewProps } from 'react-json-view';

export interface JSONViewProps {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  rjvConfigs?: Omit<ReactJsonViewProps, 'src'>;
  json: any;
}

export const CKBJSONView: React.FC<JSONViewProps> = ({ json }) => {
  return (
    <div
      style={{
        padding: '20px',
        overflowY: 'scroll',
        border: '1px solid #eee',
      }}
    >
      {/* react types 导致抛出错误 JSX element type 'ReactElement<any> | null' is not a constructor function for JSX elements */}
      {/* @ts-ignore */}
      <ReactJson src={json} iconStyle="circle" name={false} displayObjectSize={false} displayDataTypes={false} />
    </div>
  );
};

const content = (
  <>
    <h1>图表字典（JSON版）</h1>
    <CKBJSONView json={ckb()} />
  </>
);

export default content;
