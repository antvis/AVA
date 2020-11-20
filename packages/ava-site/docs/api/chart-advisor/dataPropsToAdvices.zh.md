---
title: dataPropsToAdvices
order: 2
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
dataPropsToAdvices(dataProps: DataProperty[], options?: AdvisorOptions | undefined)
```

### 参数

* **dataProps** * 数据列的特征和性质
  * _必要参数_
  * `参数类型`: DataProperty[]

* **options** * 分析意图和偏好设置
  * _可选参数_
  * `参数类型`: AdvisorOptions ｜ undefined


### 返回值

*`Advice[]`*

```sign
interface Advice {
  type: ChartID;
  spec: Specification | null;
  score: number;
}
```

* type `ChartID` 推荐的图表类型，对应 CKB 中的 ChartID
* score `number` 推荐得分
* spec `VegaLiteSpec` vegaLite specification

</div>
