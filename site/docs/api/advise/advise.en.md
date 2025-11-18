---
title: Chart Recommendation
order: 2
redirect_from:
  - /zh/docs/api/advise
---

# Advise (Chart Recommendation)
 
This page describes the "advise" capability: generating chart recommendations from data using the AVA workflow.

## Overview

`advise` produces suggested chart specifications given dataset features. Typical flow:

1. `extract` — extract features/shards from raw data
2. `advise` — generate chart recommendations based on the extracted features
3. `render` — render a recommended chart using the chosen renderer

The AVA class (from `@antv/ava`) coordinates these steps.

## Typical usage

```ts
import { AVA } from '@antv/ava';

const ava = new AVA({ /* options */ });
const shards = await ava.extract({ purpose: '请根据数据生成图表建议', data });
const advises = await ava.advise(shards);
// advises is an array of recommendation objects; each may contain charts, insights, and metadata
const firstSpec = advises[0]?.charts?.[0]?.spec;
ava.render('#container', firstSpec);
```

## Notes

- `advise` output often contains additional metadata such as reasoning, score, or textual insights. Check `advises[i].insights` or similar fields.
- The `render` step depends on the bound renderer (see API: Render). If no renderer is bound, the library may provide a default or throw — call `bindRenderer` or pass a renderer before rendering.

