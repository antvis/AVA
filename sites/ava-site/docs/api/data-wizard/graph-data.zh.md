---
title: GraphData
order: 3
---

`markdown:docs/common/style.md`

<div class="doc-md">

DW 中的图数据结构，支持读取点边数据、边数组、树型结构数据，将其转换为标准化 `GraphData` 数据。使用 `GraphData`，你可以解析非标准化的数组、图数据和层次型数据，并提取图中的常用的结构和统计特征，还可以得到标准化为 `DataFrame` 的点表和边表，使用 `DataFrame` 提供的 API 来分析点、边各个字段的统计特征。

## new GraphData

***<font size=4>参数</font>***

**data** 源数据 _必选_

Objects or arrays that can be converted to nodes-links data.

类型
* 图结构数据
  * 点边结构数据，`{ [key: string]: any[] }`, 例如 `{ nodes: [], links: [] }`，当节点数组和边数组对应的属性名称不是 `nodes`, `links` 或 `edges` 时，需要通过 `extra` 参数指定属性名称。
  * 边数组， `{ [key: string]: any }[]`
* 树型结构数据（层次数据）` { id: string; children: Tree[]; }`

**extra** 额外参数 _可选_

用于配置节点、边、源、目标、孩子节点的键值和索引。
  
| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| nodeKey | `string` | 指定节点数组在输入的图数据中对应属性名称（键名）。 | `nodes` |
| edgeKey | `string` | 指定边数组在输入的图数据中对应属性名称。 | `edges | links` |
| sourceKey | `string` | 指定边的源节点在边中对应属性名称。 | `source` |
| targetKey | `string` | 指定边的目标节点在边中对应属性名称。 | `target` |
| childrenKey | `string` | 指定孩子节点属性在输入的层次数据中对应属性名称。 | `children` |
| nodeIndexes | `string | number` | 节点数据的行索引 | - | - |
| nodeColumns | `string | number` | 节点数据的列索引 | - | - |
| linkIndexes | `string | number` | 边数据的行索引 | - | - |
| linkColumns | `string | number` | 边数据的列索引 | - | - |

***<font size=4>返回值</font>***

`GraphData`

***<font size=4>用法</font>***
```ts
import { GraphData } from '@antv/data-wizard';

/* Basic usage */
const data = [
  {source: 'person1', target: 'person2'},
  {source: 'person1', target: 'person3'}
]

new GraphData(data);
/*
GraphData
  data: {
    "nodes": [
      { "id": "person1" },
      { "id": "person2" },
      { "id": "person3"}
    ],
    "links": [
       { "source": "person1", "target": "person2" },
      { "source": "person1", "target": "person3" }
    ]
  }
*/

/* Set extra */
const sankeyData = [
  { "id": "A", "to": [ { "id": "C", "size": 20 } ]},
  { "id": "B", "to": [ { "id": "C", "size": 40 } ]},
  { "id": "C" }
]
new GraphData(sankeyData, { childrenKey: 'to' });
/*
GraphData
  {
    "nodes": [
    { "id": "A" },
    { "id": "C", "size": 20 },
    { "id": "B" }
    ],
    "links": [
      { "source": "A", "target": "C" },
      { "source": "B", "target": "C" }
    ]
  }
*/
```

## data
获取转换后的标准图数据。标准化后的图数据类型定义如下：

```ts
type Graph = { 
  nodes: NodeData[];
  links: LinkData[];
}
type NodeData = {
  id: string;
  name?: string;
  [key: string]: any;
};
type LinkData = {
  source: string;
  target: string;
  [key: string]: any;
};
```

## getNodeFrame
获取节点数组的 DataFrame，便于调用 DataFrame 相关方法对点表进行操作和分析。

***<font size=4>返回值</font>***

`DataFrame`

## getEdgeFrame
获取边数组的 DataFrame，便于调用 DataFrame 相关方法对边表进行操作和分析。

***<font size=4>返回值</font>***

`DataFrame`

## info
获取常用的图中的统计学信息。

***<font size=4>返回值</font>***

`GraphProps`
GraphProps 中的详细信息如下：

| 属性 | 类型 | 描述 | 
| ----| ---- | ---- | 
| nodeFeats | `{ [key: string]: any }[]` | 节点的结构特征，包括 `degree`, `inDegree`, `outDegree`, `pageRank` |
| linkFeats | `{ [key: string]: any }[]` | 边的结构特征。 |
| graphInfo | `GraphFeat` | 全图的结构特征，包括 `nodeCount`、`linkCount`、`direction`、`isDirected`、`isCycle`、`isConnected`、`isDAG`、`maxDegree`、`avgDegree`、`cycleCount`、`directedCycleCount` 、`componentCount`、`strongConnectedComponents`。 |
| nodeFieldsInfo | `FieldInfo[]` | 节点属性的统计学信息，由 `DataFrame` 计算得到。 |
| linkFieldsInfo | `FieldInfo[]` | 边属性的统计学信息，由 `DataFrame` 计算得到。  |

