import { G2Spec, Mark } from '@antv/g2';

export const viewSpecStrategy = (
  marks: Mark[],
  viewConfig?: {
    scale?: Mark['scale'];
  }
): G2Spec => {
  return {
    type: 'view',
    theme: 'classic',
    axis: {
      x: { labelAutoHide: true, labelAutoRotate: false, title: false },
      y: { title: false },
    },
    interaction: {
      tooltip: { groupName: false },
    },
    legend: false,
    children: marks,
    ...viewConfig,
  };
};
