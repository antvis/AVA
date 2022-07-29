<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<h1 align="center">
  <p>AutoChart</p>
  <span style="font-size: 24px;">AVA/auto-chart</span>
</h1>

<div align="center">

AutoChart is a React component that can automatically recommends and renders the appropriate chart based on the input data.



[![Version](https://badgen.net/npm/v/@antv/auto-chart)](https://www.npmjs.com/@antv/auto-chart)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/auto-chart.svg)](http://npmjs.com/@antv/auto-chart)
</div>

## ✨ Features

AutoChart exports the `AutoChart` component which is available for AVA users.
It combines the major capabilities of `ChartAdvisor`, the core chart recommendation library in AVA.

AutoChart can be used to automatically generate and render appropriate charts based on the given data and analysis requirements.
The core purpose of AutoChart is to provide users with the ability to automatically illustrate proper chart of data with a single line of code.


## 📦 Installation

```bash
$ npm install @antv/auto-chart
```

## 🔨 Usage


```js
import React from 'react';
import ReactDOM from 'react-dom';
import { AutoChart } from '@antv/auto-chart';

const data = [
  { f1: '2019-01', f2: 100 },
  { f1: '2019-02', f2: 300 },
  { f1: '2019-03', f2: 340 },
  { f1: '2019-04', f2: 330 },
];

ReactDOM.render(<AutoChart data={data} />, document.getElementById('container'));
```



## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/auto-chart/AutoChart)

## Contribution

We welcome all contributions. Please read [General Contribution Guide](../../CONTRIBUTING.md) first.

You can submit any ideas as [Pull Requests](https://github.com/antvis/AVA/pulls) or as [GitHub Issues](https://github.com/antvis/AVA/issues). 
Let's build a better AVA together.

## License

MIT
