---
title: autoChart
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

根据数据自动推荐合适的图表，并渲染在指定容器中。

```sign
autoChart(container, data, options);
```

### 参数

* **container** * 图表所需要被放置的 DOM 容器。
  * _必要参数_
  * `参数类型`: HTMLElement

* **data** * 包含对象型数据行的数组.
  * _必要参数_
  * `参数类型`: any[] | Promise<any[]>

* **options** * 自定义选项。
  * _可选参数_
  * `参数类型`: AutoChartOptions

#### options.title

图表标题

#### options.description

图表副标题

`markdown:docs/common/advisor-options.zh.md`

#### options.toolbar

`ture` or `false` 是否显示切换图表的功能

#### options.development

`ture` or `false` 是否是开发模式，开发模式下显示 config 面板，默认 `NODE_ENV` 为 `development` 下即认为是开发模式

#### options.theme

图表主题，现在有两种主题 `light` 和 `dark`, 后续将开发在线创建主题的能力

#### options.config

图表配置，你可以手动指定图表类型，和图表配置，可以直接从配置面板中拷贝出来作为 config 配置

#### options.noDataContent

在没有数据的情况下渲染的内容，你需要提供一个 render 和 destroy 方法来用户渲染和销毁。 默认展示'暂无数据', 示例

```ts
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

### 返回值

*Promise\<AutoChart\>*

### 示例

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

</div>
