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

The language selection parameter `lang` was originally provided to make it easier for users to switch between languages when creating wiki-like pages using CKB. However, in view of the small number of such requirements, v3 removes this parameter and provides an alternative: an API `ckbDict(lang?)` which is dedicated to obtaining translation cross-references. For CKB usage scenarios with non-English requirements, you can customize your own translations on demand. Contributions to CKB's multilingual/dictionary are also welcome!

The `completed` parameter was originally supplied to exclude imperfect chart types from the CKB. Considering that the chart types are not perfect/complete, they are simply omitted. Contributions to the CKB standard chart types are welcome!

Comply with the stricter naming convention by changing the API name to lower case.

The original customization capabilities for CKB have been integrated into this API. The `ckbCfg` parameter can be configured with `exclude`/ `include`/ `custom` to customize CKB.
