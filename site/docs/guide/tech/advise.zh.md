---
title: 图表推荐(advise)
order: 1
redirect_from:
  - /zh/docs/guide/tech/advise
---

`advise` 图表推荐方法，输入自然语言然后可推荐出 **[antvSpec](/api/antv-spec/antv-spec)** 的配置结构，antvSpec 可以用于 **[gptvis]()** 或其他支持 antvSpec 的产品进行渲染

图表推荐是 AVA 的核心能力之一，3.0 版本中使用规则打分进行图表推荐、模板代码进行图表配置生成，主要存在两个问题：
- 意图与语义缺失：无法从自然语言解析“分析意图、字段类型、单位语义”，强依赖完美结构化输入，易误判图表类型与编码；
- 规则繁多难维护：图表类型、数据形状、使用场景一多，规则数量指数增长，互斥与叠加冲突难以管理，出现“不可预测的边界效应”。

4.0 版本中我们拥抱 AI，使用基于图表知识库与提示工程的 LLM 方案，整体流程采用两阶段 LLM 编排：候选图表选择 → 图表配置生成。
- 图表知识库：提供丰富的图表知识库，支持 25+ 图表类型，包括折线图、柱状图、饼图、散点图等；AVA 系列 3 个核心包：@antv/ava、@antv/gpt-vis 和 @antv/mcp-server-chart 采用同构的 AntV Spec 规范，可应用于不同场景下的图表生成。
- 候选图表选择阶段，输入统一抽象为数据抽取得到的 DataShard （数据分片），包含数据、字段元信息、字段特征、可视分析意图，让大模型在“数据分片 + 分析意图 + 图表知识”的约束下进行受控选型。
- 图表配置生成阶段，我们使用 AVA 系列同构的 AntV Spec 规范驱动 LLM 生成图表配置，借助 JSON-Schema 对图表输出进行约束，拒绝臆造字段与不必要的自由度。

这套方案的优势在于：
- 意图与语义理解更强：支持从自然语言抽取“数据+字段类型+单位+分析意图”，对欠规范输入更友好，规避“只适配结构化数据”的局限；
- 维护成本显著降低：新增图表或修订推荐逻辑，主要在知识库与 Prompt 层更新，无需在代码中堆叠大量分支与交叉规则

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
