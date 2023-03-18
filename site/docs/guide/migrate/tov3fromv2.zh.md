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

