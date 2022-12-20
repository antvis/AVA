---
title: 高级用法：自定义插件扩展
order: 3
---

NarrativeTextVis 组件展示形态遵循了 NTV 设计规范，但是不同的业务场景对数据短语的表达可能有所不同（比如红涨绿跌还是红跌绿涨），有时内容类型超过 ntv-schema 默认的短语类型和段落类型（文字段落需要），此时可以通过自定义插件来完成，通过自定义插件扩展展示和交互可以完成几乎所有场景。

## 如何自定义插件

通常，可以通过以下三步完成插件自定义：
1. 定义 customType；
2. 通过工厂函数（createXxx）定义插件；
3. 传入 NarrativeTextVis 组件；

以自定义短语为例，

```jsx
import { NarrativeTextVis, NtvPluginManager, createCustomPhraseFactory } from '@antv/ava-react';

const spec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            {
              type: 'custom',
              value: '',
              metadata: {
                // step1. 定义 customType
                customType: 'myPhrase',
              }
            }
          ]
        }
      ]
    }
  ]
}

const pluginManager = new NtvPluginManager([
  // step2. 通过工厂函数（createXxx）定义插件；
  createCustomPhraseFactory({
    key: 'myPhrase',
    content: (value, meta) => '我是一个自定义的短语',
  })
])

export default () => {
  return (
    <NarrativeTextVis 
      spec={spec}
      // step3. 传入 NarrativeTextVis 组件；
      pluginManager={pluginManager} 
    />
  )
}
```


## 三类自定义

### 自定义实体短语

虽然我们有提供默认的数据短语（EntityPhrase）样式，并作为规范，但是各类业务中可能会有定制，此时你只需通过对于实体短语插件实例化之后传入组件即可完成全局同类型的数据短语样式自定义。

[示例](../../../examples/ntv/custom/#entity)中通过 encoding 将默认的差值为正负号，比率为上下三角，都定制为了上下箭头，并且将颜色通道的红涨绿跌修改为了红跌绿涨。其中 encoding 可配置的正是实体短语常用到视觉通道，包括：

- color: 字体颜色；
- bgColor: 背景色；
- fontSize: 字体大小；
- fontWeight: 字体粗细；
- underline: 是否有下划线；
- prefix: 前缀，通常是一些 icon；
- suffix: 后缀，通常是一些 icon；
- inlineChart: 行内小图；


### 自定义短语

除了改变内置实体短语的表现，还可以通过自定义其他短语，如下面的例子，通过自定义短语扩展文本分析交互，未来 NTV 也有规划默认内置更多有用的分析交互控件。


### 自定义区块

除了短语级别，还可以对快级元素 Section 和 Paragraph 做自定义，比如下面的例子定义一个“图表区块”将图表嵌入文本。未来 NTV 也有规划将常见洞察图表作为内置区块默认支持。


<Playground path="ntv/interactive/demo/analysis.tsx"></Playground>
