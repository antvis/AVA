---
title: Introduction to Chart Advisor
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

Chart recommendation and based on dataset and analysis needs.

</div>

## Demo - autoChart

<playground path="chart-advisor/auto-chart/demo/basic.ts"></playground>

## Features

### Chart Recommendation

Recommend a list of specifications of charts by analyzing given dataset and user options.

### Generating Chart

Automatically render recommended charts in your containers.

## Installation

```bash
$ npm install @antv/chart-advisor
```

## Usage

```js
import { autoChart } from '@antv/chart-advisor';

autoChart(container, data, {toolbar: true, development: true});
```

</div>
