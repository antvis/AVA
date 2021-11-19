# AVA API Reference

## API Documentation

For detailed API documentation, please check [`/docs/api`](./docs/api/index.md) .

## ChartAdvisor

Currently, AVA only exposes the `autoChart()` method under the **ChartAdvisor** module.

### Installation

```shell
npm install @antv/chart-advisor
```

### Example

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

The DOM element of the container the chart is in.

#### data

Data set as an array.

#### options.title

Title of the chart.

#### options.description

Description (as a subtitle) of the chart.

#### options.purpose

Specify the analysis purpose of the chart can increase the accuracy of the chart recommendation.

The values ​​can be:

* Comparison
* Trend
* Distribution
* Rank
* Proportion
* Composition

#### options.toolbar

`true` or `false` - Display the recommended charts switch or not.

#### options.development

`true` or `false` - Display the config button or not.

Default `true` while `NODE_ENV` is `development`.

#### options.theme

`light` or `dark` - Style of charts。

#### options.config

Chart configuration, you can manually specify the chart type and chart configuration, can be copied directly from the configuration panel.

#### options.noDataContent

To render content without data, you need to provide a render and destroy method for user rendering and destruction.

Default as 'no data'.

```typescript
{
  render(container) {
    this.div = document.createElement('div');
    this.div.innerHTML = 'NO DATA';
    this.div.style.textAlign = 'center';
    container.appendChild(this.div);
  },
  destroy(container) {
    container.removeChild(this.div);
  }
}
```
