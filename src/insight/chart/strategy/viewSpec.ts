import type { G2Spec, Mark } from '@antv/g2';
import type { InsightInfo, PatternInfo } from '../../types';

export const viewSpecStrategy = (marks: Mark[], insight?: InsightInfo<PatternInfo>): G2Spec => {
  // majority insight pattern visualizes as 'pie', should not use y nice (G2 handle it as rescale y, the pie chart will be less than 100%)
  const isMajorityPattern = insight.patterns.map((pattern) => pattern.type).includes('majority');
  const viewConfig = isMajorityPattern
    ? { scale: { y: { nice: false } } }
    : {
        scale: { y: { nice: true } },
      };

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
