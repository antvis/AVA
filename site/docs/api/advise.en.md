---
title: Chart Recommendation
order: 2
redirect_from:
  - /en/docs/api
---

## Advise

This page describes the **Chart Recommendation (`advise`)** feature: the typical workflow for generating chart suggestions based on data.

### Overview

The `advise` method generates recommended chart specifications (specs) based on data characteristics. The typical workflow consists of three steps:

1. **`extract`** — Extract features or data shards from raw input  
2. **`advise`** — Generate chart recommendations based on the extracted results  
3. **`render`** — Render the recommended charts using a specified renderer  

The `AVA` class (from `@antv/ava`) orchestrates these steps.

### Usage Example

```ts
import { AVA } from '@antv/ava';

const ava = new AVA({ /* configuration */ });
const shards = await ava.extract(`Please generate chart recommendations based on the following data: ${JSON.stringify(data)}`);
const advises = await ava.advise(shards);
// `advises` is an array of recommendations, typically containing fields like `charts`, `insights`, and `metadata`
const firstSpec = advises[0]?.charts?.[0]?.spec;
ava.render('#container', firstSpec);
```

### Notes

- The output of `advise` usually includes additional metadata, such as reasoning, scores, or textual insights. These can be accessed via fields like `advises[i].insights`.
- The `render` step depends on a bound renderer (see the **Render** documentation). If no renderer is bound, it may either use a default renderer or throw an error. Ensure you call `bindRenderer` or provide a renderer before invoking `render`.

### Parameters

| Name   | Type                                      | Required | Description                                     |
| ------ | ----------------------------------------- | -------- | ----------------------------------------------- |
| input  | [DataShard](./extract#datashard)[] \| string | Yes      | An array of data shards or any text input       |

### Return Value

| Name   | Type                                      | Description                                                                 |
| ------ | ----------------------------------------- | --------------------------------------------------------------------------- |
| result | [Spec](./antv-spec/antv-spec)[]           | An array of chart specifications. See [Chart Knowledge Base](./antv-spec/area) for details |
