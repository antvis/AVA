# AVA 接口文档

## 完整接口文档

如果想查看完整的接口文档，请点击这里 [`/docs/api`](./../docs/api/index.md).

## ChartAdvisor

AVA 目前暂时只透出 **ChartAdvisor** 模块下的 `autoChart()` 方法。

### 安装

```shell
npm install @antv/chart-advisor
```

### 示例

```typescript

import { autoChart } from '@antv/chart-advisor';

const container = document.getElementById('mountNode');

const data = [
  {date: '2020/01/01', value: '666'},
  {date: '2020/01/02', value: '888'},
  ...
];


autoChart(container, data);
```

### API

```typescript
autoChart(container, data, options);
```

#### container

图表所在容器的 DOM 元素。

#### data

数组形式的数据集。

#### options.title

图表标题。

#### options.description

图表副标题。

#### options.purpose

指定图表的分析目的，增加图表推荐的准确度，可以为以下这些值：

* Comparison -- 比较
* Trend -- 趋势
* Distribution -- 分布
* Rank -- 排行
* Proportion -- 比例
* Composition -- 组成

#### options.toolbar

`true` 或 `false` 是否显示切换图表的功能。

#### options.development

`true` 或 `false` 是否是开发模式，开始模式下显示 config 面板，默认 `NODE_ENV` 为 `development` 下即认为是开发模式。

#### options.theme

图表主题，现在有两种主题 `light` 和 `dark`, 后续将开发在线创建主题的能力。

#### options.config

图表配置，你可以手动指定图表类型，和图表配置，可以直接从配置面板中拷贝出来作为 config 配置。

#### options.noDataContent

在没有数据的情况下渲染的内容，你需要提供一个 render 和 destroy 方法来用户渲染和销毁。 默认展示'暂无数据', 示例：

```typescript
{
  render(container) {
    this.div = document.createElement('div');
    this.div.innerHTML = '数据为空';
    this.div.style.textAlign = 'center';
    container.appendChild(this.div);
  },
  destroy(container) {
    container.removeChild(this.div);
  }
}
```
