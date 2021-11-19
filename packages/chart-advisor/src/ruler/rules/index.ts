// Chart rules (hard and soft)
// table and kpi_panel not include currently
// import { aggregationSingleRow } from './aggregation-single-row';
// import { allCanBeTable } from './all-can-be-table';
import { RuleModule } from '../concepts/rule';
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

export const rules: Record<string, RuleModule> = {
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
