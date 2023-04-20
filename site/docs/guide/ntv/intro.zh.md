---
title: 解读文本可视化(NTV)简介
order: 0
---

在数据分析全流程展示上，除了可视化图表外，通过文本描述数据现象、给出洞察结论辅助分析，也十分重要。NTV 就是针对该场景的解决方案。

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*cnvURpTDLk4AAAAAAAAAAAAADmJ7AQ/original" alt="NTV命名" style="width: 800px;" />


## 功能特性

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*2A7TQp2mwD4AAAAAAAAAAAAADmJ7AQ/original" alt="NTV功能特性" style="width: 600px;" />

用文字描述数据的三个挑战：
1. **信息密度大**：相较于图和表，文字在单位面积内的可描述的数据信息更多，通常一段文字就可能是 4-5 张可视化图表的内容；
2. **内容依赖自动化生成**：随着数据分析平民化以及 NLP 技术的成熟，越来越多的洞察结论将由机器自动生成；
3. **基于文本继续分析**：从看数到分析，不管在探索分析应用还是交互式分析报表中，都需要基于分析结果展示进行二次分析做相关交互如筛选、下钻、上卷等，而文本作为分析结果重要的形式也是需要交互辅助分析能力的。

应对挑战的三大特性：
1. **提高可读性**：通过使用可视化映射原理对数据元素做标记，帮助用户快速识别关键信息；通过增加行内小图，在感性层面提高用户对数据的感知；
2. **结构标准化定义**：洞察结论文本的自动化乃至智能化生成的基础是数据结构的标准化，做好领域标准结构定义也将促进技术合力积累与发展；
3. **交互与自定义扩展**：解读文本是含有数据绑定信息的，特别是短语作为数据元信息绑定的基础单元可以作为分析交互等触发控件，如基于日期描述做日期切换、基于拆分维度做维值切换等，可以通过自定义扩展实现。

## 核心能力

1. `NarrativeTextSpec`（ntv-schema）进行了解读文本的标准化定义；
2. `<NarrativeTextVis />` 组件消费 ntv-schema 并应用文本可视化映射完成解读文本展示；

## 使用

### 1.数据准备（获取/构建 ntv-schema）

获取 TS 类型定义：

```ts
import { NarrativeTextSpec } from '@antv/ava';
```

一个 ntv-schema json 数据示例：

```json
{
  "sections": [
    {
      "paragraphs": [
        {
          "type": "normal",	// 普通段落，还有 heading bullets 等其他类型
          "phrases": [
            {
              "type": "text",
              "value": "数据表现：",
            },
            {
              "type": "entity",
              "value": "单价",
              "metadata": { "entityType": "metric_name" }
            },
            {
              "type": "entity",
              "value": "1.24万",
              "metadata": { "entityType": "metric_value", origin: 124258.91 }
            }
          ]
        }
      ]
    }
  ]
}
```

点击 [ntv-schema 介绍](./ntv-schema.zh.md) 查看更多。

### 2. 使用 `<NarrativeTextVis />` 渲染

```tsx
import { NarrativeTextVis, NarrativeTextSpec } from "@antv/ava-react";

const textSpec: NarrativeTextSpec = {
  // ...
};

export default () => {
  return <NarrativeTextVis spec={textSpec} />;
}
```
点击 [`<NarrativeTextVis />` 组件介绍](./ntv-comp.zh.md) 查看更多。


<Playground path="ntv/case/demo/report.tsx"></Playground>
