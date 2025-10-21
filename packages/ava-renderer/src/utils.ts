import type { Meta } from '@antv/ava';

export const transMetasToMap = (metas: Meta[]): Record<string, Meta> => {
  return metas.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});
};
