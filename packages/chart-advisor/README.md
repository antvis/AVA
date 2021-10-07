<h1 align="center">
  <p>ChartAdvisor</p>
  <span style="font-size: 24px;">AVA/chart-advisor</span>
</h1>

<div align="center">

An empiric-driven chart recommendation js library.

> tbd

[![Version](https://badgen.net/npm/v/@antv/chart-advisor)](https://www.npmjs.com/@antv/chart-advisor)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/chart-advisor.svg)](http://npmjs.com/@antv/chart-advisor)
</div>

## Features 

### Chart Recommendation

Recommend a list of specifications of charts by analyzing given dataset and user options.

### Chart Issue Detection

Detect design issues in the given charts with a chart linter.

### Customization

Customize chart knowledge and rules for recommending charts and locating issues in charts.

### ⚠️ Migration

The feature of generating charts in the given container in v1 has been migrated to xxxx.

## Installation

> not yet

```bash
$ npm install @antv/chart-advisor
```

## Usage

```ts
import { Advisor, Linter, ChartAdvisor } from '@antv/chart-advisor';

const data = [
  { price: 100, type: 'A', series: 'X' },
  { price: 120, type: 'B', series: 'Y' },
  { price: 150, type: 'C', series: 'Z' },
];

// recommend charts
const myAdvisor = new Advisor();
const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});

// find problems in a chart
const myLinter = new Linter();
const errors = myLt.lint(spec);

// recommend charts with linted problems
const myCA = new ChartAdvisor();
const results = myCA.advise({data, options: { refine: true }});
```


## Documentation

This project is still an alpha version. We eagerly welcome any contribution.

For more usages, please check the [Quick API](./API.md).

## Contribution

We welcome all contributions. Please read [General Contribution Guide](../../CONTRIBUTING.md) first.

You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

## License

MIT
