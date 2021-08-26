---
title: 图表推荐细分流程
order: 1
---

`markdown:docs/common/style.md`

<div class="doc-md">

从数据到推荐图表在 AVA 内部主要会经历以下流程，是上一节的 autoChart 图表推荐流程的拆分环节，方便使用着可拆方便使用其中任意环节。

<img src="https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*SbK0RKmBL4sAAAAAAAAAAAAAARQnAQ" alt="pipeline" width="100%"/>

### 步骤 1： dataToDataProps 

从原数据获得数据字段特征分析，包括字段基本信息和可能的字段类型。

字段类型包括 Nominal Ordinal Interval Discrete Continuous Time 六种。

### 步骤 2： dataPropsToAdvices 

根据数据的特征分析结果，推荐图表类型和绘图描述 specification，specification 为 [vegaLite Spec](https://vega.github.io/vega-lite/docs/spec.html)，目前只支持单图层绘图语言。

### 步骤 3： adviceToLibConfig 

specification 到绘图库配置项，AVA 默认输入 G2Plot v2 配置项，为了提供更灵活到配置能力，将 libConfig 和 render 步骤开分开，方便使用者可以在 config 基础上做自定义配置。

### 步骤 4： g2plotRender or g2Render 

输入绘图库配置项 render。

> G2Plot v2 完全基于 G2 封装，所以可以输入 G2Plot 配置，输出 G2Plot 实例或者 G2 实例。

</div>
