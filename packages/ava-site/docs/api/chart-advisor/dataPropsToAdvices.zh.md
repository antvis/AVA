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
  * `参数类型`: BasicDataPropertyForAdvice[]

`BasicDataPropertyForAdvice` 是 `DataProperty` 的最小子集，能够让 pipeline 更容易从本步骤开始。
```typescript
export interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name: string;
  /** LOM */
  readonly levelOfMeasurements: LOM[];
  /** used for split column xy series */
  readonly samples: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: FieldInfo['recommendation'];
  readonly type: FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
}
```

* **options** * 分析意图和偏好设置
  * _可选参数_
  * `参数类型`: AdvisorOptions ｜ undefined

`markdown:docs/common/advisor-options.zh.md`

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
