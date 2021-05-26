import React from 'react';
import { Empty } from 'antd';
import { prettyJSON } from '../utils';
import { ChartVL } from './ChartVL';
import { DatasetName, fillValueDataSpec, fillUrlDataFakeSpec } from './constants';

interface Props {
  nodataspec: any;
  datasetName: DatasetName;
}

export const ChartCodeWrapper = (props: Props) => {
  const { nodataspec, datasetName } = props;

  const specVL = fillValueDataSpec(nodataspec, datasetName);

  return (
    <div className="chart-code-wrapper">
      <div className="chart">{specVL.mark ? <ChartVL spec={specVL} /> : <Empty description="empty spec" />}</div>
      <div className="code">
        <textarea
          className="vl-code-textarea code-textarea"
          value={nodataspec.mark ? prettyJSON(fillUrlDataFakeSpec(nodataspec, datasetName)) : ''}
          readOnly
        />
      </div>
    </div>
  );
};
