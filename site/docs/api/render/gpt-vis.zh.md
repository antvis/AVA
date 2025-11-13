---
title: 使用 GPT-Vis 渲染图表
order: 3
redirect_from:
  - /zh/docs/api/render
---

## Render

`render` 方法是 Advisor 类中用于将图表规范渲染成实际图表 DOM 的接口。

```ts
render(container: string, spec: Spec)
```

### 参数
- `container`：字符串类型，表示图表渲染的目标容器选择器。
- `spec`：`Spec` 类型的对象，表示图表的规范配置。

```ts
interface Spec {
  type: string;
  data: any;
  options: any;
}
```

### 使用场景

在使用 GPT-Vis 进行图表渲染时，可以通过 `render` 方法将生成的图表规范直接渲染到指定的 DOM 容器中。例如：

```ts
const advisor = new Advisor();
const chartSpec = advisor.advise({ data, fields });
advisor.render('#chart', chartSpec);
```

## bindRenderer 函数
`bindRenderer` 函数用于绑定自定义的图表渲染器，以便在 `render` 方法中使用。

```ts
function bindRenderer(renderer: Renderer): void
```

## 使用 GPT-Vis 渲染图表示例

```js
import { Advisor, bindRenderer } from '@antv/ava';
import { render } from '@antv/gpt-vis';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';  

const advisor = new Advisor();
bindRenderer(render);
const chartSpec = advisor.advise({ data, fields });
advisor.render('#chart', chartSpec);  

```

