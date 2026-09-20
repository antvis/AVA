import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../../src/duckdb';
import { getLLMConfig, skipLLMTests } from '../test-utils';

import datasetJson from './datasets/csv-file.json';

interface EvalCase {
  id: string;
  sourceFile: string;
  question: string;
  expectedRows: unknown[][];
}

const dataset = datasetJson as { split: 'test'; cases: EvalCase[] };
const color = (code: string, value: string) =>
  'NO_COLOR' in process.env ? value : `\u001B[${code}m${value}\u001B[0m`;

function normalizeRows(rows: unknown[][]): string[] {
  return rows
    .map((row) =>
      JSON.stringify(
        row.map((value) =>
          typeof value === 'number' ? Number(value.toFixed(6)) : value
        )
      )
    )
    .sort();
}

describe.skipIf(skipLLMTests || process.env.AVA_QUERY_EVAL !== '1')(
  'query result regression',
  () => {
    it('executes every test-set query without errors', async () => {
      const mismatches: string[] = [];
      const errors: string[] = [];

      for (const testCase of dataset.cases) {
        const engine = new DuckDBEngine(getLLMConfig());
        try {
          await engine.load({
            type: 'csv-file',
            options: {
              path: path.resolve(process.cwd(), testCase.sourceFile),
            },
          });
          const predictedSql = await engine.getDSL(testCase.question);
          const predicted = await engine.execute(predictedSql);

          if (
            JSON.stringify(normalizeRows(predicted.map(Object.values))) !==
            JSON.stringify(normalizeRows(testCase.expectedRows))
          ) {
            mismatches.push(
              `${testCase.id}\n  SQL: ${predictedSql}\n  expected: ${JSON.stringify(testCase.expectedRows)}\n  received: ${JSON.stringify(predicted.map(Object.values))}`
            );
          }
        } catch (error) {
          errors.push(
            `${testCase.id}\n  error: ${error instanceof Error ? error.message : String(error)}`
          );
        } finally {
          await engine.dispose();
        }
      }

      const passed = dataset.cases.length - mismatches.length - errors.length;
      const accuracy = `${passed}/${dataset.cases.length} (${(
        (passed / dataset.cases.length) *
        100
      ).toFixed(1)}%)`;
      process.stdout.write(
        `\nQuery result accuracy: ${color(passed === dataset.cases.length ? '1;32' : '1;33', accuracy)}\n`
      );
      if (mismatches.length > 0) {
        process.stdout.write(
          `${color('1;33', `Warning: ${mismatches.length} result mismatch(es)`)}\n${mismatches.join('\n\n')}\n`
        );
      }
      if (errors.length > 0) {
        process.stderr.write(
          `${color('1;31', `Error: ${errors.length} query execution failure(s)`)}\n${errors.join('\n\n')}\n`
        );
      }
      expect(errors, errors.join('\n\n')).toEqual([]);
    }, 180_000);
  }
);
