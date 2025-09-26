import { DATA_SHAPE } from '@ava/data/constants';

/**
 * 推断数据的基础结构
 * @returns
 */
export const inferDataType = (): DATA_SHAPE => {
  return DATA_SHAPE.PLAIN;
};
