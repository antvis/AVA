---
title: GPT-Vis
order: 3
redirect_from:
  - /zh/docs/api/render
---

## render

The `render` method is an interface in the AVA class used to render chart specifications into actual chart DOM elements.

```ts
render(container: string, spec: Spec)
```

### Parameters
- `container`: A string type representing the target container selector for chart rendering.
- `spec`: A `Spec` type object representing the chart specification configuration. See [Spec Specification](../spec) for details.


### Use Cases

When using GPT-Vis for chart rendering, you can use the `render` method in GPTVis to directly render the generated chart specification into a specified DOM container. For example:

```ts
import { AVA, bindRenderer } from '@antv/ava';
import { render } from '@antv/gpt-vis';

bindRenderer(render);
const ava = new AVA();
ava.render('#chart', {type: 'bar', data: [...]});
```

## bindRenderer Function
The `bindRenderer` function is used to bind a custom chart renderer for invocation in the `ava.render` method.

```ts
function bindRenderer(renderer: Renderer): void
```

## Example of Rendering Charts with GPT-Vis

```js
import { AVA, bindRenderer } from '@antv/ava';
import { render } from '@antv/gpt-vis';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';  

const chartSpec =  {
  type: 'column',
  data: [
    { category: '2013', value: 59.3 },
    { category: '2014', value: 64.4 },
    { category: '2015', value: 68.9 },
    { category: '2016', value: 74.4 },
    { category: '2017', value: 82.7 },
    { category: '2018', value: 91.9 },
    { category: '2019', value: 99.1 },
    { category: '2020', value: 101.6 },
    { category: '2021', value: 114.4 },
    { category: '2022', value: 121 },
  ],
  axisXTitle: 'year',
  axisYTitle: 'GDP',
};

const ava = new AVA();
const RenderChart = () => {

  useEffect(() => {
    bindRenderer(render);
    ava.render('#chart', chartSpec);  
  }, []);

  return <div id="chart"/>
        
};

export default RenderChart;

```

