import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPreviousResults, saveResults } from '../evals/databench.eval.ts';

const directory = mkdtempSync(join(tmpdir(), 'ava-databench-'));
try {
  const source = join(directory, 'predictions.csv');
  const target = join(directory, 'original.csv');
  const destination = join(directory, 'results');
  mkdirSync(destination);
  const header = 'id,predicted_answer,sql,error,model,duration_ms,input_tokens,output_tokens,total_tokens\n';
  const old = header + 'databench:test:1,,,timeout,test,1,,,\n';
  const updated = header + 'databench:test:1,42,,,test,2,3,4,7\n';
  const samples = [{ id: 'databench:test:1', dataset: 'databench' }] as Parameters<typeof saveResults>[1];
  writeFileSync(target, old);
  writeFileSync(source, header);
  saveResults(directory, samples, destination, target);
  assert.equal(readFileSync(target, 'utf8'), old);
  writeFileSync(source, updated);
  assert.equal(loadPreviousResults([source], samples).length, 1);
  assert.throws(() => loadPreviousResults([source, source], samples), /Duplicate/);
  assert.throws(() => loadPreviousResults([source], [], true), /outside retry selection/);
  saveResults(directory, samples, destination, target);
  assert.equal(readFileSync(target, 'utf8'), updated);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log('DataBench replacement checks passed.');
