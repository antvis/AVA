import { matchGraph } from './graph';

import type { MatchFunction } from './types';

export const matchFlow: MatchFunction = (input) => {
  const matchRes = matchGraph(input);
  const { is } = matchRes;
  // 根据图的特性判断是否是流程数据
  return {
    is,
    format: {
      data: {
        nodes: [],
        edges: [],
      },
    },
  };
};
