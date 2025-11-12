---
title: AVA 简介
order: 0
redirect_from:
  - /en/docs/guide
---

## Technical Overview

AVA is an intelligent visual analysis framework written in TypeScript. It combines data feature extraction, visualization recommendation, and rendering pipelines to simplify producing visualizations from raw data.

- Tech stack: TypeScript, runs in Node and browser (supports ESM/CJS builds), with the repository providing build and test tooling.
- Core idea: decouple feature extraction, intent inference, and visualization advising into composable modules for extensibility.
- Key modules:
  - `extract`: extracts features and schema from datasets (types, distributions, missing values).
  - `advise` / `advisor`: generates visualization recommendations and mapping suggestions based on rules/models.
  - `render`: rendering pipeline and adapters that convert recommendations to concrete chart configs.
  - `ckb`: chart knowledge base providing templates and best practices.

These modules work together for interactive dashboards, automated chart suggestions, and data exploration scenarios.

## Use Cases

Here are several common scenarios showing how AVA can be used in real projects.

1. Automated chart suggestions (get visualizations quickly)

  - Scenario: A user uploads a table and wants quick visualizations for exploration.
  - Flow: `extract` gets field features, `advisor` produces candidate charts and encodings, and `render` outputs renderable configs.
  - Value: lowers the barrier to creating visualizations and produces interactive chart candidates for iteration.

2. Dashboard recommendations and layout optimization

  - Scenario: Generate multiple views for a dataset in a BI dashboard and optimize layout and semantics.
  - Flow: AVA suggests semantically complementary charts and filters selections according to constraints.
  - Value: speeds up dashboard construction while maintaining consistency and readability.

3. Data exploration and actionable insights

  - Scenario: Analysts exploring data want proactive hints about anomalies, grouping trends, or promising dimension/metric pairs.
  - Flow: Run lightweight rules/models over extracted features to surface insights (anomalies, important dimensions, recommended aggregations).
  - Value: shortens analysis cycles and highlights potentially interesting views.

For examples and integration details, see the `src` modules (`extract`, `advise`, `render`) and associated tests in the repository.

