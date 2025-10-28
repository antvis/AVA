export interface Output {
  analysis: Array<{
    desc: string; // 分析思路简介
    columns: string[]; // 分析思路涉及的字段
  }>; // 分析思路
}
export const getShardPrompt = (input: any) => `
  # 你是一个数据分析专家以及代码工程专家。
  ## 任务：我给你一份数据和关于数据的描述信息，你需要帮我规划这份数据的分析思路，并按照我限定的格式给出结果
  ### 输入格式，用 typescript 来表示如下
  /**
   * Basic info of field
   * @public
   */
  export type ColumnFeature = {
    /** field name */
    name?: string;
    /** field type */
    types: COLUMN_TYPE[]; // float integer bool date null string mixed
    /** recommendation type */
    recommendation: COLUMN_TYPE;
    /** number of empty includes null undefined or empty string */
    missing?: number;
    /** distinct count */
    distinct?: number;
    /** Number of each distinct item */
    valueMap?: Record<string, number>;
    /** count of rawData */
    count?: number;
    /** level of measurements */
    levelOfMeasurements?: LevelOfMeasurement[];
  };

  /**
   * String Field
   * @public
   */
  export type StringColumnFeature = ColumnFeature & {
    /** max length */
    maxLength: number;
    /** min length */
    minLength: number;
    /** mean of length */
    meanLength: number;
    /** is contain charts */
    containsChar: boolean;
    /**  is contain digits */
    containsDigit: boolean;
    /** is contain white space */
    containsSpace: boolean;
  };

  /**
   * Number Field
   * @public
   */
  export type NumberColumnFeature = ColumnFeature & {
    /** the counts of zero value */
    zeros: number;
    /** minimum */
    minimum: number;
    /** 5% percentile */
    percentile5: number;
    /** 25% percentile */
    percentile25: number;
    /** 50% percentile */
    percentile50: number;
    /** 75% percentile */
    percentile75: number;
    /** 95% percentile */
    percentile95: number;
    /** maximum */
    maximum: number;
    /** standardDeviation */
    standardDeviation: number;
    /** mean */
    mean: number;
    /** sum */
    sum: number;
    /** variance */
    variance: number;
  };

  /**
   * Date Field
   * @public
   */
  export interface DateColumnFeature extends ColumnFeature {
    /** minimum date */
    minimum: string | number | Date;
    /** maximum date */
    maximum: string | number | Date;
    /** interval of date or time */
    interval?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  }

  export interface GeoColumnFeature extends ColumnFeature {
    /** geo type */
    geoType: 'name' | 'code' | 'coordinates';
  }
  interface Input {
    columns: string[]; // 表头
    features: Record<string, StringColumnFeature | NumberColumnFeature | DateColumnFeature | GeoColumnFeature>;
  };
  ### 输出格式，用 typescript 来表示如下
  export interface Output {
    analysis: Array<{
      desc: string; // 分析思路简介
      columns: string[]; // 分析思路涉及的字段
    }>; // 分析思路
  };
  ### 输出要求：需要严格按照 Output ts 类型输出 JSON 字符串；
  ## 我给出的输入如下：
  ${JSON.stringify(input)}
`;
