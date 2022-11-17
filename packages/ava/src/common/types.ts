import type { AntVSpec, ChartAntVSpec } from '@antv/antv-spec';

/**
 * One row(record) of data in JSON.
 */
export type Datum = Record<string, any>;

/**
 * Rows(records) of data.
 */
export type Data = Datum[];

/**
 * Specification: declarative schema to describe a visualization.
 */
export type Specification = AntVSpec;
export type ChartSpec = ChartAntVSpec;