***<font size=4>用法</font>***
```ts
import { GraphData } from '@antv/data-wizard';

const graph = new GraphData([
  {source: 'person1', target: 'person2'},
  {source: 'person2', target: 'person3'},
  {source: 'person3', target: 'person1'}
]);

graph.info();
/*
  {
    "graphInfo": {
        "isDirected": false,
        "nodeCount": 3,
        "linkCount": 3,
        "isConnected": true,
        "isDAG": false,
        "maxDegree": 2,
        "avgDegree": 2,
        "degreeStd": 0,
        "cycleParticipate": 1,
        "cycleCount": 1,
        "directedCycleCount": 1,
        "componentCount": 1,
        "strongConnectedComponentCount": 1
    },
    "nodeFieldsInfo": [
      {
        "count": 3,
        "distinct": 3,
        "type": "string",
        "recommendation": "string",
        "missing": 0,
        "valueMap": {
          "person1": 1,
          "person2": 1,
          "person3": 1
        },
        "maxLength": 7,
        "minLength": 7,
        "meanLength": 7,
        "containsChar": true,
        "containsDigit": true,
        "containsSpace": false,
        "levelOfMeasurements": [ "Ordinal" ],
        "name": "id"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": {
          "2": 3
        },
        "minimum": 2,
        "maximum": 2,
        "mean": 2,
        "percentile5": 2,
        "percentile25": 2,
        "percentile50": 2,
        "percentile75": 2,
        "percentile95": 2,
        "sum": 6,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete" ],
        "name": "degree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": { "1": 3 },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete" ],
        "name": "inDegree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": { "1": 3 },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete" ],
        "name": "outDegree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "float",
        "recommendation": "float",
        "missing": 0,
        "valueMap": { "0.3333333333333333": 3 },
        "minimum": 0.3333333333333333,
        "maximum": 0.3333333333333333,
        "mean": 0.3333333333333333,
        "percentile5": 0.3333333333333333,
        "percentile25": 0.3333333333333333,
        "percentile50": 0.3333333333333333,
        "percentile75": 0.3333333333333333,
        "percentile95": 0.3333333333333333,
        "sum": 1,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Continuous" ],
        "name": "pageRank"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": { "1": 3 },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete" ],
        "name": "cycleCount"
      },
      {
        "count": 3,
        "distinct": 3,
        "type": "string",
        "recommendation": "string",
        "missing": 0,
        "valueMap": {
            "person1": 1,
            "person2": 1,
            "person3": 1
        },
        "maxLength": 7,
        "minLength": 7,
        "meanLength": 7,
        "containsChar": true,
        "containsDigit": true,
        "containsSpace": false,
        "levelOfMeasurements": [ "Ordinal" ],
        "name": "id"
      }
    ],
    "linkFieldsInfo": [
      {
        "count": 3,
        "distinct": 3,
        "type": "string",
        "recommendation": "string",
        "missing": 0,
        "valueMap": {
            "person1": 1,
            "person2": 1,
            "person3": 1
        },
        "maxLength": 7,
        "minLength": 7,
        "meanLength": 7,
        "containsChar": true,
        "containsDigit": true,
        "containsSpace": false,
        "levelOfMeasurements": [ "Ordinal" ],
        "name": "source"
      },
      {
        "count": 3,
        "distinct": 3,
        "type": "string",
        "recommendation": "string",
        "missing": 0,
        "valueMap": {
            "person2": 1,
            "person3": 1,
            "person1": 1
        },
        "maxLength": 7,
        "minLength": 7,
        "meanLength": 7,
        "containsChar": true,
        "containsDigit": true,
        "containsSpace": false,
        "levelOfMeasurements": [ "Ordinal" ],
        "name": "target"
      }
    ],
    "nodeFeats": [
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": {
            "2": 3
        },
        "minimum": 2,
        "maximum": 2,
        "mean": 2,
        "percentile5": 2,
        "percentile25": 2,
        "percentile50": 2,
        "percentile75": 2,
        "percentile95": 2,
        "sum": 6,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [
            "Interval",
            "Discrete"
        ],
        "name": "degree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": {
            "1": 3
        },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [
            "Interval",
            "Discrete"
        ],
        "name": "inDegree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": { "1": 3 },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete"],
        "name": "outDegree"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "float",
        "recommendation": "float",
        "missing": 0,
        "valueMap": { "0.3333333333333333": 3 },
        "minimum": 0.3333333333333333,
        "maximum": 0.3333333333333333,
        "mean": 0.3333333333333333,
        "percentile5": 0.3333333333333333,
        "percentile25": 0.3333333333333333,
        "percentile50": 0.3333333333333333,
        "percentile75": 0.3333333333333333,
        "percentile95": 0.3333333333333333,
        "sum": 1,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Continuous" ],
        "name": "pageRank"
      },
      {
        "count": 3,
        "distinct": 1,
        "type": "integer",
        "recommendation": "integer",
        "missing": 0,
        "valueMap": { "1": 3 },
        "minimum": 1,
        "maximum": 1,
        "mean": 1,
        "percentile5": 1,
        "percentile25": 1,
        "percentile50": 1,
        "percentile75": 1,
        "percentile95": 1,
        "sum": 3,
        "variance": 0,
        "standardDeviation": 0,
        "zeros": 0,
        "levelOfMeasurements": [ "Interval", "Discrete" ],
        "name": "cycleCount"
      }
    ],
    "linkFeats": [],
}
*/
```
</div>
