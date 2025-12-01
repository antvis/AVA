---
title: AVA
order: 0
redirect_from:
  - /zh/docs/api
---

```sign
Class AVA(config: AVAConfig)
```

* **AVA**: 是集数据抽取、图表推荐与渲染于一体的工具类，能力由 AI 驱动。

`AVA` 提供了几个主要函数：`extract()` 用于从文本或原始数据中抽取数据分片，`advise()` 用于产生图表推荐及其图表配置(AntV-Spec)，`render()` 用于将 AntV-Spec 渲染为可视化。

## 参数

* **config** 推荐与渲染配置
  * `参数类型`: AVAConfig 对象

| 属性      | 类型                        | 描述                                   | 默认值     |
| --------- | --------------------------- | -------------------------------------- | ---------- |
| llm       | `OpenAiLLM \| TboxLLM`     | 大模型配置，用于抽取与推荐。           | 无  `必选` |
| includes  | `string[]`                  | 允许推荐的图表类型白名单。             | 无  `可选` |
| excludes  | `string[]`                  | 排除的图表类型黑名单。                 | 无  `可选` |

* _**LLMConfig**_ 大模型参数结构。

```ts
type BaseLLMConfig = {
  maxRetryCount?: number;
  timeout?: number;
  maxTokens?: number;
};

type OpenAiLLM = BaseLLMConfig & {
  url: string;
  model: string;
  apiKey: string;
};

type TboxLLM = BaseLLMConfig & {
  appId: string;
  authorization: string;
};
```

## 方法

### AVA.extract

从文本或原始数据中抽取数据分片 `DataShard[]`。

```ts
AVA.extract(input?: string): Promise<DataShard[]>;
```

当输入为自然语言时，`extract()` 会调用配置的 LLM 解析意图、字段与数据形态；当输入为结构化对象或表格文本时，将直接抽取为数据分片。

### AVA.advise

获得图表推荐与 AntV-Spec 的 `AdviseStageOutput`。

```ts
AVA.advise(query: DataShard[] | string): Promise<AdviseStageOutput>;
```

若已调用过 `extract()`，且分片为空，则会回退使用 `config.input` 文本进行推荐；否则使用传入的 `query`（数据分片或文本）。返回结构包含 `metas`、`data` 以及 `charts`（其中每项含 `spec`）。

### AVA.render

将推荐的 `spec` 渲染到指定容器。

```ts
AVA.render(container: string, spec: Spec): any | null;
```

当已通过 `renderer` 配置或外部注册渲染器时，调用渲染函数输出可视化；未配置渲染器时返回 `null`。
