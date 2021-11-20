<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文


<h1 align="center">
<b>@antv/auto-chart</b>
</h1>

<div align="center">
一个可以用于自动推荐图表的 React 组件
</div>

<div align="center">
<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*gM2JRbkGETIAAAAAAAAAAAAAARQnAQ' width="480" alt='AutoChart' />
</div>


## 📦 安装

```bash
$ npm install @antv/auto-chart
```

## 🔨 快速开始

```tsx
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

## 📖 文档

更多用法请移步至 [API](https://ava.antv.vision/zh/docs/api/autoChart)。

## 📄 许可证

MIT
