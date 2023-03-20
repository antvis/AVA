---
title: generateTextSpec
order: 2
---

generateTextSpec 是一个工具方法，用于通过原始数据拼接生成 ntv-schema 的场景。

```typescript
generateTextSpec({ structures, structureTemps, variable }: {
  variable: Variable;
  structures: Structure[];
  structureTemps?: StructureTemp[];
}): NarrativeTextVis
```

### Structure


| 属性         | 类型                | 描述                 | 默认值          |
| ------------ | ------------------- | -------------------- | --------------- |
| displayType         | 'heading' \| 'paragraph' \| 'bullet'             | 展示段落类型             | 'paragraph'              |
| bulletOrder         | boolean    | 列表是否有序           | false              |
| children         | Structure    | 用于生成嵌套列表          | -              |
| className         | string    |     自定义 class      | -              |
| template         | string    |     文案模版字符串，详情见 template string 写法说明    | -              |
| separator         | string    |     分隔符，如果数据是数组，自动循环之间的拼接符号      | -              |
| limit         | string    |     列表循环取前几个      | -              |
| variableMetaMap         | VariableMetaMap    |     变量附加信息      | -              |
| useVariable         | string    |     类似 lodash get 变量路径访问变量      | -              |


```ts
type VariableMetaMap = Record<string, VariableMeta>;
```

### VariableMeta

| 属性         | 类型                | 描述                 | 默认值          |
| ------------ | ------------------- | -------------------- | --------------- |
| varType         | string    | 变量类型，不属于 entityType 则自动认为是 customType         | -              |
| formatter         | (value: any) => string    | 数值自动格式化         | -              |
| getDisplayValue         | string \| ((globalVar: Variable, scopeVar: Variable) => string)   | 拼接 value 变量，当时字符串的时候支持 ${} 语法取变量         | -              |
| extraCustomMeta         | (globalVar: Variable, scopeVar: Variable) => Record<string, any>   | 其他自定义属性，通过 varType 判断此变量类型为 customType 时增加自定义 metadata  信息      | -              |


### StructureTemp

| 属性         | 类型                | 描述                 | 默认值          |
| ------------ | ------------------- | -------------------- | --------------- |
| templateId         | string    | 模版 ID         | -              |

其余属性 template、separator、limit、variableMetaMap、useVariable 同 Structure。

### Variable

任意对象。

### template string 写法说明

通过类似模版字符的方式表达文字内容，当前支持两种特殊字符：
1. ${} 表示应用哪个变量，其中变量取值支持两种路径方式：
    1. 相对路径，eg ${name} => variable.name；
    2. 绝对路径，在 useVariable 的作用在运行到某个模版时拥有了局部变量，如果是以 '.' 开头的字符串将从局部变量中取值，eg ${.name} => variable.data[n].name；
2. &{} 表示应用哪个模版，即 structureTemp 中的 templateId。


### 复杂 Case & 未来工作

该方法目标可以对标转换几乎所有 ntv-schema 表述能力，比如下面的波动分析案例，通过模版定义描述了基于所选的归因维度分别下钻计算指标的波动情况，找到对指标整体波动贡献度最大的 TOP 维度值，并且支持通过自定义短语做继续归因等交互。

当前，一些 feat 仍在开发中，比如通过变量运行时控制模版是否输出，自定义段落表达等，同时随着 schema 的完善也会继续增加能力，敬请期待。

<Playground path="ntv/case/demo/fluctuation.tsx"></Playground>
