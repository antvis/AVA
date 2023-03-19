import { G2Spec, Mark } from '@antv/g2';

export const wrapViewSpec = (marks: Mark[]): G2Spec => {
  return {
    axis: {
      x: { labelAutoHide: true, labelAutoRotate: false, title: false },
      y: { title: false },
    },
    scale: {
      y: { zero: true, nice: true },
    },
    interaction: {
      tooltip: { groupName: false },
    },
    legend: false,
    children: marks,
  };
};
