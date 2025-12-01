---
title: AVA
order: 0
redirect_from:
  - /en/docs/api
---

```sign
Class AVA(config: AVAConfig)
```

* **AVA**: An AI-driven utility class that integrates data extraction, chart recommendation, and rendering.

`AVA` provides several main functions: `extract()` to extract data shards from text or raw data, `advise()` to produce chart recommendations and their AntV-Spec, and `render()` to render AntV-Spec into a visualization.

## Parameters

* **config** Recommendation & rendering configuration
  * `Type`: AVAConfig object

| Property   | Type                      | Description                                           | Default       |
| ---------- | ------------------------- | ----------------------------------------------------- | ------------- |
| llm        | `OpenAiLLM \| TboxLLM`   | LLM configuration used for extraction and advising.   | none `required` |
| includes   | `string[]`                | Allowed chart types whitelist.                        | none `optional` |
| excludes   | `string[]`                | Excluded chart types blacklist.                       | none `optional` |

* _**LLMConfig**_ Large Language Model configuration.

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

## Methods

### AVA.extract

Extract data shards `DataShard[]` from text or raw data.

```ts
AVA.extract(input?: string): Promise<DataShard[]>;
```

When the input is natural language, `extract()` invokes the configured LLM to parse intent, fields, and data shape; when the input is a structured object or tabular text, it directly extracts into data shards.

### AVA.advise

Obtain chart recommendations and AntV-Spec as `AdviseStageOutput`.

```ts
AVA.advise(query: DataShard[] | string): Promise<AdviseStageOutput>;
```

If `extract()` was called and resulted in empty shards, it falls back to `config.input` for advising; otherwise it uses the provided `query` (data shards or text). The result includes `metas`, `data`, and `charts` (each containing a `spec`).

### AVA.render

Render the recommended `spec` into the specified container.

```ts
AVA.render(container: string, spec: Spec): any | null;
```

If a `renderer` is configured or registered externally, the render function outputs the visualization; if not configured, it returns `null`.
