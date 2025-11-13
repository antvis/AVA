---
title: 使用 GPT-Vis 渲染图表
order: 3
redirect_from:
  - /zh/docs/api/render
---

## render

`render` 方法是 Advisor 类中用于将图表规范渲染成实际图表 DOM 的接口。

```ts
render(container: string, spec: Spec)
```

### 参数
- `container`：字符串类型，表示图表渲染的目标容器选择器。
- `spec`：`Spec` 类型的对象，表示图表的规范配置。详见 [Spec 规范](../spec)。


### 使用场景

在使用 GPT-Vis 进行图表渲染时，可以通过 GPTVis 中`render` 方法将生成的图表规范直接渲染到指定的 DOM 容器中。例如：

```ts
import { Advisor, bindRenderer } from '@antv/ava';
import { render } from '@antv/gpt-vis';

bindRenderer(render);
const advisor = new Advisor();
advisor.render('#chart', {type: 'bar', data: [...]});
```

## bindRenderer 函数
`bindRenderer` 函数用于绑定自定义的图表渲染器，以便在 `advisor.render` 方法中调用。

```ts
function bindRenderer(renderer: Renderer): void
```

## 使用 GPT-Vis 渲染图表示例

```js
import { Advisor, bindRenderer } from '@antv/ava';
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

const advisor = new Advisor();
const RenderChart: React.FC = () => {

  useEffect(() => {
    bindRenderer(render as any);
    advisor.render('#chart', chartSpec);  
  }, []);

  return <div id="chart"/>
        
};

export default RenderChart;

```
