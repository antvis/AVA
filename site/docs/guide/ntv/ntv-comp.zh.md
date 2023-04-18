---
title: NarrativeTextVis 组件
order: 2
---

`NarrativeTextVis` 是一个用于渲染数据解读文本的 React 组件，以 [ntv-schema](./ntv-schema.zh.md) 为基础数据结构。

## 基础使用

1. 引入组件；
2. 构建符合 [ntv-schema](./ntv-schema.zh.md) 的数据格式；
3. 传入组件进行渲染；


```tsx
import { NarrativeTextVis, NarrativeTextSpec } from '@antv/ava-react';

const textSpec: NarrativeTextSpec = {
  // ...
};

export default () => {
  return <NarrativeTextVis spec={textSpec} />;
}
```

<Playground path="ntv/basic/demo/basic.tsx"></Playground>

<!-- TODO -->

<!-- ## 高阶用法：使用插件系统自定义扩展短语和区块

`<NarrativeTextVis />` 组件基于默认的文本样式规范，如果需要自定义样式、自定义交互可以通过插件自定义扩展实现。

### 自定义实体短语

### 自定义短语

### 自定义区块 -->
