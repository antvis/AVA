import { G2ChartSpec } from '@ava/advisor/types';

export * from './insight';
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
export type Specification = G2ChartSpec;
export type ChartSpec = G2ChartSpec;
