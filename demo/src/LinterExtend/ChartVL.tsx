import React from 'react';
import { VegaLite } from 'react-vega';

export const ChartVL = (props: { spec: any; data?: any }) => {
  const { spec, data } = props;
  return (
    <div>
      <VegaLite spec={spec} data={data} />
    </div>
  );
};
