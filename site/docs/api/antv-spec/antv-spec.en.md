---
title: AntV Spec
order: 0
redirect_from:
  - /en/docs/api/antv-spec
---

## What is a Spec?

In the field of data visualization, **Spec** (short for "Specification") is a core concept. It is an object, usually in JSON format, used to **declaratively define** a chart.

With a Spec, you can precisely describe how a chart should be rendered, including but not limited to:

*   **Chart Type**: For example, whether it's a line chart (`line`), a pie chart (`pie`), or a column chart (`column`).
*   **Data**: The raw data used to generate the chart.
*   **Visual Channels**: How data is mapped to visual elements, such as which field maps to the x-axis and which to the y-axis.
*   **Style and Theme**: The visual style of the chart, including colors, fonts, margins, and background.
*   **Interaction Behavior**: For example, tooltips on hover or click effects on the legend.

You can think of a Spec as a **blueprint for a chart**. You only need to describe "what kind of chart I want," without worrying about the specific underlying drawing details. The rendering engine will automatically draw the chart based on this blueprint.

This declarative definition method has the following advantages:

*   **Easy to Understand and Modify**: The JSON format of a Spec is clearly structured, making it easy to read and modify.
*   **Platform Independent**: The same Spec can be rendered consistently across different platforms (e.g., Web, mobile).
*   **Easy to Store and Transmit**: A Spec is essentially text, which can be easily transmitted over the network or stored in a database.

In AntV, all chart libraries follow a unified Spec standard, which makes it very easy to switch and combine different charts.


