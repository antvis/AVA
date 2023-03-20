---
title: NarrativeTextVis
order: 1
---

`NarrativeTextVis` 是一个用于渲染数据解读文本 React 组件。

## Props

| 属性         | 类型                | 描述                 | 默认值          |
| ------------ | ------------------- | -------------------- | --------------- |
| spec         | `NarrativeTextSpec`             | 结构数据             | 无              |
| size         | 'normal' \| 'small'    | 字体大小，normal 是 14px，small 是 12px           | 'default'              |
| theme         | 'light' \| 'dark'    | 主题色，当前支持 light 亮色模式和 dark 暗色模式          | 'light'              |
| showCollapse         | boolean \| CollapseConfig    |     段落可折叠配置      | false              |

```typescript
type CollapseConfig = {
  /** 是否展示连接线 */
  showBulletsLine?: boolean;
  /** 自定义展开/折叠图标 */
  switcherIcon?: (collapsed: boolean) => ReactNode;
  /** 收起 key 受控 */
  collapsedKeys?: string[];
  /** 收起事件 */
  onCollapsed?: (collapsedKeys: string[]) => void;
};
```

## 插件工厂函数

### 自定义实体短语（EntityPhrase）

entity 短语规范了解读文本常见需要进行特殊样式编码的短语，如指标名、指标值、对比差值、对比差率等，默认样式及名称见 [Phrase 基本样式](./style#phrase)。通过引入各 entity 的 plugin 函数实例化 NtvPluginManager 自定义 entity 样式和交互。

以指标值为例，通过引入 `NtvPluginManager` 和 `createMetricValue` 实例出 plugin manager 后即可传入各级解读 `<NarrativeTextVis />`、`<Section />`、`<Paragraph />`和`<Phrase />`。

```jsx
import { NtvPluginManager, createMetricValue } from '@antv/ava-react';
const plugins = [
  createMetricName({
    encoding: {
      bgColor: '#F8FAFC',
      color: '#424241',
      fontWeight: 600,
    },
  }),
];
const ntvPluginManager = new NtvPluginManager(plugins);
```

- 类似 `createMetricValue` 的其他 entity 插件生成函数可通过 entityType 相同的命名规则找到，`create{entityType}`;
- 每个 entity 生成函数参数，以 createMetricName 为例，`createMetricName(descriptor: EntityPhraseDescriptor, mode: 'overwrite' | 'merge')`，第一个参数用与描述节点数据映射规则，具体类型如下，第二个参数 `mode` 表示 `overwrite` 覆盖默认行为或者 `merge` 合并默认表现，默认是 `merge`。

```ts
interface EntityPhraseDescriptor {
  /** entity 节点 encoding，大多数时候数据驱动静态文本都可以通过定义 encoding 描述完成 */
  encoding?: EntityEncoding<ReactNode>;
  /** 内容，默认是 value */
  content?: (value: string, metadata: EntityMetaData) => ReactNode;
  /** class name 列表 */
  classNames?: string[] | ((value: string, metadata: EntityMetaData) => string[]);
  /** 样式 */
  style?: CSSProperties | ((value: string, metadata: EntityMetaData) => CSSProperties);
  /** hover 事件 */
  onHover?: (value: string, metadata: EntityMetaData) => string;
  /** click 事件 */
  onClick?: (value: string, metadata: EntityMetaData) => string;
  /** 获取纯文本回调函数，用于导出模块，可不指定，默认是 text */
  getText?: (value: string, metadata: EntityMetaData) => string;
  /**
   * 覆盖节点形式，最高优先级
   * @param node 默认节点，可以基于此进行扩展
   * @param value PhraseSpec['value']
   * @param metadata PhraseSpec['metadata']
   */
  overwrite?: (node: ReactNode, value: string, metadata: EntityMetaData) => ReactNode;
}

type TypeOrMetaReturnType<T> = T | ((value: string, metadata: EntityMetaData) => T);
type EntityEncoding<NodeType> = Partial<{
    color: TypeOrMetaReturnType<string>;
    bgColor: TypeOrMetaReturnType<string>;
    fontSize: TypeOrMetaReturnType<string | number>;
    fontWeight: TypeOrMetaReturnType<string | number>;
    underline: TypeOrMetaReturnType<boolean>;
    /** 前缀，比如对比差值、对比差率前面的正负号逻辑 */
    prefix: TypeOrMetaReturnType<NodeType>;
    /** 后缀 */
    suffix: TypeOrMetaReturnType<NodeType>;
    inlineChart: TypeOrMetaReturnType<NodeType>;
}>;
```

Q：overwrite 和 content 有什么区别？应该怎么定义？

A：我们将实体节点 encoding 结构规范如下图，建议通过具体位置来完成映射制定，overwrite 通常是为了完成制定位置无法描述的内容，如 tooltip。由于 content 与 overwrite 都可以返回 ReactNode，您可以自由的选择合适的方式进行短语描述。
![EntityPhrase 结构](https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*ZuuOSovBOjQAAAAAAAAAAAAAARQnAQ)


### 自定义短语（CustomPhrase）

如果您的系统内短语类型超过 entityType 规范范围，可通过声明 CustomPhrase 并使用 `createCustomPhraseFactory` 配置自定义短语，自由扩展短语类型与交互。

```ts
// MetaData 传入自定义节点 metadata 信息对应 CustomPhrase 的 metadata 结构
type CreateCustomPhraseFactory = <MetaData extends CustomBlockElement>(descriptor: CustomPhraseDescriptor<MetaData>)=> PhraseDescriptor<MetaData>;

interface CustomPhraseDescriptor<MetaData> {
  /** 唯一标识 key 必传，相同的 key 前面的将被后面的覆盖 */
  key: string;
  /** 内容，默认是 value */
  content?: (value: string, metadata: MetaData) => ReactNode;
  /** class name 列表 */
  classNames?: string[] | ((value: string, metadata: MetaData) => string[]);
  /** 样式 */
  style?: CSSProperties | ((value: string, metadata: MetaData) => CSSProperties);
  /** hover 事件 */
  onHover?: (value: string, metadata: MetaData) => string;
  /** click 事件 */
  onClick?: (value: string, metadata: MetaData) => string;
  /** 获取纯文本回调函数，用于导出模块，可不指定，默认是 text */
  getText?: (value: string, metadata: MetaData) => string;
  /**
   * 覆盖节点形式，最高优先级
   * @param node 默认节点，可以基于此进行扩展
   * @param value PhraseSpec['value']
   * @param metadata PhraseSpec['metadata']
   */
  overwrite?: (node: ReactNode, value: string, metadata: MetaData) => ReactNode;
}
```

一个简单的 ts 类型示例：

```ts
createCustomPhraseFactory<{ customType: string; level: number }>({
  key: 'level',
  content: (value, meta) => `${meta.level}-${value}`,
})
```

### 自定义区块（CustomBlock）

除了短语级别，快级元素 section paragraph 也可能需要自定义扩展，可以使用 `createCustomBlockFactory` 配置自定义区块插件。

```ts
type CreateCustomBlockFactory = <BlockSpec>(descriptor: BlockDescriptor<BlockSpec>) => BlockDescriptor<BlockSpec>;
interface BlockDescriptor<BlockSpec> {
  key: string;
  className?: string | ((spec: BlockSpec) => string);
  style?: CSSProperties | ((spec: BlockSpec) => CSSProperties);
  /** 自定义 render 行为 */
  render?: (spec: BlockSpec) => ReactNode;
  /** 获取纯文本回调函数，用于导出模块 */
  getText?: (spec: BlockSpec) => string;
}
```
