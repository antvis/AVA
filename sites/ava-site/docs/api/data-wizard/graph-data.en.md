---
title: GraphData
order: 3
---

`markdown:docs/common/style.md`

<div class="doc-md">

For relational data (network data), DW processes and analyzes it through the `GraphData` module, which supports reading nodes-links data, links arrays, and hierarchical data. Using `GraphData`, you can parse arrays, graph data and hierarchical data, and extract common-used structural and statistical features. Also, the nodes and edges can be converted to `DataFrame`, and its API to analyze the statistics of each node field and link field.

## new GraphData
### Parameters

***<font size=4>Parameters</font>***

**data** Raw data _required_

Accept one-dimensional and two-dimensional data.

Type

* Graph data
  * nodes-links object, `{ [key: string]: any[] }`, e.g. `{ nodes: [], links: [] }`, if the property names corresponding to the nodes and links are not `nodes`, `links` or `edges`, the property names need to be specified with the `extra` parameter.
  * an array of links, `{ [key: string]: any }[]`
* Hierachical data: ` { id: string; children: Tree[]; }`

**extra** extra parameters _optional_

Used to configure the keys and indexes of nodes, edges, sources, targets, and children.

| Properties | Type | Description |
| ----| ---- | ---- |
| nodeKey | `string` | Specifies the property name of nodes in the given graph data. | `nodes` |
| edgeKey | `string` | Specifies the property name of edges in the given graph data. | `edges | links` |
| sourceKey | `string` | Specifies the property name of source node in edges. | `source` |
| targetKey | `string` | Specifies the property name of target node in edges. | `target` |
| childrenKey | `string` | Specifies the property name of children in the given hirerachy data. | `children | to` |
| nodeIndexes | `string | number` | Indexes of nodes |
| nodeColumns | `string | number` | Columns of nodes |
| linkIndexes | `string | number` | Indexes of edges |
| linkColumns | `string | number` | Columns of edges |

***<font size=4>Return value</font>***

`GraphData`

***<font size=4>Usage</font>***
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
Get the standardized graph data. The standardized graph data type is defined as below:

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
Get the DataFrame of the node array, so that you can use DataFrame to manipulate and analyze the node table.

***<font size=4>Return value</font>***
`DataFrame`

## getEdgeFrame
Get the DataFrame of the link array, so that you can use DataFrame to manipulate and analyze the link table.

***<font size=4>Return value</font>***
`DataFrame`

## info
Obtain structural and statistical features of the network data.

***<font size=4>Return value</font>***

`GraphProps`

The details in GraphProps are as below.

| Properties | Type | Description |
| ----| ---- | ---- |
| nodeFeats | `{ [key: string]: any }[]` | Structural features of node, including `degree`, `inDegree`, `outDegree`, `pageRank`. |
| linkFeats | `{ [key: string]: any }[]` | Structural features of link.  |
| graphInfo | `GraphFeat` | Structural and statistical features of the graph, including `nodeCount`、`linkCount`、`direction`、`isDirected`、`isCycle`、`isConnected`、`isDAG`、`maxDegree`、`avgDegree`、`cycleCount`、`directedCycleCount` 、`componentCount`、`strongConnectedComponents`。 |
| nodeFieldsInfo | `FieldInfo[]` | Statistics about the node attributes, computed by the `DataFrame`. |
| linkFieldsInfo | `FieldInfo[]` | Statistics about the node attributes, computed by the `DataFrame`. |

***<font size=4>Usage</font>***
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
