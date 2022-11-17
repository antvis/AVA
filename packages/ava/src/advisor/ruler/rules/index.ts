// Chart rules (hard and soft)
// table and kpi_panel not include currently
// import { aggregationSingleRow } from './aggregation-single-row';
// import { allCanBeTable } from './all-can-be-table';
import { barSeriesQty } from './bar-series-qty';
import { barWithoutAxisMin } from './bar-without-axis-min';
import { dataCheck } from './data-check';
import { dataFieldQty } from './data-field-qty';
import { diffPieSector } from './diff-pie-sector';
import { landscapeOrPortrait } from './landscape-or-portrait';
import { limitSeries } from './limit-series';
import { lineFieldTimeOrdinal } from './line-field-time-ordinal';
import { noRedundantField } from './no-redundant-field';
import { nominalEnumCombinatorial } from './nominal-enum-combinatorial';
import { purposeCheck } from './purpose-check';
import { seriesQtyLimit } from './series-qty-limit';
// Design rules
import { xAxisLineFading } from './x-axis-line-fading';

import type { RuleModule } from '../type';

/**
 * @public
 */
export const CHART_RULE_ID = [
  'data-check',
  'data-field-qty',
  'no-redundant-field',
  'purpose-check',
  'series-qty-limit',
  'bar-series-qty',
  'bar-without-axis-min',
  'line-field-time-ordinal',
  'landscape-or-portrait',
  'diff-pie-sector',
  'nominal-enum-combinatorial',
  'limit-series',
  'aggregation-single-row',
  'all-can-be-table',
] as const;

/**
 * @public
 */
export type ChartRuleID = typeof CHART_RULE_ID[number];

/**
 * @public
 */
export const CHART_DESIGN_RULE_ID = ['x-axis-line-fading'] as const;

/**
 * @public
 */
export type ChartDesignRuleID = typeof CHART_DESIGN_RULE_ID[number];

export type RuleId = ChartRuleID | ChartDesignRuleID;

export const rules: Partial<Record<RuleId, RuleModule>> = {
  // table and kpi_panel not include currently
  // 'aggregation-single-row': aggregationSingleRow,
  // 'all-can-be-table': allCanBeTable,
  'bar-series-qty': barSeriesQty,
  'bar-without-axis-min': barWithoutAxisMin,
  'data-check': dataCheck,
  'data-field-qty': dataFieldQty,
  'diff-pie-sector': diffPieSector,
  'landscape-or-portrait': landscapeOrPortrait,
  'limit-series': limitSeries,
  'line-field-time-ordinal': lineFieldTimeOrdinal,
  'no-redundant-field': noRedundantField,
  'nominal-enum-combinatorial': nominalEnumCombinatorial,
  'purpose-check': purposeCheck,
  'series-qty-limit': seriesQtyLimit,
  'x-axis-line-fading': xAxisLineFading,
};
