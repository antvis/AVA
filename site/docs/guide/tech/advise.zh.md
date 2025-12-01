---
title: 图表推荐(advise)
order: 1
redirect_from:
  - /zh/docs/guide/tech/advise
---

`advise` 图表推荐方法，输入自然语言然后可推荐出 **[antvSpec](/api/antv-spec/antv-spec)** 的配置结构，antvSpec 可以用于 **[gptvis]()** 或其他支持 antvSpec 的产品进行渲染

## 🔨 使用

更多示例可参考 **[使用示例](/examples#advisor-specify-chart)**

### 常规统计图表推荐
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
    '利用图表展示一家电商平台的商品销量和退货率。在2019至2023年间，商品销量依次是120万件、130万件、140万件、150万件、160万件；相应的退货率则为2%、2.5%、3%、3.5%、4%。'
  );
  return spec;
}
```

- 输出为：
```json
{
  "type ": "dual-axes",
  "title": "Sales and Return Rate over Years",
  "axisXTitle": "Year",
  "categories": [
    "2019",
    "2020",
    "2021",
    "2022",
    "2023"
  ],
  "series": [
    {
      "type": "column",
      "data": [
        1200000,
        1300000,
        1400000,
        1500000,
        1600000
      ],
      "axisYTitle": "Sales (件)"
    },
    {
      "type": "line",
      "data": [
        2,
        2.5,
        3,
        3.5,
        4
      ],
      "axisYTitle": "Return Rate (%)"
    },
    {
      "type": "line",
      "data": [
        1200000,
        1300000,
        1400000,
        1500000,
        1600000
      ],
      "axisYTitle": "Sales (件)"
    },
    {
      "type": "line",
      "data": [
        2,
        2.5,
        3,
        3.5,
        4
      ],
      "axisYTitle": "Return Rate (%)"
    }
  ]
}
```


### 关系类图表推荐
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
    '网络中有以下设备：一个服务器（Server），两台个人电脑（PC1, PC2）和一个打印机（Printer）。服务器连接到PC1和PC2，而PC1和PC2都连接到打印机。'
  );
  return spec;
}
```

- 输出为：
```json
{
  "type ": "network-graph",
  "data": {
    "nodes": [
      {
        "name": "服务器"
      },
      {
        "name": "个人电脑1"
      },
      {
        "name": "个人电脑2"
      },
      {
        "name": "打印机"
      }
    ],
    "edges": [
      {
        "source": "服务器",
        "target": "个人电脑1"
      },
      {
        "source": "服务器",
        "target": "个人电脑2"
      },
      {
        "source": "个人电脑1",
        "target": "打印机"
      },
      {
        "source": "个人电脑2",
        "target": "打印机"
      }
    ]
  },
}
```
