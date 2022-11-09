import type { EntityType } from './phrase';

export type Datum = Record<string, string | number>;

export type DataMeta = {
  /** id of datum, default same as name */
  id?: string;
  /** name of datum */
  name?: string;
  /**
   * datum domain type
   */
  entityType?: EntityType | undefined;
  /** description datum */
  desc?: string;
  /**
   * format 格式化
   * TODO 暂时没有消费该信息，之后可以内部支持从原数据到展示数据直接的转化
   */
  // format?: string;
  /**
   * TODO describe the relations of the variables
   * 计算公式
   * @example 独立变量，取数逻辑，需要与后端共同约定，通常是业务侧自己定义消费 max{性别}.单价
   * @example 依赖变量 (id1 - id2)*20
   * @example 条件判断 (id1 - id2) > 0? "增长": "减少"
   */
  // formula?: string;
  [key: string]: unknown;
};

export type DataMetaMap = Record<
  string, // EntityMetaData['sourceId'] and
  DataMeta
>;
