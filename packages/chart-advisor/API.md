# ChartAdvisor Quick API

## Installation

```shell
npm install @antv/chart-advisor
```

## Demo

```typescript

import { autoChart } from '@antv/chart-advisor';

const data = [{date: '2010/01/01', value: '1234'}, ...]


autoChart(document.getElementById('container'), data);
```

## API

```typescript
autoChart(container, data, options);
```

### options.title

Title of the chart.

### options.description

Subtitle of the chart.

### options.purpose

Specify a analysis purpose for getting better recommendation.

* Comparison 
* Trend
* Distribution
* Rank
* Proportion
* Composition

### options.toobar

Turn on/off chart type switching.

`ture` or `false`

### options.development

Turn on/off develop mode. In develop mode, **config** button shows on toolbar.

Default `true` under `NODE_ENV` environment.

`ture` of `false` 

### options.theme

Theme of the chart styles.

`light` or `dark`

### options.config

Detailed configs of the chart.

### options.noDataContent

To render content without data, you need to provide a `render` and `destroy` method for user rendering and destruction. 

Show *no data UI* by default, example:

```typescript

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
