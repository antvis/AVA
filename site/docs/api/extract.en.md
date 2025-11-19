---
title: Data Extraction
order: 1
redirect_from:
  - /en/docs/api
---

## extract()

```typescript
import { AVA } from "@antv/ava";

const advisor = new AVA({
  llm: {
    authorization: process.env.TBOX_LLM_AUTH || 'your tbox authorization',
    appId: process.env.TBOX_LLM_APP_ID || 'your tbox appId',
  },
});

const data = await advisor.extract(`Please help me analyze the data: User growth across different social media platforms in 2018. Facebook grew by 8%, Twitter by 12%, and Instagram by 22%.`);

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
//         "name": "Platform",
//         "dataType": "string"
//       },
//       {
//         "id": "value",
//         "name": "Growth Rate (%)",
//         "dataType": "number",
//         "unit": "%"
//       }
//     ],
//     "purpose": {
//       "name": "Growth Rate (%)",
//       "key": "value",
//       "purpose": "Comparison",
//       "purposeDesc": "User growth of social media platforms in 2018"
//     }
//   }
// ]
```

---

### Parameters

| Parameter | Type   | Description                                      |
| --------- | ------ | ------------------------------------------------ |
| input     | string | Raw text from which structured data is extracted |

---

### Return Value

| Parameter | Type                              | Description                                                                 |
| --------- | --------------------------------- | --------------------------------------------------------------------------- |
| result    | [DataShard](#datashard)[]         | Extracted data results; each element represents an independent data view     |

---

### Type Definitions

#### DataShard
<a id="datashard"></a>

`DataShard` represents a structured data fragment containing data content, metadata, and analytical intent.

| Property  | Type                                                                 | Description                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shape     | `'plain' \| 'hierarchy' \| 'relation' \| 'geo'`                      | **Data shape type**:<br>- `plain`: Flat tabular data<br>- `hierarchy`: Tree-structured hierarchical data<br>- `relation`: Node-edge relational graph data<br>- `geo`: Geospatial data with geographic dimensions |
| data      | [FieldDataType](#fielddatatype)&lt;shape&gt;                          | **Actual data content**, whose structure is determined by the `shape` field (see detailed explanation below)                                                                                                |
| metas     | [Meta](#meta)[]                                                      | **List of field metadata**, describing semantic meaning, data type, and unit for each field                                                                                                                  |
| purpose   | [Purpose](#purpose) (optional)                                       | **Analytical intent**, indicating the visualization or analysis scenario this data fragment is suited for                                                                                                    |

> 💡 **Data Structure Notes**:
> - When `shape = 'plain'`, `data` is an array of objects, e.g., `[{x: 1, y: 2}, ...]`
> - When `shape = 'hierarchy'`, `data` is a recursive tree structure
> - When `shape = 'relation'`, `data` contains `nodes` and `edges`
> - When `shape = 'geo'`, `data` includes geographic key definitions and record arrays

---

#### Meta
<a id="meta"></a>

Describes semantic metadata for data fields.

| Property  | Type                                      | Required | Description                                                                                                                                 |
| --------- | ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| id        | string                                    | Yes      | Unique field identifier, corresponding to the key name in `data`                                                                             |
| name      | string                                    | Yes      | Semantic field name (e.g., "Sales", "City")                                                                                                 |
| dataType  | `'number' \| 'string' \| 'date' \| 'geo'` | Yes      | Field data type:<br>- `number`: Numeric<br>- `string`: String<br>- `date`: Date/time<br>- `geo`: Geographic encoding (e.g., country, city, coordinates) |
| unit      | string                                    | **Conditionally required** | **Mandatory when `dataType = 'number'`**, representing semantic unit (e.g., "CNY", "persons", "%"); optional for other types                |

---

#### Purpose
<a id="purpose"></a>

Describes the analytical purpose and applicable scenarios for this data fragment.

| Property      | Type                                                                                                                                 | Required | Description                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| name          | string                                                                                                                               | Yes      | Semantic purpose name (e.g., "Quarterly Sales Trend")                                                                                     |
| key           | string                                                                                                                               | Yes      | Key field ID, typically the core metric field used for visualization (e.g., `"sales"`)                                                     |
| purpose       | `'Comparison' \| 'Trend' \| 'Anomaly' \| 'Composition' \| 'Proportion' \| 'Relationship' \| 'Distribution' \| 'Rank' \| 'Geo'` | Yes      | **Analysis type**:<br>- `Comparison`: Comparison<br>- `Trend`: Trend analysis<br>- `Anomaly`: Anomaly detection<br>- `Composition`: Composition analysis<br>- `Proportion`: Proportional analysis<br>- `Relationship`: Relationship analysis<br>- `Distribution`: Distribution analysis<br>- `Rank`: Ranking<br>- `Geo`: Geographic analysis |
| purposeDesc   | string                                                                                                                               | No       | Detailed purpose description (e.g., "Analyze sales trend across product lines from Q1 to Q4")                                              |

---

### Appendix: FieldDataType Structure Details
<a id="fielddatatype"></a>

`FieldDataType<T>` is a conditional type whose actual structure depends on the value of `shape`:

#### 1. `shape = 'plain'`
```ts
Array<Record<string, string | number>>
// Example: [{ category: "A", value: 100 }, { category: "B", value: 200 }]
```

#### 2. `shape = 'hierarchy'`
```ts
Array<{
  id: string;
  name?: string;
  children?: HierarchyDataType; // Recursive child nodes
  [key: string]: any; // Other custom properties
}>
// Example: [{ id: "root", name: "Company", children: [...] }]
```

#### 3. `shape = 'relation'`
```ts
{
  nodes: Array<{ id: string; name?: string; [key: string]: any }>;
  edges: Array<{ source: string; target: string; [key: string]: any }>;
}
// Example: { nodes: [{id: "A"}, {id: "B"}], edges: [{source: "A", target: "B"}] }
```

#### 4. `shape = 'geo'`
```ts
{
  geoKeys: Array<{
    type: 'country' | 'city' | 'province' | 'lon&lat';
    key: string;   // Corresponds to field name in data
    name: string;  // Semantic name of geographic dimension
  }>;
  data: Array<Record<string, string | number>>;
}
// Example: 
// geoKeys: [{ type: "city", key: "city_name", name: "City" }]
// data: [{ city_name: "Beijing", population: 2100 }]
```
