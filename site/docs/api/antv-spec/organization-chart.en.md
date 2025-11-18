---
title: Organization Chart
order: 15
redirect_from:
  - /zh/docs/api/antv-spec/organization-chart
---

## Introduction

An organization chart is a diagram that shows the structure of an organization and the relationships and relative ranks of its parts and positions/jobs. It displays the hierarchy of authority, responsibility, and communication within an organization, making it essential for understanding reporting relationships and organizational structure.

## Spec

| Property | Type                    | Required | Default | Description |
| -------- | ----------------------- | -------- | ------- | ----------- |
| type     | `string`                | Yes      | -       | Chart type, fixed to `organization-chart` |
| data     | `OrganizationChartData` | Yes      | -       | Data        |

### OrganizationChartData

| Property    | Type                      | Required | Default | Description                                                                                                                                                                                                              |
| ----------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name        | `string`                  | Yes      | -       | Node name that represents a position or department; must be unique                                                                                                                                                       |
| description | `string`                  | No       | -       | Node description, e.g., job responsibilities or department introduction                                                                                                                                                  |
| children    | `OrganizationChartData[]` | No       | -       | Child nodes representing subordinate positions or departments. If there are no children, this field can be omitted. Each child is also an `OrganizationChartData`, allowing recursive nesting to form a multi-level tree |

## Spec example

```json
{
  "type": "organization-chart",
  "data": {
    "name": "CEO",
    "description": "Chief Executive Officer",
    "children": [
      {
        "name": "CTO",
        "description": "Chief Technology Officer",
        "children": [
          { "name": "Dev Manager", "description": "Development Manager" },
          { "name": "QA Manager", "description": "Quality Assurance Manager" }
        ]
      },
      {
        "name": "CFO",
        "description": "Chief Financial Officer",
        "children": [
          { "name": "Finance Manager", "description": "Finance Manager" },
          { "name": "Accounting Manager", "description": "Accounting Manager" }
        ]
      }
    ]
  }
}
```
