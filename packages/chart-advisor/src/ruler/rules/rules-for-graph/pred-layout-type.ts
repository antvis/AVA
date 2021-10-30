import { RuleModule } from '../../concepts/rule';
import { MAX_NUM_NODES_A_LEVEL } from './const';

const applyChartTypes = ['graph'];
const MAX_SCORE = 5;
// Option 1. Score evaluation criteria: 0 - not recommended; 5 - highly recommended
/**
 * Conditions suitable for using the Dagre layout
 * 1. Directed acyclic diagram / number of cycles should be small 有向无环或少环图
 * 2. The breath of each level should be less than MAX_BREADH 宽度不宜过宽 / 每层节点不宜过多
 * 3. The number of nodes should be less than a certain number 节点个数不宜过多（暂时没有限制）
 */
export const shouldUseDagre: RuleModule = {
  id: 'use-dagre-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (graphProps): number => {
    let score = 0;
    const { isDAG, cycleParticipate, maxDegree, avgDegree } = graphProps?.graphInfo;
    if (isDAG) {
      score = 1;
    }
    if (maxDegree <= MAX_NUM_NODES_A_LEVEL / 2) {
      score += 1;
    }
    if (avgDegree < MAX_NUM_NODES_A_LEVEL / 3) {
      score += 1;
    }
    if (cycleParticipate > 0.5) {
      score = 0;
    } else if (cycleParticipate < 0.3) {
      score += 2;
    }
    return score / MAX_SCORE;
  },
};

/**
 * Conditions suitable for using the Radial layout
 * 1. has one or several focus nodes
 * 2. number of cycles is small
 * 3. The breath of each level could be more than which of Dagre layout
 */
export const shouldUseRadial: RuleModule = {
  id: 'use-radial-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (graphProps): number => {
    let score = 0;
    const { isDAG, cycleParticipate, maxDegree } = graphProps?.graphInfo;
    if (isDAG) {
      score = 1;
    }
    if (maxDegree > MAX_NUM_NODES_A_LEVEL / 2 && maxDegree < MAX_NUM_NODES_A_LEVEL) {
      score += 1;
    }
    if (cycleParticipate > 0.5) {
      score = 0;
    } else if (cycleParticipate < 0.3) {
      score += 1;
    }
    const hasFocusNode = false;
    if (hasFocusNode) {
      score += 2;
    }
    return score / MAX_SCORE;
  },
};

/**
 * Conditions suitable for using the Circular layout
 * 1. The graph has cycles and a high percentage of cycles (a larger percentage of nodes in cycles). 图中有圆环且圆环占比较高（处于圆环的节点比例较大）
 */
export const shouldUseCircular: RuleModule = {
  id: 'use-circular-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (graphProps): number => {
    let score = 0;
    const { cycleCount, cycleParticipate } = graphProps?.graphInfo;
    if (cycleCount > 0) score = 2;
    if (cycleParticipate >= 0.5 && cycleParticipate <= 0.8) {
      score = 3;
    } else if (cycleParticipate > 0.8 && cycleParticipate < 0.9) {
      score = 4;
    } else if (cycleParticipate >= 0.9) {
      score = 5;
    }
    return score / MAX_SCORE;
  },
};

/**
 * Conditions suitable for using the Force layout
 */
export const shouldUseForce: RuleModule = {
  id: 'use-force-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (graphProps): number => {
    let score = 0;
    const { nodeCount, maxDegree, avgDegree, strongConnectedComponentCount } = graphProps?.graphInfo;
    if (nodeCount > 200) {
      score += 2;
    }
    if (strongConnectedComponentCount >= 1) {
      score += 1;
    }
    if (avgDegree < 3) {
      score += 1;
    }
    if (maxDegree > MAX_NUM_NODES_A_LEVEL) {
      score += 1;
    }
    return score / MAX_SCORE;
  },
};

/**
 * Conditions suitable for using the Concentric layout
 * 1. 有中心程度很高的节点
 */
export const shouldUseConcentric: RuleModule = {
  id: 'use-force-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (graphProps): number => {
    let score = 0;
    const { maxDegree, avgDegree, degreeStd } = graphProps?.graphInfo;
    if (maxDegree - avgDegree > 3 * degreeStd) {
      score += 3;
    }
    return score / MAX_SCORE;
  },
};

/**
 * Conditions suitable for using the Grid layout
 */
export const shouldUseGrid: RuleModule = {
  id: 'use-grid-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: (): number => {
    const score = 0;
    return score;
  },
};

export const allLayoutTypeRules = {
  dagre: shouldUseDagre,
  circular: shouldUseCircular,
  concentric: shouldUseConcentric,
  radial: shouldUseRadial,
  grid: shouldUseGrid,
  force: shouldUseForce,
};
