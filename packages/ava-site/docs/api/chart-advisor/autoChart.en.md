---
title: autoChart
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

Recommand appropriate charts for your data and generate it for you.

```sign
autoChart(container, data, options);
```

### Arguments

* **container** * DOM where your chart will be drawn.
  * _required_
  * `type`: HTMLElement

* **data** * Row data array.
  * _required_
  * `type`: any[] | Promise<any[]>

* **options** * Options.
  * _optional_
  * `type`: AutoChartOptions

#### options.title

Title of the chart.

#### options.description

Subtitle of the chart.

`markdown:docs/common/advisor-options.en.md`

#### options.toolbar

Turn on/off chart type switching.

`ture` or `false`

#### options.development

Turn on/off develop mode. In develop mode, **config** button shows on toolbar.

Default `true` under `NODE_ENV` environment.

`ture` or `false` 

#### options.theme

Theme of the chart styles.

`light` or `dark`

#### options.config

Detailed configs of the chart.

#### options.noDataContent

To render content without data, you need to provide a `render` and `destroy` method for user rendering and destruction. 

Show *no data UI* by default, example:

```ts

{
  render(container) {
    this.div = document.createElement('div');
    this.div.innerHTML = 'NO Data';
    this.div.style.textAlign = 'center';
    container.appendChild(this.div);
  },
  destroy(container) {
    container.removeChild(this.div);
  }
}
```

#### options.language

User interface language, support `en-US` and `zh-CN`. If this option is undefined, the navigator language is used by default.

### Returns

*Promise\<AutoChart\>*

### Examples

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
