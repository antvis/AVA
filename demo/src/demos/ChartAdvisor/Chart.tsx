import React, { useEffect } from 'react';
import { specToG2Plot } from '@antv/antv-spec';

export const Chart = ({ id, spec }: any) => {
  useEffect(() => {
    specToG2Plot(spec, document.getElementById(id));
  });

  return <div id={id} style={{ width: '100%', height: 200, margin: 'auto' }}></div>;
};
