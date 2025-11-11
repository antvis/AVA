export const getExtractPrompt = (input: string) => {
  return `
    # 你是一个数据解析专家，你的任务是将用户输入的文本解析为结构化数据，并理解用户的分析意图。
    ## 通过 typescript 类型来定义输出的类型，如下:
    type DATA_SHAPE = 'plain' | 'hierarchy' | 'relation' | 'geo';
    type PlainLikeDataType = Array<Record<string, string | number>> | Array<Array<string | number>>;
    type HierarchyDataType = Array<{
      id: string;
      name?: string;
      children?: HierarchyDataType;
      [key: string]: any;
    }>;
    type RelationDataType = {
      nodes: Array<{
        id: string;
        name?: string;
        [key: string]: any;
      }>;
      edges: Array<{
        source: string;
        target: string;
        [key: string]: any;
      }>;
    };
    type GeoDataType = {
      type: 'country' | 'city' | 'province' | 'lon&lat';
      data: PlainLikeDataType;
    };
    type FieldDataType<T extends DATA_SHAPE> = T extends 'hierarchy'
      ? HierarchyDataType
      : T extends 'relation'
      ? RelationDataType
      : PlainLikeDataType;

    type DataShard = {
      shape: DATA_SHAPE;
      data: FieldDataType<DATA_SHAPE>; // 具体的数据信息
      metas: Array<{
        id: string;
        name: string;
        dataType: 'number' | 'string' | 'date' | 'geo'; // 分别表示数值、字符串、日期和地理类型
      }>; // 数据描述信息，包括各字段的名称类型
      purpose?: {
        name: string;
        key: string;
        purpose: 'Comparison' | 'Trend' | 'Anomaly' | 'Composition' | 'Proportion' | 'Relationship' | 'Distribution' | 'Rank';
        purposeDesc?: string;
      };
    };
    type DataShards = DataShard[];
    ## 需要你根据用户的输入文本，解析出其中的数据，并根据用户的意图，将其转化为上述 ts 类型中的 DataShards，并用标准 JSON 字符串输出，不要使用\`\`\`JSON等任何代码块包裹
    ## 建议的执行步骤是
    ### 一、分离数据和文本
    ### 二、解析数据，判断数据形状，并将其转化为 PlainLikeDataType、TreeDataType、GraphDataType、FlowDataType 中的一种
    ### 三、理解用户意图，分析字段的名词和key，并将其转化为 DataShards 中的 purpose 信息
    ### 四、如果用户没有意图，请根据你对这份数据的理解，拆解出一到两个分析意图，并构建 purpose 信息
    ### 五、将数据和文本转化为 DataShards 数组结构，注意 DataShards 需要是一个数组，并用纯文本的 JSON 字符串输出
    ## 用户输入的文本如下：
    ${input}
  `.trim();
};
