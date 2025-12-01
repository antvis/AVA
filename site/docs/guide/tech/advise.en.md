---
title: advise
order: 1
redirect_from:
  - /en/docs/guide/tech/advise
---

The `advise` method provides chart recommendations. It takes natural language as input and outputs a configuration structure in **[antvSpec](/api/antv-spec/antv-spec)** format. This antvSpec can be used to render visualizations in **[gptvis]()** or other products that support the antvSpec format.

## 🔨 Usage

For more examples, please refer to **[Usage Examples](/examples#advisor-specify-chart)**.

### Recommended Statistical Charts

```ts
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const adviseSpec = async () => {
  const spec = await ava.advise(
    'Use a chart to display the sales volume and return rate of products from an e-commerce platform. From 2019 to 2023, the sales volumes were 1.2 million, 1.3 million, 1.4 million, 1.5 million, and 1.6 million units respectively; the corresponding return rates were 2%, 2.5%, 3%, 3.5%, and 4%.'
  );
  return spec;
}
```

- Output:
```json
{
  "type": "dual-axes",
  "title": "Sales and Return Rate over Years",
  "axisXTitle": "Year",
  "categories": ["2019", "2020", "2021", "2022", "2023"],
  "series": [
    {
      "type": "column",
      "data": [1200000, 1300000, 1400000, 1500000, 1600000],
      "axisYTitle": "Sales (units)"
    },
    {
      "type": "line",
      "data": [2, 2.5, 3, 3.5, 4],
      "axisYTitle": "Return Rate (%)"
    },
    {
      "type": "line",
      "data": [1200000, 1300000, 1400000, 1500000, 1600000],
      "axisYTitle": "Sales (units)"
    },
    {
      "type": "line",
      "data": [2, 2.5, 3, 3.5, 4],
      "axisYTitle": "Return Rate (%)"
    }
  ]
}
```

### Recommended Relational Charts

```ts
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const adviseSpec = async () => {
  const spec = await ava.advise(
    'The network includes the following devices: one server (Server), two personal computers (PC1, PC2), and one printer (Printer). The server is connected to PC1 and PC2, while both PC1 and PC2 are connected to the printer.'
  );
  return spec;
}
```

- Output:
```json
{
  "type": "network-graph",
  "data": {
    "nodes": [
      {"name": "Server"},
      {"name": "PC1"},
      {"name": "PC2"},
      {"name": "Printer"}
    ],
    "edges": [
      {"source": "Server", "target": "PC1"},
      {"source": "Server", "target": "PC2"},
      {"source": "PC1", "target": "Printer"},
      {"source": "PC2", "target": "Printer"}
    ]
  }
}
```
