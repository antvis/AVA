---
title: Introduction to InsightCard
order: 0
---

<embed src='@/docs/common/style.md'></embed>

InsightCard is a React component that visually displays data insights in a card format with text and graphics.

## ✨ Features

The `InsightCard` component is exposed in `@antv/ava-react` for users to utilize. InsightCard is designed for visualizing data insights in a React component. It combines the core capabilities of the `insight` module in AVA and provides two usage modes: displaying pre-calculated insight results or passing raw data and using the insight module internally to compute and display insights. This component aims to help developers generate and showcase data insights in an out-of-the-box manner.

Guiding principles for displaying insights can be found in the "White Paper". The currently available insight types are shown in the following diagram:

## 📦 Installation

```bash
$ npm install @antv/ava-react
```

## 🔨 Usage

```js
import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';
import { getInsights } from '@antv/ava';

const timeSeriesData = [
  { year: '1991', value: 0.3 },
  { year: '1992', value: -0.5 },
  { year: '1993', value: 0.05 },
  { year: '1994', value: -0.2 },
  { year: '1995', value: 0.4 },
  { year: '1996', value: 6 },
  { year: '1997', value: 3 },
  { year: '1998', value: 9 },
  { year: '1999', value: 5 },
]

const trendInsightData = getInsights(timeSeriesData)?.insights[0];

export default () => {
  return <InsightCard  insightInfo={trendInsightData} />;
}
```

## 📖 API Documentation

For more usage details, please refer to the [official API documentation](../../api/insight-card/api).
