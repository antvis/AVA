---
title: Introduction to AutoChart
order: 0
---

`markdown:docs/common/style.md`


AutoChart is a React component that can automatically recommends and renders the appropriate chart based on the input data.


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
import { AutoChart } from '@antv/auto-chart';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

ReactDOM.render(
  <>
    <AutoChart 
      title="CASE 1" 
      description="auto chart analysis" 
      data={defaultData} 
      language={'zh-CN'} 
    />
  </>,
  mountNode,
);
```


### AutoChart Demo

<playground path="components/auto-chart/demo/basic.jsx"></playground>

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/auto-chart/AutoChart)
