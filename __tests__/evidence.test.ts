/**
 * End-to-end test: real AVA pipeline → evidence chain → file export
 *
 * Generated files are written to .tmp/evidence/ and kept after the run.
 */
import * as path from 'path';
import { mkdir, readFile } from 'node:fs/promises';

import { describe, it, expect } from 'vitest';

import { AVA } from '../src';

import { getLLMConfig, skipLLMTests } from './test-utils';

import type { EvidenceChainData } from '../src/util/event';

const companiesCsv = path.join(__dirname, '../data/companies.csv');
const outputDir = path.join(__dirname, '../.tmp/evidence');

describe.skipIf(skipLLMTests)('Evidence chain — full pipeline', () => {
  it('exports evidence as JSON and HTML from a real analyze + visualize run', async () => {
    await mkdir(outputDir, { recursive: true });

    const ava = new AVA({ llm: getLLMConfig() });

    try {
      await ava.source({ type: 'csv-file', options: { path: companiesCsv } });

      const query = 'What is the total revenue by region?';
      const result = await ava.analyze(query, { strategy: { type: 'direct', maxRetries: 1 } });

      let viz = null;
      try {
        viz = await ava.visualize(result);
      } catch {
        // not critical for evidence
      }

      // Export JSON
      const jsonPath = path.join(outputDir, 'companies-revenue.json');
      await ava.exportEvidence(jsonPath);

      // Export HTML
      const htmlPath = path.join(outputDir, 'companies-revenue.html');
      await ava.exportEvidence(htmlPath, { outputFormat: 'html' });

      // ── Verify JSON output ───────────────────────────────
      const evidence: EvidenceChainData = JSON.parse(await readFile(jsonPath, 'utf8'));

      // Layer 1: source
      expect(evidence.source).not.toBeNull();
      expect(evidence.source!.type).toBe('csv-file');
      expect(evidence.source!.options).toHaveProperty('path', companiesCsv);

      // Layer 2: definitions
      expect(evidence.definitions.length).toBeGreaterThanOrEqual(1);
      expect(evidence.definitions[0].dsl.toUpperCase()).toContain('SELECT');

      // Layer 3: executions
      const successExecs = evidence.executions.filter((e) => e.status === 'success');
      expect(successExecs.length).toBeGreaterThanOrEqual(1);
      expect(successExecs[0].exploratory).toBe(false);

      // Layer 4: results
      expect(evidence.results.length).toBeGreaterThanOrEqual(1);
      expect(evidence.results[0].rows.length).toBeGreaterThan(0);

      // Layer 5: presentation
      expect(evidence.presentation).not.toBeNull();
      expect(evidence.presentation!.query).toBe(query);
      expect(evidence.presentation!.text).toBeTruthy();
      if (viz) {
        expect(evidence.presentation!.chartType).toBeTruthy();
      }

      // ── Verify trail file ──────────────────────────────────
      const trailPath = jsonPath.replace(/\.json$/, '.trail.json');
      const trail = JSON.parse(await readFile(trailPath, 'utf8'));
      expect(trail).toBeInstanceOf(Array);
      expect(trail.length).toBeGreaterThanOrEqual(4);

      const phases = new Set(trail.map((r: { phase: string }) => r.phase));
      expect(phases.has('execution')).toBe(true);

      // ── Verify HTML output ────────────────────────────────
      const html = await readFile(htmlPath, 'utf8');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Evidence Chain');
      expect(html).toContain('csv-file');
      expect(html).toContain('SELECT');
      expect(html).toContain(query);
    } finally {
      await ava.dispose();
    }
  }, 120000);
});
