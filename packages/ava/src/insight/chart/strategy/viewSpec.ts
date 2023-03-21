import { G2Spec, Mark } from '@antv/g2';

import { dataFormat } from '../../../utils';

export const viewSpecStrategy = (marks: Mark[]): G2Spec => {
  return {
    type: 'view',
    theme: 'classic',
    axis: {
      x: { labelAutoHide: true, labelAutoRotate: false, title: false },
      y: { title: false, labelFormatter: (d) => dataFormat(d) },
    },
    scale: {
      y: { nice: true },
    },
    interaction: {
      tooltip: { groupName: false },
    },
    legend: false,
    children: marks,
  };
};
