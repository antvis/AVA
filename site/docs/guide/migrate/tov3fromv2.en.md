---
title: To v3 from v2
order: 8
---

<embed src='@/docs/common/style.md'></embed>

## 从包到模块

All separate non-React npm packages in v2 have been integrated into one npm package `@antv/ava`. The capabilities of the original packages have been integrated into the modules of this general package.

* `@antv/ckb` -> `@antv/ava`
* `@antv/data-wizard` -> `@antv/ava`
* `@antv/chart-advisor` -> `@antv/ava`
* `@antv/lite-insight` -> `@antv/ava`
* `@antv/smart-board` -> Not recommended for further use

### CKB

#### CKBJson

The API of getting CKB object has been simplified.

API:

```js
// v2
CKBJson(lang, completed)

// v3
ckb(ckbCfg?)
```

