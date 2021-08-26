---
title: Pipeline
order: 1
---

`markdown:docs/common/style.md`

<div class="doc-md">

The following pipeline shows the whole process from data to the recommended charts. This is the specific process of completing `autoChart`. These functions are convenient to use and can be detached to use.


<img src="https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*SbK0RKmBL4sAAAAAAAAAAAAAARQnAQ" alt="pipeline" width="100%"/>

### Step 1 dataToDataProps 

Analyze and get the data properties of each column of the dataset.

> See also: `type` function in *dw-analyzer*

### Step 2 dataPropsToAdvices 

According to the data properties, recommend charts. The recommended charts are as *Advice* contains specification([vegaLite Spec](https://vega.github.io/vega-lite/docs/spec.html)), currently only supports single layer graphics.

### Step 3 adviceToLibConfig 

From chart specification to configs of some appointed charting library. AVA uses G2Plot as default charting library. In order to provide more flexible configuration capabilities, the libConfig and render steps are separated so that users can make custom configurations based on result config.

### Step 4 g2plotRender or g2Render 

Use the charting library with given configs, render the chart.

> AVA uses G2Plot as default library. G2Plot is based on G2.

</div>
