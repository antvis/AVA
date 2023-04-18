---
title: ntv-schema
order: 1
---

ntv-schema 一套用于声明式描述解读文本结构的 json schema，是 NTV 的底座。

## 用法

1. 使用类型定义
```ts
import { NarrativeTextSpec } from '@antv/ava';
```
2. 使用 json-schema

`https://antv.github.io/ntv-schema/[version].json`

## 结构介绍

![ntv-schema](https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*r_AtT5YHFvgAAAAAAAAAAAAADmJ7AQ/original)

从结构层看：
- 整套解读结构称为 narrative，包括一个题目（headline）和多个章节（section）；
- 每个章节有多个段落（paragraph）构成，段落有标题类（heading）、正文类（normal）、列表类（bullets）和自定义类型；
- 每个段落又由多个短语（phrase）构成。

而短语层则体现出“数据描述文本”和普通文本的最大差别。短语（phrase）分为三种：text、entity 和 custom。
- text 就是普通纯文本；
- entity 是具有数据含义的短语，将数据映射为文本，是解读文本可视化的主要内容；
- custom 则是一种提供给用户自定义的短语插槽，当前常被用于实现一些短语级别的交互。

以下是所有类型为 Entity 的短语一览：

<Playground path="ntv/basic/demo/entity-phrases.tsx" ></Playground>

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

## 关于 ntv-schema 的学习成本

***ntv-schema 构建成本高不如直接拼接 DOM 快，我为什么还要用？***

要解答这个问题需要先明确 json 从哪儿来？

NTV 相关技术基于 json 数据来自服务端生成，前端消费 schema 进行渲染即可。随着数据表达的多样性和即时性的要求越来越高，以及 NLP 技术越来越多的被应用，前端维护文本模版将不可持续。此时使用 NarrativeTextVis 进行统一渲染将是最佳选择。

但是不可否认仍然将有很长一段时间，类似的文本表达可以通过默认的一套或者几套模版满足需求，结合 ntv-schema 的学习成本，使用前端熟悉的 dom/jsx 进行开发似乎是更好的选择。<u>*如果你的业务对文本表述扩展性要求不高，且模版相对固定，请使用你熟悉的语法。*</u> 但是如果使用 ntv-schema 将带来以下好处：

- 作为一种解读文本的标准描述，可静态化文本数据结构，一处维护各处复用，比如之后复用给 vue、web components，还有利于数据储存和进一步消费。
- 样式规范，默认好看；
- 行内小图（word-scale chart）是默认的支持的，并且随着版本升级可获得更多行内数据展示；
- 相关交互的可扩展性；

### 基于变量和模版快速拼装 schema

为了方便前端拼装 schema 的场景，我们提供了 `generateTextSpec` 工具函数，只需要定义静态化的文本描述结构（structures 和 structureTemps），依据输入不同的变量特点（比如根据列表个数循环、特征值判断是否输出模板），即可生成所需数据结构。该文本描述结构极大的降低了 ntv-schema 的构建成本，有效解决了业务模版可维护性、可读性、定制性等问题。使用方式如下，更多细节见 [API 定义](../../api/ntv/generate)。

```js
const textSpec = generateTextSpec({ structures, structureTemps, variable });
```
