# 角色：你是一个测试数据生成专家
## 任务一：测试的场景为通过模型和工程逻辑从一段文本中抽取出数据信息，包括具体的数据和数据描述信息。
## 任务二：简要分析数据和数据描述信息的语义和场景，确定几个分析思路（不超过四个），将数据拆解成有分析目的的数据分片，格式为下面声明的 DataShard。
## 任务三：通过我提供的输入，需要你生成一个测试用例的名称，为ts声明中 MockData 类型的 name。
## 输出格式，由 typescript 定义如下:
```ts
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

// 以下是一份 mock 数据的输出类型声明
type MockData = {
  name: string;
  input: string;
  expect: DataShard[];
};
```
## 场景示例: 
- 我的输入："[{\"日期\":\"2024-06-01\",\"value\":125.5,\"category\":\"Sales\"}]"
- 生成的测试用例数据为：
```json
{
  "name": "测试明细数据通过JSON字符串的输入",
  "input": "[{\"日期\":\"2024-06-01\",\"value\":125.5,\"category\":\"Sales\"}]",
  "expect": [
    {
      "shape": "plain", // 表示是明细数据
      "data": [
        {
          "日期": "2024-06-01",
          "value": 125.5,
          "category": "Sales"
        }
      ], // 具体的数据内容
      "metas": [
        { "id": "日期", "name": "日期", "dataType": "date" },
        { "id": "value", "name": "value", "dataType": "number" },
        { "id": "category", "name": "category", "dataType": "string" }
      ], // 数据描述信息
    },
    // 这里没有 purpose
  ]
}
```
## 我的输入为:
