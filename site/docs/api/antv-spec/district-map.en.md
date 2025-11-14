---
title: District Map
order: 5
redirect_from:
  - /zh/docs/api/antv-spec/district-map
---

## Introduction

A district map is used to display the geographical boundaries of a country or region.

## Spec
| Property   | Type                                     | Required | Default   | Description           |
| ---------- | ---------------------------------------- | -------- | --------- | --------------------- |
| data       | DistrictMapDataItem[]                    | Yes      | -         | Data                  |
| title      | string                                   | No       | -         | Chart title           |
| district   | string                                   | Yes      | -         | District code         |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme           |

### DistrictMapDataItem
| Property | Type   | Required | Default | Description    |
| -------- | ------ | -------- | ------- | -------------- |
| name     | string | Yes      | -       | District name  |
| value    | number | Yes      | -       | District value |

## Spec example

```json
{
  "type": "district-map",
  "data": [
    {
      "name": "北京市",
      "value": 100
    },
    {
      "name": "上海市",
      "value": 200
    }
  ],
  "title": "This is a district map",
  "district": "330000"
}
```
