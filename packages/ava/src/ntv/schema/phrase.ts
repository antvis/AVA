import { CustomMetaData, CommonProps } from './common';

// P used for custom phrase;
export type PhraseSpec = TextPhraseSpec | EntityPhraseSpec | CustomPhraseSpec<CustomMetaData>;

export type TextPhraseSpec = CommonProps & {
  type: 'text';
  value: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
};

export type EntityPhraseSpec = CommonProps & {
  type: 'entity';
  value?: string;
  metadata?: EntityMetaData;
};

export type CustomPhraseSpec<P extends CustomMetaData = CustomMetaData> = CommonProps & {
  type: 'custom';
  value?: string;
  metadata?: P;
};

export type ValueAssessment = 'positive' | 'negative' | 'equal';

export const ENTITY_TYPES = [
  /**
   * @description main indicator value 主指标名
   * @example DAU
   * */
  'metric_name',
  /**
   * @description main indicator name 主指标值
   * @example 1.23 million
   * */
  'metric_value',
  /**
   * @description other indicator value 其他指标值
   * @example
   * */
  'other_metric_value',
  /**
   * @description contribution ratio 贡献度
   * @example 23%
   * */
  'contribute_ratio',
  /**
   * @description delate value 变化值
   * @example -1.2
   * */
  'delta_value',
  /**
   * @description ratio value 变化率
   * @example +23%
   * */
  'ratio_value',
  /**
   * @description trend description 趋势描述
   * @example up/down
   * */
  'trend_desc',
  /**
   * @description dimension value 维值
   * @example sex = man
   * */
  'dim_value',
  /**
   * @description time description 时间描述
   * @example 2021-11-19
   * */
  'time_desc',
  /**
   * @description proportion 占比
   * @example 20%
   * */
  'proportion',
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

export type EntityMetaData = {
  /**
   * entity type, 实体类型标记
   * */
  entityType: EntityType;
  /**
   * assessment up or down, used for derived value
   * 衍生指标评估参数，指定上涨或者下跌
   * */
  assessment?: ValueAssessment;
  /**
   * original data, 原始数据
   * */
  origin?: number;
  /**
   * detail data, 明细数据，用于弹框展示
   */
  detail?: unknown;
  /** source id of the variable, to access the variable info from variableSourceMap */
  // TODO 重新设计完善之后透出
  // sourceId?: string;
};
