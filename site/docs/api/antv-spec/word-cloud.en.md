---
title: Word Cloud
order: 7
redirect_from:
  - /en/docs/api/antv-spec/word-cloud
---

## Introduction

A word cloud is a visual representation of text data where the size of each word indicates its frequency or importance in the text. Words are typically arranged in a cluster or cloud of words, with more prominent words appearing larger and bolder, making it excellent for quickly identifying key themes and trends in textual data.

## Spec

| Property | Type                                     | Required | Default   | Description |
| -------- | ---------------------------------------- | -------- | --------- | ----------- |
| type     | `string`                                  | Yes      | -         | Chart type, fixed to `word-cloud` |
| data     | WordCloudDataItem[]                      | Yes      | -         | Data        |
| title    | string                                   | No       | -         | Chart title |
| theme    | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme |
| style    | IStyle                                   | No       | -         | Chart style |

### WordCloudDataItem

| Property | Type   | Required | Default | Description |
| -------- | ------ | -------- | ------- | ----------- |
| text     | string | Yes      | -       | Text        |
| value    | number | Yes      | -       | Frequency   |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "word-cloud",
  "data": [
    { "text": "Data Visualization", "value": 100 },
    { "text": "Analytics", "value": 80 },
    { "text": "Machine Learning", "value": 75 },
    { "text": "Statistics", "value": 60 },
    { "text": "Charts", "value": 55 },
    { "text": "Graphs", "value": 50 },
    { "text": "Dashboard", "value": 45 },
    { "text": "Reports", "value": 40 },
    { "text": "Insights", "value": 35 },
    { "text": "Trends", "value": 30 }
  ],
  "title": "Data Science Keywords"
}
```
