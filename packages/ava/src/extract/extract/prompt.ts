export const getExtractPrompt = (input: string) => {
  return `
    # 你是一个数据解析专家，你的任务是将用户输入的文本解析为结构化数据，并理解用户的分析意图。
    ## 通过 typescript 类型来定义输出的类型，如下:
    type PlainDataType = Array<Record<string, string | number>> | Array<Array<string | number>>; // 常规的二维明细数据
    type DATA_SHAPE = 'plain' | 'graph' | 'tree' | 'flow'; // 数据形状
    type HierarchyDataType = Array<{
      id: string;
      name?: string;
      children?: HierarchyDataType;
      [key: string]: any;
    }>; // 树形数据

    export type RelationDataType = {
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
    }; // 图数据

    export type FlowDataType = {
      nodes: Array<{
        id: string;
        name?: string;
        [key: string]: any;
      }>;
      edges: Array<{
        source: string;
        target: string;
        value: number;
        [key: string]: any;
      }>;
    }; // 流向数据

    type FieldDataType<T extends DATA_SHAPE> = T extends 'tree'
      ? HierarchyDataType
      : T extends 'flow'
      ? FlowDataType
      : T extends 'graph'
      ? RelationDataType
      : PlainDataType; // 数据类型统一定义

    type DataShards = Array<{
      shape: DATA_SHAPE;
      data: FieldDataType<DATA_SHAPE>;
      metas: Array<{
        name: string; // 字段的名称
        key: string; // 字段在数据中的 key
        dataType: 'number' | 'string' | 'date' | 'geo'; // 字段的类型
      }>; // 字段元信息
      purpose?: {
        name: string; // 字段的名称
        key: string; // 字段在数据中的 key
        purpose: 'Comparison' | 'Trend' | 'Anomaly' | 'Composition' | 'Proportion' | 'Relationship' | 'Distribution' | 'Rank'; // 分析意图
        purposeDesc?: string; // 分析意图的简要说明
      };
    }>;
    ## 需要你根据用户的输入文本，解析出其中的数据，并根据用户的意图，将其转化为上述 ts 类型中的 DataShards，并用标准 JSON 输出
    ## 建议的执行步骤是
    ### 一、分离数据和文本
    ### 二、解析数据，判断数据形状，并将其转化为 PlainDataType、TreeDataType、GraphDataType、FlowDataType 中的一种
    ### 三、理解用户意图，分析字段的名词和key，并将其转化为 DataShards 中的 purpose 信息
    ### 四、如果用户没有意图，请根据你对这份数据的理解，拆解出一到两个分析意图，并构建 purpose 信息
    ### 五、将数据和文本转化为 DataShards 数组结构，注意 DataShards 需要是一个数组，并用纯文本的 JSON 字符串输出
    ## 用户输入的文本如下：
    ${input}
  `.trim();
};
