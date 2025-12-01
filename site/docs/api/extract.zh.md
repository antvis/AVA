---
title: 数据抽取(extract)
order: 1
redirect_from:
  - /zh/docs/api
---

## extract

```typescript
import { AVA } from "@antv/ava";

const ava = new AVA({
  llm: {
    authorization: process.env.TBOX_LLM_AUTH || 'your tbox authorization',
    appId: process.env.TBOX_LLM_APP_ID || 'your tbox appId',
  },
});

const data = await ava.extract(`请帮我分析数据: 不同社交媒体平台的用户增长情况，2018 年 Facebook 用户增长 8%，Twitter 用户增长 12%，Instagram 用户增长 22%`);

console.log(data);

// should print:
// [
//   {
//     "shape": "plain",
//     "data": [
//       {
//         "category": "Facebook",
//         "value": 8
//       },
//       {
//         "category": "Twitter",
//         "value": 12
//       },
//       {
//         "category": "Instagram",
//         "value": 22
//       }
//     ],
//     "metas": [
//       {
//         "id": "category",
//         "name": "平台",
//         "dataType": "string"
//       },
//       {
//         "id": "value",
//         "name": "增长率 (%)",
//         "dataType": "number"
//       }
//     ],
//     "purpose": {
//       "name": "增长率 (%)",
//       "key": "value",
//       "purpose": "Comparison",
//       "purposeDesc": "2018 年社交媒体用户增长"
//     }
//   }
// ]
```

---

### 调用参数

| 参数 | 类型   | 描述             |
| ---- | ------ | ---------------- |
| input | string | 需要提取结构化数据的原始文本 |

---

### 返回结果

| 参数   | 类型                              | 描述         |
| ------ | --------------------------------- | ------------ |
| result | [DataShard](#datashard)[]         | 数据抽取结果，每个元素代表一种独立的数据视图 |

---

### 类型定义

#### DataShard
<a id="datashard"></a>

`DataShard` 表示一个结构化的数据片段，包含数据内容、元信息及分析意图。

| 参数    | 类型                                                                 | 描述                                                                                                                                 |
| ------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| shape   | `'plain' \| 'hierarchy' \| 'relation' \| 'geo'`                      | **数据形状类型**：<br>- `plain`：明细表格数据（扁平结构）<br>- `hierarchy`：树形层级数据<br>- `relation`：节点-边关系图数据<br>- `geo`：含地理维度的数据 |
| data    | [FieldDataType](#fielddatatype)&lt;shape&gt;                          | **实际数据内容**，其结构由 `shape` 字段决定（见下文详细说明）                                                                       |
| metas   | [Meta](#meta)[]                                                      | **字段元信息列表**，描述每个字段的语义、类型和单位                                                                                   |
| purpose | [Purpose](#purpose) (可选)                                           | **分析意图**，说明该数据片段适用于何种可视化或分析场景                                                                               |

> 💡 **data 字段结构说明**：
> - 当 `shape = 'plain'` 时，`data` 为对象数组，如 `[{x: 1, y: 2}, ...]`
> - 当 `shape = 'hierarchy'` 时，`data` 为递归树结构
> - 当 `shape = 'relation'` 时，`data` 包含 `nodes` 和 `edges`
> - 当 `shape = 'geo'` 时，`data` 包含地理键定义和记录数组

---

#### Meta
<a id="meta"></a>

描述数据字段的语义元信息。

| 参数     | 类型                                      | 是否必填 | 描述                                                                                                                               |
| -------- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id       | string                                    | 是       | 字段唯一标识符，对应 `data` 中的键名                                                                                               |
| name     | string                                    | 是       | 字段的语义名称（如“销售额”、“城市”）                                                                                               |
| dataType | `'number' \| 'string' \| 'date' \| 'geo'` | 是       | 字段数据类型：<br>- `number`：数值型<br>- `string`：字符串<br>- `date`：日期时间<br>- `geo`：地理编码（如国家、城市、经纬度） |
| unit     | string                                    | **条件必填** | **当 `dataType = 'number'` 时必须提供**，表示语义单位（如“元”、“人次”、“%”）；其他类型可省略                                     |

---

#### Purpose
<a id="purpose"></a>

描述该数据片段的分析目的和适用场景。

| 参数        | 类型                                                                                                                                 | 是否必填 | 描述                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| name        | string                                                                                                                               | 是       | 用途的语义名称（如“季度销售额趋势”）                                                     |
| key         | string                                                                                                                               | 是       | 关键字段 ID，通常是用于可视化的核心度量字段（如 `"sales"`）                              |
| purpose     | `'Comparison' \| 'Trend' \| 'Anomaly' \| 'Composition' \| 'Proportion' \| 'Relationship' \| 'Distribution' \| 'Rank' \| 'Geo'` | 是       | **分析类型**：<br>- `Comparison`：对比<br>- `Trend`：趋势<br>- `Anomaly`：异常检测<br>- `Composition`：构成分析<br>- `Proportion`：占比<br>- `Relationship`：关系<br>- `Distribution`：分布<br>- `Rank`：排序<br>- `Geo`：地理分析 |
| purposeDesc | string                                                                                                                               | 否       | 用途的详细描述（如“分析各产品线在 Q1-Q4 的销售额变化趋势”）                              |

---

### 附录：FieldDataType 结构详解
<a id="fielddatatype"></a>

`FieldDataType<T>` 是一个条件类型，其实际结构取决于 `shape` 的值：

#### 1. `shape = 'plain'`
```ts
Array<Record<string, string | number>>
// 示例: [{ category: "A", value: 100 }, { category: "B", value: 200 }]
```

#### 2. `shape = 'hierarchy'`
```ts
Array<{
  id: string;
  name?: string;
  children?: HierarchyDataType; // 递归子节点
  [key: string]: any; // 其他自定义属性
}>
// 示例: [{ id: "root", name: "公司", children: [...] }]
```

#### 3. `shape = 'relation'`
```ts
{
  nodes: Array<{ id: string; name?: string; [key: string]: any }>;
  edges: Array<{ source: string; target: string; [key: string]: any }>;
}
// 示例: { nodes: [{id: "A"}, {id: "B"}], edges: [{source: "A", target: "B"}] }
```

#### 4. `shape = 'geo'`
```ts
{
  geoKeys: Array<{
    type: 'country' | 'city' | 'province' | 'lon&lat';
    key: string;   // 对应 data 中的字段名
    name: string;  // 地理维度语义名
  }>;
  data: Array<Record<string, string | number>>;
}
// 示例: 
// geoKeys: [{ type: "city", key: "city_name", name: "城市" }]
// data: [{ city_name: "北京", population: 2100 }]
```
