<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<h1 align="center">
  <p>Chart Advisor</p>
  <span style="font-size: 24px;">AVA/chart-advisor</span>
</h1>

<div align="center">

Chart recommendation and based on dataset and analysis needs.

[![Version](https://badgen.net/npm/v/@antv/chart-advisor)](https://www.npmjs.com/@antv/chart-advisor)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/chart-advisor.svg)](http://npmjs.com/@antv/chart-advisor)

</div>

## Demo - autoChart

```html
<div id="mountNode"></div>
```

```js
import { autoChart } from '@antv/chart-advisor';

const container = document.getElementById('mountNode');

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

autoChart(container, data, {toolbar: true, development: true});
```

<br>

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/QTJPYXJpjW/avademo.gif" alt="AVA demo">
</div>

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

## Documentation

This project is still an alpha version. We eagerly welcome any contribution.

If you are going to use it in your official online project, please lock the version and follow our updates.

* For more usages, please check the [Quick API](./API.md)
* Detailed [API Reference](../../docs/api/chart-advisor.md)

## Folder Structure
- advice-pipeline/  -- *depends on `rules` and `custom-plot`*
- auto-chart/ -- *depends on `advice-pipeline`*
- custom-plot/ -- *custom plot which is not include in g2plot*
- i18n/ -- *international*
- insight/  -- *insights*
- rules/  -- *advice*
- index.ts  -- *main entry*
- style.ts  -- *sharing styles*
- util.ts  -- *sharing utils*

## Contribution

We welcome all contributions. Please read [General Contribution Guide](../../CONTRIBUTING.md) first.

You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

## License

MIT

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on G2Plot.
