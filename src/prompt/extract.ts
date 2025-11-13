export const EXTRACT_PROMPT_CH = `
# 角色：你是一个文本解析专家以及数据解析专家。
# 任务：我会输入一段文本，你需要将文本中的数据信息提取出来，并组装成结构化的数据。
## 输出类型定义，我会用 typescript 来定义需要输出的数据结构，如下：
\`\`\`typescript
  // 数据形状：明细数据、层级数据、关系型数据、地理型数据
  type DATA_SHAPE = 'plain' | 'hierarchy' | 'relation' | 'geo';
  type PlainLikeDataType = Array<Record<string, string | number>>;

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
    geoKeys: Array<{
      type: 'country' | 'city' | 'province' | 'lon&lat';
      key: string;
      name: string;
    }>;
    data: Array<Record<string, string | number>>;
  };

  type FieldDataType<T extends DATA_SHAPE> = T extends 'hierarchy'
    ? HierarchyDataType : T extends 'relation'
    ? RelationDataType : T extends 'geo'
    ? GeoDataType : PlainLikeDataType;

  type DataShard = {
    shape: DATA_SHAPE;
    data: FieldDataType<DATA_SHAPE>; // 具体的数据信息
    metas: Array<{
      id: string;
      name: string;
      dataType: 'number' | 'string' | 'date' | 'geo'; // 分别表示数值、字符串、日期和地理类型
      unit?: string; // 语意单位，表示数据的量纲，比如"人"、"元"等, dataType 为 number 时可选
    }>; // 数据描述信息，包括各字段的名称类型
    purpose?: {
      name: string;
      key: string;
      purpose: 'Comparison' | 'Trend' | 'Anomaly' | 'Composition' | 'Proportion' | 'Relationship' | 'Distribution' | 'Rank' | 'Geo';
      purposeDesc?: string;
    };
  };

  // 这是需要最后输出的类型
  type DataShards = DataShard[];
\`\`\`

## 输出要求：
- 数据解析时，如果是数字，需要关注数据单位，最终的抽取数据需要将单位计算在内，数字的单位默认是**个**，比如"1.23万"，解析为数据应该为 12300;
- 如果数据中包含了单位，比如"100人"，则需要将单位"人"包含在元数据中;
- 需要准确判断数据的形状，并将其转化为上文类型声明中的对应类型，包括 'plain' | 'hierarchy' | 'relation' ｜ 'geo' 这四种，一定要判断准确;
- 判断完数据性状后，生成 data 对象，data 需要按照上面 typescript 定义的类型，将输入对象的 data 字段进行格式转化;
- 生成 metas 对象，metas 为数据中每个字段的描述信息，包括 id，语义名称，数据类型;
- 生成 purpose 对象，purpose 包含了在哪个字段上进行怎样的意图类型分析的信息;
- 将面生成的信息组合形成 dataShards，并 stringify 后返回;
- **请直接输出 JSON 字符串，不要用 \`\`\`json 等标记包裹**;
## 用户输入的文本如下：
`;

export const EXTRACT_PROMPT_EN = `
# Role: You are a text parsing expert and data analysis specialist.
# Task: I will provide a piece of text, and you are required to extract the data information from it and organize it into structured format.
## Output Type Definition: I will use TypeScript to define the expected output data structure as follows:
\`\`\`typescript
// Data shape: plain data, hierarchical data, relational data, geographic data
type DATA_SHAPE = 'plain' | 'hierarchy' | 'relation' | 'geo';
type PlainLikeDataType = Array<Record<string, string | number>>;

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
  geoKeys: Array<{
    type: 'country' | 'city' | 'province' | 'lon&lat';
    key: string;
    name: string;
  }>;
  data: Array<Record<string, string | number>>;
};

type FieldDataType<T extends DATA_SHAPE> = T extends 'hierarchy'
  ? HierarchyDataType : T extends 'relation'
  ? RelationDataType : T extends 'geo'
  ? GeoDataType : PlainLikeDataType;

type DataShard = {
  shape: DATA_SHAPE;
  data: FieldDataType<DATA_SHAPE>; // The actual data content
  metas: Array<{
    id: string;
    name: string;
    dataType: 'number' | 'string' | 'date' | 'geo'; // Indicates number, string, date, or geographic type
    unit?: string; // Semantic unit, e.g., "person", "yuan", etc., optional for number data type
  }>; // Metadata describing each field, including field ID, semantic name, and data type
  purpose?: {
    name: string;
    key: string;
    purpose: 'Comparison' | 'Trend' | 'Anomaly' | 'Composition' | 'Proportion' | 'Relationship' | 'Distribution' | 'Rank' | 'Geo';
    purposeDesc?: string;
  };
};

// This is the final output type
type DataShards = DataShard[];
\`\`\`

## Output Requirements:
- During data parsing, pay attention to numeric units. The extracted numeric values must account for their units. The default unit is **"individual" (个)**. For example, "1.23万" should be parsed as the number 12300.
- If a numeric field has a specified unit, include it in the \`unit\` field of the metadata. For example, if the unit is "人", the metadata should include \`unit: "人"\`.
- Accurately determine the data shape and convert it into the corresponding type defined above: one of 'plain', 'hierarchy', 'relation', or 'geo'. The classification must be precise.
- After determining the data shape, generate the \`data\` object according to the TypeScript type definition provided, transforming the input data accordingly.
- Generate the \`metas\` object, which contains metadata for each field in the data, including \`id\`, semantic \`name\`, and \`dataType\`.
- Generate the \`purpose\` object, which specifies on which field what kind of analytical intent applies (e.g., comparison, trend, etc.).
- Assemble all the generated information into a \`DataShards\` structure, then return it as a JSON string.
- **Output only the JSON string directly — do not wrap it with \`\`\`json or any other formatting markers**.

## Input Text:
`;

export const getExtractPrompt = (input: string, language: 'ch' | 'en' = 'ch') => {
  return `${language === 'ch' ? EXTRACT_PROMPT_CH : EXTRACT_PROMPT_EN}\n${input}`;
};
