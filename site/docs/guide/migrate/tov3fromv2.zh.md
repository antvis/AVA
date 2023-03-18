---
title: 从 v2 升级到 v3
order: 8
---

<embed src='@/docs/common/style.md'></embed>

## 从包到模块

所有 v2 版本中非 React 组件的独立 npm 包都整合到了一个 npm 包 `@antv/ava` 中。原各包的能力整合到总包的各模块中。

* `@antv/ckb` -> `@antv/ava`
* `@antv/data-wizard` -> `@antv/ava`
* `@antv/chart-advisor` -> `@antv/ava`
* `@antv/lite-insight` -> `@antv/ava`
* `@antv/smart-board` -> 不再推荐使用

### CKB

#### CKBJson

对 CKB 的调用方法进行了简化。

API:

```js
// v2
CKBJson(lang, completed)

// v3
ckb(ckbCfg?)
```

原先提供的语言选择参数 `lang` 是为了方便用户直接使用 CKB 制作图表知识类页面时可以方便地整体切换语言。但是考虑到这类需求不多，v3 直接去掉了这个参数，并提供了替代方案：另一个专门获取翻译对照表的 API [`ckbDict(lang?)`](../../api/ckb/ckbDict)。 对于有非英语需求的 CKB 使用场景，可以按需自行定制翻译。也欢迎对 CKB 的多语言、词典进行贡献！

原先提供的 `completed` 参数是用来剔除 CKB 中未完善的图表类型。考虑到既然图表类型不完善，就干脆不透出了。欢迎对 CKB 的标准图表类型进行贡献！

遵从更严格的命名规范，将 API 名称改成小写。

原先对于 CKB 的定制能力被集成到这个 API 中来了。`ckbCfg` 参数中可以配置 `exclude`/`include`/`custom` 三种针对图表类型的自定义方式。

#### CKBOptions

`CKBOptions` 方法正式弃用。改为直接使用 CKB 提供的[常量](../../api/ckb/constants)。

API:

```js
// v2
import { CKBOptions } from '@antv/ckb';
CKBOptions().family

// v3
import { FAMILIES } from '@antv/ava'
```

#### addChart

`addChart` 方法正式弃用。改为使用 `ckb` 并通过 `ckbCfg.custom` 参数属性来添加自定义图表。

API:

```js
// v2
addChart(
  neo_diagram,
  { 'zh-CN': neo_diagram_trans }
);

// v3
const myCkb = ckb({
  custom: {
    neo_diagram: neoDiagram,
  },
});
```
